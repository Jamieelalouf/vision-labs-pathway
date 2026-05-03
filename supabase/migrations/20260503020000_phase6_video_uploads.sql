-- Phase 6 video upload hardening.

update storage.buckets
set
  public = false,
  file_size_limit = 524288000,
  allowed_mime_types = array['video/mp4', 'video/quicktime']
where id = 'dancer-videos';

create policy "storage_dancer_videos_admin_insert" on storage.objects
  for insert with check (
    bucket_id = 'dancer-videos'
    and public.is_admin()
  );
