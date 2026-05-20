import { Link } from 'react-router-dom';
import { AnnouncementCard } from '../components/AnnouncementCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { supabase } from '../lib/supabase';
import { fetchPublicAnnouncements, fetchStaffAnnouncements } from '../services/announcements';
import { fetchStaffAccessContext } from '../services/staff';

export function AnnouncementsPage() {
  const { language } = useLanguage();
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
    ['schedule', language === 'th' ? 'กำหนดการ' : 'Schedule'],
    ['map', language === 'th' ? 'แผนที่' : 'Maps'],
    ['traffic', language === 'th' ? 'จราจร' : 'Traffic'],
    ['emergency', language === 'th' ? 'ฉุกเฉิน' : 'Emergency'],
    ['faq', 'FAQ'],
    ['update', language === 'th' ? 'อัปเดตล่าสุด' : 'Latest updates'],
  ];
  return (
    <section className="page-stack">
      <PageHeader eyebrow="Event Info" title={language === 'th' ? 'ประกาศและข้อมูลกิจกรรม' : 'Announcements'} description={language === 'th' ? 'รวมกำหนดการ แผนที่ จุดลงทะเบียน จราจร และข้อมูลสำคัญ' : 'Schedules, maps, registration points, traffic plans, and important updates.'} />
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
        return (
          <Card key={type}>
            <h2>{label}</h2>
            <div className="announcement-grid">
              {items.map((item) => <Link key={item.id} to={`/announcements/${item.id}`}><AnnouncementCard item={item} compact /></Link>)}
            </div>
          </Card>
        );
      })}
    </section>
  );
}
