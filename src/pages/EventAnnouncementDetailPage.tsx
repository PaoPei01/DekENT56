import { Link, useParams } from 'react-router-dom';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { eventAnnouncementsPath, eventPath } from '../lib/eventRoutes';
import { fetchPublicEventAnnouncement } from '../services/announcements';

export function EventAnnouncementDetailPage() {
  const { language } = useLanguage();
  const { eventSlug = '', announcementId = '' } = useParams();
  const state = useAsync(() => fetchPublicEventAnnouncement(eventSlug, announcementId), [announcementId, eventSlug]);
  const event = state.data?.event ?? null;
  const item = state.data?.announcement ?? null;
  const eventName = event ? (language === 'th' ? event.name_th : event.name_en || event.name_th) : '';

  return (
    <section className="events-page page-stack">
      <PageHeader
        eyebrow="Event Announcement"
        title={item?.title ?? (language === 'th' ? 'ประกาศกิจกรรม' : 'Event announcement')}
        description={eventName}
        meta={<Link className="btn btn-secondary" to={eventAnnouncementsPath(eventSlug)}>{language === 'th' ? 'กลับประกาศกิจกรรม' : 'Back to announcements'}</Link>}
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

      {event && !state.loading && !item ? (
        <EmptyState
          title={language === 'th' ? 'ไม่พบประกาศ' : 'Announcement not found'}
          description={language === 'th' ? 'ประกาศนี้อาจถูกลบหรือยังไม่พร้อมแสดงผล' : 'This announcement may have been removed or is not available yet.'}
          action={<Link className="btn btn-secondary" to={eventPath(eventSlug)}>{language === 'th' ? 'กลับหน้ากิจกรรม' : 'Back to event'}</Link>}
        />
      ) : null}

      {item ? (
        <Card>
          <div className="badge-row">
            {item.is_pinned ? <Badge status="approved">{language === 'th' ? 'ปักหมุด' : 'Pinned'}</Badge> : null}
            {item.priority !== 'normal' ? <Badge status={item.priority === 'critical' ? 'rejected' : 'pending'}>{item.priority}</Badge> : null}
          </div>
          <AnnouncementCard item={item} />
          {item.image_url ? <img className="announcement-detail-image" src={item.image_url} alt="" /> : null}
          {item.file_url ? <iframe className="announcement-file-frame" src={item.file_url} title={item.title} /> : null}
        </Card>
      ) : null}
    </section>
  );
}
