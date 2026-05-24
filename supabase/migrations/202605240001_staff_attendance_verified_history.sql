create or replace function public.get_staff_attendance_history_by_verified_token(input_verified_staff_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  verified_token text := public.normalize_staff_identity_qr_token(input_verified_staff_token);
  staff_id uuid;
  staff_json jsonb;
  active_sessions jsonb;
  records_json jsonb;
begin
  select staff_profile_id into staff_id
  from public.staff_attendance_identity_tokens
  where token = verified_token
    and status = 'active';

  if staff_id is null then
    return jsonb_build_object(
      'staff_profile', null,
      'active_sessions', '[]'::jsonb,
      'records', '[]'::jsonb,
      'latest_record', null
    );
  end if;

  select jsonb_build_object(
    'id', sp.id,
    'name_th', sp.name_th,
    'name_en', sp.name_en,
    'nickname', sp.nickname,
    'nickname_th', sp.nickname_th,
    'nickname_en', sp.nickname_en,
    'student_id', sp.student_id,
    'assignment', to_jsonb(sa),
    'public_profile', null
  )
  into staff_json
  from public.staff_profiles sp
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where sp.id = staff_id
  limit 1;

  select coalesce(jsonb_agg(
    to_jsonb(s) - 'qr_token' - 'created_by'
    || jsonb_build_object(
      'record', to_jsonb(r),
      'summary', public.staff_attendance_session_summary(s.id)
    )
    order by s.starts_at
  ), '[]'::jsonb)
  into active_sessions
  from public.staff_attendance_sessions s
  left join public.staff_attendance_records r on r.session_id = s.id and r.staff_profile_id = staff_id
  where s.status = 'active'
    and now() >= s.starts_at
    and (s.ends_at is null or now() <= s.ends_at)
    and public.staff_attendance_session_targets_staff(s.id, staff_id);

  select coalesce(jsonb_agg(
    to_jsonb(r) || jsonb_build_object('session', to_jsonb(s) - 'qr_token' - 'created_by')
    order by r.scanned_at desc nulls last, r.updated_at desc
  ), '[]'::jsonb)
  into records_json
  from public.staff_attendance_records r
  join public.staff_attendance_sessions s on s.id = r.session_id
  where r.staff_profile_id = staff_id;

  return jsonb_build_object(
    'staff_profile', staff_json,
    'active_sessions', active_sessions,
    'records', records_json,
    'latest_record', case when jsonb_array_length(records_json) > 0 then records_json->0 else null end
  );
end;
$$;

grant execute on function public.get_staff_attendance_history_by_verified_token(text) to anon, authenticated;
