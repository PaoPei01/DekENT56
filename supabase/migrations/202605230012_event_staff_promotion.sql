create table if not exists public.event_staff (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  person_id uuid not null references public.people(id),
  staff_role text,
  team text,
  main_group text,
  subgroup text,
  status text not null default 'active',
  application_id uuid references public.staff_applications(id),
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.event_staff
  add column if not exists staff_role text,
  add column if not exists team text,
  add column if not exists main_group text,
  add column if not exists subgroup text,
  add column if not exists status text not null default 'active',
  add column if not exists application_id uuid references public.staff_applications(id),
  add column if not exists approved_by uuid references auth.users(id),
  add column if not exists approved_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists event_staff_event_person_unique
  on public.event_staff (event_id, person_id);

create index if not exists event_staff_event_idx on public.event_staff (event_id);
create index if not exists event_staff_person_idx on public.event_staff (person_id);
create index if not exists event_staff_application_idx on public.event_staff (application_id);

drop trigger if exists event_staff_touch_updated_at on public.event_staff;
create trigger event_staff_touch_updated_at
before update on public.event_staff
for each row execute function public.touch_updated_at();

alter table public.event_staff enable row level security;

drop policy if exists "admins read event staff" on public.event_staff;
create policy "admins read event staff"
on public.event_staff
for select
using (public.is_admin(auth.uid()));

drop policy if exists "admins insert event staff" on public.event_staff;
create policy "admins insert event staff"
on public.event_staff
for insert
with check (public.is_admin(auth.uid()));

drop policy if exists "admins update event staff" on public.event_staff;
create policy "admins update event staff"
on public.event_staff
for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins delete event staff" on public.event_staff;
create policy "admins delete event staff"
on public.event_staff
for delete
using (public.is_admin(auth.uid()));

grant select, insert, update, delete on public.event_staff to authenticated;

create or replace function public.promote_staff_application_to_event_staff(
  input_application_id uuid,
  input_staff_role text default null,
  input_team text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  application_row public.staff_applications%rowtype;
  event_staff_row public.event_staff%rowtype;
  clean_staff_role text := public.clean_import_text(input_staff_role);
  clean_team text := public.clean_import_text(input_team);
  resolved_team text;
  resolved_role text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select *
  into application_row
  from public.staff_applications
  where id = input_application_id
  for update;

  if application_row.id is null then
    raise exception 'Staff application not found';
  end if;

  if application_row.status <> 'approved' then
    raise exception 'Only approved staff applications can be promoted';
  end if;

  if application_row.event_id is null or application_row.person_id is null then
    raise exception 'Staff application is missing event_id or person_id';
  end if;

  resolved_team := coalesce(
    clean_team,
    public.clean_import_text(application_row.answers->>'final_duty'),
    public.clean_import_text(application_row.preferred_team),
    public.clean_import_text(application_row.preferred_role)
  );
  resolved_role := coalesce(clean_staff_role, public.clean_import_text(application_row.preferred_role), 'staff');

  insert into public.event_staff (
    event_id,
    person_id,
    staff_role,
    team,
    status,
    application_id,
    approved_by,
    approved_at,
    metadata
  )
  values (
    application_row.event_id,
    application_row.person_id,
    resolved_role,
    resolved_team,
    'active',
    application_row.id,
    auth.uid(),
    now(),
    jsonb_build_object('source', 'staff_application')
  )
  on conflict (event_id, person_id) do update
  set
    staff_role = coalesce(excluded.staff_role, event_staff.staff_role),
    team = coalesce(excluded.team, event_staff.team),
    status = 'active',
    application_id = excluded.application_id,
    approved_by = excluded.approved_by,
    approved_at = excluded.approved_at,
    metadata = coalesce(event_staff.metadata, '{}'::jsonb) || excluded.metadata
  returning * into event_staff_row;

  update public.staff_applications
  set answers = coalesce(answers, '{}'::jsonb)
      || jsonb_build_object(
        'promoted_to_event_staff', true,
        'event_staff_id', event_staff_row.id,
        'promoted_at', now(),
        'promoted_by', auth.uid()
      ),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = application_row.id;

  insert into public.change_logs (changed_by, action, old_data, new_data)
  values (
    auth.uid(),
    'promote_staff_application_to_event_staff',
    jsonb_build_object(
      'application_id', application_row.id,
      'status', application_row.status,
      'previous_promoted_to_event_staff', application_row.answers->>'promoted_to_event_staff',
      'previous_event_staff_id', application_row.answers->>'event_staff_id'
    ),
    jsonb_build_object(
      'application_id', application_row.id,
      'event_staff_id', event_staff_row.id,
      'event_id', event_staff_row.event_id,
      'person_id', event_staff_row.person_id,
      'staff_role', event_staff_row.staff_role,
      'team', event_staff_row.team
    )
  );

  return jsonb_build_object(
    'success', true,
    'event_staff_id', event_staff_row.id,
    'event_id', event_staff_row.event_id,
    'person_id', event_staff_row.person_id,
    'application_id', application_row.id,
    'staff_role', event_staff_row.staff_role,
    'team', event_staff_row.team,
    'status', event_staff_row.status
  );
end;
$$;

grant execute on function public.promote_staff_application_to_event_staff(uuid, text, text) to authenticated;
