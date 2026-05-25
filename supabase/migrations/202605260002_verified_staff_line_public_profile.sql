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
      line_id = case when input_public_data ? 'line_id' then public.clean_placeholder_text(input_public_data->>'line_id') else line_id end,
      facebook = case when input_public_data ? 'facebook' then public.clean_placeholder_text(input_public_data->>'facebook') else facebook end,
      updated_at = now()
  where id = staff_id;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, new_data)
  values (staff_id, null, 'staff_public_profile_verified_updated', input_public_data);

  return public.verified_staff_profile_context(staff_id);
end;
$$;

grant execute on function public.update_staff_public_profile_verified(text, text, jsonb) to anon, authenticated;
