import { Camera, CheckCircle2, Clock, Copy, History, Home, Link2, ShieldCheck } from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { DashboardStatCard } from '../components/ui/DashboardStatCard';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { Toast, ToastState } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import type { MyStaffAttendanceData } from '../lib/attendanceTypes';
import { formatBangkokDateTime } from '../lib/dateTime';
import { supabase } from '../lib/supabase';
import { fetchMyStaffAttendance, scanStaffAttendanceSessionQr } from '../services/staffAttendance';
import { errorMessage } from '../utils/error';

function displayName(profile: { nickname_th?: string | null; nickname?: string | null; nickname_en?: string | null; name_th?: string | null; name_en?: string | null; email?: string | null } | null | undefined) {
  return profile?.nickname_th || profile?.nickname || profile?.nickname_en || profile?.name_th || profile?.name_en || profile?.email || '-';
}

function statusLabel(status: string | null | undefined, language: 'th' | 'en') {
  const labels: Record<string, { th: string; en: string }> = {
    present: { th: 'มาแล้ว', en: 'Present' },
    late: { th: 'มาสาย', en: 'Late' },
    absent: { th: 'ขาด', en: 'Absent' },
    excused: { th: 'ขออนุญาต', en: 'Excused' },
    checked_out: { th: 'เช็กออก', en: 'Checked out' },
    cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
  };
  return status ? labels[status]?.[language] ?? status : language === 'th' ? 'ยังไม่เช็ก' : 'Not checked';
}

function tokenFromInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('token') ?? trimmed;
  } catch {
    return trimmed.replace(/^.*token=/, '').trim();
  }
}

export function StaffAttendancePage() {
  const { language } = useLanguage();
  const [data, setData] = useState<MyStaffAttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const navigate = useNavigate();
  const activeSessions = useMemo(() => data?.active_sessions ?? [], [data?.active_sessions]);
  const records = useMemo(() => data?.records ?? [], [data?.records]);
  const latest = data?.latest_record;
  const counts = useMemo(() => ({
    active: activeSessions.length,
    checked: activeSessions.filter((session) => session.record).length,
    late: records.filter((record) => record.status === 'late').length,
  }), [activeSessions, records]);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: userData } = await supabase.auth.getUser();
      setIsAuthenticated(Boolean(userData.user));
      if (!userData.user) {
        setData(null);
        return;
      }
      setData(await fetchMyStaffAttendance());
    } catch (err) {
      setError(errorMessage(err, language === 'th' ? 'โหลดข้อมูลเช็กชื่อไม่สำเร็จ' : 'Could not load attendance'));
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    void loadAttendance();
  }, [loadAttendance]);

  async function pasteTokenCheckIn(event: FormEvent) {
    event.preventDefault();
    const token = tokenFromInput(tokenInput);
    if (!token) {
      setToast({ type: 'error', message: language === 'th' ? 'กรุณาวางลิงก์หรือ token QR' : 'Paste a scan link or QR token first.' });
      return;
    }
    try {
      setChecking(true);
      if (!isAuthenticated) {
        navigate(`/staff/attendance/scan?token=${encodeURIComponent(token)}`);
        return;
      }
      const result = await scanStaffAttendanceSessionQr(token, { source: 'staff_attendance_page', userAgent: navigator.userAgent });
      if (result.code === 'staff_not_found') {
        navigate(`/staff/attendance/scan?token=${encodeURIComponent(token)}`);
        return;
      }
      setToast({ type: result.success ? 'success' : 'error', message: resultMessage(result.code, language) });
      await loadAttendance();
      setTokenInput('');
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'เช็กชื่อไม่สำเร็จ' : 'Check-in failed') });
    } finally {
      setChecking(false);
    }
  }

  if (loading) return <LoadingSkeleton />;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <section className="page-stack staff-page staff-attendance-home">
      <Toast toast={toast} />
      <PageHeader
        eyebrow="Staff Attendance"
        title={language === 'th' ? 'เช็กชื่อทีมงาน' : 'Staff Attendance'}
        description={language === 'th' ? 'สแกน QR Code ของรอบเช็กชื่อด้วยกล้องมือถือ หรือเปิดลิงก์ที่ได้รับ' : 'Scan the attendance QR code with your phone camera, or open the link you received.'}
        actions={isAuthenticated ? <Link className="btn btn-secondary" to="/staff"><Home size={18} />{language === 'th' ? 'หน้าสตาฟ' : 'Staff Home'}</Link> : <Link className="btn btn-secondary" to="/login">{language === 'th' ? 'เข้าสู่ระบบทีมงาน' : 'Staff Login'}</Link>}
      />

      {isAuthenticated ? <div className="stats-grid">
        <DashboardStatCard label={language === 'th' ? 'ชื่อทีมงาน' : 'Staff'} value={displayName(data?.staff_profile)} icon={<ShieldCheck size={20} />} />
        <DashboardStatCard label={language === 'th' ? 'รอบที่เปิดอยู่' : 'Active sessions'} value={counts.active} icon={<Clock size={20} />} />
        <DashboardStatCard label={language === 'th' ? 'เช็กแล้ว' : 'Checked'} value={counts.checked} icon={<CheckCircle2 size={20} />} />
        <DashboardStatCard label={language === 'th' ? 'ประวัติ' : 'History'} value={records.length} icon={<History size={20} />} />
      </div> : null}

      <Card className="staff-attendance-primary" variant="soft">
        <div className="attendance-camera-icon"><Camera size={28} /></div>
        <div>
          <p className="eyebrow">{language === 'th' ? 'วิธีหลัก' : 'Primary flow'}</p>
          <h2>{language === 'th' ? 'สแกน QR Code ของรอบเช็กชื่อ' : 'Scan the attendance QR code'}</h2>
          <p>{language === 'th' ? 'เปิดกล้องมือถือแล้วสแกน QR ที่แอดมินแสดงไว้ หากไม่ได้เข้าสู่ระบบ ระบบจะให้ยืนยันด้วยอีเมลและเบอร์โทรที่ลงทะเบียนทีมงาน' : 'Use your phone camera to scan the QR shown by admins. If you are not signed in, you can verify with your staff email and phone.'}</p>
        </div>
      </Card>

      <Card className="privacy-notice" variant="soft">
        <strong>{language === 'th' ? 'QR ส่วนตัวทีมงาน' : 'Staff personal QR'}</strong>
        <span>{language === 'th' ? 'สำหรับให้แอดมินสแกนเช็กชื่อแทนเท่านั้น ไม่ใช่ QR เช็กชื่อด้วยตัวเอง' : 'For admin-assisted check-in only. This is not a self check-in QR.'}</span>
        <Link className="btn btn-secondary" to="/staff/profile/qr">{language === 'th' ? 'แสดง QR ส่วนตัว' : 'Show personal QR'}</Link>
      </Card>

      <Card>
        <form className="form-grid" onSubmit={pasteTokenCheckIn}>
          <Input
            label={language === 'th' ? 'ลิงก์หรือ token สำรอง' : 'Fallback link or token'}
            value={tokenInput}
            onChange={(event) => setTokenInput(event.target.value)}
            placeholder={language === 'th' ? 'วางลิงก์จาก QR หากกล้องเปิดไม่ได้' : 'Paste the QR link if camera scan is not available'}
            hint={language === 'th' ? 'ใช้เฉพาะกรณีสแกนด้วยกล้องไม่ได้' : 'Use only if camera scanning is not available.'}
          />
          <Button type="submit" loading={checking} icon={<Link2 size={18} />}>{language === 'th' ? 'เช็กชื่อ' : 'Check in'}</Button>
        </form>
      </Card>

      {isAuthenticated ? <div className="staff-section-head">
        <h2>{language === 'th' ? 'รอบเช็กชื่อที่เปิดอยู่' : 'Active attendance sessions'}</h2>
        <span>{activeSessions.length} {language === 'th' ? 'รอบ' : 'sessions'}</span>
      </div> : null}
      {isAuthenticated ? <div className="attendance-session-grid">
        {activeSessions.length ? activeSessions.map((session) => (
          <Card key={session.id} className="attendance-session-card">
            <div>
              <strong>{session.title}</strong>
              <span>{formatBangkokDateTime(session.starts_at, language)} · {statusLabel(session.record?.status, language)}</span>
            </div>
            {session.record ? (
              <span className={`status-pill status-${session.record.status}`}>{statusLabel(session.record.status, language)}</span>
            ) : (
              <Button size="sm" variant="secondary" icon={<Copy size={16} />} onClick={() => navigate(`/staff/attendance/scan?token=${session.qr_token ?? ''}`)} disabled={!session.qr_token}>
                {language === 'th' ? 'เปิดลิงก์เช็กชื่อ' : 'Open check-in link'}
              </Button>
            )}
          </Card>
        )) : (
          <Card className="empty-state">{language === 'th' ? 'ยังไม่มีรอบเช็กชื่อที่เปิดอยู่สำหรับบัญชีนี้' : 'No active attendance sessions for this account right now.'}</Card>
        )}
      </div> : (
        <Card className="privacy-notice" variant="soft">
          <strong>{language === 'th' ? 'ไม่จำเป็นต้องมีบัญชีเข้าสู่ระบบ' : 'No login required'}</strong>
          <span>{language === 'th' ? 'ถ้าไม่มีบัญชีทีมงาน ให้สแกน QR หรือวางลิงก์ ระบบจะให้กรอกอีเมลและเบอร์โทรเพื่อยืนยันตัวตนก่อนเช็กชื่อ' : 'If you do not have a staff login, scan the QR or paste the link and verify with email and phone.'}</span>
        </Card>
      )}

      {latest ? (
        <Card className="privacy-notice" variant="success">
          <strong>{language === 'th' ? 'สถานะล่าสุด' : 'Latest status'}</strong>
          <span>{latest.session?.title ?? '-'} · {statusLabel(latest.status, language)} · {formatBangkokDateTime(latest.scanned_at ?? latest.updated_at, language)}</span>
        </Card>
      ) : null}

      {isAuthenticated ? <ResponsiveDataTable
        rows={records}
        getKey={(row) => row.id}
        emptyText={language === 'th' ? 'ยังไม่มีประวัติการเช็กชื่อ' : 'No attendance history yet'}
        mobileTitle={(row) => row.session?.title ?? '-'}
        mobileSubtitle={(row) => statusLabel(row.status, language)}
        mobileMeta={(row) => formatBangkokDateTime(row.scanned_at ?? row.updated_at, language)}
        columns={[
          { key: 'session', header: language === 'th' ? 'รอบ' : 'Session', render: (row) => row.session?.title ?? '-' },
          { key: 'status', header: language === 'th' ? 'สถานะ' : 'Status', render: (row) => <span className={`status-pill status-${row.status}`}>{statusLabel(row.status, language)}</span> },
          { key: 'time', header: language === 'th' ? 'เวลา' : 'Time', render: (row) => formatBangkokDateTime(row.scanned_at ?? row.updated_at, language) },
          { key: 'method', header: language === 'th' ? 'วิธี' : 'Method', render: (row) => row.method },
        ]}
      /> : null}
    </section>
  );
}

function resultMessage(code: string, language: 'th' | 'en') {
  const messages: Record<string, { th: string; en: string }> = {
    checked_in: { th: 'เช็กชื่อสำเร็จ', en: 'Check-in successful' },
    late: { th: 'เช็กชื่อสำเร็จ แต่ระบบบันทึกเป็นมาสาย', en: 'Checked in as late' },
    checked_out: { th: 'เช็กออกสำเร็จ', en: 'Checked out successfully' },
    already_checked: { th: 'คุณเช็กชื่อรอบนี้แล้ว', en: 'You have already checked in' },
    session_not_found: { th: 'ไม่พบรอบเช็กชื่อ', en: 'Attendance session not found' },
    session_not_active: { th: 'รอบเช็กชื่อนี้ยังไม่เปิดใช้งาน', en: 'This session is not active' },
    session_not_started: { th: 'รอบเช็กชื่อนี้ยังไม่เริ่ม', en: 'This session has not started' },
    session_closed: { th: 'รอบเช็กชื่อนี้ปิดแล้ว', en: 'This session is closed' },
    qr_expired: { th: 'QR หมดอายุแล้ว', en: 'QR has expired' },
    staff_not_found: { th: 'ไม่พบข้อมูลทีมงานของบัญชีนี้', en: 'Staff profile not found' },
    identity_verification_failed: { th: 'ไม่พบข้อมูลทีมงานจากอีเมลและเบอร์โทรนี้', en: 'No staff profile found for this email and phone' },
    not_in_target_scope: { th: 'บัญชีนี้ไม่มีสิทธิ์เช็กชื่อรอบนี้', en: 'This account is not allowed for this session' },
  };
  return messages[code]?.[language] ?? (language === 'th' ? 'ดำเนินการแล้ว' : 'Done');
}
