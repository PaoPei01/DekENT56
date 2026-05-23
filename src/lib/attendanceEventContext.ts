import type { StaffAttendanceSession } from './attendanceTypes';
import type { EventRecord } from './eventTypes';

export function attendanceEventLabel(
  session: Pick<StaffAttendanceSession, 'event_id'> | null | undefined,
  events: EventRecord[],
  language: 'th' | 'en',
) {
  if (!session?.event_id) return language === 'th' ? 'กิจกรรมเดิม' : 'Legacy/default event';
  const event = events.find((item) => item.id === session.event_id);
  if (!event) return language === 'th' ? 'ไม่พบชื่อกิจกรรม' : 'Event name unavailable';
  return language === 'th' ? event.name_th : event.name_en || event.name_th;
}

export function attendanceEventBadgeLabel(
  session: Pick<StaffAttendanceSession, 'event_id'> | null | undefined,
  events: EventRecord[],
  language: 'th' | 'en',
) {
  if (!session?.event_id) return language === 'th' ? 'Legacy' : 'Legacy';
  return attendanceEventLabel(session, events, language);
}

export function attendanceEventIsLegacy(session: Pick<StaffAttendanceSession, 'event_id'> | null | undefined) {
  return !session?.event_id;
}

export function attendanceQrState(
  session: Pick<StaffAttendanceSession, 'status' | 'qr_token' | 'qr_expires_at'> | null | undefined,
  now = Date.now(),
) {
  if (!session?.qr_token) return 'missing';
  if (session.status === 'closed') return 'closed';
  if (session.status === 'archived') return 'archived';
  if (session.qr_expires_at && new Date(session.qr_expires_at).getTime() <= now) return 'expired';
  return 'available';
}

export function attendanceQrStateLabel(state: ReturnType<typeof attendanceQrState>, language: 'th' | 'en') {
  const labels: Record<ReturnType<typeof attendanceQrState>, { th: string; en: string }> = {
    available: { th: 'QR ใช้งานได้', en: 'QR available' },
    missing: { th: 'ยังไม่มี QR', en: 'No QR yet' },
    closed: { th: 'รอบนี้ปิดแล้ว', en: 'Session closed' },
    archived: { th: 'รอบนี้เก็บถาวรแล้ว', en: 'Session archived' },
    expired: { th: 'QR หมดอายุแล้ว', en: 'QR expired' },
  };
  return labels[state][language];
}
