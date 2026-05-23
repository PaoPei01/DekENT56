create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text,
  slug text unique not null,
  description text,
  event_type text,
  academic_year text,
  start_date date,
  end_date date,
  location text,
  status text not null default 'draft',
  visibility text not null default 'private',
  cover_image_path text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.events
  alter column metadata set default '{}'::jsonb;

update public.events
set metadata = '{}'::jsonb
where metadata is null;

create unique index if not exists events_slug_key on public.events (slug);
create index if not exists events_status_idx on public.events (status);
create index if not exists events_visibility_idx on public.events (visibility);
create index if not exists events_start_date_idx on public.events (start_date);
create index if not exists events_event_type_idx on public.events (event_type);

alter table public.events enable row level security;

drop policy if exists "public read public events" on public.events;
create policy "public read public events"
on public.events for select
using (visibility = 'public');

drop policy if exists "admins read all events" on public.events;
create policy "admins read all events"
on public.events for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "admins insert events" on public.events;
create policy "admins insert events"
on public.events for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "admins update events" on public.events;
create policy "admins update events"
on public.events for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "admins delete events" on public.events;
create policy "admins delete events"
on public.events for delete
to authenticated
using (public.is_admin(auth.uid()));

insert into public.events (
  name_th,
  name_en,
  slug,
  description,
  event_type,
  academic_year,
  start_date,
  end_date,
  location,
  status,
  visibility,
  metadata
)
values
(
  'รับน้องสานสัมพันธ์ 69',
  'Entaneer CMU 69',
  'entaneer-bonding-69',
  'กิจกรรมต้อนรับนักศึกษาใหม่คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเชียงใหม่',
  'activity',
  '2569',
  '2026-06-20',
  '2026-06-20',
  'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเชียงใหม่',
  'active',
  'public',
  jsonb_build_object(
    'legacy_default_event', true,
    'public_content_key', 'entaneer-bonding-69',
    'expected_freshmen', 1050,
    'confirmed_estimate', 1203,
    'staff_total', 226,
    'total_expected', 1276,
    'group_count', 7
  )
),
(
  'เปิดรับสตาฟงานปฐมนิเทศผู้ปกครอง ประจำปีการศึกษา 2569',
  'Parent Orientation Staff Recruitment 2026',
  'parent-orientation-staff-2569',
  'เปิดรับสมัครสตาฟสำหรับช่วยงานปฐมนิเทศผู้ปกครอง ประจำปีการศึกษา 2569',
  'staff_recruitment',
  '2569',
  '2026-06-12',
  '2026-06-12',
  'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเชียงใหม่',
  'staff_recruiting',
  'public',
  jsonb_build_object(
    'public_content_key', 'parent-orientation-staff-2569',
    'capacity', 300,
    'eligible_years', jsonb_build_array(2, 3),
    'staff_application_pilot', true
  )
)
on conflict (slug) do update
set name_th = excluded.name_th,
    name_en = excluded.name_en,
    description = excluded.description,
    event_type = excluded.event_type,
    academic_year = excluded.academic_year,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    location = excluded.location,
    status = excluded.status,
    visibility = excluded.visibility,
    metadata = coalesce(public.events.metadata, '{}'::jsonb) || excluded.metadata,
    updated_at = now();
