import { CalendarDays, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { getEventContent } from '../lib/eventContent';
import { formatBangkokDate } from '../lib/dateTime';
import type { EventRecord } from '../lib/eventTypes';
import { eventPath, eventStaffApplyPath, legacyDefaultEventRoute } from '../lib/eventRoutes';
import { fetchPublicEvents } from '../services/events';

function eventName(event: EventRecord, language: 'th' | 'en') {
  return language === 'th' ? event.name_th : event.name_en || event.name_th;
}

function eventDate(event: EventRecord, language: 'th' | 'en', fallback: string) {
  if (!event.start_date && !event.end_date) return fallback;
  if (event.start_date && event.end_date && event.start_date !== event.end_date) {
    return `${formatBangkokDate(event.start_date, language)} - ${formatBangkokDate(event.end_date, language)}`;
  }
  return formatBangkokDate(event.start_date ?? event.end_date, language);
}

function statusLabel(status: string, t: (key: string, params?: Record<string, string | number>) => string) {
  const keys: Record<string, string> = {
    active: 'statuses.active',
    published: 'statuses.published',
    registration_open: 'statuses.registrationOpen',
    staff_recruiting: 'statuses.staffRecruiting',
    draft: 'statuses.draft',
    completed: 'statuses.completed',
    archived: 'statuses.archived',
  };
  return keys[status] ? t(keys[status]) : status;
}

export function EventsPage() {
  const { language, t } = useLanguage();
  const state = useAsync(() => fetchPublicEvents(), []);
  const events = state.data ?? [];

  return (
    <section className="events-page page-stack">
      <PageHeader
        eyebrow="Events"
        title={t('events.title')}
        description={t('events.description')}
        actions={<Button variant="secondary" icon={<RefreshCw size={18} />} onClick={state.reload}>{t('common.refresh')}</Button>}
      />

      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? (
        <EmptyState
          title={t('events.loadErrorTitle')}
          description={t('events.loadErrorDescription')}
          action={<Button variant="secondary" onClick={state.reload}>{t('common.retry')}</Button>}
        />
      ) : null}

      {!state.loading && !state.error && events.length === 0 ? (
        <EmptyState
          title={t('events.emptyTitle')}
          description={t('events.emptyDescription')}
          action={<Link className="btn btn-primary" to={legacyDefaultEventRoute('home')}>{t('events.openParticipantList')}</Link>}
        />
      ) : null}

      {events.length ? (
        <div className="event-card-grid">
          {events.map((event) => (
            <Card className="event-card" key={event.id}>
              <div className="event-card-head">
                <span className={`status-pill status-${event.status}`}>{statusLabel(event.status, t)}</span>
                {event.academic_year ? <em>{t('events.academicYear', { year: event.academic_year })}</em> : null}
              </div>
              <div>
                <h2>{eventName(event, language)}</h2>
                <p>{getEventContent(event.slug)?.public.summaryTh ?? event.description ?? t('events.cardFallbackDescription')}</p>
              </div>
              <div className="event-card-meta">
                <span><CalendarDays size={16} /> {eventDate(event, language, t('events.dateToBeAnnounced'))}</span>
                <span><MapPin size={16} /> {event.location || t('events.locationToBeAnnounced')}</span>
              </div>
              <div className="event-card-actions">
                <Link className="btn btn-primary" to={event.status === 'staff_recruiting' ? eventStaffApplyPath(event.slug) : eventPath(event.slug)}>
                  {event.status === 'staff_recruiting'
                    ? t('events.applyAsStaff')
                    : t('common.viewDetails')}
                </Link>
                <Link className="btn btn-secondary" to={eventPath(event.slug)}>{t('common.details')}</Link>
                {event.slug === 'entaneer-bonding-69' ? (
                  <Link className="btn btn-secondary" to={legacyDefaultEventRoute('home')}>{t('events.currentList')}</Link>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
