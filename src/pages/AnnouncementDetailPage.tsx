import { Link, useParams } from 'react-router-dom';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { fetchAnnouncement } from '../services/announcements';

export function AnnouncementDetailPage() {
  const { id = '' } = useParams();
  const { language } = useLanguage();
  const state = useAsync(() => fetchAnnouncement(id), [id]);
  const item = state.data;
  return (
    <section className="page-stack">
      <PageHeader eyebrow="Event Info" title={item?.title ?? (language === 'th' ? 'ประกาศ' : 'Announcement')} meta={<Link className="btn btn-secondary" to="/announcements">{language === 'th' ? 'กลับประกาศ' : 'Back'}</Link>} />
      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <div className="error-state">{state.error}</div> : null}
      {item ? (
        <Card>
          <AnnouncementCard item={item} detail />
          {item.image_url ? <img className="announcement-detail-image" src={item.image_url} alt="" /> : null}
          {item.file_url ? <iframe className="announcement-file-frame" src={item.file_url} title={item.title} /> : null}
        </Card>
      ) : !state.loading ? <div className="empty-state">{language === 'th' ? 'ไม่พบประกาศ' : 'Announcement not found'}</div> : null}
    </section>
  );
}
