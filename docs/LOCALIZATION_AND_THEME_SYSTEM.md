# Localization and Theme System

Date: 2026-05-24

This document covers the language foundation, theme preference foundation, and Phase 4 polish notes.

## Language Foundation

The app uses the existing `LanguageProvider` in `src/context/LanguageContext.tsx`.

Language utilities live in `src/lib/i18n.ts`.

The translation dictionary foundation lives in `src/lib/translations.ts`.

### Supported Languages

- `th` Thai
- `en` English

Thai remains the primary product language. English copy should be concise and natural, but it does not need to replace event-specific or database-owned content.

### Storage

Manual language preference is stored in:

```text
tfbp_language
```

The provider also reads the legacy `language` key for backward compatibility, but new writes use `tfbp_language`.

Only the language preference value is stored. Do not store names, emails, phone numbers, student IDs, health data, QR payloads, or any other personal data as localization preferences.

### Detection Rules

On app start:

1. Use a valid stored manual preference from `tfbp_language`.
2. Fall back to a valid legacy value from `language`.
3. If no manual preference exists, inspect `navigator.languages` and `navigator.language`.
4. If any browser language starts with `th`, use Thai.
5. Otherwise use English.

Auto-detected language is not stored. Storage happens only when the user manually changes language.

### Context API

`useLanguage()` provides:

- `language`
- `setLanguage(language)`
- `toggleLanguage()`
- `isThai`
- `t(key, params?)`

For backward compatibility, `t` also exposes the legacy shared copy properties such as `t.participants`.

### Translation Keys

Use dot-path keys from `src/lib/translations.ts`, for example:

```tsx
const { t } = useLanguage();

return <button>{t('common.save')}</button>;
```

The current namespaces are:

- `common`
- `navigation`
- `identity`
- `staffApplication`
- `statuses`
- `assignmentMethods`
- `events`
- `announcements`
- `theme`

Missing translations fall back to Thai, then to the key string.

### What Not To Translate Automatically

Do not automatically translate:

- Database event names or descriptions.
- Announcements written by admins.
- User-submitted text.
- Names, nicknames, majors, duty data imported from source files, or document content.
- Supabase data values unless the app already has an explicit localized field or label helper.

### Adding Keys Safely

- Add Thai and English values together.
- Keep Thai natural and clear.
- Keep English short and operational.
- Prefer shared label helpers for repeated statuses and actions.
- Avoid moving large page-specific paragraphs into global translations too early.

## Theme

The app uses `ThemeProvider` in `src/context/ThemeContext.tsx`.

Theme utilities live in `src/lib/theme.ts`.

The compact UI control lives in `src/components/ThemeSwitcher.tsx`.

### Preferences

Supported preferences:

- `system`
- `light`
- `dark`

Default preference is `system`.

Manual theme preference is stored in:

```text
tfbp_theme
```

Only the theme preference value is stored. Do not store any user, event, QR, or health data as a theme preference.

### Effective Theme

The effective theme is:

- `light` when preference is `light`.
- `dark` when preference is `dark`.
- The OS/browser result from `matchMedia('(prefers-color-scheme: dark)')` when preference is `system`.
- `light` if `matchMedia` is unavailable.

When preference is `system`, the provider listens for OS theme changes and updates the app without requiring a reload.

### Document Attributes

The provider writes these attributes to the document root:

```text
data-theme="light|dark"
data-theme-preference="system|light|dark"
```

The early initializer in `index.html` applies these attributes before React renders to reduce a bright first-paint flash for dark users.

### CSS Variables

Core theme tokens are in `src/styles/tokens.css`.

Use semantic variables instead of hardcoded light colors:

- `--bg`
- `--surface`
- `--surface-soft`
- `--surface-muted`
- `--text`
- `--text-muted`
- `--text-subtle`
- `--border`
- `--border-strong`
- `--primary`
- `--primary-contrast`
- `--primary-soft`
- `--success`
- `--success-soft`
- `--warning`
- `--warning-soft`
- `--danger`
- `--danger-soft`
- `--shadow-soft`

Compatibility aliases such as `--accent`, `--accent-strong`, `--panel`, `--panel-strong`, `--text-soft`, and `--line` remain available for existing CSS.

### Theme-Safe Components

For new or edited components:

- Use `var(--surface)` or `var(--panel)` for card/sheet backgrounds.
- Use `var(--text)` for primary text and `var(--text-muted)` or `var(--text-soft)` for secondary text.
- Use `var(--border)` for borders.
- Use `var(--primary)` and `var(--primary-soft)` for selected/active states.
- Use status tokens for success/warning/danger surfaces.
- Keep QR codes explicitly black on white; do not inherit dark backgrounds inside QR canvases.
- Do not use color inversion as a dark-mode strategy.

### Known TODOs

- Phase 4 moved high-impact public event, profile-check, application-status, and announcement labels into the dictionary; admin/staff pages still have remaining page-specific hardcoded strings.
- Some rare page-specific classes still contain hardcoded light colors.
- Document previews, QR canvases, and imported content need route-specific visual QA before final polish.
- Status colors should be consolidated further into a single status-token layer.
- The current theme pass prioritizes readable shared surfaces over final visual refinement.

### Phase 4 QA Notes

Manual QA should still cover Thai and English with system light, system dark, manual light, and manual dark. Prioritize these routes:

- `/events`
- `/events/parent-orientation-staff-2569`
- `/events/parent-orientation-staff-2569/staff/apply`
- `/events/parent-orientation-staff-2569/profile-check`
- `/events/parent-orientation-staff-2569/staff/application-status`
- `/announcements`
- `/guide`
- `/admin/events`
- `/admin/events/:eventId/applications`
- `/admin/people`
- `/admin/system-readiness`
- `/staff/attendance`
- `/admin/documents`

Remaining untranslated areas should be listed as page-specific TODOs instead of solved by a bulk replacement. Do not move database-owned event names, announcement body content, person names, uploaded file names, or admin notes into translations.
