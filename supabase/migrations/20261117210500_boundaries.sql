begin;

-- Keep legacy rows readable, but apply the length bound even when a new post has an image.
alter table public.community_posts drop constraint community_posts_content_or_image;
alter table public.community_posts add constraint community_posts_content_or_image check (
  char_length(content) <= 3000 and (
    char_length(btrim(content)) > 0
    or nullif(btrim(coalesce(image_url, '')), '') is not null
    or nullif(btrim(coalesce(image_path, '')), '') is not null
  )
) not valid;
alter table public.community_post_comments drop constraint community_post_comments_content;
alter table public.community_post_comments add constraint community_post_comments_content check (
  char_length(content) <= 1000 and char_length(btrim(content)) > 0
) not valid;

-- Transaction records are read-only in this app. This is not a payment or contract editor.
revoke insert, update, delete on public.contracts, public.payments from authenticated;
-- A proposal submission must not assign its own approval state or job ownership.
revoke insert, update, delete on public.proposals from authenticated;
grant insert (id, job_id, submitted_by, cover_letter, milestones, total_quote, delivery_time,
              proposed_amount, estimated_duration, ai_drafted) on public.proposals to authenticated;
-- Preserve server-assigned engagement times and identities.
revoke insert, update on public.community_posts, public.community_post_comments, public.community_post_likes from authenticated;
grant insert (id, user_id, content, image_url, image_path) on public.community_posts to authenticated;
grant update (content, image_url, image_path) on public.community_posts to authenticated;
grant insert (id, post_id, user_id, content) on public.community_post_comments to authenticated;
grant insert (post_id, user_id) on public.community_post_likes to authenticated;

create index proposals_owner_created_idx on public.proposals (job_owner_id, created_at desc, id desc);
create index contracts_owner_created_idx on public.contracts (business_id, created_at desc, id desc);
create index payments_owner_created_idx on public.payments (business_id, created_at desc, id desc);

commit;
