create table if not exists public.profiles_import_2569_new (
  id uuid primary key default gen_random_uuid(),
  source_order integer,
  email_raw text,
  student_id_raw text,
  name_th_raw text,
  name_en_raw text,
  nickname_raw text,
  major_raw text,
  phone_raw text,
  emergency_phone_raw text,
  line_id_raw text,
  instagram_raw text,
  facebook_raw text,
  other_contact_raw text,
  disease_raw text,
  drug_allergy_raw text,
  food_allergy_raw text,
  gender_raw text,
  hometown_raw text,
  interests_raw text,
  import_status text default 'pending',
  import_note text,
  created_at timestamptz default now()
);

alter table public.profiles_import_2569_new enable row level security;

drop policy if exists "Admins can read profiles reimport staging" on public.profiles_import_2569_new;
create policy "Admins can read profiles reimport staging"
on public.profiles_import_2569_new for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can insert profiles reimport staging" on public.profiles_import_2569_new;
create policy "Admins can insert profiles reimport staging"
on public.profiles_import_2569_new for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update profiles reimport staging" on public.profiles_import_2569_new;
create policy "Admins can update profiles reimport staging"
on public.profiles_import_2569_new for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete profiles reimport staging" on public.profiles_import_2569_new;
create policy "Admins can delete profiles reimport staging"
on public.profiles_import_2569_new for delete
to authenticated
using (public.is_admin(auth.uid()));

create table if not exists public.profiles_backup_before_reimport_2569 as
  select * from public.profiles with no data;
create table if not exists public.edit_requests_backup_before_reimport_2569 as
  select * from public.edit_requests with no data;
create table if not exists public.emergency_notes_backup_before_reimport_2569 as
  select * from public.emergency_notes with no data;
create table if not exists public.group_assignments_backup_before_reimport_2569 as
  select * from public.group_assignments with no data;

alter table public.profiles_backup_before_reimport_2569 enable row level security;
alter table public.edit_requests_backup_before_reimport_2569 enable row level security;
alter table public.emergency_notes_backup_before_reimport_2569 enable row level security;
alter table public.group_assignments_backup_before_reimport_2569 enable row level security;

drop policy if exists "Admins can read profiles reimport backup" on public.profiles_backup_before_reimport_2569;
create policy "Admins can read profiles reimport backup"
on public.profiles_backup_before_reimport_2569 for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read edit requests reimport backup" on public.edit_requests_backup_before_reimport_2569;
create policy "Admins can read edit requests reimport backup"
on public.edit_requests_backup_before_reimport_2569 for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read emergency notes reimport backup" on public.emergency_notes_backup_before_reimport_2569;
create policy "Admins can read emergency notes reimport backup"
on public.emergency_notes_backup_before_reimport_2569 for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read group assignments reimport backup" on public.group_assignments_backup_before_reimport_2569;
create policy "Admins can read group assignments reimport backup"
on public.group_assignments_backup_before_reimport_2569 for select
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.preview_profiles_reimport_2569()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  with cleaned as (
    select
      id,
      source_order,
      public.normalize_import_email(email_raw) as email,
      public.clean_import_text(student_id_raw) as student_id,
      public.clean_import_text(name_th_raw) as name_th,
      public.clean_import_text(name_en_raw) as name_en,
      public.clean_import_text(nickname_raw) as nickname,
      public.clean_import_text(major_raw) as major,
      public.normalize_import_phone(phone_raw) as phone,
      public.normalize_import_phone(emergency_phone_raw) as emergency_phone,
      public.clean_import_text(line_id_raw) as line_id,
      public.clean_import_text(instagram_raw) as instagram,
      public.clean_import_text(facebook_raw) as facebook
    from public.profiles_import_2569_new
  ),
  duplicate_emails as (
    select email, count(*) as count
    from cleaned
    where email is not null
    group by email
    having count(*) > 1
  ),
  duplicate_student_ids as (
    select student_id, count(*) as count
    from cleaned
    where student_id is not null
    group by student_id
    having count(*) > 1
  ),
  missing_rows as (
    select id, source_order, email, student_id, name_th, name_en,
      array_remove(array[
        case when email is null then 'email' end,
        case when coalesce(name_th, name_en) is null then 'name' end,
        case when phone is null then 'phone' end
      ], null) as missing_fields
    from cleaned
    where email is null
       or coalesce(name_th, name_en) is null
       or phone is null
  )
  select jsonb_build_object(
    'total_staging_rows', (select count(*) from cleaned),
    'rows_with_email', (select count(*) from cleaned where email is not null),
    'rows_with_name', (select count(*) from cleaned where coalesce(name_th, name_en) is not null),
    'duplicate_emails', coalesce((select jsonb_agg(to_jsonb(duplicate_emails) order by email) from duplicate_emails), '[]'::jsonb),
    'duplicate_student_ids', coalesce((select jsonb_agg(to_jsonb(duplicate_student_ids) order by student_id) from duplicate_student_ids), '[]'::jsonb),
    'rows_missing_important_fields', coalesce((select jsonb_agg(to_jsonb(missing_rows) order by source_order nulls last, id) from missing_rows), '[]'::jsonb),
    'sample_rows', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id,
        'source_order', source_order,
        'email', email,
        'student_id', student_id,
        'name_th', name_th,
        'name_en', name_en,
        'nickname', nickname,
        'major', major,
        'phone', phone,
        'emergency_phone', emergency_phone,
        'line_id', line_id,
        'instagram', instagram,
        'facebook', facebook
      ) order by source_order nulls last, id)
      from (select * from cleaned order by source_order nulls last, id limit 20) sample
    ), '[]'::jsonb)
  )
  into result;

  return result;
end;
$$;

create or replace function public.backup_profiles_before_reimport_2569()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profiles_count integer;
  edit_requests_count integer;
  emergency_notes_count integer;
  group_assignments_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  create table if not exists public.profiles_backup_before_reimport_2569 as
    select * from public.profiles with no data;
  create table if not exists public.edit_requests_backup_before_reimport_2569 as
    select * from public.edit_requests with no data;
  create table if not exists public.emergency_notes_backup_before_reimport_2569 as
    select * from public.emergency_notes with no data;
  create table if not exists public.group_assignments_backup_before_reimport_2569 as
    select * from public.group_assignments with no data;

  if not exists (select 1 from public.profiles_backup_before_reimport_2569) then
    insert into public.profiles_backup_before_reimport_2569 select * from public.profiles;
  end if;
  if not exists (select 1 from public.edit_requests_backup_before_reimport_2569) then
    insert into public.edit_requests_backup_before_reimport_2569 select * from public.edit_requests;
  end if;
  if not exists (select 1 from public.emergency_notes_backup_before_reimport_2569) then
    insert into public.emergency_notes_backup_before_reimport_2569 select * from public.emergency_notes;
  end if;
  if not exists (select 1 from public.group_assignments_backup_before_reimport_2569) then
    insert into public.group_assignments_backup_before_reimport_2569 select * from public.group_assignments;
  end if;

  select count(*) into profiles_count from public.profiles_backup_before_reimport_2569;
  select count(*) into edit_requests_count from public.edit_requests_backup_before_reimport_2569;
  select count(*) into emergency_notes_count from public.emergency_notes_backup_before_reimport_2569;
  select count(*) into group_assignments_count from public.group_assignments_backup_before_reimport_2569;

  return jsonb_build_object(
    'profiles_backup_rows', profiles_count,
    'edit_requests_backup_rows', edit_requests_count,
    'emergency_notes_backup_rows', emergency_notes_count,
    'group_assignments_backup_rows', group_assignments_count
  );
end;
$$;

create or replace function public.replace_profiles_from_import_2569()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_profiles_count integer;
  backup_profiles_count integer;
  staging_rows integer;
  valid_staging_rows integer;
  inserted_profiles integer := 0;
  skipped_rows integer := 0;
  duplicate_warnings jsonb := '{}'::jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select count(*) into existing_profiles_count from public.profiles;

  if to_regclass('public.profiles_backup_before_reimport_2569') is null then
    raise exception 'Run backup_profiles_before_reimport_2569() before replacing profiles';
  end if;

  execute 'select count(*) from public.profiles_backup_before_reimport_2569' into backup_profiles_count;
  if existing_profiles_count > 0 and backup_profiles_count = 0 then
    raise exception 'Backup is empty. Run backup_profiles_before_reimport_2569() before replacing profiles';
  end if;

  select count(*) into staging_rows
  from public.profiles_import_2569_new;

  if staging_rows = 0 then
    raise exception 'No staging rows found in profiles_import_2569_new';
  end if;

  with cleaned as (
    select
      id,
      public.normalize_import_email(email_raw) as email,
      public.clean_import_text(student_id_raw) as student_id,
      public.clean_import_text(name_th_raw) as name_th,
      public.clean_import_text(name_en_raw) as name_en
    from public.profiles_import_2569_new
  ),
  ranked as (
    select *,
      row_number() over (partition by email order by id) as email_rank,
      case
        when student_id is null then 1
        else row_number() over (partition by student_id order by id)
      end as student_id_rank
    from cleaned
  )
  select count(*) into valid_staging_rows
  from ranked
  where email is not null
    and coalesce(name_th, name_en) is not null
    and email_rank = 1
    and student_id_rank = 1;

  if valid_staging_rows = 0 then
    raise exception 'No valid staging rows found. Run preview_profiles_reimport_2569() and fix the CSV before replacing profiles';
  end if;

  with cleaned as (
    select
      id,
      source_order,
      public.normalize_import_email(email_raw) as email,
      public.clean_import_text(student_id_raw) as student_id,
      public.clean_import_text(name_th_raw) as name_th,
      public.clean_import_text(name_en_raw) as name_en,
      public.clean_import_text(nickname_raw) as nickname,
      public.clean_import_text(major_raw) as major,
      public.normalize_import_phone(phone_raw) as phone,
      public.normalize_import_phone(emergency_phone_raw) as emergency_phone,
      public.clean_import_text(line_id_raw) as line_id,
      public.clean_import_text(instagram_raw) as instagram,
      public.clean_import_text(facebook_raw) as facebook,
      public.clean_import_text(other_contact_raw) as other_contact,
      public.clean_import_text(disease_raw) as disease,
      public.clean_import_text(drug_allergy_raw) as drug_allergy,
      public.clean_import_text(food_allergy_raw) as food_allergy,
      public.clean_import_text(gender_raw) as gender,
      public.clean_import_text(hometown_raw) as hometown,
      public.clean_import_text(interests_raw) as interests
    from public.profiles_import_2569_new
  ),
  ranked as (
    select *,
      row_number() over (partition by email order by source_order nulls last, id) as email_rank,
      case
        when student_id is null then 1
        else row_number() over (partition by student_id order by source_order nulls last, id)
      end as student_id_rank
    from cleaned
  ),
  accepted as (
    select *
    from ranked
    where email is not null
      and coalesce(name_th, name_en) is not null
      and email_rank = 1
      and student_id_rank = 1
  ),
  rejected as (
    select id,
      case
        when email is null then 'missing email'
        when coalesce(name_th, name_en) is null then 'missing name'
        when email_rank > 1 then 'duplicate email'
        when student_id_rank > 1 then 'duplicate student_id'
        else 'skipped'
      end as reason
    from ranked
    where not (
      email is not null
      and coalesce(name_th, name_en) is not null
      and email_rank = 1
      and student_id_rank = 1
    )
  )
  select jsonb_build_object(
    'duplicate_emails', coalesce((
      select jsonb_agg(jsonb_build_object('email', email, 'count', count) order by email)
      from (
        select email, count(*) as count
        from cleaned
        where email is not null
        group by email
        having count(*) > 1
      ) d
    ), '[]'::jsonb),
    'duplicate_student_ids', coalesce((
      select jsonb_agg(jsonb_build_object('student_id', student_id, 'count', count) order by student_id)
      from (
        select student_id, count(*) as count
        from cleaned
        where student_id is not null
        group by student_id
        having count(*) > 1
      ) d
    ), '[]'::jsonb)
  )
  into duplicate_warnings;

  delete from public.edit_requests;
  delete from public.emergency_notes;
  delete from public.group_assignments;
  delete from public.profiles;

  with cleaned as (
    select
      id,
      source_order,
      public.normalize_import_email(email_raw) as email,
      public.clean_import_text(student_id_raw) as student_id,
      public.clean_import_text(name_th_raw) as name_th,
      public.clean_import_text(name_en_raw) as name_en,
      public.clean_import_text(nickname_raw) as nickname,
      public.clean_import_text(major_raw) as major,
      public.normalize_import_phone(phone_raw) as phone,
      public.normalize_import_phone(emergency_phone_raw) as emergency_phone,
      public.clean_import_text(line_id_raw) as line_id,
      public.clean_import_text(instagram_raw) as instagram,
      public.clean_import_text(facebook_raw) as facebook,
      public.clean_import_text(other_contact_raw) as other_contact,
      public.clean_import_text(disease_raw) as disease,
      public.clean_import_text(drug_allergy_raw) as drug_allergy,
      public.clean_import_text(food_allergy_raw) as food_allergy,
      public.clean_import_text(gender_raw) as gender,
      public.clean_import_text(hometown_raw) as hometown,
      public.clean_import_text(interests_raw) as interests
    from public.profiles_import_2569_new
  ),
  ranked as (
    select *,
      row_number() over (partition by email order by source_order nulls last, id) as email_rank,
      case
        when student_id is null then 1
        else row_number() over (partition by student_id order by source_order nulls last, id)
      end as student_id_rank
    from cleaned
  ),
  accepted as (
    select *
    from ranked
    where email is not null
      and coalesce(name_th, name_en) is not null
      and email_rank = 1
      and student_id_rank = 1
  )
  insert into public.profiles (
    id,
    email,
    student_id,
    name_th,
    name_en,
    nickname,
    major,
    phone,
    emergency_phone,
    line_id,
    instagram,
    facebook,
    other_contact,
    disease,
    drug_allergy,
    food_allergy,
    gender,
    hometown,
    interests,
    public_profile,
    show_instagram,
    show_line_id
  )
  select
    id,
    email,
    student_id,
    name_th,
    name_en,
    nickname,
    major,
    phone,
    emergency_phone,
    line_id,
    instagram,
    facebook,
    other_contact,
    disease,
    drug_allergy,
    food_allergy,
    gender,
    hometown,
    interests,
    false,
    false,
    false
  from accepted;

  get diagnostics inserted_profiles = row_count;

  with cleaned as (
    select
      id,
      public.normalize_import_email(email_raw) as email,
      public.clean_import_text(student_id_raw) as student_id,
      public.clean_import_text(name_th_raw) as name_th,
      public.clean_import_text(name_en_raw) as name_en
    from public.profiles_import_2569_new
  ),
  ranked as (
    select *,
      row_number() over (partition by email order by id) as email_rank,
      case
        when student_id is null then 1
        else row_number() over (partition by student_id order by id)
      end as student_id_rank
    from cleaned
  )
  select count(*) into skipped_rows
  from ranked
  where email is null
     or coalesce(name_th, name_en) is null
     or email_rank > 1
     or student_id_rank > 1;

  update public.profiles_import_2569_new staging
  set import_status = case when imported.id is null then 'skipped' else 'imported' end,
      import_note = case when imported.id is null then 'Skipped during replacement. Check preview for missing or duplicate fields.' else 'Imported into public.profiles.' end
  from (
    select p.id from public.profiles p
  ) imported
  where staging.id = imported.id;

  update public.profiles_import_2569_new
  set import_status = 'skipped',
      import_note = coalesce(import_note, 'Skipped during replacement. Check preview for missing or duplicate fields.')
  where import_status is null or import_status = 'pending';

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (
    null,
    auth.uid(),
    'replace_profiles_from_import_2569',
    jsonb_build_object('previous_profiles_count', existing_profiles_count),
    jsonb_build_object(
      'inserted_profiles', inserted_profiles,
      'skipped_rows', skipped_rows,
      'duplicate_warnings', duplicate_warnings
    )
  );

  return jsonb_build_object(
    'inserted_profiles', inserted_profiles,
    'skipped_rows', skipped_rows,
    'duplicate_warnings', duplicate_warnings
  );
end;
$$;

grant execute on function public.preview_profiles_reimport_2569() to authenticated;
grant execute on function public.backup_profiles_before_reimport_2569() to authenticated;
grant execute on function public.replace_profiles_from_import_2569() to authenticated;
