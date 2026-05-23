import { ArrowLeft, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { formatBangkokDateTime } from '../lib/dateTime';
import { adminEventPath, eventPath } from '../lib/eventRoutes';
import { fetchAdminEventById, fetchAdminEventStaffApplications, type AdminStaffApplicationRow } from '../services/events';

function applicantName(row: AdminStaffApplicationRow) {
  return row.people?.nickname || row.people?.name_th || row.people?.name_en || row.people?.student_id || 'ผู้สมัคร';
}

function answerText(value: unknown) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object' && 'text' in value) return String((value as { text?: unknown }).text ?? '-');
  return value == null || value === '' ? '-' : String(value);
}

export function AdminEventApplicationsPage() {
  const { language } = useLanguage();
  const { eventId = '' } = useParams();
  const eventState = useAsync(() => fetchAdminEventById(eventId), [eventId]);
  const applicationsState = useAsync(() => fetchAdminEventStaffApplications(eventId), [eventId]);
  const event = eventState.data;
  const rows = applicationsState.data ?? [];

  return (
    <section className="events-page page-stack">
      <PageHeader
        eyebrow="Applications"
        title={language === 'th' ? 'ใบสมัครสตาฟกิจกรรม' : 'Event Staff Applications'}
        description={event
          ? `${language === 'th' ? event.name_th : event.name_en || event.name_th}`
          : (language === 'th' ? 'ตรวจรายการใบสมัครสำหรับกิจกรรมที่เลือก' : 'Review applications for the selected event.')}
        actions={(
          <>
            <Link className="btn btn-secondary" to="/admin/events"><ArrowLeft size={17} />{language === 'th' ? 'กลับรายการกิจกรรม' : 'Back to events'}</Link>
            {event ? <Link className="btn btn-secondary" to={eventPath(event.slug)}>{language === 'th' ? 'ดูหน้าสาธารณะ' : 'Public page'}</Link> : null}
            <Button variant="secondary" icon={<RefreshCw size={18} />} onClick={() => { void eventState.reload(); void applicationsState.reload(); }}>{language === 'th' ? 'รีเฟรช' : 'Refresh'}</Button>
          </>
        )}
      />

      {eventState.loading || applicationsState.loading ? <LoadingSkeleton /> : null}
      {eventState.error || applicationsState.error ? (
        <EmptyState
          title={language === 'th' ? 'โหลดใบสมัครไม่สำเร็จ' : 'Could not load applications'}
          description={language === 'th' ? 'กรุณาลองใหม่ หรือยืนยันว่า migration staff_applications ถูก apply แล้ว' : 'Please retry or confirm that the staff applications migration has been applied.'}
          action={<Button variant="secondary" onClick={() => { void eventState.reload(); void applicationsState.reload(); }}>{language === 'th' ? 'ลองใหม่' : 'Retry'}</Button>}
        />
      ) : null}

      {!eventState.loading && !eventState.error && !event ? (
        <EmptyState
          title={language === 'th' ? 'ไม่พบกิจกรรมนี้' : 'Event not found'}
          action={<Link className="btn btn-primary" to="/admin/events">{language === 'th' ? 'กลับไปกิจกรรมทั้งหมด' : 'Back to events'}</Link>}
        />
      ) : null}

      {event ? (
        <>
          <Card className="event-detail-card" variant="soft">
            <div>
              <p className="eyebrow">{language === 'th' ? 'สถานะหน้านี้' : 'Page status'}</p>
              <h2>{language === 'th' ? 'ดูใบสมัครแบบอ่านอย่างเดียว' : 'Read-only application review'}</h2>
              <p className="muted">{language === 'th' ? 'การอนุมัติ/ปฏิเสธและการจัดสรรหน้าที่จะเพิ่มในเฟสถัดไป เพื่อหลีกเลี่ยงการเปลี่ยนสถานะผิดระหว่าง pilot' : 'Approve/reject and final duty assignment will be added in a later phase to avoid accidental status changes during the pilot.'}</p>
            </div>
          </Card>

          <ResponsiveDataTable
            rows={rows}
            getKey={(row) => row.id}
            emptyText={language === 'th' ? 'ยังไม่มีใบสมัครสตาฟสำหรับกิจกรรมนี้' : 'No staff applications for this event yet'}
            mobileTitle={(row) => applicantName(row)}
            mobileSubtitle={(row) => `${row.status} · ${row.people?.major ?? '-'}`}
            mobileMeta={(row) => formatBangkokDateTime(row.submitted_at, language)}
            columns={[
              { key: 'name', header: language === 'th' ? 'ผู้สมัคร' : 'Applicant', render: (row) => <strong>{applicantName(row)}</strong>, priority: 'primary' },
              { key: 'student', header: language === 'th' ? 'รหัส/ชั้นปี' : 'ID/Year', render: (row) => `${row.people?.student_id ?? '-'} · ${row.people?.year_level ?? '-'}` },
              { key: 'major', header: language === 'th' ? 'สาขา' : 'Major', render: (row) => row.people?.major ?? '-' },
              { key: 'duties', header: language === 'th' ? 'ฝ่ายที่สนใจ' : 'Preferred duties', render: (row) => answerText(row.answers?.preferred_duties ?? row.preferred_team), mobileLabel: language === 'th' ? 'ฝ่าย' : 'Duties' },
              { key: 'rehearsal', header: language === 'th' ? 'ซ้อม' : 'Rehearsal', render: (row) => answerText(row.answers?.can_attend_rehearsal), mobileLabel: language === 'th' ? 'ซ้อม' : 'Rehearsal' },
              { key: 'eventDay', header: language === 'th' ? 'วันจริง' : 'Event day', render: (row) => answerText(row.answers?.can_work_event_day), mobileLabel: language === 'th' ? 'วันจริง' : 'Event day' },
              { key: 'status', header: language === 'th' ? 'สถานะ' : 'Status', render: (row) => <span className={`status-pill status-${row.status}`}>{row.status}</span> },
              { key: 'submitted', header: language === 'th' ? 'ส่งเมื่อ' : 'Submitted', render: (row) => formatBangkokDateTime(row.submitted_at, language), mobileHidden: true },
            ]}
          />

          <div className="form-actions">
            <Link className="btn btn-secondary" to={adminEventPath(event.id)}>{language === 'th' ? 'กลับหน้าจัดการกิจกรรม' : 'Back to event admin'}</Link>
          </div>
        </>
      ) : null}
    </section>
  );
}
