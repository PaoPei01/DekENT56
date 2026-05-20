import { groupLabel } from '../lib/grouping';
import { majorLabel } from '../lib/major';
import type { GroupProfile, Profile } from '../lib/types';

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

export async function exportProfilesXlsx(rows: GroupProfile[]) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TFBP';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Participants');
  sheet.columns = [
    { header: 'Student ID', key: 'student_id', width: 16 },
    { header: 'Email', key: 'email', width: 28 },
    { header: 'Name TH', key: 'name_th', width: 28 },
    { header: 'Name EN', key: 'name_en', width: 28 },
    { header: 'Nickname TH', key: 'nickname', width: 16 },
    { header: 'Nickname EN', key: 'nickname_en', width: 16 },
    { header: 'Major', key: 'major', width: 46 },
    { header: 'Group', key: 'group', width: 18 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'Emergency Phone', key: 'emergency_phone', width: 18 },
    { header: 'LINE', key: 'line_id', width: 18 },
    { header: 'Instagram', key: 'instagram', width: 18 },
    { header: 'Facebook', key: 'facebook', width: 18 },
    { header: 'Other Contact', key: 'other_contact', width: 24 },
    { header: 'Disease', key: 'disease', width: 28 },
    { header: 'Drug Allergy', key: 'drug_allergy', width: 28 },
    { header: 'Food Allergy', key: 'food_allergy', width: 28 },
  ];
  rows.forEach((row) => sheet.addRow({
    student_id: row.student_id,
    email: row.email,
    name_th: row.name_th,
    name_en: row.name_en,
    nickname: row.nickname,
    nickname_en: row.nickname_en,
    major: majorLabel(row.major),
    group: groupLabel(row.group_assignment?.main_group, row.group_assignment?.subgroup),
    phone: row.phone,
    emergency_phone: row.emergency_phone,
    line_id: row.line_id,
    instagram: row.instagram,
    facebook: row.facebook,
    other_contact: row.other_contact,
    disease: row.disease,
    drug_allergy: row.drug_allergy,
    food_allergy: row.food_allergy,
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  const majorSheet = workbook.addWorksheet('Major summary');
  majorSheet.addRow(['Major', 'Count']);
  const byMajor = rows.reduce<Record<string, number>>((acc, row) => {
    const major = majorLabel(row.major) || 'ไม่ระบุ';
    acc[major] = (acc[major] ?? 0) + 1;
    return acc;
  }, {});
  Object.entries(byMajor).sort(([a], [b]) => a.localeCompare(b)).forEach(([major, count]) => majorSheet.addRow([major, count]));
  majorSheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `participants-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
