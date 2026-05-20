import { supabase } from '../lib/supabase';
import type { DocumentBudgetItem, DocumentCenterData, DocumentEquipmentItem, DocumentProjectProfile, DocumentScheduleItem, DocumentTemplate, DocumentVenue, GeneratedDocument } from '../lib/documentTypes';

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchDocumentCenterData(): Promise<DocumentCenterData> {
  const [profileRes, templatesRes, historyRes] = await Promise.all([
    supabase.from('document_project_profiles').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('document_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('generated_documents').select('*').order('created_at', { ascending: false }).limit(50),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (templatesRes.error) throw templatesRes.error;
  if (historyRes.error) throw historyRes.error;
  const profile = profileRes.data as DocumentProjectProfile | null;
  const profileId = profile?.id;
  const [budgetRes, scheduleRes, venuesRes, equipmentRes] = profileId ? await Promise.all([
    supabase.from('document_budget_items').select('*').eq('project_profile_id', profileId).order('created_at'),
    supabase.from('document_schedule_items').select('*').eq('project_profile_id', profileId).order('sort_order').order('start_time'),
    supabase.from('document_venues').select('*').eq('project_profile_id', profileId).order('created_at'),
    supabase.from('document_equipment_items').select('*').eq('project_profile_id', profileId).order('created_at'),
  ]) : [{ data: [], error: null }, { data: [], error: null }, { data: [], error: null }, { data: [], error: null }];
  if (budgetRes.error) throw budgetRes.error;
  if (scheduleRes.error) throw scheduleRes.error;
  if (venuesRes.error) throw venuesRes.error;
  if (equipmentRes.error) throw equipmentRes.error;
  return {
    profile,
    templates: (templatesRes.data ?? []) as DocumentTemplate[],
    budgetItems: (budgetRes.data ?? []) as DocumentBudgetItem[],
    scheduleItems: (scheduleRes.data ?? []) as DocumentScheduleItem[],
    venues: (venuesRes.data ?? []) as DocumentVenue[],
    equipmentItems: (equipmentRes.data ?? []) as DocumentEquipmentItem[],
    history: (historyRes.data ?? []) as GeneratedDocument[],
  };
}

export async function saveProjectProfile(input: {
  profile: Partial<DocumentProjectProfile>;
  budgetItems: Array<Partial<DocumentBudgetItem>>;
  scheduleItems: Array<Partial<DocumentScheduleItem>>;
  venues: Array<Partial<DocumentVenue>>;
  equipmentItems: Array<Partial<DocumentEquipmentItem>>;
}) {
  const userId = await currentUserId();
  const profilePayload = { ...input.profile, updated_by: userId };
  const { data: profile, error } = input.profile.id
    ? await supabase.from('document_project_profiles').update(profilePayload).eq('id', input.profile.id).select('*').single()
    : await supabase.from('document_project_profiles').insert({ ...profilePayload, created_by: userId }).select('*').single();
  if (error) throw error;
  const profileId = (profile as DocumentProjectProfile).id;

  await Promise.all([
    supabase.from('document_budget_items').delete().eq('project_profile_id', profileId),
    supabase.from('document_schedule_items').delete().eq('project_profile_id', profileId),
    supabase.from('document_venues').delete().eq('project_profile_id', profileId),
    supabase.from('document_equipment_items').delete().eq('project_profile_id', profileId),
  ]);

  const budgetRows = input.budgetItems.filter((item) => item.item_name).map((item) => ({ ...item, id: undefined, project_profile_id: profileId }));
  const scheduleRows = input.scheduleItems.filter((item) => item.title).map((item, index) => ({ ...item, id: undefined, project_profile_id: profileId, sort_order: index + 1 }));
  const venueRows = input.venues.filter((item) => item.name).map((item) => ({ ...item, id: undefined, project_profile_id: profileId }));
  const equipmentRows = input.equipmentItems.filter((item) => item.name).map((item) => ({ ...item, id: undefined, project_profile_id: profileId }));

  const inserts = [
    budgetRows.length ? supabase.from('document_budget_items').insert(budgetRows) : null,
    scheduleRows.length ? supabase.from('document_schedule_items').insert(scheduleRows) : null,
    venueRows.length ? supabase.from('document_venues').insert(venueRows) : null,
    equipmentRows.length ? supabase.from('document_equipment_items').insert(equipmentRows) : null,
  ].filter(Boolean);
  const results = await Promise.all(inserts);
  const insertError = results.find((result) => result?.error)?.error;
  if (insertError) throw insertError;
  return profile as DocumentProjectProfile;
}

export async function uploadDocumentTemplate(input: Pick<DocumentTemplate, 'name' | 'description' | 'file_name' | 'mime_type' | 'template_content' | 'placeholders'>) {
  const userId = await currentUserId();
  const { data, error } = await supabase.from('document_templates').insert({ ...input, created_by: userId }).select('*').single();
  if (error) throw error;
  return data as DocumentTemplate;
}

export async function deleteDocumentTemplate(id: string) {
  const { error } = await supabase.from('document_templates').delete().eq('id', id);
  if (error) throw error;
}

export async function recordGeneratedDocument(input: {
  project_profile_id: string | null;
  template_id: string | null;
  file_name: string;
  placeholders: Record<string, unknown>;
  missing_fields: string[];
  preview_html: string;
}) {
  const userId = await currentUserId();
  const { data, error } = await supabase.from('generated_documents').insert({ ...input, generated_by: userId }).select('*').single();
  if (error) throw error;
  return data as GeneratedDocument;
}
