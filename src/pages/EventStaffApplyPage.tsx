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
import { getEventContent } from '../lib/eventContent';
import { eventPath } from '../lib/eventRoutes';
import type { EventSubmissionResult } from '../lib/eventTypes';
import { fetchEventBySlug, submitEventStaffApplication } from '../services/events';
import { errorMessage } from '../utils/error';

export function EventStaffApplyPage() {
  const { language } = useLanguage();
  const { eventSlug = '' } = useParams();
  const state = useAsync(() => fetchEventBySlug(eventSlug), [eventSlug]);
  const content = getEventContent(eventSlug);
  const recruitment = content?.staffRecruitment;
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedDuties, setSelectedDuties] = useState<string[]>([]);
  const [availability, setAvailability] = useState('');
  const [canAttendRehearsal, setCanAttendRehearsal] = useState('');
  const [canWorkEventDay, setCanWorkEventDay] = useState('');
  const [staffExperience, setStaffExperience] = useState('');
  const [healthOrLimitations, setHealthOrLimitations] = useState('');
  const [note, setNote] = useState('');
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [result, setResult] = useState<EventSubmissionResult | null>(null);
  const event = state.data;
  const eventName = event ? (language === 'th' ? event.name_th : event.name_en || event.name_th) : '';
  const canSubmit = Boolean(
    eventSlug === 'parent-orientation-staff-2569'
    && selectedDuties.length
    && availability.trim()
    && canAttendRehearsal
    && canWorkEventDay
    && recruitment?.consentItemsTh.every((item) => consents[item])
  );

  function toggleDuty(duty: string) {
    setSelectedDuties((current) => current.includes(duty) ? current.filter((item) => item !== duty) : [...current, duty]);
  }

  async function submit(eventObject: FormEvent) {
    eventObject.preventDefault();
    try {
      setSaving(true);
      const submitted = await submitEventStaffApplication({
        eventSlug,
          email,
          phone,
          data: {
          student_id: studentId,
          preferred_role: selectedDuties[0] ?? null,
          preferred_team: selectedDuties.join(', '),
          preferred_duties: selectedDuties,
          availability: { text: availability },
          can_attend_rehearsal: canAttendRehearsal,
          can_work_event_day: canWorkEventDay,
          experience: staffExperience,
          health_or_limitations: healthOrLimitations,
          note,
          consent_items: consents,
          motivation: note || 'Parent orientation staff application',
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
        title={language === 'th' ? 'สมัครเป็นสตาฟ' : 'Apply as Staff'}
        description={language === 'th'
          ? 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทร จากนั้นเลือกหน้าที่และตอบคำถามเฉพาะกิจกรรมนี้'
          : 'Verify with email and phone, then answer event-specific staff questions.'}
        actions={<Button variant="secondary" icon={<RefreshCw size={18} />} onClick={state.reload}>{language === 'th' ? 'รีเฟรช' : 'Refresh'}</Button>}
      />

      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <EmptyState title={language === 'th' ? 'โหลดกิจกรรมไม่สำเร็จ' : 'Could not load event'} action={<Button variant="secondary" onClick={state.reload}>{language === 'th' ? 'ลองใหม่' : 'Retry'}</Button>} /> : null}
      {!state.loading && !state.error && !event ? (
        <EmptyState title={language === 'th' ? 'ไม่พบกิจกรรมนี้' : 'Event not found'} action={<Link className="btn btn-primary" to="/events">{language === 'th' ? 'ดูกิจกรรมทั้งหมด' : 'View events'}</Link>} />
      ) : null}

      {event && eventSlug !== 'parent-orientation-staff-2569' ? (
        <EmptyState
          title={language === 'th' ? 'กิจกรรมนี้ยังไม่เปิดรับสมัครสตาฟ' : 'Staff applications are not open for this event'}
          description={language === 'th' ? 'ตอนนี้เปิด pilot สำหรับงานปฐมนิเทศผู้ปกครองเท่านั้น' : 'The pilot application flow is currently enabled only for Parent Orientation.'}
          action={<Link className="btn btn-secondary" to={eventPath(event.slug)}>{language === 'th' ? 'กลับไปหน้ากิจกรรม' : 'Back to event'}</Link>}
        />
      ) : null}

      {event && eventSlug === 'parent-orientation-staff-2569' ? (
        <Card className="event-form-card">
          <div>
            <p className="eyebrow">{eventName}</p>
            <h2>{language === 'th' ? 'ใบสมัครสตาฟงานปฐมนิเทศผู้ปกครอง' : 'Parent Orientation staff application'}</h2>
            <p className="muted">{language === 'th' ? 'การสมัครนี้ยังไม่ให้สิทธิ์ทีมงานทันที ต้องรอผู้ดูแลตรวจสอบและจัดสรรหน้าที่' : 'This does not grant staff access immediately. Admin review and duty assignment are required.'}</p>
          </div>
          <div className="edit-stepper" aria-label={language === 'th' ? 'ขั้นตอนสมัครสตาฟ' : 'Staff application steps'}>
            <span className="edit-step edit-step-active">1. {language === 'th' ? 'ยืนยันตัวตน' : 'Verify'}</span>
            <span className="edit-step edit-step-active">2. {language === 'th' ? 'เลือกหน้าที่' : 'Duties'}</span>
            <span className="edit-step edit-step-active">3. {language === 'th' ? 'ยืนยันและส่ง' : 'Submit'}</span>
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
              <div className="event-form-section full-span">
                <h3>{language === 'th' ? '1. ยืนยันตัวตน' : '1. Verify identity'}</h3>
                <p className="muted">{language === 'th' ? 'ใช้ข้อมูลที่ตรงกับฐานข้อมูลบุคคลของคณะ หากไม่พบข้อมูล ระบบจะยังไม่บันทึกใบสมัคร' : 'Use information matching the faculty person record. If no match is found, the application is not saved.'}</p>
              </div>
              <Input label={language === 'th' ? 'รหัสนักศึกษา' : 'Student ID'} value={studentId} onChange={(eventInput) => setStudentId(eventInput.target.value)} />
              <Input label={language === 'th' ? 'อีเมล' : 'Email'} type="email" value={email} onChange={(eventInput) => setEmail(eventInput.target.value)} required />
              <Input label={language === 'th' ? 'เบอร์โทร' : 'Phone'} value={phone} onChange={(eventInput) => setPhone(eventInput.target.value)} required />

              <div className="event-form-section full-span">
                <h3>{language === 'th' ? '2. เลือกหน้าที่และเวลาที่สะดวก' : '2. Duties and availability'}</h3>
                <p className="muted">{language === 'th' ? 'เลือกได้มากกว่าหนึ่งฝ่าย มีการแบ่งหน้าที่จริงอีกครั้งหลังปิดรับสมัคร' : 'You can choose more than one duty. Final assignment happens after applications close.'}</p>
              </div>
              <fieldset className="event-checkbox-grid full-span">
                <legend>{language === 'th' ? 'ฝ่ายที่สนใจ' : 'Preferred duties'}</legend>
                {recruitment?.dutiesTh.map((duty) => (
                  <label key={duty}>
                    <input type="checkbox" checked={selectedDuties.includes(duty)} onChange={() => toggleDuty(duty)} />
                    <span>{duty}</span>
                  </label>
                ))}
              </fieldset>
              <label className="field full-span">
                <span>{language === 'th' ? 'เวลาที่สะดวก' : 'Availability'}</span>
                <textarea value={availability} onChange={(eventInput) => setAvailability(eventInput.target.value)} rows={3} />
                <small>{language === 'th' ? 'หากสามารถอยู่ได้ทั้งวันให้ระบุว่า “ทั้งวัน”' : 'If you are available all day, write “all day”.'}</small>
              </label>
              <Select label={language === 'th' ? 'เข้าซ้อมวันที่ 10 มิ.ย. 2569 เวลา 16:00 น. ได้หรือไม่' : 'Can attend rehearsal?'} value={canAttendRehearsal} onChange={(eventInput) => setCanAttendRehearsal(eventInput.target.value)} options={['ได้', 'ไม่ได้', 'ยังไม่แน่ใจ']} required />
              <Select label={language === 'th' ? 'ปฏิบัติงานวันที่ 12 มิ.ย. 2569 ได้หรือไม่' : 'Can work on event day?'} value={canWorkEventDay} onChange={(eventInput) => setCanWorkEventDay(eventInput.target.value)} options={['ได้', 'ไม่ได้', 'ยังไม่แน่ใจ']} required />

              <div className="event-form-section full-span">
                <h3>{language === 'th' ? '3. ข้อมูลเพิ่มเติม' : '3. Additional information'}</h3>
              </div>
              <label className="field full-span">
                <span>{language === 'th' ? 'เคยมีประสบการณ์เป็นสตาฟหรือไม่' : 'Staff experience'}</span>
                <textarea value={staffExperience} onChange={(eventInput) => setStaffExperience(eventInput.target.value)} rows={3} />
              </label>
              <label className="field full-span">
                <span>{language === 'th' ? 'ข้อจำกัดด้านสุขภาพ/การแพ้อาหารที่จำเป็นต้องแจ้ง' : 'Health or food limitations needed for assignment'}</span>
                <textarea value={healthOrLimitations} onChange={(eventInput) => setHealthOrLimitations(eventInput.target.value)} rows={3} />
                <small>{language === 'th' ? 'กรอกเฉพาะข้อมูลที่จำเป็นต่อการจัดสรรหน้าที่และดูแลความปลอดภัย' : 'Only enter what is necessary for duty assignment and safety.'}</small>
              </label>
              <label className="field full-span">
                <span>{language === 'th' ? 'หมายเหตุเพิ่มเติม' : 'Additional note'}</span>
                <textarea value={note} onChange={(eventInput) => setNote(eventInput.target.value)} rows={3} />
              </label>

              <fieldset className="event-checkbox-grid full-span">
                <legend>{language === 'th' ? 'การยืนยัน' : 'Consent'}</legend>
                {recruitment?.consentItemsTh.map((item) => (
                  <label key={item}>
                    <input type="checkbox" checked={Boolean(consents[item])} onChange={(eventInput) => setConsents({ ...consents, [item]: eventInput.target.checked })} />
                    <span>{item}</span>
                  </label>
                ))}
              </fieldset>
              <div className="form-actions full-span">
                <Link className="btn btn-secondary" to={eventPath(event.slug)}>{language === 'th' ? 'ยกเลิก' : 'Cancel'}</Link>
                <Button type="submit" loading={saving} disabled={!canSubmit || saving}>{language === 'th' ? 'ส่งใบสมัคร' : 'Submit application'}</Button>
              </div>
            </form>
          )}
        </Card>
      ) : null}
    </section>
  );
}
