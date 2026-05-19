import { supabase } from '../lib/supabase';
import type { GroupAssignment, GroupProfile } from '../lib/types';

export async function fetchGroupProfiles(): Promise<GroupProfile[]> {
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('*').order('name_th');
  if (profileError) throw profileError;

  const { data: assignments, error: assignmentError } = await supabase.from('group_assignments').select('*');
  if (assignmentError) throw assignmentError;

  const byProfile = new Map(((assignments ?? []) as GroupAssignment[]).map((assignment) => [assignment.profile_id, assignment]));
  return ((profiles ?? []) as GroupProfile[]).map((profile) => ({
    ...profile,
    group_assignment: byProfile.get(profile.id) ?? null,
  }));
}

export async function fetchProfileGroup(profileId: string): Promise<GroupAssignment | null> {
  const { data, error } = await supabase.from('group_assignments').select('*').eq('profile_id', profileId).maybeSingle();
  if (error) throw error;
  return data as GroupAssignment | null;
}

export async function saveGroupAssignments(assignments: Pick<GroupAssignment, 'profile_id' | 'main_group' | 'subgroup' | 'notes'>[]) {
  const { error } = await supabase.rpc('save_group_assignments', { input_assignments: assignments });
  if (error) throw error;
}

export async function lockGroups() {
  const { error } = await supabase.rpc('lock_group_assignments');
  if (error) throw error;
}

export async function fetchFriendRecommendations(profileId: string): Promise<GroupProfile[]> {
  const assignment = await fetchProfileGroup(profileId);
  if (!assignment) return [];

  const { data, error } = await supabase
    .from('group_assignments')
    .select('*, profiles(*)')
    .eq('main_group', assignment.main_group)
    .eq('subgroup', assignment.subgroup)
    .neq('profile_id', profileId)
    .limit(30);

  if (error) throw error;

  return ((data ?? []) as GroupAssignment[])
    .map((row) => {
      const profile = row.profiles as GroupProfile | undefined;
      return profile ? { ...profile, group_assignment: row } : null;
    })
    .filter(Boolean) as GroupProfile[];
}

export async function fetchVerifiedGroupContext(email: string, phone: string): Promise<{ profile: GroupProfile; assignment: GroupAssignment | null } | null> {
  const { data, error } = await supabase.rpc('get_verified_group_context', { input_email: email.trim().toLowerCase(), input_phone: phone.trim() });
  if (error) throw error;
  return data as { profile: GroupProfile; assignment: GroupAssignment | null } | null;
}

export async function fetchVerifiedFriendRecommendations(email: string, phone: string): Promise<GroupProfile[]> {
  const { data, error } = await supabase.rpc('get_friend_recommendations', { input_email: email.trim().toLowerCase(), input_phone: phone.trim() });
  if (error) throw error;
  return (data ?? []) as GroupProfile[];
}
