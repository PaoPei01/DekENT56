# TFBP UI Testing Checklist

Run this checklist before event-day deployment and after major UI changes.

## Devices And Viewports

- iPhone SE width.
- iPhone 12/13/14 width.
- Android mid-range width.
- Tablet width.
- Desktop admin width.

## Roles

- Public user signed out.
- Staff user.
- Mentor user.
- Emergency staff user.
- Admin user.

## Navigation

- Public users do not see inaccessible admin/staff links.
- Staff users can reach Staff Home, My Group, Attendance if allowed, and Emergency if allowed.
- Emergency staff can reach emergency tools without unrelated admin tools.
- Admin users can reach Dashboard, Groups, Staff, Emergency, and More.
- Staff Login is visible and understandable in Thai.
- Active nav state is clear.

## Mobile Bottom Spacing

Verify no button is hidden behind bottom navigation on:

- `/`
- `/events`
- `/events/entaneer-bonding-69`
- `/events/parent-orientation-staff-2569`
- `/events/parent-orientation-staff-2569/staff/apply`
- `/edit`
- `/admin/dashboard`
- `/admin/groups`
- `/admin/staff`
- `/admin/staff/import`
- `/admin/requests`
- `/staff`
- `/staff/my-group`
- `/staff/attendance`
- `/staff/emergency`

Primary CTAs must remain tappable above the bottom nav on iPhone SE and Android Chrome.

## Public Privacy

- Public list shows only safe fields.
- Public profile modal says hidden for privacy.
- Public pages do not expose email, phone, emergency phone, Line, Instagram, Facebook, disease, food allergy, or drug allergy.
- Public event pages do not show detailed budget data, internal contingency details, personal QR tokens, or individual staff contact data.

## Multi-Event Pilot

- `/events` shows both seeded public events.
- Event cards have a clear primary action.
- Parent Orientation staff recruitment CTA goes to `/events/parent-orientation-staff-2569/staff/apply`.
- Staff application form fits iPhone SE width.
- Consent checkboxes have 44px touch targets.
- Admin applications page is readable on mobile and is read-only in this pilot.

## Staff Operations

- Staff can search group participants quickly.
- Staff can check attendance using visible one-tap buttons.
- Attendance sync button appears when unsynced records exist.
- Medical information is hidden unless the user is admin or emergency_staff.
- Long Thai and English names do not break cards.

## Emergency

- 1669, Head Medic, University Hospital, Police, and Fire are reachable in one tap.
- Copy phone number fallback works.
- Offline emergency fallback appears when data cannot load.
- Confidentiality notice is visible when medical data is shown.
- Incident note/draft UI does not cover emergency buttons.

## Imports

- Staff import preview is understandable without developer knowledge.
- Warning-only, duplicate-only, and missing-data views work.
- Duplicate data states are clear.
- Rejected/flagged rows can be downloaded.
- Commit import requires confirmation.
- After import, Sync Staff Roster is shown as the next action.

## Destructive Actions

- Delete/reset/clear actions use ConfirmDialog.
- Dangerous actions are separated from primary actions.
- Required typed confirmation works where enabled.

## Accessibility And Motion

- Keyboard navigation reaches all major controls.
- Focus ring is visible.
- Modal Escape close works.
- Screen-reader labels exist for icon-only buttons.
- Reduced motion setting removes nonessential motion.

## Build

- `npm run build` passes.
- No public page leaks private data.
- Mobile pages remain readable and not overcrowded.
