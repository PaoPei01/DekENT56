create extension if not exists pgcrypto with schema extensions;

create or replace function public.generate_secure_token()
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
  select public.generate_secure_token();
$$;

create table if not exists public.staff_attendance_identity_tokens (
  id uuid primary key default gen_random_uuid(),
  staff_profile_id uuid not null references public.staff_profiles(id) on delete cascade,
  token text not null unique,
  status text not null default 'active',
  created_at timestamptz default now(),
  regenerated_at timestamptz,
  unique(staff_profile_id)
);

alter table public.staff_attendance_identity_tokens
  add column if not exists regenerated_at timestamptz;

alter table public.staff_attendance_identity_tokens
  drop constraint if exists staff_attendance_identity_tokens_status_check;

alter table public.staff_attendance_identity_tokens
  add constraint staff_attendance_identity_tokens_status_check
  check (status in ('active', 'revoked'));

alter table public.staff_attendance_records
  drop constraint if exists staff_attendance_records_method_check;

alter table public.staff_attendance_records
  add constraint staff_attendance_records_method_check
  check (method in ('session_qr', 'verified_qr', 'verified_camera_scan', 'manual', 'admin_scan_staff_qr', 'import', 'system'));

alter table public.staff_attendance_identity_tokens enable row level security;

drop policy if exists "Admins manage staff attendance identity tokens" on public.staff_attendance_identity_tokens;
create policy "Admins manage staff attendance identity tokens"
on public.staff_attendance_identity_tokens for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Staff read own attendance identity token" on public.staff_attendance_identity_tokens;
create policy "Staff read own attendance identity token"
on public.staff_attendance_identity_tokens for select
to authenticated
using (staff_profile_id = public.staff_attendance_current_staff_profile_id());

create or replace function public.staff_personal_qr_safe_staff_json(input_staff_profile_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'staff_profile_id', sp.id,
    'display_name', coalesce(sp.nickname_th, sp.nickname, sp.nickname_en, sp.name_th, sp.name_en, sp.student_id, 'Staff'),
    'nickname', coalesce(sp.nickname_th, sp.nickname, sp.nickname_en),
    'main_group', sa.main_group,
    'subgroup', sa.subgroup,
    'primary_role', sa.primary_role
  )
  from public.staff_profiles sp
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where sp.id = input_staff_profile_id
  limit 1;
$$;

create or replace function public.normalize_staff_identity_qr_token(input_value text)
returns text
language plpgsql
immutable
as $normalize_staff_identity_qr_token$
declare
  raw text := public.clean_placeholder_text(input_value);
  found text;
begin
  if raw is null then
    return null;
  end if;

  if position('staff_identity:' in raw) = 1 then
    return public.clean_placeholder_text(substring(raw from length('staff_identity:') + 1));
  end if;

  found := substring(raw from '[?&]token=([^&[:space:]]+)');
  if found is not null then
    return public.clean_placeholder_text(found);
  end if;

  return raw;
end;
$normalize_staff_identity_qr_token$;

create or replace function public.get_staff_personal_qr_verified(input_email text, input_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  email_value text := lower(public.clean_placeholder_text(input_email));
  phone_value text := public.normalize_phone(input_phone);
  staff_row public.staff_profiles;
  token_row public.staff_attendance_identity_tokens;
begin
  if email_value is null or phone_value is null then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'email and phone are required');
  end if;

  select * into staff_row
  from public.staff_profiles sp
  where lower(public.clean_placeholder_text(sp.email)) = email_value
    and public.normalize_phone(sp.phone) = phone_value
  order by sp.updated_at desc nulls last, sp.created_at desc nulls last
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'No staff profile found');
  end if;

  insert into public.staff_attendance_identity_tokens (staff_profile_id, token, status)
  values (staff_row.id, public.generate_secure_token(), 'active')
  on conflict (staff_profile_id) do update
  set token = case
        when public.staff_attendance_identity_tokens.status = 'active' then public.staff_attendance_identity_tokens.token
        else excluded.token
      end,
      status = 'active'
  returning * into token_row;

  return jsonb_build_object(
    'success', true,
    'code', 'ok',
    'message', 'ok',
    'staff', public.staff_personal_qr_safe_staff_json(staff_row.id),
    'token', token_row.token,
    'qr_payload', 'staff_identity:' || token_row.token
  );
end;
$$;

create or replace function public.regenerate_staff_personal_qr_verified(input_email text, input_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  email_value text := lower(public.clean_placeholder_text(input_email));
  phone_value text := public.normalize_phone(input_phone);
  staff_row public.staff_profiles;
  token_row public.staff_attendance_identity_tokens;
begin
  if email_value is null or phone_value is null then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'email and phone are required');
  end if;

  select * into staff_row
  from public.staff_profiles sp
  where lower(public.clean_placeholder_text(sp.email)) = email_value
    and public.normalize_phone(sp.phone) = phone_value
  order by sp.updated_at desc nulls last, sp.created_at desc nulls last
  limit 1;

  if not found then
    return jsonb_build_object('success', false, 'code', 'identity_verification_failed', 'message', 'No staff profile found');
  end if;

  insert into public.staff_attendance_identity_tokens (staff_profile_id, token, status, regenerated_at)
  values (staff_row.id, public.generate_secure_token(), 'active', now())
  on conflict (staff_profile_id) do update
  set token = excluded.token,
      status = 'active',
      regenerated_at = now()
  returning * into token_row;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, old_data, new_data)
  values (staff_row.id, null, 'staff_personal_qr_regenerated_verified', '{}'::jsonb, jsonb_build_object('token_id', token_row.id, 'regenerated_at', token_row.regenerated_at));

  return jsonb_build_object(
    'success', true,
    'code', 'ok',
    'message', 'ok',
    'staff', public.staff_personal_qr_safe_staff_json(staff_row.id),
    'token', token_row.token,
    'qr_payload', 'staff_identity:' || token_row.token
  );
end;
$$;

create or replace function public.admin_scan_staff_personal_qr(
  input_session_id uuid,
  input_staff_token text,
  input_status text default null,
  input_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  token_value text := public.normalize_staff_identity_qr_token(input_staff_token);
  requested_status text := public.clean_placeholder_text(input_status);
  session_row public.staff_attendance_sessions;
  safe_session jsonb;
  staff_id uuid;
  old_row jsonb;
  existing_record public.staff_attendance_records;
  final_status text;
  record_row public.staff_attendance_records;
begin
  if not public.is_admin(auth.uid()) then
    return jsonb_build_object('success', false, 'code', 'admin_required', 'message', 'admin access required');
  end if;

  select * into session_row
  from public.staff_attendance_sessions
  where id = input_session_id;

  if not found then
    return jsonb_build_object('success', false, 'code', 'session_not_found', 'message', 'attendance session not found');
  end if;

  safe_session := to_jsonb(session_row) - 'qr_token' - 'created_by';

  if token_value is null then
    return jsonb_build_object('success', false, 'code', 'invalid_token', 'message', 'invalid staff personal QR', 'session', safe_session);
  end if;

  select staff_profile_id into staff_id
  from public.staff_attendance_identity_tokens
  where token = token_value
    and status = 'active';

  if staff_id is null then
    return jsonb_build_object('success', false, 'code', 'invalid_token', 'message', 'invalid staff personal QR', 'session', safe_session);
  end if;

  if session_row.status <> 'active' then
    return jsonb_build_object('success', false, 'code', 'session_not_active', 'message', 'attendance session is not active', 'session', safe_session, 'staff', public.staff_personal_qr_safe_staff_json(staff_id));
  end if;

  if now() < session_row.starts_at then
    return jsonb_build_object('success', false, 'code', 'session_not_started', 'message', 'attendance session has not started', 'session', safe_session, 'staff', public.staff_personal_qr_safe_staff_json(staff_id));
  end if;

  if session_row.ends_at is not null and now() > session_row.ends_at then
    return jsonb_build_object('success', false, 'code', 'session_closed', 'message', 'attendance session is closed', 'session', safe_session, 'staff', public.staff_personal_qr_safe_staff_json(staff_id));
  end if;

  if session_row.qr_expires_at is not null and now() > session_row.qr_expires_at then
    return jsonb_build_object('success', false, 'code', 'qr_expired', 'message', 'qr expired', 'session', safe_session, 'staff', public.staff_personal_qr_safe_staff_json(staff_id));
  end if;

  if not public.staff_attendance_session_targets_staff(input_session_id, staff_id) then
    return jsonb_build_object('success', false, 'code', 'not_in_target_scope', 'message', 'staff is not in target scope', 'session', safe_session, 'staff', public.staff_personal_qr_safe_staff_json(staff_id));
  end if;

  if requested_status is not null and requested_status not in ('present', 'late', 'absent', 'excused', 'checked_out', 'cancelled') then
    return jsonb_build_object('success', false, 'code', 'invalid_status', 'message', 'invalid attendance status', 'session', safe_session, 'staff', public.staff_personal_qr_safe_staff_json(staff_id));
  end if;

  select * into existing_record
  from public.staff_attendance_records
  where session_id = input_session_id
    and staff_profile_id = staff_id;

  if found and requested_status is null then
    return jsonb_build_object(
      'success', true,
      'code', 'already_checked',
      'message', 'already checked',
      'session', safe_session,
      'record', to_jsonb(existing_record),
      'staff', public.staff_personal_qr_safe_staff_json(staff_id)
    );
  end if;

  final_status := coalesce(requested_status, case
    when session_row.session_type in ('check_out', 'shift_end') then 'checked_out'
    when session_row.late_after is not null and now() > session_row.late_after then 'late'
    else 'present'
  end);

  select to_jsonb(r) into old_row
  from public.staff_attendance_records r
  where r.session_id = input_session_id
    and r.staff_profile_id = staff_id;

  insert into public.staff_attendance_records (session_id, staff_profile_id, status, method, scanned_at, checked_by, note)
  values (input_session_id, staff_id, final_status, 'admin_scan_staff_qr', now(), auth.uid(), public.clean_placeholder_text(input_note))
  on conflict (session_id, staff_profile_id) do update
  set status = excluded.status,
      method = 'admin_scan_staff_qr',
      scanned_at = now(),
      checked_by = auth.uid(),
      note = excluded.note,
      updated_at = now()
  returning * into record_row;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, old_data, new_data)
  values (staff_id, auth.uid(), 'staff_attendance_admin_scan_staff_qr', coalesce(old_row, '{}'::jsonb), to_jsonb(record_row));

  return jsonb_build_object(
    'success', true,
    'code', case when final_status = 'late' then 'late' when final_status = 'checked_out' then 'checked_out' else 'checked_in' end,
    'message', 'attendance recorded',
    'session', safe_session,
    'record', to_jsonb(record_row),
    'staff', public.staff_personal_qr_safe_staff_json(staff_id)
  );
end;
$$;

grant execute on function public.generate_secure_token() to authenticated;
grant execute on function public.generate_staff_attendance_token() to authenticated;
grant execute on function public.normalize_staff_identity_qr_token(text) to anon, authenticated;
grant execute on function public.get_staff_personal_qr_verified(text, text) to anon, authenticated;
grant execute on function public.regenerate_staff_personal_qr_verified(text, text) to anon, authenticated;
grant execute on function public.admin_scan_staff_personal_qr(uuid, text, text, text) to authenticated;
