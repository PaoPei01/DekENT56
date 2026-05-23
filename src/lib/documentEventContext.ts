import type { EventRecord } from './eventTypes';

export function documentEventName(event: EventRecord | null | undefined, language: 'th' | 'en') {
  if (!event) return language === 'th' ? 'กิจกรรมที่เลือก' : 'Selected event';
  return language === 'th' ? event.name_th : event.name_en || event.name_th;
}

export function documentScopeLabel(eventId: string | null | undefined, currentEventId: string | null | undefined, language: 'th' | 'en') {
  if (!eventId) return language === 'th' ? 'ทุกกิจกรรม' : 'Global';
  if (eventId === currentEventId) return language === 'th' ? 'กิจกรรมนี้' : 'This event';
  return language === 'th' ? 'กิจกรรมอื่น' : 'Other event';
}

export function documentScopeTone(eventId: string | null | undefined, currentEventId: string | null | undefined): 'pending' | 'approved' | 'rejected' {
  if (!eventId) return 'pending';
  return eventId === currentEventId ? 'approved' : 'rejected';
}
