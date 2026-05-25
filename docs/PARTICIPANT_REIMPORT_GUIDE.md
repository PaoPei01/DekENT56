# Participant Profiles Re-import Guide

This runbook is for replacing the legacy participant source table `public.profiles` only.

Do not clear or replace:

- `public.people`
- `public.staff_profiles`
- `public.staff_assignments`
- `public.staff_attendance_sessions`
- `public.staff_attendance_records`
- `public.person_health_profiles`
- `public.staff_applications`

`public.people` is the central person database. It is not part of this legacy participant re-import workflow.

## What This Workflow Does

1. Upload new participant data into `public.profiles_import_2569_new`.
2. Preview the staging data with `preview_profiles_reimport_2569()`.
3. Back up current legacy participant tables with `backup_profiles_before_reimport_2569()`.
4. Confirm and replace `public.profiles` with cleaned staging rows using `replace_profiles_from_import_2569()`.

The replacement also clears legacy data tied directly to the old `profiles` rows:

- `public.edit_requests`
- `public.emergency_notes`
- `public.group_assignments`

This is intentional because those rows reference the old `profiles.id` values. Staff data and central people data are not touched.

## Staging Columns

Upload CSV data into `public.profiles_import_2569_new`.

Recommended column mapping:

| CSV column | Staging column |
| --- | --- |
| source_order | `source_order` |
| email | `email_raw` |
| student_id | `student_id_raw` |
| name_th | `name_th_raw` |
| name_en | `name_en_raw` |
| nickname | `nickname_raw` |
| major | `major_raw` |
| phone | `phone_raw` |
| emergency_phone | `emergency_phone_raw` |
| line_id | `line_id_raw` |
| instagram | `instagram_raw` |
| facebook | `facebook_raw` |
| other_contact | `other_contact_raw` |
| disease | `disease_raw` |
| drug_allergy | `drug_allergy_raw` |
| food_allergy | `food_allergy_raw` |
| gender | `gender_raw` |
| hometown | `hometown_raw` |
| interests | `interests_raw` |

## Required Checks Before Import

Run preview first:

```sql
select public.preview_profiles_reimport_2569();
```

Review:

- total staging rows
- rows with email
- rows with name
- duplicate emails
- duplicate student IDs
- rows missing important fields
- sample rows

Rows missing email or name are skipped during replacement. Duplicate email or duplicate student ID groups keep the first row by `source_order`, then skip later rows.

## Backup

Run backup before replacement:

```sql
select public.backup_profiles_before_reimport_2569();
```

The function creates and fills these backup tables if they do not already contain data:

- `public.profiles_backup_before_reimport_2569`
- `public.edit_requests_backup_before_reimport_2569`
- `public.emergency_notes_backup_before_reimport_2569`
- `public.group_assignments_backup_before_reimport_2569`

The backup tables have RLS enabled and are admin-readable only.

## Replace Profiles

After preview and backup are reviewed, run:

```sql
select public.replace_profiles_from_import_2569();
```

This function:

- requires admin access
- refuses to run if `profiles` has rows and no backup exists
- deletes legacy profile-linked rows from `edit_requests`, `emergency_notes`, `group_assignments`, and `profiles`
- inserts cleaned staging rows into `public.profiles`
- updates staging rows with `import_status`
- writes a `change_logs` entry
- returns `inserted_profiles`, `skipped_rows`, and duplicate warnings

## Rollback Guidance

This workflow does not auto-rollback. If rollback is needed, restore from the backup tables manually and verify the result before using the participant-facing app again.

Do not restore into `public.people`; these backup tables are only for the legacy `profiles` system.

## Safety Notes

- Do not upload staff data into this staging table.
- Do not include unnecessary sensitive notes.
- Do not delete `public.people`.
- Do not import directly into `public.profiles` without preview.
- Keep CSV files and exported backups private.
