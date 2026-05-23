import { CalendarDays } from 'lucide-react';
import { useEventContext } from '../../context/EventContext';
import { useLanguage } from '../../context/LanguageContext';

type EventSwitcherProps = {
  compact?: boolean;
};

function statusLabel(status?: string, language: 'th' | 'en' = 'th') {
  const labels: Record<string, { th: string; en: string }> = {
    active: { th: 'กำลังใช้งาน', en: 'Active' },
    published: { th: 'เผยแพร่แล้ว', en: 'Published' },
    registration_open: { th: 'เปิดรับสมัคร', en: 'Registration open' },
    staff_recruiting: { th: 'เปิดรับสตาฟ', en: 'Staff recruiting' },
    draft: { th: 'แบบร่าง', en: 'Draft' },
    completed: { th: 'จบกิจกรรมแล้ว', en: 'Completed' },
    archived: { th: 'เก็บถาวร', en: 'Archived' },
  };
  return labels[status ?? '']?.[language] ?? status ?? '-';
}

export function EventSwitcher({ compact = false }: EventSwitcherProps) {
  const { language } = useLanguage();
  const { currentEvent, events, loading, setCurrentEventById } = useEventContext();
  const currentName = currentEvent ? (language === 'th' ? currentEvent.name_th : currentEvent.name_en || currentEvent.name_th) : '-';
  return (
    <div className={`event-switcher ${compact ? 'event-switcher-compact' : ''}`} aria-label={language === 'th' ? 'กิจกรรมปัจจุบัน' : 'Current event'}>
      <CalendarDays size={18} aria-hidden="true" />
      <div>
        <span>{language === 'th' ? 'กิจกรรมปัจจุบัน' : 'Current event'}</span>
        <strong>{loading ? (language === 'th' ? 'กำลังโหลด...' : 'Loading...') : currentName}</strong>
      </div>
      {events.length > 1 ? (
        <select
          aria-label={language === 'th' ? 'เลือกกิจกรรมปัจจุบัน' : 'Select current event'}
          value={currentEvent?.id ?? ''}
          onChange={(event) => setCurrentEventById(event.target.value)}
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {language === 'th' ? event.name_th : event.name_en || event.name_th}
            </option>
          ))}
        </select>
      ) : (
        <em>{currentEvent?.slug ?? '-'}</em>
      )}
      {!compact ? <em>{statusLabel(currentEvent?.status, language)} · {language === 'th' ? 'บางหน้ายังใช้ข้อมูลกิจกรรมเดิมระหว่างการย้ายระบบ' : 'Some pages still use legacy event data during migration.'}</em> : null}
    </div>
  );
}
