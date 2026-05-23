alter table public.staff_applications
  add column if not exists requested_student_id text;

do $$
begin
  if not exists (
    select 1
    from (
      select event_id, person_id
      from public.staff_applications
      where person_id is not null
        and status is distinct from 'withdrawn'
      group by event_id, person_id
      having count(*) > 1
    ) duplicates
  ) then
    execute 'create unique index if not exists staff_applications_event_person_unique
      on public.staff_applications(event_id, person_id)
      where person_id is not null
        and status is distinct from ''withdrawn''';
  else
    raise notice 'Skipped staff_applications_event_person_unique because existing duplicate event/person applications must be resolved first.';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from (
      select event_id, btrim(requested_student_id) as requested_student_id
      from public.staff_applications
      where person_id is null
        and requested_student_id is not null
        and btrim(requested_student_id) <> ''
        and status is distinct from 'withdrawn'
      group by event_id, btrim(requested_student_id)
      having count(*) > 1
    ) duplicates
  ) then
    execute 'create unique index if not exists staff_applications_event_requested_student_unique
      on public.staff_applications(event_id, requested_student_id)
      where person_id is null
        and requested_student_id is not null
        and btrim(requested_student_id) <> ''''
        and status is distinct from ''withdrawn''';
  else
    raise notice 'Skipped staff_applications_event_requested_student_unique because existing duplicate event/requested_student_id applications must be resolved first.';
  end if;
end;
$$;

create or replace function public.find_duplicate_staff_applications(input_event_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  person_groups jsonb := '[]'::jsonb;
  student_groups jsonb := '[]'::jsonb;
  email_groups jsonb := '[]'::jsonb;
  group_count integer := 0;
  row_count integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  with grouped as (
    select sa.event_id, sa.person_id, count(*)::int as duplicate_count
    from public.staff_applications sa
    where sa.person_id is not null
      and sa.status is distinct from 'withdrawn'
      and (input_event_id is null or sa.event_id = input_event_id)
    group by sa.event_id, sa.person_id
    having count(*) > 1
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'event_id', g.event_id,
      'event_name_th', e.name_th,
      'person_id', g.person_id,
      'duplicate_count', g.duplicate_count,
      'applications', (
        select jsonb_agg(jsonb_build_object(
          'id', sa.id,
          'status', sa.status,
          'submitted_at', sa.submitted_at,
          'assigned_duty', sa.assigned_duty,
          'identity_status', sa.identity_status,
          'requested_student_id', sa.requested_student_id
        ) order by sa.submitted_at)
        from public.staff_applications sa
        where sa.event_id = g.event_id
          and sa.person_id = g.person_id
          and sa.status is distinct from 'withdrawn'
      )
    )
  ), '[]'::jsonb)
  into person_groups
  from grouped g
  left join public.events e on e.id = g.event_id;

  with grouped as (
    select sa.event_id, btrim(sa.requested_student_id) as requested_student_id, count(*)::int as duplicate_count
    from public.staff_applications sa
    where sa.person_id is null
      and sa.requested_student_id is not null
      and btrim(sa.requested_student_id) <> ''
      and sa.status is distinct from 'withdrawn'
      and (input_event_id is null or sa.event_id = input_event_id)
    group by sa.event_id, btrim(sa.requested_student_id)
    having count(*) > 1
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'event_id', g.event_id,
      'event_name_th', e.name_th,
      'requested_student_id', g.requested_student_id,
      'duplicate_count', g.duplicate_count,
      'applications', (
        select jsonb_agg(jsonb_build_object(
          'id', sa.id,
          'status', sa.status,
          'submitted_at', sa.submitted_at,
          'assigned_duty', sa.assigned_duty,
          'identity_status', sa.identity_status,
          'requested_student_id', sa.requested_student_id
        ) order by sa.submitted_at)
        from public.staff_applications sa
        where sa.event_id = g.event_id
          and btrim(sa.requested_student_id) = g.requested_student_id
          and sa.person_id is null
          and sa.status is distinct from 'withdrawn'
      )
    )
  ), '[]'::jsonb)
  into student_groups
  from grouped g
  left join public.events e on e.id = g.event_id;

  with grouped as (
    select sa.event_id, lower(public.clean_placeholder_text(sa.requested_email)) as requested_email, count(*)::int as duplicate_count
    from public.staff_applications sa
    where public.clean_placeholder_text(sa.requested_email) is not null
      and sa.status is distinct from 'withdrawn'
      and (input_event_id is null or sa.event_id = input_event_id)
    group by sa.event_id, lower(public.clean_placeholder_text(sa.requested_email))
    having count(*) > 1
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'event_id', g.event_id,
      'event_name_th', e.name_th,
      'requested_email', g.requested_email,
      'duplicate_count', g.duplicate_count,
      'applications', (
        select jsonb_agg(jsonb_build_object(
          'id', sa.id,
          'status', sa.status,
          'submitted_at', sa.submitted_at,
          'assigned_duty', sa.assigned_duty,
          'identity_status', sa.identity_status,
          'requested_student_id', sa.requested_student_id
        ) order by sa.submitted_at)
        from public.staff_applications sa
        where sa.event_id = g.event_id
          and lower(public.clean_placeholder_text(sa.requested_email)) = g.requested_email
          and sa.status is distinct from 'withdrawn'
      )
    )
  ), '[]'::jsonb)
  into email_groups
  from grouped g
  left join public.events e on e.id = g.event_id;

  select
    coalesce(jsonb_array_length(person_groups), 0)
      + coalesce(jsonb_array_length(student_groups), 0)
      + coalesce(jsonb_array_length(email_groups), 0),
    coalesce((
      select sum((item->>'duplicate_count')::int)
      from jsonb_array_elements(person_groups || student_groups || email_groups) as item
    ), 0)
  into group_count, row_count;

  return jsonb_build_object(
    'duplicate_person_groups', person_groups,
    'duplicate_student_id_groups', student_groups,
    'duplicate_email_groups', email_groups,
    'total_duplicate_groups', group_count,
    'total_duplicate_rows', row_count
  );
end;
$$;

create or replace function public.check_staff_application_for_applicant(
  input_event_slug text,
  input_student_id text,
  input_email text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_slug text := public.clean_placeholder_text(input_event_slug);
  clean_student_id text := public.clean_placeholder_text(input_student_id);
  clean_email text := public.normalize_cmu_email(input_email);
  event_row public.events%rowtype;
  person_row public.people%rowtype;
  application_row public.staff_applications%rowtype;
  quota_row public.event_staff_duty_quotas%rowtype;
begin
  if clean_slug is null or clean_student_id is null then
    return jsonb_build_object('exists', false, 'already_applied', false, 'message_th', 'กรุณากรอกรหัสนักศึกษา');
  end if;

  if public.clean_placeholder_text(input_email) is not null and not public.is_valid_cmu_email(clean_email) then
    return jsonb_build_object('exists', false, 'already_applied', false, 'code', 'invalid_cmu_email', 'message_th', 'กรุณากรอก CMU Mail ที่ลงท้ายด้วย @cmu.ac.th เท่านั้น');
  end if;

  select * into event_row
  from public.events
  where slug = clean_slug
    and visibility = 'public'
  limit 1;

  if event_row.id is null then
    return jsonb_build_object('exists', false, 'already_applied', false, 'message_th', 'ไม่พบกิจกรรมนี้');
  end if;

  select * into person_row
  from public.people p
  where public.clean_placeholder_text(p.student_id) = clean_student_id
    and p.merged_into is null
  order by p.updated_at desc nulls last, p.created_at desc nulls last
  limit 1;

  select * into application_row
  from public.staff_applications sa
  where sa.event_id = event_row.id
    and (
      (person_row.id is not null and sa.person_id = person_row.id)
      or public.clean_placeholder_text(sa.requested_student_id) = clean_student_id
    )
  order by sa.submitted_at asc nulls last
  limit 1;

  if application_row.id is null then
    return jsonb_build_object(
      'exists', false,
      'already_applied', false,
      'event', jsonb_build_object('id', event_row.id, 'slug', event_row.slug, 'name_th', event_row.name_th, 'name_en', event_row.name_en),
      'message_th', 'ยังไม่พบใบสมัครเดิม'
    );
  end if;

  if application_row.assigned_duty is not null then
    select * into quota_row
    from public.event_staff_duty_quotas
    where event_id = application_row.event_id
      and duty_key = application_row.assigned_duty
    limit 1;
  end if;

  return jsonb_build_object(
    'exists', true,
    'already_applied', true,
    'event', jsonb_build_object('id', event_row.id, 'slug', event_row.slug, 'name_th', event_row.name_th, 'name_en', event_row.name_en),
    'application', jsonb_build_object(
      'application_id', application_row.id,
      'status', application_row.status,
      'identity_status', application_row.identity_status,
      'assigned_duty', application_row.assigned_duty,
      'assigned_duty_label_th', coalesce(quota_row.duty_label_th, public.clean_placeholder_text(application_row.answers->>'assigned_duty_label_th')),
      'assignment_method', application_row.assignment_method,
      'submitted_at', application_row.submitted_at
    ),
    'message_th', case
      when application_row.status = 'rejected' then 'คุณเคยส่งใบสมัครสำหรับกิจกรรมนี้แล้ว หากต้องการแก้ไข กรุณาติดต่อผู้ดูแล'
      else 'คุณได้ส่งใบสมัครสำหรับกิจกรรมนี้แล้ว ไม่จำเป็นต้องส่งซ้ำ'
    end
  );
end;
$$;

create or replace function public.submit_event_staff_application(
  input_event_slug text,
  input_email text,
  input_phone text,
  input_data jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  event_row public.events;
  person_row public.people;
  form_row public.event_forms;
  application_row public.staff_applications;
  existing_application_row public.staff_applications;
  existing_quota_row public.event_staff_duty_quotas;
  student_id_value text := public.clean_placeholder_text(coalesce(input_data->>'student_id', input_data->>'requested_student_id'));
  email_value text := public.normalize_cmu_email(coalesce(input_data->>'requested_email', input_email));
  phone_value text := public.normalize_phone(coalesce(input_data->>'requested_phone', input_phone));
  requested_name_th_value text := public.clean_placeholder_text(input_data->>'requested_name_th');
  requested_name_en_value text := public.clean_placeholder_text(input_data->>'requested_name_en');
  requested_major_value text := public.clean_placeholder_text(input_data->>'requested_major');
  identity_status_value text := public.clean_placeholder_text(input_data->>'identity_status');
  update_request_id_value uuid := nullif(input_data->>'update_request_id', '')::uuid;
  preferred_duties_value text[];
  assignment_result jsonb := '{}'::jsonb;
begin
  select * into event_row
  from public.events
  where slug = input_event_slug
    and visibility = 'public'
    and status in ('staff_recruiting', 'active')
  limit 1;

  if event_row.id is null then
    return jsonb_build_object('success', false, 'code', 'staff_recruiting_closed', 'message_th', 'กิจกรรมนี้ยังไม่เปิดรับสมัคร หรือปิดรับสมัครแล้ว');
  end if;

  if student_id_value is null then
    return jsonb_build_object('success', false, 'code', 'student_id_required', 'message_th', 'กรุณากรอกรหัสนักศึกษา');
  end if;

  if not public.is_valid_cmu_email(email_value) then
    return jsonb_build_object('success', false, 'code', 'invalid_cmu_email', 'message_th', 'กรุณากรอก CMU Mail ที่ลงท้ายด้วย @cmu.ac.th เท่านั้น');
  end if;

  if coalesce((input_data->>'consent_confirmed')::boolean, false) is not true then
    return jsonb_build_object('success', false, 'code', 'consent_required', 'message_th', 'กรุณายืนยันข้อมูลก่อนส่งใบสมัคร');
  end if;

  if coalesce(jsonb_typeof(input_data->'preferred_duties'), '') <> 'array' then
    return jsonb_build_object('success', false, 'code', 'preferred_duties_required', 'message_th', 'กรุณาเลือกฝ่ายที่สนใจอย่างน้อย 1 ฝ่าย');
  end if;

  if jsonb_array_length(input_data->'preferred_duties') = 0 then
    return jsonb_build_object('success', false, 'code', 'preferred_duties_required', 'message_th', 'กรุณาเลือกฝ่ายที่สนใจอย่างน้อย 1 ฝ่าย');
  end if;

  select array_agg(value::text)
  into preferred_duties_value
  from jsonb_array_elements_text(input_data->'preferred_duties') as value;

  perform pg_advisory_xact_lock(hashtext('staff-duty-quota:' || event_row.id::text));

  select * into person_row
  from public.people p
  where public.clean_placeholder_text(p.student_id) = student_id_value
    and p.merged_into is null
  order by p.updated_at desc nulls last, p.created_at desc nulls last
  limit 1;

  select * into existing_application_row
  from public.staff_applications sa
  where sa.event_id = event_row.id
    and (
      (person_row.id is not null and sa.person_id = person_row.id)
      or (person_row.id is null and public.clean_placeholder_text(sa.requested_student_id) = student_id_value)
      or public.clean_placeholder_text(sa.requested_student_id) = student_id_value
    )
  order by sa.submitted_at asc nulls last
  limit 1;

  if existing_application_row.id is not null then
    if existing_application_row.assigned_duty is not null then
      select * into existing_quota_row
      from public.event_staff_duty_quotas
      where event_id = existing_application_row.event_id
        and duty_key = existing_application_row.assigned_duty
      limit 1;
    end if;

    return jsonb_build_object(
      'success', true,
      'already_applied', true,
      'code', 'already_applied',
      'event', jsonb_build_object('id', event_row.id, 'slug', event_row.slug, 'name_th', event_row.name_th, 'name_en', event_row.name_en),
      'application', jsonb_build_object(
        'id', existing_application_row.id,
        'status', existing_application_row.status,
        'identity_status', existing_application_row.identity_status,
        'assigned_duty', existing_application_row.assigned_duty,
        'assigned_duty_label_th', coalesce(existing_quota_row.duty_label_th, public.clean_placeholder_text(existing_application_row.answers->>'assigned_duty_label_th')),
        'assignment_method', existing_application_row.assignment_method,
        'assignment_note', existing_application_row.assignment_note,
        'submitted_at', existing_application_row.submitted_at
      ),
      'assignment', jsonb_build_object(
        'assigned_duty', existing_application_row.assigned_duty,
        'assigned_label_th', coalesce(existing_quota_row.duty_label_th, public.clean_placeholder_text(existing_application_row.answers->>'assigned_duty_label_th')),
        'assignment_method', existing_application_row.assignment_method,
        'assignment_note', existing_application_row.assignment_note
      ),
      'message_th', case
        when existing_application_row.status = 'rejected' then 'คุณเคยส่งใบสมัครสำหรับกิจกรรมนี้แล้ว หากต้องการแก้ไข กรุณาติดต่อผู้ดูแล'
        else 'คุณได้ส่งใบสมัครสำหรับกิจกรรมนี้แล้ว ไม่จำเป็นต้องส่งซ้ำ'
      end
    );
  end if;

  identity_status_value := case
    when person_row.id is null then 'not_found'
    when public.normalize_cmu_email(person_row.email) = email_value then 'verified'
    when public.normalize_cmu_email(person_row.email) is null then 'pending_identity_review'
    else 'email_mismatch'
  end;

  assignment_result := public.assign_parent_orientation_duty(event_row.id, preferred_duties_value);

  select * into form_row
  from public.event_forms
  where event_id = event_row.id
    and form_type = 'staff_application'
    and is_open = true
    and (opens_at is null or opens_at <= now())
    and (closes_at is null or now() <= closes_at)
  order by created_at desc
  limit 1;

  begin
    insert into public.staff_applications (
      event_id, person_id, preferred_role, preferred_team, availability,
      experience, motivation, status, answers, identity_status, requested_email,
      requested_phone, requested_student_id, requested_name_th, requested_name_en,
      requested_major, update_request_id, assigned_duty, assignment_method, assignment_note
    )
    values (
      event_row.id,
      person_row.id,
      public.clean_placeholder_text(input_data->>'preferred_role'),
      public.clean_placeholder_text(input_data->>'preferred_team'),
      coalesce(input_data->'availability', '{}'::jsonb),
      public.clean_placeholder_text(input_data->>'experience'),
      public.clean_placeholder_text(input_data->>'motivation'),
      'submitted',
      coalesce(input_data, '{}'::jsonb)
        || jsonb_build_object(
          'student_id', student_id_value,
          'requested_email', email_value,
          'requested_phone', phone_value,
          'identity_status', identity_status_value,
          'identity_review_pending', identity_status_value <> 'verified',
          'assigned_duty_label_th', assignment_result->>'assigned_label_th',
          'assignment_snapshot', assignment_result
        ),
      identity_status_value,
      email_value,
      phone_value,
      student_id_value,
      requested_name_th_value,
      requested_name_en_value,
      requested_major_value,
      update_request_id_value,
      assignment_result->>'assigned_duty',
      assignment_result->>'assignment_method',
      assignment_result->>'assignment_note'
    )
    returning * into application_row;
  exception
    when unique_violation then
      select * into existing_application_row
      from public.staff_applications sa
      where sa.event_id = event_row.id
        and (
          (person_row.id is not null and sa.person_id = person_row.id)
          or public.clean_placeholder_text(sa.requested_student_id) = student_id_value
        )
      order by sa.submitted_at asc nulls last
      limit 1;

      if existing_application_row.id is not null then
        if existing_application_row.assigned_duty is not null then
          select * into existing_quota_row
          from public.event_staff_duty_quotas
          where event_id = existing_application_row.event_id
            and duty_key = existing_application_row.assigned_duty
          limit 1;
        end if;

        return jsonb_build_object(
          'success', true,
          'already_applied', true,
          'code', 'already_applied',
          'event', jsonb_build_object('id', event_row.id, 'slug', event_row.slug, 'name_th', event_row.name_th, 'name_en', event_row.name_en),
          'application', jsonb_build_object(
            'id', existing_application_row.id,
            'status', existing_application_row.status,
            'identity_status', existing_application_row.identity_status,
            'assigned_duty', existing_application_row.assigned_duty,
            'assigned_duty_label_th', coalesce(existing_quota_row.duty_label_th, public.clean_placeholder_text(existing_application_row.answers->>'assigned_duty_label_th')),
            'assignment_method', existing_application_row.assignment_method,
            'assignment_note', existing_application_row.assignment_note,
            'submitted_at', existing_application_row.submitted_at
          ),
          'assignment', jsonb_build_object(
            'assigned_duty', existing_application_row.assigned_duty,
            'assigned_label_th', coalesce(existing_quota_row.duty_label_th, public.clean_placeholder_text(existing_application_row.answers->>'assigned_duty_label_th')),
            'assignment_method', existing_application_row.assignment_method,
            'assignment_note', existing_application_row.assignment_note
          ),
          'message_th', 'ระบบพบว่าเคยมีการส่งใบสมัครไว้แล้ว จึงแสดงข้อมูลใบสมัครเดิมแทน'
        );
      end if;

      return jsonb_build_object('success', false, 'code', 'duplicate_application', 'message_th', 'ระบบพบว่าเคยมีการส่งใบสมัครไว้แล้ว กรุณาตรวจสอบสถานะใบสมัคร');
  end;

  insert into public.event_form_responses (event_id, form_id, person_id, response_json, status)
  values (event_row.id, form_row.id, person_row.id, coalesce(input_data, '{}'::jsonb) || jsonb_build_object('assignment_snapshot', assignment_result), 'submitted');

  return jsonb_build_object(
    'success', true,
    'already_applied', false,
    'code', case when identity_status_value = 'verified' then 'submitted' else 'submitted_pending_identity_review' end,
    'event', jsonb_build_object('id', event_row.id, 'slug', event_row.slug, 'name_th', event_row.name_th, 'name_en', event_row.name_en),
    'application', jsonb_build_object(
      'id', application_row.id,
      'status', application_row.status,
      'identity_status', application_row.identity_status,
      'assigned_duty', application_row.assigned_duty,
      'assigned_duty_label_th', assignment_result->>'assigned_label_th',
      'assignment_method', application_row.assignment_method,
      'assignment_note', application_row.assignment_note,
      'submitted_at', application_row.submitted_at
    ),
    'assignment', assignment_result,
    'person', case when person_row.id is null then null else jsonb_build_object('person_id', person_row.id, 'display_name', coalesce(person_row.name_th, person_row.name_en, 'ผู้สมัคร')) end,
    'message_th', case when identity_status_value = 'verified' then 'ส่งใบสมัครแล้ว' else 'ส่งใบสมัครแล้ว แต่ยังรอตรวจสอบตัวตน' end
  );
end;
$$;

revoke all on function public.find_duplicate_staff_applications(uuid) from public;
grant execute on function public.find_duplicate_staff_applications(uuid) to authenticated;

revoke all on function public.check_staff_application_for_applicant(text, text, text) from public;
grant execute on function public.check_staff_application_for_applicant(text, text, text) to anon, authenticated;

grant execute on function public.submit_event_staff_application(text, text, text, jsonb) to anon, authenticated;
