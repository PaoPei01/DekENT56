alter table public.profiles
  add column if not exists nickname_en text,
  add column if not exists admission_round text,
  add column if not exists form_submitted_at timestamp with time zone,
  add column if not exists registration_order integer,
  add column if not exists gender text,
  add column if not exists hometown text,
  add column if not exists interests text,
  add column if not exists public_profile boolean default false,
  add column if not exists show_instagram boolean default false,
  add column if not exists show_line_id boolean default false;

create or replace function public.safe_jsonb_boolean(input_data jsonb, input_key text, fallback boolean default false)
returns boolean
language plpgsql
immutable
as $$
declare
  raw text;
begin
  if input_data is null or not (input_data ? input_key) then
    return fallback;
  end if;

  if jsonb_typeof(input_data -> input_key) = 'boolean' then
    return (input_data ->> input_key)::boolean;
  end if;

  raw := lower(btrim(coalesce(input_data ->> input_key, '')));
  if raw in ('true', 't', 'yes', 'y', '1', 'on') then
    return true;
  elsif raw in ('false', 'f', 'no', 'n', '0', 'off', '') then
    return false;
  end if;

  return fallback;
end;
$$;

create or replace view public.public_profiles as
select
  p.id,
  p.name_th,
  p.name_en,
  p.nickname,
  p.nickname_en,
  p.major,
  ga.main_group,
  ga.subgroup
from public.profiles p
left join public.group_assignments ga on ga.profile_id = p.id;

drop function if exists public.search_public_profiles(text, text);
drop function if exists public.search_public_profiles(text, text, text, text);

create or replace function public.search_public_profiles(
  search_text text default '',
  major_filter text default '',
  main_group_filter text default '',
  subgroup_filter text default ''
)
returns table (
  id uuid,
  name_th text,
  name_en text,
  nickname text,
  nickname_en text,
  major text,
  main_group text,
  subgroup text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    p.name_th,
    p.name_en,
    p.nickname,
    p.nickname_en,
    p.major,
    ga.main_group,
    ga.subgroup
  from public.profiles p
  left join public.group_assignments ga on ga.profile_id = p.id
  where (
    coalesce(btrim(search_text), '') = ''
    or p.name_th ilike '%' || btrim(search_text) || '%'
    or p.name_en ilike '%' || btrim(search_text) || '%'
    or p.nickname ilike '%' || btrim(search_text) || '%'
    or p.nickname_en ilike '%' || btrim(search_text) || '%'
    or p.major ilike '%' || btrim(search_text) || '%'
  )
  and (
    coalesce(btrim(major_filter), '') = ''
    or public.normalize_major(p.major) = public.normalize_major(major_filter)
    or p.major ilike '%' || btrim(major_filter) || '%'
  )
  and (
    coalesce(btrim(main_group_filter), '') = ''
    or ga.main_group = btrim(main_group_filter)
  )
  and (
    coalesce(btrim(subgroup_filter), '') = ''
    or ga.subgroup = btrim(subgroup_filter)
  )
  order by p.name_th nulls last, p.name_en nulls last;
$$;

create or replace function public.update_profile_admin(input_profile_id uuid, input_new_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_profile jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select to_jsonb(p) into old_profile from public.profiles p where p.id = input_profile_id;
  if old_profile is null then
    raise exception 'profile not found';
  end if;

  update public.profiles
  set
    email = case when input_new_data ? 'email' then lower(public.clean_placeholder_text(input_new_data->>'email')) else email end,
    student_id = case when input_new_data ? 'student_id' then public.clean_placeholder_text(input_new_data->>'student_id') else student_id end,
    name_th = case when input_new_data ? 'name_th' then public.clean_placeholder_text(input_new_data->>'name_th') else name_th end,
    name_en = case when input_new_data ? 'name_en' then public.clean_placeholder_text(input_new_data->>'name_en') else name_en end,
    nickname = case when input_new_data ? 'nickname' then public.clean_placeholder_text(input_new_data->>'nickname') else nickname end,
    nickname_en = case when input_new_data ? 'nickname_en' then public.clean_placeholder_text(input_new_data->>'nickname_en') else nickname_en end,
    major = case when input_new_data ? 'major' then public.normalize_major(input_new_data->>'major') else major end,
    phone = case when input_new_data ? 'phone' then public.normalize_phone(input_new_data->>'phone') else phone end,
    emergency_phone = case when input_new_data ? 'emergency_phone' then public.normalize_phone(input_new_data->>'emergency_phone') else emergency_phone end,
    line_id = case when input_new_data ? 'line_id' then public.clean_placeholder_text(input_new_data->>'line_id') else line_id end,
    instagram = case when input_new_data ? 'instagram' then public.clean_placeholder_text(input_new_data->>'instagram') else instagram end,
    facebook = case when input_new_data ? 'facebook' then public.clean_placeholder_text(input_new_data->>'facebook') else facebook end,
    other_contact = case when input_new_data ? 'other_contact' then public.clean_placeholder_text(input_new_data->>'other_contact') else other_contact end,
    food_allergy = case when input_new_data ? 'food_allergy' then public.clean_placeholder_text(input_new_data->>'food_allergy') else food_allergy end,
    disease = case when input_new_data ? 'disease' then public.clean_placeholder_text(input_new_data->>'disease') else disease end,
    drug_allergy = case when input_new_data ? 'drug_allergy' then public.clean_placeholder_text(input_new_data->>'drug_allergy') else drug_allergy end,
    admission_round = case when input_new_data ? 'admission_round' then public.clean_placeholder_text(input_new_data->>'admission_round') else admission_round end,
    gender = case when input_new_data ? 'gender' then public.clean_placeholder_text(input_new_data->>'gender') else gender end,
    hometown = case when input_new_data ? 'hometown' then public.clean_placeholder_text(input_new_data->>'hometown') else hometown end,
    interests = case when input_new_data ? 'interests' then public.clean_placeholder_text(input_new_data->>'interests') else interests end,
    public_profile = public.safe_jsonb_boolean(input_new_data, 'public_profile', public_profile),
    show_instagram = public.safe_jsonb_boolean(input_new_data, 'show_instagram', show_instagram),
    show_line_id = public.safe_jsonb_boolean(input_new_data, 'show_line_id', show_line_id),
    updated_at = now()
  where id = input_profile_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (input_profile_id, auth.uid(), 'direct_update', old_profile, input_new_data);
end;
$$;

create or replace function public.submit_edit_request(
  input_email text,
  input_phone text,
  input_profile_id uuid,
  input_new_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  allowed_keys text[] := array[
    'nickname',
    'nickname_en',
    'phone',
    'emergency_phone',
    'line_id',
    'instagram',
    'facebook',
    'other_contact',
    'food_allergy',
    'disease',
    'drug_allergy',
    'public_profile',
    'show_instagram',
    'show_line_id'
  ];
  clean_new_data jsonb := '{}'::jsonb;
  item record;
begin
  select *
  into profile_row
  from public.profiles
  where id = input_profile_id
    and lower(email) = lower(btrim(input_email))
    and public.normalize_phone(phone) = public.normalize_phone(input_phone);

  if not found then
    raise exception 'identity verification failed';
  end if;

  for item in select key, value from jsonb_each(input_new_data)
  loop
    if item.key = any(allowed_keys) then
      if item.key in ('public_profile', 'show_instagram', 'show_line_id') then
        if jsonb_typeof(item.value) = 'boolean' then
          clean_new_data := clean_new_data || jsonb_build_object(item.key, item.value);
        elsif lower(btrim(item.value #>> '{}')) in ('true', 'false', '1', '0', 'yes', 'no', 'on', 'off') then
          clean_new_data := clean_new_data || jsonb_build_object(item.key, public.safe_jsonb_boolean(jsonb_build_object(item.key, item.value), item.key, false));
        end if;
      elsif item.key in ('phone', 'emergency_phone') then
        clean_new_data := clean_new_data || jsonb_build_object(item.key, public.normalize_phone(item.value #>> '{}'));
      else
        clean_new_data := clean_new_data || jsonb_build_object(item.key, public.clean_placeholder_text(item.value #>> '{}'));
      end if;
    end if;
  end loop;

  insert into public.edit_requests (profile_id, requested_by_email, old_data, new_data, status)
  values (
    profile_row.id,
    profile_row.email,
    to_jsonb(profile_row) - array['id', 'email', 'student_id', 'name_th', 'name_en', 'major', 'created_at', 'updated_at'],
    clean_new_data,
    'pending'
  );
end;
$$;

create or replace function public.approve_edit_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.edit_requests;
  old_profile jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select * into request_row
  from public.edit_requests
  where id = request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'pending request not found';
  end if;

  select to_jsonb(p) into old_profile from public.profiles p where p.id = request_row.profile_id;

  update public.profiles
  set
    nickname = case when request_row.new_data ? 'nickname' then public.clean_placeholder_text(request_row.new_data->>'nickname') else nickname end,
    nickname_en = case when request_row.new_data ? 'nickname_en' then public.clean_placeholder_text(request_row.new_data->>'nickname_en') else nickname_en end,
    phone = case when request_row.new_data ? 'phone' then public.normalize_phone(request_row.new_data->>'phone') else phone end,
    emergency_phone = case when request_row.new_data ? 'emergency_phone' then public.normalize_phone(request_row.new_data->>'emergency_phone') else emergency_phone end,
    line_id = case when request_row.new_data ? 'line_id' then public.clean_placeholder_text(request_row.new_data->>'line_id') else line_id end,
    instagram = case when request_row.new_data ? 'instagram' then public.clean_placeholder_text(request_row.new_data->>'instagram') else instagram end,
    facebook = case when request_row.new_data ? 'facebook' then public.clean_placeholder_text(request_row.new_data->>'facebook') else facebook end,
    other_contact = case when request_row.new_data ? 'other_contact' then public.clean_placeholder_text(request_row.new_data->>'other_contact') else other_contact end,
    food_allergy = case when request_row.new_data ? 'food_allergy' then public.clean_placeholder_text(request_row.new_data->>'food_allergy') else food_allergy end,
    disease = case when request_row.new_data ? 'disease' then public.clean_placeholder_text(request_row.new_data->>'disease') else disease end,
    drug_allergy = case when request_row.new_data ? 'drug_allergy' then public.clean_placeholder_text(request_row.new_data->>'drug_allergy') else drug_allergy end,
    public_profile = public.safe_jsonb_boolean(request_row.new_data, 'public_profile', public_profile),
    show_instagram = public.safe_jsonb_boolean(request_row.new_data, 'show_instagram', show_instagram),
    show_line_id = public.safe_jsonb_boolean(request_row.new_data, 'show_line_id', show_line_id),
    updated_at = now()
  where id = request_row.profile_id;

  update public.edit_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = request_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (request_row.profile_id, auth.uid(), 'approve_edit_request', old_profile, request_row.new_data);
end;
$$;

insert into storage.buckets (id, name, public)
values ('document-templates', 'document-templates', false),
       ('document-outputs', 'document-outputs', false)
on conflict (id) do update set public = false;

with numbered as (
  select
    id,
    row_number() over (
      partition by template_id, document_type
      order by coalesce(generated_at, created_at), id
    ) as safe_version
  from public.generated_documents
  where template_id is not null
)
update public.generated_documents gd
set version = numbered.safe_version
from numbered
where gd.id = numbered.id
  and gd.version is distinct from numbered.safe_version;

create unique index if not exists generated_documents_template_type_version_unique
on public.generated_documents(template_id, document_type, version)
where template_id is not null;

create or replace function public.save_document_project_profile(input_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_data jsonb := coalesce(input_data->'profile', '{}'::jsonb);
  budget_data jsonb := coalesce(input_data->'budgetItems', '[]'::jsonb);
  schedule_data jsonb := coalesce(input_data->'scheduleItems', '[]'::jsonb);
  venue_data jsonb := coalesce(input_data->'venues', '[]'::jsonb);
  equipment_data jsonb := coalesce(input_data->'equipmentItems', '[]'::jsonb);
  profile_id uuid;
  saved_profile public.document_project_profiles;
  item jsonb;
  budget_total numeric := 0;
  freshmen integer;
  staff integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  profile_id := nullif(profile_data->>'id', '')::uuid;

  select coalesce(sum(coalesce(nullif(item->>'quantity', '')::numeric, 0) * coalesce(nullif(item->>'unit_price', '')::numeric, 0)), 0)
  into budget_total
  from jsonb_array_elements(budget_data) item
  where public.clean_placeholder_text(item->>'item_name') is not null;

  freshmen := nullif(profile_data->>'freshmen_count', '')::integer;
  staff := nullif(profile_data->>'staff_count', '')::integer;

  if profile_id is null then
    insert into public.document_project_profiles (
      project_name, project_code, academic_year, organizer, department, objective, objectives,
      rationale, expected_outcomes, kpi_summary, risk_plan, location, start_date, end_date,
      event_date, document_date, event_start_time, event_end_time, contact_name, contact_phone,
      coordinator_name, coordinator_phone, coordinator_email, advisor_name, advisor_position,
      project_chair_name, project_chair_position, signing_person_name, signing_person_position,
      freshmen_count, staff_count, total_participants, budget_total, budget_source, notes,
      created_by, updated_by
    )
    values (
      public.clean_placeholder_text(profile_data->>'project_name'),
      public.clean_placeholder_text(profile_data->>'project_code'),
      public.clean_placeholder_text(profile_data->>'academic_year'),
      public.clean_placeholder_text(profile_data->>'organizer'),
      public.clean_placeholder_text(profile_data->>'department'),
      public.clean_placeholder_text(profile_data->>'objective'),
      public.clean_placeholder_text(profile_data->>'objectives'),
      public.clean_placeholder_text(profile_data->>'rationale'),
      public.clean_placeholder_text(profile_data->>'expected_outcomes'),
      public.clean_placeholder_text(profile_data->>'kpi_summary'),
      public.clean_placeholder_text(profile_data->>'risk_plan'),
      public.clean_placeholder_text(profile_data->>'location'),
      nullif(profile_data->>'start_date', '')::date,
      nullif(profile_data->>'end_date', '')::date,
      nullif(profile_data->>'event_date', '')::date,
      nullif(profile_data->>'document_date', '')::date,
      nullif(profile_data->>'event_start_time', '')::time,
      nullif(profile_data->>'event_end_time', '')::time,
      public.clean_placeholder_text(profile_data->>'contact_name'),
      public.clean_placeholder_text(profile_data->>'contact_phone'),
      public.clean_placeholder_text(profile_data->>'coordinator_name'),
      public.clean_placeholder_text(profile_data->>'coordinator_phone'),
      lower(public.clean_placeholder_text(profile_data->>'coordinator_email')),
      public.clean_placeholder_text(profile_data->>'advisor_name'),
      public.clean_placeholder_text(profile_data->>'advisor_position'),
      public.clean_placeholder_text(profile_data->>'project_chair_name'),
      public.clean_placeholder_text(profile_data->>'project_chair_position'),
      public.clean_placeholder_text(profile_data->>'signing_person_name'),
      public.clean_placeholder_text(profile_data->>'signing_person_position'),
      freshmen,
      staff,
      coalesce(nullif(profile_data->>'total_participants', '')::integer, case when freshmen is not null or staff is not null then coalesce(freshmen, 0) + coalesce(staff, 0) else null end),
      budget_total,
      public.clean_placeholder_text(profile_data->>'budget_source'),
      public.clean_placeholder_text(profile_data->>'notes'),
      auth.uid(),
      auth.uid()
    )
    returning * into saved_profile;
  else
    update public.document_project_profiles
    set project_name = public.clean_placeholder_text(profile_data->>'project_name'),
        project_code = public.clean_placeholder_text(profile_data->>'project_code'),
        academic_year = public.clean_placeholder_text(profile_data->>'academic_year'),
        organizer = public.clean_placeholder_text(profile_data->>'organizer'),
        department = public.clean_placeholder_text(profile_data->>'department'),
        objective = public.clean_placeholder_text(profile_data->>'objective'),
        objectives = public.clean_placeholder_text(profile_data->>'objectives'),
        rationale = public.clean_placeholder_text(profile_data->>'rationale'),
        expected_outcomes = public.clean_placeholder_text(profile_data->>'expected_outcomes'),
        kpi_summary = public.clean_placeholder_text(profile_data->>'kpi_summary'),
        risk_plan = public.clean_placeholder_text(profile_data->>'risk_plan'),
        location = public.clean_placeholder_text(profile_data->>'location'),
        start_date = nullif(profile_data->>'start_date', '')::date,
        end_date = nullif(profile_data->>'end_date', '')::date,
        event_date = nullif(profile_data->>'event_date', '')::date,
        document_date = nullif(profile_data->>'document_date', '')::date,
        event_start_time = nullif(profile_data->>'event_start_time', '')::time,
        event_end_time = nullif(profile_data->>'event_end_time', '')::time,
        contact_name = public.clean_placeholder_text(profile_data->>'contact_name'),
        contact_phone = public.clean_placeholder_text(profile_data->>'contact_phone'),
        coordinator_name = public.clean_placeholder_text(profile_data->>'coordinator_name'),
        coordinator_phone = public.clean_placeholder_text(profile_data->>'coordinator_phone'),
        coordinator_email = lower(public.clean_placeholder_text(profile_data->>'coordinator_email')),
        advisor_name = public.clean_placeholder_text(profile_data->>'advisor_name'),
        advisor_position = public.clean_placeholder_text(profile_data->>'advisor_position'),
        project_chair_name = public.clean_placeholder_text(profile_data->>'project_chair_name'),
        project_chair_position = public.clean_placeholder_text(profile_data->>'project_chair_position'),
        signing_person_name = public.clean_placeholder_text(profile_data->>'signing_person_name'),
        signing_person_position = public.clean_placeholder_text(profile_data->>'signing_person_position'),
        freshmen_count = freshmen,
        staff_count = staff,
        total_participants = coalesce(nullif(profile_data->>'total_participants', '')::integer, case when freshmen is not null or staff is not null then coalesce(freshmen, 0) + coalesce(staff, 0) else null end),
        budget_total = budget_total,
        budget_source = public.clean_placeholder_text(profile_data->>'budget_source'),
        notes = public.clean_placeholder_text(profile_data->>'notes'),
        updated_by = auth.uid(),
        updated_at = now()
    where id = profile_id
    returning * into saved_profile;
  end if;

  if saved_profile.id is null then
    raise exception 'document project profile not found';
  end if;

  delete from public.document_budget_items where project_profile_id = saved_profile.id;
  delete from public.document_schedule_items where project_profile_id = saved_profile.id;
  delete from public.document_venues where project_profile_id = saved_profile.id;
  delete from public.document_equipment_items where project_profile_id = saved_profile.id;

  for item in select * from jsonb_array_elements(budget_data)
  loop
    if public.clean_placeholder_text(item->>'item_name') is not null then
      insert into public.document_budget_items (project_profile_id, item_name, quantity, unit, unit_price, notes)
      values (
        saved_profile.id,
        public.clean_placeholder_text(item->>'item_name'),
        nullif(item->>'quantity', '')::numeric,
        public.clean_placeholder_text(item->>'unit'),
        nullif(item->>'unit_price', '')::numeric,
        public.clean_placeholder_text(item->>'notes')
      );
    end if;
  end loop;

  for item in select * from jsonb_array_elements(schedule_data)
  loop
    if public.clean_placeholder_text(item->>'title') is not null then
      insert into public.document_schedule_items (project_profile_id, item_date, start_time, end_time, time_range, duration_minutes, title, description, location, responsible, responsible_team, sort_order)
      values (
        saved_profile.id,
        nullif(item->>'item_date', '')::date,
        nullif(item->>'start_time', '')::time,
        nullif(item->>'end_time', '')::time,
        public.clean_placeholder_text(item->>'time_range'),
        nullif(item->>'duration_minutes', '')::integer,
        public.clean_placeholder_text(item->>'title'),
        public.clean_placeholder_text(item->>'description'),
        public.clean_placeholder_text(item->>'location'),
        public.clean_placeholder_text(item->>'responsible'),
        public.clean_placeholder_text(item->>'responsible_team'),
        nullif(item->>'sort_order', '')::integer
      );
    end if;
  end loop;

  for item in select * from jsonb_array_elements(venue_data)
  loop
    if public.clean_placeholder_text(item->>'name') is not null then
      insert into public.document_venues (project_profile_id, name, address, capacity, use_date, start_time, end_time, purpose, participant_count, needs_electricity, needs_sound_system, needs_air_conditioning, needs_cleaning_staff, note, notes)
      values (
        saved_profile.id,
        public.clean_placeholder_text(item->>'name'),
        public.clean_placeholder_text(item->>'address'),
        nullif(item->>'capacity', '')::integer,
        nullif(item->>'use_date', '')::date,
        nullif(item->>'start_time', '')::time,
        nullif(item->>'end_time', '')::time,
        public.clean_placeholder_text(item->>'purpose'),
        nullif(item->>'participant_count', '')::integer,
        public.safe_jsonb_boolean(item, 'needs_electricity', false),
        public.safe_jsonb_boolean(item, 'needs_sound_system', false),
        public.safe_jsonb_boolean(item, 'needs_air_conditioning', false),
        public.safe_jsonb_boolean(item, 'needs_cleaning_staff', false),
        public.clean_placeholder_text(item->>'note'),
        public.clean_placeholder_text(item->>'notes')
      );
    end if;
  end loop;

  for item in select * from jsonb_array_elements(equipment_data)
  loop
    if public.clean_placeholder_text(item->>'name') is not null then
      insert into public.document_equipment_items (project_profile_id, name, quantity, unit, borrow_date, return_date, use_location, responsible, responsible_person, status, note, notes)
      values (
        saved_profile.id,
        public.clean_placeholder_text(item->>'name'),
        nullif(item->>'quantity', '')::integer,
        public.clean_placeholder_text(item->>'unit'),
        nullif(item->>'borrow_date', '')::date,
        nullif(item->>'return_date', '')::date,
        public.clean_placeholder_text(item->>'use_location'),
        public.clean_placeholder_text(item->>'responsible'),
        public.clean_placeholder_text(item->>'responsible_person'),
        coalesce(nullif(item->>'status', ''), 'draft'),
        public.clean_placeholder_text(item->>'note'),
        public.clean_placeholder_text(item->>'notes')
      );
    end if;
  end loop;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'document_project_profile_saved', '{}'::jsonb, jsonb_build_object('project_profile_id', saved_profile.id, 'budget_total', budget_total));

  return to_jsonb(saved_profile);
end;
$$;

create or replace function public.create_generated_document_record(input_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_id uuid := nullif(input_data->>'id', '')::uuid;
  template_id_value uuid := nullif(input_data->>'template_id', '')::uuid;
  document_type_value text := coalesce(nullif(input_data->>'document_type', ''), 'custom');
  next_version integer;
  row public.generated_documents;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(coalesce(template_id_value::text, 'no-template') || ':' || document_type_value, 0));

  if existing_id is not null then
    update public.generated_documents
    set file_name = coalesce(public.clean_placeholder_text(input_data->>'file_name'), file_name),
        title = coalesce(public.clean_placeholder_text(input_data->>'title'), title),
        status = coalesce(public.clean_placeholder_text(input_data->>'status'), status),
        output_docx_path = case when input_data ? 'output_docx_path' then public.clean_placeholder_text(input_data->>'output_docx_path') else output_docx_path end,
        placeholders = case when input_data ? 'placeholders' then input_data->'placeholders' else placeholders end,
        snapshot_data = case when input_data ? 'snapshot_data' then input_data->'snapshot_data' else snapshot_data end,
        missing_fields = case when input_data ? 'missing_fields' then coalesce(array(select jsonb_array_elements_text(input_data->'missing_fields')), '{}'::text[]) else missing_fields end,
        preview_html = case when input_data ? 'preview_html' then input_data->>'preview_html' else preview_html end,
        generated_at = coalesce(nullif(input_data->>'generated_at', '')::timestamptz, generated_at)
    where id = existing_id
    returning * into row;
    return to_jsonb(row);
  end if;

  select coalesce(max(version), 0) + 1
  into next_version
  from public.generated_documents
  where template_id is not distinct from template_id_value
    and document_type = document_type_value;

  insert into public.generated_documents (
    project_profile_id, template_id, file_name, title, document_type, version, status,
    output_docx_path, placeholders, snapshot_data, missing_fields, preview_html, generated_by, generated_at
  )
  values (
    nullif(input_data->>'project_profile_id', '')::uuid,
    template_id_value,
    public.clean_placeholder_text(input_data->>'file_name'),
    public.clean_placeholder_text(input_data->>'title'),
    document_type_value,
    next_version,
    coalesce(public.clean_placeholder_text(input_data->>'status'), 'generated'),
    public.clean_placeholder_text(input_data->>'output_docx_path'),
    coalesce(input_data->'placeholders', '{}'::jsonb),
    coalesce(input_data->'snapshot_data', '{}'::jsonb),
    coalesce(array(select jsonb_array_elements_text(coalesce(input_data->'missing_fields', '[]'::jsonb))), '{}'::text[]),
    input_data->>'preview_html',
    auth.uid(),
    now()
  )
  returning * into row;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'generated_document_recorded', '{}'::jsonb, jsonb_build_object('generated_document_id', row.id, 'version', row.version));

  return to_jsonb(row);
end;
$$;

update storage.buckets
set public = false
where id in ('document-templates', 'document-outputs');

grant select on public.public_profiles to anon, authenticated;
grant execute on function public.safe_jsonb_boolean(jsonb, text, boolean) to anon, authenticated;
grant execute on function public.search_public_profiles(text, text, text, text) to anon, authenticated;
grant execute on function public.update_profile_admin(uuid, jsonb) to authenticated;
grant execute on function public.submit_edit_request(text, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.approve_edit_request(uuid) to authenticated;
grant execute on function public.save_document_project_profile(jsonb) to authenticated;
grant execute on function public.create_generated_document_record(jsonb) to authenticated;
