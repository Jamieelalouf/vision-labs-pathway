-- Phase 8: guard sensitive column updates against non-admin privilege escalation.

create or replace function public.is_admin_or_service_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
    or public.is_admin();
$$;

create or replace function public.guard_profiles_sensitive_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin_or_service_role() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Only admins can change profile role.' using errcode = '42501';
  end if;

  if new.email is distinct from old.email then
    raise exception 'Only admins can change profile email.' using errcode = '42501';
  end if;

  if new.created_at is distinct from old.created_at then
    raise exception 'Only admins can change profile created_at.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.guard_dancers_sensitive_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin_or_service_role() then
    return new;
  end if;

  if new.internal_notes is distinct from old.internal_notes then
    raise exception 'Only admins can change internal notes.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.guard_video_uploads_sensitive_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin_or_service_role() then
    return new;
  end if;

  if new.dancer_id is distinct from old.dancer_id
    or new.source is distinct from old.source
    or new.storage_path is distinct from old.storage_path
    or new.file_size_bytes is distinct from old.file_size_bytes
    or new.mime_type is distinct from old.mime_type
    or new.admin_notes is distinct from old.admin_notes
    or new.created_at is distinct from old.created_at
  then
    raise exception 'Only admins can update protected video fields.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profiles_sensitive_updates_trigger on public.profiles;
create trigger guard_profiles_sensitive_updates_trigger
  before update on public.profiles
  for each row execute function public.guard_profiles_sensitive_updates();

drop trigger if exists guard_dancers_sensitive_updates_trigger on public.dancers;
create trigger guard_dancers_sensitive_updates_trigger
  before update on public.dancers
  for each row execute function public.guard_dancers_sensitive_updates();

create or replace function public.guard_video_uploads_student_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_dancer uuid;
begin
  if public.is_admin_or_service_role() then
    return new;
  end if;

  current_dancer := public.current_dancer_id();
  if current_dancer is null or new.dancer_id is distinct from current_dancer then
    raise exception 'Not allowed to create video records for this dancer.' using errcode = '42501';
  end if;

  if new.cohort_id is null then
    raise exception 'Video records must be attached to a paid cohort.' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.enrollments e
    where e.dancer_id = new.dancer_id
      and e.cohort_id = new.cohort_id
      and e.payment_status = 'paid'
      and e.enrollment_status in ('registered', 'completed')
  ) then
    raise exception 'Video records require a paid cohort enrollment.' using errcode = '42501';
  end if;

  if new.cohort_session_id is not null and not exists (
    select 1
    from public.cohort_sessions cs
    where cs.id = new.cohort_session_id
      and cs.cohort_id = new.cohort_id
  ) then
    raise exception 'Video session must belong to the selected cohort.' using errcode = '23514';
  end if;

  if new.source = 'upload' then
    if new.storage_path is null or new.storage_path not like new.dancer_id::text || '/' || new.cohort_id::text || '/%' then
      raise exception 'Uploaded video storage path must match dancer/cohort.' using errcode = '23514';
    end if;
    if new.external_url is not null then
      raise exception 'Uploaded video records cannot include an external URL.' using errcode = '23514';
    end if;
  elsif new.source = 'external_link' then
    if new.external_url is null or new.storage_path is not null then
      raise exception 'External video records require only an external URL.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_video_uploads_sensitive_updates_trigger on public.video_uploads;
create trigger guard_video_uploads_sensitive_updates_trigger
  before update on public.video_uploads
  for each row execute function public.guard_video_uploads_sensitive_updates();

drop trigger if exists guard_video_uploads_student_insert_trigger on public.video_uploads;
create trigger guard_video_uploads_student_insert_trigger
  before insert on public.video_uploads
  for each row execute function public.guard_video_uploads_student_insert();

drop policy if exists "storage_dancer_videos_own_write" on storage.objects;
create policy "storage_dancer_videos_own_write" on storage.objects
  for insert with check (
    bucket_id = 'dancer-videos'
    and (
      public.is_admin_or_service_role()
      or case
        when split_part(name, '/', 1) = public.current_dancer_id()::text
          and split_part(name, '/', 2) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then exists (
          select 1
          from public.enrollments e
          where e.dancer_id = public.current_dancer_id()
            and e.cohort_id = split_part(name, '/', 2)::uuid
            and e.payment_status = 'paid'
            and e.enrollment_status in ('registered', 'completed')
        )
        else false
      end
    )
  );
