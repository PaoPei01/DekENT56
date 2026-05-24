# Document Center Guided Workflow

Status: Phase 5 frontend UX pass. No Supabase schema, RPC, Storage bucket, or RLS changes.

## Purpose

The Document Center should guide admins through the document-generation workflow instead of asking them to choose between settings, templates, generate, and history without context.

## Guided Flow

1. Fill project information.
2. Choose or upload a DOCX template.
3. Check missing information.
4. Generate and download the document.
5. View document history.

The overview page now shows readiness status for project information, templates, generated documents, and generation readiness.

## Privacy

Document Center remains admin-only. Generated documents and uploaded templates are not public-facing, and this phase does not change Storage behavior or permissions.

## Manual QA

- Open `/admin/documents` as an admin and confirm the workflow steps are visible.
- Confirm incomplete project information shows the warning card and links to `/admin/documents/settings`.
- Open `/admin/documents/templates` and upload a valid `.docx` template.
- Confirm placeholder detection still works.
- Open `/admin/documents/generate`, choose a template, preview, and generate/download DOCX.
- Confirm missing information links to project settings without changing existing generation rules.
- Open `/admin/documents/history` and confirm download still works.
- Confirm unauthenticated and non-admin users do not gain access to Document Center pages.
