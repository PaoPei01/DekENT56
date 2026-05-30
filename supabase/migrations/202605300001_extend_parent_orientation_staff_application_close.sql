update public.event_forms ef
set closes_at = '2026-05-31 23:59:59+07'::timestamptz,
    updated_at = now()
from public.events e
where ef.event_id = e.id
  and e.slug = 'parent-orientation-staff-2569'
  and ef.form_type = 'staff_application';
