export type DocumentType = 'project_approval' | 'venue_request' | 'equipment_borrow' | 'support_request' | 'invitation_letter' | 'closing_report' | 'custom';
export type EquipmentStatus = 'draft' | 'requested' | 'borrowed' | 'returned' | 'incomplete';

export type DocumentProjectProfile = {
  id: string;
  event_id: string | null;
  project_name: string | null;
  project_code: string | null;
  academic_year: string | null;
  organizer: string | null;
  department: string | null;
  objective: string | null;
  objectives: string | null;
  rationale: string | null;
  expected_outcomes: string | null;
  kpi_summary: string | null;
  risk_plan: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  event_date: string | null;
  document_date: string | null;
  event_start_time: string | null;
  event_end_time: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  coordinator_name: string | null;
  coordinator_phone: string | null;
  coordinator_email: string | null;
  advisor_name: string | null;
  advisor_position: string | null;
  project_chair_name: string | null;
  project_chair_position: string | null;
  signing_person_name: string | null;
  signing_person_position: string | null;
  freshmen_count: number | null;
  staff_count: number | null;
  total_participants: number | null;
  budget_total: number | null;
  budget_source: string | null;
  notes: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DocumentTemplate = {
  id: string;
  event_id: string | null;
  name: string;
  document_type: DocumentType;
  description: string | null;
  file_name: string;
  mime_type: string | null;
  storage_path: string | null;
  template_content?: string | null;
  placeholders: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DocumentBudgetItem = {
  id: string;
  project_profile_id: string;
  item_name: string;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  amount?: number | null;
  notes: string | null;
};

export type DocumentScheduleItem = {
  id: string;
  project_profile_id: string;
  item_date: string | null;
  start_time: string | null;
  end_time: string | null;
  time_range: string | null;
  duration_minutes: number | null;
  title: string;
  description: string | null;
  location: string | null;
  responsible: string | null;
  responsible_team: string | null;
  sort_order: number | null;
};

export type DocumentVenue = {
  id: string;
  project_profile_id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  use_date: string | null;
  start_time: string | null;
  end_time: string | null;
  purpose: string | null;
  participant_count: number | null;
  needs_electricity: boolean | null;
  needs_sound_system: boolean | null;
  needs_air_conditioning: boolean | null;
  needs_cleaning_staff: boolean | null;
  note: string | null;
  notes: string | null;
};

export type DocumentEquipmentItem = {
  id: string;
  project_profile_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  borrow_date: string | null;
  return_date: string | null;
  use_location: string | null;
  responsible: string | null;
  responsible_person: string | null;
  status: EquipmentStatus | null;
  note: string | null;
  notes: string | null;
};

export type GeneratedDocument = {
  id: string;
  event_id: string | null;
  project_profile_id: string | null;
  template_id: string | null;
  file_name: string;
  title: string | null;
  document_type: DocumentType;
  version: number;
  status: string | null;
  output_docx_path: string | null;
  placeholders: Record<string, unknown>;
  snapshot_data: Record<string, unknown> | null;
  missing_fields: string[];
  preview_html: string | null;
  generated_by: string | null;
  generated_at: string | null;
  created_at: string | null;
};

export type DocumentCenterData = {
  profile: DocumentProjectProfile | null;
  templates: DocumentTemplate[];
  budgetItems: DocumentBudgetItem[];
  scheduleItems: DocumentScheduleItem[];
  venues: DocumentVenue[];
  equipmentItems: DocumentEquipmentItem[];
  history: GeneratedDocument[];
};
