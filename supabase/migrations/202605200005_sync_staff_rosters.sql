alter table public.staff_profiles
  add column if not exists nickname_th text,
  add column if not exists nickname_en text;

update public.staff_profiles
set nickname_th = nickname
where nickname_th is null
  and nickname is not null;

drop view if exists public.unified_group_staff;

create view public.unified_group_staff
with (security_invoker = true)
as
select
  sp.id::text as id,
  sp.id as staff_profile_id,
  sp.user_id,
  sp.student_id,
  coalesce(sp.name_th, sp.name_en, sp.nickname_th, sp.nickname, sp.nickname_en, sp.email, sp.student_id, 'Unknown Staff') as name,
  sp.name_th,
  sp.name_en,
  coalesce(sp.nickname_th, sp.nickname, sp.nickname_en) as nickname,
  sp.nickname_th,
  sp.nickname_en,
  sp.phone,
  sp.instagram,
  sp.line_id,
  sp.facebook,
  sp.other_contact,
  smi.disease,
  smi.drug_allergy,
  smi.food_allergy,
  sa.main_group,
  sa.subgroup,
  sp.position as duty,
  sp.position,
  'staff_profiles'::text as source,
  greatest(coalesce(sp.updated_at, sp.created_at), coalesce(smi.updated_at, smi.created_at, sp.created_at), coalesce(sa.created_at, sp.created_at)) as updated_at
from public.staff_profiles sp
left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
left join public.staff_assignments sa on sa.staff_profile_id = sp.id
where sa.main_group is not null
  and sa.subgroup is not null
union all
select
  gs.id::text as id,
  null::uuid as staff_profile_id,
  null::uuid as user_id,
  gs.student_id,
  coalesce(gs.name, gs.nickname, gs.student_id, 'Unknown Staff') as name,
  gs.name as name_th,
  null::text as name_en,
  gs.nickname,
  gs.nickname as nickname_th,
  null::text as nickname_en,
  gs.phone,
  null::text as instagram,
  null::text as line_id,
  null::text as facebook,
  null::text as other_contact,
  gs.disease,
  gs.drug_allergy,
  gs.food_allergy,
  gs.main_group,
  gs.subgroup,
  gs.duty,
  gs.duty as position,
  'group_staff_legacy'::text as source,
  gs.updated_at
from public.group_staff gs
where not exists (
  select 1
  from public.staff_profiles sp
  where sp.student_id is not null
    and gs.student_id is not null
    and sp.student_id = gs.student_id
);

create or replace function public.sync_group_staff_from_staff_profiles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  synced_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  insert into public.group_staff (
    student_id, name, nickname, phone, disease, drug_allergy, food_allergy,
    main_group, subgroup, duty, updated_at
  )
  select
    sp.student_id,
    coalesce(sp.name_th, sp.name_en, sp.nickname_th, sp.nickname, sp.nickname_en, sp.email, sp.student_id, 'Unknown Staff'),
    coalesce(sp.nickname_th, sp.nickname, sp.nickname_en),
    sp.phone,
    smi.disease,
    smi.drug_allergy,
    smi.food_allergy,
    sa.main_group,
    sa.subgroup,
    sp.position,
    now()
  from public.staff_profiles sp
  join public.staff_assignments sa on sa.staff_profile_id = sp.id
  left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
  where sp.student_id is not null
    and sa.main_group is not null
    and sa.subgroup is not null
  on conflict (student_id, main_group, subgroup) do update
  set name = excluded.name,
      nickname = excluded.nickname,
      phone = excluded.phone,
      disease = excluded.disease,
      drug_allergy = excluded.drug_allergy,
      food_allergy = excluded.food_allergy,
      duty = excluded.duty,
      updated_at = now();

  get diagnostics synced_count = row_count;
  return synced_count;
end;
$$;

create or replace function public.refresh_group_setting_mentors_from_staff()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  update public.group_settings gs
  set mentors = coalesce(mentor_rows.names, gs.mentors),
      updated_at = now(),
      updated_by = auth.uid()
  from (
    select
      main_group,
      subgroup,
      string_agg(coalesce(nickname_th, nickname, nickname_en, name_th, name_en, name, student_id, 'Unknown Staff'), ', ' order by name) as names
    from public.unified_group_staff
    where main_group is not null
      and subgroup is not null
    group by main_group, subgroup
  ) mentor_rows
  where gs.main_group = mentor_rows.main_group
    and gs.subgroup = mentor_rows.subgroup;

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

create or replace function public.rebuild_staff_roster_sync()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  synced_count integer;
  group_count integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  synced_count := public.sync_group_staff_from_staff_profiles();
  group_count := public.refresh_group_setting_mentors_from_staff();

  insert into public.staff_audit_logs (actor_id, action, new_data)
  values (auth.uid(), 'staff_roster_synced', jsonb_build_object('synced', synced_count, 'groups', group_count));

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'staff_roster_synced', '{}'::jsonb, jsonb_build_object('synced', synced_count, 'groups', group_count));

  return jsonb_build_object('synced', synced_count, 'groups', group_count);
end;
$$;

create or replace function public.get_admin_staff_profiles()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  return (
    select coalesce(jsonb_agg(
      to_jsonb(sp)
      || jsonb_build_object('medical_info', to_jsonb(smi), 'assignment', to_jsonb(sa))
      order by sa.main_group nulls last, sa.subgroup nulls last, sp.name_th nulls last, sp.name_en nulls last
    ), '[]'::jsonb)
    from public.staff_profiles sp
    left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
    left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  );
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
declare
  old_payload jsonb;
  updated_profile public.staff_profiles;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select to_jsonb(sp) || jsonb_build_object('medical_info', to_jsonb(smi), 'assignment', to_jsonb(sa))
  into old_payload
  from public.staff_profiles sp
  left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where sp.id = input_staff_profile_id;

  update public.staff_profiles
  set user_id = case when input_profile ? 'user_id' and nullif(input_profile->>'user_id', '') is not null then (input_profile->>'user_id')::uuid when input_profile ? 'user_id' then null else user_id end,
      student_id = case when input_profile ? 'student_id' then nullif(input_profile->>'student_id', '') else student_id end,
      email = case when input_profile ? 'email' then lower(nullif(input_profile->>'email', '')) else email end,
      name_th = case when input_profile ? 'name_th' then nullif(input_profile->>'name_th', '') else name_th end,
      name_en = case when input_profile ? 'name_en' then nullif(input_profile->>'name_en', '') else name_en end,
      nickname = case when input_profile ? 'nickname' then nullif(input_profile->>'nickname', '') else nickname end,
      nickname_th = case when input_profile ? 'nickname_th' then nullif(input_profile->>'nickname_th', '') else nickname_th end,
      nickname_en = case when input_profile ? 'nickname_en' then nullif(input_profile->>'nickname_en', '') else nickname_en end,
      phone = case when input_profile ? 'phone' then nullif(input_profile->>'phone', '') else phone end,
      major = case when input_profile ? 'major' then public.normalize_major(nullif(input_profile->>'major', '')) else major end,
      instagram = case when input_profile ? 'instagram' then nullif(input_profile->>'instagram', '') else instagram end,
      line_id = case when input_profile ? 'line_id' then nullif(input_profile->>'line_id', '') else line_id end,
      facebook = case when input_profile ? 'facebook' then nullif(input_profile->>'facebook', '') else facebook end,
      other_contact = case when input_profile ? 'other_contact' then nullif(input_profile->>'other_contact', '') else other_contact end,
      position = case when input_profile ? 'position' then nullif(input_profile->>'position', '') else position end,
      updated_at = now()
  where id = input_staff_profile_id
  returning * into updated_profile;

  if not found then
    raise exception 'staff profile not found';
  end if;

  if input_medical <> '{}'::jsonb then
    insert into public.staff_medical_info (staff_profile_id, disease, drug_allergy, food_allergy, medical_note, updated_at)
    values (
      input_staff_profile_id,
      case when input_medical ? 'disease' then nullif(input_medical->>'disease', '') else null end,
      case when input_medical ? 'drug_allergy' then nullif(input_medical->>'drug_allergy', '') else null end,
      case when input_medical ? 'food_allergy' then nullif(input_medical->>'food_allergy', '') else null end,
      case when input_medical ? 'medical_note' then nullif(input_medical->>'medical_note', '') else null end,
      now()
    )
    on conflict (staff_profile_id) do update
    set disease = case when input_medical ? 'disease' then excluded.disease else public.staff_medical_info.disease end,
        drug_allergy = case when input_medical ? 'drug_allergy' then excluded.drug_allergy else public.staff_medical_info.drug_allergy end,
        food_allergy = case when input_medical ? 'food_allergy' then excluded.food_allergy else public.staff_medical_info.food_allergy end,
        medical_note = case when input_medical ? 'medical_note' then excluded.medical_note else public.staff_medical_info.medical_note end,
        updated_at = now();
  end if;

  if input_assignment <> '{}'::jsonb then
    insert into public.staff_assignments (staff_profile_id, user_id, role, main_group, subgroup)
    values (
      input_staff_profile_id,
      updated_profile.user_id,
      coalesce(nullif(input_assignment->>'role', ''), 'staff'),
      case when input_assignment->>'role' = 'emergency_staff' then null else nullif(input_assignment->>'main_group', '') end,
      case when input_assignment->>'role' = 'emergency_staff' then null else nullif(input_assignment->>'subgroup', '') end
    )
    on conflict (staff_profile_id) do update
    set user_id = excluded.user_id,
        role = excluded.role,
        main_group = excluded.main_group,
        subgroup = excluded.subgroup;
  end if;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, old_data, new_data)
  values (input_staff_profile_id, auth.uid(), 'staff_profile_updated', coalesce(old_payload, '{}'::jsonb), jsonb_build_object('profile', input_profile, 'medical', input_medical, 'assignment', input_assignment));

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'staff_profile_updated', coalesce(old_payload, '{}'::jsonb), jsonb_build_object('staff_profile_id', input_staff_profile_id));
end;
$$;

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
    set email = excluded.email,
        name_th = excluded.name_th,
        name_en = excluded.name_en,
        nickname = excluded.nickname,
        nickname_th = excluded.nickname_th,
        nickname_en = excluded.nickname_en,
        phone = excluded.phone,
        major = excluded.major,
        instagram = excluded.instagram,
        line_id = excluded.line_id,
        facebook = excluded.facebook,
        other_contact = excluded.other_contact,
        position = excluded.position,
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
      ) then
      insert into public.staff_assignments (staff_profile_id, user_id, role, main_group, subgroup)
      values (
        profile_row.id,
        profile_row.user_id,
        coalesce(nullif(assignment_input->>'role', ''), 'staff'),
        case when assignment_input->>'role' = 'emergency_staff' then null else nullif(assignment_input->>'main_group', '') end,
        case when assignment_input->>'role' = 'emergency_staff' then null else nullif(assignment_input->>'subgroup', '') end
      )
      on conflict (staff_profile_id) do update
      set user_id = excluded.user_id,
          role = excluded.role,
          main_group = excluded.main_group,
          subgroup = excluded.subgroup;
    end if;

    imported_count := imported_count + 1;
  end loop;

  insert into public.staff_audit_logs (actor_id, action, new_data)
  values (auth.uid(), 'staff_import_committed', jsonb_build_object('count', imported_count));

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'staff_import_committed', '{}'::jsonb, jsonb_build_object('count', imported_count));

  return jsonb_build_object('imported', imported_count);
end;
$$;

create or replace function public.delete_staff_profile_admin(input_staff_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_payload jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select to_jsonb(sp) || jsonb_build_object('medical_info', to_jsonb(smi), 'assignment', to_jsonb(sa))
  into old_payload
  from public.staff_profiles sp
  left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where sp.id = input_staff_profile_id;

  if old_payload is null then
    raise exception 'staff profile not found';
  end if;

  delete from public.staff_profiles
  where id = input_staff_profile_id;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, old_data, new_data)
  values (
    null,
    auth.uid(),
    'staff_profile_deleted',
    coalesce(old_payload, '{}'::jsonb) || jsonb_build_object('deleted_staff_profile_id', input_staff_profile_id),
    jsonb_build_object('deleted_staff_profile_id', input_staff_profile_id)
  );

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'staff_profile_deleted', coalesce(old_payload, '{}'::jsonb), jsonb_build_object('deleted_staff_profile_id', input_staff_profile_id));
end;
$$;

create or replace function public.get_staff_group_context()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  staff_row public.staff_assignments;
  can_view_medical boolean := public.is_admin(auth.uid()) or public.staff_has_role(array['emergency_staff']);
begin
  select * into staff_row
  from public.staff_assignments
  where user_id = auth.uid()
    and role in ('staff', 'mentor', 'viewer')
  order by
    case role when 'staff' then 1 when 'mentor' then 2 else 3 end,
    created_at asc
  limit 1;

  if not found and not public.is_admin(auth.uid()) then
    return null;
  end if;

  return jsonb_build_object(
    'access', public.get_staff_access_context(),
    'assignment', to_jsonb(staff_row),
    'settings', (
      select coalesce(jsonb_agg(to_jsonb(gs) order by gs.main_group, gs.subgroup), '[]'::jsonb)
      from public.group_settings gs
      where public.is_admin(auth.uid())
         or public.staff_can_access_group(gs.main_group, gs.subgroup, array['staff','mentor','viewer'])
    ),
    'staff_roster', (
      select coalesce(jsonb_agg(
        to_jsonb(gsr)
        - (case when can_view_medical then array[]::text[] else array['disease','drug_allergy','food_allergy'] end)
        order by gsr.main_group, gsr.subgroup, gsr.name
      ), '[]'::jsonb)
      from public.unified_group_staff gsr
      where public.is_admin(auth.uid())
         or public.staff_can_access_group(gsr.main_group, gsr.subgroup, array['staff','mentor','viewer'])
    ),
    'participants', (
      select coalesce(jsonb_agg(
        (to_jsonb(p) || jsonb_build_object('group_assignment', to_jsonb(ga)))
        - (case when can_view_medical then array[]::text[] else array['disease','drug_allergy','food_allergy'] end)
        order by ga.main_group, ga.subgroup, p.name_th
      ), '[]'::jsonb)
      from public.group_assignments ga
      join public.profiles p on p.id = ga.profile_id
      where public.is_admin(auth.uid())
         or public.staff_can_access_group(ga.main_group, ga.subgroup, array['staff','mentor','viewer'])
    )
  );
end;
$$;

create or replace function public.get_verified_group_context(input_email text, input_phone text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  assignment_row public.group_assignments;
begin
  select *
  into profile_row
  from public.profiles
  where lower(email) = lower(input_email)
    and regexp_replace(coalesce(phone, ''), '\D', '', 'g') = regexp_replace(coalesce(input_phone, ''), '\D', '', 'g')
  limit 1;

  if not found then
    return null;
  end if;

  select *
  into assignment_row
  from public.group_assignments
  where profile_id = profile_row.id
  limit 1;

  return jsonb_build_object(
    'profile', to_jsonb(profile_row) - array['phone','emergency_phone','food_allergy','disease','drug_allergy'],
    'assignment', to_jsonb(assignment_row),
    'settings', (
      select to_jsonb(gs)
      from public.group_settings gs
      where gs.main_group = assignment_row.main_group
        and gs.subgroup = assignment_row.subgroup
      limit 1
    ),
    'staff_roster', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id,
        'staff_profile_id', staff_profile_id,
        'name', name,
        'name_th', name_th,
        'name_en', name_en,
        'nickname', coalesce(nickname_th, nickname, nickname_en),
        'nickname_th', nickname_th,
        'nickname_en', nickname_en,
        'instagram', instagram,
        'duty', duty,
        'position', position,
        'main_group', main_group,
        'subgroup', subgroup,
        'source', source
      ) order by name), '[]'::jsonb)
      from public.unified_group_staff
      where main_group = assignment_row.main_group
        and subgroup = assignment_row.subgroup
    ),
    'recommendations', (
      select coalesce(jsonb_agg(to_jsonb(recommendation_rows) order by recommendation_rows.rank, recommendation_rows.nickname), '[]'::jsonb)
      from (
        select
          p.id,
          p.nickname,
          p.nickname_en,
          p.name_th,
          p.name_en,
          p.major,
          case when p.public_profile and p.show_instagram then p.instagram else null end as instagram,
          case when p.public_profile and p.show_line_id then p.line_id else null end as line_id,
          case when p.major = profile_row.major then 0 else 1 end as rank
        from public.group_assignments ga
        join public.profiles p on p.id = ga.profile_id
        where ga.main_group = assignment_row.main_group
          and ga.subgroup = assignment_row.subgroup
          and p.id <> profile_row.id
          and p.public_profile = true
        order by rank, p.nickname
        limit 12
      ) recommendation_rows
    )
  );
end;
$$;

grant select on public.unified_group_staff to authenticated;
grant execute on function public.sync_group_staff_from_staff_profiles() to authenticated;
grant execute on function public.refresh_group_setting_mentors_from_staff() to authenticated;
grant execute on function public.rebuild_staff_roster_sync() to authenticated;
grant execute on function public.get_admin_staff_profiles() to authenticated;
grant execute on function public.update_staff_profile_admin(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.import_staff_records_admin(jsonb) to authenticated;
grant execute on function public.delete_staff_profile_admin(uuid) to authenticated;
grant execute on function public.get_staff_group_context() to authenticated;
grant execute on function public.get_verified_group_context(text, text) to anon, authenticated;
