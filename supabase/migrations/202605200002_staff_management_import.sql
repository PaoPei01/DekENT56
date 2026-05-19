create table if not exists public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  student_id text unique,
  email text,
  name_th text,
  name_en text,
  nickname text,
  phone text,
  major text,
  instagram text,
  line_id text,
  facebook text,
  other_contact text,
  position text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create unique index if not exists staff_profiles_user_id_unique
on public.staff_profiles (user_id)
where user_id is not null;

create unique index if not exists staff_profiles_email_unique
on public.staff_profiles (lower(email))
where email is not null and email <> '';

create unique index if not exists staff_profiles_email_plain_unique
on public.staff_profiles (email)
where email is not null and email <> '';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'staff_profiles_email_key'
      and conrelid = 'public.staff_profiles'::regclass
  ) then
    alter table public.staff_profiles
      add constraint staff_profiles_email_key unique (email);
  end if;
end $$;

create table if not exists public.staff_medical_info (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid not null references public.staff_profiles(id) on delete cascade,
  disease text,
  drug_allergy text,
  food_allergy text,
  medical_note text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (staff_profile_id)
);

create table if not exists public.staff_audit_logs (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid references public.staff_profiles(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_data jsonb default '{}'::jsonb,
  new_data jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

alter table public.staff_assignments
  add column if not exists staff_profile_id uuid references public.staff_profiles(id) on delete cascade;

alter table public.staff_assignments
  alter column user_id drop not null;

alter table public.staff_assignments
  drop constraint if exists staff_assignments_actor_check;

alter table public.staff_assignments
  add constraint staff_assignments_actor_check
  check (user_id is not null or staff_profile_id is not null);

drop index if exists staff_assignments_one_per_staff_profile;
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'staff_assignments_staff_profile_id_key'
      and conrelid = 'public.staff_assignments'::regclass
  ) then
    alter table public.staff_assignments
      add constraint staff_assignments_staff_profile_id_key unique (staff_profile_id);
  end if;
end $$;

alter table public.staff_profiles enable row level security;
alter table public.staff_medical_info enable row level security;
alter table public.staff_audit_logs enable row level security;

create or replace function public.staff_has_role(input_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff_assignments sa
    where sa.user_id = auth.uid()
      and sa.role = any(input_roles)
  );
$$;

drop policy if exists "Admins can manage staff profiles" on public.staff_profiles;
create policy "Admins can manage staff profiles"
on public.staff_profiles for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Staff can read own staff profile" on public.staff_profiles;
create policy "Staff can read own staff profile"
on public.staff_profiles for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins and emergency staff can read staff medical" on public.staff_medical_info;
create policy "Admins and emergency staff can read staff medical"
on public.staff_medical_info for select
to authenticated
using (public.is_admin(auth.uid()) or public.staff_has_role(array['emergency_staff']));

drop policy if exists "Admins can manage staff medical" on public.staff_medical_info;
create policy "Admins can manage staff medical"
on public.staff_medical_info for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read staff audit logs" on public.staff_audit_logs;
create policy "Admins can read staff audit logs"
on public.staff_audit_logs for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "System can insert staff audit logs" on public.staff_audit_logs;
create policy "System can insert staff audit logs"
on public.staff_audit_logs for insert
to authenticated
with check (auth.uid() is not null);

create or replace function public.touch_staff_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists staff_profiles_touch_updated_at on public.staff_profiles;
create trigger staff_profiles_touch_updated_at
before update on public.staff_profiles
for each row execute function public.touch_staff_updated_at();

drop trigger if exists staff_medical_info_touch_updated_at on public.staff_medical_info;
create trigger staff_medical_info_touch_updated_at
before update on public.staff_medical_info
for each row execute function public.touch_staff_updated_at();

create or replace function public.get_admin_staff_profiles()
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

  select coalesce(jsonb_agg(
    to_jsonb(sp)
    || jsonb_build_object(
      'medical_info', to_jsonb(smi),
      'assignment', to_jsonb(sa)
    )
    order by sp.name_th nulls last, sp.nickname nulls last
  ), '[]'::jsonb)
  into result
  from public.staff_profiles sp
  left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id;

  insert into public.staff_audit_logs (actor_id, action, new_data)
  values (auth.uid(), 'staff_data_viewed', jsonb_build_object('count', jsonb_array_length(result)));

  return result;
end;
$$;

create or replace function public.get_staff_public_directory()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_admin(auth.uid()) or public.is_staff(auth.uid())) then
    raise exception 'staff access required';
  end if;

  return (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id', sp.id,
      'name_th', sp.name_th,
      'name_en', sp.name_en,
      'nickname', sp.nickname,
      'major', sp.major,
      'instagram', sp.instagram,
      'line_id', sp.line_id,
      'facebook', sp.facebook,
      'position', sp.position,
      'main_group', sa.main_group,
      'subgroup', sa.subgroup,
      'role', sa.role
    ) order by sa.main_group, sa.subgroup, sp.name_th), '[]'::jsonb)
    from public.staff_profiles sp
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
      phone = case when input_profile ? 'phone' then nullif(input_profile->>'phone', '') else phone end,
      major = case when input_profile ? 'major' then nullif(input_profile->>'major', '') else major end,
      instagram = case when input_profile ? 'instagram' then nullif(input_profile->>'instagram', '') else instagram end,
      line_id = case when input_profile ? 'line_id' then nullif(input_profile->>'line_id', '') else line_id end,
      facebook = case when input_profile ? 'facebook' then nullif(input_profile->>'facebook', '') else facebook end,
      other_contact = case when input_profile ? 'other_contact' then nullif(input_profile->>'other_contact', '') else other_contact end,
      position = case when input_profile ? 'position' then nullif(input_profile->>'position', '') else position end
  where id = input_staff_profile_id
  returning * into updated_profile;

  if not found then
    raise exception 'staff profile not found';
  end if;

  if input_medical <> '{}'::jsonb then
    insert into public.staff_medical_info (staff_profile_id, disease, drug_allergy, food_allergy, medical_note)
    values (
      input_staff_profile_id,
      nullif(input_medical->>'disease', ''),
      nullif(input_medical->>'drug_allergy', ''),
      nullif(input_medical->>'food_allergy', ''),
      nullif(input_medical->>'medical_note', '')
    )
    on conflict (staff_profile_id) do update
    set disease = excluded.disease,
        drug_allergy = excluded.drug_allergy,
        food_allergy = excluded.food_allergy,
        medical_note = excluded.medical_note;
  end if;

  if input_assignment <> '{}'::jsonb then
    insert into public.staff_assignments (staff_profile_id, user_id, role, main_group, subgroup)
    values (
      input_staff_profile_id,
      updated_profile.user_id,
      coalesce(nullif(input_assignment->>'role', ''), 'staff'),
      nullif(input_assignment->>'main_group', ''),
      nullif(input_assignment->>'subgroup', '')
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
      student_id, email, name_th, name_en, nickname, phone, major,
      instagram, line_id, facebook, other_contact, position
    )
    values (
      nullif(profile_input->>'student_id', ''),
      lower(nullif(profile_input->>'email', '')),
      nullif(profile_input->>'name_th', ''),
      nullif(profile_input->>'name_en', ''),
      nullif(profile_input->>'nickname', ''),
      nullif(profile_input->>'phone', ''),
      nullif(profile_input->>'major', ''),
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
        phone = excluded.phone,
        major = excluded.major,
        instagram = excluded.instagram,
        line_id = excluded.line_id,
        facebook = excluded.facebook,
        other_contact = excluded.other_contact,
        position = excluded.position
    returning * into profile_row;

    if medical_input <> '{}'::jsonb then
      insert into public.staff_medical_info (staff_profile_id, disease, drug_allergy, food_allergy, medical_note)
      values (
        profile_row.id,
        nullif(medical_input->>'disease', ''),
        nullif(medical_input->>'drug_allergy', ''),
        nullif(medical_input->>'food_allergy', ''),
        nullif(medical_input->>'medical_note', '')
      )
      on conflict (staff_profile_id) do update
      set disease = excluded.disease,
          drug_allergy = excluded.drug_allergy,
          food_allergy = excluded.food_allergy,
          medical_note = excluded.medical_note;
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

grant select on public.staff_profiles to authenticated;
grant select on public.staff_medical_info to authenticated;
grant select, insert on public.staff_audit_logs to authenticated;
grant execute on function public.staff_has_role(text[]) to authenticated;
grant execute on function public.get_admin_staff_profiles() to authenticated;
grant execute on function public.get_staff_public_directory() to authenticated;
grant execute on function public.update_staff_profile_admin(uuid, jsonb, jsonb, jsonb) to authenticated;
grant execute on function public.import_staff_records_admin(jsonb) to authenticated;
