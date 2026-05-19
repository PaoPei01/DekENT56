import { AlertTriangle, ClipboardCheck, Search, ShieldAlert, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { DashboardStatCard } from '../components/ui/DashboardStatCard';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { groupLabel } from '../lib/grouping';
import { fetchStaffAccessContext, fetchStaffGroupContext } from '../services/staff';

export function StaffDashboardPage() {
  const { language } = useLanguage();
  const state = useAsync(fetchStaffGroupContext, []);
  const accessState = useAsync(fetchStaffAccessContext, []);
  const context = state.data;
  const access = context?.access ?? accessState.data;
  const assignedLabel = context?.assignment?.main_group ? groupLabel(context.assignment.main_group, context.assignment.subgroup, language) : access?.is_admin || access?.roles.includes('emergency_staff') ? (language === 'th' ? 'ทุกกลุ่ม' : 'All groups') : '-';
  const medicalCount = (context?.participants ?? []).filter((profile) => profile.disease || profile.drug_allergy || profile.food_allergy).length;
  const isEmergencyOnly = Boolean(access?.roles.includes('emergency_staff') && !access?.roles.some((role) => ['staff', 'mentor', 'viewer'].includes(role)));

  if (state.loading || accessState.loading) return <LoadingSkeleton />;
  if (state.error && !accessState.data?.can_view_emergency) return <div className="error-state">{state.error}</div>;
  if (!access?.can_view_staff && !access?.can_view_emergency) return <div className="empty-state">{language === 'th' ? 'บัญชีนี้ยังไม่มีสิทธิ์ Staff Mode' : 'This account does not have Staff Mode access.'}</div>;

  return (
    <section className="page-stack staff-page">
      <div className="section-heading">
        <p className="eyebrow">{language === 'th' ? 'โหมดสตาฟ' : 'Staff App Mode'}</p>
        <h1>{language === 'th' ? 'แดชบอร์ดสตาฟ' : 'Staff Dashboard'}</h1>
        <p>{language === 'th' ? 'โหมดมือถือสำหรับหน้างาน สิทธิ์จะแยกตาม role และไม่เปิดเครื่องมือแอดมินให้ staff' : 'Mobile-first event operations mode. Access is role-based and does not expose admin tools to staff.'}</p>
      </div>

      <div className="staff-role-strip">
        <Badge status="approved">{access.is_admin ? 'admin' : access.roles.join(', ')}</Badge>
        <span>{assignedLabel}</span>
        {access.read_only ? <span>Read-only</span> : null}
      </div>

      <div className="stats-grid">
        <DashboardStatCard label={isEmergencyOnly ? (language === 'th' ? 'ขอบเขตสุขภาพ' : 'Health scope') : (language === 'th' ? 'ในความรับผิดชอบ' : 'Assigned participants')} value={context?.participants.length ?? (isEmergencyOnly ? assignedLabel : 0)} icon={<UsersRound size={20} />} />
        <DashboardStatCard label={language === 'th' ? 'พี่กลุ่ม' : 'Group staff'} value={context?.staff_roster.length ?? 0} />
        <DashboardStatCard label={language === 'th' ? 'ข้อมูลสุขภาพที่เห็น' : 'Medical visible'} value={medicalCount} icon={<AlertTriangle size={20} />} />
      </div>

      <div className="staff-action-grid">
        <Link className={`staff-action-card ${isEmergencyOnly ? 'disabled-link' : ''}`} to={isEmergencyOnly ? '#' : '/staff/my-group'} aria-disabled={isEmergencyOnly}>
          <Search size={28} />
          <strong>{language === 'th' ? 'กลุ่มของฉัน' : 'My Group'}</strong>
          <span>{language === 'th' ? 'รายชื่อและช่องทางติดต่อในกลุ่ม' : 'Participant list and group contact details'}</span>
        </Link>
        <Link className={`staff-action-card ${access.can_mark_attendance ? '' : 'disabled-link'}`} to={access.can_mark_attendance ? '/staff/attendance' : '#'} aria-disabled={!access.can_mark_attendance}>
          <ClipboardCheck size={28} />
          <strong>{language === 'th' ? 'เช็กชื่อ' : 'Attendance'}</strong>
          <span>{language === 'th' ? 'เช็กชื่อแบบเก็บคิว offline ได้' : 'Offline-friendly attendance queue'}</span>
        </Link>
        <Link className={`staff-action-card ${access.can_view_emergency ? 'danger-card' : 'disabled-link'}`} to={access.can_view_emergency ? '/staff/emergency' : '#'} aria-disabled={!access.can_view_emergency}>
          <ShieldAlert size={28} />
          <strong>{language === 'th' ? 'เครื่องมือสุขภาพ' : 'Health Tools'}</strong>
          <span>{language === 'th' ? 'emergency_staff ใช้เครื่องมือสุขภาพได้เต็มรูปแบบทุกกลุ่ม' : 'emergency_staff can use full health tools across all groups'}</span>
        </Link>
      </div>

      <Card className="staff-confidential-card">
        <strong>{language === 'th' ? 'กติกาสิทธิ์' : 'Role rules'}</strong>
        <span>{language === 'th' ? 'emergency_staff ใช้เฉพาะเครื่องมือสุขภาพ: ดูข้อมูลฉุกเฉินทุกกลุ่ม บันทึก note และ special care ได้ แต่ไม่แตะงานสตาฟกลุ่มหรือแอดมิน' : 'emergency_staff can only use health tools: view all emergency data, save notes, and mark special care without accessing group staff or admin tools.'}</span>
      </Card>
    </section>
  );
}
