-- VISION LABS Pathway initial schema

create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'admin');
create type public.language_pref as enum ('en', 'fr');
create type public.cohort_status as enum ('draft', 'open', 'active', 'completed', 'cancelled');
create type public.registration_status as enum ('open', 'closed', 'full');
create type public.enrollment_status as enum ('pending', 'registered', 'completed', 'dropped', 'refunded', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.price_type as enum ('regular', 'returning', 'manual');
create type public.attendance_status as enum ('present', 'absent', 'excused', 'unmarked');
create type public.reward_tier as enum ('member', 'alumni', 'elite', 'legacy');
create type public.reward_status as enum ('locked', 'unlocked', 'generated', 'redeemed', 'expired');
create type public.discount_type as enum ('convention', 'labs');
create type public.discount_code_status as enum ('active', 'used', 'expired', 'cancelled');
create type public.video_source as enum ('upload', 'external_link');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.user_role not null default 'student',
  language_pref public.language_pref not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dancers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  instagram_handle text,
  date_of_birth date,
  emergency_contact_name text,
  emergency_contact_phone text,
  guardian_name text,
  guardian_email text,
  guardian_phone text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  convention_name text,
  convention_start_date date,
  convention_end_date date,
  weekend_pass_value_cad integer not null default 429,
  all_access_pass_value_cad integer not null default 600,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_end_after_start check (end_date > start_date)
);

create unique index one_active_season on public.seasons(is_active) where is_active = true;

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id),
  name text not null,
  cohort_number integer not null,
  start_date date not null,
  end_date date not null,
  day_of_week smallint check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  location_name text not null,
  location_address text not null,
  capacity integer not null check (capacity > 0),
  registration_status public.registration_status not null default 'closed',
  status public.cohort_status not null default 'draft',
  regular_price_cad integer not null default 297,
  returning_price_cad integer not null default 247,
  description_en text,
  description_fr text,
  stripe_product_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cohorts_end_after_start check (end_date >= start_date),
  constraint cohorts_unique_number unique (season_id, cohort_number)
);

create table public.cohort_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  session_number smallint not null check (session_number between 1 and 4),
  session_date date not null,
  start_time time not null,
  end_time time not null,
  theme_en text,
  theme_fr text,
  notes_en text,
  notes_fr text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cohort_sessions_unique_number unique (cohort_id, session_number)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  dancer_id uuid not null references public.dancers(id),
  cohort_id uuid not null references public.cohorts(id),
  season_id uuid not null references public.seasons(id),
  price_type public.price_type not null,
  price_paid_cad integer not null,
  payment_status public.payment_status not null default 'pending',
  enrollment_status public.enrollment_status not null default 'pending',
  completion_status text check (completion_status in ('completed', 'incomplete') or completion_status is null),
  completion_overridden boolean not null default false,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  amount_refunded_cad integer not null default 0,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollments_unique_dancer_cohort unique (dancer_id, cohort_id)
);

create unique index enrollments_unique_checkout_session
  on public.enrollments(stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  cohort_session_id uuid not null references public.cohort_sessions(id) on delete cascade,
  status public.attendance_status not null default 'unmarked',
  notes text,
  marked_by uuid references public.profiles(id),
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_unique_enrollment_session unique (enrollment_id, cohort_session_id)
);

create table public.reward_levels (
  tier public.reward_tier primary key,
  cohorts_required integer not null,
  status_label_en text not null,
  status_label_fr text not null,
  reward_label_en text not null,
  reward_label_fr text not null,
  discount_amount_cad integer,
  is_free_pass boolean not null default false
);

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  dancer_id uuid not null references public.dancers(id),
  season_id uuid not null references public.seasons(id),
  type public.discount_type not null,
  amount_cad integer,
  is_free_pass boolean not null default false,
  status public.discount_code_status not null default 'active',
  stripe_coupon_id text,
  stripe_promotion_code_id text,
  stackable boolean not null default false,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dancer_rewards (
  id uuid primary key default gen_random_uuid(),
  dancer_id uuid not null references public.dancers(id),
  season_id uuid not null references public.seasons(id),
  tier public.reward_tier not null,
  status public.reward_status not null default 'unlocked',
  cohorts_completed_count integer not null,
  discount_code_id uuid references public.discount_codes(id),
  unlocked_at timestamptz not null default now(),
  generated_at timestamptz,
  redeemed_at timestamptz,
  expires_at timestamptz,
  manually_granted boolean not null default false,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dancer_rewards_unique_dancer_season unique (dancer_id, season_id)
);

create table public.video_uploads (
  id uuid primary key default gen_random_uuid(),
  dancer_id uuid not null references public.dancers(id),
  cohort_id uuid references public.cohorts(id),
  cohort_session_id uuid references public.cohort_sessions(id),
  title text not null,
  description text,
  source public.video_source not null,
  storage_path text,
  external_url text,
  file_size_bytes bigint,
  mime_type text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_upload_source_check check (
    (source = 'upload' and storage_path is not null)
    or (source = 'external_link' and external_url is not null)
  )
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid references public.cohorts(id),
  title_en text not null,
  title_fr text not null,
  description_en text,
  description_fr text,
  url text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid references public.enrollments(id),
  dancer_id uuid references public.dancers(id),
  stripe_event_id text not null unique,
  stripe_event_type text not null,
  stripe_object_id text,
  amount_cad integer,
  currency text not null default 'cad',
  status text,
  raw_payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.system_settings (
  id smallint primary key default 1 check (id = 1),
  regular_price_cad integer not null default 297,
  returning_price_cad integer not null default 247,
  completion_min_attendance smallint not null default 3,
  reward_stacking_enabled boolean not null default false,
  max_video_size_mb integer not null default 500,
  accepted_video_formats text[] not null default array['mp4', 'mov'],
  default_language public.language_pref not null default 'fr',
  stripe_regular_price_id text,
  stripe_returning_price_id text,
  legacy_pass_uses_stripe boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.returning_price_overrides (
  id uuid primary key default gen_random_uuid(),
  dancer_id uuid not null references public.dancers(id) on delete cascade,
  granted_by uuid references public.profiles(id),
  reason text,
  consumed boolean not null default false,
  consumed_enrollment_id uuid references public.enrollments(id),
  expires_at timestamptz not null default (now() + interval '180 days'),
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_email_idx on public.profiles(email);
create index dancers_profile_id_idx on public.dancers(profile_id);
create index dancers_name_idx on public.dancers(last_name, first_name);
create index cohorts_season_id_idx on public.cohorts(season_id);
create index cohorts_status_idx on public.cohorts(status);
create index cohorts_start_date_idx on public.cohorts(start_date);
create index enrollments_dancer_id_idx on public.enrollments(dancer_id);
create index enrollments_cohort_id_idx on public.enrollments(cohort_id);
create index enrollments_season_id_idx on public.enrollments(season_id);
create index enrollments_payment_status_idx on public.enrollments(payment_status);
create index enrollments_enrollment_status_idx on public.enrollments(enrollment_status);
create index attendance_enrollment_id_idx on public.attendance(enrollment_id);
create index attendance_cohort_session_id_idx on public.attendance(cohort_session_id);
create index dancer_rewards_dancer_id_idx on public.dancer_rewards(dancer_id);
create index dancer_rewards_season_id_idx on public.dancer_rewards(season_id);
create index dancer_rewards_status_idx on public.dancer_rewards(status);
create index discount_codes_dancer_id_idx on public.discount_codes(dancer_id);
create index discount_codes_season_id_idx on public.discount_codes(season_id);
create index discount_codes_status_idx on public.discount_codes(status);
create index video_uploads_dancer_id_idx on public.video_uploads(dancer_id);
create index video_uploads_cohort_id_idx on public.video_uploads(cohort_id);
create index video_uploads_cohort_session_id_idx on public.video_uploads(cohort_session_id);
create index payments_enrollment_id_idx on public.payments(enrollment_id);
create index payments_event_type_idx on public.payments(stripe_event_type);
create index returning_price_overrides_lookup_idx
  on public.returning_price_overrides(dancer_id, consumed, expires_at);

insert into public.reward_levels values
  ('member', 1, 'LABS Member', 'Membre LABS', '$25 off VISION Convention', '25 $ de rabais sur la convention VISION', 25, false),
  ('alumni', 2, 'LABS Alumni', 'Ancien LABS', '$50 off VISION Convention', '50 $ de rabais sur la convention VISION', 50, false),
  ('elite', 3, 'LABS Elite', 'LABS Elite', '$100 off VISION Convention', '100 $ de rabais sur la convention VISION', 100, false),
  ('legacy', 5, 'LABS Legacy', 'LABS Legacy', 'LABS Legacy Pass - Free Weekend Pass', 'Laissez-passer LABS Legacy - Pass week-end gratuit', null, true);

insert into public.system_settings (id) values (1);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, language_pref)
  values (new.id, coalesce(new.email, ''), 'student', 'fr')
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.current_dancer_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.dancers
  where profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.auto_create_cohort_sessions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  i integer;
begin
  for i in 1..4 loop
    insert into public.cohort_sessions (
      cohort_id,
      session_number,
      session_date,
      start_time,
      end_time
    )
    values (
      new.id,
      i,
      new.start_date + ((i - 1) * interval '7 days'),
      new.start_time,
      new.end_time
    );
  end loop;
  return new;
end;
$$;

create or replace function public.auto_create_attendance_rows()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'paid'
    and (tg_op = 'INSERT' or old.payment_status is distinct from new.payment_status)
  then
    insert into public.attendance (enrollment_id, cohort_session_id)
    select new.id, cs.id
    from public.cohort_sessions cs
    where cs.cohort_id = new.cohort_id
    on conflict (enrollment_id, cohort_session_id) do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.recalculate_dancer_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_count integer;
  next_tier public.reward_tier;
  existing_reward public.dancer_rewards%rowtype;
  tier_rank integer;
  existing_rank integer;
  expires_at_value timestamptz;
begin
  if new.completion_status is distinct from 'completed' then
    return new;
  end if;

  select count(*)::integer
  into completed_count
  from public.enrollments e
  where e.dancer_id = new.dancer_id
    and e.season_id = new.season_id
    and e.completion_status = 'completed'
    and e.enrollment_status not in ('refunded', 'cancelled');

  if completed_count >= 5 then
    next_tier := 'legacy';
    tier_rank := 4;
  elsif completed_count >= 3 then
    next_tier := 'elite';
    tier_rank := 3;
  elsif completed_count >= 2 then
    next_tier := 'alumni';
    tier_rank := 2;
  elsif completed_count >= 1 then
    next_tier := 'member';
    tier_rank := 1;
  else
    return new;
  end if;

  select
    case
      when s.convention_end_date is not null then (s.convention_end_date + interval '7 days')::timestamptz
      else null
    end
  into expires_at_value
  from public.seasons s
  where s.id = new.season_id;

  select *
  into existing_reward
  from public.dancer_rewards
  where dancer_id = new.dancer_id
    and season_id = new.season_id;

  if not found then
    insert into public.dancer_rewards (
      dancer_id,
      season_id,
      tier,
      status,
      cohorts_completed_count,
      unlocked_at,
      expires_at
    )
    values (
      new.dancer_id,
      new.season_id,
      next_tier,
      'unlocked',
      completed_count,
      now(),
      expires_at_value
    );
    return new;
  end if;

  existing_rank := case existing_reward.tier
    when 'member' then 1
    when 'alumni' then 2
    when 'elite' then 3
    when 'legacy' then 4
  end;

  if tier_rank > existing_rank then
    if existing_reward.status = 'generated' and existing_reward.discount_code_id is not null then
      update public.discount_codes
      set status = 'cancelled'
      where id = existing_reward.discount_code_id;
    end if;

    update public.dancer_rewards
    set tier = next_tier,
        status = 'unlocked',
        cohorts_completed_count = completed_count,
        unlocked_at = now(),
        generated_at = null,
        discount_code_id = null,
        expires_at = expires_at_value
    where id = existing_reward.id;
  else
    update public.dancer_rewards
    set cohorts_completed_count = completed_count
    where id = existing_reward.id;
  end if;

  return new;
end;
$$;

create or replace function public.auto_grant_returning_overrides_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status is distinct from 'cancelled' and new.status = 'cancelled' then
    insert into public.returning_price_overrides (dancer_id, reason)
    select e.dancer_id, 'Auto-granted because cohort was cancelled'
    from public.enrollments e
    where e.cohort_id = new.id
      and e.enrollment_status not in ('refunded', 'cancelled')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger auto_create_cohort_sessions_trigger
  after insert on public.cohorts
  for each row execute function public.auto_create_cohort_sessions();

create trigger auto_create_attendance_rows_trigger
  after insert or update of payment_status on public.enrollments
  for each row execute function public.auto_create_attendance_rows();

create trigger recalculate_dancer_reward_trigger
  after update of completion_status on public.enrollments
  for each row
  when (new.completion_status = 'completed')
  execute function public.recalculate_dancer_reward();

create trigger auto_grant_returning_overrides_on_cancel_trigger
  after update of status on public.cohorts
  for each row execute function public.auto_grant_returning_overrides_on_cancel();

create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger set_dancers_updated_at before update on public.dancers for each row execute function public.set_updated_at();
create trigger set_seasons_updated_at before update on public.seasons for each row execute function public.set_updated_at();
create trigger set_cohorts_updated_at before update on public.cohorts for each row execute function public.set_updated_at();
create trigger set_cohort_sessions_updated_at before update on public.cohort_sessions for each row execute function public.set_updated_at();
create trigger set_enrollments_updated_at before update on public.enrollments for each row execute function public.set_updated_at();
create trigger set_attendance_updated_at before update on public.attendance for each row execute function public.set_updated_at();
create trigger set_discount_codes_updated_at before update on public.discount_codes for each row execute function public.set_updated_at();
create trigger set_dancer_rewards_updated_at before update on public.dancer_rewards for each row execute function public.set_updated_at();
create trigger set_video_uploads_updated_at before update on public.video_uploads for each row execute function public.set_updated_at();
create trigger set_resources_updated_at before update on public.resources for each row execute function public.set_updated_at();
create trigger set_system_settings_updated_at before update on public.system_settings for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.dancers enable row level security;
alter table public.seasons enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_sessions enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.reward_levels enable row level security;
alter table public.discount_codes enable row level security;
alter table public.dancer_rewards enable row level security;
alter table public.video_uploads enable row level security;
alter table public.resources enable row level security;
alter table public.payments enable row level security;
alter table public.system_settings enable row level security;
alter table public.returning_price_overrides enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "dancers_select_own_or_admin" on public.dancers
  for select using (profile_id = auth.uid() or public.is_admin());
create policy "dancers_insert_own_or_admin" on public.dancers
  for insert with check (profile_id = auth.uid() or public.is_admin());
create policy "dancers_update_own_or_admin" on public.dancers
  for update using (profile_id = auth.uid() or public.is_admin())
  with check (profile_id = auth.uid() or public.is_admin());
create policy "dancers_admin_delete" on public.dancers
  for delete using (public.is_admin());

create policy "seasons_public_active_read" on public.seasons
  for select using (is_active = true or public.is_admin());
create policy "seasons_admin_all" on public.seasons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "cohorts_public_read_open_active" on public.cohorts
  for select using (status in ('open', 'active') or public.is_admin());
create policy "cohorts_students_read_non_draft" on public.cohorts
  for select using (auth.role() = 'authenticated' and status <> 'draft');
create policy "cohorts_admin_all" on public.cohorts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "cohort_sessions_read_public_or_enrolled_or_admin" on public.cohort_sessions
  for select using (
    public.is_admin()
    or exists (
      select 1
      from public.cohorts c
      where c.id = cohort_sessions.cohort_id
        and c.status in ('open', 'active')
    )
    or exists (
      select 1
      from public.enrollments e
      where e.cohort_id = cohort_sessions.cohort_id
        and e.dancer_id = public.current_dancer_id()
    )
  );
create policy "cohort_sessions_admin_all" on public.cohort_sessions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "enrollments_insert_own_or_admin" on public.enrollments
  for insert with check (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "enrollments_admin_all" on public.enrollments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "attendance_select_own_or_admin" on public.attendance
  for select using (
    public.is_admin()
    or exists (
      select 1
      from public.enrollments e
      where e.id = attendance.enrollment_id
        and e.dancer_id = public.current_dancer_id()
    )
  );
create policy "attendance_admin_all" on public.attendance
  for all using (public.is_admin()) with check (public.is_admin());

create policy "reward_levels_public_read" on public.reward_levels
  for select using (true);
create policy "reward_levels_admin_all" on public.reward_levels
  for all using (public.is_admin()) with check (public.is_admin());

create policy "dancer_rewards_select_own_or_admin" on public.dancer_rewards
  for select using (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "dancer_rewards_admin_all" on public.dancer_rewards
  for all using (public.is_admin()) with check (public.is_admin());

create policy "discount_codes_select_own_or_admin" on public.discount_codes
  for select using (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "discount_codes_admin_all" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "video_uploads_select_own_or_admin" on public.video_uploads
  for select using (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "video_uploads_insert_own_or_admin" on public.video_uploads
  for insert with check (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "video_uploads_update_own_or_admin" on public.video_uploads
  for update using (dancer_id = public.current_dancer_id() or public.is_admin())
  with check (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "video_uploads_delete_own_or_admin" on public.video_uploads
  for delete using (dancer_id = public.current_dancer_id() or public.is_admin());

create policy "resources_public_read" on public.resources
  for select using (true);
create policy "resources_admin_all" on public.resources
  for all using (public.is_admin()) with check (public.is_admin());

create policy "payments_admin_read" on public.payments
  for select using (public.is_admin());
create policy "payments_admin_update" on public.payments
  for update using (public.is_admin()) with check (public.is_admin());

create policy "system_settings_admin_all" on public.system_settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "returning_overrides_select_own_or_admin" on public.returning_price_overrides
  for select using (dancer_id = public.current_dancer_id() or public.is_admin());
create policy "returning_overrides_admin_all" on public.returning_price_overrides
  for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('dancer-videos', 'dancer-videos', false, 524288000, array['video/mp4', 'video/quicktime']),
  ('cohort-resources', 'cohort-resources', true, null, null),
  ('brand-assets', 'brand-assets', true, null, null)
on conflict (id) do nothing;

create policy "storage_dancer_videos_own_read" on storage.objects
  for select using (
    bucket_id = 'dancer-videos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  );

create policy "storage_dancer_videos_own_write" on storage.objects
  for insert with check (
    bucket_id = 'dancer-videos'
    and split_part(name, '/', 1) = public.current_dancer_id()::text
  );

create policy "storage_dancer_videos_own_update" on storage.objects
  for update using (
    bucket_id = 'dancer-videos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  ) with check (
    bucket_id = 'dancer-videos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  );

create policy "storage_dancer_videos_own_delete" on storage.objects
  for delete using (
    bucket_id = 'dancer-videos'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = public.current_dancer_id()::text
    )
  );

create policy "storage_public_assets_read" on storage.objects
  for select using (bucket_id in ('cohort-resources', 'brand-assets'));

create policy "storage_admin_asset_write" on storage.objects
  for all using (
    bucket_id in ('cohort-resources', 'brand-assets')
    and public.is_admin()
  ) with check (
    bucket_id in ('cohort-resources', 'brand-assets')
    and public.is_admin()
  );
