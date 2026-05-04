-- Phase 9: Community (cohort chat + VISION wall)

create type public.community_visibility as enum ('cohort', 'labs');

create table public.cohort_messages (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  dancer_id uuid not null references public.dancers(id) on delete cascade,
  body text not null,
  hidden_by_admin boolean not null default false,
  hidden_reason text,
  hidden_at timestamptz,
  hidden_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cohort_messages_body_len check (char_length(trim(body)) between 1 and 2000)
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  dancer_id uuid not null references public.dancers(id) on delete cascade,
  cohort_id uuid not null references public.cohorts(id) on delete restrict,
  video_upload_id uuid references public.video_uploads(id) on delete set null,
  visibility public.community_visibility not null default 'cohort',
  caption text,
  hidden_by_admin boolean not null default false,
  hidden_reason text,
  hidden_at timestamptz,
  hidden_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_posts_content_check check (
    (video_upload_id is not null) or (caption is not null and char_length(trim(caption)) > 0)
  ),
  constraint community_posts_caption_len check (
    caption is null or char_length(trim(caption)) <= 3000
  )
);

create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  dancer_id uuid not null references public.dancers(id) on delete cascade,
  body text not null,
  hidden_by_admin boolean not null default false,
  hidden_reason text,
  hidden_at timestamptz,
  hidden_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_comments_body_len check (char_length(trim(body)) between 1 and 2000)
);

create table public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  dancer_id uuid not null references public.dancers(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint community_reactions_unique unique (post_id, dancer_id)
);

create table public.community_moderation_events (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('message', 'post', 'comment')),
  target_id uuid not null,
  action text not null check (action in ('hide', 'unhide')),
  reason text,
  performed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index cohort_messages_cohort_created_idx on public.cohort_messages(cohort_id, created_at desc);
create index cohort_messages_dancer_idx on public.cohort_messages(dancer_id);
create index community_posts_cohort_created_idx on public.community_posts(cohort_id, created_at desc);
create index community_posts_visibility_created_idx on public.community_posts(visibility, created_at desc);
create index community_posts_dancer_idx on public.community_posts(dancer_id);
create index community_posts_video_idx on public.community_posts(video_upload_id);
create index community_comments_post_created_idx on public.community_comments(post_id, created_at asc);
create index community_comments_dancer_idx on public.community_comments(dancer_id);
create index community_reactions_post_idx on public.community_reactions(post_id);
create index community_reactions_dancer_idx on public.community_reactions(dancer_id);
create index community_moderation_events_target_idx
  on public.community_moderation_events(target_type, target_id, created_at desc);

create trigger set_cohort_messages_updated_at
  before update on public.cohort_messages
  for each row execute function public.set_updated_at();

create trigger set_community_posts_updated_at
  before update on public.community_posts
  for each row execute function public.set_updated_at();

create trigger set_community_comments_updated_at
  before update on public.community_comments
  for each row execute function public.set_updated_at();

create or replace function public.has_paid_cohort_membership(target_cohort_id uuid, target_dancer_id uuid default public.current_dancer_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.cohort_id = target_cohort_id
      and e.dancer_id = target_dancer_id
      and e.payment_status = 'paid'
      and e.enrollment_status in ('registered', 'completed')
  );
$$;

create or replace function public.is_paid_labs_student(target_dancer_id uuid default public.current_dancer_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.dancer_id = target_dancer_id
      and e.payment_status = 'paid'
      and e.enrollment_status in ('registered', 'completed')
  );
$$;

create or replace function public.can_view_community_post(target_post_id uuid, target_dancer_id uuid default public.current_dancer_id())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_posts p
    where p.id = target_post_id
      and (
        public.is_admin()
        or (
          p.visibility = 'cohort'
          and public.has_paid_cohort_membership(p.cohort_id, target_dancer_id)
        )
        or (
          p.visibility = 'labs'
          and public.is_paid_labs_student(target_dancer_id)
        )
      )
  );
$$;

create or replace function public.guard_cohort_messages_student_insert()
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
    raise exception 'Not allowed to create messages for this dancer.' using errcode = '42501';
  end if;

  if not public.has_paid_cohort_membership(new.cohort_id, current_dancer) then
    raise exception 'Not allowed to chat in this cohort.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.guard_community_posts_student_insert()
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
    raise exception 'Not allowed to create posts for this dancer.' using errcode = '42501';
  end if;

  if not public.has_paid_cohort_membership(new.cohort_id, current_dancer) then
    raise exception 'Not allowed to post for this cohort.' using errcode = '42501';
  end if;

  if new.video_upload_id is not null and not exists (
    select 1
    from public.video_uploads v
    where v.id = new.video_upload_id
      and v.dancer_id = current_dancer
  ) then
    raise exception 'Video post must use your own upload.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.guard_community_comments_student_insert()
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
    raise exception 'Not allowed to create comments for this dancer.' using errcode = '42501';
  end if;

  if not public.can_view_community_post(new.post_id, current_dancer) then
    raise exception 'Not allowed to comment on this post.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.guard_community_reactions_student_insert()
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
    raise exception 'Not allowed to react for this dancer.' using errcode = '42501';
  end if;

  if not public.can_view_community_post(new.post_id, current_dancer) then
    raise exception 'Not allowed to react on this post.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_cohort_messages_student_insert_trigger on public.cohort_messages;
create trigger guard_cohort_messages_student_insert_trigger
  before insert on public.cohort_messages
  for each row execute function public.guard_cohort_messages_student_insert();

drop trigger if exists guard_community_posts_student_insert_trigger on public.community_posts;
create trigger guard_community_posts_student_insert_trigger
  before insert on public.community_posts
  for each row execute function public.guard_community_posts_student_insert();

drop trigger if exists guard_community_comments_student_insert_trigger on public.community_comments;
create trigger guard_community_comments_student_insert_trigger
  before insert on public.community_comments
  for each row execute function public.guard_community_comments_student_insert();

drop trigger if exists guard_community_reactions_student_insert_trigger on public.community_reactions;
create trigger guard_community_reactions_student_insert_trigger
  before insert on public.community_reactions
  for each row execute function public.guard_community_reactions_student_insert();

alter table public.cohort_messages enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_reactions enable row level security;
alter table public.community_moderation_events enable row level security;

create policy "cohort_messages_select_member_or_admin" on public.cohort_messages
  for select using (
    public.is_admin()
    or (
      not hidden_by_admin
      and public.has_paid_cohort_membership(cohort_id)
    )
  );

create policy "cohort_messages_insert_member_or_admin" on public.cohort_messages
  for insert with check (
    public.is_admin()
    or (
      dancer_id = public.current_dancer_id()
      and public.has_paid_cohort_membership(cohort_id)
    )
  );

create policy "cohort_messages_admin_update" on public.cohort_messages
  for update using (public.is_admin()) with check (public.is_admin());

create policy "community_posts_select_visible_or_admin" on public.community_posts
  for select using (
    public.is_admin()
    or (
      not hidden_by_admin
      and (
        (visibility = 'cohort' and public.has_paid_cohort_membership(cohort_id))
        or (visibility = 'labs' and public.is_paid_labs_student())
      )
    )
  );

create policy "community_posts_insert_member_or_admin" on public.community_posts
  for insert with check (
    public.is_admin()
    or (
      dancer_id = public.current_dancer_id()
      and public.has_paid_cohort_membership(cohort_id)
    )
  );

create policy "community_posts_update_owner_or_admin" on public.community_posts
  for update using (
    public.is_admin()
    or (dancer_id = public.current_dancer_id() and not hidden_by_admin)
  )
  with check (
    public.is_admin()
    or (
      dancer_id = public.current_dancer_id()
      and public.has_paid_cohort_membership(cohort_id)
      and hidden_by_admin = false
    )
  );

create policy "community_posts_delete_owner_or_admin" on public.community_posts
  for delete using (
    public.is_admin()
    or (dancer_id = public.current_dancer_id() and not hidden_by_admin)
  );

create policy "community_comments_select_visible_or_admin" on public.community_comments
  for select using (
    public.is_admin()
    or (
      not hidden_by_admin
      and public.can_view_community_post(post_id)
      and exists (
        select 1 from public.community_posts p
        where p.id = community_comments.post_id
          and not p.hidden_by_admin
      )
    )
  );

create policy "community_comments_insert_member_or_admin" on public.community_comments
  for insert with check (
    public.is_admin()
    or (
      dancer_id = public.current_dancer_id()
      and public.can_view_community_post(post_id)
    )
  );

create policy "community_comments_update_owner_or_admin" on public.community_comments
  for update using (
    public.is_admin()
    or (dancer_id = public.current_dancer_id() and not hidden_by_admin)
  )
  with check (
    public.is_admin()
    or (
      dancer_id = public.current_dancer_id()
      and hidden_by_admin = false
      and public.can_view_community_post(post_id)
    )
  );

create policy "community_comments_delete_owner_or_admin" on public.community_comments
  for delete using (
    public.is_admin()
    or (dancer_id = public.current_dancer_id() and not hidden_by_admin)
  );

create policy "community_reactions_select_visible_or_admin" on public.community_reactions
  for select using (
    public.is_admin() or public.can_view_community_post(post_id)
  );

create policy "community_reactions_insert_member_or_admin" on public.community_reactions
  for insert with check (
    public.is_admin()
    or (
      dancer_id = public.current_dancer_id()
      and public.can_view_community_post(post_id)
    )
  );

create policy "community_reactions_delete_owner_or_admin" on public.community_reactions
  for delete using (
    public.is_admin()
    or (dancer_id = public.current_dancer_id() and public.can_view_community_post(post_id))
  );

create policy "community_moderation_events_admin_all" on public.community_moderation_events
  for all using (public.is_admin()) with check (public.is_admin());
