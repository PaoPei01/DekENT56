alter table public.staff_assignments
  add column if not exists base_number integer;

alter table public.staff_public_profiles
  alter column public_profile_enabled set default true,
  alter column show_instagram set default false,
  alter column show_line_id set default false,
  alter column show_facebook set default false,
  alter column show_phone_to_public set default false,
  alter column show_phone_to_staff set default true;

insert into public.staff_public_profiles (
  staff_profile_id,
  public_profile_enabled,
  show_instagram,
  show_line_id,
  show_facebook,
  show_phone_to_public,
  show_phone_to_staff
)
select
  sp.id,
  true,
  false,
  false,
  false,
  false,
  true
from public.staff_profiles sp
where exists (
  select 1
  from public.staff_assignments sa
  where sa.staff_profile_id = sp.id
    and sa.primary_role in ('พี่กลุ่ม', 'พี่ฐาน')
)
on conflict (staff_profile_id) do nothing;

update public.staff_public_profiles spp
set public_profile_enabled = exists (
      select 1
      from public.staff_assignments sa
      where sa.staff_profile_id = spp.staff_profile_id
        and sa.primary_role in ('พี่กลุ่ม', 'พี่ฐาน')
    ),
    show_instagram = false,
    show_line_id = false,
    show_facebook = false,
    show_phone_to_public = false,
    show_phone_to_staff = coalesce(show_phone_to_staff, true),
    updated_at = now();

create or replace function public.update_my_staff_public_profile(input_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_id uuid := public.my_staff_profile_id();
  updated public.staff_public_profiles;
  interests_value text[];
begin
  if staff_id is null then
    raise exception 'staff access required';
  end if;

  select coalesce(array_agg(public.clean_placeholder_text(value)), '{}'::text[])
  into interests_value
  from jsonb_array_elements_text(coalesce(input_data->'interests', '[]'::jsonb)) value
  where public.clean_placeholder_text(value) is not null;

  insert into public.staff_public_profiles (
    staff_profile_id, avatar_url, bio, hometown, interests,
    public_profile_enabled, show_instagram, show_line_id, show_facebook,
    show_phone_to_staff, show_phone_to_public, profile_completed_at, updated_at
  )
  values (
    staff_id,
    public.clean_placeholder_text(input_data->>'avatar_url'),
    public.clean_placeholder_text(input_data->>'bio'),
    public.clean_placeholder_text(input_data->>'hometown'),
    interests_value,
    coalesce((input_data->>'public_profile_enabled')::boolean, true),
    coalesce((input_data->>'show_instagram')::boolean, false),
    coalesce((input_data->>'show_line_id')::boolean, false),
    coalesce((input_data->>'show_facebook')::boolean, false),
    coalesce((input_data->>'show_phone_to_staff')::boolean, true),
    false,
    case when public.clean_placeholder_text(input_data->>'bio') is not null then now() else null end,
    now()
  )
  on conflict (staff_profile_id) do update
  set avatar_url = case when input_data ? 'avatar_url' then excluded.avatar_url else staff_public_profiles.avatar_url end,
      bio = case when input_data ? 'bio' then excluded.bio else staff_public_profiles.bio end,
      hometown = case when input_data ? 'hometown' then excluded.hometown else staff_public_profiles.hometown end,
      interests = case when input_data ? 'interests' then excluded.interests else staff_public_profiles.interests end,
      public_profile_enabled = case when input_data ? 'public_profile_enabled' then excluded.public_profile_enabled else staff_public_profiles.public_profile_enabled end,
      show_instagram = case when input_data ? 'show_instagram' then excluded.show_instagram else staff_public_profiles.show_instagram end,
      show_line_id = case when input_data ? 'show_line_id' then excluded.show_line_id else staff_public_profiles.show_line_id end,
      show_facebook = case when input_data ? 'show_facebook' then excluded.show_facebook else staff_public_profiles.show_facebook end,
      show_phone_to_staff = case when input_data ? 'show_phone_to_staff' then excluded.show_phone_to_staff else staff_public_profiles.show_phone_to_staff end,
      show_phone_to_public = false,
      profile_completed_at = coalesce(staff_public_profiles.profile_completed_at, excluded.profile_completed_at),
      updated_at = now()
  returning * into updated;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, new_data)
  values (staff_id, auth.uid(), 'staff_public_profile_updated', to_jsonb(updated));

  return to_jsonb(updated);
end;
$$;

create or replace function public.update_staff_public_profile_verified(input_email text, input_phone text, input_public_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_id uuid := public.find_verified_staff_profile(input_email, input_phone);
  interests_value text[];
begin
  if staff_id is null then
    raise exception 'ไม่พบข้อมูลทีมงานที่ตรงกับอีเมลและเบอร์โทรนี้';
  end if;

  select coalesce(array_agg(public.clean_placeholder_text(value)), '{}'::text[])
  into interests_value
  from jsonb_array_elements_text(coalesce(input_public_data->'interests', '[]'::jsonb)) value
  where public.clean_placeholder_text(value) is not null;

  insert into public.staff_public_profiles (staff_profile_id)
  values (staff_id)
  on conflict (staff_profile_id) do nothing;

  update public.staff_public_profiles
  set avatar_url = case when input_public_data ? 'avatar_url' then public.clean_placeholder_text(input_public_data->>'avatar_url') else avatar_url end,
      bio = case when input_public_data ? 'bio' then public.clean_placeholder_text(input_public_data->>'bio') else bio end,
      hometown = case when input_public_data ? 'hometown' then public.clean_placeholder_text(input_public_data->>'hometown') else hometown end,
      interests = case when input_public_data ? 'interests' then interests_value else interests end,
      public_profile_enabled = case when input_public_data ? 'public_profile_enabled' then (input_public_data->>'public_profile_enabled')::boolean else public_profile_enabled end,
      show_instagram = case when input_public_data ? 'show_instagram' then (input_public_data->>'show_instagram')::boolean else show_instagram end,
      show_facebook = case when input_public_data ? 'show_facebook' then (input_public_data->>'show_facebook')::boolean else show_facebook end,
      show_line_id = case when input_public_data ? 'show_line_id' then (input_public_data->>'show_line_id')::boolean else show_line_id end,
      show_phone_to_staff = case when input_public_data ? 'show_phone_to_staff' then (input_public_data->>'show_phone_to_staff')::boolean else show_phone_to_staff end,
      show_phone_to_public = false,
      profile_completed_at = coalesce(profile_completed_at, now()),
      updated_at = now()
  where staff_profile_id = staff_id;

  update public.staff_profiles
  set instagram = case when input_public_data ? 'instagram' then public.clean_placeholder_text(input_public_data->>'instagram') else instagram end,
      facebook = case when input_public_data ? 'facebook' then public.clean_placeholder_text(input_public_data->>'facebook') else facebook end,
      updated_at = now()
  where id = staff_id;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, new_data)
  values (staff_id, null, 'staff_public_profile_verified_updated', input_public_data);

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
    'facebook', case when spp.show_facebook then sp.facebook else null end,
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
    'line_id', case when coalesce(spp.show_line_id, false) then sp.line_id else null end,
    'facebook', case when coalesce(spp.show_facebook, false) then sp.facebook else null end
  ) order by sa.primary_role, sa.base_number, sp.nickname_th, sp.name_th), '[]'::jsonb)
  into result
  from public.staff_profiles sp
  left join public.staff_public_profiles spp on spp.staff_profile_id = sp.id
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id;

  return result;
end;
$$;

grant execute on function public.update_my_staff_public_profile(jsonb) to authenticated;
grant execute on function public.update_staff_public_profile_verified(text, text, jsonb) to anon, authenticated;
grant execute on function public.get_public_staff_cards(text, text) to anon, authenticated;
grant execute on function public.get_staff_directory() to authenticated;
