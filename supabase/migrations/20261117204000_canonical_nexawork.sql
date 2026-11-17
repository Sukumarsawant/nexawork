begin;

create schema if not exists private;
revoke all on schema private from public;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'student' check (role in ('student', 'business')),
  name text not null default '',
  username text,
  profile_image_url text,
  bio text,
  tagline text,
  about text,
  location text,
  timezone text,
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  portfolio_links jsonb not null default '{}'::jsonb,
  availability_hours_per_week integer,
  availability_status text,
  hourly_rate numeric(12,2),
  preferred_pricing text,
  resume_url text,
  education jsonb not null default '{}'::jsonb,
  certifications jsonb not null default '{}'::jsonb,
  achievements jsonb not null default '{}'::jsonb,
  badges text[] not null default '{}',
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  id_verified boolean not null default false,
  payment_verified boolean not null default false,
  avg_rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  last_active timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index profiles_role_name_idx on public.profiles (role, name);
create index profiles_skills_idx on public.profiles using gin (skills);

create or replace function private.has_role(expected_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = expected_role
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_role text := coalesce(new.raw_user_meta_data ->> 'role', 'student');
  display_name text := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'name', '')), '');
begin
  if selected_role not in ('student', 'business') then
    selected_role := 'student';
  end if;

  insert into public.profiles (id, role, name)
  values (new.id, selected_role, coalesce(display_name, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.bootstrap_profile(chosen_role text, display_name text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  cleaned_name text := btrim(coalesce(display_name, ''));
  result public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;
  if chosen_role not in ('student', 'business') then
    raise exception 'Choose student or business' using errcode = '22023';
  end if;
  if char_length(cleaned_name) not between 1 and 100 then
    raise exception 'Display name must be 1 to 100 characters' using errcode = '22023';
  end if;

  insert into public.profiles (id, role, name)
  values (auth.uid(), chosen_role, cleaned_name)
  on conflict (id) do nothing
  returning * into result;

  if not found then
    raise exception 'A profile already exists for this account' using errcode = '23505';
  end if;

  return to_jsonb(result);
end;
$$;

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(255) not null,
  description text,
  technologies text[] not null default '{}',
  project_url varchar(500),
  github_url varchar(500),
  duration varchar(100),
  role varchar(100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index projects_user_created_idx on public.projects (user_id, created_at desc);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  company_name text,
  company_url text,
  location text,
  salary_min numeric(12,2),
  salary_max numeric(12,2),
  salary numeric(12,2),
  employment_type text,
  seniority_level text,
  job_function text,
  industries_sector text,
  job_url text,
  poster_profile_url text,
  company_id text,
  apply_url text,
  apply_type text,
  sbenefits text,
  posted_by uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'closed', 'draft', 'expired')),
  applications_count integer not null default 0,
  posted_time timestamptz not null default timezone('utc', now()),
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index jobs_open_created_idx on public.jobs (created_at desc) where status = 'open';
create index jobs_owner_created_idx on public.jobs (posted_by, created_at desc);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  job_owner_id uuid references public.profiles(id) on delete cascade,
  cover_letter text,
  milestones jsonb,
  total_quote numeric(12,2),
  delivery_time integer,
  proposed_amount numeric(12,2),
  estimated_duration integer,
  ai_drafted boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index proposals_submitter_created_idx on public.proposals (submitted_by, created_at desc);
create index proposals_job_idx on public.proposals (job_id);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.jobs(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  business_id uuid references public.profiles(id) on delete cascade,
  proposal_id uuid references public.proposals(id) on delete set null,
  title text not null,
  description text,
  budget numeric(12,2) not null,
  due_date date not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled', 'on_hold')),
  milestones jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index contracts_parties_idx on public.contracts (business_id, student_id);

create or replace function public.set_proposal_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.student_id := coalesce(new.student_id, new.submitted_by);
  select posted_by into new.job_owner_id
  from public.jobs
  where id = new.job_id;
  if new.job_owner_id is null then
    raise exception 'Job does not exist' using errcode = '23503';
  end if;
  return new;
end;
$$;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid references public.contracts(id) on delete cascade,
  business_id uuid references public.profiles(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_type text not null default 'escrow' check (payment_type in ('escrow', 'direct', 'milestone')),
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  transaction_id text,
  payment_date timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index payments_contract_idx on public.payments (contract_id);

create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id text not null,
  score integer not null,
  total_questions integer not null,
  answers jsonb not null,
  passed boolean not null,
  completed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);
create index quiz_results_user_quiz_idx on public.quiz_results (user_id, quiz_id);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  image_url text,
  image_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint community_posts_content_or_image check (
    (char_length(btrim(content)) between 1 and 3000)
    or nullif(btrim(coalesce(image_url, '')), '') is not null
    or nullif(btrim(coalesce(image_path, '')), '') is not null
  ) not valid
);
create index community_posts_feed_idx on public.community_posts (created_at desc, id desc);

create table public.community_post_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (post_id, user_id)
);
create index community_post_likes_post_idx on public.community_post_likes (post_id);

create table public.community_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint community_post_comments_content check (char_length(btrim(content)) between 1 and 1000) not valid
);
create index community_post_comments_page_idx on public.community_post_comments (post_id, created_at, id);

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects
  for each row execute procedure public.set_updated_at();
create trigger jobs_set_updated_at before update on public.jobs
  for each row execute procedure public.set_updated_at();
create trigger proposals_set_updated_at before update on public.proposals
  for each row execute procedure public.set_updated_at();
create trigger proposals_set_ownership before insert or update of job_id, submitted_by on public.proposals
  for each row execute procedure public.set_proposal_ownership();
create trigger contracts_set_updated_at before update on public.contracts
  for each row execute procedure public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments
  for each row execute procedure public.set_updated_at();
create trigger community_posts_set_updated_at before update on public.community_posts
  for each row execute procedure public.set_updated_at();
create trigger community_post_comments_set_updated_at before update on public.community_post_comments
  for each row execute procedure public.set_updated_at();

create or replace function public.feed_page(
  before_created_at timestamptz default null,
  before_id uuid default null,
  page_size integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_size integer := coalesce(page_size, 20);
begin
  if not private.has_role('student') then
    raise exception 'Student access is required' using errcode = '42501';
  end if;
  if requested_size < 1 or requested_size > 50 then
    raise exception 'page_size must be between 1 and 50' using errcode = '22023';
  end if;
  if (before_created_at is null) <> (before_id is null) then
    raise exception 'before_created_at and before_id must be supplied together' using errcode = '22023';
  end if;

  return (
    with raw as (
      select p.*
      from public.community_posts p
      where before_created_at is null
        or (p.created_at, p.id) < (before_created_at, before_id)
      order by p.created_at desc, p.id desc
      limit requested_size + 1
    ), visible as (
      select * from raw order by created_at desc, id desc limit requested_size
    )
    select jsonb_build_object(
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', p.id,
          'user_id', p.user_id,
          'content', p.content,
          'image_url', p.image_url,
          'image_path', p.image_path,
          'created_at', p.created_at,
          'author', jsonb_build_object(
            'id', profile.id,
            'name', profile.name,
            'username', profile.username,
            'profile_image_url', profile.profile_image_url
          ),
          'like_count', (select count(*) from public.community_post_likes likes where likes.post_id = p.id),
          'comment_count', (select count(*) from public.community_post_comments comments where comments.post_id = p.id),
          'liked_by_me', exists (
            select 1 from public.community_post_likes mine
            where mine.post_id = p.id and mine.user_id = auth.uid()
          )
        ) order by p.created_at desc, p.id desc)
        from visible p
        join public.profiles profile on profile.id = p.user_id
      ), '[]'::jsonb),
      'next_cursor', case when (select count(*) from raw) > requested_size then (
        select jsonb_build_object('created_at', p.created_at, 'id', p.id)
        from visible p
        order by p.created_at asc, p.id asc
        limit 1
      ) else null end
    )
  );
end;
$$;

create or replace function public.comment_page(
  post_id uuid,
  after_created_at timestamptz default null,
  after_id uuid default null,
  page_size integer default 20
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_size integer := coalesce(page_size, 20);
begin
  if not private.has_role('student') then
    raise exception 'Student access is required' using errcode = '42501';
  end if;
  if post_id is null or not exists (select 1 from public.community_posts where id = post_id) then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;
  if requested_size < 1 or requested_size > 50 then
    raise exception 'page_size must be between 1 and 50' using errcode = '22023';
  end if;
  if (after_created_at is null) <> (after_id is null) then
    raise exception 'after_created_at and after_id must be supplied together' using errcode = '22023';
  end if;

  return (
    with raw as (
      select c.*
      from public.community_post_comments c
      where c.post_id = comment_page.post_id
        and (after_created_at is null or (c.created_at, c.id) > (after_created_at, after_id))
      order by c.created_at asc, c.id asc
      limit requested_size + 1
    ), visible as (
      select * from raw order by created_at asc, id asc limit requested_size
    )
    select jsonb_build_object(
      'items', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c.id,
          'post_id', c.post_id,
          'user_id', c.user_id,
          'content', c.content,
          'created_at', c.created_at,
          'author', jsonb_build_object(
            'id', profile.id,
            'name', profile.name,
            'username', profile.username,
            'profile_image_url', profile.profile_image_url
          )
        ) order by c.created_at asc, c.id asc)
        from visible c
        join public.profiles profile on profile.id = c.user_id
      ), '[]'::jsonb),
      'next_cursor', case when (select count(*) from raw) > requested_size then (
        select jsonb_build_object('created_at', c.created_at, 'id', c.id)
        from visible c
        order by c.created_at desc, c.id desc
        limit 1
      ) else null end
    )
  );
end;
$$;

create or replace function public.like_post(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('student') then
    raise exception 'Student access is required' using errcode = '42501';
  end if;
  if not exists (select 1 from public.community_posts where id = p_post_id) then
    raise exception 'Post not found' using errcode = 'P0002';
  end if;
  insert into public.community_post_likes (post_id, user_id)
  values (p_post_id, auth.uid())
  on conflict (post_id, user_id) do nothing;
  return jsonb_build_object('post_id', p_post_id, 'liked', true);
end;
$$;

create or replace function public.unlike_post(p_post_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_role('student') then
    raise exception 'Student access is required' using errcode = '42501';
  end if;
  delete from public.community_post_likes
  where post_id = p_post_id and user_id = auth.uid();
  return jsonb_build_object('post_id', p_post_id, 'liked', false);
end;
$$;

create or replace function public.browse_students(page_size integer default 100)
returns table (
  id uuid,
  name text,
  username text,
  profile_image_url text,
  bio text,
  tagline text,
  location text,
  availability_status text,
  skills text[],
  portfolio_links jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_size integer := coalesce(page_size, 100);
begin
  if not private.has_role('business') then
    raise exception 'Business access is required' using errcode = '42501';
  end if;
  if requested_size < 1 or requested_size > 100 then
    raise exception 'page_size must be between 1 and 100' using errcode = '22023';
  end if;

  return query
  select p.id, p.name, p.username, p.profile_image_url, p.bio, p.tagline,
    p.location, p.availability_status, p.skills, p.portfolio_links
  from public.profiles p
  where p.role = 'student' and p.id <> auth.uid()
  order by p.name asc, p.id asc
  limit requested_size;
end;
$$;

create or replace function public.award_practice_badge(quiz_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  updated_badges text[];
begin
  if not private.has_role('student') then
    raise exception 'Student access is required' using errcode = '42501';
  end if;
  if quiz_id not in ('figma', 'nextjs') then
    raise exception 'This practice quiz cannot award a badge' using errcode = '22023';
  end if;

  update public.profiles
  set badges = array_append(badges, quiz_id)
  where id = auth.uid() and not (quiz_id = any(badges))
  returning badges into updated_badges;

  if updated_badges is null then
    select badges into updated_badges from public.profiles where id = auth.uid();
  end if;
  return jsonb_build_object('quiz_id', quiz_id, 'badges', updated_badges, 'awarded', quiz_id = any(updated_badges));
end;
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.jobs enable row level security;
alter table public.proposals enable row level security;
alter table public.contracts enable row level security;
alter table public.payments enable row level security;
alter table public.quiz_results enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_post_likes enable row level security;
alter table public.community_post_comments enable row level security;

create policy profiles_owner_select on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_owner_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy projects_owner_all on public.projects for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy jobs_visible_to_authenticated on public.jobs for select to authenticated using (status = 'open' or posted_by = auth.uid());
create policy jobs_business_owner_insert on public.jobs for insert to authenticated with check (posted_by = auth.uid() and private.has_role('business'));
create policy jobs_owner_update on public.jobs for update to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());
create policy jobs_owner_delete on public.jobs for delete to authenticated using (posted_by = auth.uid());
create policy proposals_parties_select on public.proposals for select to authenticated using (
  submitted_by = auth.uid()
  or exists (select 1 from public.jobs where jobs.id = proposals.job_id and jobs.posted_by = auth.uid())
);
create policy proposals_student_insert on public.proposals for insert to authenticated with check (submitted_by = auth.uid() and private.has_role('student'));
create policy proposals_parties_update on public.proposals for update to authenticated using (submitted_by = auth.uid() or job_owner_id = auth.uid()) with check (submitted_by = auth.uid() or job_owner_id = auth.uid());
create policy contracts_parties_all on public.contracts for all to authenticated using (auth.uid() in (student_id, business_id)) with check (auth.uid() in (student_id, business_id));
create policy payments_parties_all on public.payments for all to authenticated using (auth.uid() in (student_id, business_id)) with check (auth.uid() in (student_id, business_id));
create policy quiz_results_owner_all on public.quiz_results for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy community_posts_students_select on public.community_posts for select to authenticated using (private.has_role('student'));
create policy community_posts_students_insert on public.community_posts for insert to authenticated with check (private.has_role('student') and user_id = auth.uid());
create policy community_posts_owner_update on public.community_posts for update to authenticated using (private.has_role('student') and user_id = auth.uid()) with check (private.has_role('student') and user_id = auth.uid());
create policy community_posts_owner_delete on public.community_posts for delete to authenticated using (private.has_role('student') and user_id = auth.uid());
create policy community_likes_students_select on public.community_post_likes for select to authenticated using (private.has_role('student'));
create policy community_likes_students_insert on public.community_post_likes for insert to authenticated with check (private.has_role('student') and user_id = auth.uid());
create policy community_likes_owner_delete on public.community_post_likes for delete to authenticated using (private.has_role('student') and user_id = auth.uid());
create policy community_comments_students_select on public.community_post_comments for select to authenticated using (private.has_role('student'));
create policy community_comments_students_insert on public.community_post_comments for insert to authenticated with check (private.has_role('student') and user_id = auth.uid());
create policy community_comments_owner_delete on public.community_post_comments for delete to authenticated using (private.has_role('student') and user_id = auth.uid());

revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
grant select on public.profiles to authenticated;
grant update (name, username, profile_image_url, bio, tagline, about, location, timezone, skills, languages, portfolio_links, availability_hours_per_week, availability_status, hourly_rate, preferred_pricing, resume_url, education, certifications, achievements, last_active) on public.profiles to authenticated;
grant select, insert, update, delete on public.projects, public.jobs, public.proposals, public.contracts, public.payments, public.quiz_results, public.community_posts, public.community_post_likes, public.community_post_comments to authenticated;

revoke all on function public.bootstrap_profile(text, text) from public;
revoke all on function public.feed_page(timestamptz, uuid, integer) from public;
revoke all on function public.comment_page(uuid, timestamptz, uuid, integer) from public;
revoke all on function public.like_post(uuid) from public;
revoke all on function public.unlike_post(uuid) from public;
revoke all on function public.browse_students(integer) from public;
revoke all on function public.award_practice_badge(text) from public;
grant execute on function public.bootstrap_profile(text, text), public.feed_page(timestamptz, uuid, integer), public.comment_page(uuid, timestamptz, uuid, integer), public.like_post(uuid), public.unlike_post(uuid), public.browse_students(integer), public.award_practice_badge(text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-images', 'profile-images', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('community-images', 'community-images', true, 5242880, array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy profile_images_public_read on storage.objects for select using (bucket_id = 'profile-images');
create policy community_images_public_read on storage.objects for select using (bucket_id = 'community-images');
create policy profile_images_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_images_owner_insert on storage.objects for insert to authenticated with check (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy profile_images_owner_update on storage.objects for update to authenticated using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_images_owner_update on storage.objects for update to authenticated using (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy profile_images_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'profile-images' and (storage.foldername(name))[1] = auth.uid()::text);
create policy community_images_owner_delete on storage.objects for delete to authenticated using (bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text);

commit;
