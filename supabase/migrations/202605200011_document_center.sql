create table if not exists public.document_project_profiles (
  id uuid primary key default gen_random_uuid(),
  project_name text,
  project_code text,
  academic_year text,
  organizer text,
  department text,
  objective text,
  location text,
  start_date date,
  end_date date,
  contact_name text,
  contact_phone text,
  notes text,
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.document_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  file_name text not null,
  mime_type text default 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  template_content text not null,
  placeholders text[] not null default '{}',
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.document_budget_items (
  id uuid primary key default gen_random_uuid(),
  project_profile_id uuid references public.document_project_profiles(id) on delete cascade,
  item_name text not null,
  quantity numeric default 1,
  unit text,
  unit_price numeric default 0,
  amount numeric generated always as (coalesce(quantity, 0) * coalesce(unit_price, 0)) stored,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.document_schedule_items (
  id uuid primary key default gen_random_uuid(),
  project_profile_id uuid references public.document_project_profiles(id) on delete cascade,
  item_date date,
  start_time time,
  end_time time,
  title text not null,
  description text,
  responsible text,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.document_venues (
  id uuid primary key default gen_random_uuid(),
  project_profile_id uuid references public.document_project_profiles(id) on delete cascade,
  name text not null,
  address text,
  capacity integer,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.document_equipment_items (
  id uuid primary key default gen_random_uuid(),
  project_profile_id uuid references public.document_project_profiles(id) on delete cascade,
  name text not null,
  quantity numeric default 1,
  unit text,
  responsible text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists public.generated_documents (
  id uuid primary key default gen_random_uuid(),
  project_profile_id uuid references public.document_project_profiles(id) on delete set null,
  template_id uuid references public.document_templates(id) on delete set null,
  file_name text not null,
  placeholders jsonb not null default '{}'::jsonb,
  missing_fields text[] not null default '{}',
  preview_html text,
  generated_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table public.document_project_profiles enable row level security;
alter table public.document_templates enable row level security;
alter table public.document_budget_items enable row level security;
alter table public.document_schedule_items enable row level security;
alter table public.document_venues enable row level security;
alter table public.document_equipment_items enable row level security;
alter table public.generated_documents enable row level security;

drop policy if exists "Admins manage document project profiles" on public.document_project_profiles;
create policy "Admins manage document project profiles" on public.document_project_profiles
for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage document templates" on public.document_templates;
create policy "Admins manage document templates" on public.document_templates
for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage document budget items" on public.document_budget_items;
create policy "Admins manage document budget items" on public.document_budget_items
for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage document schedule items" on public.document_schedule_items;
create policy "Admins manage document schedule items" on public.document_schedule_items
for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage document venues" on public.document_venues;
create policy "Admins manage document venues" on public.document_venues
for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage document equipment items" on public.document_equipment_items;
create policy "Admins manage document equipment items" on public.document_equipment_items
for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins manage generated documents" on public.generated_documents;
create policy "Admins manage generated documents" on public.generated_documents
for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

grant select, insert, update, delete on public.document_project_profiles to authenticated;
grant select, insert, update, delete on public.document_templates to authenticated;
grant select, insert, update, delete on public.document_budget_items to authenticated;
grant select, insert, update, delete on public.document_schedule_items to authenticated;
grant select, insert, update, delete on public.document_venues to authenticated;
grant select, insert, update, delete on public.document_equipment_items to authenticated;
grant select, insert, update, delete on public.generated_documents to authenticated;
