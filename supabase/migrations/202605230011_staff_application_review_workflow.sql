create or replace function public.review_staff_application(
  input_application_id uuid,
  input_status text,
  input_final_duty text default null,
  input_review_note text default null
)
returns public.staff_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed_statuses text[] := array['submitted', 'under_review', 'approved', 'waitlisted', 'rejected', 'withdrawn'];
  application_row public.staff_applications;
  updated_row public.staff_applications;
  clean_status text := public.clean_import_text(input_status);
  clean_final_duty text := public.clean_import_text(input_final_duty);
  clean_review_note text := public.clean_import_text(input_review_note);
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  if clean_status is null or not (clean_status = any(allowed_statuses)) then
    raise exception 'Invalid staff application status: %', coalesce(input_status, '(null)');
  end if;

  select *
  into application_row
  from public.staff_applications
  where id = input_application_id
  for update;

  if application_row.id is null then
    raise exception 'Staff application not found';
  end if;

  update public.staff_applications
  set
    status = clean_status,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_note = clean_review_note,
    answers = case
      when clean_final_duty is null then coalesce(answers, '{}'::jsonb) - 'final_duty'
      else coalesce(answers, '{}'::jsonb) || jsonb_build_object('final_duty', clean_final_duty)
    end
  where id = input_application_id
  returning * into updated_row;

  insert into public.change_logs (changed_by, action, old_data, new_data)
  values (
    auth.uid(),
    'review_staff_application',
    jsonb_build_object(
      'id', application_row.id,
      'status', application_row.status,
      'review_note', application_row.review_note,
      'final_duty', application_row.answers->>'final_duty'
    ),
    jsonb_build_object(
      'id', updated_row.id,
      'event_id', updated_row.event_id,
      'person_id', updated_row.person_id,
      'status', updated_row.status,
      'review_note', updated_row.review_note,
      'final_duty', updated_row.answers->>'final_duty'
    )
  );

  return updated_row;
end;
$$;

grant execute on function public.review_staff_application(uuid, text, text, text) to authenticated;
