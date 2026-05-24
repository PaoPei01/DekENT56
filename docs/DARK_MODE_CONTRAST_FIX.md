# Dark Mode Contrast Fix

## Problem Summary

Dark mode existed, but several shared UI surfaces still depended on hardcoded light-mode colors. This caused low contrast on pages such as `/me`, where the My information header, stepper, cards, and form controls could appear as light gray surfaces with light text.

The issue was most visible in:

- Page headers and hero-style cards
- Glass/card surfaces
- Stepper pills in the My information flow
- Inputs, selects, and textarea fields
- Secondary buttons and ghost buttons
- Status badges and health/warning badges
- Sticky action bars and mobile cards

## Token Changes

`src/styles/tokens.css` now includes stronger semantic tokens for both light and dark themes:

- `--bg`, `--bg-soft`
- `--surface`, `--surface-soft`, `--surface-muted`, `--surface-elevated`
- `--text`, `--text-strong`, `--text-muted`, `--text-subtle`, `--text-inverse`
- `--primary`, `--primary-hover`, `--primary-contrast`, `--primary-soft`, `--primary-soft-text`
- `--success-*`, `--warning-*`, `--danger-*`, `--info-*`
- `--input-bg`, `--input-text`, `--input-placeholder`, `--input-border`

Compatibility aliases such as `--panel`, `--panel-strong`, `--field-bg`, `--field-border`, `--accent-strong`, and `--text-soft` still exist so older CSS keeps working while new styles use semantic tokens.

## Classes Updated

High-impact shared styles were updated to use theme tokens instead of light-only values:

- Base app text and headings
- `.page-header`, `.hero-strip`, `.eyebrow`
- `.glass-card`, `.modal`, `.toast`, `.card-elevated`, `.card-soft`
- `.field input`, `.field select`, `.field textarea`
- `.btn-primary`, `.btn-secondary`, `.btn-ghost`, disabled buttons
- `.status-badge`, `.badge-pending`, `.badge-approved`, `.badge-rejected`
- `.edit-step`, `.edit-step-active`, `.edit-step-done`
- `.edit-profile-summary`, `.edit-privacy-grid`, `.edit-inline-error`, `.edit-success-card`
- `.sticky-action-bar`, `.action-card`, `.event-detail-tabs`, `.event-operation-action`, `.checkbox-row`, `.event-timeline-item`
- Dark mobile status pills

## Pages Manually Checked

Recommended manual dark-mode checks after this pass:

- `/me`
- `/events`
- `/events/parent-orientation-staff-2569/staff/apply`
- `/events/parent-orientation-staff-2569/profile-check`
- `/admin/events`
- `/admin/events/:eventId/applications`
- `/admin/people`
- `/admin/documents`

## Expected Behavior

- Dark mode cards use dark surfaces, not light gray surfaces.
- Page headers and hero text remain readable.
- Stepper inactive, active, and completed states are all readable.
- Inputs and selects have visible borders, readable placeholder text, and visible focus states.
- Status badges include readable text and do not rely on color alone.
- QR code colors remain explicitly black on white.

## Remaining TODOs

- Continue replacing rare page-specific hardcoded light backgrounds during normal feature work.
- Run browser-based visual QA for authenticated admin pages with real data.
- Validate document previews separately because generated/imported content may carry its own styles.
