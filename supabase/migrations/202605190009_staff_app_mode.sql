alter table public.staff_assignments
  alter column role set default 'staff';

alter table public.staff_assignments
  drop constraint if exists staff_assignments_role_check;

alter table public.staff_assignments
  add constraint staff_assignments_role_check
  check (role in ('staff', 'mentor', 'emergency_staff', 'viewer'));

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  event_date date not null default current_date,
  status text not null default 'present' check (status in ('present', 'late', 'absent', 'excused')),
  note text,
  main_group text not null check (main_group in ('Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Purple', 'Orange')),
  subgroup text not null check (subgroup in ('A', 'B')),
  marked_by uuid references auth.users(id),
  marked_at timestamp with time zone default now(),
  unique (profile_id, event_date)
);

alter table public.staff_attendance enable row level security;

create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.staff_assignments where user_id = uid and role in ('staff', 'mentor', 'emergency_staff', 'viewer'));
$$;

create or replace function public.staff_can_access_group(input_main_group text, input_subgroup text, input_roles text[] default array['staff','mentor','viewer'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(auth.uid())
    or exists (
      select 1
      from public.staff_assignments sa
      where sa.user_id = auth.uid()
        and sa.role = any(input_roles)
        and sa.main_group = input_main_group
        and (
          (sa.role = 'mentor' and sa.subgroup = input_subgroup)
          or (sa.role <> 'mentor' and (sa.subgroup is null or sa.subgroup = input_subgroup))
        )
    );
$$;

create or replace function public.staff_can_access_profile(input_profile_id uuid, input_roles text[] default array['staff','mentor','viewer'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_assignments ga
    where ga.profile_id = input_profile_id
      and public.staff_can_access_group(ga.main_group, ga.subgroup, input_roles)
  );
$$;

drop policy if exists "Staff can read group settings" on public.group_settings;
create policy "Staff can read group settings"
on public.group_settings for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.staff_can_access_group(main_group, subgroup, array['staff','mentor','viewer'])
);

drop policy if exists "Staff can read group staff roster" on public.group_staff;
create policy "Staff can read group staff roster"
on public.group_staff for select
to authenticated
using (
  public.is_admin(auth.uid())
  or public.staff_can_access_group(main_group, subgroup, array['staff','mentor','viewer'])
);

drop policy if exists "Permitted staff can read emergency notes" on public.emergency_notes;
create policy "Permitted staff can read emergency notes"
on public.emergency_notes for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.staff_assignments sa
    join public.group_assignments ga on ga.profile_id = emergency_notes.profile_id
    where sa.user_id = auth.uid()
      and sa.role = 'emergency_staff'
      and sa.main_group = ga.main_group
      and (sa.subgroup is null or sa.subgroup = ga.subgroup)
  )
);

drop policy if exists "Staff can read scoped attendance" on public.staff_attendance;
create policy "Staff can read scoped attendance"
on public.staff_attendance for select
to authenticated
using (public.staff_can_access_group(main_group, subgroup, array['staff','mentor','viewer']));

drop policy if exists "Staff can insert scoped attendance" on public.staff_attendance;
create policy "Staff can insert scoped attendance"
on public.staff_attendance for insert
to authenticated
with check (public.staff_can_access_group(main_group, subgroup, array['staff','mentor']));

drop policy if exists "Staff can update scoped attendance" on public.staff_attendance;
create policy "Staff can update scoped attendance"
on public.staff_attendance for update
to authenticated
using (public.staff_can_access_group(main_group, subgroup, array['staff','mentor']))
with check (public.staff_can_access_group(main_group, subgroup, array['staff','mentor']));

drop policy if exists "Admins can manage scoped attendance" on public.staff_attendance;
create policy "Admins can manage scoped attendance"
on public.staff_attendance for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create or replace function public.can_view_emergency_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(auth.uid())
    or exists (
      select 1
      from public.staff_assignments sa
      join public.group_assignments ga on ga.profile_id = can_view_emergency_profile.profile_id
      where sa.user_id = auth.uid()
        and sa.role in ('emergency_staff')
        and sa.main_group = ga.main_group
        and (sa.subgroup is null or sa.subgroup = ga.subgroup)
    );
$$;

create or replace function public.get_staff_access_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  is_admin_user boolean := public.is_admin(auth.uid());
  assignments jsonb;
begin
  if auth.uid() is null then
    return jsonb_build_object(
      'is_admin', false,
      'assignments', '[]'::jsonb,
      'roles', '[]'::jsonb,
      'can_view_staff', false,
      'can_mark_attendance', false,
      'can_view_emergency', false,
      'read_only', true
    );
  end if;

  select coalesce(jsonb_agg(to_jsonb(sa) order by sa.created_at), '[]'::jsonb)
  into assignments
  from public.staff_assignments sa
  where sa.user_id = auth.uid();

  return jsonb_build_object(
    'is_admin', is_admin_user,
    'assignments', assignments,
    'roles', coalesce((select jsonb_agg(distinct role) from public.staff_assignments where user_id = auth.uid()), '[]'::jsonb),
    'can_view_staff', is_admin_user or exists (
      select 1 from public.staff_assignments where user_id = auth.uid() and role in ('staff','mentor','viewer')
    ),
    'can_mark_attendance', is_admin_user or exists (
      select 1 from public.staff_assignments where user_id = auth.uid() and role in ('staff','mentor')
    ),
    'can_view_emergency', is_admin_user or exists (
      select 1 from public.staff_assignments where user_id = auth.uid() and role = 'emergency_staff'
    ),
    'read_only', (not is_admin_user) and not exists (
      select 1 from public.staff_assignments where user_id = auth.uid() and role in ('staff','mentor')
    )
  );
end;
$$;

create or replace function public.get_staff_group_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  staff_row public.staff_assignments;
  can_view_medical boolean := public.is_admin(auth.uid());
begin
  select * into staff_row
  from public.staff_assignments
  where user_id = auth.uid()
    and role in ('staff', 'mentor', 'viewer')
  order by
    case role when 'staff' then 1 when 'mentor' then 2 else 3 end,
    created_at asc
  limit 1;

  if not found and not public.is_admin(auth.uid()) then
    return null;
  end if;

  return jsonb_build_object(
    'access', public.get_staff_access_context(),
    'assignment', to_jsonb(staff_row),
    'settings', (
      select coalesce(jsonb_agg(to_jsonb(gs) order by gs.main_group, gs.subgroup), '[]'::jsonb)
      from public.group_settings gs
      where public.is_admin(auth.uid())
         or public.staff_can_access_group(gs.main_group, gs.subgroup, array['staff','mentor','viewer'])
    ),
    'staff_roster', (
      select coalesce(jsonb_agg(to_jsonb(gsr) order by gsr.main_group, gsr.subgroup, gsr.name), '[]'::jsonb)
      from public.group_staff gsr
      where public.is_admin(auth.uid())
         or public.staff_can_access_group(gsr.main_group, gsr.subgroup, array['staff','mentor','viewer'])
    ),
    'participants', (
      select coalesce(jsonb_agg(
        (to_jsonb(p) || jsonb_build_object('group_assignment', to_jsonb(ga)))
        - (case when can_view_medical then array[]::text[] else array['disease','drug_allergy','food_allergy'] end)
        order by ga.main_group, ga.subgroup, p.name_th
      ), '[]'::jsonb)
      from public.group_assignments ga
      join public.profiles p on p.id = ga.profile_id
      where public.is_admin(auth.uid())
         or public.staff_can_access_group(ga.main_group, ga.subgroup, array['staff','mentor','viewer'])
    )
  );
end;
$$;

create or replace function public.get_staff_attendance_context(input_event_date date default current_date)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_admin(auth.uid()) or exists (select 1 from public.staff_assignments where user_id = auth.uid() and role in ('staff','mentor','viewer'))) then
    raise exception 'staff access required';
  end if;

  return jsonb_build_object(
    'access', public.get_staff_access_context(),
    'event_date', input_event_date,
    'participants', (
      select coalesce(jsonb_agg(
        to_jsonb(p)
        || jsonb_build_object(
          'group_assignment', to_jsonb(ga),
          'attendance', to_jsonb(sa)
        )
        order by ga.main_group, ga.subgroup, p.name_th
      ), '[]'::jsonb)
      from public.group_assignments ga
      join public.profiles p on p.id = ga.profile_id
      left join public.staff_attendance sa on sa.profile_id = p.id and sa.event_date = input_event_date
      where public.is_admin(auth.uid())
         or public.staff_can_access_group(ga.main_group, ga.subgroup, array['staff','mentor','viewer'])
    )
  );
end;
$$;

create or replace function public.mark_staff_attendance(
  input_profile_id uuid,
  input_status text,
  input_note text default '',
  input_event_date date default current_date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_row public.group_assignments;
  old_row jsonb;
begin
  if input_status not in ('present', 'late', 'absent', 'excused') then
    raise exception 'invalid attendance status';
  end if;

  select * into assignment_row
  from public.group_assignments
  where profile_id = input_profile_id;

  if not found then
    raise exception 'group assignment not found';
  end if;

  if not public.staff_can_access_group(assignment_row.main_group, assignment_row.subgroup, array['staff','mentor']) then
    raise exception 'attendance permission required';
  end if;

  select to_jsonb(sa) into old_row
  from public.staff_attendance sa
  where sa.profile_id = input_profile_id
    and sa.event_date = input_event_date;

  insert into public.staff_attendance (profile_id, event_date, status, note, main_group, subgroup, marked_by, marked_at)
  values (input_profile_id, input_event_date, input_status, input_note, assignment_row.main_group, assignment_row.subgroup, auth.uid(), now())
  on conflict (profile_id, event_date) do update
  set status = excluded.status,
      note = excluded.note,
      main_group = excluded.main_group,
      subgroup = excluded.subgroup,
      marked_by = auth.uid(),
      marked_at = now();

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (
    input_profile_id,
    auth.uid(),
    'staff_attendance_marked',
    coalesce(old_row, '{}'::jsonb),
    jsonb_build_object('event_date', input_event_date, 'status', input_status, 'note', input_note)
  );
end;
$$;

grant select on public.staff_attendance to authenticated;
grant insert, update on public.staff_attendance to authenticated;
grant execute on function public.staff_can_access_group(text, text, text[]) to authenticated;
grant execute on function public.staff_can_access_profile(uuid, text[]) to authenticated;
grant execute on function public.get_staff_access_context() to authenticated;
grant execute on function public.get_staff_attendance_context(date) to authenticated;
grant execute on function public.mark_staff_attendance(uuid, text, text, date) to authenticated;
