import { getMajorCode } from '../lib/major';
import { supabase } from '../lib/supabase';
import type { MainGroup, StaffManagementRow, StaffProfile, StaffRole, Subgroup } from '../lib/types';
import type { StaffImportRow } from '../utils/staffImport';

export type StaffFilters = {
  search?: string;
  position?: string;
  mainGroup?: string;
  subgroup?: string;
  major?: string;
};

export type StaffUpdatePayload = {
  profile: Partial<StaffProfile>;
  medical: {
    disease?: string | null;
    drug_allergy?: string | null;
    food_allergy?: string | null;
    medical_note?: string | null;
  };
  assignment: {
    role?: StaffRole | null;
    main_group?: MainGroup | null;
    subgroup?: Subgroup | null;
  };
};

export async function fetchAdminStaffProfiles(filters: StaffFilters = {}): Promise<StaffManagementRow[]> {
  const { data, error } = await supabase.rpc('get_admin_staff_profiles');
  if (error) throw error;
  const rows = (data ?? []) as StaffManagementRow[];
  const term = filters.search?.trim().toLowerCase();
  return rows.filter((row) => {
    if (term) {
      const haystack = [
        row.name_th,
        row.name_en,
        row.nickname,
        row.student_id,
        row.phone,
        row.email,
        row.major,
        row.position,
        row.assignment?.main_group,
        row.assignment?.subgroup,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (filters.position && row.position !== filters.position) return false;
    if (filters.mainGroup && row.assignment?.main_group !== filters.mainGroup) return false;
    if (filters.subgroup && row.assignment?.subgroup !== filters.subgroup) return false;
    if (filters.major && getMajorCode(row.major) !== filters.major) return false;
    return true;
  });
}

export async function updateStaffProfile(id: string, payload: StaffUpdatePayload) {
  const clean = (object: Record<string, unknown>) => Object.fromEntries(Object.entries(object).map(([key, value]) => [key, value === '' ? null : value]));
  const { error } = await supabase.rpc('update_staff_profile_admin', {
    input_staff_profile_id: id,
    input_profile: clean(payload.profile as Record<string, unknown>),
    input_medical: clean(payload.medical),
    input_assignment: clean(payload.assignment),
  });
  if (error) throw error;
}

export async function deleteStaffProfile(id: string) {
  const { error } = await supabase.rpc('delete_staff_profile_admin', { input_staff_profile_id: id });
  if (error) throw error;
}

export async function importStaffRecords(rows: StaffImportRow[]) {
  const payload = rows.map((row) => ({
    profile: row.profile,
    medical: row.medical,
    assignment: row.assignment,
  }));
  const { data, error } = await supabase.rpc('import_staff_records_admin', { input_rows: payload });
  if (error) throw error;
  return data as { imported: number };
}
