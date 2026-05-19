import { Save, SearchCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toast, ToastState } from '../components/ui/Toast';
import { editableFields, fieldLabels } from '../lib/constants';
import type { EditableProfileFields, Profile } from '../lib/types';
import { createEditRequest, pickEditableFields, verifyProfileIdentity } from '../services/profiles';

export function VerifyEditPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<EditableProfileFields | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  async function handleVerify(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setToast(null);
    try {
      const verified = await verifyProfileIdentity(email, phone);
      if (!verified) {
        setToast({ type: 'error', message: 'ไม่พบข้อมูลที่ตรงกับอีเมลและเบอร์โทรนี้' });
        return;
      }
      setProfile(verified);
      setForm(pickEditableFields(verified));
      setToast({ type: 'success', message: 'ยืนยันตัวตนสำเร็จ' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'ยืนยันตัวตนไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!profile || !form) return;
    setLoading(true);
    try {
      await createEditRequest(profile, form);
      setToast({ type: 'success', message: 'ส่งคำขอแก้ไขแล้ว รอแอดมินอนุมัติ' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : 'ส่งคำขอไม่สำเร็จ' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="narrow-page page-stack">
      <Toast toast={toast} />
      <div className="section-heading">
        <p className="eyebrow">ขอแก้ไขข้อมูล</p>
        <h1>ยืนยันตัวตนด้วยอีเมลและเบอร์โทร</h1>
        <p>ข้อมูลที่ส่งจะรอผู้ดูแลอนุมัติก่อนอัปเดตจริงในระบบ</p>
      </div>

      <Card>
        <form className="form-grid" onSubmit={handleVerify}>
          <Input label="อีเมล" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="เบอร์โทร" value={phone} onChange={(event) => setPhone(event.target.value)} required />
          <Button type="submit" disabled={loading} icon={<SearchCheck size={18} />}>
            ตรวจสอบข้อมูล
          </Button>
        </form>
      </Card>

      {loading ? <LoadingSkeleton count={2} /> : null}

      {profile && form ? (
        <Card className="sensitive-panel">
          <h2>{profile.name_th}</h2>
          <p>แก้ไขได้เฉพาะข้อมูลติดต่อและข้อมูลสุขภาพด้านล่าง</p>
          <form className="form-grid two-col" onSubmit={handleSubmit}>
            {editableFields.map((field) => (
              <Input
                key={field}
                label={fieldLabels[field]}
                value={form[field] ?? ''}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
              />
            ))}
            <div className="form-actions full-span">
              <Button type="submit" disabled={loading} icon={<Save size={18} />}>
                ส่งคำขอแก้ไข
              </Button>
            </div>
          </form>
        </Card>
      ) : null}
    </section>
  );
}
