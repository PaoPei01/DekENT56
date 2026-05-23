# UI Layout Regression Fix

## What Was Broken

Admin event pages such as `/admin/events`, `/admin/events/:eventId`, and `/admin/events/:eventId/applications` could squeeze long Thai page titles into very narrow columns. Because headings allowed emergency wrapping, Thai text could wrap one character per line, making titles such as `จัดการกิจกรรม` unreadable.

## Root Cause Found

- `.page-header h1` inherited `overflow-wrap: anywhere`, which is useful for URLs but unsafe for Thai headings.
- `PageHeader` used a two-column grid with title and meta/actions side by side. Long `EventSwitcher` content could occupy the right column and leave the title column too narrow.
- `EventSwitcher` had compact width rules that could still pressure surrounding layout when placed in the header meta area.
- Some shell/table rules did not explicitly protect min-width behavior for flex/grid children.

## Files Changed

- `src/components/ui/PageHeader.tsx`
- `src/styles.css`
- `docs/UI_LAYOUT_REGRESSION_FIX.md`
- `docs/MANUAL_QA_CHECKLIST.md`
- `docs/UI_UX_GUIDELINES.md`

## Global CSS Rules Changed

- `html` and `body` now use `width: 100%`, `min-width: 0`, and hidden horizontal overflow.
- Headings no longer use aggressive wrapping. `h1` through `h6`, `.page-title`, `.hero-title`, and `.admin-title` use normal word breaking.
- Added `.break-safe` for long technical strings, URLs, emails, and IDs that truly need aggressive wrapping.
- `.page-shell` and shared container classes use stable full-width constraints.
- `.page-header` defaults to a single safe column, and only uses a two-column layout above 900px with `minmax(0, 1fr)` for the title.
- `.page-header-title`, `.page-header-meta`, and `.page-header-actions` explicitly allow shrink-safe layout without squeezing headings.
- `EventSwitcher` has predictable width/max-width rules and truncates long event names inside itself instead of forcing page titles to collapse.
- Table wrappers use full width and horizontal scrolling rather than squeezing columns into unreadable Thai text.

## Pages Checked

- `/admin/events`
- `/admin/events/:eventId`
- `/admin/events/:eventId/applications`
- `/events`
- `/events/parent-orientation-staff-2569`

The in-app browser session was not authenticated as admin, so guarded admin pages redirected to the public shell during automated smoke testing. Build/lint and source-level CSS checks verified the root header/wrapping rules. A logged-in admin browser should still be used for final visual QA.

## Before / After Expected Behavior

Before:

- Thai headings could wrap per character.
- EventSwitcher or action buttons could squeeze the header title.
- Header actions and select controls could feel cramped on tablet/mobile.

After:

- Thai headings wrap by phrase/line normally, not per character.
- PageHeader title keeps a usable column and actions wrap below when space is limited.
- EventSwitcher stays inside a bounded control area.
- Tables scroll in their wrapper on narrow layouts instead of crushing columns.

## Future Guidelines

- Do not use `word-break: break-all` globally.
- Do not use `overflow-wrap: anywhere` on headings, buttons, labels, or ordinary Thai paragraphs.
- Use `.break-safe` only for long URLs, emails, IDs, paths, or technical strings.
- Do not put long Thai `h1` text in a `min-content` grid column.
- Add `min-width: 0` to flex/grid children that contain long text.
- Keep EventSwitcher out of the same narrow inline row as a large page title on small and medium screens.
- Admin pages should avoid huge decorative hero areas and prioritize readable, practical layout.
