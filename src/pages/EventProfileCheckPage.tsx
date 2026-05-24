import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Toast, ToastState } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { eventPath, eventStaffApplyPath } from '../lib/eventRoutes';
import { fetchEventBySlug, lookupPersonForApplication, submitPersonUpdateRequest, type PersonApplicationLookupResult } from '../services/events';
import { errorMessage } from '../utils/error';

const cmuEmailPattern = /^[a-zA-Z0-9._%+-]+@cmu\.ac\.th$/;

function isValidCmuEmail(value: string) {
  const clean = value.trim().toLowerCase();
  return !/\s/.test(value.trim()) && cmuEmailPattern.test(clean);
}

function safeFullName(person: PersonApplicationLookupResult['safe_person'] | undefined, missingLabel: string, fallback?: string) {
  return person?.name_th
    || person?.name_en
    || person?.full_name_th
    || person?.full_name_en
    || fallback?.trim()
    || missingLabel;
}

function safeNickname(person: PersonApplicationLookupResult['safe_person'] | undefined, missingLabel: string) {
  return person?.display_nickname
    || person?.nickname
    || person?.nickname_th
    || person?.nickname_en
    || missingLabel;
}

export function EventProfileCheckPage() {
  const { language, t } = useLanguage();
  const { eventSlug = '' } = useParams();
  const eventState = useAsync(() => fetchEventBySlug(eventSlug), [eventSlug]);
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [major, setMajor] = useState('');
  const [note, setNote] = useState('');
  const [lookup, setLookup] = useState<PersonApplicationLookupResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const event = eventState.data;

  async function checkProfile() {
    if (!studentId.trim() || !isValidCmuEmail(email)) {
      setToast({ type: 'error', message: t('identity.validIdentityRequired') });
      return;
    }
    try {
      setLoading(true);
      const result = await lookupPersonForApplication({ eventSlug, studentId, email, phone, nameTh, nameEn });
      if (result.success === false) {
        setToast({ type: 'error', message: result.message_th ?? t('identity.profileCheckFailed') });
        return;
      }
      setLookup(result);
      setToast({ type: result.identity_status === 'verified' ? 'success' : 'info', message: result.message_th ?? t('identity.profileChecked') });
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, t('identity.profileCheckFailed')) });
    } finally {
      setLoading(false);
    }
  }

  async function submitRequest() {
    if (!studentId.trim() || !isValidCmuEmail(email)) {
      setToast({ type: 'error', message: t('identity.validIdentityDetailsRequired') });
      return;
    }
    try {
      setSaving(true);
      const result = await submitPersonUpdateRequest({
        eventSlug,
        studentId,
        email,
        phone,
        nameTh,
        nameEn,
        major,
        requestType: lookup?.identity_status === 'not_found' ? 'identity_not_found' : 'email_correction',
        evidenceNote: note,
      });
      if (!result.success) {
        setToast({ type: 'error', message: result.message_th ?? t('identity.updateRequestFailed') });
        return;
      }
      setToast({ type: 'success', message: t('identity.updateRequestSubmitted') });
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, t('identity.updateRequestFailed')) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="events-page narrow-page page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow="Profile Check"
        title={t('identity.profileCheckTitle')}
        description={t('identity.profileCheckDescription')}
        actions={<Button variant="secondary" icon={<RefreshCw size={18} />} onClick={eventState.reload}>{t('common.refresh')}</Button>}
      />

      {eventState.loading ? <LoadingSkeleton /> : null}
      {eventState.error ? <EmptyState title={t('events.couldNotLoadEvent')} action={<Button variant="secondary" onClick={eventState.reload}>{t('common.retry')}</Button>} /> : null}

      {event ? (
        <Card className="event-form-card">
          <div>
            <p className="eyebrow">{language === 'th' ? event.name_th : event.name_en || event.name_th}</p>
            <h2>{t('identity.verifyWithStudentIdAndCmuMail')}</h2>
            <p className="muted">{t('identity.privacyProfileHint')}</p>
          </div>
          <div className="form-grid">
            <Input label={t('identity.studentId')} value={studentId} onChange={(input) => setStudentId(input.target.value)} required />
            <Input label={t('identity.currentCmuMail')} type="email" value={email} onChange={(input) => setEmail(input.target.value)} required />
            <Input label={t('identity.reachablePhone')} type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(input) => setPhone(input.target.value)} />
            <Input label={t('identity.fullName')} value={nameTh} onChange={(input) => setNameTh(input.target.value)} />
            <Input label={t('identity.englishNameOptional')} value={nameEn} onChange={(input) => setNameEn(input.target.value)} />
            <Input label={t('identity.major')} value={major} onChange={(input) => setMajor(input.target.value)} />
          </div>
          <div className="event-card-actions">
            <Button loading={loading} onClick={() => void checkProfile()}>{t('identity.checkData')}</Button>
            <Link className="btn btn-secondary" to={eventStaffApplyPath(event.slug)}>{t('events.applyAsStaff')}</Link>
          </div>
        </Card>
      ) : null}

      {lookup ? (
        <Card className="event-detail-card" variant={lookup.identity_status === 'verified' ? 'success' : 'warning'}>
          <div>
            <p className="eyebrow">{t('identity.lookupResult')}</p>
            <h2>{t('identity.dataFoundInSystem')}</h2>
            <p className="muted">{lookup.message_th ?? t('identity.outdatedDataHint')}</p>
          </div>
          {lookup.safe_person ? (
            <div className="event-fact-grid">
              <span><strong>{t('common.fullName')}</strong>{safeFullName(lookup.safe_person, t('identity.missingFullName'), nameTh)}</span>
              <span><strong>{t('common.nickname')}</strong>{safeNickname(lookup.safe_person, t('identity.missingNickname'))}</span>
              <span><strong>{t('identity.studentId')}</strong>{lookup.safe_person.student_id ?? '-'}</span>
              <span><strong>{t('common.major')}</strong>{lookup.safe_person.major ?? '-'}</span>
              <span><strong>{t('identity.systemCmuMail')}</strong>{lookup.safe_person.masked_email ?? '-'}</span>
              <span><strong>{t('identity.systemPhone')}</strong>{lookup.safe_person.masked_phone ?? '-'}</span>
            </div>
          ) : (
            <p>{t('identity.noStudentRecord')}</p>
          )}
          {lookup.identity_status !== 'verified' ? (
            <div className="page-stack">
              <p className="muted">{t('identity.oldCmuMailHint')}</p>
              <label className="field">
                <span>{t('identity.noteForAdmin')}</span>
                <textarea rows={3} value={note} onChange={(input) => setNote(input.target.value)} />
              </label>
              <Button loading={saving} onClick={() => void submitRequest()}>{t('identity.submitCorrectionRequest')}</Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="event-actions-card" variant="soft">
        <div className="event-card-actions">
          <Link className="btn btn-secondary" to={eventPath(eventSlug)}>{t('common.backToEvent')}</Link>
          <Link className="btn btn-primary" to={eventStaffApplyPath(eventSlug)}>{t('events.applyAsStaff')}</Link>
        </div>
      </Card>
    </section>
  );
}
