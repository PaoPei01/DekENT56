import { Bell, CalendarDays, ClipboardCheck, Database, FileText, HeartPulse, ShieldCheck, SlidersHorizontal, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EventSwitcher } from '../components/events/EventSwitcher';
import { PortalActionCard } from '../components/PortalActionCard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';

export function AdminCommandCenterPage() {
  const { language } = useLanguage();

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Admin"
        title={language === 'th' ? 'ศูนย์ควบคุมระบบ' : 'Admin Command Center'}
        description={language === 'th' ? 'เริ่มจากงานสำคัญของผู้ดูแลระบบ แล้วค่อยเปิดเครื่องมือเฉพาะทางเมื่อจำเป็น' : 'Start with the most important admin tasks, then open specialized tools as needed.'}
        meta={<EventSwitcher compact />}
        actions={<Link className="btn btn-secondary" to="/admin/dashboard">{language === 'th' ? 'เปิดแดชบอร์ดเดิม' : 'Open legacy dashboard'}</Link>}
      />

      <Card className="event-detail-card" variant="soft">
        <div className="mobile-row-head">
          <div>
            <strong>{language === 'th' ? 'งานที่ใช้บ่อย' : 'Frequently used'}</strong>
            <span>{language === 'th' ? 'ทางลัดสำหรับงานจริงระหว่างเตรียมและจัดกิจกรรม' : 'Shortcuts for preparation and live event operations.'}</span>
          </div>
          <Badge status="approved">{language === 'th' ? 'ผู้ดูแลระบบ' : 'Admin'}</Badge>
        </div>
      </Card>

      <div className="staff-action-grid">
        <PortalActionCard to="/admin/events" icon={<CalendarDays size={28} />} title={language === 'th' ? 'กิจกรรม' : 'Events'} description={language === 'th' ? 'จัดการกิจกรรม หน้า public และใบสมัครตามกิจกรรม' : 'Manage events, public pages, and event applications.'} primary />
        <PortalActionCard to="/admin/people" icon={<Database size={28} />} title={language === 'th' ? 'ฐานข้อมูลกลาง' : 'People database'} description={language === 'th' ? 'ตรวจข้อมูลบุคคลกลางและสถานะการเชื่อมโยง' : 'Review central people data and linking status.'} />
        <PortalActionCard to="/admin/staff" icon={<UsersRound size={28} />} title={language === 'th' ? 'ทีมงาน' : 'Staff'} description={language === 'th' ? 'จัดการรายชื่อทีมงาน สิทธิ์ และข้อมูลที่เกี่ยวข้อง' : 'Manage staff records, roles, and related information.'} />
        <PortalActionCard to="/admin/staff/attendance" icon={<ClipboardCheck size={28} />} title={language === 'th' ? 'เช็กชื่อทีมงาน' : 'Staff Attendance'} description={language === 'th' ? 'สร้างรอบเช็กชื่อ เปิด QR และดูประวัติการเช็กชื่อ' : 'Create sessions, open QR codes, and review attendance.'} />
        <PortalActionCard to="/admin/documents" icon={<FileText size={28} />} title={language === 'th' ? 'ศูนย์เอกสาร' : 'Document Center'} description={language === 'th' ? 'ตั้งค่า template สร้างเอกสาร และดูประวัติ' : 'Manage templates, generate documents, and view history.'} />
        <PortalActionCard to="/admin/announcements" icon={<Bell size={28} />} title={language === 'th' ? 'ประกาศ' : 'Announcements'} description={language === 'th' ? 'เผยแพร่ประกาศและข้อมูลตามกิจกรรม' : 'Publish event-aware announcements and information.'} />
        <PortalActionCard to="/admin/data-health" icon={<ShieldCheck size={28} />} title={language === 'th' ? 'ตรวจสุขภาพข้อมูล' : 'Data Health'} description={language === 'th' ? 'ตรวจข้อมูลที่หาย ซ้ำ หรือเสี่ยงผิดพลาด' : 'Find missing, duplicate, or risky data.'} />
        <PortalActionCard to="/admin/system-readiness" icon={<SlidersHorizontal size={28} />} title={language === 'th' ? 'ตรวจความพร้อมระบบ' : 'System Readiness'} description={language === 'th' ? 'ตรวจความพร้อมก่อนใช้งานจริง' : 'Check readiness before real operations.'} />
        <PortalActionCard to="/admin/emergency" icon={<HeartPulse size={28} />} title={language === 'th' ? 'เหตุฉุกเฉิน' : 'Emergency'} description={language === 'th' ? 'เปิดข้อมูลช่วยเหลือและสุขภาพตามสิทธิ์ผู้ดูแล' : 'Open emergency support information with admin access.'} />
      </div>
    </section>
  );
}

