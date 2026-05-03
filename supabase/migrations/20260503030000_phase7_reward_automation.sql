-- Phase 7 reward automation hardening.

create or replace function public.recalculate_dancer_reward_for(
  p_dancer_id uuid,
  p_season_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  completed_count integer;
  next_tier public.reward_tier;
  next_rank integer;
  existing_reward public.dancer_rewards%rowtype;
  existing_rank integer;
  expires_at_value timestamptz;
begin
  select count(*)::integer
  into completed_count
  from public.enrollments e
  where e.dancer_id = p_dancer_id
    and e.season_id = p_season_id
    and e.payment_status = 'paid'
    and e.completion_status = 'completed'
    and e.enrollment_status not in ('refunded', 'cancelled');

  if completed_count >= 5 then
    next_tier := 'legacy';
    next_rank := 4;
  elsif completed_count >= 3 then
    next_tier := 'elite';
    next_rank := 3;
  elsif completed_count >= 2 then
    next_tier := 'alumni';
    next_rank := 2;
  elsif completed_count >= 1 then
    next_tier := 'member';
    next_rank := 1;
  else
    next_tier := null;
    next_rank := 0;
  end if;

  select
    case
      when s.convention_end_date is not null then (s.convention_end_date + interval '7 days')::timestamptz
      else null
    end
  into expires_at_value
  from public.seasons s
  where s.id = p_season_id;

  select *
  into existing_reward
  from public.dancer_rewards
  where dancer_id = p_dancer_id
    and season_id = p_season_id;

  if next_tier is null then
    if found and not existing_reward.manually_granted then
      if existing_reward.status = 'generated' and existing_reward.discount_code_id is not null then
        update public.discount_codes
        set status = 'cancelled'
        where id = existing_reward.discount_code_id
          and status = 'active';
      end if;

      delete from public.dancer_rewards
      where id = existing_reward.id;
    elsif found then
      update public.dancer_rewards
      set cohorts_completed_count = completed_count
      where id = existing_reward.id;
    end if;
    return;
  end if;

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
      p_dancer_id,
      p_season_id,
      next_tier,
      'unlocked',
      completed_count,
      now(),
      expires_at_value
    );
    return;
  end if;

  existing_rank := case existing_reward.tier
    when 'member' then 1
    when 'alumni' then 2
    when 'elite' then 3
    when 'legacy' then 4
  end;

  if next_rank > existing_rank then
    if existing_reward.status = 'generated' and existing_reward.discount_code_id is not null then
      update public.discount_codes
      set status = 'cancelled'
      where id = existing_reward.discount_code_id
        and status = 'active';
    end if;

    update public.dancer_rewards
    set tier = next_tier,
        status = 'unlocked',
        cohorts_completed_count = completed_count,
        unlocked_at = now(),
        generated_at = null,
        redeemed_at = null,
        discount_code_id = null,
        expires_at = expires_at_value,
        manually_granted = false
    where id = existing_reward.id;
  elsif next_rank < existing_rank and not existing_reward.manually_granted then
    if existing_reward.status = 'generated' and existing_reward.discount_code_id is not null then
      update public.discount_codes
      set status = 'cancelled'
      where id = existing_reward.discount_code_id
        and status = 'active';
    end if;

    update public.dancer_rewards
    set tier = next_tier,
        status = 'unlocked',
        cohorts_completed_count = completed_count,
        unlocked_at = now(),
        generated_at = null,
        redeemed_at = null,
        discount_code_id = null,
        expires_at = expires_at_value
    where id = existing_reward.id;
  else
    update public.dancer_rewards
    set cohorts_completed_count = completed_count,
        expires_at = coalesce(expires_at, expires_at_value)
    where id = existing_reward.id;
  end if;
end;
$$;

create or replace function public.recalculate_dancer_reward()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.recalculate_dancer_reward_for(new.dancer_id, new.season_id);
  end if;

  if tg_op = 'UPDATE'
    and (old.dancer_id is distinct from new.dancer_id or old.season_id is distinct from new.season_id)
  then
    perform public.recalculate_dancer_reward_for(old.dancer_id, old.season_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists recalculate_dancer_reward_trigger on public.enrollments;

create trigger recalculate_dancer_reward_trigger
  after insert or update of completion_status, enrollment_status, payment_status, dancer_id, season_id
  on public.enrollments
  for each row
  execute function public.recalculate_dancer_reward();

grant execute on function public.recalculate_dancer_reward_for(uuid, uuid) to authenticated, service_role;
