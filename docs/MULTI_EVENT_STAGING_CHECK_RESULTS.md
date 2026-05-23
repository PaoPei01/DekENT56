# Multi-Event Staging Check Results

Last checked: 2026-05-23 before `202605230007_seed_core_platform_events.sql`

Command:

```bash
npm run check:multi-event-staging
```

## Result Summary

The read-only schema verification passed against the Supabase project configured in local `.env`.

This result was captured before adding the Parent Orientation seed migration. Re-run the check after applying `202605230007_seed_core_platform_events.sql`.

Passed checks:

- default event exists: `สานสัมพันธ์ 69 / Entaneer Bonding 69`
- default event status/visibility: `active`, `public`
- `people` table is readable by service role
- current `people` row count: `0`
- `profiles.person_id` and `staff_profiles.person_id` are selectable
- event registration/application tables exist
- `staff_attendance_sessions.event_id` is selectable
- `announcements.event_id` is selectable
- `document_project_profiles.event_id` is selectable
- `document_templates.event_id` is selectable
- `generated_documents.event_id` is selectable

Skipped checks:

- `preview_people_legacy_link()` was skipped because no `SUPABASE_ADMIN_ACCESS_TOKEN` was provided.

## Interpretation

The additive multi-event foundation migrations appear to be applied in the checked environment. The project is not ready for legacy people linking yet because the admin-only preview RPC has not been run with an authenticated admin session.

Do not run:

```sql
select public.link_legacy_profiles_to_people();
```

until `preview_people_legacy_link()` has been reviewed by an admin and duplicate risks are accepted.

## Next Gate

1. Open the app as an admin.
2. Obtain a temporary admin access token for the staging check shell only.
3. Run:

```bash
SUPABASE_ADMIN_ACCESS_TOKEN="..." npm run check:multi-event-staging
```

4. Review the preview output.
5. Run the Events, Admin Events, and People Foundation sections in `docs/MANUAL_QA_CHECKLIST.md`.
6. Only then decide whether to run the legacy linking RPC on staging.

## Attendance Constraint Repair Note

If applying attendance migrations manually fails with:

```text
check constraint "staff_attendance_records_method_check" of relation "staff_attendance_records" is violated by some row
```

the database likely already has attendance records with `method = 'verified_camera_scan'` while an older constraint definition only allowed `session_qr`, `verified_qr`, `manual`, `admin_scan_staff_qr`, `import`, and `system`.

Apply the repair migration:

```text
supabase/migrations/202605230006_staff_attendance_method_constraint_repair.sql
```

The intended method set is:

- `session_qr`
- `verified_qr`
- `verified_camera_scan`
- `manual`
- `admin_scan_staff_qr`
- `import`
- `system`
