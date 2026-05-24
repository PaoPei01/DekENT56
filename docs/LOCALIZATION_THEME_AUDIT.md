# Localization and Theme Readiness Audit

Date: 2026-05-24

Scope: Phase 1 audit only. This document records the current localization and theme readiness before browser/device language detection, manual preference architecture, and dark mode are implemented.

Out of scope for this phase:

- No dark mode implementation.
- No mass UI string replacement.
- No app rewrite.
- No database schema changes.
- No business logic or security changes.

## Executive Summary

Current language system status:

- The app already has a global `LanguageProvider` in `src/context/LanguageContext.tsx`, mounted from `src/main.tsx`.
- The current language type and a small shared dictionary live in `src/lib/i18n.ts`.
- Phase 2 adds validated language utilities, browser/device language detection, and the new manual preference key `tfbp_language`.
- Phase 2 adds `src/lib/translations.ts` as the translation dictionary foundation.
- A second shared copy object lives in `src/lib/copy.ts`, so copy ownership is split.
- Most newer pages use `useLanguage()` and inline expressions such as `language === 'th' ? '...' : '...'`.
- Guide/help content is more structured than the rest of the UI, with Thai/English fields in `src/lib/guideContent.ts`.
- Language was previously persisted in `localStorage` with the key `language`; new writes use `tfbp_language` while reading the legacy key as fallback.
- Browser/device language detection now chooses Thai when any browser language starts with `th`; otherwise it defaults to English.

Current theme readiness:

- The app is light-only.
- Global CSS custom properties exist in `src/styles/tokens.css`, but they are light-mode values only.
- Many surfaces still use hardcoded `rgba(255, 255, 255, ...)`, fixed dark text, light gradients, and light shadows across `src/styles/components.css`, `src/styles/layout.css`, `src/styles/mobile.css`, and page CSS.
- There is no `ThemeProvider`, no `data-theme`, and no `system | light | dark` preference model.

Biggest risks:

- Invalid stored language values are now ignored by the language utility.
- Auto-detected language is not stored as a manual preference.
- Copy is fragmented across `src/lib/i18n.ts`, `src/lib/copy.ts`, page-local label maps, and inline ternaries.
- Status, attendance, identity, event, and duty labels are duplicated in multiple files.
- User-facing technical words still appear in public/staff flows, especially `token`, `Auth`, `RPC`, `Supabase`, `RLS`, `JSON`, `database`, and schema/migration terms.
- Dark mode cannot be safely added by color inversion because QR codes, scanner surfaces, document previews, glass cards, badges, and emergency states need explicit semantic tokens.

Recommended implementation order:

1. Phase 2: Language detection and preference foundation.
2. Phase 3: Theme preference and semantic token foundation.
3. Phase 4: Incremental translation cleanup and dark-mode polish by component/page group.

## Current Language Architecture

Files involved:

- `src/main.tsx`: wraps the app with `LanguageProvider`, `EventProvider`, and `HashRouter`.
- `src/App.tsx`: route table only; no language state ownership.
- `src/context/LanguageContext.tsx`: owns `language`, `setLanguage`, and exposes `t`.
- `src/lib/i18n.ts`: defines `Language = 'th' | 'en'` and a small `copy` dictionary.
- `src/lib/copy.ts`: defines another Thai/English `copy` object used by shared UI and operational pages.
- `src/components/Layout.tsx`: owns the visible desktop `EN/TH` toggle and mobile language menu entry.
- `src/components/mobile/MobileMoreMenu.tsx`: receives language/toggle-related labels from layout.
- `src/lib/guideContent.ts` and `src/lib/guideRegistry.ts`: structured bilingual guide/help content.
- `src/lib/applicationStatus.ts`: centralized staff application status labels.
- `src/lib/parentOrientationDuties.ts`: centralized Parent Orientation duty labels, currently Thai-only for canonical duty labels.
- `src/lib/attendanceEventContext.ts`, scanner components, event pages, and admin pages: several page-local bilingual label maps.

Storage:

- Current key for new writes: `tfbp_language`.
- Legacy read fallback: `language`.
- Current values expected by code: `th` or `en`.
- Current first-visit behavior: Thai for browser languages starting with `th`, English otherwise.
- Unsupported stored values are rejected.
- Auto-detected values are not stored.
- Gap: no reset-to-browser/system-language control yet.

Toggle behavior:

- Desktop top nav button shows `EN` when Thai is active and `TH` when English is active.
- Clicking the button toggles directly between `th` and `en`.
- Mobile More menu exposes a language switch through the layout.
- Toggle writes the new value to `localStorage` and updates React state.
- There is no browser language detection, no first-run detection, and no reset-to-system option.

Where language state is passed:

- Most routed pages call `useLanguage()` directly.
- Shared components generally receive already-localized strings from callers.
- Some shared components have their own small language defaults.
- Some helpers accept `language: 'th' | 'en'` and return labels.
- Guide/help reads `language` and selects `titleTh/titleEn`, `summaryTh/summaryEn`, and related fields.

Duplicated language logic:

- `src/lib/i18n.ts` and `src/lib/copy.ts` both contain shared copy objects.
- `src/components/Layout.tsx` has many inline navigation labels.
- Event status labels are repeated in `src/pages/EventsPage.tsx`, `src/pages/EventDetailPage.tsx`, and `src/pages/AdminEventsPage.tsx`.
- Attendance status labels are repeated in `src/pages/StaffAttendancePage.tsx`, `src/pages/StaffAttendanceScanPage.tsx`, `src/pages/AdminStaffAttendanceSessionPage.tsx`, `src/components/attendance/StaffQrScannerModal.tsx`, and `src/components/attendance/SessionQrScannerModal.tsx`.
- Identity status, assignment method, quota, duplicate submission, and export labels are partly page-local in `src/pages/AdminEventApplicationsPage.tsx` and staff application pages.
- Error fallback copy is split between `src/lib/errorMessages.ts`, `src/utils/supabaseDiagnostics.ts`, service helpers, and page-local `catch` blocks.

Phase 1 helper-file decision:

- Completed in Phase 2: `src/lib/i18n.ts` now contains language storage, normalization, browser detection, initial detection, and safe translation lookup helpers.
- Completed in Phase 2: `src/lib/translations.ts` now contains initial namespaces for common UI, navigation, identity, staff application, statuses, and future theme labels.
- `src/lib/copy.ts` remains for compatibility and should be consolidated gradually.

## Hardcoded String Audit

This audit uses "hardcoded" to mean strings embedded in components/pages rather than owned by a shared label/copy helper. Some hardcoded content is acceptable temporarily, especially admin-only diagnostic copy and event content that comes from the database or structured content files.

High-volume files to treat carefully:

- `src/pages/EventStaffApplyPage.tsx`
- `src/pages/AdminEventApplicationsPage.tsx`
- `src/components/Layout.tsx`
- `src/pages/EventDetailPage.tsx`
- `src/pages/SystemReadinessPage.tsx`
- `src/pages/DocumentSettingsPage.tsx`
- `src/pages/VerifyEditPage.tsx`
- `src/pages/AdminEventDetailPage.tsx`
- `src/pages/AdminDashboardPage.tsx`
- `src/pages/StaffManagementPage.tsx`

### Public Pages

Files:

- `src/pages/PublicListPage.tsx`
- `src/pages/PortalPage.tsx`
- `src/pages/AnnouncementsPage.tsx`
- `src/pages/AnnouncementDetailPage.tsx`
- `src/components/AnnouncementCard.tsx`
- `src/components/PublicStaffCard.tsx`

Findings:

- Public list uses `t` for some shared labels, but many headings, empty states, hints, and CTA labels are inline.
- Portal copy is Thai-first and useful, but fully inline.
- Announcement cards and detail pages mix database content with UI chrome. Database content must not be auto-translated.
- Public privacy copy is present, but should eventually move to shared public copy so it stays consistent.

Technical-word risk:

- Low on core public list.
- Higher on public staff/QR-adjacent pages if they use the word `token`.

Safe future consolidation:

- Move public navigation, empty states, privacy labels, and participant self-service CTAs first.
- Keep participant names, event names, announcement text, and database content as stored.

### Event Pages

Files:

- `src/pages/EventsPage.tsx`
- `src/pages/EventDetailPage.tsx`
- `src/pages/EventRegisterPage.tsx`
- `src/pages/EventAnnouncementsPage.tsx`
- `src/pages/EventAnnouncementDetailPage.tsx`
- `src/lib/eventContent.ts`
- `src/lib/eventRoutes.ts`

Findings:

- Event status labels are duplicated across public and admin event pages.
- Event action labels are inline in each page.
- `src/lib/eventContent.ts` is structured content rather than UI chrome; it already carries Thai/English event-specific content.
- Visibility/status badges may show raw values when a label map misses a status.

Technical-word risk:

- "Legacy/default event" and migration compatibility wording is understandable for admins, but should be softened if shown to public users.

Safe future consolidation:

- Add shared event label helpers for status, visibility, and event actions.
- Keep event name/description translation tied to stored fields such as `name_th` and `name_en`.

### Staff Application

Files:

- `src/pages/EventStaffApplyPage.tsx`
- `src/pages/EventStaffApplicationStatusPage.tsx`
- `src/lib/applicationStatus.ts`
- `src/lib/parentOrientationDuties.ts`
- `src/lib/applicationStatus.ts`

Findings:

- Staff application flow is Thai-first and intentionally detailed, but the majority of UI strings are inline.
- Staff application status labels are centralized in `src/lib/applicationStatus.ts`.
- Parent Orientation duty labels are centralized, but canonical duty labels are Thai-only.
- Duplicate submission, CMU Mail mismatch, preliminary duty, consent, and success/waiting states are spread across page code.
- Some labels are intentionally domain-specific and should not be mass-translated without event-owner review.

Technical-word risk:

- CMU Mail is acceptable domain language.
- Avoid exposing `person_id`, `event_staff`, raw status enums, or schema/RPC text to applicants.

Safe future consolidation:

- Extract applicant-facing identity status, duplicate submission, preliminary duty, full-duty, and consent labels.
- Keep health/limitations wording privacy-reviewed and Thai-first.

### Profile Check

Files:

- `src/pages/EventProfileCheckPage.tsx`
- `src/pages/VerifyEditPage.tsx`
- `src/services/people.ts`
- `src/services/profiles.ts`

Findings:

- Public profile check uses inline bilingual copy.
- It correctly distinguishes safe/masked data from private details, but the wording should stay consistent with other self-service flows.
- Errors should avoid saying database, RPC, schema, or row-level security.

Technical-word risk:

- "central database" / "ฐานข้อมูลกลาง" may be acceptable when explaining admin-managed records, but public copy should prefer "ข้อมูลกลางของกิจกรรม" when possible.

Safe future consolidation:

- Create shared self-service copy for identity verification, masked fields, no-match states, and update-request submission.

### Admin Event Applications

Files:

- `src/pages/AdminEventApplicationsPage.tsx`
- `src/lib/applicationStatus.ts`
- `src/lib/parentOrientationDuties.ts`
- `src/utils/supabaseDiagnostics.ts`

Findings:

- This page contains many inline labels for filters, review dialogs, quota states, export confirmation, identity warnings, and detail rows.
- Application status labels are centralized, but identity status and assignment method labels are local.
- Export warning copy is strong and privacy-aware, but should eventually be shared with other export surfaces.
- Admin-only schema/RPC diagnostics are acceptable here when clearly scoped to readiness/admin work.

Technical-word risk:

- `RPC`, migration, `CMU Mail`, `person`, and raw IDs are acceptable only for admin diagnostics/detail rows.
- Export modal must keep plain Thai privacy wording before any technical detail.

Safe future consolidation:

- Centralize identity status labels, assignment method labels, export scope labels, and privacy warning copy before migrating broader table strings.

### Admin People Pages

Files:

- `src/pages/AdminPeoplePage.tsx`
- `src/pages/AdminPeopleUpdateRequestsPage.tsx`
- `src/pages/AdminPeopleDedupePage.tsx`
- `src/pages/AdminPeopleGroupsHubPage.tsx`
- `src/pages/Year2PeopleImportPage.tsx`

Findings:

- People pages use a mix of Thai-first inline copy and admin technical copy.
- Import pages intentionally reference staging, CSV, Supabase Table Editor, preview, and import RPCs.
- Dedupe pages need stable terminology for merge/review/source records.
- Some English labels are raw data-field labels such as `People field` or `not imported`.

Technical-word risk:

- Admin-only pages can include technical helper text, but table headers and primary actions should be understandable in Thai first.

Safe future consolidation:

- Create admin data-management label helpers for import, preview, merge, source/target records, and update request statuses.

### Staff Pages

Files:

- `src/pages/StaffStartPage.tsx`
- `src/pages/StaffDashboardPage.tsx`
- `src/pages/StaffMobilePage.tsx`
- `src/pages/StaffDirectoryPage.tsx`
- `src/pages/StaffProfilePage.tsx`
- `src/pages/StaffProfileEditPage.tsx`
- `src/pages/StaffProfileVerifyPage.tsx`
- `src/pages/StaffPersonalQrPage.tsx`
- `src/components/StaffAvatar.tsx`
- `src/components/StaffGuard.tsx`

Findings:

- Staff pages are mostly Thai-first but heavily inline.
- Staff role, group, profile visibility, and contact visibility labels are duplicated or partly raw.
- Staff personal QR and scanner fallback surfaces expose the word `token`.
- StaffGuard/AdminGuard error states should stay friendly and not mention internal auth implementation.

Technical-word risk:

- `Auth` and `token` are visible in some staff-facing contexts.
- Replace visible `token` with `รหัส QR` / `QR code` in a future copy phase while preserving payload names internally.

Safe future consolidation:

- Build shared staff labels for Staff Center, profile visibility, QR fallback, contact visibility, group assignment, and access-denied states.

### Attendance

Files:

- `src/pages/StaffAttendancePage.tsx`
- `src/pages/StaffAttendanceScanPage.tsx`
- `src/pages/AdminStaffAttendancePage.tsx`
- `src/pages/AdminStaffAttendanceSessionPage.tsx`
- `src/components/attendance/StaffPersonalQrModal.tsx`
- `src/components/attendance/StaffQrScannerModal.tsx`
- `src/components/attendance/SessionQrScannerModal.tsx`
- `src/lib/attendanceEventContext.ts`
- `src/lib/attendanceTypes.ts`

Findings:

- Attendance status labels are duplicated across pages and scanner components.
- QR state labels exist in `src/lib/attendanceEventContext.ts`, but scanner result labels are local.
- Session status, target scope, check-in method, and scan-result labels should become shared helpers.
- Scanner copy contains multiple technical fallback strings for raw token/paste-token behavior.

Technical-word risk:

- `token` appears in scanner fallback labels and hints.
- This is useful for admin troubleshooting, but too technical for most staff users.

Safe future consolidation:

- Add a shared attendance label module before changing strings.
- Keep QR payload parsing and token security logic untouched.
- Keep QR code visual surfaces white in future themes.

### Documents

Files:

- `src/pages/DocumentCenterPage.tsx`
- `src/pages/DocumentGeneratePage.tsx`
- `src/pages/DocumentTemplatesPage.tsx`
- `src/pages/DocumentSettingsPage.tsx`
- `src/pages/DocumentHistoryPage.tsx`
- `src/components/documents/DocumentEventContextCard.tsx`
- `src/lib/documentGeneration.ts`
- `src/lib/documentEventContext.ts`
- `src/lib/documentTypes.ts`

Findings:

- Document Center copy is mostly admin-facing and Thai-first.
- Document workflows necessarily include DOCX/template/placeholder/version terminology.
- Some table headers and statuses are hardcoded Thai-only or English-only.
- Document preview must be treated as generated content, not UI chrome.

Technical-word risk:

- `template`, `placeholder`, `version`, `Storage`, and `HTML preview` are acceptable in admin document tooling, but primary CTAs should remain Thai-first and plain.

Safe future consolidation:

- Centralize document type labels, template scope labels, readiness statuses, and export/download labels.

### Guide/Help

Files:

- `src/lib/guideContent.ts`
- `src/lib/guideRegistry.ts`
- `src/lib/helpRoutes.ts`
- `src/pages/GuideCenterPage.tsx`
- `src/pages/GuideCategoryPage.tsx`
- `src/pages/GuideTopicPage.tsx`
- `src/components/help/HelpDrawer.tsx`
- `src/components/help/HelpButton.tsx`
- `src/components/help/HelpLink.tsx`

Findings:

- Guide content is the strongest bilingual area because it uses structured Thai/English fields.
- It still contains some intentionally technical admin terms such as RPC, migration, signed URL, schema drift, and token.
- Guide content should remain separate from UI chrome translations because it is longer authored content.

Technical-word risk:

- Acceptable in admin guide topics.
- Avoid surfacing technical guide snippets as quick help on public/staff pages unless rewritten.

Safe future consolidation:

- Keep guide content authored as structured content.
- Centralize only guide navigation/filter/search labels in app UI translation helpers.

### Shared Components

Files:

- `src/components/Layout.tsx`
- `src/components/ui/*`
- `src/components/mobile/*`
- `src/components/events/EventSwitcher.tsx`
- `src/components/ContactLinks.tsx`
- `src/components/HealthFlags.tsx`

Findings:

- `Layout` is the largest shared string hotspot and should be migrated early.
- Shared UI components mostly receive strings from callers, which is good.
- Some shared components contain built-in defaults, for example modal close labels, filter labels, empty state defaults, and select placeholders.
- `Select` already defaults to a Thai placeholder in at least one path, but placeholder policy should be centralized.
- `MobileFilterSheet` can default to English labels if callers omit labels.

Technical-word risk:

- Shared components should not know domain technical words.
- Any shared default should be plain Thai-first and overridable.

Safe future consolidation:

- Start with shared nav/action labels and default component labels.
- Do not move large page-specific paragraphs into a global dictionary too early.

## Theme Readiness Audit

### Body and Page Shell

Files:

- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/styles/layout.css`
- `src/styles/mobile.css`

Findings:

- `:root` sets `color-scheme: light`.
- `--bg`, `--text`, `--muted`, `--surface`, `--panel`, `--border`, `--shadow`, and status surface tokens exist.
- Body background uses fixed light gradients in `src/styles/base.css`.
- Top nav, page shell, mobile bottom nav, and mobile menus use translucent white surfaces.

Dark-mode risks:

- Body/page shell will remain bright until tokens and gradients are theme-aware.
- Glass surfaces tuned for light mode can become low-contrast or muddy on dark backgrounds.
- Shadows tuned for light mode may disappear or create halos in dark mode.

Recommended token direction:

- Add semantic tokens for `--app-bg`, `--app-bg-gradient`, `--surface-elevated`, `--surface-overlay`, `--surface-muted`, `--text-strong`, `--text-muted`, `--border-subtle`, `--border-strong`, and `--shadow-elevated`.

### Cards

Files:

- `src/components/ui/Card.tsx`
- `src/styles/components.css`
- `src/styles/pages/*.css`
- `src/styles/mobile.css`

Findings:

- Card components are reusable, but many card-like page classes define their own fixed light backgrounds.
- Common patterns include `rgba(255, 255, 255, 0.68-0.98)`, `#fff`, and light blue gradients.
- Group-colored cards use `color-mix` and `--group-soft`, but often mix toward white.

Dark-mode risks:

- White cards on dark shell.
- Low-contrast borders when alpha values were designed for white surfaces.
- Group cards may become washed out if mixed with white.

Recommended token direction:

- Introduce component tokens for `--card-bg`, `--card-bg-soft`, `--card-border`, `--card-shadow`, and `--group-card-bg`.

### Buttons

Files:

- `src/components/ui/Button.tsx`
- `src/styles/components.css`
- `src/styles/mobile.css`

Findings:

- Primary buttons mostly use accent tokens but include fixed gradients.
- Secondary and ghost buttons often use transparent or light translucent backgrounds.
- Danger/success buttons include fixed red/green values.

Dark-mode risks:

- Secondary/ghost buttons may not separate from dark surfaces.
- Danger/success buttons may fail contrast if only background changes.
- Focus ring is tokenized but should be checked on dark surfaces.

Recommended token direction:

- Add `--button-primary-bg`, `--button-primary-text`, `--button-secondary-bg`, `--button-secondary-text`, `--button-secondary-border`, `--button-danger-bg`, and hover variants.

### Inputs and Selects

Files:

- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/styles/components.css`
- `src/styles/mobile.css`

Findings:

- Inputs/selects use light glass backgrounds and fixed border colors.
- Placeholder/muted text inherits from light-mode muted values.
- Native select dropdown rendering will vary by browser.

Dark-mode risks:

- Placeholder text may become too dim.
- Autofill styles can clash with dark surfaces.
- Native select menus may be unreadable if only the control is themed.

Recommended token direction:

- Add `--field-bg`, `--field-text`, `--field-placeholder`, `--field-border`, `--field-focus-border`, and `--field-disabled-bg`.

### Tables

Files:

- `src/components/ui/ResponsiveDataTable.tsx`
- `src/styles/components.css`
- admin/staff page CSS

Findings:

- Responsive table foundation is strong.
- Desktop table rows, mobile cards, row separators, and detail accordions rely on light glass colors.
- Admin data tables are high-density and need careful contrast testing.

Dark-mode risks:

- Row boundaries can disappear.
- Sticky headers and mobile detail panels may look detached.
- Status badges inside tables may become the only visible color cue if row text contrast weakens.

Recommended token direction:

- Add `--table-bg`, `--table-header-bg`, `--table-row-bg`, `--table-row-hover-bg`, `--table-border`, and `--table-mobile-card-bg`.

### Modals and Drawers

Files:

- `src/components/ui/Modal.tsx`
- `src/components/mobile/MobileFilterSheet.tsx`
- `src/components/mobile/MobileMoreMenu.tsx`
- `src/components/help/HelpDrawer.tsx`
- `src/styles/components.css`
- `src/styles/mobile.css`

Findings:

- Modal and drawer structure is reusable.
- Backdrops and sheet surfaces are fixed light/dark alpha values.
- Mobile menus and sheets use white surfaces with light shadows.

Dark-mode risks:

- Backdrop opacity may be too weak on dark backgrounds.
- White sheets will be visually jarring if dark mode is enabled.
- Focus states and close buttons need contrast checks.

Recommended token direction:

- Add `--backdrop-bg`, `--modal-bg`, `--modal-border`, `--drawer-bg`, `--drawer-border`, and `--overlay-shadow`.

### Toasts

Files:

- `src/components/ui/Toast.tsx`
- `src/styles/components.css`

Findings:

- Toasts use status-specific classes and light status surfaces.
- Toast role/aria behavior is appropriate.

Dark-mode risks:

- Light success/warning/danger surfaces may glow too much.
- Status text colors may not meet contrast if reused on dark surfaces.

Recommended token direction:

- Add status tokens for every tone:
  - `--status-success-text`
  - `--status-success-bg`
  - `--status-success-border`
  - `--status-warning-text`
  - `--status-warning-bg`
  - `--status-warning-border`
  - `--status-danger-text`
  - `--status-danger-bg`
  - `--status-danger-border`
  - `--status-info-text`
  - `--status-info-bg`
  - `--status-info-border`

### Nav and Bottom Nav

Files:

- `src/components/Layout.tsx`
- `src/components/mobile/RoleAwareBottomNav.tsx`
- `src/components/mobile/MobileMoreMenu.tsx`
- `src/styles/layout.css`
- `src/styles/mobile.css`

Findings:

- Desktop nav and mobile bottom nav use translucent white backgrounds.
- Active nav states use light blue surfaces.
- Mobile More menu is a drawer/sheet with fixed light surfaces.

Dark-mode risks:

- Floating nav may feel disconnected from the dark page.
- Active states may lose contrast.
- Language toggle and account menu need independent focus/hover testing.

Recommended token direction:

- Add `--nav-bg`, `--nav-border`, `--nav-link-text`, `--nav-link-active-bg`, `--nav-link-active-text`, `--bottom-nav-bg`, and `--bottom-nav-shadow`.

### Status Badges

Files:

- `src/components/ui/Badge.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/styles/components.css`
- `src/styles/layout.css`
- `src/styles/mobile.css`
- page CSS with `status-*` classes

Findings:

- Badge component exists, but status class colors are scattered.
- Some status text colors are hardcoded red/green/orange hex values.
- Some raw statuses can fall through and render as enum text.

Dark-mode risks:

- Badge color contrast can fail in both text-on-surface and badge-on-card contexts.
- Color-only status may be insufficient; text labels must stay visible.

Recommended token direction:

- Centralize status tones before dark mode.
- Keep status labels textual and do not rely on color alone.

### QR and Scanner Surfaces

Files:

- `src/pages/StaffPersonalQrPage.tsx`
- `src/pages/StaffAttendanceScanPage.tsx`
- `src/components/attendance/StaffPersonalQrModal.tsx`
- `src/components/attendance/StaffQrScannerModal.tsx`
- `src/components/attendance/SessionQrScannerModal.tsx`
- QR/scanner styles in `src/styles/components.css` and `src/styles/mobile.css`

Findings:

- QR and scanner pages are operationally important and light-oriented.
- Camera fallback copy uses technical `token` wording.
- QR codes must remain high contrast.

Dark-mode risks:

- QR codes must not be inverted.
- QR container should remain white or explicitly high-contrast.
- Camera overlay controls need separate dark/light testing.

Recommended token direction:

- Add `--qr-bg: #ffffff`, `--qr-fg: #000000`, `--scanner-frame`, and scanner control tokens.
- Keep QR canvas/SVG rendering independent from app theme.

## Recommended Phase Plan

### Phase 2: Language Detection

Goals:

- Validate language persistence.
- Detect browser/device language on first run.
- Preserve manual language override behavior.
- Avoid broad copy migration.

Implementation outline:

- Extend `src/lib/i18n.ts` rather than creating `src/lib/translations.ts`.
- Add `SUPPORTED_LANGUAGES`, `isSupportedLanguage`, and `normalizeLanguage`.
- Add browser language detection that maps `th`, `th-TH`, `en`, `en-US`, etc. to supported languages.
- Update `LanguageContext` to:
  - Read a future namespaced key such as `tfbp_language`.
  - Fall back to legacy `language`.
  - Validate stored values.
  - Fall back to browser detection.
  - Fall back to Thai.
- Keep writing only language preference values, not personal data.
- Keep the existing EN/TH toggle working.
- Optionally migrate the legacy `language` key to the new key without deleting it in the same release.

QA placeholders:

- First visit with browser language Thai defaults to Thai.
- First visit with browser language English defaults to English.
- Unsupported browser language defaults to Thai.
- Manual toggle persists across reloads.
- Invalid localStorage value is ignored safely.

### Phase 3: Theme Foundation

Goals:

- Add preference architecture only.
- Add semantic CSS token foundation.
- Do not turn on broad dark mode until key surfaces are ready.

Implementation outline:

- Add `ThemeProvider` with `themePreference: 'system' | 'light' | 'dark'`.
- Store only the theme preference, e.g. `tfbp_theme`.
- Resolve `system` through `window.matchMedia('(prefers-color-scheme: dark)')`.
- Set `data-theme="light"` or `data-theme="dark"` on `document.documentElement`.
- Add light and dark semantic tokens in `src/styles/tokens.css`.
- Keep QR, scanner target, and document preview backgrounds explicitly controlled.
- Add a manual theme control only after the token set is stable.

QA placeholders:

- System light resolves to light.
- System dark resolves to dark.
- Manual light override persists.
- Manual dark override persists.
- QR codes remain black on white.
- Modals, bottom nav, tables, and forms remain readable.

### Phase 4: Translation and Dark Polish

Goals:

- Incrementally reduce duplicate labels and hardcoded strings.
- Polish dark mode by component and route group.
- Avoid database/content translation changes.

Implementation outline:

- Consolidate Layout/navigation labels first.
- Consolidate shared status labels next:
  - event status
  - attendance status
  - session status
  - application status
  - identity status
  - export scope/status
- Replace visible `token` in public/staff copy with plain wording while preserving internal token names.
- Move repeated public/staff/admin empty states into helpers.
- Replace hardcoded light colors with semantic tokens by component group, not by mass regex replacement.
- Test public, staff, admin, documents, attendance, emergency, and guide surfaces on mobile and desktop.

## Risky Areas to Avoid

- Do not mass rewrite CSS in one pass.
- Do not translate database content automatically.
- Do not translate user-entered content.
- Do not store unnecessary personal data in localStorage.
- Do not store email, phone, names, IDs, health data, or QR payloads as language/theme preferences.
- Do not use dark mode by inverting colors only.
- Do not invert QR codes, scanner camera views, generated document previews, images, or logos.
- Do not change Supabase behavior, RLS, RPCs, migrations, or business logic during localization/theme foundation work.
- Do not expose `RPC`, `token`, `JSON`, `database error`, `invalid input syntax`, `function does not exist`, or raw schema terms to normal public/staff users.
- Do not remove Thai-first wording in favor of English keys.
- Do not migrate all strings to a huge flat dictionary before label ownership is clear.
- Do not make dark mode the default until public, staff, admin, attendance, document, and emergency surfaces have been manually checked.
