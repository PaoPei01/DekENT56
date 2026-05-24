import { Link } from 'react-router-dom';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { fetchPublicAnnouncements, fetchStaffAnnouncements } from '../services/announcements';
import { fetchStaffAccessContext } from '../services/staff';

export function AnnouncementsPage() {
  const { t } = useLanguage();
  const state = useAsync(async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return fetchPublicAnnouncements();
    try {
      const access = await fetchStaffAccessContext();
      if (access.is_admin || access.can_view_staff || access.can_mark_attendance || access.can_view_emergency) {
        return fetchStaffAnnouncements();
      }
    } catch {
      // Fall back to privacy-safe public announcements.
    }
    return fetchPublicAnnouncements();
  }, []);
  const rows = state.data ?? [];
  const critical = rows.find((item) => item.priority === 'critical');
  const pinned = rows.filter((item) => item.is_pinned);
  const sections = [
    ['banner', t('announcements.banners')],
    ['schedule', t('announcements.schedule')],
    ['map', t('announcements.maps')],
    ['traffic', t('announcements.traffic')],
    ['emergency', t('announcements.emergency')],
    ['faq', 'FAQ'],
    ['document', t('announcements.documents')],
    ['update', t('announcements.latestUpdates')],
  ];
  const shownIds = new Set<string>();
  return (
    <section className="page-stack">
      <PageHeader eyebrow="Event Info" title={t('announcements.title')} description={t('announcements.description')} />
      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <div className="error-state">{state.error}</div> : null}
      {critical ? <Card className="critical-announcement"><AnnouncementCard item={critical} /></Card> : null}
      {pinned.length ? (
        <div className="announcement-carousel">
          {pinned.map((item) => <Link key={item.id} to={`/announcements/${item.id}`}><AnnouncementCard item={item} /></Link>)}
        </div>
      ) : null}
      {sections.map(([type, label]) => {
        const items = rows.filter((item) => item.type === type);
        if (!items.length) return null;
        items.forEach((item) => shownIds.add(item.id));
        return (
          <Card key={type}>
            <h2>{label}</h2>
            <div className="announcement-grid">
              {items.map((item) => <Link key={item.id} to={`/announcements/${item.id}`}><AnnouncementCard item={item} compact /></Link>)}
            </div>
          </Card>
        );
      })}
      {!state.loading && !state.error && !rows.length ? (
        <EmptyState
          title={t('announcements.emptyTitle')}
          description={t('announcements.emptyDescription')}
        />
      ) : null}
      {rows.filter((item) => !shownIds.has(item.id) && item.priority !== 'critical' && !item.is_pinned).length ? (
        <Card>
          <h2>{t('announcements.other')}</h2>
          <div className="announcement-grid">
            {rows.filter((item) => !shownIds.has(item.id) && item.priority !== 'critical' && !item.is_pinned).map((item) => <Link key={item.id} to={`/announcements/${item.id}`}><AnnouncementCard item={item} compact /></Link>)}
          </div>
        </Card>
      ) : null}
    </section>
  );
}
