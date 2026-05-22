create extension if not exists pgcrypto with schema extensions;

create or replace function public.staff_attendance_random_token()
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select encode(extensions.gen_random_bytes(32), 'hex');
$$;

create or replace function public.generate_staff_attendance_token()
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select public.staff_attendance_random_token();
$$;

alter table if exists public.staff_public_profiles
  alter column qr_token set default encode(extensions.gen_random_bytes(16), 'hex');

alter table public.staff_attendance_records
  drop constraint if exists staff_attendance_records_method_check;

alter table public.staff_attendance_records
  add constraint staff_attendance_records_method_check
  check (method in ('session_qr', 'verified_qr', 'verified_camera_scan', 'manual', 'admin_scan_staff_qr', 'import', 'system'));

create or replace function public.staff_attendance_safe_staff_json(input_session_id uuid, input_staff_profile_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'staff_profile_id', sp.id,
    'display_name', coalesce(sp.nickname_th, sp.nickname, sp.nickname_en, sp.name_th, sp.name_en, sp.student_id, 'Staff'),
    'main_group', sa.main_group,
    'subgroup', sa.subgroup,
    'primary_role', sa.primary_role
  )
  from public.staff_profiles sp
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where sp.id = input_staff_profile_id
    and public.staff_attendance_session_targets_staff(input_session_id, sp.id)
  limit 1;
$$;

create or replace function public.scan_staff_attendance_session_qr_verified(
  input_token text,
  input_email text,
  input_phone text,
  input_device_info jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  token_value text := public.clean_placeholder_text(input_token);
  email_value text := lower(public.clean_placeholder_text(input_email));
  phone_value text := public.normalize_phone(input_phone);
  session_row public.staff_attendance_sessions;
  safe_session jsonb;
  staff_row public.staff_profiles;
  existing_record public.staff_attendance_records;
  new_status text;
  record_row public.staff_attendance_records;
  safe_staff jsonb;
begin
  select * into session_row
  from public.staff_attendance_sessions
  where qr_token = token_value;

  if not found then
    return jsonb_build_object('success', false, 'code', 'session_not_found', 'message', 'attendance session not found');
  end if;

  safe_session := to_jsonb(session_row) - 'qr_token' - 'created_by';

  if session_row.status <> 'active' then
    return jsonb_build_object('success', false, 'code', 'session_not_active', 'message', 'attendance session is not active', 'session', safe_session);
  end if;

  if now() < session_row.starts_at then
    return jsonb_build_object('success', false, 'code', 'session_not_started', 'message', 'attendance session has not started', 'session', safe_session);
  end if;

  if session_row.ends_at is not null and now() > session_row.ends_at then
    return jsonb_build_object('success', false, 'code', 'session_closed', 'message', 'attendance session is closed', 'session', safe_session);
  end if;

  if session_row.qr_expires_at is not null and now() > session_row.qr_expires_at then
    return jsonb_build_object('success', false, 'code', 'qr_expired', 'message', 'qr expired', 'session', safe_session);
  end if;

  if email_value is null or phone_value is null then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'email and phone are required', 'session', safe_session);
  end if;

  select * into staff_row
  from public.staff_profiles sp
  where lower(public.clean_placeholder_text(sp.email)) = email_value
    and public.normalize_phone(sp.phone) = phone_value
  order by sp.updated_at desc nulls last, sp.created_at desc nulls last
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'staff identity verification failed', 'session', safe_session);
  end if;

  if not public.staff_attendance_session_targets_staff(session_row.id, staff_row.id) then
    return jsonb_build_object(
      'success', false,
      'code', 'not_in_target_scope',
      'message', 'staff is not in target scope',
      'session', safe_session,
      'staff', public.staff_attendance_safe_staff_json(session_row.id, staff_row.id)
    );
  end if;

  safe_staff := public.staff_attendance_safe_staff_json(session_row.id, staff_row.id);

  select * into existing_record
  from public.staff_attendance_records
  where session_id = session_row.id
    and staff_profile_id = staff_row.id;

  if found then
    return jsonb_build_object(
      'success', true,
      'code', 'already_checked',
      'message', 'already checked',
      'session', safe_session,
      'record', to_jsonb(existing_record),
      'staff', safe_staff
    );
  end if;

  new_status := case
    when session_row.session_type in ('check_out', 'shift_end') then 'checked_out'
    when session_row.late_after is not null and now() > session_row.late_after then 'late'
    else 'present'
  end;

  insert into public.staff_attendance_records (session_id, staff_profile_id, status, method, scanned_at, checked_by, note, device_info)
  values (session_row.id, staff_row.id, new_status, 'verified_qr', now(), null, 'verified by email + phone', coalesce(input_device_info, '{}'::jsonb))
  returning * into record_row;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, old_data, new_data)
  values (staff_row.id, null, 'staff_attendance_verified_qr_scanned', '{}'::jsonb, to_jsonb(record_row));

  return jsonb_build_object(
    'success', true,
    'code', case when new_status = 'late' then 'late' when new_status = 'checked_out' then 'checked_out' else 'checked_in' end,
    'message', 'attendance recorded',
    'session', safe_session,
    'record', to_jsonb(record_row),
    'staff', safe_staff
  );
end;
$$;

grant execute on function public.staff_attendance_random_token() to authenticated;
grant execute on function public.generate_staff_attendance_token() to authenticated;
grant execute on function public.scan_staff_attendance_session_qr_verified(text, text, text, jsonb) to anon, authenticated;
