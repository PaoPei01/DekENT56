create table if not exists public.event_participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  participant_type text,
  registration_status text not null default 'pending',
  main_group text,
  subgroup text,
  registered_at timestamptz default now(),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb,
  unique(event_id, person_id)
);

create table if not exists public.staff_applications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  preferred_role text,
  preferred_team text,
  availability jsonb not null default '{}'::jsonb,
  experience text,
  motivation text,
  status text not null default 'submitted',
  submitted_at timestamptz default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  answers jsonb not null default '{}'::jsonb
);

create table if not exists public.event_forms (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  form_type text not null,
  title text not null,
  description text,
  opens_at timestamptz,
  closes_at timestamptz,
  is_open boolean not null default false,
  config_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists public.event_form_responses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  form_id uuid references public.event_forms(id) on delete set null,
  person_id uuid references public.people(id) on delete set null,
  response_json jsonb not null default '{}'::jsonb,
  status text not null default 'submitted',
  submitted_at timestamptz default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz
);

create index if not exists event_participants_event_idx on public.event_participants (event_id);
create index if not exists event_participants_person_idx on public.event_participants (person_id);
create index if not exists staff_applications_event_idx on public.staff_applications (event_id);
create index if not exists staff_applications_person_idx on public.staff_applications (person_id);
create index if not exists event_forms_event_type_idx on public.event_forms (event_id, form_type);
create index if not exists event_form_responses_event_person_idx on public.event_form_responses (event_id, person_id);

alter table public.event_participants enable row level security;
alter table public.staff_applications enable row level security;
alter table public.event_forms enable row level security;
alter table public.event_form_responses enable row level security;

drop policy if exists "admins manage event participants" on public.event_participants;
create policy "admins manage event participants"
on public.event_participants for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins manage staff applications" on public.staff_applications;
create policy "admins manage staff applications"
on public.staff_applications for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "public read open event forms" on public.event_forms;
create policy "public read open event forms"
on public.event_forms for select
using (
  is_open = true
  and exists (
    select 1 from public.events e
    where e.id = event_forms.event_id
      and e.visibility = 'public'
  )
);

drop policy if exists "admins manage event forms" on public.event_forms;
create policy "admins manage event forms"
on public.event_forms for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins manage event form responses" on public.event_form_responses;
create policy "admins manage event form responses"
on public.event_form_responses for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create or replace function public.get_public_event_form(input_event_slug text, input_form_type text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select to_jsonb(ef)
  from public.event_forms ef
  join public.events e on e.id = ef.event_id
  where e.slug = input_event_slug
    and e.visibility = 'public'
    and ef.form_type = input_form_type
    and ef.is_open = true
    and (ef.opens_at is null or ef.opens_at <= now())
    and (ef.closes_at is null or now() <= ef.closes_at)
  order by ef.created_at desc
  limit 1;
$$;

create or replace function public.submit_event_participant_registration(
  input_event_slug text,
  input_email text,
  input_phone text,
  input_answers jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.events;
  person_row public.people;
  form_row public.event_forms;
  participant_row public.event_participants;
begin
  select * into event_row
  from public.events
  where slug = input_event_slug
    and visibility = 'public'
    and status in ('published', 'registration_open', 'active')
  limit 1;

  if event_row.id is null then
    return jsonb_build_object('success', false, 'code', 'event_not_open', 'message', 'Event is not open');
  end if;

  select * into person_row
  from public.people p
  where lower(coalesce(p.email, '')) = lower(btrim(coalesce(input_email, '')))
    and public.normalize_phone(p.phone) = public.normalize_phone(input_phone)
  limit 1;

  if person_row.id is null then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'No matching person found');
  end if;

  select * into form_row
  from public.event_forms
  where event_id = event_row.id
    and form_type = 'participant_registration'
    and is_open = true
    and (opens_at is null or opens_at <= now())
    and (closes_at is null or now() <= closes_at)
  order by created_at desc
  limit 1;

  insert into public.event_participants (event_id, person_id, participant_type, registration_status, metadata)
  values (event_row.id, person_row.id, 'participant', 'pending', coalesce(input_answers, '{}'::jsonb))
  on conflict (event_id, person_id) do update
  set metadata = event_participants.metadata || excluded.metadata
  returning * into participant_row;

  insert into public.event_form_responses (event_id, form_id, person_id, response_json, status)
  values (event_row.id, form_row.id, person_row.id, coalesce(input_answers, '{}'::jsonb), 'submitted');

  return jsonb_build_object(
    'success', true,
    'code', 'submitted',
    'event', jsonb_build_object('id', event_row.id, 'slug', event_row.slug, 'name_th', event_row.name_th, 'name_en', event_row.name_en),
    'registration', jsonb_build_object('id', participant_row.id, 'status', participant_row.registration_status),
    'person', jsonb_build_object('person_id', person_row.id, 'display_name', coalesce(person_row.nickname, person_row.name_th, person_row.name_en, 'ผู้สมัคร'))
  );
end;
$$;

create or replace function public.submit_event_staff_application(
  input_event_slug text,
  input_email text,
  input_phone text,
  input_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.events;
  person_row public.people;
  form_row public.event_forms;
  application_row public.staff_applications;
begin
  select * into event_row
  from public.events
  where slug = input_event_slug
    and visibility = 'public'
    and status in ('staff_recruiting', 'active')
  limit 1;

  if event_row.id is null then
    return jsonb_build_object('success', false, 'code', 'staff_recruiting_closed', 'message', 'Staff recruiting is not open');
  end if;

  select * into person_row
  from public.people p
  where lower(coalesce(p.email, '')) = lower(btrim(coalesce(input_email, '')))
    and public.normalize_phone(p.phone) = public.normalize_phone(input_phone)
  limit 1;

  if person_row.id is null then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'No matching person found');
  end if;

  select * into form_row
  from public.event_forms
  where event_id = event_row.id
    and form_type = 'staff_application'
    and is_open = true
    and (opens_at is null or opens_at <= now())
    and (closes_at is null or now() <= closes_at)
  order by created_at desc
  limit 1;

  insert into public.staff_applications (
    event_id, person_id, preferred_role, preferred_team, availability,
    experience, motivation, status, answers
  )
  values (
    event_row.id,
    person_row.id,
    public.clean_placeholder_text(input_data->>'preferred_role'),
    public.clean_placeholder_text(input_data->>'preferred_team'),
    coalesce(input_data->'availability', '{}'::jsonb),
    public.clean_placeholder_text(input_data->>'experience'),
    public.clean_placeholder_text(input_data->>'motivation'),
    'submitted',
    coalesce(input_data, '{}'::jsonb)
  )
  returning * into application_row;

  insert into public.event_form_responses (event_id, form_id, person_id, response_json, status)
  values (event_row.id, form_row.id, person_row.id, coalesce(input_data, '{}'::jsonb), 'submitted');

  return jsonb_build_object(
    'success', true,
    'code', 'submitted',
    'event', jsonb_build_object('id', event_row.id, 'slug', event_row.slug, 'name_th', event_row.name_th, 'name_en', event_row.name_en),
    'application', jsonb_build_object('id', application_row.id, 'status', application_row.status),
    'person', jsonb_build_object('person_id', person_row.id, 'display_name', coalesce(person_row.nickname, person_row.name_th, person_row.name_en, 'ผู้สมัคร'))
  );
end;
$$;
