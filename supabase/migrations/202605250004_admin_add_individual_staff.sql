create or replace function public.lookup_person_for_staff_add_admin(input_student_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  student_id_value text := public.clean_placeholder_text(input_student_id);
  person_row public.people;
  staff_row public.staff_profiles;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  if student_id_value is null then
    return jsonb_build_object(
      'success', false,
      'code', 'student_id_required',
      'message_th', 'กรุณากรอกรหัสนักศึกษา',
      'person', null
    );
  end if;

  select *
  into person_row
  from public.people
  where public.clean_placeholder_text(student_id) = student_id_value
    and merged_into is null
  limit 1;

  if person_row.id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'person_not_found',
      'message_th', 'ไม่พบข้อมูลจากรหัสนักศึกษานี้',
      'person', null
    );
  end if;

  select *
  into staff_row
  from public.staff_profiles
  where person_id = person_row.id
     or public.clean_placeholder_text(student_id) = student_id_value
  limit 1;

  return jsonb_build_object(
    'success', true,
    'code', case when staff_row.id is null then 'found' else 'already_staff' end,
    'message_th', case when staff_row.id is null then 'พบข้อมูลนักศึกษา' else 'รายชื่อนี้มีอยู่ในทีมงานแล้ว' end,
    'person', jsonb_build_object(
      'person_id', person_row.id,
      'student_id', person_row.student_id,
      'name_th', person_row.name_th,
      'name_en', person_row.name_en,
      'nickname', person_row.nickname,
      'nickname_th', person_row.nickname_th,
      'nickname_en', person_row.nickname_en,
      'email', person_row.email,
      'phone', person_row.phone,
      'major', person_row.major,
      'year_level', person_row.year_level,
      'instagram', person_row.instagram,
      'line_id', person_row.line_id,
      'facebook', null,
      'other_contact', null
    ),
    'existing_staff_profile_id', staff_row.id,
    'existing_position', staff_row.position
  );
end;
$$;

create or replace function public.create_staff_profile_from_person_admin(
  input_student_id text,
  input_position text,
  input_primary_role text default null,
  input_system_role text default null,
  input_main_group text default null,
  input_subgroup text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  student_id_value text := public.clean_placeholder_text(input_student_id);
  position_value text := public.clean_placeholder_text(input_position);
  primary_role_value text := public.normalize_staff_operational_role(coalesce(public.clean_placeholder_text(input_primary_role), position_value));
  system_role_value text := public.normalize_staff_system_role(input_system_role, primary_role_value);
  main_group_value text := public.clean_placeholder_text(input_main_group);
  subgroup_value text := public.clean_placeholder_text(input_subgroup);
  person_row public.people;
  existing_staff public.staff_profiles;
  new_staff_id uuid;
  health_row public.person_health_profiles;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  if student_id_value is null then
    return jsonb_build_object('success', false, 'code', 'student_id_required', 'message_th', 'กรุณากรอกรหัสนักศึกษา');
  end if;

  if position_value is null then
    return jsonb_build_object('success', false, 'code', 'position_required', 'message_th', 'กรุณากรอกตำแหน่ง');
  end if;

  select *
  into person_row
  from public.people
  where public.clean_placeholder_text(student_id) = student_id_value
    and merged_into is null
  limit 1;

  if person_row.id is null then
    return jsonb_build_object('success', false, 'code', 'person_not_found', 'message_th', 'ไม่พบข้อมูลจากรหัสนักศึกษานี้');
  end if;

  select *
  into existing_staff
  from public.staff_profiles
  where person_id = person_row.id
     or public.clean_placeholder_text(student_id) = student_id_value
  limit 1;

  if existing_staff.id is not null then
    return jsonb_build_object(
      'success', false,
      'code', 'already_staff',
      'message_th', 'รายชื่อนี้มีอยู่ในทีมงานแล้ว',
      'existing_staff_profile_id', existing_staff.id
    );
  end if;

  insert into public.staff_profiles (
    person_id,
    student_id,
    email,
    name_th,
    name_en,
    nickname,
    nickname_th,
    nickname_en,
    phone,
    major,
    instagram,
    line_id,
    facebook,
    other_contact,
    position
  )
  values (
    person_row.id,
    public.clean_placeholder_text(person_row.student_id),
    lower(public.clean_placeholder_text(person_row.email)),
    public.clean_placeholder_text(person_row.name_th),
    public.clean_placeholder_text(person_row.name_en),
    coalesce(public.clean_placeholder_text(person_row.nickname), public.clean_placeholder_text(person_row.nickname_th), public.clean_placeholder_text(person_row.nickname_en)),
    public.clean_placeholder_text(person_row.nickname_th),
    public.clean_placeholder_text(person_row.nickname_en),
    public.normalize_phone_for_storage(person_row.phone),
    public.normalize_major(public.clean_placeholder_text(person_row.major)),
    public.clean_placeholder_text(person_row.instagram),
    public.clean_placeholder_text(person_row.line_id),
    null,
    null,
    position_value
  )
  returning id into new_staff_id;

  insert into public.staff_assignments (
    staff_profile_id,
    user_id,
    role,
    main_group,
    subgroup,
    primary_role,
    secondary_roles
  )
  values (
    new_staff_id,
    null,
    coalesce(system_role_value, 'staff'),
    case when coalesce(system_role_value, 'staff') = 'emergency_staff' then null else main_group_value end,
    case when coalesce(system_role_value, 'staff') = 'emergency_staff' then null else subgroup_value end,
    coalesce(primary_role_value, position_value),
    '{}'::text[]
  )
  on conflict (staff_profile_id)
  do update set
    role = excluded.role,
    main_group = excluded.main_group,
    subgroup = excluded.subgroup,
    primary_role = excluded.primary_role,
    secondary_roles = excluded.secondary_roles;

  select *
  into health_row
  from public.person_health_profiles
  where person_id = person_row.id
  limit 1;

  if health_row.id is not null and (
    public.clean_placeholder_text(health_row.medical_condition) is not null
    or public.clean_placeholder_text(health_row.chronic_condition) is not null
    or public.clean_placeholder_text(health_row.food_allergy) is not null
    or public.clean_placeholder_text(health_row.drug_allergy) is not null
    or public.clean_placeholder_text(health_row.health_note) is not null
  ) then
    insert into public.staff_medical_info (
      staff_profile_id,
      disease,
      drug_allergy,
      food_allergy,
      medical_note
    )
    values (
      new_staff_id,
      coalesce(public.clean_placeholder_text(health_row.chronic_condition), public.clean_placeholder_text(health_row.medical_condition)),
      public.clean_placeholder_text(health_row.drug_allergy),
      public.clean_placeholder_text(health_row.food_allergy),
      public.clean_placeholder_text(health_row.health_note)
    )
    on conflict (staff_profile_id)
    do update set
      disease = excluded.disease,
      drug_allergy = excluded.drug_allergy,
      food_allergy = excluded.food_allergy,
      medical_note = excluded.medical_note,
      updated_at = now();
  end if;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, new_data)
  values (
    new_staff_id,
    auth.uid(),
    'admin_create_staff_from_person',
    jsonb_build_object(
      'person_id', person_row.id,
      'student_id', student_id_value,
      'position', position_value,
      'primary_role', primary_role_value,
      'system_role', system_role_value,
      'main_group', main_group_value,
      'subgroup', subgroup_value
    )
  );

  return jsonb_build_object(
    'success', true,
    'code', 'created',
    'staff_profile_id', new_staff_id,
    'message_th', 'เพิ่มรายชื่อทีมงานแล้ว'
  );
end;
$$;

revoke all on function public.lookup_person_for_staff_add_admin(text) from public;
revoke all on function public.create_staff_profile_from_person_admin(text, text, text, text, text, text) from public;
revoke all on function public.lookup_person_for_staff_add_admin(text) from anon;
revoke all on function public.create_staff_profile_from_person_admin(text, text, text, text, text, text) from anon;
grant execute on function public.lookup_person_for_staff_add_admin(text) to authenticated;
grant execute on function public.create_staff_profile_from_person_admin(text, text, text, text, text, text) to authenticated;
