create or replace function public.delete_staff_profile_admin(input_staff_profile_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_payload jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select to_jsonb(sp) || jsonb_build_object('medical_info', to_jsonb(smi), 'assignment', to_jsonb(sa))
  into old_payload
  from public.staff_profiles sp
  left join public.staff_medical_info smi on smi.staff_profile_id = sp.id
  left join public.staff_assignments sa on sa.staff_profile_id = sp.id
  where sp.id = input_staff_profile_id;

  if old_payload is null then
    raise exception 'staff profile not found';
  end if;

  delete from public.staff_profiles
  where id = input_staff_profile_id;

  insert into public.staff_audit_logs (staff_profile_id, actor_id, action, old_data, new_data)
  values (input_staff_profile_id, auth.uid(), 'staff_profile_deleted', old_payload, '{}'::jsonb);

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'staff_profile_deleted', old_payload, jsonb_build_object('staff_profile_id', input_staff_profile_id));
end;
$$;

grant execute on function public.delete_staff_profile_admin(uuid) to authenticated;
