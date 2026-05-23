# Staff Application Duplicate Prevention

Date: 2026-05-23

## Purpose

Each person should have only one staff application per event. The same person may apply to a different event in the future, but repeated submit, browser refresh/back, or double-clicking must not create duplicate applications for the same event.

## Why Duplicates Happened

The first staff application flow inserted a new `staff_applications` row every time the public submit RPC was called. The UI disabled the submit button while saving, but server-side insert logic was not idempotent yet. That meant repeated submits could create multiple rows before admin review.

## Server-Side Prevention

The duplicate prevention migration adds three layers:

1. Existing-application check inside `submit_event_staff_application()`.
2. Unique indexes for active applications:
   - `event_id + person_id` when `person_id` is known.
   - `event_id + requested_student_id` when `person_id` is still null.
3. Graceful `unique_violation` handling that re-queries the existing row and returns it with `already_applied: true`.

If the applicant already applied, the RPC returns the existing application summary instead of inserting a new row.

## Unique Indexes

Preferred active-person rule:

```sql
create unique index if not exists staff_applications_event_person_unique
on public.staff_applications(event_id, person_id)
where person_id is not null
  and status is distinct from 'withdrawn';
```

Pending/not-found identity rule:

```sql
create unique index if not exists staff_applications_event_requested_student_unique
on public.staff_applications(event_id, requested_student_id)
where person_id is null
  and requested_student_id is not null
  and btrim(requested_student_id) <> ''
  and status is distinct from 'withdrawn';
```

The migration intentionally skips creating an index if existing duplicates would make it fail. Resolve duplicates first, then rerun the index statements.

## Checking Existing Duplicates

Admin RPC:

```sql
select public.find_duplicate_staff_applications('<event-id>'::uuid);
```

All events:

```sql
select public.find_duplicate_staff_applications(null);
```

Manual report query:

```sql
select event_id, person_id, count(*) as duplicate_count, array_agg(id order by submitted_at) as application_ids
from public.staff_applications
where person_id is not null
  and status is distinct from 'withdrawn'
group by event_id, person_id
having count(*) > 1;
```

```sql
select event_id, btrim(requested_student_id) as requested_student_id, count(*) as duplicate_count, array_agg(id order by submitted_at) as application_ids
from public.staff_applications
where person_id is null
  and requested_student_id is not null
  and btrim(requested_student_id) <> ''
  and status is distinct from 'withdrawn'
group by event_id, btrim(requested_student_id)
having count(*) > 1;
```

## Manual Resolution Guidance

- Keep the earliest submitted application unless the admin has a clear reason to keep another row.
- Prefer preserving the row with richer answers, useful notes, or the correct assigned duty if that matters operationally.
- Mark extra duplicate rows as `withdrawn` so the unique index can be created and the audit trail remains intact.
- Add a review note such as `duplicate application - kept <application_id>`.
- Do not hard delete rows unless absolutely necessary, backed up, and approved by the event owner.
- Do not merge health or sensitive free-text fields into public-readable fields.

## What Not To Do

- Do not delete duplicate applications automatically.
- Do not weaken RLS to inspect duplicates.
- Do not expose all applications publicly.
- Do not block applications across different events.
- Do not rely only on frontend submit-button disabling.

## Public UX

Applicants see:

- `คุณได้ส่งใบสมัครสำหรับกิจกรรมนี้แล้ว ไม่จำเป็นต้องส่งซ้ำ`
- Existing status, identity status, preliminary duty, submitted date, and safe application id.

They do not see other applicants, admin-only notes, export data, or health data.

## TODO

Withdrawn reapply policy is not enabled in this phase. If the product later allows reapply after withdrawal, update the RPC and UI copy intentionally.
