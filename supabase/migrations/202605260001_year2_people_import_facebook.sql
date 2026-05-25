alter table public.people
  add column if not exists facebook text;

alter table public.people_import_year2_2569
  add column if not exists facebook_raw text;

create or replace function public.import_year2_people_from_staging()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  staging_row public.people_import_year2_2569%rowtype;
  normalized_student_id text;
  normalized_email text;
  normalized_phone text;
  normalized_name_th text;
  normalized_name_en text;
  normalized_nickname_th text;
  normalized_nickname_en text;
  normalized_major_th text;
  normalized_line_id text;
  normalized_instagram text;
  normalized_facebook text;
  target_person_id uuid;
  duplicate_student_ids text[];
  row_has_health_data boolean;
  row_metadata jsonb;
  inserted_count integer := 0;
  updated_count integer := 0;
  skipped_count integer := 0;
  health_data_not_imported_count integer := 0;
  errors_count integer := 0;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Only admins can import year 2 people data';
  end if;

  select coalesce(array_agg(student_id), '{}')
  into duplicate_student_ids
  from (
    select public.clean_import_text(student_id_raw) as student_id
    from public.people_import_year2_2569
    where public.clean_import_text(student_id_raw) is not null
    group by public.clean_import_text(student_id_raw)
    having count(*) > 1
  ) duplicates;

  for staging_row in
    select *
    from public.people_import_year2_2569
    where coalesce(import_status, 'pending') <> 'imported'
    order by source_order nulls last, created_at, id
  loop
    begin
      normalized_student_id := public.clean_import_text(staging_row.student_id_raw);
      normalized_email := public.normalize_import_email(staging_row.email_raw);
      normalized_phone := public.normalize_import_phone(staging_row.phone_raw);
      normalized_name_th := public.clean_import_text(staging_row.name_th_raw);
      normalized_name_en := public.clean_import_text(staging_row.name_en_raw);
      normalized_nickname_th := public.clean_import_text(staging_row.nickname_th_raw);
      normalized_nickname_en := public.clean_import_text(staging_row.nickname_en_raw);
      normalized_major_th := public.clean_import_text(staging_row.major_th_raw);
      normalized_line_id := public.clean_import_text(staging_row.line_id_raw);
      normalized_instagram := public.clean_import_text(staging_row.instagram_raw);
      normalized_facebook := public.clean_import_text(staging_row.facebook_raw);
      row_has_health_data := public.clean_import_text(staging_row.medical_condition_raw) is not null
        or public.clean_import_text(staging_row.drug_allergy_raw) is not null
        or public.clean_import_text(staging_row.food_allergy_raw) is not null;

      if normalized_student_id is null and normalized_email is null then
        skipped_count := skipped_count + 1;
        update public.people_import_year2_2569
        set import_status = 'skipped',
            import_note = 'Skipped because both student_id and email are missing'
        where id = staging_row.id;
        continue;
      end if;

      if normalized_student_id is not null and normalized_student_id = any(duplicate_student_ids) then
        skipped_count := skipped_count + 1;
        update public.people_import_year2_2569
        set import_status = 'skipped',
            import_note = 'Skipped because student_id is duplicated in staging'
        where id = staging_row.id;
        continue;
      end if;

      if normalized_email is not null and normalized_email !~* '^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$' then
        skipped_count := skipped_count + 1;
        update public.people_import_year2_2569
        set import_status = 'skipped',
            import_note = 'Skipped because email format is invalid'
        where id = staging_row.id;
        continue;
      end if;

      if normalized_phone is not null and length(normalized_phone) <> 10 then
        skipped_count := skipped_count + 1;
        update public.people_import_year2_2569
        set import_status = 'skipped',
            import_note = 'Skipped because phone cannot be normalized to 10 digits'
        where id = staging_row.id;
        continue;
      end if;

      row_metadata := jsonb_strip_nulls(jsonb_build_object(
        'source_order', staging_row.source_order,
        'major_en', public.clean_import_text(staging_row.major_en_raw),
        'curriculum_type_en', public.clean_import_text(staging_row.curriculum_type_en_raw),
        'curriculum_type_th', public.clean_import_text(staging_row.curriculum_type_th_raw),
        'program_type', public.clean_import_text(staging_row.program_type_raw)
      ));

      target_person_id := null;
      if normalized_student_id is not null then
        select id into target_person_id
        from public.people
        where student_id = normalized_student_id
        limit 1;
      end if;

      if target_person_id is null and normalized_email is not null then
        select id into target_person_id
        from public.people
        where lower(email) = normalized_email
        order by updated_at desc nulls last, created_at desc nulls last
        limit 1;
      end if;

      if target_person_id is null then
        insert into public.people (
          student_id,
          name_th,
          name_en,
          nickname,
          nickname_th,
          nickname_en,
          email,
          phone,
          faculty,
          major,
          year_level,
          line_id,
          instagram,
          facebook,
          source,
          metadata
        )
        values (
          normalized_student_id,
          normalized_name_th,
          normalized_name_en,
          normalized_nickname_th,
          normalized_nickname_th,
          normalized_nickname_en,
          normalized_email,
          normalized_phone,
          'คณะวิศวกรรมศาสตร์',
          normalized_major_th,
          2,
          normalized_line_id,
          normalized_instagram,
          normalized_facebook,
          'eng_year2_2569_excel',
          row_metadata
        );
        inserted_count := inserted_count + 1;
      else
        update public.people
        set student_id = coalesce(normalized_student_id, student_id),
            name_th = coalesce(normalized_name_th, name_th),
            name_en = coalesce(normalized_name_en, name_en),
            nickname = coalesce(normalized_nickname_th, nickname),
            nickname_th = coalesce(normalized_nickname_th, nickname_th),
            nickname_en = coalesce(normalized_nickname_en, nickname_en),
            email = coalesce(normalized_email, email),
            phone = coalesce(normalized_phone, phone),
            faculty = 'คณะวิศวกรรมศาสตร์',
            major = coalesce(normalized_major_th, major),
            year_level = 2,
            line_id = coalesce(normalized_line_id, line_id),
            instagram = coalesce(normalized_instagram, instagram),
            facebook = coalesce(normalized_facebook, facebook),
            source = 'eng_year2_2569_excel',
            metadata = coalesce(metadata, '{}'::jsonb) || row_metadata
        where id = target_person_id;
        updated_count := updated_count + 1;
      end if;

      if row_has_health_data then
        health_data_not_imported_count := health_data_not_imported_count + 1;
      end if;

      update public.people_import_year2_2569
      set import_status = 'imported',
          import_note = case
            when row_has_health_data then 'Imported identity/contact fields. Health data intentionally not imported to people.'
            else 'Imported identity/contact fields.'
          end
      where id = staging_row.id;
    exception when others then
      errors_count := errors_count + 1;
      update public.people_import_year2_2569
      set import_status = 'error',
          import_note = left(sqlerrm, 500)
      where id = staging_row.id;
    end;
  end loop;

  insert into public.change_logs (profile_id, changed_by, action, old_data, new_data)
  values (
    null,
    auth.uid(),
    'import_year2_people_from_staging',
    null,
    jsonb_build_object(
      'inserted_count', inserted_count,
      'updated_count', updated_count,
      'skipped_count', skipped_count,
      'health_data_not_imported_count', health_data_not_imported_count,
      'errors_count', errors_count
    )
  );

  return jsonb_build_object(
    'inserted_count', inserted_count,
    'updated_count', updated_count,
    'skipped_count', skipped_count,
    'health_data_not_imported_count', health_data_not_imported_count,
    'errors_count', errors_count
  );
end;
$$;

grant execute on function public.import_year2_people_from_staging() to authenticated;
