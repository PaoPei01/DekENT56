import { ClipboardCheck, QrCode, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Toast, ToastState } from '../components/ui/Toast';
import { demoAttendanceSessions, demoEvent, demoStaff } from '../data/demoEntaneerGear56';

function attendanceLabel(status: string) {
  if (status === 'checked_in') return 'เช็กชื่อแล้ว';
  if (status === 'late') return 'มาสาย';
  return 'ยังไม่เช็กชื่อ';
}

export function DemoAttendanceFlowPage() {
  const [activeSession, setActiveSession] = useState(demoAttendanceSessions[1].id);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const session = demoAttendanceSessions.find((item) => item.id === activeSession) ?? demoAttendanceSessions[0];
  const staffRows = useMemo(() => demoStaff
    .filter((staff) => {
      const term = search.trim().toLowerCase();
      return !term || staff.name_th.toLowerCase().includes(term) || staff.nickname.toLowerCase().includes(term) || staff.student_id.includes(term);
    })
    .slice(0, 12), [search]);
  const notify = (message: string) => {
    setToast({ type: 'success', message });
    window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <section className="demo-page page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow="โหมดสาธิต · Demo Mode"
        title="ระบบเช็กชื่อทีมงาน"
        description={`สาธิตการเช็กชื่อทีมงานสำหรับ ${demoEvent.name_th} / ${demoEvent.secondary_name_th} โดยใช้ข้อมูลจำลองเท่านั้น`}
        meta={<Link className="btn btn-secondary" to="/demo">กลับหน้า Demo</Link>}
      />
      <Card className="demo-warning-card" variant="warning">
        <strong>Demo Mode · ข้อมูลทั้งหมดเป็นข้อมูลจำลอง · All data shown here is mock data.</strong>
        <span>ไม่มีการเปิดกล้องจริง ไม่มีการบันทึกข้อมูล และไม่มีการเรียก Supabase write API</span>
      </Card>

      <Card>
        <p className="eyebrow">เลือกรอบเช็กชื่อ</p>
        <div className="demo-segmented">
          {demoAttendanceSessions.map((item) => (
            <button key={item.id} className={activeSession === item.id ? 'is-active' : ''} onClick={() => setActiveSession(item.id)} type="button">
              {item.title_th}
            </button>
          ))}
        </div>
      </Card>

      <div className="demo-two-column">
        <Card className="demo-qr-card">
          <QrCode size={44} />
          <h2>QR Check-in</h2>
          <p>ทีมงานสามารถสแกน QR เพื่อบันทึกเวลาเช็กชื่อได้</p>
          <div className="demo-qr-placeholder" aria-label="Fake QR placeholder">
            <span />
            <span />
            <span />
            <span />
          </div>
          <small>QR นี้เป็นภาพจำลอง ไม่ใช่ token จริง</small>
        </Card>
        <Card>
          <p className="eyebrow">Attendance summary</p>
          <h2>{session.title_th}</h2>
          <div className="demo-metric-row">
            <span><strong>226</strong> ทีมงานทั้งหมด</span>
            <span><strong>{session.checked_in}</strong> เช็กชื่อแล้ว</span>
            <span><strong>{session.pending}</strong> ยังไม่เช็กชื่อ</span>
            <span><strong>{session.late}</strong> มาสาย</span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Checked-in list</p>
            <h2>รายชื่อทีมงานในรอบนี้</h2>
          </div>
        </div>
        <div className="demo-list-grid">
          {staffRows.map((staff) => (
            <Card className="demo-mini-card" key={staff.id} variant="soft">
              <strong>{staff.nickname} · {staff.role}</strong>
              <span>{staff.student_id} · {attendanceLabel(staff.attendance_status)}</span>
              <small>{staff.phone}</small>
            </Card>
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Manual fallback</p>
        <h2>เช็กชื่อแบบแมนนวลเมื่อเกิดปัญหาหน้างาน</h2>
        <Input label="ค้นหาจากชื่อ / รหัสนักศึกษา / ชื่อเล่น" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="เช่น ต้น หรือ 660000001" />
        <Button icon={<Search size={16} />} onClick={() => notify('สาธิตการเช็กชื่อแบบแมนนวลแล้ว')}>เช็กชื่อแบบแมนนวล</Button>
      </Card>

      <Card className="demo-warning-card" variant="soft">
        <ClipboardCheck size={24} />
        <div>
          <strong>Demo Mode</strong>
          <span>All data shown here is mock data. ใช้สำหรับ Entaneer Gear 56 / สานสัมพันธ์ 69 เท่านั้น</span>
        </div>
      </Card>
    </section>
  );
}
