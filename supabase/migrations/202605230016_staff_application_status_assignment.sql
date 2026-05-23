create or replace function public.check_staff_application_status(
  input_event_slug text,
  input_email text,
  input_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_slug text := public.clean_placeholder_text(input_event_slug);
  clean_email text := lower(public.clean_placeholder_text(input_email));
  clean_phone text := public.normalize_phone(input_phone);
  event_row public.events%rowtype;
  person_row public.people%rowtype;
  application_row public.staff_applications%rowtype;
  quota_row public.event_staff_duty_quotas%rowtype;
  public_review_note text;
begin
  if clean_slug is null or clean_email is null or clean_phone is null then
    return jsonb_build_object(
      'success', false,
      'code', 'identity_required',
      'message', 'Email and phone are required'
    );
  end if;

  select * into event_row
  from public.events
  where slug = clean_slug
    and visibility = 'public'
  limit 1;

  if event_row.id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'not_found',
      'message', 'Application status not found'
    );
  end if;

  select * into person_row
  from public.people p
  where lower(coalesce(public.clean_placeholder_text(p.email), '')) = clean_email
    and public.normalize_phone(p.phone) = clean_phone
    and p.merged_into is null
  order by p.updated_at desc nulls last, p.created_at desc nulls last
  limit 1;

  select * into application_row
  from public.staff_applications sa
  where sa.event_id = event_row.id
    and (
      (
        person_row.id is not null
        and sa.person_id = person_row.id
      )
      or (
        lower(coalesce(public.clean_placeholder_text(sa.requested_email), '')) = clean_email
        and public.normalize_phone(sa.requested_phone) = clean_phone
      )
    )
  order by sa.submitted_at desc nulls last
  limit 1;

  if application_row.id is null then
    return jsonb_build_object(
      'success', false,
      'code', 'not_found',
      'message', 'Application status not found',
      'event', jsonb_build_object(
        'id', event_row.id,
        'slug', event_row.slug,
        'name_th', event_row.name_th,
        'name_en', event_row.name_en
      )
    );
  end if;

  if application_row.assigned_duty is not null then
    select * into quota_row
    from public.event_staff_duty_quotas
    where event_id = application_row.event_id
      and duty_key = application_row.assigned_duty
    limit 1;
  end if;

  public_review_note := public.clean_placeholder_text(application_row.answers->>'public_review_note');

  return jsonb_build_object(
    'success', true,
    'code', 'found',
    'event', jsonb_build_object(
      'id', event_row.id,
      'slug', event_row.slug,
      'name_th', event_row.name_th,
      'name_en', event_row.name_en
    ),
    'application', jsonb_build_object(
      'status', application_row.status,
      'identity_status', application_row.identity_status,
      'assigned_duty', application_row.assigned_duty,
      'assigned_duty_label_th', coalesce(quota_row.duty_label_th, public.clean_placeholder_text(application_row.answers->>'assigned_duty_label_th')),
      'assignment_method', application_row.assignment_method,
      'assignment_note', application_row.assignment_note,
      'final_duty', case when application_row.status = 'approved' then public.clean_placeholder_text(application_row.answers->>'final_duty') else null end,
      'review_note', public_review_note,
      'submitted_at', application_row.submitted_at
    )
  );
end;
$$;

revoke all on function public.check_staff_application_status(text, text, text) from public;
grant execute on function public.check_staff_application_status(text, text, text) to anon, authenticated;
