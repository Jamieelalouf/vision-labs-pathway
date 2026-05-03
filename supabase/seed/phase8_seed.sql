-- VISION LABS Pathway Phase 8 seed data.
-- Run after the initial migration. Auth users/admins still need to be created through Supabase Auth.

insert into public.seasons (
  name,
  start_date,
  end_date,
  convention_name,
  convention_start_date,
  convention_end_date,
  is_active
) values (
  'VISION 2027 Season',
  '2026-05-01',
  '2027-01-31',
  'VISION Dance Convention 2027',
  '2027-01-29',
  '2027-01-31',
  true
) on conflict (name) do update set is_active = excluded.is_active;

with active_season as (
  select id from public.seasons where name = 'VISION 2027 Season'
)
insert into public.cohorts (
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
)
select id, 'Cohort 1 - Foundation', 1, '2026-05-05', '2026-05-26', 2, '18:30', '20:30', 'VISION Studio', 'Montreal, QC', 30, 'closed', 'completed', 'Foundation cohort.', 'Cohorte fondation.'
from active_season
union all
select id, 'Cohort 2 - Momentum', 2, '2026-07-07', '2026-07-28', 2, '18:30', '20:30', 'VISION Studio', 'Montreal, QC', 30, 'closed', 'active', 'Momentum cohort.', 'Cohorte momentum.'
from active_season
union all
select id, 'Cohort 3 - Performance', 3, '2026-09-08', '2026-09-29', 2, '18:30', '20:30', 'VISION Studio', 'Montreal, QC', 30, 'open', 'open', 'Performance cohort.', 'Cohorte performance.'
from active_season
on conflict (season_id, cohort_number) do nothing;
