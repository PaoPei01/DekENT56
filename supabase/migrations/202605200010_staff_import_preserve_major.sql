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
  imported_count integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  for item in select * from jsonb_array_elements(input_rows)
  loop
    profile_input := item->'profile';
    medical_input := coalesce(item->'medical', '{}'::jsonb);
    assignment_input := coalesce(item->'assignment', '{}'::jsonb);

    if (profile_input->>'major' is null or profile_input->>'major' = '')
      and public.normalize_major(nullif(profile_input->>'facebook', '')) <> nullif(profile_input->>'facebook', '') then
      profile_input := profile_input || jsonb_build_object('major', public.normalize_major(profile_input->>'facebook'), 'facebook', null);
    end if;

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
      public.normalize_major(nullif(profile_input->>'major', '')),
      nullif(profile_input->>'instagram', ''),
      nullif(profile_input->>'line_id', ''),
      nullif(profile_input->>'facebook', ''),
      nullif(profile_input->>'other_contact', ''),
      nullif(profile_input->>'position', '')
    )
    on conflict (student_id) do update
    set email = coalesce(excluded.email, staff_profiles.email),
        name_th = coalesce(excluded.name_th, staff_profiles.name_th),
        name_en = coalesce(excluded.name_en, staff_profiles.name_en),
        nickname = coalesce(excluded.nickname, staff_profiles.nickname),
        nickname_th = coalesce(excluded.nickname_th, staff_profiles.nickname_th),
        nickname_en = coalesce(excluded.nickname_en, staff_profiles.nickname_en),
        phone = coalesce(excluded.phone, staff_profiles.phone),
        major = coalesce(excluded.major, staff_profiles.major),
        instagram = coalesce(excluded.instagram, staff_profiles.instagram),
        line_id = coalesce(excluded.line_id, staff_profiles.line_id),
        facebook = coalesce(excluded.facebook, staff_profiles.facebook),
        other_contact = coalesce(excluded.other_contact, staff_profiles.other_contact),
        position = coalesce(excluded.position, staff_profiles.position),
        updated_at = now()
    returning * into profile_row;

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
      set disease = excluded.disease,
          drug_allergy = excluded.drug_allergy,
          food_allergy = excluded.food_allergy,
          medical_note = excluded.medical_note,
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
          main_group = excluded.main_group,
          subgroup = excluded.subgroup,
          primary_role = coalesce(excluded.primary_role, staff_assignments.primary_role),
          secondary_roles = excluded.secondary_roles;
    end if;

    imported_count := imported_count + 1;
  end loop;

  update public.staff_profiles sp
  set major = public.normalize_major(p.major),
      updated_at = now()
  from public.profiles p
  where sp.major is null
    and sp.student_id is not null
    and p.student_id = sp.student_id
    and p.major is not null;

  insert into public.staff_audit_logs (actor_id, action, new_data)
  values (auth.uid(), 'staff_import_committed', jsonb_build_object('count', imported_count));

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'staff_import_committed', '{}'::jsonb, jsonb_build_object('count', imported_count));

  return jsonb_build_object('imported', imported_count);
end;
$$;

grant execute on function public.import_staff_records_admin(jsonb) to authenticated;
