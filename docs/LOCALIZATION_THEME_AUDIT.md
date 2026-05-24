# Localization and Theme Readiness Audit

วันที่ตรวจ: 2026-05-24

## Executive Summary

ระบบมี Thai/English support อยู่แล้วผ่าน `LanguageProvider`, `useLanguage()`, `src/lib/i18n.ts`, และ `src/lib/copy.ts` แต่ยังเป็นระบบกึ่งกลางกึ่งกระจาย: บางหน้าดึง `t` จาก dictionary, หลายหน้าฝังข้อความแบบ `language === 'th' ? ... : ...`, และหลาย helper มี label map ของตัวเอง ทำให้ browser language detection และ dark mode ควรเริ่มจาก foundation ก่อน ไม่ควร rewrite copy หรือ CSS ทั้งระบบในรอบเดียว

Theme readiness ตอนนี้เป็น light-only. มี token หลักแล้วใน `src/styles/tokens.css` เช่น `--text`, `--muted`, `--surface`, `--surface-soft`, `--surface-strong`, `--focus-ring` แต่ CSS ยังมี hardcoded light surfaces, fixed text colors, status colors, shadows, and gradients จำนวนมาก โดยเฉพาะใน `src/styles/mobile.css` และ `src/styles/components.css`

Biggest risks:
- `LanguageContext` อ่าน `localStorage.getItem('language') as Language` โดยไม่มี validation หรือ browser detection
- ไม่มี distinction ระหว่าง detected language กับ manual override
- มี hardcoded Thai UI strings จำนวนมาก ประมาณ 3,429 บรรทัดใน `src/pages`, `src/components`, `src/lib`, `src/context`
- status/duty/error labels ซ้ำหลายจุด เช่น event status, attendance status, identity status, assignment method, people update request status
- dark mode จะพังถ้าใช้ invert สี เพราะ QR, scanner surfaces, document previews, glass cards, and status badges ต้องมี token เฉพาะ

Recommended order:
1. Phase 2: เพิ่ม safe language detection และ validated persistence โดยไม่ migrate strings จำนวนมาก
2. Phase 3: เพิ่ม theme foundation สำหรับ `system | light | dark` และ semantic tokens
3. Phase 4: ค่อย ๆ consolidate translations และ polish dark surfaces ทีละ component/page

## Current Language Architecture

Files involved:
- `src/main.tsx`: wraps app with `LanguageProvider`, `EventProvider`, `HashRouter`
- `src/context/LanguageContext.tsx`: exposes `language`, `setLanguage`, and `t`
- `src/lib/i18n.ts`: defines `Language = 'th' | 'en'` and a small shared `copy`
- `src/lib/copy.ts`: another shared copy object used by imports/exports/grouping/admin actions
- `src/components/Layout.tsx`: desktop `EN/TH` toggle and mobile language buttons
- `src/lib/guideContent.ts` and `src/lib/guideRegistry.ts`: structured Thai/English guide content
- Many pages call `useLanguage()` and choose strings inline

Storage:
- Current key: `language`
- Default: `th`
- No browser/device language detection yet
- No validation for unsupported localStorage values
- No manual override metadata

Toggle behavior:
- Desktop nav button toggles `EN/TH`
- Mobile More menu has `Switch to English` / `เปลี่ยนเป็นภาษาไทย`
- `setLanguage(next)` writes directly to localStorage and updates React state

Gaps:
- `src/lib/i18n.ts` is too small to be the app-wide translation source
- `src/lib/copy.ts` overlaps with `src/lib/i18n.ts`
- Status labels are duplicated across pages instead of centralized
- Some user-facing technical words remain: `RPC`, `token`, `JSON`, `Supabase`, `RLS`, `Storage`, `placeholder`, `template`
- Some admin technical words are acceptable in admin diagnostics, but should not leak into public/staff flows

Phase 1 decision:
- No new `src/lib/translations.ts` skeleton was created because `src/lib/i18n.ts` already exists. Phase 2 should extend the existing file instead of introducing a second i18n system.

## Hardcoded String Audit

### Public Pages

Files:
- `src/pages/PublicListPage.tsx`
- `src/pages/PortalPage.tsx`
- `src/pages/AnnouncementsPage.tsx`
- `src/pages/AnnouncementDetailPage.tsx`

Findings:
- Public list uses shared `t` for some labels, but most copy is inline
- Privacy and edit CTA copy are now friendlier, but still not centralized
- Announcements and portal pages use inline bilingual strings

Recommendation:
- Move navigation/public chrome copy first; keep database content as stored

### Event Pages

Files:
- `src/pages/EventsPage.tsx`
- `src/pages/EventDetailPage.tsx`
- `src/pages/EventRegisterPage.tsx`
- `src/pages/EventProfileCheckPage.tsx`
- `src/lib/eventContent.ts`

Findings:
- Event content is structured Thai-first with some English fields
- Event status labels repeat in public and admin event pages
- Event names/descriptions are content, not UI chrome, and should not be auto-translated

Recommendation:
- Add shared event label helper before migrating page strings

### Staff Application and Profile Check

Files:
- `src/pages/EventStaffApplyPage.tsx`
- `src/pages/EventStaffApplicationStatusPage.tsx`
- `src/pages/EventProfileCheckPage.tsx`
- `src/lib/parentOrientationDuties.ts`
- `src/lib/applicationStatus.ts`

Findings:
- Flow copy is Thai-first and detailed, but mostly inline
- Identity status label exists in multiple places
- Assignment method label exists in multiple places
- Duty labels are reasonably centralized in `parentOrientationDuties.ts`
- Some terms such as `Central People Database` and `token` should be reviewed for non-technical users

Recommendation:
- Centralize identity status, assignment method, and duplicate submission labels

### Admin Event Applications

Files:
- `src/pages/AdminEventApplicationsPage.tsx`
- `src/lib/applicationStatus.ts`
- `src/lib/parentOrientationDuties.ts`

Findings:
- Admin review has many local helper labels
- Export/privacy copy is better, but export scope labels and identity/assignment labels should be shared
- Schema/migration diagnostic copy should remain admin-only

Recommendation:
- Create shared admin application labels before doing broader translation cleanup

### Admin People Pages

Files:
- `src/pages/AdminPeoplePage.tsx`
- `src/pages/AdminPeopleUpdateRequestsPage.tsx`
- `src/pages/AdminPeopleDedupePage.tsx`
- `src/pages/Year2PeopleImportPage.tsx`

Findings:
- Page labels now prefer `ฐานข้อมูลบุคคล / People Database`
- Import pages still include technical words: staging table, RPC, Supabase Table Editor, people
- These are admin-only, but should eventually be separated into technical helper text

### Staff Pages

Files:
- `src/pages/StaffDashboardPage.tsx`
- `src/pages/StaffMobilePage.tsx`
- `src/pages/StaffDirectoryPage.tsx`
- `src/pages/StaffProfilePage.tsx`
- `src/pages/StaffProfileEditPage.tsx`
- `src/pages/StaffProfileVerifyPage.tsx`
- `src/pages/StaffPersonalQrPage.tsx`

Findings:
- Staff mobile page is polished for live operations
- Staff personal QR pages still expose the word `token` in user-facing copy
- Directory/filter labels are inline

Recommendation:
- In future copy pass, replace visible `token` with `รหัส QR` / `QR code` while preserving payload/security logic

### Attendance

Files:
- `src/pages/StaffAttendancePage.tsx`
- `src/pages/StaffAttendanceScanPage.tsx`
- `src/pages/AdminStaffAttendancePage.tsx`
- `src/pages/AdminStaffAttendanceSessionPage.tsx`
- `src/components/attendance/*`
- `src/lib/attendanceEventContext.ts`

Findings:
- Attendance status labels are duplicated in staff/admin/scanner components
- QR/token fallback copy appears in several places
- Friendly error helpers exist, but some technical fallback strings remain

Recommendation:
- Add shared `attendanceLabels.ts` before migrating copy

### Documents

Files:
- `src/pages/DocumentCenterPage.tsx`
- `src/pages/DocumentGeneratePage.tsx`
- `src/pages/DocumentTemplatesPage.tsx`
- `src/pages/DocumentSettingsPage.tsx`
- `src/pages/DocumentHistoryPage.tsx`
- `src/lib/documentGeneration.ts`
- `src/lib/documentEventContext.ts`

Findings:
- Document Center terms have been made more Thai-first
- Admin document workflows still need some technical terms such as DOCX and Storage
- `placeholder/template` should stay out of primary CTAs where possible

### Guide/Help

Files:
- `src/lib/guideContent.ts`
- `src/lib/guideRegistry.ts`
- `src/pages/GuideCenterPage.tsx`
- `src/pages/GuideCategoryPage.tsx`
- `src/pages/GuideTopicPage.tsx`
- `src/components/help/*`

Findings:
- Guide content already has structured Thai/English fields
- Search synonyms are centralized
- Guide content should remain separate from app UI chrome translations

### Shared Components

Files:
- `src/components/ui/*`
- `src/components/mobile/*`
- `src/components/Layout.tsx`

Findings:
- Some shared components have language-aware defaults, e.g. `Select`, `Modal`, `ConfirmDialog`
- `MobileFilterSheet` defaults to English `Apply/Clear` if caller omits labels
- `Layout` has many inline navigation labels and should be one of the first modules migrated to shared nav copy

## Theme Readiness Audit

### Body and Page Shell

Files:
- `src/styles/tokens.css`
- `src/styles/base.css`
- `src/styles/layout.css`
- `src/styles/mobile.css`

Findings:
- Light-only `:root`
- Body uses fixed light gradients: `#ffffff`, `#eef5ff`, `var(--bg)`
- No `data-theme`, `.theme-dark`, or `prefers-color-scheme` branch yet

Dark mode risk:
- Body and shell stay bright unless tokens and gradients are split by theme

### Cards

Findings:
- Many cards use `rgba(255, 255, 255, ...)`
- Token aliases exist, but not all surfaces use them

Risk:
- White cards on dark background
- Borders/shadows tuned for light mode may disappear or feel muddy

### Buttons

Findings:
- Buttons use `--accent`, but also fixed gradients and hardcoded status colors
- Secondary/ghost buttons often use translucent light backgrounds

Risk:
- Low contrast in dark mode unless secondary/ghost/status tokens are added

### Inputs and Selects

Findings:
- Inputs use light glass backgrounds and fixed border alphas
- Focus ring token exists

Risk:
- Placeholder/muted text and native select backgrounds need dark-compatible tokens

### Tables and Mobile Cards

Findings:
- Responsive table foundation is good
- Row separators, mobile cards, and table surfaces rely on light glass colors

Risk:
- Table boundaries and detail accordions may lose contrast in dark mode

### Modals and Drawers

Findings:
- Mobile sheets and body scroll locking are improved
- Overlays and sheet surfaces are fixed light values

Risk:
- Dark mode needs `--backdrop`, `--surface-elevated`, and dark sheet borders

### Toasts

Findings:
- Toasts and alert surfaces use success/warning/danger light surfaces

Risk:
- Status surfaces will look too bright unless dark variants are added

### Nav and Bottom Nav

Findings:
- Top nav, bottom nav, account menu, and mobile More menu use translucent white surfaces

Risk:
- Floating nav may feel detached on dark backgrounds

### Status Badges

Findings:
- Status colors are scattered across `components.css`, `layout.css`, `mobile.css`, and page CSS
- Some badge text colors are hardcoded, e.g. red/green/orange hex values

Recommendation:
- Add semantic status tokens before enabling dark mode:
  - `--status-success-text`
  - `--status-success-bg`
  - `--status-warning-text`
  - `--status-warning-bg`
  - `--status-danger-text`
  - `--status-danger-bg`
  - `--status-info-text`
  - `--status-info-bg`

### QR and Scanner Surfaces

Findings:
- QR/scanner UI is light-oriented

Risk:
- QR codes must not be inverted
- QR inner surface should stay white in dark mode for scanning reliability
- Camera overlay controls need independent contrast testing

## Recommended Phase Plan

### Phase 2: Language Detection

- Extend existing `src/lib/i18n.ts`
- Add `SUPPORTED_LANGUAGES`, `isSupportedLanguage`, `normalizeLanguage`, and browser detection
- Update `LanguageContext` to read a validated `tfbp_language` preference, fall back to legacy `language`, then browser language, then Thai
- Keep manual toggle behavior
- Do not migrate many strings yet

### Phase 3: Theme Foundation

- Add `ThemeContext`
- Support `system | light | dark`
- Store preference only, e.g. `tfbp_theme`
- Set `data-theme` on `document.documentElement`
- Add light/dark semantic tokens
- Keep QR code inner surfaces white
- Do not broad-enable dark mode until key surfaces are tested

### Phase 4: Translation and Dark Polish

- Consolidate navigation/shared labels first
- Move status/duty/attendance labels into shared helpers
- Replace hardcoded light colors with semantic tokens by component group
- Test public, staff, admin, documents, attendance, emergency pages across mobile/desktop

## Risky Areas to Avoid

- Do not mass rewrite CSS in one pass
- Do not translate database content automatically
- Do not store personal data in language/theme localStorage
- Do not use dark mode by inverting colors only
- Do not invert QR, scanner, generated previews, images, or logos
- Do not change Supabase behavior, RLS, RPCs, or business logic during theme/localization foundation work
- Do not show technical words like `RPC`, `token`, `JSON`, `database error`, or `function does not exist` to normal users
