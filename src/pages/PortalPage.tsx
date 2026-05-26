import { Bell, CalendarDays, Home, LifeBuoy, Pencil, Shield, UserCheck } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PortalActionCard } from '../components/PortalActionCard';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';
import { useRoleAccess } from '../hooks/useRoleAccess';

export function PortalPage() {
  const { language } = useLanguage();
  const { loading, user, target } = useRoleAccess();

  if (loading) return <LoadingSkeleton />;
  if (user && target === 'admin') return <Navigate to="/admin" replace />;
  if (user && target === 'staff') return <Navigate to="/staff" replace />;

  if (user) {
    return (
      <section className="page-stack">
        <PageHeader
          eyebrow="Portal"
          title={language === 'th' ? 'บัญชีของฉัน' : 'My account'}
          description={language === 'th' ? 'บัญชีนี้เข้าสู่ระบบแล้ว แต่ยังไม่ได้รับสิทธิ์ทีมงานหรือผู้ดูแลระบบ' : 'This account is signed in, but it does not have staff or admin access yet.'}
        />
        <Card className="privacy-notice" variant="warning">
          <strong>{language === 'th' ? 'ยังไม่มีสิทธิ์ทีมงาน' : 'No staff access yet'}</strong>
          <span>{language === 'th' ? 'คุณยังใช้หน้าสาธารณะและส่งคำร้องแก้ไขข้อมูลได้ หากต้องการสิทธิ์ทีมงาน กรุณาติดต่อผู้ดูแล' : 'You can still use public pages and request information changes. Contact an admin if you need staff access.'}</span>
        </Card>
        <div className="staff-action-grid">
          <PortalActionCard to="/" icon={<Home size={28} />} title={language === 'th' ? 'ไปหน้าหลัก' : 'Go to public home'} description={language === 'th' ? 'ค้นหารายชื่อและข้อมูลสาธารณะ' : 'Search public participant information.'} primary />
          <PortalActionCard to="/me" icon={<Pencil size={28} />} title={language === 'th' ? 'ข้อมูลของฉัน (ผู้เข้าร่วม)' : 'My Information (Participant)'} description={language === 'th' ? 'สำหรับผู้เข้าร่วมกิจกรรม ใช้ตรวจสอบข้อมูลส่วนตัว กลุ่ม และส่งคำขอแก้ไขข้อมูล' : 'For participants to review personal information, group details, and submit edit requests.'} />
          <PortalActionCard to="/guide" icon={<LifeBuoy size={28} />} title={language === 'th' ? 'ขอความช่วยเหลือ' : 'Ask for help'} description={language === 'th' ? 'เปิดคู่มือหรือขอให้ทีมงานช่วยตรวจสอบสิทธิ์' : 'Open the guide or ask staff to check your access.'} />
        </div>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Portal"
        title={language === 'th' ? 'เริ่มใช้งานระบบ' : 'Start here'}
        description={language === 'th' ? 'เลือกเส้นทางที่ตรงกับคุณ ระบบจะพาไปหน้าที่เหมาะสม' : 'Choose who you are, and the portal will take you to the right place.'}
      />
      <div className="staff-action-grid">
        <PortalActionCard to="/" icon={<Home size={28} />} title={language === 'th' ? 'รายชื่อผู้เข้าร่วม' : 'Participants'} description={language === 'th' ? 'ค้นหารายชื่อและข้อมูลสาธารณะที่เปิดให้ดูได้' : 'Search public participant information.'} primary />
        <PortalActionCard to="/events" icon={<CalendarDays size={28} />} title={language === 'th' ? 'กิจกรรม' : 'Events'} description={language === 'th' ? 'ดูหน้ากิจกรรม ประกาศ และการสมัครที่เปิดอยู่' : 'Open event pages, announcements, and available applications.'} />
        <PortalActionCard to="/me" icon={<Pencil size={28} />} title={language === 'th' ? 'ข้อมูลของฉัน (ผู้เข้าร่วม)' : 'My Information (Participant)'} description={language === 'th' ? 'สำหรับผู้เข้าร่วมกิจกรรม ใช้ตรวจสอบข้อมูลส่วนตัว กลุ่ม และส่งคำขอแก้ไขข้อมูล' : 'For participants to review personal information, group details, and submit edit requests.'} />
        <PortalActionCard to="/staff/start" icon={<UserCheck size={28} />} title={language === 'th' ? 'ทีมงานทั่วไป' : 'General Staff Access'} description={language === 'th' ? 'สำหรับทีมงานและสตาฟ ใช้ยืนยันตัวตน เปิด QR เช็กชื่อ ดูประวัติการเช็กชื่อ และแก้ไขข้อมูลทีมงาน' : 'For staff members to verify identity, open check-in QR, view attendance history, and update staff information.'} />
        <PortalActionCard to="/announcements" icon={<Bell size={28} />} title={language === 'th' ? 'ประกาศ' : 'Announcements'} description={language === 'th' ? 'อ่านประกาศสำคัญและอัปเดตกิจกรรม' : 'Read important announcements and event updates.'} />
        <PortalActionCard to="/login" icon={<Shield size={28} />} title={language === 'th' ? 'เข้าสู่ระบบ' : 'Sign in'} description={language === 'th' ? 'สำหรับบัญชีทีมงานหรือผู้ดูแลระบบ' : 'For staff and admin accounts.'} />
      </div>
    </section>
  );
}
