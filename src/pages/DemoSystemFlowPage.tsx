import { AlertTriangle, ClipboardCheck, Download, History, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Toast, ToastState } from '../components/ui/Toast';
import { demoEvent, demoGroups, demoStaffRoles, demoStations } from '../data/demoEntaneerGear56';

function readinessLabel(status: string) {
  if (status === 'ready') return 'ปกติ';
  if (status === 'warning') return 'ต้องตรวจสอบ';
  return 'ต้องแก้ไข';
}

function badgeClass(status: string) {
  if (status === 'ready') return 'badge-approved';
  if (status === 'warning') return 'badge-pending';
  return 'badge-rejected';
}

export function DemoSystemFlowPage() {
  const [toast, setToast] = useState<ToastState>(null);
  const [modal, setModal] = useState('');
  const notify = (message: string) => {
    setToast({ type: 'info', message });
    window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <section className="demo-page page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow="โหมดสาธิต · Demo Mode"
        title="มุมมองทีมงานระบบ"
        description="Dashboard จำลองสำหรับตรวจความพร้อมของข้อมูล รายชื่อทีมงาน กลุ่ม สี ฐาน และสถานะการเช็กชื่อของ Entaneer Gear 56"
        meta={<Link className="btn btn-secondary" to="/demo">กลับหน้า Demo</Link>}
      />
      <Card className="demo-warning-card" variant="warning">
        <strong>Demo Mode · ข้อมูลทั้งหมดเป็นข้อมูลจำลอง · All data shown here is mock data.</strong>
        <span>ใช้สำหรับ Entaneer Gear 56 / สานสัมพันธ์ 69 เท่านั้น ไม่มีการเรียก API เพื่อเขียนข้อมูล</span>
      </Card>

      <div className="stats-grid">
        <Card className="demo-stat-card"><strong>{demoEvent.total_expected.toLocaleString('th-TH')}</strong><span>ผู้เข้าร่วมทั้งหมดประมาณ</span></Card>
        <Card className="demo-stat-card"><strong>{demoEvent.expected_freshmen.toLocaleString('th-TH')}</strong><span>นักศึกษาใหม่ประมาณ</span></Card>
        <Card className="demo-stat-card"><strong>{demoEvent.staff_total}</strong><span>ทีมงาน</span></Card>
        <Card className="demo-stat-card"><strong>{demoEvent.group_count}</strong><span>กลุ่มสี</span></Card>
        <Card className="demo-stat-card"><strong>14</strong><span>กลุ่มย่อย</span></Card>
        <Card className="demo-stat-card"><strong>7</strong><span>ฐานกิจกรรม</span></Card>
      </div>

      <Card>
        <p className="eyebrow">Data Health</p>
        <h2>ตรวจความพร้อมข้อมูล</h2>
        <div className="demo-list-grid">
          {[
            ['รายชื่อซ้ำ', '3 รายการ', 'ต้องตรวจสอบ'],
            ['ยังไม่มีกลุ่ม', '8 รายการ', 'ต้องแก้ไข'],
            ['เบอร์โทรไม่ครบ', '12 รายการ', 'ต้องตรวจสอบ'],
            ['โปรไฟล์ทีมงานยังไม่ยืนยัน', '6 รายการ', 'ต้องตรวจสอบ'],
            ['ข้อมูลพร้อมใช้งาน', '96%', 'ปกติ'],
          ].map(([label, value, status]) => (
            <div className="demo-data-row" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <em>{status}</em>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Group Distribution</p>
        <h2>กระจายกลุ่มสี</h2>
        <div className="demo-table">
          <div className="demo-table-head"><span>สี</span><span>A/B</span><span>จำนวนคน</span><span>พี่กลุ่ม</span><span>เช็กชื่อแล้ว</span><span>สถานะ</span></div>
          {demoGroups.map((group) => (
            <div className="demo-table-row" key={group.group_key}>
              <span>{group.label_th}</span>
              <span>{group.subgroups.join(' / ')}</span>
              <span>{group.participant_count}</span>
              <span>{group.staff_count}</span>
              <span>{group.checked_in_count}</span>
              <span className={group.emergency_flag_count ? 'badge badge-pending' : 'badge badge-approved'}>{group.emergency_flag_count ? 'ต้องตรวจสอบ' : 'ปกติ'}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="demo-card-grid">
        {demoStations.map((station) => (
          <Card className="demo-action-card" key={station.station_number}>
            <span className={`badge ${badgeClass(station.status)}`}>{readinessLabel(station.status)}</span>
            <h2>ฐาน {station.station_number}</h2>
            <p>{station.location_th}</p>
            <span>{station.departments.join(', ')}</span>
            <div className="demo-metric-row">
              <span><strong>{station.staff_quota}</strong> quota</span>
              <span><strong>{station.checked_in_staff_count}</strong> checked-in</span>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <p className="eyebrow">Staff Role Summary</p>
        <h2>โควต้าทีมงาน</h2>
        <div className="demo-role-grid">
          {demoStaffRoles.map((role) => <span key={role.role}><strong>{role.label_th}</strong>{role.quota}</span>)}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Admin Actions Demo</p>
        <h2>การกระทำจำลอง</h2>
        <div className="demo-inline-actions">
          <Button icon={<ClipboardCheck size={16} />} onClick={() => notify('สาธิตการตรวจ Data Health เท่านั้น')}>ตรวจ Data Health</Button>
          <Button variant="secondary" icon={<Download size={16} />} onClick={() => setModal('export')}>ส่งออก Excel รายชื่อ</Button>
          <Button variant="secondary" icon={<ClipboardCheck size={16} />} onClick={() => notify('เปิดระบบเช็กชื่อจำลอง')}>เปิดระบบเช็กชื่อ</Button>
          <Button variant="secondary" icon={<ShieldAlert size={16} />} onClick={() => notify('เปิด Emergency Dashboard จำลอง')}>เปิด Emergency Dashboard</Button>
          <Button variant="secondary" icon={<History size={16} />} onClick={() => notify('ดู log จำลอง ไม่มีข้อมูลจริง')}>ดู Log การเปลี่ยนแปลง</Button>
        </div>
      </Card>

      <Modal open={modal === 'export'} title="Excel export concept" onClose={() => setModal('')}>
        <div className="modal-body page-stack">
          <AlertTriangle size={28} />
          <p>ตัวอย่างนี้แสดงแนวคิดการ export เท่านั้น ไม่มีการดาวน์โหลดไฟล์จริง และไม่มีการใช้ข้อมูลจริง</p>
          <Button onClick={() => { setModal(''); notify('สาธิต export concept แล้ว'); }}>รับทราบ</Button>
        </div>
      </Modal>
    </section>
  );
}
