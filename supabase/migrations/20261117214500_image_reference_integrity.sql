begin;

-- The FK serializes reference creation against object deletion. A policy-only
-- absence check cannot exclude a post transaction that has not committed yet.
alter table public.community_posts add column image_object_id uuid;
alter table public.community_posts add constraint community_post_image_object_fk
  foreign key (image_object_id) references storage.objects(id) on delete restrict not valid;
create index community_post_image_object_idx on public.community_posts(image_object_id) where image_object_id is not null;

-- Bind existing, resolvable owned paths without rewriting legacy URLs or paths.
update public.community_posts p set image_object_id = o.id
from storage.objects o where p.image_path = o.name and o.bucket_id = 'community-images' and o.owner_id = p.user_id::text;

create or replace function private.validate_post_image()
returns trigger language plpgsql security definer set search_path = '' as $$
declare object_metadata jsonb; object_id uuid;
begin
  if tg_op = 'UPDATE' and new.image_path is not distinct from old.image_path
    and new.image_url is not distinct from old.image_url then return new; end if;
  if new.image_path is null and nullif(btrim(coalesce(new.image_url, '')), '') is null then
    new.image_url := null;
    new.image_object_id := null;
    return new;
  end if;
  if new.image_path is null or split_part(new.image_path, '/', 1) <> new.user_id::text then
    raise exception 'An owned community image path is required' using errcode = '22023';
  end if;
  select o.id, o.metadata into object_id, object_metadata from storage.objects o
  where o.bucket_id = 'community-images' and o.name = new.image_path and o.owner_id = new.user_id::text;
  if not found or coalesce((object_metadata->>'size')::bigint, 0) not between 1 and 5242880
    or coalesce(object_metadata->>'mimetype', '') not in ('image/jpeg','image/png','image/gif','image/webp') then
    raise exception 'The owned community image is unavailable or invalid' using errcode = '22023';
  end if;
  new.image_object_id := object_id;
  new.image_url := null;
  return new;
end;
$$;
revoke all on function private.validate_post_image() from public, anon, authenticated;

commit;
