create table if not exists public.emergency_notes (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  note text,
  needs_special_care boolean default false,
  updated_at timestamp with time zone default now(),
  updated_by uuid references auth.users(id)
);

alter table public.emergency_notes enable row level security;

drop policy if exists "Admins can manage emergency notes" on public.emergency_notes;
create policy "Admins can manage emergency notes"
on public.emergency_notes for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Permitted staff can read emergency notes" on public.emergency_notes;
create policy "Permitted staff can read emergency notes"
on public.emergency_notes for select
to authenticated
using (
  public.is_admin(auth.uid())
  or exists (
    select 1
    from public.staff_assignments sa
    join public.group_assignments ga on ga.profile_id = emergency_notes.profile_id
    where sa.user_id = auth.uid()
      and sa.role in ('emergency', 'lead')
      and sa.main_group = ga.main_group
      and (sa.subgroup is null or sa.subgroup = ga.subgroup)
  )
);

create or replace function public.can_view_emergency_profile(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin(auth.uid())
    or exists (
      select 1
      from public.staff_assignments sa
      join public.group_assignments ga on ga.profile_id = can_view_emergency_profile.profile_id
      where sa.user_id = auth.uid()
        and sa.role in ('emergency', 'lead')
        and sa.main_group = ga.main_group
        and (sa.subgroup is null or sa.subgroup = ga.subgroup)
    );
$$;

create or replace function public.get_emergency_dashboard()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not exists (select 1 from public.profiles p where public.can_view_emergency_profile(p.id)) then
    raise exception 'emergency access required';
  end if;

  select jsonb_build_object(
    'summary', jsonb_build_object(
      'total', count(*),
      'disease', count(*) filter (where nullif(btrim(coalesce(p.disease, '')), '') is not null and btrim(p.disease) <> '-'),
      'drug_allergy', count(*) filter (where nullif(btrim(coalesce(p.drug_allergy, '')), '') is not null and btrim(p.drug_allergy) <> '-'),
      'food_allergy', count(*) filter (where nullif(btrim(coalesce(p.food_allergy, '')), '') is not null and btrim(p.food_allergy) <> '-'),
      'needs_special_care', count(*) filter (where coalesce(en.needs_special_care, false) is true)
    ),
    'participants', coalesce(jsonb_agg(
      to_jsonb(p)
      || jsonb_build_object(
        'main_group', ga.main_group,
        'subgroup', ga.subgroup,
        'emergency_note', en.note,
        'needs_special_care', coalesce(en.needs_special_care, false),
        'emergency_note_updated_at', en.updated_at
      )
      order by coalesce(en.needs_special_care, false) desc, ga.main_group, ga.subgroup, p.name_th
    ), '[]'::jsonb)
  )
  into result
  from public.profiles p
  left join public.group_assignments ga on ga.profile_id = p.id
  left join public.emergency_notes en on en.profile_id = p.id
  where public.can_view_emergency_profile(p.id)
    and (
      nullif(btrim(coalesce(p.disease, '')), '') is not null and btrim(p.disease) <> '-'
      or nullif(btrim(coalesce(p.drug_allergy, '')), '') is not null and btrim(p.drug_allergy) <> '-'
      or nullif(btrim(coalesce(p.food_allergy, '')), '') is not null and btrim(p.food_allergy) <> '-'
      or coalesce(en.needs_special_care, false) is true
      or nullif(btrim(coalesce(en.note, '')), '') is not null
    );

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (null, auth.uid(), 'emergency_dashboard_viewed', '{}'::jsonb, jsonb_build_object('viewed_at', now()));

  return result;
end;
$$;

create or replace function public.save_emergency_note(
  input_profile_id uuid,
  input_note text,
  input_needs_special_care boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_note jsonb;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select to_jsonb(en) into old_note
  from public.emergency_notes en
  where en.profile_id = input_profile_id;

  insert into public.emergency_notes (profile_id, note, needs_special_care, updated_by, updated_at)
  values (input_profile_id, input_note, input_needs_special_care, auth.uid(), now())
  on conflict (profile_id) do update
  set note = excluded.note,
      needs_special_care = excluded.needs_special_care,
      updated_by = auth.uid(),
      updated_at = now();

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (
    input_profile_id,
    auth.uid(),
    'emergency_note_updated',
    coalesce(old_note, '{}'::jsonb),
    jsonb_build_object('note', input_note, 'needs_special_care', input_needs_special_care)
  );
end;
$$;

grant select on public.emergency_notes to authenticated;
grant execute on function public.get_emergency_dashboard() to authenticated;
grant execute on function public.save_emergency_note(uuid, text, boolean) to authenticated;
