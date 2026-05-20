export type DocumentProjectProfile = {
  id: string;
  project_name: string | null;
  project_code: string | null;
  academic_year: string | null;
  organizer: string | null;
  department: string | null;
  objective: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type DocumentTemplate = {
  id: string;
  name: string;
  description: string | null;
  file_name: string;
  mime_type: string | null;
  template_content: string;
  placeholders: string[];
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
  title: string;
  description: string | null;
  responsible: string | null;
  sort_order: number | null;
};

export type DocumentVenue = {
  id: string;
  project_profile_id: string;
  name: string;
  address: string | null;
  capacity: number | null;
  notes: string | null;
};

export type DocumentEquipmentItem = {
  id: string;
  project_profile_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  responsible: string | null;
  notes: string | null;
};

export type GeneratedDocument = {
  id: string;
  project_profile_id: string | null;
  template_id: string | null;
  file_name: string;
  placeholders: Record<string, unknown>;
  missing_fields: string[];
  preview_html: string | null;
  generated_by: string | null;
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
