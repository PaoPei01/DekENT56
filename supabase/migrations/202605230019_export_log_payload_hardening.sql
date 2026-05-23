create or replace function public.log_staff_application_export(input_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_data jsonb;
  row_count_value integer := 0;
  includes_sensitive_fields_value boolean := false;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  if coalesce(input_data->>'row_count', '') ~ '^[0-9]+$' then
    row_count_value := (input_data->>'row_count')::integer;
  end if;

  if lower(coalesce(input_data->>'includes_sensitive_fields', 'false')) in ('true', 't', '1', 'yes') then
    includes_sensitive_fields_value := true;
  end if;

  safe_data := jsonb_build_object(
    'event_id', input_data->>'event_id',
    'export_scope', input_data->>'export_scope',
    'row_count', row_count_value,
    'includes_sensitive_fields', includes_sensitive_fields_value,
    'filters', coalesce(input_data->'filters', '{}'::jsonb),
    'exported_at', coalesce(input_data->>'exported_at', now()::text)
  );

  insert into public.change_logs (changed_by, action, old_data, new_data)
  values (auth.uid(), 'export_staff_applications_excel', '{}'::jsonb, safe_data);

  return jsonb_build_object('success', true, 'code', 'logged');
end;
$$;

grant execute on function public.log_staff_application_export(jsonb) to authenticated;
