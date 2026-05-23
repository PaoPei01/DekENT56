export type DutyOption = {
  key: string;
  labelTh: string;
  descriptionTh: string;
  quota: number;
  priority: number;
  isGeneral?: boolean;
  legacyLabels?: string[];
};

export type SelectOption = {
  value: string;
  label: string;
};

type DutyLike = {
  duty_key?: string | null;
  duty_label_th?: string | null;
  quota?: number | null;
  assigned_count?: number | null;
  remaining?: number | null;
};

type ApplicationLike = {
  assigned_duty?: string | null;
  preferred_team?: string | null;
  answers?: {
    preferred_duties?: unknown;
    preferred_duty_labels?: unknown;
    assigned_duty_label_th?: unknown;
    final_duty?: unknown;
  } | null;
};

export const PARENT_ORIENTATION_DUTIES: DutyOption[] = [
  {
    key: 'traffic',
    labelTh: 'ฝ่ายจราจรและอำนวยทาง',
    descriptionTh: 'ดูแลการเดินทาง การบอกทาง และช่วยจัดระเบียบเส้นทางภายในพื้นที่กิจกรรม',
    quota: 10,
    priority: 10,
    legacyLabels: ['ฝ่ายจราจร', 'ฝ่ายจราจร (10 คน)'],
  },
  {
    key: 'medical',
    labelTh: 'ฝ่ายพยาบาลและดูแลความปลอดภัย',
    descriptionTh: 'ดูแลการปฐมพยาบาลเบื้องต้น ประสานงานกรณีฉุกเฉิน และช่วยดูแลความปลอดภัยของผู้เข้าร่วม',
    quota: 5,
    priority: 20,
    legacyLabels: ['ฝ่ายพยาบาล', 'ฝ่ายพยาบาล (5 คน)'],
  },
  {
    key: 'registration',
    labelTh: 'ฝ่ายลงทะเบียน',
    descriptionTh: 'ตรวจสอบรายชื่อ ต้อนรับผู้เข้าร่วม และช่วยจัดการจุดลงทะเบียนให้เป็นระเบียบ',
    quota: 15,
    priority: 30,
    legacyLabels: ['ฝ่ายลงทะเบียน', 'ฝ่ายลงทะเบียน (15 คน)'],
  },
  {
    key: 'welfare',
    labelTh: 'ฝ่ายสวัสดิการ',
    descriptionTh: 'ดูแลอาหาร น้ำดื่ม อุปกรณ์ และความเรียบร้อยด้านสวัสดิการของทีมงานและผู้เข้าร่วม',
    quota: 10,
    priority: 40,
    legacyLabels: ['ฝ่ายสวัสดิการ', 'ฝ่ายสวัสดิการ (10 คน)'],
  },
  {
    key: 'benefits_sales',
    labelTh: 'ฝ่ายสิทธิประโยชน์และจำหน่ายสินค้า',
    descriptionTh: 'ดูแลบูธสิทธิประโยชน์ การจำหน่ายสินค้า หรือกิจกรรมสนับสนุนรายได้และประชาสัมพันธ์ของงาน',
    quota: 5,
    priority: 50,
    legacyLabels: ['ฝ่ายสิทธิประโยชน์', 'ฝ่ายสิทธิประโยชน์ (5 คน)', 'สิทธิประโยชน์(ขายของ)'],
  },
  {
    key: 'registration_it',
    labelTh: 'ฝ่ายสนับสนุนระบบลงทะเบียน (IT)',
    descriptionTh: 'ช่วยดูแลอุปกรณ์ ระบบลงทะเบียน การแก้ปัญหาหน้างาน และการประสานงานด้านเทคนิค',
    quota: 3,
    priority: 60,
    legacyLabels: ['ฝ่ายสนับสนุนระบบลงทะเบียน (IT)', 'ฝ่ายสนับสนุนระบบลงทะเบียน (IT) (3 คน)', 'ฝ่ายสนับสนุนระบบลงทะเบียน', 'IT'],
  },
  {
    key: 'backstage',
    labelTh: 'ฝ่าย Backstage และประสานงานเวที',
    descriptionTh: 'ดูแลหลังเวที คิวกิจกรรม การประสานงานผู้เกี่ยวข้อง และความพร้อมของช่วงพิธีการหรือการแสดง',
    quota: 5,
    priority: 70,
    legacyLabels: ['Backstage', 'ฝ่าย Backstage', 'ฝ่าย Backstage และประสานงานเวที', 'ฝ่ายประสานงานเวที', 'ฝ่ายประสานงานเวที (5 คน)'],
  },
  {
    key: 'general',
    labelTh: 'ฝ่ายทั่วไป',
    descriptionTh: 'สนับสนุนงานทั่วไปตามที่ได้รับมอบหมาย เช่น ช่วยประจำจุดต่าง ๆ อำนวยความสะดวก และช่วยเสริมกำลังฝ่ายที่ต้องการคนเพิ่ม',
    quota: 77,
    priority: 80,
    isGeneral: true,
    legacyLabels: ['ฝ่ายทั่วไป', 'ฝ่ายทั่วไป (77 คน)', 'ฝ่ายอำนวยความสะดวก', 'ร่วมร้องเพลงมาร์ชวิศวะและบูมคณะ'],
  },
];

function cleanDutyValue(value: string) {
  return value
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\(\s*\d+\s*คน\s*\)$/u, '')
    .trim()
    .toLowerCase();
}

const dutyLookup = new Map<string, DutyOption>();

for (const duty of PARENT_ORIENTATION_DUTIES) {
  [duty.key, duty.labelTh, ...(duty.legacyLabels ?? [])].forEach((value) => {
    dutyLookup.set(cleanDutyValue(value), duty);
  });
}

export function getCanonicalDutyKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return dutyLookup.get(cleanDutyValue(value))?.key ?? null;
}

export function getDutyLabelTh(keyOrLabel: string | null | undefined): string {
  if (!keyOrLabel) return '';
  const duty = dutyLookup.get(cleanDutyValue(keyOrLabel));
  return duty?.labelTh ?? keyOrLabel.trim();
}

export function getDutyOptions(): DutyOption[] {
  return [...PARENT_ORIENTATION_DUTIES].sort((a, b) => a.priority - b.priority);
}

export function getDutySelectOptions(): SelectOption[] {
  return getDutyOptions().map((duty) => ({ value: duty.key, label: duty.labelTh }));
}

export function normalizeDutySelection(values: string[]): string[] {
  const keys = values.map(getCanonicalDutyKey).filter((key): key is string => Boolean(key));
  return [...new Set(keys)].sort((a, b) => {
    const dutyA = PARENT_ORIENTATION_DUTIES.find((duty) => duty.key === a)?.priority ?? 999;
    const dutyB = PARENT_ORIENTATION_DUTIES.find((duty) => duty.key === b)?.priority ?? 999;
    return dutyA - dutyB;
  });
}

export function dutyValuesFromApplication(application: ApplicationLike): string[] {
  const raw = application.answers?.preferred_duties ?? application.preferred_team;
  const values = Array.isArray(raw)
    ? raw.map(String)
    : String(raw ?? '').split(',').map((item) => item.trim()).filter(Boolean);

  const explicitLabels = application.answers?.preferred_duty_labels;
  if (Array.isArray(explicitLabels)) {
    values.push(...explicitLabels.map(String));
  }
  return values;
}

export function getApplicationAssignedDutyKey(application: ApplicationLike): string | null {
  return getCanonicalDutyKey(application.assigned_duty)
    ?? getCanonicalDutyKey(String(application.answers?.assigned_duty_label_th ?? ''));
}

export function getApplicationFinalDutyKey(application: ApplicationLike): string | null {
  return getCanonicalDutyKey(String(application.answers?.final_duty ?? ''));
}

export function getApplicationPreferredDutyKeys(application: ApplicationLike): string[] {
  return normalizeDutySelection(dutyValuesFromApplication(application));
}

export function buildDutyFilterOptions(_applications: ApplicationLike[], quotaStatus?: { duties?: DutyLike[] } | null): SelectOption[] {
  const canonical = getDutyOptions();
  const quotaKeys = new Set((quotaStatus?.duties ?? []).map((duty) => getCanonicalDutyKey(duty.duty_key ?? duty.duty_label_th ?? '')).filter(Boolean));

  // Duty filters used to be assembled from quota rows, event content, and raw answers,
  // which produced duplicated labels such as "ฝ่ายจราจร" and "ฝ่ายจราจร (10 คน)".
  // Keep the dropdown canonical; show quota numbers only in quota cards.
  return canonical
    .filter((duty) => !quotaKeys.size || quotaKeys.has(duty.key) || PARENT_ORIENTATION_DUTIES.some((item) => item.key === duty.key))
    .map((duty) => ({ value: duty.key, label: duty.labelTh }));
}

