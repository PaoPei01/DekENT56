create or replace function public.import_staff_records_admin(input_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  profile_input jsonb;
  medical_input jsonb;
  assignment_input jsonb;
  profile_row public.staff_profiles;
  incoming_major text;
  imported_count integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  for item in select * from jsonb_array_elements(input_rows)
  loop
    profile_input := coalesce(item->'profile', '{}'::jsonb);
    medical_input := coalesce(item->'medical', '{}'::jsonb);
    assignment_input := coalesce(item->'assignment', '{}'::jsonb);

    if (profile_input->>'major' is null or profile_input->>'major' = '')
      and public.normalize_major(nullif(profile_input->>'facebook', '')) <> nullif(profile_input->>'facebook', '') then
      profile_input := profile_input || jsonb_build_object('major', public.normalize_major(profile_input->>'facebook'), 'facebook', null);
    end if;

    incoming_major := public.normalize_major(nullif(profile_input->>'major', ''));
    if incoming_major in ('', 'ไม่ระบุ', 'Not specified') then
      incoming_major := null;
    end if;

    profile_row := null;

    if nullif(profile_input->>'student_id', '') is not null then
      select *
      into profile_row
      from public.staff_profiles
      where student_id = nullif(profile_input->>'student_id', '')
      limit 1;
    end if;

    if profile_row.id is null and nullif(profile_input->>'email', '') is not null then
      select *
      into profile_row
      from public.staff_profiles
      where lower(email) = lower(nullif(profile_input->>'email', ''))
      limit 1;
    end if;

    if profile_row.id is null and nullif(profile_input->>'phone', '') is not null then
      select *
      into profile_row
      from public.staff_profiles
      where regexp_replace(coalesce(phone, ''), '\D', '', 'g') = regexp_replace(profile_input->>'phone', '\D', '', 'g')
        and regexp_replace(coalesce(phone, ''), '\D', '', 'g') <> ''
      limit 1;
    end if;

    if profile_row.id is null then
      insert into public.staff_profiles (
        student_id, email, name_th, name_en, nickname, nickname_th, nickname_en, phone, major,
        instagram, line_id, facebook, other_contact, position
      )
      values (
        nullif(profile_input->>'student_id', ''),
        lower(nullif(profile_input->>'email', '')),
        nullif(profile_input->>'name_th', ''),
        nullif(profile_input->>'name_en', ''),
        coalesce(nullif(profile_input->>'nickname', ''), nullif(profile_input->>'nickname_th', ''), nullif(profile_input->>'nickname_en', '')),
        nullif(profile_input->>'nickname_th', ''),
        nullif(profile_input->>'nickname_en', ''),
        nullif(profile_input->>'phone', ''),
        incoming_major,
        nullif(profile_input->>'instagram', ''),
        nullif(profile_input->>'line_id', ''),
        nullif(profile_input->>'facebook', ''),
        nullif(profile_input->>'other_contact', ''),
        nullif(profile_input->>'position', '')
      )
      returning * into profile_row;
    else
      update public.staff_profiles
      set student_id = coalesce(nullif(profile_input->>'student_id', ''), staff_profiles.student_id),
          email = coalesce(lower(nullif(profile_input->>'email', '')), staff_profiles.email),
          name_th = coalesce(nullif(profile_input->>'name_th', ''), staff_profiles.name_th),
          name_en = coalesce(nullif(profile_input->>'name_en', ''), staff_profiles.name_en),
          nickname = coalesce(nullif(profile_input->>'nickname', ''), nullif(profile_input->>'nickname_th', ''), nullif(profile_input->>'nickname_en', ''), staff_profiles.nickname),
          nickname_th = coalesce(nullif(profile_input->>'nickname_th', ''), staff_profiles.nickname_th),
          nickname_en = coalesce(nullif(profile_input->>'nickname_en', ''), staff_profiles.nickname_en),
          phone = coalesce(nullif(profile_input->>'phone', ''), staff_profiles.phone),
          major = coalesce(incoming_major, nullif(nullif(staff_profiles.major, ''), 'ไม่ระบุ')),
          instagram = coalesce(nullif(profile_input->>'instagram', ''), staff_profiles.instagram),
          line_id = coalesce(nullif(profile_input->>'line_id', ''), staff_profiles.line_id),
          facebook = coalesce(nullif(profile_input->>'facebook', ''), staff_profiles.facebook),
          other_contact = coalesce(nullif(profile_input->>'other_contact', ''), staff_profiles.other_contact),
          position = coalesce(nullif(profile_input->>'position', ''), staff_profiles.position),
          updated_at = now()
      where staff_profiles.id = profile_row.id
      returning * into profile_row;
    end if;

    if medical_input <> '{}'::jsonb then
      insert into public.staff_medical_info (staff_profile_id, disease, drug_allergy, food_allergy, medical_note, updated_at)
      values (
        profile_row.id,
        nullif(medical_input->>'disease', ''),
        nullif(medical_input->>'drug_allergy', ''),
        nullif(medical_input->>'food_allergy', ''),
        nullif(medical_input->>'medical_note', ''),
        now()
      )
      on conflict (staff_profile_id) do update
      set disease = coalesce(excluded.disease, staff_medical_info.disease),
          drug_allergy = coalesce(excluded.drug_allergy, staff_medical_info.drug_allergy),
          food_allergy = coalesce(excluded.food_allergy, staff_medical_info.food_allergy),
          medical_note = coalesce(excluded.medical_note, staff_medical_info.medical_note),
          updated_at = now();
    end if;

    if assignment_input <> '{}'::jsonb
      and (
        assignment_input->>'role' = 'emergency_staff'
        or nullif(assignment_input->>'main_group', '') is not null
        or nullif(assignment_input->>'primary_role', '') is not null
      ) then
      insert into public.staff_assignments (staff_profile_id, user_id, role, main_group, subgroup, primary_role, secondary_roles)
      values (
        profile_row.id,
        profile_row.user_id,
        coalesce(public.normalize_staff_system_role(nullif(assignment_input->>'role', ''), nullif(assignment_input->>'primary_role', '')), 'staff'),
        nullif(assignment_input->>'main_group', ''),
        nullif(assignment_input->>'subgroup', ''),
        coalesce(public.normalize_staff_operational_role(nullif(assignment_input->>'primary_role', '')), public.normalize_staff_operational_role(nullif(profile_row.position, ''))),
        coalesce(array(select distinct public.normalize_staff_operational_role(role_name) from jsonb_array_elements_text(coalesce(assignment_input->'secondary_roles', '[]'::jsonb)) role_name where public.normalize_staff_operational_role(role_name) is not null), '{}'::text[])
      )
      on conflict (staff_profile_id) do update
      set user_id = excluded.user_id,
          role = excluded.role,
          main_group = coalesce(excluded.main_group, staff_assignments.main_group),
          subgroup = coalesce(excluded.subgroup, staff_assignments.subgroup),
          primary_role = coalesce(excluded.primary_role, staff_assignments.primary_role),
          secondary_roles = case when cardinality(excluded.secondary_roles) > 0 then excluded.secondary_roles else staff_assignments.secondary_roles end;
    end if;

    imported_count := imported_count + 1;
  end loop;

  update public.staff_profiles sp
  set major = public.normalize_major(p.major),
      updated_at = now()
  from public.profiles p
  where (sp.major is null or btrim(sp.major) = '' or sp.major in ('ไม่ระบุ', 'Not specified'))
    and sp.student_id is not null
    and p.student_id = sp.student_id
    and p.major is not null;

  insert into public.staff_audit_logs (actor_id, action, new_data)
  values (auth.uid(), 'staff_import_committed', jsonb_build_object('count', imported_count, 'matching', 'student_id_email_phone'));

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'staff_import_committed', '{}'::jsonb, jsonb_build_object('count', imported_count, 'matching', 'student_id_email_phone'));

  return jsonb_build_object('imported', imported_count);
end;
$$;

grant execute on function public.import_staff_records_admin(jsonb) to authenticated;
