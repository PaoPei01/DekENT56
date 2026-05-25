-- Participant profile re-import SQL runbook.
-- This workflow replaces legacy public.profiles only.
-- Never delete public.people or any staff tables for this import.

-- 1) Optional: clear only the staging table before a new upload.
-- Do this only when you are sure the previous staging upload is no longer needed.
truncate table public.profiles_import_2569_new;

-- 2) Upload CSV into public.profiles_import_2569_new with Supabase Table Editor.
-- Map CSV columns into *_raw columns.

-- 3) Preview and validate.
select public.preview_profiles_reimport_2569();

-- 4) Create backups before replacing profiles.
select public.backup_profiles_before_reimport_2569();

-- 5) Confirm manually that preview and backup look correct.
select count(*) as staging_rows from public.profiles_import_2569_new;
select count(*) as profiles_backup_rows from public.profiles_backup_before_reimport_2569;
select count(*) as edit_requests_backup_rows from public.edit_requests_backup_before_reimport_2569;
select count(*) as emergency_notes_backup_rows from public.emergency_notes_backup_before_reimport_2569;
select count(*) as group_assignments_backup_rows from public.group_assignments_backup_before_reimport_2569;

-- 6) Replace public.profiles from staging.
-- This deletes profile-linked legacy rows: edit_requests, emergency_notes, group_assignments, profiles.
-- It does not touch public.people or staff tables.
select public.replace_profiles_from_import_2569();

-- 7) Post-check.
select count(*) as profiles_after_replace from public.profiles;
select import_status, count(*)
from public.profiles_import_2569_new
group by import_status
order by import_status;
