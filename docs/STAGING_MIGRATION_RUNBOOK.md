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
- [ ] Take a database backup or snapshot.
- [ ] Confirm `.env` points to staging, not production.
- [ ] Confirm no service role key is committed to git.
- [ ] Review pending migrations in timestamp order.
- [ ] Confirm app build passes locally.

## Apply Migrations

Apply these migrations in timestamp order through the Supabase migration workflow used by the project:

1. `202605220003_events_default_event.sql`
2. `202605230001_people_foundation.sql`
3. `202605230002_people_legacy_link_tools.sql`
4. `202605230003_event_registration_application_foundation.sql`
5. `202605230004_attendance_event_scope_foundation.sql`
6. `202605230005_event_scoped_announcements_documents_foundation.sql`

Do not run `link_legacy_profiles_to_people()` yet.

## Read-Only Verification

After migrations are applied, run:

```bash
npm run check:multi-event-staging
```

This script is read-only. It checks that:

- the default event exists
- `people` exists
- legacy `person_id` columns exist
- `preview_people_legacy_link()` runs
- event registration/application tables exist
- attendance `event_id` exists
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

Old routes must continue working:

- `/`
- `/edit`
- `/staff/attendance`
- `/admin/dashboard`
- `/admin/staff/attendance`
- `/admin/documents`

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

## Deferred / Not Approved Yet

- Replacing `/` with a platform homepage.
- Redirecting legacy routes to event-scoped routes.
- Making `event_id` non-null on legacy tables.
- Filtering public search by event.
- Requiring staff/admin event selection.
- Event-role RLS rewrite.
