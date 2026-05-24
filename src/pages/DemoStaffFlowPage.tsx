import { Bell, BookOpen, ClipboardCheck, ShieldAlert } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { demoParticipants, demoStaff } from '../data/demoEntaneerGear56';

const roleOptions = ['พี่กลุ่ม', 'พี่ฐาน', 'ฝ่ายจราจร', 'ฝ่ายพยาบาล', 'ฝ่ายสวัสดิการ', 'ฝ่ายช่างภาพ'];
const schedule = ['ลงทะเบียน', 'เปิดกิจกรรม', 'เดินฐาน', 'พักกลางวัน', 'กิจกรรมฐานรอบบ่าย', 'สรุปกิจกรรม'];

function statusText(status: string) {
  if (status === 'checked_in') return 'เช็กชื่อแล้ว';
  if (status === 'late') return 'มาสาย';
  return 'ยังไม่เช็กชื่อ';
}

function dutyCopy(role: string) {
  const copy: Record<string, string> = {
    พี่กลุ่ม: 'ดูแลน้องในกลุ่ม แนะนำจุดรวมพล ตรวจรายชื่อ และประสานฐานกิจกรรม',
    พี่ฐาน: 'เตรียมกิจกรรมประจำฐาน ดูแลความปลอดภัย และสรุปสถานะรอบกิจกรรม',
    ฝ่ายจราจร: 'ดูแลเส้นทาง จุดข้ามถนน จุดจอดรถ และการเคลื่อนย้ายกลุ่ม',
    ฝ่ายพยาบาล: 'ประสานเคสสุขภาพเบื้องต้นและดูแลพื้นที่พักคอย',
    ฝ่ายสวัสดิการ: 'ดูแลอาหาร น้ำดื่ม อุปกรณ์ และจุดพักของทีมงาน',
    ฝ่ายช่างภาพ: 'เก็บภาพกิจกรรมตามจุดสำคัญและประสานช่วงถ่ายภาพรวม',
  };
  return copy[role] ?? copy['พี่กลุ่ม'];
}

export function DemoStaffFlowPage() {
  const [role, setRole] = useState('พี่กลุ่ม');
  const [search, setSearch] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);
  const [followOnly, setFollowOnly] = useState(false);
  const redA = demoParticipants.filter((item) => item.main_group === 'แดง' && item.subgroup === 'A');
  const filteredParticipants = useMemo(() => redA
    .filter((item) => !pendingOnly || item.check_in_status !== 'checked_in')
    .filter((item) => !followOnly || item.check_in_status === 'late' || item.check_in_status === 'pending')
    .filter((item) => {
      const term = search.trim().toLowerCase();
      return !term || item.nickname.toLowerCase().includes(term) || item.name_th.toLowerCase().includes(term) || item.student_id.includes(term);
    })
    .slice(0, 8), [followOnly, pendingOnly, redA, search]);
  const groupStaff = demoStaff.filter((item) => item.main_group === 'แดง' && item.subgroup === 'A').slice(0, 5);

  return (
    <section className="demo-page page-stack">
      <PageHeader
        eyebrow="โหมดสาธิต · Demo Mode"
        title="มุมมองทีมงานทั่วไป"
        description="ทีมงานสามารถดูข้อมูลที่เกี่ยวข้องกับหน้าที่ของตนเอง เช่น กลุ่มที่รับผิดชอบ รายชื่อผู้เข้าร่วม จุดรวมพล ฐานกิจกรรม และสถานะการเช็กชื่อ"
        meta={<Link className="btn btn-secondary" to="/demo">กลับหน้า Demo</Link>}
      />
      <Card className="demo-warning-card" variant="warning">
        <strong>Demo Mode · ข้อมูลทั้งหมดเป็นข้อมูลจำลอง · All data shown here is mock data.</strong>
        <span>ใช้สำหรับ Entaneer Gear 56 / สานสัมพันธ์ 69 เท่านั้น</span>
      </Card>

      <div className="demo-two-column">
        <Card className="demo-profile-card">
          <p className="eyebrow">Staff Mode Overview</p>
          <h2>นายตัวอย่าง ทีมงาน</h2>
          <div className="demo-fact-grid">
            <span><strong>บทบาท</strong>พี่กลุ่ม</span>
            <span><strong>กลุ่ม</strong>แดง A</span>
            <span><strong>สถานะโปรไฟล์</strong>ยืนยันแล้ว</span>
            <span><strong>สถานะเช็กชื่อ</strong>เช็กชื่อแล้ว</span>
          </div>
        </Card>
        <Card className="demo-profile-card" variant="soft">
          <h2>My Group · กลุ่ม แดง A</h2>
          <div className="demo-metric-row">
            <span><strong>75</strong> ผู้เข้าร่วม</span>
            <span><strong>68</strong> เช็กชื่อแล้ว</span>
            <span><strong>7</strong> ยังไม่เช็กชื่อ</span>
            <span><strong>{groupStaff.length}</strong> พี่กลุ่ม</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="section-title-row">
          <div>
            <p className="eyebrow">My Group</p>
            <h2>รายชื่อกลุ่ม แดง A</h2>
          </div>
          <div className="demo-inline-actions">
            <Button variant={pendingOnly ? 'primary' : 'secondary'} icon={<ClipboardCheck size={16} />} onClick={() => setPendingOnly((value) => !value)}>กรองเฉพาะยังไม่เช็กชื่อ</Button>
            <Button variant={followOnly ? 'primary' : 'secondary'} icon={<ShieldAlert size={16} />} onClick={() => setFollowOnly((value) => !value)}>ดูเฉพาะคนที่ต้องติดตาม</Button>
          </div>
        </div>
        <Input label="ค้นหารายชื่อในกลุ่ม" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาจากชื่อ รหัส หรือนickname" />
        <div className="demo-list-grid">
          {filteredParticipants.map((participant) => (
            <Card className="demo-mini-card" key={participant.id} variant="soft">
              <strong>{participant.nickname}</strong>
              <span>{participant.major} · {statusText(participant.check_in_status)}</span>
              <small>{participant.public_safe_note}</small>
            </Card>
          ))}
        </div>
      </Card>

      <div className="demo-two-column">
        <Card>
          <p className="eyebrow">Activity Schedule</p>
          <h2>กำหนดการย่อ</h2>
          <div className="demo-timeline">
            {schedule.map((item, index) => <span key={item}><strong>{index + 1}</strong>{item}</span>)}
          </div>
        </Card>
        <Card>
          <p className="eyebrow">Station / Duty Info</p>
          <Select label="เลือกบทบาทจำลอง" value={role} onChange={(event) => setRole(event.target.value)} options={roleOptions} />
          <Card className="demo-duty-card" variant="soft">
            <strong>{role}</strong>
            <span>{dutyCopy(role)}</span>
          </Card>
        </Card>
      </div>

      <div className="demo-card-grid demo-card-grid-compact">
        {[
          ['เช็กชื่อทีมงาน', <ClipboardCheck size={20} />],
          ['ดูประกาศล่าสุด', <Bell size={20} />],
          ['แจ้งเหตุหน้างาน', <ShieldAlert size={20} />],
          ['เปิดคู่มือทีมงาน', <BookOpen size={20} />],
        ].map(([label, icon]) => (
          <Card className="demo-quick-action" key={String(label)} variant="soft">
            {icon}
            <strong>{label}</strong>
            <small>สาธิตเท่านั้น ไม่มีการบันทึกข้อมูลจริง</small>
          </Card>
        ))}
      </div>
    </section>
  );
}
