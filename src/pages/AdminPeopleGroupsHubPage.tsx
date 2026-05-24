import { Database, FileSpreadsheet, GitMerge, Pencil, UsersRound } from 'lucide-react';
import { PortalActionCard } from '../components/PortalActionCard';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useLanguage } from '../context/LanguageContext';

export function AdminPeopleGroupsHubPage() {
  const { language } = useLanguage();

  return (
    <section className="page-stack">
      <PageHeader
        eyebrow={language === 'th' ? 'รายชื่อและกลุ่ม' : 'People & Groups'}
        title={language === 'th' ? 'รายชื่อและกลุ่ม' : 'People & Groups'}
        description={language === 'th' ? 'จัดการข้อมูลบุคคล รายชื่อผู้เข้าร่วม การจัดกลุ่ม และคำขอแก้ไขข้อมูล' : 'Manage people records, participants, group assignments, and edit requests.'}
      />
      <Card className="workflow-explainer-card" variant="soft">
        <div>
          <strong>{language === 'th' ? 'ใช้ hub นี้เมื่อเกี่ยวกับ “คน” และ “กลุ่ม”' : 'Use this hub for people and grouping work'}</strong>
          <span>{language === 'th' ? 'ข้อมูลส่วนตัวและข้อมูลสุขภาพยังอยู่หลังสิทธิ์แอดมินตามเดิม ไม่มีการเปิดเผยสาธารณะจากหน้านี้' : 'Private and health data remain behind existing admin access. This page does not expose anything publicly.'}</span>
        </div>
      </Card>
      <div className="staff-action-grid">
        <PortalActionCard to="/admin/people" icon={<Database size={28} />} title={language === 'th' ? 'ฐานข้อมูลบุคคล' : 'People database'} description={language === 'th' ? 'จัดการข้อมูลกลางของนักศึกษาและผู้เข้าร่วม' : 'Manage central student and participant records.'} primary />
        <PortalActionCard to="/admin/groups" icon={<UsersRound size={28} />} title={language === 'th' ? 'จัดกลุ่ม' : 'Groups'} description={language === 'th' ? 'จัดการกลุ่มสี กลุ่มย่อย จุดนัดพบ และพี่กลุ่ม' : 'Manage color groups, subgroups, meeting points, and mentors.'} />
        <PortalActionCard to="/admin/requests" icon={<Pencil size={28} />} title={language === 'th' ? 'คำขอแก้ไขผู้เข้าร่วม' : 'Participant edit requests'} description={language === 'th' ? 'ตรวจคำขอแก้ไขข้อมูลที่ผู้เข้าร่วมส่งจากหน้าข้อมูลของฉัน' : 'Review edit requests submitted from the My information page.'} />
        <PortalActionCard to="/admin/people/update-requests" icon={<Pencil size={28} />} title={language === 'th' ? 'คำร้องแก้ข้อมูลบุคคล' : 'People update requests'} description={language === 'th' ? 'ตรวจคำร้องที่เกี่ยวกับอีเมล เบอร์โทร หรือข้อมูลยืนยันตัวตน' : 'Review requests related to identity fields such as email or phone.'} />
        <PortalActionCard to="/admin/people/dedupe" icon={<GitMerge size={28} />} title={language === 'th' ? 'ตรวจข้อมูลซ้ำ' : 'Duplicate check'} description={language === 'th' ? 'ตรวจรายการที่อาจเป็นคนเดียวกันและต้องรวมข้อมูล' : 'Review records that may belong to the same person.'} />
        <PortalActionCard to="/admin/people/import-year2" icon={<FileSpreadsheet size={28} />} title={language === 'th' ? 'นำเข้าฐานปี 2' : 'Import Year 2'} description={language === 'th' ? 'นำเข้าข้อมูลผ่าน staging และ preview ก่อน import จริง' : 'Import through staging with preview before the final import.'} />
      </div>
    </section>
  );
}
