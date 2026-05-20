create or replace function public.normalize_staff_operational_role(input_role text)
returns text
language plpgsql
immutable
as $$
declare
  raw text := public.clean_placeholder_text(input_role);
  lower_raw text;
begin
  if raw is null then
    return null;
  end if;

  lower_raw := lower(raw);
  if lower_raw in ('staff', 'mentor', 'viewer', 'emergency_staff') then
    return null;
  elsif lower_raw like '%ทีมบริหาร%' or lower_raw like '%ทีมบอ%' or lower_raw like '%วางแผน%' or lower_raw like '%planner%' or lower_raw like '%plan%' then
    return 'ทีมบริหาร';
  elsif lower_raw like '%พี่กลุ่ม%' or lower_raw like '%mentor%' or lower_raw like '%group staff%' then
    return 'พี่กลุ่ม';
  elsif lower_raw like '%พี่ฐาน%' or lower_raw like '%ฐาน%' or lower_raw like '%base%' then
    return 'พี่ฐาน';
  elsif lower_raw like '%ไทม์%' or lower_raw like '%timer%' then
    return 'ไทม์เมอร์';
  elsif lower_raw like '%พยาบาล%' or lower_raw like '%medic%' or lower_raw like '%medical%' or lower_raw like '%nurse%' then
    return 'พยาบาล';
  elsif lower_raw like '%จราจร%' or lower_raw like '%traffic%' then
    return 'จราจร';
  elsif lower_raw like '%สวัสดิการ%' or lower_raw like '%welfare%' then
    return 'สวัสดิการ';
  elsif lower_raw like '%โสต%' or lower_raw like '%av%' or lower_raw like '%audio%' or lower_raw like '%visual%' then
    return 'โสตทัศนูปกรณ์';
  elsif lower_raw like '%บันเทิง%' or lower_raw like '%สันทนาการ%' or lower_raw like '%entertain%' then
    return null;
  elsif lower_raw like '%โฟโต้%' or lower_raw like '%photo%' or lower_raw like '%photographer%' then
    return null;
  elsif lower_raw like '%พิธีกร%' or lower_raw like '%mc%' then
    return null;
  end if;

  return raw;
end;
$$;

delete from public.staff_role_quotas
where role_name in ('โฟโต้', 'วางแผน (ทีมบอ)', 'สตาฟให้ความบันเทิง', 'พิธีกร');

insert into public.staff_role_quotas (role_name, target_count, warning_threshold, critical_threshold)
values ('ทีมบริหาร', 7, 1, 2)
on conflict (role_name) do update
set target_count = excluded.target_count,
    warning_threshold = excluded.warning_threshold,
    critical_threshold = excluded.critical_threshold,
    updated_at = now();

update public.staff_assignments
set primary_role = case
      when primary_role = 'วางแผน (ทีมบอ)' then 'ทีมบริหาร'
      when primary_role in ('โฟโต้', 'สตาฟให้ความบันเทิง', 'พิธีกร') then null
      else public.normalize_staff_operational_role(primary_role)
    end,
    secondary_roles = coalesce(array(
      select distinct role_name
      from unnest(coalesce(secondary_roles, '{}'::text[])) raw_role
      cross join lateral (select public.normalize_staff_operational_role(raw_role) role_name) normalized
      where role_name is not null
        and role_name not in ('โฟโต้', 'วางแผน (ทีมบอ)', 'สตาฟให้ความบันเทิง', 'พิธีกร')
    ), '{}'::text[]),
    role = case
      when role in ('staff', 'mentor', 'viewer', 'emergency_staff') then role
      else coalesce(public.normalize_staff_system_role(role, primary_role), 'staff')
    end;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'staff-avatars',
  'staff-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = true,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];

drop policy if exists "public read staff avatar files" on storage.objects;
create policy "public read staff avatar files"
on storage.objects for select
using (bucket_id = 'staff-avatars');

drop policy if exists "verified staff avatar uploads" on storage.objects;
create policy "verified staff avatar uploads"
on storage.objects for insert
with check (
  bucket_id = 'staff-avatars'
  and (lower(storage.extension(name)) in ('jpg', 'jpeg', 'png', 'webp'))
);

drop policy if exists "admin manage staff avatar files" on storage.objects;
create policy "admin manage staff avatar files"
on storage.objects for all
using (bucket_id = 'staff-avatars' and public.is_admin(auth.uid()))
with check (bucket_id = 'staff-avatars' and public.is_admin(auth.uid()));

grant execute on function public.normalize_staff_operational_role(text) to anon, authenticated;

create or replace function public.get_emergency_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not exists (select 1 from public.profiles p where public.can_view_emergency_profile(p.id)) then
    raise exception 'emergency access required';
  end if;

  with participant_rows as (
    select
      p.*,
      ga.main_group,
      ga.subgroup,
      en.note as emergency_note,
      coalesce(en.needs_special_care, false) as needs_special_care,
      en.updated_at as emergency_note_updated_at
    from public.profiles p
    left join public.group_assignments ga on ga.profile_id = p.id
    left join public.emergency_notes en on en.profile_id = p.id
    where public.can_view_emergency_profile(p.id)
      and (
        public.clean_placeholder_text(p.disease) is not null
        or public.clean_placeholder_text(p.drug_allergy) is not null
        or public.clean_placeholder_text(p.food_allergy) is not null
        or coalesce(en.needs_special_care, false) is true
        or public.clean_placeholder_text(en.note) is not null
      )
  ),
  staff_rows as (
    select
      sp.id,
      sp.student_id,
      sp.email,
      sp.name_th,
      sp.name_en,
      sp.nickname,
      sp.nickname_th,
      sp.nickname_en,
      sp.phone,
      sp.major,
      sp.position,
      sa.main_group,
      sa.subgroup,
      sa.primary_role,
      smi.disease,
      smi.drug_allergy,
      smi.food_allergy,
      smi.medical_note
    from public.staff_profiles sp
    join public.staff_medical_info smi on smi.staff_profile_id = sp.id
    left join public.staff_assignments sa on sa.staff_profile_id = sp.id
    where (
      public.clean_placeholder_text(smi.disease) is not null
      or public.clean_placeholder_text(smi.drug_allergy) is not null
      or public.clean_placeholder_text(smi.food_allergy) is not null
      or public.clean_placeholder_text(smi.medical_note) is not null
    )
  )
  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total', (select count(*) from participant_rows),
      'disease', (select count(*) from participant_rows where public.clean_placeholder_text(disease) is not null),
      'drug_allergy', (select count(*) from participant_rows where public.clean_placeholder_text(drug_allergy) is not null),
      'food_allergy', (select count(*) from participant_rows where public.clean_placeholder_text(food_allergy) is not null),
      'needs_special_care', (select count(*) from participant_rows where needs_special_care is true),
      'staff_medical', (select count(*) from staff_rows)
    ),
    'participants', coalesce((select jsonb_agg(to_jsonb(pr) order by needs_special_care desc, main_group, subgroup, name_th) from participant_rows pr), '[]'::jsonb),
    'staff_medical', coalesce((select jsonb_agg(to_jsonb(sr) order by main_group, subgroup, name_th) from staff_rows sr), '[]'::jsonb)
  )
  into result;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'emergency_dashboard_viewed', '{}'::jsonb, jsonb_build_object('viewed_at', now(), 'includes_staff_medical', true));

  return result;
end;
$$;

grant execute on function public.get_emergency_dashboard() to authenticated;
