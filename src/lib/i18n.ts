import { translations } from './translations';

export type AppLanguage = 'th' | 'en';
export type Language = AppLanguage;

export const LANGUAGE_STORAGE_KEY = 'tfbp_language';
const LEGACY_LANGUAGE_STORAGE_KEY = 'language';

export const SUPPORTED_LANGUAGES = ['th', 'en'] as const satisfies readonly AppLanguage[];

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
}

function browserLanguageValues() {
  if (typeof navigator === 'undefined') return [];
  const values = Array.isArray(navigator.languages) ? [...navigator.languages] : [];
  if (navigator.language) values.push(navigator.language);
  return values;
}

export function normalizeLanguage(value: unknown): AppLanguage | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'th' || normalized.startsWith('th-')) return 'th';
  if (normalized === 'en' || normalized.startsWith('en-')) return 'en';
  return null;
}

export function isSupportedLanguage(value: unknown): value is AppLanguage {
  return value === 'th' || value === 'en';
}

export function getStoredLanguage(): AppLanguage | null {
  if (!canUseLocalStorage()) return null;
  try {
    const stored = normalizeLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
    if (stored) return stored;
    return normalizeLanguage(window.localStorage.getItem(LEGACY_LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function setStoredLanguage(lang: AppLanguage): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Preference storage is optional. The in-memory React state still updates.
  }
}

export function clearStoredLanguage(): void {
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
}

export function detectBrowserLanguage(): AppLanguage {
  return browserLanguageValues().some((value) => value.trim().toLowerCase().startsWith('th')) ? 'th' : 'en';
}

export function detectInitialLanguage(): AppLanguage {
  return getStoredLanguage() ?? detectBrowserLanguage();
}

export function isThaiLanguage(lang: AppLanguage): boolean {
  return lang === 'th';
}

export type TranslationPath = `${keyof typeof translations.th}.${string}`;

export function translate(language: AppLanguage, key: string, params?: Record<string, string | number>): string {
  const [namespace, item] = key.split('.');
  const localizedTranslations = translations[language] as Record<string, Record<string, string> | undefined>;
  const thaiTranslations = translations.th as Record<string, Record<string, string> | undefined>;
  const localized = localizedTranslations[namespace]?.[item]
    ?? thaiTranslations[namespace]?.[item]
    ?? key;

  if (!params) return localized;
  return Object.entries(params).reduce(
    (text, [paramKey, value]) => text.split(`{${paramKey}}`).join(String(value)),
    localized,
  );
}

export const copy = {
  th: {
    participants: 'รายชื่อผู้เข้าร่วม',
    searchTitle: 'ค้นหารายชื่อกิจกรรม',
    privacy: 'ข้อมูลติดต่อ สุขภาพ และข้อมูลส่วนตัวอื่น ๆ จะไม่แสดงต่อสาธารณะ',
    search: 'ค้นหา',
    filterMajor: 'สาขา',
    all: 'ทั้งหมด',
    nickname: 'ชื่อเล่น',
    major: 'สาขา',
    admin: 'แอดมิน',
    edit: 'ขอแก้ไขข้อมูล',
    dashboard: 'แดชบอร์ด',
    requests: 'คำขอ',
    logs: 'ประวัติ',
    groups: 'จัดกลุ่ม',
    totalParticipants: 'ผู้เข้าร่วมทั้งหมด',
    pendingRequests: 'คำขอที่รอตรวจสอบ',
    healthData: 'ข้อมูลที่ต้องดูแลเป็นพิเศษ',
    adminOnly: 'ดูภาพรวมรายชื่อ คำขอ และข้อมูลที่ต้องดูแลในวันงาน',
    searchParticipants: 'ค้นหารายชื่อ',
    filterGroup: 'กลุ่มสี',
    filterSubgroup: 'กลุ่มย่อย',
    filterHealth: 'ข้อมูลสุขภาพ',
    participantNotFound: 'ยังไม่พบข้อมูลที่ตรงกับตัวกรอง ลองล้างตัวกรองหรือค้นหาด้วยคำอื่น',
    name: 'ชื่อ',
    email: 'อีเมล',
    phone: 'เบอร์',
    contact: 'ช่องทาง',
    actions: 'จัดการ',
    editAction: 'แก้ไข',
    deleteAction: 'ลบ',
  },
  en: {
    participants: 'Participants',
    searchTitle: 'Activity participant list',
    privacy: 'Contact, health, and other private details are hidden from public pages',
    search: 'Search',
    filterMajor: 'Major',
    all: 'All',
    nickname: 'Nickname',
    major: 'Major',
    admin: 'Admin',
    edit: 'Edit request',
    dashboard: 'Dashboard',
    requests: 'Requests',
    logs: 'Logs',
    groups: 'Groups',
    totalParticipants: 'Total participants',
    pendingRequests: 'Requests to review',
    healthData: 'Needs special care',
    adminOnly: 'Review participants, requests, and important care flags for event operations.',
    searchParticipants: 'Search participants',
    filterGroup: 'Color group',
    filterSubgroup: 'Subgroup',
    filterHealth: 'Health flag',
    participantNotFound: 'No matching records found. Try clearing filters or searching with another keyword.',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    contact: 'Contact',
    actions: 'Actions',
    editAction: 'Edit',
    deleteAction: 'Delete',
  },
} satisfies Record<AppLanguage, Record<string, string>>;
