# Local database

The canonical schema is the ordered SQL in `supabase/migrations/`, including the canonical schema and boundary-hardening migration. The older `database/*.sql` files are historical reference only; do not apply them after the canonical migration.

## Local-only reset and fixtures

Use the repository's pinned Supabase CLI (`3.2.0`) and a running Docker daemon. This workflow never needs hosted Supabase credentials.

```bash
npx supabase start
npx supabase db reset --local
node scripts/seed-local.mjs
node scripts/test-database.mjs
```

`supabase db reset --local` is destructive to the local Docker database only. Do not use it to adopt this schema on an existing hosted installation.

The seed creates only synthetic local fixtures:

| Role | Email | Password |
| --- | --- | --- |
| Student A | `student-a@nexawork.test` | `NexaworkDemo123!` |
| Student B | `student-b@nexawork.test` | `NexaworkDemo123!` |
| Business | `business@nexawork.test` | `NexaworkDemo123!` |

The scripts discover local `API_URL` and `ANON_KEY` through `supabase status -o json`. Explicit API_URL/ANON_KEY overrides must still target localhost. They do not use or print service-role keys.

## Canonical contracts

- `profiles` is keyed by `auth.users.id`. An auth trigger creates a role (`student` or `business`) once from signup metadata `{ role, name }`. It never derives a public name from an email address.
- `bootstrap_profile(chosen_role, display_name)` is a controlled, authenticated fallback for legacy accounts that lack a profile. It creates once, accepts only the two supported roles, and requires a 1–100 character display name.
- Profile rows are owner-readable. Normal clients may update only explicitly editable profile columns; role, badges, verification flags, and rating counters are not granted for update.
- Feed tables are `community_posts`, `community_post_likes`, and `community_post_comments`. They are student-only under RLS. Client-generated UUIDs are accepted for posts/comments so retrying a draft can keep its ID.
- `feed_page(before_created_at, before_id, page_size)` returns JSON `{items,next_cursor}` in descending `(created_at,id)` order, with a 20 default/50 maximum. Items include `like_count`, `comment_count`, `liked_by_me`, and only the minimal author projection `{id,name,username,profile_image_url}`.
- `comment_page(post_id, after_created_at, after_id, page_size)` returns the same outer shape in chronological `(created_at,id)` order. Both cursor parameters must be supplied together.
- `like_post(p_post_id)` and `unlike_post(p_post_id)` are authenticated student RPCs. They are idempotent and unlike only the caller's row.
- `browse_students(page_size)` is business-only, maximum 100 rows, and returns an intentionally limited student projection. It excludes resumes, contact data, badges, and verification/rating fields.
- `award_practice_badge(quiz_id)` permits only existing practice IDs (`figma`, `nextjs`) and appends a badge atomically once. It represents client-scored practice completion, not independently verified certification.
- `profile-images` and `community-images` are public buckets because image URLs are displayed publicly. New writes must use `<user-id>/<generated-id>.<extension>` and are limited to 5 MiB JPEG, PNG, GIF, or WebP files. Old public URL values remain readable as legacy data.

The fresh schema also retains `projects`, `jobs`, `proposals`, `contracts`, `payments`, and `quiz_results` with owner/party RLS required by current application paths. Contracts and payments are read-only to normal clients. Proposals cannot assign approval state or ownership. Feed inserts cannot override server timestamps. Open jobs remain discoverable; dashboard queries additionally filter by owner. It introduces no payment processor or job workflow.

## Existing-installation adoption is manual

Back up first. This migration is designed and tested for a fresh local reset, not an in-place hosted conversion. Before considering an existing installation, run these read-only checks in its SQL editor and stop if IDs/types, foreign keys, or broad/unexplained policies differ. Do not drop or convert live data to make these checks pass.

```sql
-- Required tables and key column types.
select table_name, column_name, data_type, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'profiles', 'projects', 'jobs', 'proposals', 'contracts', 'payments',
    'quiz_results', 'community_posts', 'community_post_likes', 'community_post_comments'
  )
order by table_name, ordinal_position;

-- UUID identity and foreign-key targets must be understood before migration.
select tc.table_name, kcu.column_name, ccu.table_schema as foreign_schema,
       ccu.table_name as foreign_table, ccu.column_name as foreign_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.column_name;

-- Review every policy; unexpected permissive overlap is a stop condition.
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;

-- Preserve unrelated auth triggers and identify public-table triggers before changes.
select event_object_schema, event_object_table, trigger_name, action_timing,
       event_manipulation, action_statement
from information_schema.triggers
where event_object_schema in ('auth', 'public')
order by event_object_schema, event_object_table, trigger_name;

-- Buckets and legacy objects must be inventoried before policy reconciliation.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id in ('profile-images', 'community-images');

-- Resolve orphaned engagement and duplicate IDs before adding foreign keys/unique keys.
select 'likes_without_post' as check_name, count(*)
from public.community_post_likes l left join public.community_posts p on p.id = l.post_id
where p.id is null
union all
select 'comments_without_post', count(*)
from public.community_post_comments c left join public.community_posts p on p.id = c.post_id
where p.id is null
union all
select 'duplicate_like_pairs', count(*)
from (
  select post_id, user_id from public.community_post_likes group by post_id, user_id having count(*) > 1
) duplicates;
```

Oversized legacy post text is deliberately not retroactively scanned by the `NOT VALID` content constraints. It remains readable; new or changed feed content must meet the current limits. Preserve a representative legacy post, legacy `image_url`, project, job, proposal, and profile during any separately planned adoption rehearsal, then verify each still reads before and after the change. The local integration script validates the fresh-schema compatibility paths; it is not a substitute for a backed-up production migration rehearsal.


## Review boundary migration

The review migration checks new community image paths against existing owned bucket objects and derives their display URLs in the app. It does not validate or rewrite unchanged legacy URLs. Storage policy prevents removal while a post references its image. Normal callers cannot execute restricted RPCs anonymously or append null practice badge IDs. The integration fixture temporarily disables the new image trigger only inside a local administrative transaction to model pre-existing legacy rows.

A nullable, trigger-owned storage-object foreign key serializes new image references against deletion. The constraint preserves pre-existing unresolved paths without pretending to repair missing legacy objects. The concurrent integration test uses two local administrative sessions and the storage service's transaction-local deletion permission to verify that an in-flight publication prevents object deletion. Normal application callers cannot set that permission or the protected reference column.
