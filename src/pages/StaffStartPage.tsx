import { ClipboardCheck, LogIn, QrCode, Shield, UserCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PortalActionCard } from '../components/PortalActionCard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useRoleAccess } from '../hooks/useRoleAccess';
import { supabase } from '../lib/supabase';

export function StaffStartPage() {
  const { language } = useLanguage();
  const { loading, user, target } = useRoleAccess();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate('/');
  }

  if (loading) return <LoadingSkeleton />;
  if (user && target === 'staff') return <Navigate to="/staff" replace />;

  if (user && target === 'admin') {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Staff"
          title={language === 'th' ? 'ศูนย์ทีมงาน' : 'Staff Center'}
          description={language === 'th' ? 'บัญชีนี้เป็นผู้ดูแลระบบ สามารถเลือกเข้าศูนย์ควบคุมหรือเปิดเครื่องมือทีมงานได้' : 'This admin account can open the command center or staff tools.'}
        />
        <div className="staff-action-grid">
          <PortalActionCard to="/admin" icon={<Shield size={28} />} title={language === 'th' ? 'ไปศูนย์ควบคุมระบบ' : 'Go to Admin Command Center'} description={language === 'th' ? 'ภาพรวมงานผู้ดูแลระบบ' : 'Open admin operations.'} primary />
          <PortalActionCard to="/staff" icon={<UserCheck size={28} />} title={language === 'th' ? 'เปิดหน้าทีมงาน' : 'Open Staff tools'} description={language === 'th' ? 'เปิดเครื่องมือทีมงานหน้างาน' : 'Open staff tools for live operations.'} />
        </div>
      </section>
    );
  }

  if (user) {
    return (
      <section className="narrow-page page-stack">
        <PageHeader eyebrow="Staff" title={language === 'th' ? 'บัญชีนี้ยังไม่ได้รับสิทธิ์ทีมงาน' : 'This account does not have staff access'} />
        <Card variant="warning" className="privacy-notice">
          <strong>{language === 'th' ? 'ต้องให้ผู้ดูแลเพิ่มสิทธิ์ก่อน' : 'Admin access setup required'}</strong>
          <span>{language === 'th' ? 'หากคุณเป็นทีมงาน กรุณาติดต่อผู้ดูแลเพื่อตรวจสอบบัญชี' : 'If you are staff, please contact an admin to check this account.'}</span>
          <div className="form-actions">
            <Link className="btn btn-primary" to="/">{language === 'th' ? 'กลับหน้าแรก' : 'Go to public home'}</Link>
            <Link className="btn btn-secondary" to="/me">{language === 'th' ? 'ข้อมูลของฉัน' : 'My information'}</Link>
            <Button variant="secondary" onClick={() => void signOut()}>{language === 'th' ? 'ออกจากระบบ' : 'Sign out'}</Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Staff"
        title={language === 'th' ? 'ศูนย์ทีมงาน' : 'Staff Center'}
        description={language === 'th' ? 'ใช้หน้านี้เพื่อเข้าสู่ระบบ ยืนยันตัวตน แสดง QR หรือแก้ไขโปรไฟล์ทีมงาน' : 'Use this page to sign in, verify your staff identity, show your QR, or edit your staff profile.'}
      />
      <div className="staff-action-grid">
        <PortalActionCard
          to="/login"
          state={{ returnTo: '/staff' }}
          icon={<LogIn size={28} />}
          title={language === 'th' ? 'เข้าสู่ระบบทีมงาน' : 'Staff sign in'}
          description={language === 'th' ? 'สำหรับทีมงานที่มีบัญชีและได้รับสิทธิ์ในระบบแล้ว' : 'For staff members who already have an account and system access.'}
          actionLabel={language === 'th' ? 'เข้าสู่ระบบ' : 'Sign in'}
          primary
        />
        <PortalActionCard
          to="/staff/profile/verify"
          icon={<QrCode size={28} />}
          title={language === 'th' ? 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทร' : 'Verify with email and phone'}
          description={language === 'th' ? 'ใช้สำหรับแสดง QR ส่วนตัวหรือขอแก้ไขโปรไฟล์ โดยไม่ต้องเข้าสู่ระบบ' : 'Use this to show your personal QR or request profile changes without signing in.'}
          actionLabel={language === 'th' ? 'ยืนยันตัวตน' : 'Verify identity'}
        />
        <PortalActionCard
          to="/events/parent-orientation-staff-2569/staff/application-status"
          icon={<ClipboardCheck size={28} />}
          title={language === 'th' ? 'ตรวจสถานะใบสมัครทีมงาน' : 'Check staff application status'}
          description={language === 'th' ? 'สำหรับผู้ที่สมัครเป็นทีมงานแล้วและต้องการดูผลหรือสถานะล่าสุด' : 'For applicants who want to check their latest staff application status.'}
          actionLabel={language === 'th' ? 'ตรวจสถานะ' : 'Check status'}
        />
      </div>
      <Card className="privacy-notice">
        <strong>{language === 'th' ? 'ลิงก์เดิมยังใช้งานได้' : 'Existing direct links still work'}</strong>
        <span>{language === 'th' ? 'หากมีลิงก์ QR ส่วนตัว เช็กชื่อ หรือหน้าเข้าสู่ระบบเดิม สามารถเปิดได้ตามปกติ' : 'Existing personal QR, attendance, and sign-in links remain available.'}</span>
        <div className="form-actions">
          <Link className="btn btn-secondary" to="/staff/profile/qr">{language === 'th' ? 'QR ส่วนตัวทีมงาน' : 'Staff personal QR'}</Link>
          <Link className="btn btn-secondary" to="/staff/attendance">{language === 'th' ? 'เช็กชื่อทีมงาน' : 'Staff attendance'}</Link>
        </div>
      </Card>
    </section>
  );
}
