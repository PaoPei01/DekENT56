import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Bell,
  ClipboardCheck,
  Download,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Pencil,
  QrCode,
  Search,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UsersRound,
} from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { useLanguage } from '../context/LanguageContext';

type LocalizedText = {
  th: string;
  en: string;
};

type GuideStep = {
  icon: LucideIcon;
  title: LocalizedText;
  description: LocalizedText;
};

type PreviewCard = {
  title: LocalizedText;
  badge: LocalizedText;
  rows: LocalizedText[];
};

const text = (copy: LocalizedText, language: 'th' | 'en') => copy[language];

const participantSteps: GuideStep[] = [
  {
    icon: Search,
    title: { th: 'ค้นหารายชื่อ', en: 'Search participant list' },
    description: { th: 'ค้นหาชื่อ ชื่อเล่น สาขา และกลุ่มของตัวเองได้จากหน้าหลัก', en: 'Find your name, nickname, major, and group from the home page.' },
  },
  {
    icon: Pencil,
    title: { th: 'ตรวจสอบ/แก้ไขข้อมูล', en: 'Review or edit your info' },
    description: { th: 'ไปที่เมนู “แก้ไขข้อมูล” แล้วกรอกอีเมลและเบอร์โทรเพื่อยืนยันตัวตน', en: 'Open Edit Info, then verify with the email and phone used during registration.' },
  },
  {
    icon: UsersRound,
    title: { th: 'ดูกลุ่มและพี่กลุ่ม', en: 'View your group and staff' },
    description: { th: 'หลังยืนยันตัวตน ระบบจะแสดงข้อมูลกลุ่มและทีมงานที่เกี่ยวข้อง', en: 'After verification, the system shows your group and relevant staff when available.' },
  },
  {
    icon: Bell,
    title: { th: 'อ่านประกาศ', en: 'Read announcements' },
    description: { th: 'ตรวจสอบข่าวสารและรายละเอียดกิจกรรมจากเมนูประกาศ', en: 'Check event updates and important details from the announcement menu.' },
  },
];

const staffSteps: GuideStep[] = [
  {
    icon: ShieldCheck,
    title: { th: 'เข้าสู่ระบบทีมงาน', en: 'Sign in as staff' },
    description: { th: 'ใช้บัญชีที่ได้รับสิทธิ์เพื่อเข้า Staff Mode และเครื่องมือปฏิบัติงาน', en: 'Use an authorized account to access Staff Mode and operation tools.' },
  },
  {
    icon: UserCheck,
    title: { th: 'แก้ไขโปรไฟล์ทีมงาน', en: 'Edit staff profile' },
    description: { th: 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทรเพื่อปรับข้อมูลโปรไฟล์รายบุคคล', en: 'Verify by email and phone to update your personal staff profile.' },
  },
  {
    icon: UsersRound,
    title: { th: 'ดูกลุ่มที่รับผิดชอบ', en: 'View assigned group' },
    description: { th: 'ตรวจสอบสี กลุ่มย่อย ฐาน หรือหน้าที่ที่ได้รับมอบหมาย', en: 'Review your assigned color, subgroup, base, or duty.' },
  },
  {
    icon: ClipboardCheck,
    title: { th: 'เช็กชื่อทีมงาน', en: 'Staff attendance' },
    description: { th: 'สแกน QR รอบเช็กชื่อ หรือให้แอดมินช่วยเช็กชื่อเมื่อจำเป็น', en: 'Scan the attendance session QR or ask an admin for assisted check-in.' },
  },
  {
    icon: QrCode,
    title: { th: 'ใช้ QR ส่วนตัว', en: 'Use personal QR' },
    description: { th: 'เปิด QR ส่วนตัวให้แอดมินสแกนในกรณีเช็กชื่อแทน', en: 'Show your personal QR for admin-assisted attendance.' },
  },
];

const adminSteps: GuideStep[] = [
  {
    icon: ShieldCheck,
    title: { th: 'เข้าสู่ระบบผู้ดูแล', en: 'Admin sign in' },
    description: { th: 'เข้าสู่ระบบด้วยบัญชีผู้ดูแลเพื่อเปิดเครื่องมือจัดการทั้งหมด', en: 'Sign in with an admin account to unlock management tools.' },
  },
  {
    icon: LayoutDashboard,
    title: { th: 'ตรวจสอบ Dashboard', en: 'Review dashboard' },
    description: { th: 'ดูภาพรวมรายชื่อ สถานะข้อมูล และรายการที่ต้องดำเนินการ', en: 'Scan participant totals, data status, and items requiring action.' },
  },
  {
    icon: UsersRound,
    title: { th: 'จัดการรายชื่อและกลุ่ม', en: 'Manage lists and groups' },
    description: { th: 'ค้นหา แก้ไข จัดกลุ่ม และตรวจสอบความถูกต้องของข้อมูล', en: 'Search, edit, group, and verify operational data.' },
  },
  {
    icon: UserCheck,
    title: { th: 'จัดการทีมงาน', en: 'Manage staff' },
    description: { th: 'ดูโปรไฟล์ หน้าที่ กลุ่ม ฐาน และคำขอแก้ไขข้อมูลทีมงาน', en: 'Manage staff profiles, duties, groups, bases, and edit requests.' },
  },
  {
    icon: ClipboardCheck,
    title: { th: 'สร้างรอบเช็กชื่อ', en: 'Create attendance session' },
    description: { th: 'เปิดรอบเช็กชื่อ แสดง QR และใช้ Manual check-in เมื่อจำเป็น', en: 'Create a session, show its QR, and use manual check-in as backup.' },
  },
  {
    icon: Pencil,
    title: { th: 'ตรวจสอบคำขอแก้ไข', en: 'Review edit requests' },
    description: { th: 'อนุมัติหรือปฏิเสธคำขอแก้ไขข้อมูลอย่างระมัดระวัง', en: 'Approve or reject data edit requests carefully.' },
  },
  {
    icon: FileText,
    title: { th: 'สร้างเอกสารจาก Document Center', en: 'Generate documents' },
    description: { th: 'ตั้งค่าข้อมูลกิจกรรม อัปโหลดเทมเพลต และสร้างเอกสาร', en: 'Set project data, upload templates, and generate documents.' },
  },
  {
    icon: Download,
    title: { th: 'Export ข้อมูล', en: 'Export data' },
    description: { th: 'ส่งออกข้อมูลที่จำเป็นสำหรับการทำงานหน้างานและหลังงาน', en: 'Export operational data for event day and post-event work.' },
  },
];

const attendanceFlows = [
  {
    title: { th: 'ทีมงานสแกน QR รอบเช็กชื่อ', en: 'Staff scans session QR' },
    steps: { th: 'Admin สร้างรอบ → แสดง QR → ทีมงานสแกน → เช็กชื่อสำเร็จ', en: 'Admin creates session → Shows QR → Staff scans → Check-in complete' },
  },
  {
    title: { th: 'ทีมงานไม่มีบัญชี Auth', en: 'Staff without Auth account' },
    steps: { th: 'สแกน QR → กรอกอีเมลและเบอร์โทร → เช็กชื่อสำเร็จ', en: 'Scan QR → Enter email and phone → Check-in complete' },
  },
  {
    title: { th: 'แอดมินเช็กชื่อแบบ Manual', en: 'Admin manual check-in' },
    steps: { th: 'เปิดรอบเช็กชื่อ → ค้นหาชื่อทีมงาน → กดเช็กชื่อแล้ว/มาสาย/ยังไม่เช็กชื่อ/แจ้งไว้แล้ว', en: 'Open session → Search staff → Mark checked in/late/not checked in/excused' },
  },
  {
    title: { th: 'แอดมินสแกน QR ส่วนตัวทีมงาน', en: 'Admin scans staff personal QR' },
    steps: { th: 'ทีมงานแสดง QR ส่วนตัว → แอดมินสแกน → ระบบเช็กชื่อเข้ารอบที่เลือก', en: 'Staff shows personal QR → Admin scans → System checks staff into selected session' },
  },
];

const previewCards: PreviewCard[] = [
  {
    title: { th: 'หน้าค้นหารายชื่อ', en: 'Participant search' },
    badge: { th: 'กลุ่มสีแดง A', en: 'Red Group A' },
    rows: [
      { th: 'ตัวอย่างผู้เข้าร่วม · วิศวกรรมคอมพิวเตอร์', en: 'Sample participant · Computer Engineering' },
      { th: 'ชื่อเล่น: ตัวอย่าง · กลุ่มพร้อมแล้ว', en: 'Nickname: Sample · Group ready' },
    ],
  },
  {
    title: { th: 'หน้าแก้ไขข้อมูล', en: 'Edit request page' },
    badge: { th: 'รอแอดมินอนุมัติ', en: 'Admin approval' },
    rows: [
      { th: 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทร', en: 'Verify with email and phone' },
      { th: 'แก้เฉพาะช่องทางติดต่อและสุขภาพ', en: 'Edit contact and health fields' },
    ],
  },
  {
    title: { th: 'หน้า Staff Mode', en: 'Staff Mode' },
    badge: { th: 'ทีมงานตัวอย่าง', en: 'Sample staff' },
    rows: [
      { th: 'ดูงานที่รับผิดชอบและกลุ่มของฉัน', en: 'View assigned duty and my group' },
      { th: 'เข้าถึงเช็กชื่อและเครื่องมือทีมงาน', en: 'Access attendance and staff tools' },
    ],
  },
  {
    title: { th: 'หน้าเช็กชื่อด้วย QR', en: 'QR attendance' },
    badge: { th: 'เช็กชื่อเช้าวันกิจกรรม', en: 'Morning check-in' },
    rows: [
      { th: 'สแกน QR รอบเช็กชื่อ', en: 'Scan attendance session QR' },
      { th: 'สถานะ: เช็กชื่อแล้ว', en: 'Status: Checked in' },
    ],
  },
  {
    title: { th: 'หน้า Admin Attendance', en: 'Admin Attendance' },
    badge: { th: 'สรุปสด', en: 'Live summary' },
    rows: [
      { th: 'ทั้งหมด 226 · เช็กชื่อแล้ว 180 · มาสาย 7', en: 'Total 226 · Checked in 180 · Late 7' },
      { th: 'Manual และสแกน QR ส่วนตัวทีมงาน', en: 'Manual and personal QR scan tools' },
    ],
  },
  {
    title: { th: 'หน้า Document Center', en: 'Document Center' },
    badge: { th: 'เอกสารกิจกรรม', en: 'Event docs' },
    rows: [
      { th: 'ตั้งค่าข้อมูลกิจกรรมและเทมเพลต', en: 'Set event data and templates' },
      { th: 'ตรวจ placeholder ก่อนสร้างเอกสาร', en: 'Check placeholders before generation' },
    ],
  },
];

const faqs = [
  {
    q: { th: 'ไม่มีบัญชีทีมงาน ใช้ระบบได้ไหม', en: 'Can I use the system without a staff account?' },
    a: { th: 'ใช้ได้ในบางเมนู เช่น แก้ไขโปรไฟล์ทีมงานหรือเช็กชื่อผ่านการยืนยันอีเมลและเบอร์โทร', en: 'Yes, for selected features such as staff profile editing and attendance via email and phone verification.' },
  },
  {
    q: { th: 'สแกน QR แล้วเช็กชื่อไม่ได้ทำอย่างไร', en: 'What if QR check-in does not work?' },
    a: { th: 'ตรวจสอบว่ารอบเช็กชื่อยังเปิดอยู่ หรือใช้การเช็กชื่อแบบ Manual โดยติดต่อแอดมิน', en: 'Check that the session is still active, or contact an admin for manual check-in.' },
  },
  {
    q: { th: 'QR รอบเช็กชื่อกับ QR ส่วนตัวต่างกันอย่างไร', en: 'How are session QR and personal QR different?' },
    a: { th: 'QR รอบเช็กชื่อใช้ให้ทีมงานเช็กชื่อด้วยตัวเอง ส่วน QR ส่วนตัวใช้ให้แอดมินสแกนระบุตัวทีมงาน', en: 'Session QR is for self check-in. Personal QR identifies staff for admin-assisted check-in.' },
  },
  {
    q: { th: 'แก้ไขข้อมูลแล้วทำไมยังไม่เปลี่ยนทันที', en: 'Why does edited information not update immediately?' },
    a: { th: 'บางข้อมูลต้องรอผู้ดูแลระบบตรวจสอบและอนุมัติก่อน', en: 'Some changes require admin review and approval before they are applied.' },
  },
  {
    q: { th: 'ข้อมูลส่วนตัวปลอดภัยไหม', en: 'Is personal data protected?' },
    a: { th: 'หน้าสาธารณะแสดงเฉพาะข้อมูลจำเป็น ข้อมูลติดต่อและสุขภาพถูกซ่อนไว้', en: 'Public pages show only necessary information. Contact and health data are hidden.' },
  },
];

function GuideSection({ id, eyebrow, title, description, children }: {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="guide-section" aria-labelledby={`${id}-title`}>
      <div className="guide-section-head">
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={`${id}-title`}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function StepCard({ step, index, language }: { step: GuideStep; index: number; language: 'th' | 'en' }) {
  const Icon = step.icon;
  return (
    <Card className="guide-step-card">
      <span className="guide-step-index">{index + 1}</span>
      <Icon size={22} aria-hidden="true" />
      <div>
        <h3>{text(step.title, language)}</h3>
        <p>{text(step.description, language)}</p>
      </div>
    </Card>
  );
}

function PreviewMockCard({ card, language }: { card: PreviewCard; language: 'th' | 'en' }) {
  return (
    <Card className="guide-preview-card">
      <div className="guide-preview-screen" aria-label={language === 'th' ? 'ตัวอย่างหน้าจอจำลอง' : 'Mock screen preview'}>
        <div className="guide-preview-topbar">
          <span />
          <span />
          <span />
        </div>
        <strong>{text(card.title, language)}</strong>
        <em>{text(card.badge, language)}</em>
        {card.rows.map((row) => (
          <div className="guide-preview-row" key={text(row, language)}>
            <span />
            <p>{text(row, language)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function GuidePage() {
  const { language } = useLanguage();
  const isThai = language === 'th';

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const roleCards = [
    { id: 'participants', icon: UsersRound, title: { th: 'ผู้เข้าร่วมกิจกรรม', en: 'Participants' }, description: { th: 'ค้นหารายชื่อ แก้ไขข้อมูล และดูประกาศ', en: 'Search, edit info, and read announcements.' } },
    { id: 'staff', icon: UserCheck, title: { th: 'ทีมงาน', en: 'Staff' }, description: { th: 'เข้าสู่ Staff Mode แก้โปรไฟล์ และเช็กชื่อ', en: 'Use Staff Mode, profile tools, and attendance.' } },
    { id: 'admin', icon: ShieldCheck, title: { th: 'ผู้ดูแลระบบ', en: 'Admin' }, description: { th: 'จัดการข้อมูล ทีมงาน เอกสาร และ Export', en: 'Manage data, staff, documents, and exports.' } },
    { id: 'attendance', icon: QrCode, title: { th: 'ระบบเช็กชื่อ', en: 'Attendance' }, description: { th: 'QR รอบเช็กชื่อ Manual และ QR ส่วนตัว', en: 'Session QR, manual check-in, and personal QR.' } },
  ];

  return (
    <section className="guide-page page-stack has-sticky-actions">
      <PageHeader
        eyebrow={isThai ? 'Guide Center' : 'Guide Center'}
        title={isThai ? 'วิธีใช้งานระบบ Entaneer Gear 56' : 'How to use Entaneer Gear 56'}
        description={isThai ? 'รวมขั้นตอนการใช้งานสำหรับผู้เข้าร่วม ทีมงาน และผู้ดูแลระบบ' : 'A quick guide for participants, staff, and admins.'}
        actions={<Link className="btn btn-secondary btn-md" to="/announcements">{isThai ? 'ดูประกาศล่าสุด' : 'Latest announcements'}</Link>}
      />

      <div className="guide-role-grid" aria-label={isThai ? 'เลือกคู่มือจากบทบาท' : 'Choose a guide by role'}>
        {roleCards.map((role) => {
          const Icon = role.icon;
          return (
            <button key={role.id} className="guide-role-card" type="button" onClick={() => scrollToSection(role.id)}>
              <Icon size={24} aria-hidden="true" />
              <span>{text(role.title, language)}</span>
              <small>{text(role.description, language)}</small>
            </button>
          );
        })}
      </div>

      <GuideSection
        id="participants"
        eyebrow={isThai ? 'Participant Guide' : 'Participant Guide'}
        title={isThai ? 'สำหรับผู้เข้าร่วมกิจกรรม' : 'For Participants'}
      >
        <div className="guide-grid">
          {participantSteps.map((step, index) => <StepCard key={text(step.title, language)} step={step} index={index} language={language} />)}
        </div>
        <div className="guide-cta-row">
          <Link className="btn btn-primary btn-md" to="/">{isThai ? 'ไปหน้ารายชื่อ' : 'Open participant list'}</Link>
          <Link className="btn btn-secondary btn-md" to="/edit">{isThai ? 'แก้ไขข้อมูลของฉัน' : 'Edit my info'}</Link>
          <Link className="btn btn-secondary btn-md" to="/announcements">{isThai ? 'ดูประกาศ' : 'View announcements'}</Link>
        </div>
      </GuideSection>

      <GuideSection
        id="staff"
        eyebrow={isThai ? 'Staff Guide' : 'Staff Guide'}
        title={isThai ? 'สำหรับทีมงาน' : 'For Staff'}
      >
        <div className="guide-mode-grid">
          <Card className="guide-mode-card" variant="soft">
            <h3>{isThai ? 'ทีมงานที่มีบัญชีเข้าสู่ระบบ' : 'Staff with login accounts'}</h3>
            <ul>
              <li>{isThai ? 'ใช้เมนูเข้าสู่ระบบทีมงาน' : 'Use Staff Sign In.'}</li>
              <li>{isThai ? 'เข้า Staff Mode' : 'Open Staff Mode.'}</li>
              <li>{isThai ? 'ดูกลุ่ม/เช็กชื่อ/โปรไฟล์' : 'View group, attendance, and profile tools.'}</li>
            </ul>
          </Card>
          <Card className="guide-mode-card" variant="soft">
            <h3>{isThai ? 'ทีมงานที่ไม่มีบัญชี Auth' : 'Staff without Auth accounts'}</h3>
            <ul>
              <li>{isThai ? 'ใช้เมนูแก้ไขโปรไฟล์ทีมงาน' : 'Use Staff Profile Verify.'}</li>
              <li>{isThai ? 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทร' : 'Verify with email and phone.'}</li>
              <li>{isThai ? 'สามารถแสดง QR ส่วนตัวเพื่อให้แอดมินสแกนเช็กชื่อได้' : 'Show a personal QR for admin-assisted attendance.'}</li>
            </ul>
          </Card>
        </div>
        <div className="guide-grid">
          {staffSteps.map((step, index) => <StepCard key={text(step.title, language)} step={step} index={index} language={language} />)}
        </div>
        <div className="guide-cta-row">
          <Link className="btn btn-primary btn-md" to="/login">{isThai ? 'เข้าสู่ระบบทีมงาน' : 'Staff sign in'}</Link>
          <Link className="btn btn-secondary btn-md" to="/staff/profile/verify">{isThai ? 'แก้ไขโปรไฟล์ทีมงาน' : 'Edit staff profile'}</Link>
          <Link className="btn btn-secondary btn-md" to="/staff/attendance">{isThai ? 'เช็กชื่อทีมงาน' : 'Staff attendance'}</Link>
          <Link className="btn btn-secondary btn-md" to="/staff/profile/qr">{isThai ? 'QR ส่วนตัวทีมงาน' : 'Staff personal QR'}</Link>
        </div>
      </GuideSection>

      <GuideSection
        id="attendance"
        eyebrow={isThai ? 'Attendance Guide' : 'Attendance Guide'}
        title={isThai ? 'ระบบเช็กชื่อทีมงาน' : 'Staff Attendance'}
      >
        <div className="guide-flow-grid">
          {attendanceFlows.map((flow, index) => (
            <Card className="guide-flow-card" key={text(flow.title, language)}>
              <span className="guide-step-index">{index + 1}</span>
              <QrCode size={22} aria-hidden="true" />
              <h3>{text(flow.title, language)}</h3>
              <p className="guide-flow-path">{text(flow.steps, language)}</p>
            </Card>
          ))}
        </div>
        <Card className="guide-note" variant="warning">
          <Smartphone size={20} aria-hidden="true" />
          <p>
            {isThai
              ? 'QR รอบเช็กชื่อใช้สำหรับให้ทีมงานเช็กชื่อด้วยตัวเอง ส่วน QR ส่วนตัวใช้สำหรับให้แอดมินสแกนเช็กชื่อแทน'
              : 'Session QR is for self check-in. Personal QR is for admin-assisted check-in.'}
          </p>
        </Card>
        <div className="guide-cta-row">
          <Link className="btn btn-primary btn-md" to="/staff/attendance">{isThai ? 'เช็กชื่อทีมงาน' : 'Staff attendance'}</Link>
          <Link className="btn btn-secondary btn-md" to="/admin/staff/attendance">{isThai ? 'เข้าหน้าจัดการเช็กชื่อ' : 'Manage attendance'}</Link>
        </div>
      </GuideSection>

      <GuideSection
        id="admin"
        eyebrow={isThai ? 'Admin Guide' : 'Admin Guide'}
        title={isThai ? 'สำหรับผู้ดูแลระบบ' : 'For Admins'}
      >
        <div className="guide-grid">
          {adminSteps.map((step, index) => <StepCard key={text(step.title, language)} step={step} index={index} language={language} />)}
        </div>
        <div className="guide-cta-row">
          <Link className="btn btn-primary btn-md" to="/admin/dashboard">Admin Dashboard</Link>
          <Link className="btn btn-secondary btn-md" to="/admin/staff">{isThai ? 'จัดการทีมงาน' : 'Manage staff'}</Link>
          <Link className="btn btn-secondary btn-md" to="/admin/staff/attendance">{isThai ? 'จัดการรอบเช็กชื่อ' : 'Manage attendance'}</Link>
          <Link className="btn btn-secondary btn-md" to="/admin/documents">Document Center</Link>
        </div>
      </GuideSection>

      <GuideSection
        id="previews"
        eyebrow={isThai ? 'Preview Screens' : 'Preview Screens'}
        title={isThai ? 'ตัวอย่างหน้าจอการใช้งาน' : 'Preview Screens'}
        description={isThai ? 'ตัวอย่างจำลองเหล่านี้ใช้ข้อมูลสมมติเท่านั้น' : 'These previews use safe mock data only.'}
      >
        <div className="guide-preview-grid">
          {previewCards.map((card) => <PreviewMockCard key={text(card.title, language)} card={card} language={language} />)}
        </div>
      </GuideSection>

      <GuideSection
        id="faq"
        eyebrow={isThai ? 'FAQ' : 'FAQ'}
        title={isThai ? 'คำถามที่พบบ่อย' : 'Frequently Asked Questions'}
      >
        <div className="guide-faq-list">
          {faqs.map((faq) => (
            <details className="guide-faq-item" key={text(faq.q, language)}>
              <summary>
                <HelpCircle size={18} aria-hidden="true" />
                <span>{text(faq.q, language)}</span>
              </summary>
              <p>{text(faq.a, language)}</p>
            </details>
          ))}
        </div>
      </GuideSection>
    </section>
  );
}
