import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { DocumentBudgetItem, DocumentCenterData, DocumentEquipmentItem, DocumentScheduleItem, DocumentTemplate, DocumentType, DocumentVenue } from './documentTypes';

export const documentTypeOptions: Array<{ value: DocumentType; label: string }> = [
  { value: 'project_approval', label: 'เอกสารขออนุมัติโครงการ' },
  { value: 'venue_request', label: 'หนังสือขอใช้สถานที่' },
  { value: 'equipment_borrow', label: 'เอกสารยืมอุปกรณ์' },
  { value: 'support_request', label: 'หนังสือขอความอนุเคราะห์' },
  { value: 'invitation_letter', label: 'หนังสือเชิญ' },
  { value: 'closing_report', label: 'รายงานสรุปโครงการ' },
  { value: 'custom', label: 'กำหนดเอง' },
];

export const templateVariableGuide = [
  'project_name', 'event_date_th', 'event_time_range', 'location', 'total_participants', 'freshmen_count', 'staff_count',
  'budget_total', 'advisor_name', 'project_chair_name', 'coordinator_name', 'coordinator_phone',
];

const thaiLabels: Record<string, string> = {
  project_name: 'ชื่อโครงการ',
  event_date_th: 'วันที่จัดกิจกรรม',
  event_time_range: 'ช่วงเวลากิจกรรม',
  location: 'สถานที่',
  total_participants: 'จำนวนผู้เข้าร่วมทั้งหมด',
  freshmen_count: 'จำนวนน้องปีหนึ่ง',
  staff_count: 'จำนวนทีมงาน',
  budget_total: 'งบประมาณรวม',
  advisor_name: 'ชื่ออาจารย์ที่ปรึกษา',
  project_chair_name: 'ชื่อประธานโครงการ',
  coordinator_name: 'ชื่อผู้ประสานงาน',
  coordinator_phone: 'เบอร์ผู้ประสานงาน',
  rationale: 'หลักการและเหตุผล',
  objectives: 'วัตถุประสงค์',
  expected_outcomes: 'ผลที่คาดว่าจะได้รับ',
  kpi_summary: 'สรุปตัวชี้วัด',
  schedule_items: 'กำหนดการ',
  budget_items: 'งบประมาณ',
  venues: 'สถานที่',
  equipment_items: 'อุปกรณ์',
};

const requiredByType: Record<DocumentType, string[]> = {
  project_approval: ['project_name', 'event_date_th', 'event_time_range', 'location', 'rationale', 'objectives', 'expected_outcomes', 'budget_total', 'schedule_items', 'project_chair_name', 'coordinator_name', 'coordinator_phone'],
  venue_request: ['project_name', 'event_date_th', 'coordinator_name', 'coordinator_phone', 'venues'],
  equipment_borrow: ['project_name', 'event_date_th', 'coordinator_name', 'coordinator_phone', 'equipment_items'],
  support_request: ['project_name', 'event_date_th', 'coordinator_name', 'coordinator_phone'],
  invitation_letter: ['project_name', 'event_date_th', 'event_time_range', 'location', 'coordinator_name', 'coordinator_phone'],
  closing_report: ['project_name', 'event_date_th', 'total_participants', 'kpi_summary', 'budget_total'],
  custom: [],
};

export function documentTypeLabel(type: DocumentType) {
  return documentTypeOptions.find((item) => item.value === type)?.label ?? type;
}

export function fieldLabel(field: string) {
  return thaiLabels[field] ?? field;
}

export function formatThaiDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  new Uint8Array(buffer).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return window.btoa(binary);
}

export function base64ToArrayBuffer(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

export function extractDocxPlaceholders(buffer: ArrayBuffer) {
  const zip = new PizZip(buffer);
  const text = Object.keys(zip.files)
    .filter((name) => name.startsWith('word/') && name.endsWith('.xml'))
    .map((name) => zip.file(name)?.asText() ?? '')
    .join('\n')
    .replace(/<[^>]+>/g, '');
  return [...new Set([...text.matchAll(/\{#?\/?([a-z0-9_.-]+)\}/g)].map((match) => match[1]).filter((name) => !name.includes('/')))].sort();
}

function money(value?: number | null) {
  return Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function timeRange(start?: string | null, end?: string | null) {
  const s = start?.slice(0, 5) ?? '';
  const e = end?.slice(0, 5) ?? '';
  return s && e ? `${s}-${e} น.` : s ? `${s} น.` : '';
}

export function durationMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const result = (eh * 60 + em) - (sh * 60 + sm);
  return result >= 0 ? result : null;
}

function budgetTable(items: DocumentBudgetItem[]) {
  return items.map((item, index) => {
    const amount = Number(item.quantity ?? 0) * Number(item.unit_price ?? 0);
    return { index: index + 1, item_name: item.item_name, quantity: item.quantity ?? '', unit: item.unit ?? '', unit_price: money(item.unit_price), amount: money(amount), notes: item.notes ?? '' };
  });
}

function scheduleTable(items: DocumentScheduleItem[]) {
  return items.map((item, index) => ({
    index: index + 1,
    item_date: formatThaiDate(item.item_date),
    start_time: item.start_time?.slice(0, 5) ?? '',
    end_time: item.end_time?.slice(0, 5) ?? '',
    time_range: item.time_range || timeRange(item.start_time, item.end_time),
    duration_minutes: item.duration_minutes ?? durationMinutes(item.start_time, item.end_time) ?? '',
    title: item.title,
    description: item.description ?? '',
    location: item.location ?? '',
    responsible_team: item.responsible_team ?? '',
    responsible: item.responsible ?? '',
  }));
}

function venueTable(items: DocumentVenue[]) {
  return items.map((item, index) => ({ index: index + 1, ...item, use_date: formatThaiDate(item.use_date), time_range: timeRange(item.start_time, item.end_time), needs_electricity: item.needs_electricity ? 'ต้องใช้' : 'ไม่ใช้', needs_sound_system: item.needs_sound_system ? 'ต้องใช้' : 'ไม่ใช้', needs_air_conditioning: item.needs_air_conditioning ? 'ต้องใช้' : 'ไม่ใช้', needs_cleaning_staff: item.needs_cleaning_staff ? 'ต้องใช้' : 'ไม่ใช้', note: item.note ?? item.notes ?? '' }));
}

function equipmentTable(items: DocumentEquipmentItem[]) {
  return items.map((item, index) => ({ index: index + 1, ...item, borrow_date: formatThaiDate(item.borrow_date), return_date: formatThaiDate(item.return_date), responsible_person: item.responsible_person ?? item.responsible ?? '', note: item.note ?? item.notes ?? '' }));
}

export function buildDocumentData(data: DocumentCenterData) {
  const profile = data.profile;
  const budgetTotalNumber = data.budgetItems.reduce((sum, item) => sum + Number(item.quantity ?? 0) * Number(item.unit_price ?? 0), 0);
  const eventDate = profile?.event_date ?? profile?.start_date ?? '';
  const coordinatorName = profile?.coordinator_name ?? profile?.contact_name ?? '';
  const coordinatorPhone = profile?.coordinator_phone ?? profile?.contact_phone ?? '';
  return {
    project_name: profile?.project_name ?? '',
    project_code: profile?.project_code ?? '',
    academic_year: profile?.academic_year ?? '',
    organizer: profile?.organizer ?? '',
    department: profile?.department ?? '',
    rationale: profile?.rationale ?? '',
    objectives: profile?.objectives ?? profile?.objective ?? '',
    objective: profile?.objective ?? profile?.objectives ?? '',
    expected_outcomes: profile?.expected_outcomes ?? '',
    kpi_summary: profile?.kpi_summary ?? '',
    risk_plan: profile?.risk_plan ?? '',
    location: profile?.location ?? '',
    event_date: eventDate,
    event_date_th: formatThaiDate(eventDate),
    document_date_th: formatThaiDate(profile?.document_date),
    event_time_range: timeRange(profile?.event_start_time, profile?.event_end_time),
    total_participants: profile?.total_participants ?? '',
    freshmen_count: profile?.freshmen_count ?? '',
    staff_count: profile?.staff_count ?? '',
    budget_source: profile?.budget_source ?? '',
    budget_total: money(budgetTotalNumber || profile?.budget_total),
    advisor_name: profile?.advisor_name ?? '',
    advisor_position: profile?.advisor_position ?? '',
    project_chair_name: profile?.project_chair_name ?? '',
    project_chair_position: profile?.project_chair_position ?? '',
    coordinator_name: coordinatorName,
    coordinator_phone: coordinatorPhone,
    coordinator_email: profile?.coordinator_email ?? '',
    signing_person_name: profile?.signing_person_name ?? '',
    signing_person_position: profile?.signing_person_position ?? '',
    notes: profile?.notes ?? '',
    budget_items: budgetTable(data.budgetItems),
    schedule_items: scheduleTable(data.scheduleItems),
    venues: venueTable(data.venues),
    equipment_items: equipmentTable(data.equipmentItems),
    generated_date: formatThaiDate(new Date().toISOString()),
  };
}

function isMissing(field: string, payload: Record<string, unknown>) {
  const value = field.split('.').reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined), payload);
  if (Array.isArray(value)) return value.length === 0;
  return value == null || value === '';
}

export function findMissingFields(documentType: DocumentType, placeholders: string[], payload: Record<string, unknown>) {
  const fields = [...new Set([...requiredByType[documentType], ...placeholders])];
  return fields.filter((field) => isMissing(field.split('.')[0], payload)).map((field) => ({ field, label: fieldLabel(field) }));
}

function tableRows(rows: Record<string, unknown>[], columns: string[]) {
  return rows.map((row) => `<tr>${columns.map((col) => `<td>${String(row[col] ?? '')}</td>`).join('')}</tr>`).join('');
}

export function renderPreviewHtml(documentType: DocumentType, title: string, payload: Record<string, unknown>, missing: Array<{ field: string; label: string }>) {
  const schedule = payload.schedule_items as Record<string, unknown>[] ?? [];
  const budget = payload.budget_items as Record<string, unknown>[] ?? [];
  const venues = payload.venues as Record<string, unknown>[] ?? [];
  const equipment = payload.equipment_items as Record<string, unknown>[] ?? [];
  return `<section class="document-preview">
    <h1>${title || documentTypeLabel(documentType)}</h1>
    <p>${payload.document_date_th || payload.generated_date || ''}</p>
    <div><span>ชื่อโครงการ</span><strong>${payload.project_name || '-'}</strong></div>
    <div><span>วัน เวลา สถานที่</span><strong>${payload.event_date_th || '-'} ${payload.event_time_range || ''} ${payload.location || ''}</strong></div>
    <h2>หลักการและเหตุผล</h2><p>${payload.rationale || '-'}</p>
    <h2>วัตถุประสงค์</h2><p>${payload.objectives || '-'}</p>
    <h2>ผลที่คาดว่าจะได้รับ</h2><p>${payload.expected_outcomes || '-'}</p>
    <h2>กำหนดการ</h2><table><tbody>${tableRows(schedule, ['time_range', 'title', 'duration_minutes', 'location', 'responsible_team'])}</tbody></table>
    <h2>งบประมาณ</h2><table><tbody>${tableRows(budget, ['item_name', 'quantity', 'unit', 'unit_price', 'amount'])}</tbody></table><p><strong>รวม ${payload.budget_total || '0.00'} บาท</strong></p>
    <h2>สถานที่</h2><table><tbody>${tableRows(venues, ['name', 'use_date', 'time_range', 'purpose', 'participant_count'])}</tbody></table>
    <h2>อุปกรณ์</h2><table><tbody>${tableRows(equipment, ['name', 'quantity', 'unit', 'borrow_date', 'return_date', 'status'])}</tbody></table>
    <h2>ผู้ลงนาม</h2><p>${payload.signing_person_name || payload.project_chair_name || '-'} ${payload.signing_person_position || payload.project_chair_position || ''}</p>
    ${missing.length ? `<h2>ข้อมูลที่ยังขาด</h2><p>${missing.map((item) => item.label).join(', ')}</p>` : ''}
  </section>`;
}

export function renderDocxBlob(buffer: ArrayBuffer, payload: Record<string, unknown>) {
  const doc = new Docxtemplater(new PizZip(buffer), { paragraphLoop: true, linebreaks: true });
  doc.render(payload);
  return doc.getZip().generate({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

export function downloadBlob(blob: Blob, fileName: string) {
  saveAs(blob, fileName);
}
