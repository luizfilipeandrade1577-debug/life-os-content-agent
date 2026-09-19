-- LIFE OS Content Agent — public storage for Instagram publishing
-- Creates a public bucket so Meta can fetch carousel images by URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'instagram-posts',
  'instagram-posts',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg','image/png','image/webp']::text[];

drop policy if exists "Authenticated user can upload instagram posts" on storage.objects;
create policy "Authenticated user can upload instagram posts"
on storage.objects for insert
to authenticated
with check (bucket_id = 'instagram-posts');

drop policy if exists "Authenticated user can update instagram posts" on storage.objects;
create policy "Authenticated user can update instagram posts"
on storage.objects for update
to authenticated
using (bucket_id = 'instagram-posts')
with check (bucket_id = 'instagram-posts');

drop policy if exists "Authenticated user can delete instagram posts" on storage.objects;
create policy "Authenticated user can delete instagram posts"
on storage.objects for delete
to authenticated
using (bucket_id = 'instagram-posts');

drop policy if exists "Public can read instagram posts" on storage.objects;
create policy "Public can read instagram posts"
on storage.objects for select
to public
using (bucket_id = 'instagram-posts');
