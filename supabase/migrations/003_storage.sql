-- ============================================================
-- 003_storage.sql
-- Storage bucket for poll option images.
-- ============================================================

-- Public bucket — processed/CDN images served without auth.
-- Uploads require authentication (enforced via RLS below).
-- 5 MB per-file limit; JPEG, PNG, WebP, GIF only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'poll-images',
  'poll-images',
  true,
  5242880,  -- 5 MB in bytes
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- ============================================================
-- Storage RLS policies
-- ============================================================

-- Anyone can read (bucket is public, but RLS still applies to
-- the storage.objects table for API access).
create policy "poll-images: public read"
  on storage.objects for select
  using (bucket_id = 'poll-images');

-- Only authenticated users can upload.
-- Path convention: {pollId}/{optionId}/{filename}
-- The API route validates ownership before calling storage.
create policy "poll-images: authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'poll-images');

-- Only the uploader can replace their own file.
create policy "poll-images: owner update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'poll-images' and owner_id = auth.uid()::text);

-- Only the uploader can delete their own file.
create policy "poll-images: owner delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'poll-images' and owner_id = auth.uid()::text);
