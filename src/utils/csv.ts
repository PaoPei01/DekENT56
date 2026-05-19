import type { Profile } from '../lib/types';

const headers: (keyof Profile)[] = [
  'email',
  'student_id',
  'name_th',
  'name_en',
  'nickname',
  'major',
  'phone',
  'emergency_phone',
  'line_id',
  'instagram',
  'facebook',
  'other_contact',
  'food_allergy',
  'disease',
  'drug_allergy',
];

function escapeCsv(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function exportProfilesCsv(rows: Profile[]) {
  const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `participants-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
