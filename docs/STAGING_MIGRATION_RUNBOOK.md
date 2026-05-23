# Staging Migration Runbook

Use this runbook before enabling multi-event behavior in production. The goal is to prove the additive foundation migrations work without changing the current single-event user experience.

## Scope

This runbook covers the completed multi-event foundation only:

- `public.events` and the default event `entaneer-bonding-69`
- `public.people`
- nullable legacy links from `profiles` and `staff_profiles` to `people`
- event registration/application foundation tables
- nullable `event_id` on attendance, announcements, and document tables

It does not approve full legacy route migration, platform homepage mode, or event-required public search.

## Before Applying Migrations

- [ ] Confirm this is the intended staging Supabase project.
- [ ] Take a database backup or snapshot using the Supabase dashboard, scheduled backup, or `pg_dump`.
- [ ] Record the backup identifier, timestamp, and project ref in the release notes.
- [ ] Confirm `.env` points to staging, not production.
- [ ] Confirm no service role key is committed to git.
- [ ] Review pending migrations in timestamp order.
- [ ] Confirm app build passes locally.

## Migration Order Review

The safe order is:

1. `202605220003_events_default_event.sql`
   - Creates `public.events` before any later table references it.
   - Enables RLS and allows public reads only for `visibility = 'public'`.
2. `202605230001_people_foundation.sql`
   - Creates `public.people` before `event_participants` or `staff_applications` reference it.
   - Admin-only direct table access through RLS.
3. `202605230002_people_legacy_link_tools.sql`
   - Adds nullable `person_id` columns to legacy tables.
   - Does not link data automatically.
4. `202605230003_event_registration_application_foundation.sql`
   - Creates event participant/application/form tables after `events` and `people` exist.
   - Public users submit only through RPCs; admins manage tables directly.
5. `202605230004_attendance_event_scope_foundation.sql`
   - Adds nullable `event_id` to attendance sessions.
   - Creates `public.default_event_id()` before later migrations use it.
6. `202605230005_event_scoped_announcements_documents_foundation.sql`
   - Adds nullable `event_id` to announcements/documents.
   - Uses `public.default_event_id()` from the prior migration.
7. `202605230007_seed_core_platform_events.sql`
   - Adds `events.metadata` if missing and seeds the two platform events.

Safety observations:

- No legacy `event_id` column is made non-null.
- Existing public search, staff attendance, admin dashboard, and document routes are not redirected.
- Legacy profile/staff/attendance data is not migrated automatically.
- `link_legacy_profiles_to_people()` remains a manual admin step after preview review.

## Apply Migrations

Apply these migrations in timestamp order through the Supabase migration workflow used by the project:

1. `202605220003_events_default_event.sql`
2. `202605230001_people_foundation.sql`
3. `202605230002_people_legacy_link_tools.sql`
4. `202605230003_event_registration_application_foundation.sql`
5. `202605230004_attendance_event_scope_foundation.sql`
6. `202605230005_event_scoped_announcements_documents_foundation.sql`
7. `202605230007_seed_core_platform_events.sql`

Do not run `link_legacy_profiles_to_people()` yet.

## Read-Only Verification

After migrations are applied, run:

```bash
npm run check:multi-event-staging
```

This script is read-only. It checks that:

- the core platform events exist:
  - `entaneer-bonding-69`
  - `parent-orientation-staff-2569`
- `people` exists
- `verify_person_identity_for_prefill()` exists
- legacy `person_id` columns exist
- `preview_people_legacy_link()` runs
- event registration/application tables exist
- event form and submission RPCs exist
- attendance `event_id` exists
- `default_event_id()` exists
- announcement/document `event_id` columns exist

Review the `preview_people_legacy_link()` counts before doing any link operation.

The preview RPC is admin-only and depends on `auth.uid()`. To include it in the script, provide a temporary admin access token in the shell environment:

```bash
SUPABASE_ADMIN_ACCESS_TOKEN="..." npm run check:multi-event-staging
```

Do not commit this token. If the token is omitted, the script skips only that admin-only preview check and still verifies the additive schema.

## Manual QA Gate

Run the relevant sections in [MANUAL_QA_CHECKLIST.md](./MANUAL_QA_CHECKLIST.md):

- Events
- Admin Events
- People Foundation
- Staff Attendance
- Announcements
- Document Center
- Public

Required route checks:

- `/events`
- `/events/entaneer-bonding-69`
- `/events/parent-orientation-staff-2569`
- `/events/parent-orientation-staff-2569/staff/apply`
- `/admin/events`
- `/admin/events/:eventId`

Old routes must continue working:

- `/`
- `/edit`
- `/staff/attendance`
- `/admin/dashboard`
- `/admin/staff/attendance`
- `/admin/documents`

## Public And Admin Privacy Checks

- [ ] Public event pages do not show budget details.
- [ ] Public event pages show only `publicSummaryTh` for rain contingency.
- [ ] Public pages do not show phone, email, medical data, emergency contacts, or staff QR tokens.
- [ ] Staff application form shows health/limitations only as an input field for the applicant and admin processing.
- [ ] Regular exports, if any are tested later, do not include health data unless explicitly marked as full admin export.

## Link Legacy Profiles Only After Review

Only after duplicate review is complete, an admin may run:

```sql
select public.link_legacy_profiles_to_people();
```

This should be done first on staging. Export or screenshot the result counts.

Do not run this on production until:

- preview counts look reasonable
- duplicate people risk is reviewed
- old public/staff/admin routes pass QA
- rollback plan is confirmed

## Rollback Notes

The foundation migrations are additive. If a frontend issue appears, rollback the frontend deployment first. Avoid dropping new tables/columns unless a database rollback has been planned and tested.

If a data-linking issue appears after `link_legacy_profiles_to_people()`, investigate `profiles.person_id` and `staff_profiles.person_id` before attempting any corrective update.

Recommended rollback order:

1. Revert frontend deployment to the previous known-good commit.
2. Pause any manual linking or admin review work.
3. Preserve database backup and failed migration logs.
4. Do not drop additive columns/tables unless a tested database rollback plan exists.
5. If legacy links were created incorrectly, repair nullable `person_id` values with an explicit reviewed update rather than dropping `people`.

## Deferred / Not Approved Yet

- Replacing `/` with a platform homepage.
- Redirecting legacy routes to event-scoped routes.
- Making `event_id` non-null on legacy tables.
- Filtering public search by event.
- Requiring staff/admin event selection.
- Event-role RLS rewrite.
