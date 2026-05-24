# Health Data Privacy

Health and allergy information is private operational data. Public pages must not expose it, and application forms must not read it from `public.people`.

## Storage Model

- `public.person_health_profiles` is the private reusable source for known health information.
- Applicant submissions continue to store a point-in-time snapshot in `staff_applications.answers.health_details`.
- Admin application review and export use the submitted snapshot from `staff_applications.answers`, not the private profile table.

## Applicant Prefill

- Prefill is available only after the applicant completes identity verification.
- The applicant-facing RPC returns only minimal health fields and never returns `person_id`.
- If identity cannot be verified, the RPC returns `health_profile: null`.
- Prefilled data is never submitted automatically; the applicant can edit or clear it first.
- When health information is provided, the applicant must confirm that it is current before submitting.

## Access Rules

- `person_health_profiles` has RLS enabled.
- Admins can manage the table through admin-only policies.
- Normal public users must not directly select the table.
- Applicant access goes through `get_person_health_profile_for_application()`, which performs identity checks before returning any health profile.

## Admin Handling

- Health data exports contain contact and health information and should be shared only with authorized university or event units.
- Admin screens should show only the submitted application snapshot unless a specific admin health-profile management tool is intentionally built.
- Public event pages, profile-check pages, and application-status pages must not reveal private health profile data.

## Submitted Snapshot Fields

When an applicant reports health or allergy information, the submitted snapshot records:

- `confirmed_current`
- `confirmed_at`
- `prefilled_from_health_profile`
- `health_profile_source`
