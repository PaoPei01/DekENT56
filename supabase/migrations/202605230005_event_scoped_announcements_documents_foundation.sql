alter table public.announcements
  add column if not exists event_id uuid references public.events(id) on delete set null;

alter table public.document_project_profiles
  add column if not exists event_id uuid references public.events(id) on delete set null;

alter table public.document_templates
  add column if not exists event_id uuid references public.events(id) on delete set null;

alter table public.generated_documents
  add column if not exists event_id uuid references public.events(id) on delete set null;

create index if not exists announcements_event_id_idx on public.announcements (event_id);
create index if not exists document_project_profiles_event_id_idx on public.document_project_profiles (event_id);
create index if not exists document_templates_event_id_idx on public.document_templates (event_id);
create index if not exists generated_documents_event_id_idx on public.generated_documents (event_id);

update public.announcements
set event_id = public.default_event_id()
where event_id is null
  and public.default_event_id() is not null;

update public.document_project_profiles
set event_id = public.default_event_id()
where event_id is null
  and public.default_event_id() is not null;

update public.document_templates
set event_id = public.default_event_id()
where event_id is null
  and public.default_event_id() is not null;

update public.generated_documents
set event_id = public.default_event_id()
where event_id is null
  and public.default_event_id() is not null;
