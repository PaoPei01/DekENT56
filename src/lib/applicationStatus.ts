import { translate, type AppLanguage } from './i18n';

export const STAFF_APPLICATION_STATUSES = ['submitted', 'under_review', 'approved', 'waitlisted', 'rejected', 'withdrawn'] as const;

export type StaffApplicationStatus = (typeof STAFF_APPLICATION_STATUSES)[number];

const labels: Record<StaffApplicationStatus, { th: string; en: string }> = {
  submitted: { th: 'ส่งใบสมัครแล้ว', en: 'Submitted' },
  under_review: { th: 'กำลังตรวจสอบ', en: 'Under review' },
  approved: { th: 'ผ่านการคัดเลือก', en: 'Approved' },
  waitlisted: { th: 'สำรอง', en: 'Waitlisted' },
  rejected: { th: 'ไม่ผ่านการคัดเลือก', en: 'Rejected' },
  withdrawn: { th: 'ถอนใบสมัคร', en: 'Withdrawn' },
};

const translationKeys: Record<StaffApplicationStatus, string> = {
  submitted: 'statuses.submitted',
  under_review: 'statuses.underReview',
  approved: 'statuses.approved',
  waitlisted: 'statuses.waitlisted',
  rejected: 'statuses.rejected',
  withdrawn: 'statuses.withdrawn',
};

export function getApplicationStatusLabel(status: string, language: AppLanguage) {
  const key = translationKeys[status as StaffApplicationStatus];
  if (key) return translate(language, key);
  return labels[status as StaffApplicationStatus]?.[language] ?? status;
}

export function getApplicationStatusTone(status: string): 'pending' | 'approved' | 'rejected' {
  if (status === 'approved') return 'approved';
  if (status === 'rejected' || status === 'withdrawn') return 'rejected';
  return 'pending';
}
