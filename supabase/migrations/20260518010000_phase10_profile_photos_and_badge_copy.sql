-- Phase 10 profile photos + digital badge wording updates.

alter table public.dancers
  add column if not exists avatar_storage_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "storage_profile_photos_own_read" on storage.objects;
create policy "storage_profile_photos_own_read" on storage.objects
  for select using (
    bucket_id = 'profile-photos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  );

drop policy if exists "storage_profile_photos_own_write" on storage.objects;
create policy "storage_profile_photos_own_write" on storage.objects
  for insert with check (
    bucket_id = 'profile-photos'
    and split_part(name, '/', 1) = public.current_dancer_id()::text
  );

drop policy if exists "storage_profile_photos_own_update" on storage.objects;
create policy "storage_profile_photos_own_update" on storage.objects
  for update using (
    bucket_id = 'profile-photos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  ) with check (
    bucket_id = 'profile-photos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  );

drop policy if exists "storage_profile_photos_own_delete" on storage.objects;
create policy "storage_profile_photos_own_delete" on storage.objects
  for delete using (
    bucket_id = 'profile-photos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  );

update public.reward_levels
set reward_label_en = case tier
  when 'member' then 'LABS Member Digital Badge'
  when 'alumni' then 'LABS Alumni Digital Badge'
  when 'elite' then 'LABS Elite Digital Badge'
  when 'legacy' then 'LABS Legacy Digital Badge'
  else reward_label_en
end;

update public.reward_levels
set reward_label_fr = case tier
  when 'member' then 'Badge numérique Membre LABS'
  when 'alumni' then 'Badge numérique Alumni LABS'
  when 'elite' then 'Badge numérique Elite LABS'
  when 'legacy' then 'Badge numérique Legacy LABS'
  else reward_label_fr
end;
