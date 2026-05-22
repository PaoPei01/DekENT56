import { CheckCircle2, RefreshCw } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Toast, ToastState } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { eventPath } from '../lib/eventRoutes';
import type { EventSubmissionResult } from '../lib/eventTypes';
import { fetchEventBySlug, submitEventStaffApplication } from '../services/events';
import { errorMessage } from '../utils/error';

export function EventStaffApplyPage() {
  const { language } = useLanguage();
  const { eventSlug = '' } = useParams();
  const state = useAsync(() => fetchEventBySlug(eventSlug), [eventSlug]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredRole, setPreferredRole] = useState('');
  const [preferredTeam, setPreferredTeam] = useState('');
  const [availability, setAvailability] = useState('');
  const [motivation, setMotivation] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [result, setResult] = useState<EventSubmissionResult | null>(null);
  const event = state.data;
  const eventName = event ? (language === 'th' ? event.name_th : event.name_en || event.name_th) : '';

  async function submit(eventObject: FormEvent) {
    eventObject.preventDefault();
    try {
      setSaving(true);
      const submitted = await submitEventStaffApplication({
        eventSlug,
        email,
        phone,
        data: {
          preferred_role: preferredRole,
          preferred_team: preferredTeam,
          availability: { text: availability },
          motivation,
        },
      });
      setResult(submitted);
      if (!submitted.success) {
        setToast({ type: 'error', message: submitted.code === 'identity_verification_failed'
          ? (language === 'th' ? 'ไม่พบข้อมูลจากอีเมลและเบอร์โทรนี้' : 'No matching person was found for this email and phone.')
          : (language === 'th' ? 'กิจกรรมนี้ยังไม่เปิดรับสมัครทีมงาน' : 'Staff recruitment is not open for this event.') });
        return;
      }
      setToast({ type: 'success', message: language === 'th' ? 'ส่งใบสมัครทีมงานแล้ว' : 'Staff application submitted' });
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'ส่งใบสมัครไม่สำเร็จ' : 'Could not submit staff application') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="events-page narrow-page page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow="Staff Application"
        title={language === 'th' ? 'สมัครเป็นทีมงาน' : 'Apply as Staff'}
        description={language === 'th'
          ? 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทร จากนั้นตอบคำถามเฉพาะกิจกรรมนี้'
          : 'Verify with email and phone, then answer event-specific staff questions.'}
        actions={<Button variant="secondary" icon={<RefreshCw size={18} />} onClick={state.reload}>{language === 'th' ? 'รีเฟรช' : 'Refresh'}</Button>}
      />

      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <EmptyState title={language === 'th' ? 'โหลดกิจกรรมไม่สำเร็จ' : 'Could not load event'} action={<Button variant="secondary" onClick={state.reload}>{language === 'th' ? 'ลองใหม่' : 'Retry'}</Button>} /> : null}
      {!state.loading && !state.error && !event ? (
        <EmptyState title={language === 'th' ? 'ไม่พบกิจกรรมนี้' : 'Event not found'} action={<Link className="btn btn-primary" to="/events">{language === 'th' ? 'ดูกิจกรรมทั้งหมด' : 'View events'}</Link>} />
      ) : null}

      {event ? (
        <Card className="event-form-card">
          <div>
            <p className="eyebrow">{eventName}</p>
            <h2>{language === 'th' ? 'ส่งใบสมัครทีมงาน' : 'Submit staff application'}</h2>
            <p className="muted">{language === 'th' ? 'การสมัครนี้ยังไม่ให้สิทธิ์ทีมงานทันที ต้องรอผู้ดูแลตรวจสอบในเฟสถัดไป' : 'This does not grant staff access immediately. Admin review comes in the next phase.'}</p>
          </div>
          {result?.success ? (
            <div className="edit-success-card" role="status">
              <CheckCircle2 size={28} />
              <strong>{language === 'th' ? 'ส่งใบสมัครแล้ว' : 'Application submitted'}</strong>
              <span>{language === 'th' ? 'สถานะเริ่มต้น: submitted' : 'Initial status: submitted'}</span>
              <Link className="btn btn-secondary" to={eventPath(event.slug)}>{language === 'th' ? 'กลับไปหน้ากิจกรรม' : 'Back to event'}</Link>
            </div>
          ) : (
            <form className="form-grid" onSubmit={submit}>
              <Input label={language === 'th' ? 'อีเมล' : 'Email'} type="email" value={email} onChange={(eventInput) => setEmail(eventInput.target.value)} required />
              <Input label={language === 'th' ? 'เบอร์โทร' : 'Phone'} value={phone} onChange={(eventInput) => setPhone(eventInput.target.value)} required />
              <Select label={language === 'th' ? 'หน้าที่ที่สนใจ' : 'Preferred role'} value={preferredRole} onChange={(eventInput) => setPreferredRole(eventInput.target.value)} options={['พี่กลุ่ม', 'พี่ฐาน', 'พยาบาล/ฉุกเฉิน', 'เอกสาร/ลงทะเบียน', 'ทั่วไป']} />
              <Input label={language === 'th' ? 'ทีม/ฝ่ายที่สนใจ' : 'Preferred team'} value={preferredTeam} onChange={(eventInput) => setPreferredTeam(eventInput.target.value)} />
              <label className="field full-span">
                <span>{language === 'th' ? 'เวลาที่สะดวก' : 'Availability'}</span>
                <textarea value={availability} onChange={(eventInput) => setAvailability(eventInput.target.value)} rows={3} />
              </label>
              <label className="field full-span">
                <span>{language === 'th' ? 'เหตุผลที่อยากเป็นทีมงาน' : 'Motivation'}</span>
                <textarea value={motivation} onChange={(eventInput) => setMotivation(eventInput.target.value)} rows={4} required />
              </label>
              <div className="form-actions full-span">
                <Link className="btn btn-secondary" to={eventPath(event.slug)}>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</Link>
                <Button type="submit" loading={saving}>{language === 'th' ? 'ส่งใบสมัคร' : 'Submit application'}</Button>
              </div>
            </form>
          )}
        </Card>
      ) : null}
    </section>
  );
}
