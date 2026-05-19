alter table public.profiles
  add column if not exists admission_round text check (admission_round is null or admission_round in ('Portfolio', 'Quota', 'Admission')),
  add column if not exists gender text,
  add column if not exists hometown text,
  add column if not exists interests text,
  add column if not exists public_profile boolean default false,
  add column if not exists show_instagram boolean default false,
  add column if not exists show_line_id boolean default false;

update public.profiles
set major = 'ภาควิชาวิศวกรรมอุตสาหการและการจัดการ โลจิสติกส์ (IEL)'
where major ilike '%Industrial Engineering and Logistics Management%'
   or major ilike '%โลจิสติกส์ (IEL)%';

create table if not exists public.group_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  main_group text not null check (main_group in ('Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Purple', 'Orange')),
  subgroup text not null check (subgroup in ('A', 'B')),
  assigned_by uuid references auth.users(id),
  assigned_at timestamp with time zone default now(),
  locked boolean default false,
  locked_at timestamp with time zone,
  locked_by uuid references auth.users(id),
  notes text
);

alter table public.group_assignments enable row level security;

drop policy if exists "Admins can read group assignments" on public.group_assignments;
create policy "Admins can read group assignments"
on public.group_assignments for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can insert group assignments" on public.group_assignments;
create policy "Admins can insert group assignments"
on public.group_assignments for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update group assignments" on public.group_assignments;
create policy "Admins can update group assignments"
on public.group_assignments for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete group assignments" on public.group_assignments;
create policy "Admins can delete group assignments"
on public.group_assignments for delete
to authenticated
using (public.is_admin(auth.uid()));

create or replace function public.save_group_assignments(input_assignments jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  if exists (select 1 from public.group_assignments where locked = true) then
    raise exception 'group assignments are locked';
  end if;

  for item in select * from jsonb_array_elements(input_assignments)
  loop
    insert into public.group_assignments (profile_id, main_group, subgroup, assigned_by, assigned_at, locked, notes)
    values (
      (item->>'profile_id')::uuid,
      item->>'main_group',
      item->>'subgroup',
      auth.uid(),
      now(),
      false,
      item->>'notes'
    )
    on conflict (profile_id) do update
    set
      main_group = excluded.main_group,
      subgroup = excluded.subgroup,
      assigned_by = auth.uid(),
      assigned_at = now(),
      notes = excluded.notes
    where public.group_assignments.locked is not true;
  end loop;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'group_assignment_regenerated', '{}'::jsonb, jsonb_build_object('count', jsonb_array_length(input_assignments)));
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

  select *
  into assignment_row
  from public.group_assignments
  where profile_id = profile_row.id;

  return jsonb_build_object(
    'profile', to_jsonb(profile_row) - array['phone', 'emergency_phone', 'food_allergy', 'disease', 'drug_allergy'],
    'assignment', to_jsonb(assignment_row)
  );
end;
$$;

create or replace function public.get_friend_recommendations(input_email text, input_phone text)
returns table (
  id uuid,
  name_th text,
  name_en text,
  nickname text,
  major text,
  admission_round text,
  instagram text,
  line_id text,
  score int
)
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
  where lower(email) = lower(trim(input_email))
    and public.normalize_phone(phone) = public.normalize_phone(input_phone)
  limit 1;

  if not found then
    return;
  end if;

  select *
  into assignment_row
  from public.group_assignments
  where profile_id = profile_row.id;

  if not found then
    return;
  end if;

  return query
  select
    p.id,
    p.name_th,
    p.name_en,
    p.nickname,
    p.major,
    p.admission_round,
    case when p.public_profile and p.show_instagram then p.instagram else null end as instagram,
    case when p.public_profile and p.show_line_id then p.line_id else null end as line_id,
    (
      case when p.major = profile_row.major then 40 else 0 end +
      case when p.admission_round = profile_row.admission_round then 25 else 0 end +
      case when p.hometown = profile_row.hometown and p.hometown is not null then 20 else 0 end +
      case when p.interests = profile_row.interests and p.interests is not null then 15 else 0 end
    ) as score
  from public.group_assignments ga
  join public.profiles p on p.id = ga.profile_id
  where ga.main_group = assignment_row.main_group
    and ga.subgroup = assignment_row.subgroup
    and p.id <> profile_row.id
    and p.public_profile is true
  order by score desc, p.nickname nulls last
  limit 12;
end;
$$;

create or replace function public.update_profile_admin(input_profile_id uuid, input_new_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_profile jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select to_jsonb(p) into old_profile from public.profiles p where p.id = input_profile_id;

  update public.profiles
  set
    email = coalesce(input_new_data->>'email', email),
    student_id = coalesce(input_new_data->>'student_id', student_id),
    name_th = coalesce(input_new_data->>'name_th', name_th),
    name_en = coalesce(input_new_data->>'name_en', name_en),
    nickname = coalesce(input_new_data->>'nickname', nickname),
    major = coalesce(input_new_data->>'major', major),
    phone = coalesce(input_new_data->>'phone', phone),
    emergency_phone = coalesce(input_new_data->>'emergency_phone', emergency_phone),
    line_id = coalesce(input_new_data->>'line_id', line_id),
    instagram = coalesce(input_new_data->>'instagram', instagram),
    facebook = coalesce(input_new_data->>'facebook', facebook),
    other_contact = coalesce(input_new_data->>'other_contact', other_contact),
    food_allergy = coalesce(input_new_data->>'food_allergy', food_allergy),
    disease = coalesce(input_new_data->>'disease', disease),
    drug_allergy = coalesce(input_new_data->>'drug_allergy', drug_allergy),
    admission_round = coalesce(input_new_data->>'admission_round', admission_round),
    gender = coalesce(input_new_data->>'gender', gender),
    hometown = coalesce(input_new_data->>'hometown', hometown),
    interests = coalesce(input_new_data->>'interests', interests),
    public_profile = coalesce((input_new_data->>'public_profile')::boolean, public_profile),
    show_instagram = coalesce((input_new_data->>'show_instagram')::boolean, show_instagram),
    show_line_id = coalesce((input_new_data->>'show_line_id')::boolean, show_line_id)
  where id = input_profile_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (input_profile_id, auth.uid(), 'direct_update', old_profile, input_new_data);
end;
$$;

create or replace function public.submit_edit_request(
  input_email text,
  input_phone text,
  input_profile_id uuid,
  input_new_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  allowed_keys text[] := array[
    'nickname',
    'phone',
    'emergency_phone',
    'line_id',
    'instagram',
    'facebook',
    'other_contact',
    'food_allergy',
    'disease',
    'drug_allergy',
    'public_profile',
    'show_instagram',
    'show_line_id'
  ];
  clean_new_data jsonb;
begin
  select *
  into profile_row
  from public.profiles
  where id = input_profile_id
    and lower(email) = lower(trim(input_email))
    and public.normalize_phone(phone) = public.normalize_phone(input_phone);

  if not found then
    raise exception 'identity verification failed';
  end if;

  select jsonb_object_agg(key, value)
  into clean_new_data
  from jsonb_each(input_new_data)
  where key = any(allowed_keys);

  insert into public.edit_requests (profile_id, requested_by_email, old_data, new_data, status)
  values (
    profile_row.id,
    profile_row.email,
    to_jsonb(profile_row) - array['id', 'email', 'student_id', 'name_th', 'name_en', 'major', 'created_at', 'updated_at'],
    coalesce(clean_new_data, '{}'::jsonb),
    'pending'
  );
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
  old_profile jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select * into request_row
  from public.edit_requests
  where id = request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'pending request not found';
  end if;

  select to_jsonb(p) into old_profile from public.profiles p where p.id = request_row.profile_id;

  update public.profiles
  set
    nickname = coalesce(request_row.new_data->>'nickname', nickname),
    phone = coalesce(request_row.new_data->>'phone', phone),
    emergency_phone = coalesce(request_row.new_data->>'emergency_phone', emergency_phone),
    line_id = coalesce(request_row.new_data->>'line_id', line_id),
    instagram = coalesce(request_row.new_data->>'instagram', instagram),
    facebook = coalesce(request_row.new_data->>'facebook', facebook),
    other_contact = coalesce(request_row.new_data->>'other_contact', other_contact),
    food_allergy = coalesce(request_row.new_data->>'food_allergy', food_allergy),
    disease = coalesce(request_row.new_data->>'disease', disease),
    drug_allergy = coalesce(request_row.new_data->>'drug_allergy', drug_allergy),
    public_profile = coalesce((request_row.new_data->>'public_profile')::boolean, public_profile),
    show_instagram = coalesce((request_row.new_data->>'show_instagram')::boolean, show_instagram),
    show_line_id = coalesce((request_row.new_data->>'show_line_id')::boolean, show_line_id)
  where id = request_row.profile_id;

  update public.edit_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = request_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (request_row.profile_id, auth.uid(), 'approved', old_profile, request_row.new_data);
end;
$$;

grant select on public.group_assignments to authenticated;
grant execute on function public.save_group_assignments(jsonb) to authenticated;
grant execute on function public.lock_group_assignments() to authenticated;
grant execute on function public.get_verified_group_context(text, text) to anon, authenticated;
grant execute on function public.get_friend_recommendations(text, text) to anon, authenticated;
