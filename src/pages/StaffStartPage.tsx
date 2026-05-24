import { ClipboardCheck, LogIn, QrCode, Shield, UserCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PortalActionCard } from '../components/PortalActionCard';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useRoleAccess } from '../hooks/useRoleAccess';

export function StaffStartPage() {
  const { language } = useLanguage();
  const { loading, user, target } = useRoleAccess();

  if (loading) return <LoadingSkeleton />;
  if (user && target === 'staff') return <Navigate to="/staff" replace />;

  if (user && target === 'admin') {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Staff"
          title={language === 'th' ? 'ทีมงาน' : 'Staff'}
          description={language === 'th' ? 'บัญชีนี้เป็นผู้ดูแลระบบ สามารถเลือกเข้าศูนย์ควบคุมหรือเปิดเครื่องมือทีมงานได้' : 'This admin account can open the command center or staff tools.'}
        />
        <div className="staff-action-grid">
          <PortalActionCard to="/admin" icon={<Shield size={28} />} title={language === 'th' ? 'ศูนย์ควบคุมระบบ' : 'Admin Command Center'} description={language === 'th' ? 'ภาพรวมงานผู้ดูแลระบบ' : 'Open admin operations.'} primary />
          <PortalActionCard to="/staff" icon={<UserCheck size={28} />} title={language === 'th' ? 'หน้าทีมงาน' : 'Staff home'} description={language === 'th' ? 'เปิดเครื่องมือทีมงานหน้างาน' : 'Open staff tools for live operations.'} />
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
            <Link className="btn btn-primary" to="/portal">{language === 'th' ? 'กลับหน้า Portal' : 'Back to portal'}</Link>
            <Link className="btn btn-secondary" to="/me">{language === 'th' ? 'ข้อมูลของฉัน' : 'My information'}</Link>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Staff"
        title={language === 'th' ? 'เริ่มต้นสำหรับทีมงาน' : 'Staff start'}
        description={language === 'th' ? 'เลือกวิธีเข้าใช้งานที่ตรงกับสถานะของคุณ' : 'Choose the staff path that matches your situation.'}
      />
      <div className="staff-action-grid">
        <PortalActionCard to="/login" icon={<LogIn size={28} />} title={language === 'th' ? 'เข้าสู่ระบบทีมงาน' : 'Staff sign in'} description={language === 'th' ? 'สำหรับบัญชีที่ได้รับสิทธิ์ทีมงานหรือผู้ดูแลระบบแล้ว' : 'For accounts that already have staff or admin access.'} primary />
        <PortalActionCard to="/staff/profile/verify" icon={<QrCode size={28} />} title={language === 'th' ? 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทร' : 'Verify with email and phone'} description={language === 'th' ? 'แก้ไขโปรไฟล์ทีมงานหรือเปิด QR ส่วนตัวผ่านเส้นทางเดิม' : 'Edit staff profile or open personal QR through the existing flow.'} />
        <PortalActionCard to="/events/parent-orientation-staff-2569/staff/application-status" icon={<ClipboardCheck size={28} />} title={language === 'th' ? 'ตรวจสถานะใบสมัครทีมงาน' : 'Check staff application status'} description={language === 'th' ? 'ตรวจสถานะใบสมัครด้วยอีเมลและเบอร์โทรที่ใช้สมัคร' : 'Check your application status with the email and phone used to apply.'} />
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
