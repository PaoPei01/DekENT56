alter table public.staff_attendance_records
  drop constraint if exists staff_attendance_records_method_check;

alter table public.staff_attendance_records
  add constraint staff_attendance_records_method_check
  check (method in ('session_qr', 'verified_qr', 'verified_camera_scan', 'manual', 'admin_scan_staff_qr', 'import', 'system'));
