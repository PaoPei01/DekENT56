import { supabase } from '../lib/supabase';
import type { StaffAccessContext, StaffAttendance, StaffAttendanceContext, StaffGroupContext, StaffRole } from '../lib/types';

export async function fetchStaffAccessContext(): Promise<StaffAccessContext> {
  const { data, error } = await supabase.rpc('get_staff_access_context');
  if (error) throw error;
  return data as StaffAccessContext;
}

export async function fetchStaffGroupContext(): Promise<StaffGroupContext | null> {
  const { data, error } = await supabase.rpc('get_staff_group_context');
  if (error) throw error;
  return data as StaffGroupContext | null;
}

export async function fetchStaffAttendanceContext(eventDate: string): Promise<StaffAttendanceContext> {
  const { data, error } = await supabase.rpc('get_staff_attendance_context', { input_event_date: eventDate });
  if (error) throw error;
  return data as StaffAttendanceContext;
}

export async function markStaffAttendance(profileId: string, status: StaffAttendance['status'], note: string, eventDate: string) {
  const { error } = await supabase.rpc('mark_staff_attendance', {
    input_profile_id: profileId,
    input_status: status,
    input_note: note,
    input_event_date: eventDate,
  });
  if (error) throw error;
}

export function hasStaffRole(access: StaffAccessContext | null | undefined, roles: StaffRole[]) {
  if (!access) return false;
  if (access.is_admin) return true;
  return access.roles?.some((role) => roles.includes(role)) ?? false;
}
