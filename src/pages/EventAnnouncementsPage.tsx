import { Megaphone, Pin } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { eventPath } from '../lib/eventRoutes';
import { fetchPublicEventAnnouncements } from '../services/announcements';

function eventTitle(event: { name_th: string; name_en: string | null } | null | undefined, language: 'th' | 'en') {
  if (!event) return language === 'th' ? 'ประกาศกิจกรรม' : 'Event announcements';
  return language === 'th' ? event.name_th : event.name_en || event.name_th;
}

export function EventAnnouncementsPage() {
  const { language } = useLanguage();
  const { eventSlug = '' } = useParams();
  const state = useAsync(() => fetchPublicEventAnnouncements(eventSlug), [eventSlug]);
  const event = state.data?.event ?? null;
  const rows = state.data?.announcements ?? [];
  const pinned = rows.filter((item) => item.is_pinned || item.priority === 'critical' || item.priority === 'important');
  const normal = rows.filter((item) => !pinned.some((pinnedItem) => pinnedItem.id === item.id));

  return (
    <section className="events-page page-stack">
      <PageHeader
        eyebrow="Event Announcements"
        title={language === 'th' ? 'ประกาศกิจกรรม' : 'Event announcements'}
        description={eventTitle(event, language)}
        meta={<Link className="btn btn-secondary" to={eventPath(eventSlug)}>{language === 'th' ? 'กลับหน้ากิจกรรม' : 'Back to event'}</Link>}
      />

      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <div className="error-state">{state.error}</div> : null}

      {!state.loading && !event ? (
        <EmptyState
          title={language === 'th' ? 'ไม่พบกิจกรรมนี้' : 'Event not found'}
          description={language === 'th' ? 'ไม่พบข้อมูลกิจกรรม กรุณาตรวจสอบลิงก์อีกครั้ง' : 'Could not find this event. Please check the link again.'}
          action={<Link className="btn btn-primary" to="/events">{language === 'th' ? 'ดูกิจกรรมทั้งหมด' : 'View events'}</Link>}
        />
      ) : null}

      {event ? (
        <Card className="event-announcement-head" variant="soft">
          <Megaphone size={26} />
          <div>
            <p className="eyebrow">{language === 'th' ? 'ประกาศกิจกรรม' : 'Event updates'}</p>
            <h2>{eventTitle(event, language)}</h2>
            <p>{language === 'th' ? 'รวมประกาศและอัปเดตสำคัญของกิจกรรมนี้' : 'Important announcements and updates for this event.'}</p>
          </div>
        </Card>
      ) : null}

      {pinned.length ? (
        <Card>
          <div className="section-title-row">
            <div>
              <p className="eyebrow">{language === 'th' ? 'สำคัญ' : 'Important'}</p>
              <h2>{language === 'th' ? 'ประกาศปักหมุดและประกาศสำคัญ' : 'Pinned and important announcements'}</h2>
            </div>
            <Pin size={20} />
          </div>
          <div className="announcement-grid">
            {pinned.map((item) => (
              <Link className="event-announcement-link" key={item.id} to={`${eventPath(eventSlug)}/announcements/${item.id}`}>
                <div className="badge-row">
                  {item.is_pinned ? <Badge status="approved">{language === 'th' ? 'ปักหมุด' : 'Pinned'}</Badge> : null}
                  {item.priority !== 'normal' ? <Badge status={item.priority === 'critical' ? 'rejected' : 'pending'}>{item.priority}</Badge> : null}
                </div>
                <AnnouncementCard item={item} compact />
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {normal.length ? (
        <Card>
          <h2>{language === 'th' ? 'ประกาศทั้งหมด' : 'All announcements'}</h2>
          <div className="announcement-grid">
            {normal.map((item) => (
              <Link className="event-announcement-link" key={item.id} to={`${eventPath(eventSlug)}/announcements/${item.id}`}>
                <AnnouncementCard item={item} compact />
              </Link>
            ))}
          </div>
        </Card>
      ) : null}

      {!state.loading && event && !rows.length ? (
        <EmptyState
          title={language === 'th' ? 'ยังไม่มีประกาศ' : 'No announcements yet'}
          description={language === 'th' ? 'โปรดติดตามประกาศและอัปเดตจากผู้ดูแลกิจกรรม' : 'Please check back later for updates from the event team.'}
        />
      ) : null}
    </section>
  );
}
