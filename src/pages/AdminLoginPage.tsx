import { LogIn } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toast, ToastState } from '../components/ui/Toast';
import { supabase } from '../lib/supabase';

export function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const navigate = useNavigate();

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setToast(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setToast({ type: 'error', message: error.message });
      return;
    }
    navigate('/admin/dashboard');
  }

  return (
    <section className="narrow-page page-stack">
      <Toast toast={toast} />
      <div className="section-heading">
        <p className="eyebrow">Admin</p>
        <h1>เข้าสู่ระบบผู้ดูแล</h1>
        <p>ใช้บัญชี Supabase Auth ที่ถูกเพิ่มในตาราง admins เท่านั้น</p>
      </div>
      <Card>
        <form className="form-grid" onSubmit={handleLogin}>
          <Input label="อีเมลผู้ดูแล" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="รหัสผ่าน" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" disabled={loading} icon={<LogIn size={18} />}>
            เข้าสู่ระบบ
          </Button>
        </form>
      </Card>
    </section>
  );
}
