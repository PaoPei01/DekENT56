import { supabase } from '../lib/supabase';
import type { EmergencyDashboardData } from '../lib/types';

export async function fetchEmergencyDashboard(): Promise<EmergencyDashboardData> {
  const { data, error } = await supabase.rpc('get_emergency_dashboard');
  if (error) throw error;
  return data as EmergencyDashboardData;
}

export async function saveEmergencyNote(profileId: string, note: string, needsSpecialCare: boolean) {
  const { error } = await supabase.rpc('save_emergency_note', {
    input_profile_id: profileId,
    input_note: note,
    input_needs_special_care: needsSpecialCare,
  });
  if (error) throw error;
}
