create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  student_id text,
  name_th text,
  name_en text,
  nickname text,
  major text,
  phone text,
  emergency_phone text,
  line_id text,
  instagram text,
  facebook text,
  other_contact text,
  food_allergy text,
  disease text,
  drug_allergy text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.edit_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  requested_by_email text,
  old_data jsonb,
  new_data jsonb,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  reviewed_by uuid references auth.users(id)
);

create table if not exists public.change_logs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  changed_by uuid references auth.users(id),
  action text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text default 'admin'
);

create index if not exists profiles_search_idx on public.profiles using gin (
  to_tsvector(
    'simple',
    coalesce(name_th, '') || ' ' ||
    coalesce(name_en, '') || ' ' ||
    coalesce(nickname, '') || ' ' ||
    coalesce(major, '') || ' ' ||
    coalesce(email, '') || ' ' ||
    coalesce(phone, '') || ' ' ||
    coalesce(line_id, '') || ' ' ||
    coalesce(instagram, '') || ' ' ||
    coalesce(facebook, '')
  )
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create or replace view public.public_profiles as
select id, name_th, nickname, major
from public.profiles;

create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admins where user_id = uid);
$$;

create or replace function public.normalize_phone(value text)
returns text
language sql
immutable
as $$
  select regexp_replace(coalesce(value, ''), '[^0-9+]', '', 'g');
$$;

create or replace function public.verify_profile_identity(input_email text, input_phone text)
returns setof public.profiles
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.profiles
  where lower(email) = lower(trim(input_email))
    and public.normalize_phone(phone) = public.normalize_phone(input_phone)
  limit 1;
$$;

create or replace function public.parse_contact(contact text)
returns table (
  line_id text,
  instagram text,
  facebook text,
  phone text,
  other_contact text
)
language plpgsql
immutable
as $$
declare
  src text := coalesce(contact, '');
  phone_match text[];
  ig_match text[];
  line_match text[];
  fb_match text[];
  leftover text;
begin
  phone_match := regexp_match(src, '((\+66|0)[689][0-9]{8})');
  ig_match := regexp_match(src, '(?i)(?:ig|instagram)\s*[:=@]?\s*([A-Za-z0-9._]{2,30})|@([A-Za-z0-9._]{2,30})');
  line_match := regexp_match(src, '(?i)(?:line|ไลน์)\s*[:=@]?\s*([A-Za-z0-9._-]{2,40})');
  fb_match := regexp_match(src, '(?i)(?:facebook|fb)\s*[:=@]?\s*([A-Za-z0-9._/-]{2,80})');

  phone := coalesce(phone_match[1], '');
  instagram := coalesce(ig_match[1], ig_match[2], '');
  line_id := coalesce(line_match[1], '');
  facebook := coalesce(fb_match[1], '');

  leftover := src;
  if phone <> '' then leftover := replace(leftover, phone, ''); end if;
  if instagram <> '' then leftover := replace(leftover, instagram, ''); end if;
  if line_id <> '' then leftover := replace(leftover, line_id, ''); end if;
  if facebook <> '' then leftover := replace(leftover, facebook, ''); end if;
  leftover := regexp_replace(leftover, '(?i)(line|ไลน์|ig|instagram|facebook|fb)\s*[:=@]?', '', 'g');
  leftover := regexp_replace(leftover, '[;,|]+', ' ', 'g');
  other_contact := nullif(btrim(regexp_replace(leftover, '\s+', ' ', 'g')), '');

  return next;
end;
$$;

create or replace function public.search_public_profiles(search_text text default '', major_filter text default '')
returns table (
  id uuid,
  name_th text,
  nickname text,
  major text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name_th, p.nickname, p.major
  from public.profiles p
  where (
    coalesce(search_text, '') = ''
    or p.name_th ilike '%' || search_text || '%'
    or p.name_en ilike '%' || search_text || '%'
    or p.nickname ilike '%' || search_text || '%'
    or p.major ilike '%' || search_text || '%'
  )
  and (
    coalesce(major_filter, '') = ''
    or p.major = major_filter
  )
  order by p.name_th nulls last;
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
    'drug_allergy'
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
    drug_allergy = coalesce(request_row.new_data->>'drug_allergy', drug_allergy)
  where id = request_row.profile_id;

  update public.edit_requests
  set status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  where id = request_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (request_row.profile_id, auth.uid(), 'approved', old_profile, request_row.new_data);
end;
$$;

create or replace function public.reject_edit_request(request_id uuid, note text)
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
  where id = request_id and status = 'pending'
  for update;

  if not found then
    raise exception 'pending request not found';
  end if;

  update public.edit_requests
  set status = 'rejected', admin_note = note, reviewed_at = now(), reviewed_by = auth.uid()
  where id = request_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (request_row.profile_id, auth.uid(), 'rejected', request_row.old_data, jsonb_build_object('admin_note', note));
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
    drug_allergy = coalesce(input_new_data->>'drug_allergy', drug_allergy)
  where id = input_profile_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (input_profile_id, auth.uid(), 'direct_update', old_profile, input_new_data);
end;
$$;

create or replace function public.delete_profile_admin(input_profile_id uuid)
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
  delete from public.profiles where id = input_profile_id;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (input_profile_id, auth.uid(), 'delete', old_profile, '{}'::jsonb);
end;
$$;

alter table public.profiles enable row level security;
alter table public.edit_requests enable row level security;
alter table public.change_logs enable row level security;
alter table public.admins enable row level security;

drop policy if exists "Admins can read profiles" on public.profiles;
create policy "Admins can read profiles"
on public.profiles for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles"
on public.profiles for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read edit requests" on public.edit_requests;
create policy "Admins can read edit requests"
on public.edit_requests for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update edit requests" on public.edit_requests;
create policy "Admins can update edit requests"
on public.edit_requests for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can read change logs" on public.change_logs;
create policy "Admins can read change logs"
on public.change_logs for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can read admins" on public.admins;
create policy "Admins can read admins"
on public.admins for select
to authenticated
using (public.is_admin(auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.public_profiles to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.edit_requests to authenticated;
grant select on public.change_logs to authenticated;
grant execute on function public.is_admin(uuid) to anon, authenticated;
grant execute on function public.verify_profile_identity(text, text) to anon, authenticated;
grant execute on function public.search_public_profiles(text, text) to anon, authenticated;
grant execute on function public.submit_edit_request(text, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.parse_contact(text) to anon, authenticated;
grant execute on function public.approve_edit_request(uuid) to authenticated;
grant execute on function public.reject_edit_request(uuid, text) to authenticated;
grant execute on function public.update_profile_admin(uuid, jsonb) to authenticated;
grant execute on function public.delete_profile_admin(uuid) to authenticated;
