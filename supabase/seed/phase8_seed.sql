-- VISION LABS Pathway Phase 8 demo seed.
-- Run after all migrations. This creates deterministic local/test data only.
-- Demo password for every seeded user: VisionLabs123!

create extension if not exists "pgcrypto";

update public.seasons set is_active = false where is_active = true;

insert into public.seasons (
  id,
  name,
  start_date,
  end_date,
  convention_name,
  convention_start_date,
  convention_end_date,
  is_active
) values (
  '10000000-0000-4000-8000-000000000001',
  'VISION 2027 Season',
  '2026-05-01',
  '2027-01-31',
  'VISION Dance Convention 2027',
  '2027-01-29',
  '2027-01-31',
  true
) on conflict (id) do update set
  name = excluded.name,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  convention_name = excluded.convention_name,
  convention_start_date = excluded.convention_start_date,
  convention_end_date = excluded.convention_end_date,
  is_active = excluded.is_active;

insert into public.cohorts (
  id,
  season_id,
  name,
  cohort_number,
  start_date,
  end_date,
  day_of_week,
  start_time,
  end_time,
  location_name,
  location_address,
  capacity,
  registration_status,
  status,
  description_en,
  description_fr
) values
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Cohort 1 - Foundation',
    1,
    '2026-05-05',
    '2026-05-26',
    2,
    '18:30',
    '20:30',
    'VISION Studio',
    'Montreal, QC',
    30,
    'closed',
    'completed',
    'Foundation cohort.',
    'Cohorte fondation.'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Cohort 2 - Momentum',
    2,
    '2026-07-07',
    '2026-07-28',
    2,
    '18:30',
    '20:30',
    'VISION Studio',
    'Montreal, QC',
    30,
    'closed',
    'active',
    'Momentum cohort.',
    'Cohorte momentum.'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    'Cohort 3 - Performance',
    3,
    '2026-09-08',
    '2026-09-29',
    2,
    '18:30',
    '20:30',
    'VISION Studio',
    'Montreal, QC',
    30,
    'open',
    'open',
    'Performance cohort.',
    'Cohorte performance.'
  )
on conflict (id) do update set
  name = excluded.name,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  registration_status = excluded.registration_status,
  status = excluded.status,
  description_en = excluded.description_en,
  description_fr = excluded.description_fr;

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) values
  (
    '30000000-0000-4000-8000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@visionlabs.test',
    crypt('VisionLabs123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '30000000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'maya@visionlabs.test',
    crypt('VisionLabs123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Maya"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'theo@visionlabs.test',
    crypt('VisionLabs123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Theo"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'ana@visionlabs.test',
    crypt('VisionLabs123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Ana"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '30000000-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'chris@visionlabs.test',
    crypt('VisionLabs123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Chris"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '30000000-0000-4000-8000-000000000005',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'lea@visionlabs.test',
    crypt('VisionLabs123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Lea"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  updated_at = now();

insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  u.email,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email like '%@visionlabs.test'
on conflict (provider, provider_id) do update set
  user_id = excluded.user_id,
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, email, role, language_pref)
select
  u.id,
  u.email,
  case when u.email = 'admin@visionlabs.test' then 'admin'::public.user_role else 'student'::public.user_role end,
  case when u.email in ('maya@visionlabs.test', 'ana@visionlabs.test') then 'fr'::public.language_pref else 'en'::public.language_pref end
from auth.users u
where u.email like '%@visionlabs.test'
on conflict (id) do update set
  email = excluded.email,
  role = excluded.role,
  language_pref = excluded.language_pref;

insert into public.dancers (
  id,
  profile_id,
  first_name,
  last_name,
  phone,
  instagram_handle,
  date_of_birth,
  emergency_contact_name,
  emergency_contact_phone
) values
  ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Maya', 'Laurent', '514-555-0101', '@maya.moves', '2004-03-14', 'Sophie Laurent', '514-555-1101'),
  ('40000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'Theo', 'Bennett', '514-555-0102', '@theobennett', '2002-09-22', 'Rina Bennett', '514-555-1102'),
  ('40000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'Ana', 'Roy', '514-555-0103', '@anaroydance', '2005-11-09', 'Luc Roy', '514-555-1103'),
  ('40000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000004', 'Chris', 'Nguyen', '514-555-0104', '@chrisgrooves', '2001-07-02', 'Mai Nguyen', '514-555-1104'),
  ('40000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000005', 'Lea', 'Martin', '514-555-0105', '@leamartin', '2006-01-18', 'Noah Martin', '514-555-1105')
on conflict (id) do update set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  phone = excluded.phone,
  instagram_handle = excluded.instagram_handle,
  emergency_contact_name = excluded.emergency_contact_name,
  emergency_contact_phone = excluded.emergency_contact_phone;

insert into public.enrollments (
  id,
  dancer_id,
  cohort_id,
  season_id,
  price_type,
  price_paid_cad,
  payment_status,
  enrollment_status,
  completion_status,
  completion_overridden,
  admin_notes
) values
  ('50000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'regular', 297, 'paid', 'completed', 'completed', false, 'Seed: completed with full attendance.'),
  ('50000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'regular', 297, 'paid', 'registered', 'incomplete', false, 'Seed: incomplete attendance.'),
  ('50000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'regular', 297, 'paid', 'registered', null, false, 'Seed: active cohort student.'),
  ('50000000-0000-4000-8000-000000000004', '40000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'returning', 247, 'paid', 'registered', null, false, 'Seed: open cohort returning registration.'),
  ('50000000-0000-4000-8000-000000000005', '40000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'regular', 297, 'refunded', 'refunded', null, false, 'Seed: refunded/drop edge case.')
on conflict (id) do update set
  payment_status = excluded.payment_status,
  enrollment_status = excluded.enrollment_status,
  completion_status = excluded.completion_status,
  admin_notes = excluded.admin_notes;

update public.attendance a
set status = case
  when cs.session_number in (1, 2, 3, 4) then 'present'::public.attendance_status
  else a.status
end,
marked_at = now()
from public.cohort_sessions cs
where a.cohort_session_id = cs.id
  and a.enrollment_id = '50000000-0000-4000-8000-000000000001';

update public.attendance a
set status = case
  when cs.session_number in (1, 2) then 'present'::public.attendance_status
  when cs.session_number = 3 then 'absent'::public.attendance_status
  else 'unmarked'::public.attendance_status
end,
marked_at = now()
from public.cohort_sessions cs
where a.cohort_session_id = cs.id
  and a.enrollment_id = '50000000-0000-4000-8000-000000000002';

update public.attendance a
set status = case
  when cs.session_number = 1 then 'present'::public.attendance_status
  when cs.session_number = 2 then 'excused'::public.attendance_status
  else 'unmarked'::public.attendance_status
end,
marked_at = now()
from public.cohort_sessions cs
where a.cohort_session_id = cs.id
  and a.enrollment_id = '50000000-0000-4000-8000-000000000003';

insert into public.returning_price_overrides (
  id,
  dancer_id,
  reason,
  expires_at
) values (
  '60000000-0000-4000-8000-000000000004',
  '40000000-0000-4000-8000-000000000004',
  'Seed: cohort sold out / admin grant demo.',
  now() + interval '180 days'
) on conflict (id) do update set
  reason = excluded.reason,
  expires_at = excluded.expires_at,
  consumed = false,
  consumed_enrollment_id = null;

insert into public.discount_codes (
  id,
  code,
  dancer_id,
  season_id,
  type,
  amount_cad,
  is_free_pass,
  status,
  stackable,
  expires_at
) values (
  '70000000-0000-4000-8000-000000000001',
  'LABS-MEMBER-SEED01',
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'convention',
  25,
  false,
  'active',
  false,
  '2027-02-07T23:59:59Z'
) on conflict (code) do update set
  status = excluded.status,
  expires_at = excluded.expires_at;

update public.dancer_rewards
set status = 'generated',
    discount_code_id = '70000000-0000-4000-8000-000000000001',
    generated_at = now(),
    expires_at = '2027-02-07T23:59:59Z'
where dancer_id = '40000000-0000-4000-8000-000000000001'
  and season_id = '10000000-0000-4000-8000-000000000001';

insert into public.dancer_rewards (
  dancer_id,
  season_id,
  tier,
  status,
  cohorts_completed_count,
  unlocked_at,
  expires_at,
  manually_granted,
  admin_notes
) values (
  '40000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000001',
  'elite',
  'unlocked',
  4,
  now(),
  '2027-02-07T23:59:59Z',
  true,
  'Seed: near-Legacy manual override demo.'
) on conflict (dancer_id, season_id) do update set
  tier = excluded.tier,
  status = excluded.status,
  cohorts_completed_count = excluded.cohorts_completed_count,
  manually_granted = true,
  admin_notes = excluded.admin_notes;

insert into public.video_uploads (
  id,
  dancer_id,
  cohort_id,
  cohort_session_id,
  title,
  description,
  source,
  external_url
) values
  (
    '80000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    (select id from public.cohort_sessions where cohort_id = '20000000-0000-4000-8000-000000000001' and session_number = 4),
    'Foundation final combo',
    'Seed external-link upload.',
    'external_link',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  ),
  (
    '80000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000002',
    (select id from public.cohort_sessions where cohort_id = '20000000-0000-4000-8000-000000000002' and session_number = 1),
    'Momentum week 1 practice',
    'Seed external-link upload.',
    'external_link',
    'https://vimeo.com/123456789'
  )
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  external_url = excluded.external_url;
