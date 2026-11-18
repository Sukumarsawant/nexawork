begin;

-- New image references must name an existing object uploaded by this author.
-- Legacy URLs remain readable until a caller changes their image reference.
create or replace function private.validate_post_image()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  object_metadata jsonb;
begin
  if tg_op = 'UPDATE' and new.image_path is not distinct from old.image_path
    and new.image_url is not distinct from old.image_url then
    return new;
  end if;
  if new.image_path is null and nullif(btrim(coalesce(new.image_url, '')), '') is null then
    new.image_url := null;
    return new;
  end if;
  if new.image_path is null or split_part(new.image_path, '/', 1) <> new.user_id::text then
    raise exception 'An owned community image path is required' using errcode = '22023';
  end if;
  select o.metadata into object_metadata from storage.objects o
  where o.bucket_id = 'community-images' and o.name = new.image_path and o.owner_id = new.user_id::text;
  if not found or coalesce((object_metadata->>'size')::bigint, 0) not between 1 and 5242880
    or coalesce(object_metadata->>'mimetype', '') not in ('image/jpeg','image/png','image/gif','image/webp') then
    raise exception 'The owned community image is unavailable or invalid' using errcode = '22023';
  end if;
  -- The application derives the configured bucket URL from the validated path.
  -- Never persist a caller-supplied remote image host for a new image reference.
  new.image_url := null;
  return new;
end;
$$;
revoke all on function private.validate_post_image() from public, anon, authenticated;
create trigger validate_post_image before insert or update on public.community_posts
for each row execute function private.validate_post_image();

drop policy community_images_owner_delete on storage.objects;
create policy community_images_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'community-images' and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (select 1 from public.community_posts p where p.image_path = storage.objects.name)
);

alter table public.profiles add constraint profile_badges_no_nulls check (array_position(badges, null) is null) not valid;
create or replace function public.award_practice_badge(quiz_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare updated_badges text[];
begin
  if not private.has_role('student') then
    raise exception 'Student access is required' using errcode = '42501';
  end if;
  if quiz_id is null or quiz_id not in ('figma', 'nextjs') then
    raise exception 'This practice quiz cannot award a badge' using errcode = '22023';
  end if;
  update public.profiles
  set badges = case when quiz_id = any(array_remove(badges, null))
    then array_remove(badges, null) else array_append(array_remove(badges, null), quiz_id) end
  where id = auth.uid()
  returning badges into updated_badges;
  return jsonb_build_object('quiz_id', quiz_id, 'badges', updated_badges, 'awarded', quiz_id = any(updated_badges));
end;
$$;

-- Supabase can grant anon directly through default privileges; PUBLIC alone is insufficient.
revoke all on function public.bootstrap_profile(text,text) from public, anon;
revoke all on function public.feed_page(timestamptz,uuid,integer) from public, anon;
revoke all on function public.comment_page(uuid,timestamptz,uuid,integer) from public, anon;
revoke all on function public.like_post(uuid) from public, anon;
revoke all on function public.unlike_post(uuid) from public, anon;
revoke all on function public.browse_students(integer) from public, anon;
revoke all on function public.award_practice_badge(text) from public, anon;
grant execute on function public.bootstrap_profile(text,text), public.feed_page(timestamptz,uuid,integer),
  public.comment_page(uuid,timestamptz,uuid,integer), public.like_post(uuid), public.unlike_post(uuid),
  public.browse_students(integer), public.award_practice_badge(text) to authenticated;

commit;
