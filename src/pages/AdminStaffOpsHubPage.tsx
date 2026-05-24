import { ClipboardCheck, FileSpreadsheet, HeartPulse, UserCheck, UsersRound } from 'lucide-react';
import { PortalActionCard } from '../components/PortalActionCard';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';

export function AdminStaffOpsHubPage() {
  const { language } = useLanguage();

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow={language === 'th' ? 'งานทีมงาน' : 'Staff Operations'}
        title={language === 'th' ? 'งานทีมงาน' : 'Staff Operations'}
        description={language === 'th' ? 'จัดการทีมงาน ใบสมัคร หน้าที่ โควตา การเช็กชื่อ และคำขอแก้ไขโปรไฟล์ทีมงาน' : 'Manage staff, applications, roles, quota, attendance, and staff profile requests.'}
      />
      <Card className="workflow-explainer-card" variant="soft">
        <div>
          <strong>{language === 'th' ? 'เครื่องมือสำหรับงานหน้างานและการเตรียมทีม' : 'Tools for live operations and staff prep'}</strong>
          <span>{language === 'th' ? 'สิทธิ์ทีมงาน เหตุฉุกเฉิน และข้อมูลสุขภาพยังใช้ guard และ permission เดิมทั้งหมด' : 'Staff access, emergency access, and health data permissions continue to use the existing guards.'}</span>
        </div>
      </Card>
      <div className="staff-action-grid">
        <PortalActionCard to="/admin/staff" icon={<UsersRound size={28} />} title={language === 'th' ? 'รายชื่อทีมงาน' : 'Staff list'} description={language === 'th' ? 'จัดการข้อมูลทีมงาน สิทธิ์ บทบาท และกลุ่ม' : 'Manage staff records, access, roles, and groups.'} primary />
        <PortalActionCard to="/admin/staff/attendance" icon={<ClipboardCheck size={28} />} title={language === 'th' ? 'เช็กชื่อทีมงาน' : 'Staff attendance'} description={language === 'th' ? 'สร้างรอบเช็กชื่อ เปิด QR และดูประวัติ' : 'Create sessions, open QR codes, and review attendance.'} />
        <PortalActionCard to="/admin/staff/operations" icon={<UserCheck size={28} />} title={language === 'th' ? 'โควตาทีมงาน' : 'Staff quota'} description={language === 'th' ? 'ดูโควตา หน้าที่ และความพร้อมของกำลังคน' : 'Review quota, roles, and staff coverage.'} />
        <PortalActionCard to="/admin/staff/import" icon={<FileSpreadsheet size={28} />} title={language === 'th' ? 'นำเข้าสตาฟ' : 'Import staff'} description={language === 'th' ? 'นำเข้ารายชื่อทีมงานจากไฟล์ที่เตรียมไว้' : 'Import staff records from prepared files.'} />
        <PortalActionCard to="/admin/staff/requests" icon={<UserCheck size={28} />} title={language === 'th' ? 'คำขอทีมงาน' : 'Staff requests'} description={language === 'th' ? 'ตรวจคำขอแก้ไขโปรไฟล์และข้อมูลสำคัญของทีมงาน' : 'Review staff profile and sensitive update requests.'} />
        <PortalActionCard to="/admin/emergency" icon={<HeartPulse size={28} />} title={language === 'th' ? 'เหตุฉุกเฉิน' : 'Emergency'} description={language === 'th' ? 'เปิดข้อมูลช่วยเหลือและสุขภาพตามสิทธิ์ผู้ดูแล' : 'Open emergency and safety tools with admin access.'} />
      </div>
    </section>
  );
}
