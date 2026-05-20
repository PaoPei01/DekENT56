import { saveAs } from 'file-saver';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import type { DocumentBudgetItem, DocumentCenterData, DocumentEquipmentItem, DocumentProjectProfile, DocumentScheduleItem, DocumentTemplate, DocumentVenue } from './documentTypes';

export function formatThaiDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

export function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  bytes.forEach((byte) => {
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
  return [...new Set([...text.matchAll(/\{#?\/?([A-Za-z0-9_.-]+)\}/g)].map((match) => match[1]))].sort();
}

function money(value?: number | null) {
  return Number(value ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function budgetTable(items: DocumentBudgetItem[]) {
  return items.map((item, index) => ({
    index: index + 1,
    item_name: item.item_name,
    quantity: item.quantity ?? '',
    unit: item.unit ?? '',
    unit_price: money(item.unit_price),
    amount: money(item.amount ?? Number(item.quantity ?? 0) * Number(item.unit_price ?? 0)),
    notes: item.notes ?? '',
  }));
}

function scheduleTable(items: DocumentScheduleItem[]) {
  return items.map((item, index) => ({
    index: index + 1,
    item_date: formatThaiDate(item.item_date),
    start_time: item.start_time?.slice(0, 5) ?? '',
    end_time: item.end_time?.slice(0, 5) ?? '',
    title: item.title,
    description: item.description ?? '',
    responsible: item.responsible ?? '',
  }));
}

function venueTable(items: DocumentVenue[]) {
  return items.map((item, index) => ({
    index: index + 1,
    name: item.name,
    address: item.address ?? '',
    capacity: item.capacity ?? '',
    notes: item.notes ?? '',
  }));
}

function equipmentTable(items: DocumentEquipmentItem[]) {
  return items.map((item, index) => ({
    index: index + 1,
    name: item.name,
    quantity: item.quantity ?? '',
    unit: item.unit ?? '',
    responsible: item.responsible ?? '',
    notes: item.notes ?? '',
  }));
}

export function buildDocumentData(data: DocumentCenterData) {
  const profile = data.profile ?? {} as DocumentProjectProfile;
  const totalBudget = data.budgetItems.reduce((sum, item) => sum + Number(item.amount ?? Number(item.quantity ?? 0) * Number(item.unit_price ?? 0)), 0);
  return {
    ...profile,
    project_name: profile.project_name ?? '',
    project_code: profile.project_code ?? '',
    academic_year: profile.academic_year ?? '',
    organizer: profile.organizer ?? '',
    department: profile.department ?? '',
    objective: profile.objective ?? '',
    location: profile.location ?? '',
    start_date: formatThaiDate(profile.start_date),
    end_date: formatThaiDate(profile.end_date),
    contact_name: profile.contact_name ?? '',
    contact_phone: profile.contact_phone ?? '',
    notes: profile.notes ?? '',
    budget_total: money(totalBudget),
    budget_items: budgetTable(data.budgetItems),
    schedule_items: scheduleTable(data.scheduleItems),
    venues: venueTable(data.venues),
    equipment_items: equipmentTable(data.equipmentItems),
    generated_date: formatThaiDate(new Date().toISOString()),
  };
}

export function findMissingFields(placeholders: string[], payload: Record<string, unknown>) {
  const allowedArrayRoots = new Set(['budget_items', 'schedule_items', 'venues', 'equipment_items']);
  return placeholders.filter((field) => {
    const root = field.split('.')[0];
    if (allowedArrayRoots.has(root)) return !Array.isArray(payload[root]) || (payload[root] as unknown[]).length === 0;
    const value = field.split('.').reduce<unknown>((current, key) => (current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined), payload);
    return value == null || value === '';
  });
}

export function renderPreviewHtml(template: DocumentTemplate, payload: Record<string, unknown>, missing: string[]) {
  const fields = template.placeholders.map((field) => `<div><span>{${field}}</span><strong>${String(payload[field] ?? (missing.includes(field) ? 'ยังไม่มีข้อมูล' : 'พร้อมใช้งาน'))}</strong></div>`).join('');
  return `<section class="document-preview"><h1>${template.name}</h1><p>สร้างเมื่อ ${payload.generated_date ?? ''}</p>${fields}</section>`;
}

export function generateDocx(template: DocumentTemplate, payload: Record<string, unknown>) {
  const doc = new Docxtemplater(new PizZip(base64ToArrayBuffer(template.template_content)), { paragraphLoop: true, linebreaks: true });
  doc.render(payload);
  const blob = doc.getZip().generate({ type: 'blob', mimeType: template.mime_type ?? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  const name = `${template.name}-${new Date().toISOString().slice(0, 10)}.docx`;
  saveAs(blob, name);
  return name;
}
