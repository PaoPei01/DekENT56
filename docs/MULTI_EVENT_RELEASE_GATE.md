# Multi-Event Release Gate

Use this checklist before enabling the multi-event foundation on staging or production. This gate is intentionally conservative: it verifies the additive foundation while preserving the current single-event workflow.

## Migration Order Review

Reviewed migrations:

1. `202605220003_events_default_event.sql`
2. `202605230001_people_foundation.sql`
3. `202605230002_people_legacy_link_tools.sql`
4. `202605230003_event_registration_application_foundation.sql`
5. `202605230004_attendance_event_scope_foundation.sql`
6. `202605230005_event_scoped_announcements_documents_foundation.sql`
7. `202605230007_seed_core_platform_events.sql`

Findings:

- `public.events` is created before later migrations reference it.
- `public.people` is created before event participant/application tables reference it.
- `public.default_event_id()` is created before announcements/documents use it.
- Legacy `event_id` additions are nullable and additive.
- Legacy `person_id` additions are nullable and additive.
- RLS remains enabled on new tables.
- Public event reads are limited to `visibility = 'public'`.
- Direct `people`, `staff_applications`, `event_participants`, and `event_form_responses` access is admin-only.
- Public staff/participant submissions go through RPCs.
- No migration in this gate redirects routes or replaces public search behavior.

## Pre-Release Checklist

- [ ] Backup taken and backup identifier recorded.
- [ ] Migrations applied on staging in timestamp order.
- [ ] `npm run build` passes.
- [ ] `npm run lint` passes if available.
- [ ] `npm run check:multi-event-staging` passes.
- [ ] `preview_people_legacy_link()` output reviewed with an authenticated admin token.
- [ ] Duplicate person risk reviewed.
- [ ] `link_legacy_profiles_to_people()` tested on staging only after preview review.
- [ ] Old routes verified:
  - `/`
  - `/edit`
  - `/announcements`
  - `/staff/attendance`
  - `/admin/dashboard`
  - `/admin/staff/attendance`
  - `/admin/documents`
- [ ] New routes verified:
  - `/events`
  - `/events/entaneer-bonding-69`
  - `/events/parent-orientation-staff-2569`
  - `/events/parent-orientation-staff-2569/staff/apply`
  - `/admin/events`
- [ ] RLS tested:
  - anon can read public events
  - anon cannot read `people`
  - anon cannot read all staff applications
  - non-admin cannot access admin event pages
  - admin can read/manage events
- [ ] Public privacy checked:
  - no budget displayed publicly
  - no individual phone/email displayed publicly
  - no medical data displayed publicly
  - no staff QR tokens displayed publicly
  - rain contingency shows public summary only
- [ ] Staff application tested:
  - empty required fields show friendly validation
  - unknown email/phone fails with friendly error
  - successful submission does not promise approval
- [ ] Attendance QR tested after migrations:
  - admin can create session
  - existing sessions still load
  - QR check-in still works
  - manual check-in still works
- [ ] Rollback plan ready and understood.

## Production Approval Gate

Do not apply production migrations until all of these are true:

- [ ] Staging release gate completed.
- [ ] Staging QA screenshots or notes recorded.
- [ ] Production backup/snapshot is available.
- [ ] Migration owner and rollback owner are assigned.
- [ ] A quiet deployment window is chosen.
- [ ] Team agrees not to run `link_legacy_profiles_to_people()` in production until preview counts are reviewed.

## Deferred / Risky

These are intentionally not approved by this gate:

- Full legacy route migration.
- Making `event_id` non-null on legacy tables.
- Replacing `/` with platform homepage.
- Event-role permission rewrite.
- Event-scoped public participant search.
- Event-scoped staff attendance requirement for staff users.
- Automatic linking of legacy profiles to people without preview review.
