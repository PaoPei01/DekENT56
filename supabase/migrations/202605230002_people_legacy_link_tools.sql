alter table public.profiles
  add column if not exists person_id uuid references public.people(id) on delete set null;

alter table public.staff_profiles
  add column if not exists person_id uuid references public.people(id) on delete set null;

create index if not exists profiles_person_id_idx on public.profiles (person_id);
create index if not exists staff_profiles_person_id_idx on public.staff_profiles (person_id);

create or replace function public.find_matching_person_id(
  input_student_id text,
  input_email text,
  input_phone text
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id
  from public.people p
  where (
    public.clean_placeholder_text(input_student_id) is not null
    and public.clean_placeholder_text(p.student_id) = public.clean_placeholder_text(input_student_id)
  )
  or (
    public.clean_placeholder_text(input_email) is not null
    and lower(public.clean_placeholder_text(p.email)) = lower(public.clean_placeholder_text(input_email))
  )
  or (
    public.clean_placeholder_text(input_phone) is not null
    and public.normalize_phone(p.phone) = public.normalize_phone(input_phone)
  )
  order by
    case
      when public.clean_placeholder_text(input_student_id) is not null
        and public.clean_placeholder_text(p.student_id) = public.clean_placeholder_text(input_student_id) then 1
      when public.clean_placeholder_text(input_email) is not null
        and lower(public.clean_placeholder_text(p.email)) = lower(public.clean_placeholder_text(input_email)) then 2
      else 3
    end,
    p.created_at
  limit 1;
$$;

create or replace function public.preview_people_legacy_link()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_total integer;
  participant_unlinked integer;
  participant_matchable integer;
  staff_total integer;
  staff_unlinked integer;
  staff_matchable integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  select count(*) into participant_total from public.profiles;
  select count(*) into participant_unlinked from public.profiles where person_id is null;
  select count(*)
  into participant_matchable
  from public.profiles p
  where p.person_id is null
    and public.find_matching_person_id(p.student_id, p.email, p.phone) is not null;

  select count(*) into staff_total from public.staff_profiles;
  select count(*) into staff_unlinked from public.staff_profiles where person_id is null;
  select count(*)
  into staff_matchable
  from public.staff_profiles sp
  where sp.person_id is null
    and public.find_matching_person_id(sp.student_id, sp.email, sp.phone) is not null;

  return jsonb_build_object(
    'participant_total', participant_total,
    'participant_unlinked', participant_unlinked,
    'participant_matchable_existing_people', participant_matchable,
    'participant_would_create_people', greatest(participant_unlinked - participant_matchable, 0),
    'staff_total', staff_total,
    'staff_unlinked', staff_unlinked,
    'staff_matchable_existing_people', staff_matchable,
    'staff_would_create_people', greatest(staff_unlinked - staff_matchable, 0)
  );
end;
$$;

create or replace function public.link_legacy_profiles_to_people()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row public.profiles;
  staff_row public.staff_profiles;
  matched_person_id uuid;
  participant_linked integer := 0;
  participant_created integer := 0;
  staff_linked integer := 0;
  staff_created integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'admin access required';
  end if;

  for profile_row in
    select * from public.profiles where person_id is null order by created_at nulls last, id
  loop
    matched_person_id := public.find_matching_person_id(profile_row.student_id, profile_row.email, profile_row.phone);

    if matched_person_id is null then
      insert into public.people (
        student_id, name_th, name_en, nickname, email, phone, major,
        line_id, instagram, source
      )
      values (
        public.clean_placeholder_text(profile_row.student_id),
        public.clean_placeholder_text(profile_row.name_th),
        public.clean_placeholder_text(profile_row.name_en),
        public.clean_placeholder_text(profile_row.nickname),
        lower(public.clean_placeholder_text(profile_row.email)),
        public.normalize_phone(profile_row.phone),
        public.clean_placeholder_text(profile_row.major),
        public.clean_placeholder_text(profile_row.line_id),
        public.clean_placeholder_text(profile_row.instagram),
        'legacy_profiles'
      )
      returning id into matched_person_id;
      participant_created := participant_created + 1;
    end if;

    update public.profiles set person_id = matched_person_id where id = profile_row.id;
    participant_linked := participant_linked + 1;
  end loop;

  for staff_row in
    select * from public.staff_profiles where person_id is null order by created_at nulls last, id
  loop
    matched_person_id := public.find_matching_person_id(staff_row.student_id, staff_row.email, staff_row.phone);

    if matched_person_id is null then
      insert into public.people (
        student_id, name_th, name_en, nickname, email, phone, major,
        line_id, instagram, source
      )
      values (
        public.clean_placeholder_text(staff_row.student_id),
        public.clean_placeholder_text(staff_row.name_th),
        public.clean_placeholder_text(staff_row.name_en),
        public.clean_placeholder_text(staff_row.nickname),
        lower(public.clean_placeholder_text(staff_row.email)),
        public.normalize_phone(staff_row.phone),
        public.clean_placeholder_text(staff_row.major),
        public.clean_placeholder_text(staff_row.line_id),
        public.clean_placeholder_text(staff_row.instagram),
        'legacy_staff_profiles'
      )
      returning id into matched_person_id;
      staff_created := staff_created + 1;
    else
      update public.people
      set
        student_id = coalesce(public.clean_placeholder_text(people.student_id), public.clean_placeholder_text(staff_row.student_id)),
        name_th = coalesce(public.clean_placeholder_text(people.name_th), public.clean_placeholder_text(staff_row.name_th)),
        name_en = coalesce(public.clean_placeholder_text(people.name_en), public.clean_placeholder_text(staff_row.name_en)),
        nickname = coalesce(public.clean_placeholder_text(people.nickname), public.clean_placeholder_text(staff_row.nickname)),
        email = coalesce(public.clean_placeholder_text(people.email), lower(public.clean_placeholder_text(staff_row.email))),
        phone = coalesce(public.clean_placeholder_text(people.phone), public.normalize_phone(staff_row.phone)),
        major = coalesce(public.clean_placeholder_text(people.major), public.clean_placeholder_text(staff_row.major)),
        line_id = coalesce(public.clean_placeholder_text(people.line_id), public.clean_placeholder_text(staff_row.line_id)),
        instagram = coalesce(public.clean_placeholder_text(people.instagram), public.clean_placeholder_text(staff_row.instagram)),
        updated_at = now()
      where id = matched_person_id;
    end if;

    update public.staff_profiles set person_id = matched_person_id where id = staff_row.id;
    staff_linked := staff_linked + 1;
  end loop;

  insert into public.change_logs (changed_by, action, old_data, new_data)
  values (
    auth.uid(),
    'people_legacy_link',
    '{}'::jsonb,
    jsonb_build_object(
      'participant_linked', participant_linked,
      'participant_created', participant_created,
      'staff_linked', staff_linked,
      'staff_created', staff_created
    )
  );

  return jsonb_build_object(
    'participant_linked', participant_linked,
    'participant_created', participant_created,
    'staff_linked', staff_linked,
    'staff_created', staff_created
  );
end;
$$;
