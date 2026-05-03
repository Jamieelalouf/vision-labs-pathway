create or replace function public.reserve_cohort_enrollment(
  p_dancer_id uuid,
  p_cohort_id uuid,
  p_price_type public.price_type,
  p_price_paid_cad integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_cohort public.cohorts%rowtype;
  existing_enrollment public.enrollments%rowtype;
  reserved_count integer;
  reserved_enrollment_id uuid;
begin
  if not (public.is_admin() or public.current_dancer_id() = p_dancer_id) then
    raise exception 'Not allowed to reserve this enrollment.' using errcode = '42501';
  end if;

  select *
  into locked_cohort
  from public.cohorts
  where id = p_cohort_id
  for update;

  if not found then
    raise exception 'This cohort does not exist.';
  end if;

  if locked_cohort.status <> 'open' or locked_cohort.registration_status <> 'open' then
    raise exception 'This cohort is not open for registration.';
  end if;

  select *
  into existing_enrollment
  from public.enrollments
  where dancer_id = p_dancer_id
    and cohort_id = p_cohort_id
  for update;

  if found and existing_enrollment.payment_status = 'paid' then
    return existing_enrollment.id;
  end if;

  if not (found and existing_enrollment.payment_status = 'pending' and existing_enrollment.enrollment_status = 'pending') then
    select count(*)::integer
    into reserved_count
    from public.enrollments
    where cohort_id = p_cohort_id
      and payment_status in ('pending', 'paid')
      and enrollment_status in ('pending', 'registered', 'completed');

    if reserved_count >= locked_cohort.capacity then
      update public.cohorts
      set registration_status = 'full'
      where id = p_cohort_id;
      raise exception 'This cohort is full.';
    end if;
  end if;

  if found then
    update public.enrollments
    set season_id = locked_cohort.season_id,
        price_type = p_price_type,
        price_paid_cad = p_price_paid_cad,
        payment_status = 'pending',
        enrollment_status = 'pending',
        stripe_checkout_session_id = null,
        stripe_payment_intent_id = null,
        amount_refunded_cad = 0
    where id = existing_enrollment.id
    returning id into reserved_enrollment_id;
  else
    insert into public.enrollments (
      dancer_id,
      cohort_id,
      season_id,
      price_type,
      price_paid_cad,
      payment_status,
      enrollment_status
    )
    values (
      p_dancer_id,
      p_cohort_id,
      locked_cohort.season_id,
      p_price_type,
      p_price_paid_cad,
      'pending',
      'pending'
    )
    returning id into reserved_enrollment_id;
  end if;

  return reserved_enrollment_id;
end;
$$;

grant execute on function public.reserve_cohort_enrollment(uuid, uuid, public.price_type, integer)
to authenticated;
