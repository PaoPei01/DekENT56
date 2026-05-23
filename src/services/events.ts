import { DEFAULT_EVENT_SLUG } from '../lib/defaultEvent';
import { cleanEmail, cleanPhone } from '../lib/cleaners';
import { supabase } from '../lib/supabase';
import type { EventForm, EventFormType, EventRecord, EventSubmissionResult } from '../lib/eventTypes';

const eventFields = 'id,name_th,name_en,slug,description,event_type,academic_year,start_date,end_date,location,status,visibility,cover_image_path,metadata,created_at,updated_at';

function orderEvents<T extends { start_date: string | null; created_at: string | null }>(rows: T[]) {
  return [...rows].sort((a, b) => {
    const aTime = new Date(a.start_date ?? a.created_at ?? 0).getTime();
    const bTime = new Date(b.start_date ?? b.created_at ?? 0).getTime();
    return bTime - aTime;
  });
}

export async function fetchPublicEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select(eventFields)
    .eq('visibility', 'public')
    .order('start_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return orderEvents((data ?? []) as EventRecord[]);
}

export async function fetchEvents(): Promise<EventRecord[]> {
  return fetchPublicEvents();
}

export async function fetchEventBySlug(slug: string): Promise<EventRecord | null> {
  const { data, error } = await supabase
    .from('events')
    .select(eventFields)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data as EventRecord | null;
}

export async function fetchDefaultEvent(): Promise<EventRecord | null> {
  return fetchEventBySlug(DEFAULT_EVENT_SLUG);
}

export async function fetchAdminEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select(eventFields)
    .order('start_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return orderEvents((data ?? []) as EventRecord[]);
}

export async function fetchAdminEventById(id: string): Promise<EventRecord | null> {
  const { data, error } = await supabase
    .from('events')
    .select(eventFields)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as EventRecord | null;
}

export async function updateAdminEvent(id: string, input: Partial<EventRecord>): Promise<EventRecord> {
  const payload = {
    name_th: input.name_th,
    name_en: input.name_en,
    slug: input.slug,
    description: input.description,
    event_type: input.event_type,
    academic_year: input.academic_year,
    start_date: input.start_date,
    end_date: input.end_date,
    location: input.location,
    status: input.status,
    visibility: input.visibility,
    cover_image_path: input.cover_image_path,
    metadata: input.metadata,
  };
  const { data, error } = await supabase
    .from('events')
    .update(payload)
    .eq('id', id)
    .select(eventFields)
    .single();
  if (error) throw error;
  return data as EventRecord;
}

export async function fetchPublicEventForm(eventSlug: string, formType: EventFormType): Promise<EventForm | null> {
  const { data, error } = await supabase.rpc('get_public_event_form', {
    input_event_slug: eventSlug,
    input_form_type: formType,
  });
  if (error) throw error;
  return data as EventForm | null;
}

export async function submitEventParticipantRegistration(input: {
  eventSlug: string;
  email: string;
  phone: string;
  answers?: Record<string, unknown>;
}): Promise<EventSubmissionResult> {
  const { data, error } = await supabase.rpc('submit_event_participant_registration', {
    input_event_slug: input.eventSlug,
    input_email: cleanEmail(input.email),
    input_phone: cleanPhone(input.phone),
    input_answers: input.answers ?? {},
  });
  if (error) throw error;
  return data as EventSubmissionResult;
}

export async function submitEventStaffApplication(input: {
  eventSlug: string;
  email: string;
  phone: string;
  data?: Record<string, unknown>;
}): Promise<EventSubmissionResult> {
  const { data, error } = await supabase.rpc('submit_event_staff_application', {
    input_event_slug: input.eventSlug,
    input_email: cleanEmail(input.email),
    input_phone: cleanPhone(input.phone),
    input_data: input.data ?? {},
  });
  if (error) throw error;
  return data as EventSubmissionResult;
}

export type AdminStaffApplicationRow = {
  id: string;
  event_id: string;
  person_id: string;
  preferred_role: string | null;
  preferred_team: string | null;
  availability: Record<string, unknown>;
  experience: string | null;
  motivation: string | null;
  status: string;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  answers: Record<string, unknown>;
  people?: {
    student_id: string | null;
    name_th: string | null;
    name_en: string | null;
    nickname: string | null;
    email: string | null;
    phone: string | null;
    major: string | null;
    year_level: number | null;
  } | null;
};

export type PromoteStaffApplicationResult = {
  success: boolean;
  event_staff_id: string;
  event_id: string;
  person_id: string;
  application_id: string;
  staff_role: string | null;
  team: string | null;
  status: string;
};

export type AdminEventStaffRow = {
  id: string;
  event_id: string;
  person_id: string;
  staff_role: string | null;
  team: string | null;
  status: string;
  application_id: string | null;
  approved_at: string | null;
  people?: {
    student_id: string | null;
    name_th: string | null;
    name_en: string | null;
    nickname: string | null;
    major: string | null;
    year_level: number | null;
  } | null;
};

export async function fetchAdminEventStaffApplications(eventId: string): Promise<AdminStaffApplicationRow[]> {
  const { data, error } = await supabase
    .from('staff_applications')
    .select('id,event_id,person_id,preferred_role,preferred_team,availability,experience,motivation,status,submitted_at,reviewed_by,reviewed_at,review_note,answers,people(student_id,name_th,name_en,nickname,email,phone,major,year_level)')
    .eq('event_id', eventId)
    .order('submitted_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminStaffApplicationRow[];
}

export async function updateAdminStaffApplicationReview(input: {
  id: string;
  status?: string;
  finalDuty?: string | null;
  answers?: Record<string, unknown>;
  reviewNote?: string | null;
}): Promise<AdminStaffApplicationRow> {
  if (input.status || input.finalDuty !== undefined || input.reviewNote !== undefined) {
    const { data: reviewed, error: reviewError } = await supabase.rpc('review_staff_application', {
      input_application_id: input.id,
      input_status: input.status ?? 'under_review',
      input_final_duty: input.finalDuty ?? (input.answers?.final_duty == null ? null : String(input.answers.final_duty)),
      input_review_note: input.reviewNote ?? null,
    });
    if (reviewError) throw reviewError;
    const row = reviewed as AdminStaffApplicationRow;
    const { data, error } = await supabase
      .from('staff_applications')
      .select('id,event_id,person_id,preferred_role,preferred_team,availability,experience,motivation,status,submitted_at,reviewed_by,reviewed_at,review_note,answers,people(student_id,name_th,name_en,nickname,email,phone,major,year_level)')
      .eq('id', row.id)
      .single();
    if (error) throw error;
    return data as unknown as AdminStaffApplicationRow;
  }

  const payload: Record<string, unknown> = {};
  if (input.answers) payload.answers = input.answers;

  const { data, error } = await supabase
    .from('staff_applications')
    .update(payload)
    .eq('id', input.id)
    .select('id,event_id,person_id,preferred_role,preferred_team,availability,experience,motivation,status,submitted_at,reviewed_by,reviewed_at,review_note,answers,people(student_id,name_th,name_en,nickname,email,phone,major,year_level)')
    .single();
  if (error) throw error;
  return data as unknown as AdminStaffApplicationRow;
}

export async function promoteStaffApplicationToEventStaff(input: {
  applicationId: string;
  staffRole?: string | null;
  team?: string | null;
}): Promise<PromoteStaffApplicationResult> {
  const { data, error } = await supabase.rpc('promote_staff_application_to_event_staff', {
    input_application_id: input.applicationId,
    input_staff_role: input.staffRole ?? null,
    input_team: input.team ?? null,
  });
  if (error) throw error;
  return data as PromoteStaffApplicationResult;
}

export async function fetchAdminEventStaff(eventId: string): Promise<AdminEventStaffRow[]> {
  const { data, error } = await supabase
    .from('event_staff')
    .select('id,event_id,person_id,staff_role,team,status,application_id,approved_at,people(student_id,name_th,name_en,nickname,major,year_level)')
    .eq('event_id', eventId)
    .order('approved_at', { ascending: false, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as AdminEventStaffRow[];
}
