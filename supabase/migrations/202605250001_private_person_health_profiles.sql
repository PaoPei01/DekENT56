create table if not exists public.person_health_profiles (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  medical_condition text,
  chronic_condition text,
  food_allergy text,
  drug_allergy text,
  health_note text,
  source text default 'manual',
  confirmed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists person_health_profiles_person_unique
  on public.person_health_profiles (person_id);

drop trigger if exists person_health_profiles_touch_updated_at on public.person_health_profiles;
create trigger person_health_profiles_touch_updated_at
before update on public.person_health_profiles
for each row execute function public.touch_updated_at();

alter table public.person_health_profiles enable row level security;

drop policy if exists "admins manage person health profiles" on public.person_health_profiles;
create policy "admins manage person health profiles"
on public.person_health_profiles for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

revoke all on public.person_health_profiles from anon;
grant select, insert, update, delete on public.person_health_profiles to authenticated;

create or replace function public.get_person_health_profile_for_application(
  input_event_slug text,
  input_student_id text,
  input_email text,
  input_phone text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.events%rowtype;
  person_row public.people%rowtype;
  health_row public.person_health_profiles%rowtype;
  student_id_value text := public.clean_placeholder_text(input_student_id);
  email_value text := public.normalize_cmu_email(input_email);
  phone_value text := public.normalize_phone(input_phone);
begin
  select * into event_row
  from public.events
  where slug = public.clean_placeholder_text(input_event_slug)
    and visibility = 'public'
    and status in ('staff_recruiting', 'registration_open', 'active')
  limit 1;

  if event_row.id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'event_not_open',
      'message_th', 'กิจกรรมนี้ยังไม่เปิดรับสมัคร',
      'health_profile', null
    );
  end if;

  if student_id_value is null then
    return jsonb_build_object(
      'success', false,
      'code', 'student_id_required',
      'message_th', 'กรุณากรอกรหัสนักศึกษา',
      'health_profile', null
    );
  end if;

  if not public.is_valid_cmu_email(email_value) then
    return jsonb_build_object(
      'success', false,
      'code', 'invalid_cmu_email',
      'message_th', 'กรุณากรอก CMU Mail ที่ลงท้ายด้วย @cmu.ac.th เท่านั้น',
      'health_profile', null
    );
  end if;

  select * into person_row
  from public.people p
  where public.clean_placeholder_text(p.student_id) = student_id_value
    and p.merged_into is null
  order by p.updated_at desc nulls last, p.created_at desc nulls last
  limit 1;

  if person_row.id is null or public.normalize_cmu_email(person_row.email) <> email_value then
    return jsonb_build_object(
      'success', true,
      'code', 'identity_not_verified',
      'message_th', 'ยังไม่สามารถยืนยันตัวตนสำหรับดึงข้อมูลสุขภาพเดิมได้',
      'health_profile', null
    );
  end if;

  if phone_value is not null and public.normalize_phone(person_row.phone) is not null and public.normalize_phone(person_row.phone) <> phone_value then
    return jsonb_build_object(
      'success', true,
      'code', 'identity_not_verified',
      'message_th', 'ยังไม่สามารถยืนยันตัวตนสำหรับดึงข้อมูลสุขภาพเดิมได้',
      'health_profile', null
    );
  end if;

  select * into health_row
  from public.person_health_profiles
  where person_id = person_row.id
  limit 1;

  if health_row.id is null then
    return jsonb_build_object(
      'success', true,
      'code', 'not_found',
      'message_th', 'ไม่พบข้อมูลสุขภาพเดิม',
      'health_profile', null
    );
  end if;

  return jsonb_build_object(
    'success', true,
    'code', 'found',
    'message_th', 'พบข้อมูลสุขภาพเดิม',
    'health_profile', jsonb_build_object(
      'medical_condition', health_row.medical_condition,
      'chronic_condition', health_row.chronic_condition,
      'food_allergy', health_row.food_allergy,
      'drug_allergy', health_row.drug_allergy,
      'health_note', health_row.health_note,
      'confirmed_at', health_row.confirmed_at,
      'updated_at', health_row.updated_at
    )
  );
end;
$$;

create or replace function public.upsert_person_health_profile_admin(
  input_student_id text,
  input_medical_condition text default '',
  input_chronic_condition text default '',
  input_food_allergy text default '',
  input_drug_allergy text default '',
  input_health_note text default '',
  input_source text default 'admin_import'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  student_id_value text := public.clean_placeholder_text(input_student_id);
  person_row public.people%rowtype;
  health_row public.person_health_profiles%rowtype;
begin
  if not public.is_admin(auth.uid()) then
    return jsonb_build_object('success', false, 'code', 'forbidden', 'message_th', 'สำหรับผู้ดูแลระบบเท่านั้น');
  end if;

  if student_id_value is null then
    return jsonb_build_object('success', false, 'code', 'student_id_required', 'message_th', 'กรุณาระบุรหัสนักศึกษา');
  end if;

  select * into person_row
  from public.people p
  where public.clean_placeholder_text(p.student_id) = student_id_value
    and p.merged_into is null
  order by p.updated_at desc nulls last, p.created_at desc nulls last
  limit 1;

  if person_row.id is null then
    return jsonb_build_object('success', false, 'code', 'person_not_found', 'message_th', 'ไม่พบข้อมูลนักศึกษานี้');
  end if;

  insert into public.person_health_profiles (
    person_id,
    medical_condition,
    chronic_condition,
    food_allergy,
    drug_allergy,
    health_note,
    source,
    updated_at
  )
  values (
    person_row.id,
    public.clean_placeholder_text(input_medical_condition),
    public.clean_placeholder_text(input_chronic_condition),
    public.clean_placeholder_text(input_food_allergy),
    public.clean_placeholder_text(input_drug_allergy),
    public.clean_placeholder_text(input_health_note),
    coalesce(public.clean_placeholder_text(input_source), 'admin_import'),
    now()
  )
  on conflict (person_id) do update
  set medical_condition = excluded.medical_condition,
      chronic_condition = excluded.chronic_condition,
      food_allergy = excluded.food_allergy,
      drug_allergy = excluded.drug_allergy,
      health_note = excluded.health_note,
      source = excluded.source,
      updated_at = now()
  returning * into health_row;

  return jsonb_build_object(
    'success', true,
    'code', 'upserted',
    'message_th', 'บันทึกข้อมูลสุขภาพแล้ว',
    'health_profile_id', health_row.id
  );
end;
$$;

revoke all on function public.get_person_health_profile_for_application(text, text, text, text) from public;
grant execute on function public.get_person_health_profile_for_application(text, text, text, text) to anon, authenticated;

revoke all on function public.upsert_person_health_profile_admin(text, text, text, text, text, text, text) from public;
grant execute on function public.upsert_person_health_profile_admin(text, text, text, text, text, text, text) to authenticated;
