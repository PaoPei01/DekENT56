import { supabase } from '../lib/supabase';
import type { DocumentBudgetItem, DocumentCenterData, DocumentEquipmentItem, DocumentProjectProfile, DocumentScheduleItem, DocumentTemplate, DocumentType, DocumentVenue, GeneratedDocument } from '../lib/documentTypes';

const templateBucket = 'document-templates';
const outputBucket = 'document-outputs';

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function fetchDocumentCenterData(): Promise<DocumentCenterData> {
  const [profileRes, templatesRes, historyRes] = await Promise.all([
    supabase.from('document_project_profiles').select('*').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('document_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('generated_documents').select('*').order('generated_at', { ascending: false }).order('created_at', { ascending: false }).limit(80),
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

function withoutIds<T extends { id?: string; project_profile_id?: string }>(items: Array<Partial<T>>, profileId: string) {
  return items.map(({ id: _id, ...item }) => ({ ...item, project_profile_id: profileId }));
}

export async function saveProjectProfile(input: {
  profile: Partial<DocumentProjectProfile>;
  budgetItems: Array<Partial<DocumentBudgetItem>>;
  scheduleItems: Array<Partial<DocumentScheduleItem>>;
  venues: Array<Partial<DocumentVenue>>;
  equipmentItems: Array<Partial<DocumentEquipmentItem>>;
}) {
  const userId = await currentUserId();
  const calculatedBudgetTotal = input.budgetItems.reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unit_price ?? 0), 0);
  const calculatedParticipants = Number(input.profile.freshmen_count ?? 0) + Number(input.profile.staff_count ?? 0);
  const profilePayload = {
    ...input.profile,
    budget_total: calculatedBudgetTotal,
    total_participants: input.profile.total_participants ?? (calculatedParticipants > 0 ? calculatedParticipants : null),
    updated_by: userId,
  };
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

  const budgetRows = withoutIds<DocumentBudgetItem>(input.budgetItems.filter((item) => item.item_name).map(({ amount: _amount, ...item }) => item), profileId);
  const scheduleRows = withoutIds<DocumentScheduleItem>(input.scheduleItems.filter((item) => item.title).map((item, index) => ({ ...item, sort_order: item.sort_order ?? index + 1 })), profileId);
  const venueRows = withoutIds<DocumentVenue>(input.venues.filter((item) => item.name), profileId);
  const equipmentRows = withoutIds<DocumentEquipmentItem>(input.equipmentItems.filter((item) => item.name), profileId);

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

export async function uploadDocumentTemplate(input: {
  name: string;
  description: string | null;
  document_type: DocumentType;
  file: File;
  placeholders: string[];
  is_active: boolean;
}) {
  const userId = await currentUserId();
  const safeName = input.file.name.replace(/[^\wก-๙.-]+/g, '-');
  const storagePath = `${userId ?? 'admin'}/${Date.now()}-${safeName}`;
  const upload = await supabase.storage.from(templateBucket).upload(storagePath, input.file, {
    contentType: input.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: false,
  });
  if (upload.error) throw upload.error;
  const { data, error } = await supabase.from('document_templates').insert({
    name: input.name,
    document_type: input.document_type,
    description: input.description,
    file_name: input.file.name,
    mime_type: input.file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    storage_path: storagePath,
    placeholders: input.placeholders,
    is_active: input.is_active,
    created_by: userId,
  }).select('*').single();
  if (error) throw error;
  return data as DocumentTemplate;
}

export async function deleteDocumentTemplate(template: DocumentTemplate) {
  if (template.storage_path) await supabase.storage.from(templateBucket).remove([template.storage_path]);
  const { error } = await supabase.from('document_templates').delete().eq('id', template.id);
  if (error) throw error;
}

export async function downloadTemplateBuffer(template: DocumentTemplate) {
  if (template.storage_path) {
    const { data, error } = await supabase.storage.from(templateBucket).download(template.storage_path);
    if (error) throw error;
    return data.arrayBuffer();
  }
  if (template.template_content) {
    const binary = window.atob(template.template_content);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return bytes.buffer;
  }
  throw new Error('ไม่พบไฟล์ template ใน Storage');
}

export async function nextDocumentVersion(templateId: string, documentType: DocumentType) {
  const { data, error } = await supabase.from('generated_documents').select('version').eq('template_id', templateId).eq('document_type', documentType).order('version', { ascending: false }).limit(1);
  if (error) throw error;
  return Number(data?.[0]?.version ?? 0) + 1;
}

export async function uploadGeneratedDocx(fileName: string, blob: Blob) {
  const userId = await currentUserId();
  const storagePath = `${userId ?? 'admin'}/${new Date().toISOString().slice(0, 10)}/${fileName}`;
  const { error } = await supabase.storage.from(outputBucket).upload(storagePath, blob, {
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    upsert: true,
  });
  if (error) throw error;
  return storagePath;
}

export async function recordGeneratedDocument(input: {
  project_profile_id: string | null;
  template_id: string | null;
  file_name: string;
  title: string;
  document_type: DocumentType;
  version: number;
  status: string;
  output_docx_path: string;
  placeholders: Record<string, unknown>;
  snapshot_data: Record<string, unknown>;
  missing_fields: string[];
  preview_html: string;
}) {
  const userId = await currentUserId();
  const { data, error } = await supabase.from('generated_documents').insert({ ...input, generated_by: userId, generated_at: new Date().toISOString() }).select('*').single();
  if (error) throw error;
  return data as GeneratedDocument;
}

export async function downloadGeneratedDocument(row: GeneratedDocument) {
  if (!row.output_docx_path) throw new Error('เอกสารนี้ยังไม่มีไฟล์ DOCX ใน Storage');
  const { data, error } = await supabase.storage.from(outputBucket).download(row.output_docx_path);
  if (error) throw error;
  return data;
}
