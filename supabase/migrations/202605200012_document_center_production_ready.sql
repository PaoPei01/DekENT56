insert into storage.buckets (id, name, public)
values ('document-templates', 'document-templates', false),
       ('document-outputs', 'document-outputs', false)
on conflict (id) do update set public = false;

alter table public.document_project_profiles
  add column if not exists rationale text,
  add column if not exists objectives text,
  add column if not exists expected_outcomes text,
  add column if not exists kpi_summary text,
  add column if not exists risk_plan text,
  add column if not exists advisor_name text,
  add column if not exists advisor_position text,
  add column if not exists project_chair_name text,
  add column if not exists project_chair_position text,
  add column if not exists coordinator_name text,
  add column if not exists coordinator_phone text,
  add column if not exists coordinator_email text,
  add column if not exists freshmen_count integer,
  add column if not exists staff_count integer,
  add column if not exists total_participants integer,
  add column if not exists budget_total numeric default 0,
  add column if not exists budget_source text,
  add column if not exists event_start_time time,
  add column if not exists event_end_time time,
  add column if not exists event_date date,
  add column if not exists document_date date,
  add column if not exists signing_person_name text,
  add column if not exists signing_person_position text;

update public.document_project_profiles
set objectives = coalesce(objectives, objective),
    coordinator_name = coalesce(coordinator_name, contact_name),
    coordinator_phone = coalesce(coordinator_phone, contact_phone),
    event_date = coalesce(event_date, start_date),
    total_participants = coalesce(total_participants, freshmen_count + staff_count)
where true;

alter table public.document_templates
  add column if not exists document_type text not null default 'custom',
  add column if not exists storage_path text,
  add column if not exists is_active boolean not null default true;

alter table public.document_templates
  alter column template_content drop not null;

alter table public.document_schedule_items
  add column if not exists time_range text,
  add column if not exists duration_minutes integer,
  add column if not exists location text,
  add column if not exists responsible_team text;

alter table public.document_venues
  add column if not exists use_date date,
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists purpose text,
  add column if not exists participant_count integer,
  add column if not exists needs_electricity boolean not null default false,
  add column if not exists needs_sound_system boolean not null default false,
  add column if not exists needs_air_conditioning boolean not null default false,
  add column if not exists needs_cleaning_staff boolean not null default false,
  add column if not exists note text;

alter table public.document_equipment_items
  add column if not exists borrow_date date,
  add column if not exists return_date date,
  add column if not exists use_location text,
  add column if not exists responsible_person text,
  add column if not exists status text not null default 'draft',
  add column if not exists note text;

alter table public.generated_documents
  add column if not exists version integer not null default 1,
  add column if not exists document_type text not null default 'custom',
  add column if not exists title text,
  add column if not exists status text not null default 'generated',
  add column if not exists output_docx_path text,
  add column if not exists snapshot_data jsonb,
  add column if not exists generated_at timestamp with time zone default now();

alter table public.document_templates
  drop constraint if exists document_templates_document_type_check,
  add constraint document_templates_document_type_check
  check (document_type in ('project_approval','venue_request','equipment_borrow','support_request','invitation_letter','closing_report','custom'));

alter table public.generated_documents
  drop constraint if exists generated_documents_document_type_check,
  add constraint generated_documents_document_type_check
  check (document_type in ('project_approval','venue_request','equipment_borrow','support_request','invitation_letter','closing_report','custom'));

alter table public.document_equipment_items
  drop constraint if exists document_equipment_items_status_check,
  add constraint document_equipment_items_status_check
  check (status in ('draft','requested','borrowed','returned','incomplete'));

create index if not exists generated_documents_template_type_version_idx
on public.generated_documents(template_id, document_type, version desc);

drop policy if exists "Admins manage document project profiles" on public.document_project_profiles;
create policy "Admins manage document project profiles" on public.document_project_profiles
for all to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage document templates" on public.document_templates;
create policy "Admins manage document templates" on public.document_templates
for all to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage document budget items" on public.document_budget_items;
create policy "Admins manage document budget items" on public.document_budget_items
for all to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage document schedule items" on public.document_schedule_items;
create policy "Admins manage document schedule items" on public.document_schedule_items
for all to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage document venues" on public.document_venues;
create policy "Admins manage document venues" on public.document_venues
for all to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage document equipment items" on public.document_equipment_items;
create policy "Admins manage document equipment items" on public.document_equipment_items
for all to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage generated documents" on public.generated_documents;
create policy "Admins manage generated documents" on public.generated_documents
for all to authenticated
using (exists (select 1 from public.admins where user_id = auth.uid()))
with check (exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage document template storage" on storage.objects;
create policy "Admins manage document template storage" on storage.objects
for all to authenticated
using (bucket_id = 'document-templates' and exists (select 1 from public.admins where user_id = auth.uid()))
with check (bucket_id = 'document-templates' and exists (select 1 from public.admins where user_id = auth.uid()));

drop policy if exists "Admins manage document output storage" on storage.objects;
create policy "Admins manage document output storage" on storage.objects
for all to authenticated
using (bucket_id = 'document-outputs' and exists (select 1 from public.admins where user_id = auth.uid()))
with check (bucket_id = 'document-outputs' and exists (select 1 from public.admins where user_id = auth.uid()));
