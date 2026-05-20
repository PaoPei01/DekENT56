import { Plus, Save, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Toast, ToastState } from '../components/ui/Toast';
import type { DocumentBudgetItem, DocumentEquipmentItem, DocumentProjectProfile, DocumentScheduleItem, DocumentVenue } from '../lib/documentTypes';
import { useAsync } from '../hooks/useAsync';
import { fetchDocumentCenterData, saveProjectProfile } from '../services/documents';
import { errorMessage } from '../utils/error';

const blankProfile: Partial<DocumentProjectProfile> = { project_name: 'สานสัมพันธ์ 69 Entaneer Bonding 69', academic_year: '2569', organizer: 'คณะวิศวกรรมศาสตร์', department: 'มหาวิทยาลัยเชียงใหม่' };

export function DocumentSettingsPage() {
  const state = useAsync(fetchDocumentCenterData, []);
  const [profile, setProfile] = useState<Partial<DocumentProjectProfile>>(blankProfile);
  const [budgetItems, setBudgetItems] = useState<Array<Partial<DocumentBudgetItem>>>([]);
  const [scheduleItems, setScheduleItems] = useState<Array<Partial<DocumentScheduleItem>>>([]);
  const [venues, setVenues] = useState<Array<Partial<DocumentVenue>>>([]);
  const [equipmentItems, setEquipmentItems] = useState<Array<Partial<DocumentEquipmentItem>>>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!state.data) return;
    setProfile(state.data.profile ?? blankProfile);
    setBudgetItems(state.data.budgetItems.length ? state.data.budgetItems : [{ item_name: '', quantity: 1, unit: '', unit_price: 0, notes: '' }]);
    setScheduleItems(state.data.scheduleItems.length ? state.data.scheduleItems : [{ title: '', item_date: '', start_time: '', end_time: '', responsible: '' }]);
    setVenues(state.data.venues.length ? state.data.venues : [{ name: '', address: '', capacity: null, notes: '' }]);
    setEquipmentItems(state.data.equipmentItems.length ? state.data.equipmentItems : [{ name: '', quantity: 1, unit: '', responsible: '', notes: '' }]);
  }, [state.data]);

  async function save() {
    try {
      setSaving(true);
      await saveProjectProfile({ profile, budgetItems, scheduleItems, venues, equipmentItems });
      setToast({ type: 'success', message: 'บันทึกข้อมูลศูนย์เอกสารแล้ว' });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, 'บันทึกไม่สำเร็จ') });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader eyebrow="Document Center" title="ตั้งค่าโครงการ" description="ข้อมูลนี้จะถูกนำไปเติมใน DOCX template" />
      {state.loading ? <LoadingSkeleton /> : null}
      <Card className="form-grid two-col">
        <Input label="ชื่อโครงการ" value={profile.project_name ?? ''} onChange={(event) => setProfile({ ...profile, project_name: event.target.value })} />
        <Input label="รหัสโครงการ" value={profile.project_code ?? ''} onChange={(event) => setProfile({ ...profile, project_code: event.target.value })} />
        <Input label="ปีการศึกษา" value={profile.academic_year ?? ''} onChange={(event) => setProfile({ ...profile, academic_year: event.target.value })} />
        <Input label="ผู้จัด/หน่วยงาน" value={profile.organizer ?? ''} onChange={(event) => setProfile({ ...profile, organizer: event.target.value })} />
        <Input label="ภาค/ฝ่าย" value={profile.department ?? ''} onChange={(event) => setProfile({ ...profile, department: event.target.value })} />
        <Input label="สถานที่หลัก" value={profile.location ?? ''} onChange={(event) => setProfile({ ...profile, location: event.target.value })} />
        <Input label="วันที่เริ่ม" type="date" value={profile.start_date ?? ''} onChange={(event) => setProfile({ ...profile, start_date: event.target.value })} />
        <Input label="วันที่สิ้นสุด" type="date" value={profile.end_date ?? ''} onChange={(event) => setProfile({ ...profile, end_date: event.target.value })} />
        <Input label="ผู้ประสานงาน" value={profile.contact_name ?? ''} onChange={(event) => setProfile({ ...profile, contact_name: event.target.value })} />
        <Input label="เบอร์ติดต่อ" value={profile.contact_phone ?? ''} onChange={(event) => setProfile({ ...profile, contact_phone: event.target.value })} />
        <label className="field full-span"><span>วัตถุประสงค์</span><textarea value={profile.objective ?? ''} onChange={(event) => setProfile({ ...profile, objective: event.target.value })} /></label>
        <label className="field full-span"><span>หมายเหตุ</span><textarea value={profile.notes ?? ''} onChange={(event) => setProfile({ ...profile, notes: event.target.value })} /></label>
      </Card>

      <EditableSection title="งบประมาณ" onAdd={() => setBudgetItems([...budgetItems, { item_name: '', quantity: 1, unit_price: 0 }])}>
        {budgetItems.map((item, index) => (
          <div className="document-row-grid" key={index}>
            <Input label="รายการ" value={item.item_name ?? ''} onChange={(event) => setBudgetItems(budgetItems.map((row, i) => i === index ? { ...row, item_name: event.target.value } : row))} />
            <Input label="จำนวน" type="number" value={item.quantity ?? ''} onChange={(event) => setBudgetItems(budgetItems.map((row, i) => i === index ? { ...row, quantity: Number(event.target.value) } : row))} />
            <Input label="หน่วย" value={item.unit ?? ''} onChange={(event) => setBudgetItems(budgetItems.map((row, i) => i === index ? { ...row, unit: event.target.value } : row))} />
            <Input label="ราคาต่อหน่วย" type="number" value={item.unit_price ?? ''} onChange={(event) => setBudgetItems(budgetItems.map((row, i) => i === index ? { ...row, unit_price: Number(event.target.value) } : row))} />
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setBudgetItems(budgetItems.filter((_, i) => i !== index))}>ลบ</Button>
          </div>
        ))}
      </EditableSection>

      <EditableSection title="กำหนดการ" onAdd={() => setScheduleItems([...scheduleItems, { title: '', item_date: '', start_time: '', end_time: '' }])}>
        {scheduleItems.map((item, index) => (
          <div className="document-row-grid" key={index}>
            <Input label="วันที่" type="date" value={item.item_date ?? ''} onChange={(event) => setScheduleItems(scheduleItems.map((row, i) => i === index ? { ...row, item_date: event.target.value } : row))} />
            <Input label="เริ่ม" type="time" value={item.start_time ?? ''} onChange={(event) => setScheduleItems(scheduleItems.map((row, i) => i === index ? { ...row, start_time: event.target.value } : row))} />
            <Input label="สิ้นสุด" type="time" value={item.end_time ?? ''} onChange={(event) => setScheduleItems(scheduleItems.map((row, i) => i === index ? { ...row, end_time: event.target.value } : row))} />
            <Input label="กิจกรรม" value={item.title ?? ''} onChange={(event) => setScheduleItems(scheduleItems.map((row, i) => i === index ? { ...row, title: event.target.value } : row))} />
            <Input label="ผู้รับผิดชอบ" value={item.responsible ?? ''} onChange={(event) => setScheduleItems(scheduleItems.map((row, i) => i === index ? { ...row, responsible: event.target.value } : row))} />
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setScheduleItems(scheduleItems.filter((_, i) => i !== index))}>ลบ</Button>
          </div>
        ))}
      </EditableSection>

      <EditableSection title="สถานที่" onAdd={() => setVenues([...venues, { name: '', address: '' }])}>
        {venues.map((item, index) => (
          <div className="document-row-grid" key={index}>
            <Input label="ชื่อสถานที่" value={item.name ?? ''} onChange={(event) => setVenues(venues.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} />
            <Input label="ที่อยู่" value={item.address ?? ''} onChange={(event) => setVenues(venues.map((row, i) => i === index ? { ...row, address: event.target.value } : row))} />
            <Input label="ความจุ" type="number" value={item.capacity ?? ''} onChange={(event) => setVenues(venues.map((row, i) => i === index ? { ...row, capacity: Number(event.target.value) } : row))} />
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setVenues(venues.filter((_, i) => i !== index))}>ลบ</Button>
          </div>
        ))}
      </EditableSection>

      <EditableSection title="อุปกรณ์" onAdd={() => setEquipmentItems([...equipmentItems, { name: '', quantity: 1, unit: '' }])}>
        {equipmentItems.map((item, index) => (
          <div className="document-row-grid" key={index}>
            <Input label="อุปกรณ์" value={item.name ?? ''} onChange={(event) => setEquipmentItems(equipmentItems.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} />
            <Input label="จำนวน" type="number" value={item.quantity ?? ''} onChange={(event) => setEquipmentItems(equipmentItems.map((row, i) => i === index ? { ...row, quantity: Number(event.target.value) } : row))} />
            <Input label="หน่วย" value={item.unit ?? ''} onChange={(event) => setEquipmentItems(equipmentItems.map((row, i) => i === index ? { ...row, unit: event.target.value } : row))} />
            <Input label="ผู้รับผิดชอบ" value={item.responsible ?? ''} onChange={(event) => setEquipmentItems(equipmentItems.map((row, i) => i === index ? { ...row, responsible: event.target.value } : row))} />
            <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setEquipmentItems(equipmentItems.filter((_, i) => i !== index))}>ลบ</Button>
          </div>
        ))}
      </EditableSection>

      <div className="sticky-form-actions">
        <Button icon={<Save size={18} />} onClick={save} disabled={saving}>บันทึกข้อมูลโครงการ</Button>
      </div>
    </section>
  );
}

function EditableSection({ title, onAdd, children }: { title: string; onAdd: () => void; children: ReactNode }) {
  return (
    <Card className="document-edit-section">
      <div className="staff-section-head">
        <h2>{title}</h2>
        <Button variant="secondary" icon={<Plus size={16} />} onClick={onAdd}>เพิ่ม</Button>
      </div>
      {children}
    </Card>
  );
}
