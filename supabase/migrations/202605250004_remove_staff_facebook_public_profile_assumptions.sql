create or replace function public.verified_staff_profile_context(input_staff_profile_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', sp.id,
      'student_id', sp.student_id,
      'email', sp.email,
      'name_th', sp.name_th,
      'name_en', sp.name_en,
      'nickname', sp.nickname,
      'nickname_th', sp.nickname_th,
      'nickname_en', sp.nickname_en,
      'major', sp.major,
      'phone', sp.phone,
      'instagram', sp.instagram,
      'line_id', sp.line_id,
      'position', sp.position
    ),
    'public_profile', to_jsonb(spp),
    'medical_info', case when smi.id is null then null else jsonb_build_object(
      'disease', smi.disease,
      'drug_allergy', smi.drug_allergy,
      'food_allergy', smi.food_allergy,
      'medical_note', smi.medical_note
    ) end,
    'assignment', case when sa.id is null then null else jsonb_build_object(
      'main_group', sa.main_group,
      'subgroup', sa.subgroup,
      'primary_role', sa.primary_role,
      'secondary_roles', coalesce(to_jsonb(sa.secondary_roles), '[]'::jsonb),
      'base_number', sa.base_number
    ) end,
    'edit_requests', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ser.id,
        'status', ser.status,
        'created_at', ser.created_at,
        'admin_note', ser.admin_note
      ) order by ser.created_at desc)
      from public.staff_edit_requests ser
      where ser.staff_profile_id = sp.id
      limit 10
    ), '[]'::jsonb)
  )
  from public.staff_profiles sp
  left join public.staff_public_profiles spp on spp.staff_profile_id = sp.id
  left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where sp.id = input_staff_profile_id;
$$;

create or replace function public.update_staff_public_profile_verified(input_email text, input_phone text, input_public_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_id uuid := public.find_verified_staff_profile(input_email, input_phone);
begin
  if staff_id is null then
    raise exception 'ไม่พบข้อมูลทีมงานที่ตรงกับอีเมลและเบอร์โทรนี้';
  end if;

  insert into public.staff_public_profiles (staff_profile_id)
  values (staff_id)
  on conflict (staff_profile_id) do nothing;

  update public.staff_public_profiles
  set avatar_path = case when input_public_data ? 'avatar_path' then public.clean_placeholder_text(input_public_data->>'avatar_path') else avatar_path end,
      avatar_url = case when input_public_data ? 'avatar_url' then public.clean_placeholder_text(input_public_data->>'avatar_url') else avatar_url end,
      bio = case when input_public_data ? 'bio' then public.clean_placeholder_text(input_public_data->>'bio') else bio end,
      public_profile_enabled = case when input_public_data ? 'public_profile_enabled' then (input_public_data->>'public_profile_enabled')::boolean else public_profile_enabled end,
      show_instagram = case when input_public_data ? 'show_instagram' then (input_public_data->>'show_instagram')::boolean else show_instagram end,
      show_line_id = case when input_public_data ? 'show_line_id' then (input_public_data->>'show_line_id')::boolean else show_line_id end,
      show_phone_to_staff = case when input_public_data ? 'show_phone_to_staff' then (input_public_data->>'show_phone_to_staff')::boolean else show_phone_to_staff end,
      show_phone_to_public = false,
      profile_completed_at = coalesce(profile_completed_at, now()),
      updated_at = now()
  where staff_profile_id = staff_id;

  update public.staff_profiles
  set instagram = case when input_public_data ? 'instagram' then public.clean_placeholder_text(input_public_data->>'instagram') else instagram end,
      updated_at = now()
  where id = staff_id;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, new_data)
  values (staff_id, null, 'staff_public_profile_verified_updated', input_public_data - 'facebook' - 'show_facebook' - 'hometown' - 'interests');

  return public.verified_staff_profile_context(staff_id);
end;
$$;

create or replace function public.get_public_staff_cards(input_main_group text default null, input_subgroup text default null)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'staff_profile_id', sp.id,
    'avatar_path', spp.avatar_path,
    'avatar_url', spp.avatar_url,
    'nickname', sp.nickname,
    'nickname_th', sp.nickname_th,
    'nickname_en', sp.nickname_en,
    'name_th', sp.name_th,
    'name_en', sp.name_en,
    'position', sp.position,
    'primary_role', sa.primary_role,
    'main_group', sa.main_group,
    'subgroup', sa.subgroup,
    'base_number', sa.base_number,
    'bio', spp.bio,
    'interests', coalesce(to_jsonb(spp.interests), '[]'::jsonb),
    'instagram', case when spp.show_instagram then sp.instagram else null end,
    'line_id', case when spp.show_line_id then sp.line_id else null end,
    'phone', null
  ) order by sa.primary_role, sa.base_number, sp.nickname_th, sp.name_th), '[]'::jsonb)
  from public.staff_profiles sp
  join public.staff_public_profiles spp on spp.staff_profile_id = sp.id and spp.public_profile_enabled = true
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where (input_main_group is null or sa.main_group = input_main_group)
    and (input_subgroup is null or sa.subgroup = input_subgroup);
$$;

create or replace function public.get_staff_directory()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not (public.is_admin(auth.uid()) or public.is_staff(auth.uid())) then
    raise exception 'staff access required';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'staff_profile_id', sp.id,
    'avatar_path', spp.avatar_path,
    'avatar_url', spp.avatar_url,
    'nickname', sp.nickname,
    'nickname_th', sp.nickname_th,
    'nickname_en', sp.nickname_en,
    'name_th', sp.name_th,
    'name_en', sp.name_en,
    'email', sp.email,
    'position', sp.position,
    'primary_role', sa.primary_role,
    'main_group', sa.main_group,
    'subgroup', sa.subgroup,
    'base_number', sa.base_number,
    'bio', spp.bio,
    'interests', coalesce(to_jsonb(spp.interests), '[]'::jsonb),
    'show_phone_to_staff', coalesce(spp.show_phone_to_staff, true),
    'phone', case when coalesce(spp.show_phone_to_staff, true) or public.is_admin(auth.uid()) then sp.phone else null end,
    'instagram', case when coalesce(spp.show_instagram, false) then sp.instagram else null end,
    'line_id', case when coalesce(spp.show_line_id, false) then sp.line_id else null end
  ) order by sa.primary_role, sa.base_number, sp.nickname_th, sp.name_th), '[]'::jsonb)
  into result
  from public.staff_profiles sp
  left join public.staff_public_profiles spp on spp.staff_profile_id = sp.id
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id;

  return result;
end;
$$;

grant execute on function public.update_staff_public_profile_verified(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_public_staff_cards(text, text) to anon, authenticated;
grant execute on function public.get_staff_directory() to authenticated;
