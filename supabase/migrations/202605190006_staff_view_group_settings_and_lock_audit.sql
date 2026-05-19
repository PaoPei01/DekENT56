create table if not exists public.group_settings (
  id uuid primary key default gen_random_uuid(),
  main_group text not null check (main_group in ('Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Purple', 'Orange')),
  subgroup text not null check (subgroup in ('A', 'B')),
  motto text,
  meeting_point text,
  schedule text,
  mentors text,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id),
  unique (main_group, subgroup)
);

create table if not exists public.staff_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  main_group text not null check (main_group in ('Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Purple', 'Orange')),
  subgroup text check (subgroup is null or subgroup in ('A', 'B')),
  role text default 'staff',
  created_at timestamp with time zone default now(),
  unique (user_id, main_group, subgroup)
);

alter table public.group_settings enable row level security;
alter table public.staff_assignments enable row level security;

create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.staff_assignments where user_id = uid);
$$;

drop policy if exists "Admins can manage group settings" on public.group_settings;
create policy "Admins can manage group settings"
on public.group_settings for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Staff can read group settings" on public.group_settings;
create policy "Staff can read group settings"
on public.group_settings for select
to authenticated
using (public.is_admin(auth.uid()) or public.is_staff(auth.uid()));

drop policy if exists "Admins can manage staff assignments" on public.staff_assignments;
create policy "Admins can manage staff assignments"
on public.staff_assignments for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Staff can read own assignment" on public.staff_assignments;
create policy "Staff can read own assignment"
on public.staff_assignments for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

insert into public.group_settings (main_group, subgroup, motto, meeting_point, schedule, mentors)
select main_group, subgroup, motto, meeting_point, schedule, mentors
from (
  values
    ('Red','A','กล้าเริ่ม กล้าลุย ไปด้วยกัน','ลานกิจกรรมโซนแดง','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟแดง A'),
    ('Red','B','กล้าเริ่ม กล้าลุย ไปด้วยกัน','ลานกิจกรรมโซนแดง','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟแดง B'),
    ('Blue','A','มั่นใจ ชัดเจน ช่วยกัน','ลานกิจกรรมโซนน้ำเงิน','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟน้ำเงิน A'),
    ('Blue','B','มั่นใจ ชัดเจน ช่วยกัน','ลานกิจกรรมโซนน้ำเงิน','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟน้ำเงิน B'),
    ('Yellow','A','สดใส เปิดใจ รู้จักเพื่อนใหม่','ลานกิจกรรมโซนเหลือง','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟเหลือง A'),
    ('Yellow','B','สดใส เปิดใจ รู้จักเพื่อนใหม่','ลานกิจกรรมโซนเหลือง','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟเหลือง B'),
    ('Green','A','เติบโตไปพร้อมกัน','ลานกิจกรรมโซนเขียว','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟเขียว A'),
    ('Green','B','เติบโตไปพร้อมกัน','ลานกิจกรรมโซนเขียว','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟเขียว B'),
    ('Pink','A','อ่อนโยน สนุก และดูแลกัน','ลานกิจกรรมโซนชมพู','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟชมพู A'),
    ('Pink','B','อ่อนโยน สนุก และดูแลกัน','ลานกิจกรรมโซนชมพู','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟชมพู B'),
    ('Purple','A','คิดต่าง สร้างทีม','ลานกิจกรรมโซนม่วง','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟม่วง A'),
    ('Purple','B','คิดต่าง สร้างทีม','ลานกิจกรรมโซนม่วง','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟม่วง B'),
    ('Orange','A','พลังเยอะ ยิ้มง่าย ช่วยไว','ลานกิจกรรมโซนส้ม','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟส้ม A'),
    ('Orange','B','พลังเยอะ ยิ้มง่าย ช่วยไว','ลานกิจกรรมโซนส้ม','08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม','พี่สตาฟส้ม B')
) as seed(main_group, subgroup, motto, meeting_point, schedule, mentors)
on conflict (main_group, subgroup) do nothing;

create or replace function public.save_group_setting(
  input_main_group text,
  input_subgroup text,
  input_motto text,
  input_meeting_point text,
  input_schedule text,
  input_mentors text
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

  insert into public.group_settings (main_group, subgroup, motto, meeting_point, schedule, mentors, updated_by, updated_at)
  values (input_main_group, input_subgroup, input_motto, input_meeting_point, input_schedule, input_mentors, auth.uid(), now())
  on conflict (main_group, subgroup) do update
  set motto = excluded.motto,
      meeting_point = excluded.meeting_point,
      schedule = excluded.schedule,
      mentors = excluded.mentors,
      updated_by = auth.uid(),
      updated_at = now();
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
begin
  select * into staff_row
  from public.staff_assignments
  where user_id = auth.uid()
  order by created_at asc
  limit 1;

  if not found and not public.is_admin(auth.uid()) then
    return null;
  end if;

  return jsonb_build_object(
    'assignment', to_jsonb(staff_row),
    'settings', (
      select coalesce(jsonb_agg(to_jsonb(gs)), '[]'::jsonb)
      from public.group_settings gs
      where public.is_admin(auth.uid())
         or (gs.main_group = staff_row.main_group and (staff_row.subgroup is null or gs.subgroup = staff_row.subgroup))
    ),
    'participants', (
      select coalesce(jsonb_agg(to_jsonb(p) || jsonb_build_object('group_assignment', to_jsonb(ga)) order by p.name_th), '[]'::jsonb)
      from public.group_assignments ga
      join public.profiles p on p.id = ga.profile_id
      where public.is_admin(auth.uid())
         or (ga.main_group = staff_row.main_group and (staff_row.subgroup is null or ga.subgroup = staff_row.subgroup))
    )
  );
end;
$$;

create or replace function public.lock_group_assignments()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (
    null,
    auth.uid(),
    'pre_lock_group_audit',
    '{}'::jsonb,
    jsonb_build_object(
      'assignment_count', (select count(*) from public.group_assignments),
      'group_counts', (
        select jsonb_agg(row_to_json(t))
        from (
          select main_group, subgroup, count(*) as count
          from public.group_assignments
          group by main_group, subgroup
          order by main_group, subgroup
        ) t
      )
    )
  );

  update public.group_assignments
  set locked = true, locked_at = now(), locked_by = auth.uid()
  where locked is not true;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'group_assignments_locked', '{}'::jsonb, jsonb_build_object('locked_at', now()));
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
  setting_row public.group_settings;
begin
  select *
  into profile_row
  from public.profiles
  where lower(email) = lower(trim(input_email))
    and public.normalize_phone(phone) = public.normalize_phone(input_phone)
  limit 1;

  if not found then
    return null;
  end if;

  select * into assignment_row from public.group_assignments where profile_id = profile_row.id;
  select * into setting_row from public.group_settings where main_group = assignment_row.main_group and subgroup = assignment_row.subgroup;

  return jsonb_build_object(
    'profile', to_jsonb(profile_row) - array['phone', 'emergency_phone', 'food_allergy', 'disease', 'drug_allergy'],
    'assignment', to_jsonb(assignment_row),
    'setting', to_jsonb(setting_row)
  );
end;
$$;

grant select on public.group_settings to authenticated;
grant select on public.staff_assignments to authenticated;
grant execute on function public.is_staff(uuid) to anon, authenticated;
grant execute on function public.save_group_setting(text, text, text, text, text, text) to authenticated;
grant execute on function public.get_staff_group_context() to authenticated;
