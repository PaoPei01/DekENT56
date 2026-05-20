create or replace function public.normalize_phone(value text)
returns text
language plpgsql
immutable
as $$
declare
  digits text := regexp_replace(coalesce(value, ''), '\D', '', 'g');
begin
  if digits = '' then
    return null;
  end if;
  if left(digits, 4) = '0066' then
    digits := '0' || substr(digits, 5);
  elsif left(digits, 2) = '66' and length(digits) >= 10 then
    digits := '0' || substr(digits, 3);
  elsif left(digits, 1) <> '0' and length(digits) = 9 then
    digits := '0' || digits;
  end if;
  return digits;
end;
$$;

create or replace function public.normalize_phone_for_storage(input_phone text)
returns text
language sql
immutable
as $$
  select public.normalize_phone(public.clean_placeholder_text(input_phone));
$$;

create or replace function public.normalize_existing_phone_values()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_count integer := 0;
  participant_emergency_count integer := 0;
  staff_count integer := 0;
  group_staff_count integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  update public.profiles
  set phone = public.normalize_phone_for_storage(phone),
      updated_at = now()
  where phone is not null
    and public.normalize_phone_for_storage(phone) is distinct from phone;
  get diagnostics participant_count = row_count;

  update public.profiles
  set emergency_phone = public.normalize_phone_for_storage(emergency_phone),
      updated_at = now()
  where emergency_phone is not null
    and public.normalize_phone_for_storage(emergency_phone) is distinct from emergency_phone;
  get diagnostics participant_emergency_count = row_count;

  update public.staff_profiles
  set phone = public.normalize_phone_for_storage(phone),
      updated_at = now()
  where phone is not null
    and public.normalize_phone_for_storage(phone) is distinct from phone;
  get diagnostics staff_count = row_count;

  update public.group_staff
  set phone = public.normalize_phone_for_storage(phone),
      updated_at = now()
  where phone is not null
    and public.normalize_phone_for_storage(phone) is distinct from phone;
  get diagnostics group_staff_count = row_count;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (
    null,
    auth.uid(),
    'normalize_phone_zero_prefix',
    '{}'::jsonb,
    jsonb_build_object(
      'participants', participant_count,
      'participant_emergency', participant_emergency_count,
      'staff', staff_count,
      'group_staff', group_staff_count
    )
  );

  return jsonb_build_object(
    'participants', participant_count,
    'participant_emergency', participant_emergency_count,
    'staff', staff_count,
    'group_staff', group_staff_count
  );
end;
$$;

do $$
declare
  participant_count integer := 0;
  participant_emergency_count integer := 0;
  staff_count integer := 0;
  group_staff_count integer := 0;
begin
  update public.profiles
  set phone = public.normalize_phone_for_storage(phone),
      updated_at = now()
  where phone is not null
    and public.normalize_phone_for_storage(phone) is distinct from phone;
  get diagnostics participant_count = row_count;

  update public.profiles
  set emergency_phone = public.normalize_phone_for_storage(emergency_phone),
      updated_at = now()
  where emergency_phone is not null
    and public.normalize_phone_for_storage(emergency_phone) is distinct from emergency_phone;
  get diagnostics participant_emergency_count = row_count;

  update public.staff_profiles
  set phone = public.normalize_phone_for_storage(phone),
      updated_at = now()
  where phone is not null
    and public.normalize_phone_for_storage(phone) is distinct from phone;
  get diagnostics staff_count = row_count;

  update public.group_staff
  set phone = public.normalize_phone_for_storage(phone),
      updated_at = now()
  where phone is not null
    and public.normalize_phone_for_storage(phone) is distinct from phone;
  get diagnostics group_staff_count = row_count;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (
    null,
    null,
    'migration_normalize_phone_zero_prefix',
    '{}'::jsonb,
    jsonb_build_object(
      'participants', participant_count,
      'participant_emergency', participant_emergency_count,
      'staff', staff_count,
      'group_staff', group_staff_count
    )
  );
end;
$$;

create or replace function public.verify_staff_identity(input_email text, input_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_id uuid := public.find_verified_staff_profile(input_email, input_phone);
begin
  if staff_id is null then
    return null;
  end if;

  update public.staff_profiles
  set phone = public.normalize_phone_for_storage(phone),
      updated_at = now()
  where id = staff_id
    and public.normalize_phone_for_storage(phone) is distinct from phone;

  insert into public.staff_public_profiles (staff_profile_id)
  values (staff_id)
  on conflict (staff_profile_id) do nothing;

  insert into public.staff_profile_view_logs (staff_profile_id, viewed_by, viewer_role, view_scope)
  values (staff_id, null, 'verified_email_phone', 'staff_profile_verify');

  return public.verified_staff_profile_context(staff_id);
end;
$$;

create or replace function public.update_profile_admin(input_profile_id uuid, input_new_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  update public.profiles
  set email = case when input_new_data ? 'email' then lower(public.clean_placeholder_text(input_new_data->>'email')) else email end,
      student_id = case when input_new_data ? 'student_id' then public.clean_placeholder_text(input_new_data->>'student_id') else student_id end,
      name_th = case when input_new_data ? 'name_th' then public.clean_placeholder_text(input_new_data->>'name_th') else name_th end,
      name_en = case when input_new_data ? 'name_en' then public.clean_placeholder_text(input_new_data->>'name_en') else name_en end,
      nickname = case when input_new_data ? 'nickname' then public.clean_placeholder_text(input_new_data->>'nickname') else nickname end,
      nickname_en = case when input_new_data ? 'nickname_en' then public.clean_placeholder_text(input_new_data->>'nickname_en') else nickname_en end,
      major = case when input_new_data ? 'major' then public.normalize_major_text(input_new_data->>'major') else major end,
      phone = case when input_new_data ? 'phone' then public.normalize_phone_for_storage(input_new_data->>'phone') else phone end,
      emergency_phone = case when input_new_data ? 'emergency_phone' then public.normalize_phone_for_storage(input_new_data->>'emergency_phone') else emergency_phone end,
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
      public_profile = case when input_new_data ? 'public_profile' then (input_new_data->>'public_profile')::boolean else public_profile end,
      show_instagram = case when input_new_data ? 'show_instagram' then (input_new_data->>'show_instagram')::boolean else show_instagram end,
      show_line_id = case when input_new_data ? 'show_line_id' then (input_new_data->>'show_line_id')::boolean else show_line_id end,
      updated_at = now()
  where id = input_profile_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (input_profile_id, auth.uid(), 'admin_update_profile', '{}'::jsonb, input_new_data);
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
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select * into request_row
  from public.edit_requests
  where id = request_id and status = 'pending';

  if request_row.id is null then
    raise exception 'request not found';
  end if;

  update public.profiles
  set nickname = case when request_row.new_data ? 'nickname' then public.clean_placeholder_text(request_row.new_data->>'nickname') else nickname end,
      nickname_en = case when request_row.new_data ? 'nickname_en' then public.clean_placeholder_text(request_row.new_data->>'nickname_en') else nickname_en end,
      phone = case when request_row.new_data ? 'phone' then public.normalize_phone_for_storage(request_row.new_data->>'phone') else phone end,
      emergency_phone = case when request_row.new_data ? 'emergency_phone' then public.normalize_phone_for_storage(request_row.new_data->>'emergency_phone') else emergency_phone end,
      line_id = case when request_row.new_data ? 'line_id' then public.clean_placeholder_text(request_row.new_data->>'line_id') else line_id end,
      instagram = case when request_row.new_data ? 'instagram' then public.clean_placeholder_text(request_row.new_data->>'instagram') else instagram end,
      facebook = case when request_row.new_data ? 'facebook' then public.clean_placeholder_text(request_row.new_data->>'facebook') else facebook end,
      other_contact = case when request_row.new_data ? 'other_contact' then public.clean_placeholder_text(request_row.new_data->>'other_contact') else other_contact end,
      food_allergy = case when request_row.new_data ? 'food_allergy' then public.clean_placeholder_text(request_row.new_data->>'food_allergy') else food_allergy end,
      disease = case when request_row.new_data ? 'disease' then public.clean_placeholder_text(request_row.new_data->>'disease') else disease end,
      drug_allergy = case when request_row.new_data ? 'drug_allergy' then public.clean_placeholder_text(request_row.new_data->>'drug_allergy') else drug_allergy end,
      public_profile = case when request_row.new_data ? 'public_profile' then (request_row.new_data->>'public_profile')::boolean else public_profile end,
      show_instagram = case when request_row.new_data ? 'show_instagram' then (request_row.new_data->>'show_instagram')::boolean else show_instagram end,
      show_line_id = case when request_row.new_data ? 'show_line_id' then (request_row.new_data->>'show_line_id')::boolean else show_line_id end,
      updated_at = now()
  where id = request_row.profile_id;

  update public.edit_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = request_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (request_row.profile_id, auth.uid(), 'approve_edit_request', request_row.old_data, request_row.new_data);
end;
$$;

create or replace function public.update_staff_profile_admin(
  input_staff_profile_id uuid,
  input_profile jsonb,
  input_medical jsonb default '{}'::jsonb,
  input_assignment jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  update public.staff_profiles
  set user_id = case when input_profile ? 'user_id' then nullif(input_profile->>'user_id', '')::uuid else user_id end,
      student_id = case when input_profile ? 'student_id' then public.clean_placeholder_text(input_profile->>'student_id') else student_id end,
      email = case when input_profile ? 'email' then lower(public.clean_placeholder_text(input_profile->>'email')) else email end,
      name_th = case when input_profile ? 'name_th' then public.clean_placeholder_text(input_profile->>'name_th') else name_th end,
      name_en = case when input_profile ? 'name_en' then public.clean_placeholder_text(input_profile->>'name_en') else name_en end,
      nickname = case when input_profile ? 'nickname' then public.clean_placeholder_text(input_profile->>'nickname') else nickname end,
      nickname_th = case when input_profile ? 'nickname_th' then public.clean_placeholder_text(input_profile->>'nickname_th') else nickname_th end,
      nickname_en = case when input_profile ? 'nickname_en' then public.clean_placeholder_text(input_profile->>'nickname_en') else nickname_en end,
      phone = case when input_profile ? 'phone' then public.normalize_phone_for_storage(input_profile->>'phone') else phone end,
      major = case when input_profile ? 'major' then public.normalize_major_text(input_profile->>'major') else major end,
      instagram = case when input_profile ? 'instagram' then public.clean_placeholder_text(input_profile->>'instagram') else instagram end,
      line_id = case when input_profile ? 'line_id' then public.clean_placeholder_text(input_profile->>'line_id') else line_id end,
      facebook = case when input_profile ? 'facebook' then public.clean_placeholder_text(input_profile->>'facebook') else facebook end,
      other_contact = case when input_profile ? 'other_contact' then public.clean_placeholder_text(input_profile->>'other_contact') else other_contact end,
      position = case when input_profile ? 'position' then public.normalize_staff_operational_role(input_profile->>'position') else position end,
      updated_at = now()
  where id = input_staff_profile_id;

  insert into public.staff_medical_info (staff_profile_id, disease, drug_allergy, food_allergy, medical_note, updated_at)
  values (
    input_staff_profile_id,
    public.clean_placeholder_text(input_medical->>'disease'),
    public.clean_placeholder_text(input_medical->>'drug_allergy'),
    public.clean_placeholder_text(input_medical->>'food_allergy'),
    public.clean_placeholder_text(input_medical->>'medical_note'),
    now()
  )
  on conflict (staff_profile_id) do update
  set disease = case when input_medical ? 'disease' then excluded.disease else staff_medical_info.disease end,
      drug_allergy = case when input_medical ? 'drug_allergy' then excluded.drug_allergy else staff_medical_info.drug_allergy end,
      food_allergy = case when input_medical ? 'food_allergy' then excluded.food_allergy else staff_medical_info.food_allergy end,
      medical_note = case when input_medical ? 'medical_note' then excluded.medical_note else staff_medical_info.medical_note end,
      updated_at = now();

  insert into public.staff_assignments (staff_profile_id, user_id, role, main_group, subgroup, primary_role, secondary_roles)
  values (
    input_staff_profile_id,
    (select user_id from public.staff_profiles where id = input_staff_profile_id),
    coalesce(public.normalize_staff_system_role(input_assignment->>'role', input_assignment->>'primary_role'), 'staff'),
    public.clean_placeholder_text(input_assignment->>'main_group'),
    public.clean_placeholder_text(input_assignment->>'subgroup'),
    public.normalize_staff_operational_role(input_assignment->>'primary_role'),
    coalesce(array(select distinct public.normalize_staff_operational_role(role_name) from jsonb_array_elements_text(coalesce(input_assignment->'secondary_roles', '[]'::jsonb)) role_name where public.normalize_staff_operational_role(role_name) is not null), '{}'::text[])
  )
  on conflict (staff_profile_id) do update
  set user_id = excluded.user_id,
      role = case when input_assignment ? 'role' then excluded.role else staff_assignments.role end,
      main_group = case when input_assignment ? 'main_group' then excluded.main_group else staff_assignments.main_group end,
      subgroup = case when input_assignment ? 'subgroup' then excluded.subgroup else staff_assignments.subgroup end,
      primary_role = case when input_assignment ? 'primary_role' then excluded.primary_role else staff_assignments.primary_role end,
      secondary_roles = case when input_assignment ? 'secondary_roles' then excluded.secondary_roles else staff_assignments.secondary_roles end;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, new_data)
  values (input_staff_profile_id, auth.uid(), 'staff_profile_updated_admin', jsonb_build_object('profile', input_profile, 'medical', input_medical, 'assignment', input_assignment));
end;
$$;

create or replace function public.approve_staff_edit_request(request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.staff_edit_requests;
  profile_data jsonb;
  medical_data jsonb;
  assignment_data jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select * into req
  from public.staff_edit_requests
  where id = request_id and status = 'pending';

  if req.id is null then
    raise exception 'request not found';
  end if;

  profile_data := coalesce(req.new_data->'profile', '{}'::jsonb);
  medical_data := coalesce(req.new_data->'medical', '{}'::jsonb);
  assignment_data := coalesce(req.new_data->'assignment', '{}'::jsonb);

  update public.staff_profiles
  set phone = case when profile_data ? 'phone' then public.normalize_phone_for_storage(profile_data->>'phone') else phone end,
      line_id = case when profile_data ? 'line_id' then public.clean_placeholder_text(profile_data->>'line_id') else line_id end,
      instagram = case when profile_data ? 'instagram' then public.clean_placeholder_text(profile_data->>'instagram') else instagram end,
      facebook = case when profile_data ? 'facebook' then public.clean_placeholder_text(profile_data->>'facebook') else facebook end,
      updated_at = now()
  where id = req.staff_profile_id;

  if medical_data <> '{}'::jsonb then
    insert into public.staff_medical_info (staff_profile_id, disease, drug_allergy, food_allergy, medical_note, updated_at)
    values (
      req.staff_profile_id,
      public.clean_placeholder_text(medical_data->>'disease'),
      public.clean_placeholder_text(medical_data->>'drug_allergy'),
      public.clean_placeholder_text(medical_data->>'food_allergy'),
      public.clean_placeholder_text(medical_data->>'medical_note'),
      now()
    )
    on conflict (staff_profile_id) do update
    set disease = case when medical_data ? 'disease' then excluded.disease else staff_medical_info.disease end,
        drug_allergy = case when medical_data ? 'drug_allergy' then excluded.drug_allergy else staff_medical_info.drug_allergy end,
        food_allergy = case when medical_data ? 'food_allergy' then excluded.food_allergy else staff_medical_info.food_allergy end,
        medical_note = case when medical_data ? 'medical_note' then excluded.medical_note else staff_medical_info.medical_note end,
        updated_at = now();
  end if;

  if assignment_data <> '{}'::jsonb then
    insert into public.staff_assignments (staff_profile_id, role, main_group, subgroup, primary_role, secondary_roles)
    values (
      req.staff_profile_id,
      coalesce(public.normalize_staff_system_role(assignment_data->>'role', assignment_data->>'primary_role'), 'staff'),
      public.clean_placeholder_text(assignment_data->>'main_group'),
      public.clean_placeholder_text(assignment_data->>'subgroup'),
      public.normalize_staff_operational_role(public.clean_placeholder_text(assignment_data->>'primary_role')),
      coalesce(array(
        select distinct public.normalize_staff_operational_role(value)
        from jsonb_array_elements_text(coalesce(assignment_data->'secondary_roles', '[]'::jsonb)) value
        where public.normalize_staff_operational_role(value) is not null
      ), '{}'::text[])
    )
    on conflict (staff_profile_id) do update
    set role = case when assignment_data ? 'role' then excluded.role else staff_assignments.role end,
        main_group = case when assignment_data ? 'main_group' then excluded.main_group else staff_assignments.main_group end,
        subgroup = case when assignment_data ? 'subgroup' then excluded.subgroup else staff_assignments.subgroup end,
        primary_role = case when assignment_data ? 'primary_role' then excluded.primary_role else staff_assignments.primary_role end,
        secondary_roles = case when assignment_data ? 'secondary_roles' then excluded.secondary_roles else staff_assignments.secondary_roles end;
  end if;

  update public.staff_edit_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = req.id;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, old_data, new_data)
  values (req.staff_profile_id, auth.uid(), 'staff_edit_request_approved', req.old_data, req.new_data);
end;
$$;

grant execute on function public.normalize_phone(text) to anon, authenticated;
grant execute on function public.normalize_phone_for_storage(text) to anon, authenticated;
grant execute on function public.normalize_existing_phone_values() to authenticated;
grant execute on function public.update_profile_admin(uuid, jsonb) to authenticated;
grant execute on function public.approve_edit_request(uuid) to authenticated;
grant execute on function public.update_staff_profile_admin(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.approve_staff_edit_request(uuid) to authenticated;
