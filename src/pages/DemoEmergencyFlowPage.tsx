import { Phone, ShieldAlert, Umbrella } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Toast, ToastState } from '../components/ui/Toast';
import { demoEmergencyCases, demoRainPlans } from '../data/demoEntaneerGear56';

type DemoCase = Omit<typeof demoEmergencyCases[number], 'status'> & {
  status: 'open' | 'in_progress' | 'resolved';
};

function priorityLabel(priority: string) {
  if (priority === 'high') return 'สูง';
  if (priority === 'medium') return 'กลาง';
  return 'ต่ำ';
}

function statusLabel(status: string) {
  if (status === 'in_progress') return 'กำลังดูแล';
  if (status === 'resolved') return 'ปิดเคสแล้ว';
  return 'เปิดอยู่';
}

export function DemoEmergencyFlowPage() {
  const [cases, setCases] = useState<DemoCase[]>(demoEmergencyCases.map((item) => ({ ...item })));
  const [toast, setToast] = useState<ToastState>(null);
  const updateCase = (id: string, status: DemoCase['status'], message: string) => {
    setCases((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setToast({ type: 'info', message });
    window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <section className="demo-page page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow="โหมดสาธิต · Demo Mode"
        title="เหตุฉุกเฉินและหน้างาน"
        description="สาธิตการดูเคสหน้างาน การประสานฝ่ายพยาบาล จราจร พี่กลุ่ม และทีมระบบ ด้วยข้อมูลจำลองเท่านั้น"
        meta={<Link className="btn btn-secondary" to="/demo">กลับหน้า Demo</Link>}
      />
      <Card className="demo-warning-card" variant="warning">
        <strong>Demo Mode · ข้อมูลทั้งหมดเป็นข้อมูลจำลอง · All data shown here is mock data.</strong>
        <span>ตัวอย่างนี้ไม่ใช้เหตุการณ์รุนแรง ไม่ใช้ข้อมูลจริง และไม่มีการบันทึกลงฐานข้อมูล</span>
      </Card>

      <div className="stats-grid">
        <Card className="demo-stat-card"><strong>4</strong><span>เคสเปิดอยู่</span></Card>
        <Card className="demo-stat-card"><strong>1</strong><span>ส่งต่อฝ่ายพยาบาล</span></Card>
        <Card className="demo-stat-card"><strong>2</strong><span>พี่กลุ่มดูแล</span></Card>
        <Card className="demo-stat-card"><strong>6</strong><span>ปิดแล้ววันนี้</span></Card>
      </div>

      <Card>
        <p className="eyebrow">Case board</p>
        <h2>เคสหน้างานจำลอง</h2>
        <div className="demo-card-grid">
          {cases.map((item) => (
            <Card className="demo-action-card" key={item.id} variant={item.priority === 'high' ? 'warning' : 'soft'}>
              <span className={`badge ${item.status === 'resolved' ? 'badge-approved' : item.priority === 'high' ? 'badge-rejected' : 'badge-pending'}`}>
                {priorityLabel(item.priority)} · {statusLabel(item.status)}
              </span>
              <h3>{item.title_th}</h3>
              <p>{item.location_th}</p>
              <span>ผู้รับผิดชอบ: {item.responsible_role}</span>
              <div className="demo-inline-actions">
                <Button size="sm" variant="secondary" onClick={() => updateCase(item.id, 'in_progress', 'รับเคสจำลองแล้ว')}>รับเคส</Button>
                <Button size="sm" variant="secondary" onClick={() => updateCase(item.id, 'in_progress', 'ส่งต่อฝ่ายพยาบาลจำลองแล้ว')}>ส่งต่อฝ่ายพยาบาล</Button>
                <Button size="sm" onClick={() => updateCase(item.id, 'resolved', 'ปิดเคสจำลองแล้ว')}>ปิดเคส</Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Contact matrix</p>
        <h2>ผู้ประสานงานจำลอง</h2>
        <div className="demo-card-grid demo-card-grid-compact">
          {[
            ['พี่กลุ่ม', '08x-xxx-2101'],
            ['พยาบาล', '08x-xxx-2102'],
            ['จราจร', '08x-xxx-2103'],
            ['ทีมระบบ', '08x-xxx-2104'],
            ['ผู้ดูแลกิจกรรม', '08x-xxx-2105'],
          ].map(([role, phone]) => (
            <Card className="demo-mini-card" key={role} variant="soft">
              <Phone size={18} />
              <strong>{role}</strong>
              <span>{phone}</span>
            </Card>
          ))}
        </div>
      </Card>

      <Card>
        <p className="eyebrow">Weather/rain plan</p>
        <h2>แผนรับมือฝนสำหรับ Entaneer Gear 56</h2>
        <div className="demo-list-grid">
          {demoRainPlans.map((plan) => (
            <div className="demo-data-row" key={plan.condition_th}>
              <Umbrella size={18} />
              <strong>{plan.condition_th}</strong>
              <span>{plan.action_th}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="demo-warning-card" variant="soft">
        <ShieldAlert size={24} />
        <div>
          <strong>Demo Mode</strong>
          <span>All data shown here is mock data. ใช้สำหรับ Entaneer Gear 56 / สานสัมพันธ์ 69 เท่านั้น</span>
        </div>
      </Card>
    </section>
  );
}
