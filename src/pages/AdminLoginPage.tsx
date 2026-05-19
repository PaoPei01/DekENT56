import { LogIn } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toast, ToastState } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';

export function AdminLoginPage() {
  const { language } = useLanguage();
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
        <h1>{language === 'th' ? 'เข้าสู่ระบบผู้ดูแล' : 'Admin sign in'}</h1>
        <p>{language === 'th' ? 'ใช้บัญชี Supabase Auth ที่ถูกเพิ่มในตาราง admins เท่านั้น' : 'Use a Supabase Auth account that has been added to the admins table.'}</p>
      </div>
      <Card>
        <form className="form-grid" onSubmit={handleLogin}>
          <Input label={language === 'th' ? 'อีเมลผู้ดูแล' : 'Admin email'} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label={language === 'th' ? 'รหัสผ่าน' : 'Password'} type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <Button type="submit" disabled={loading} icon={<LogIn size={18} />}>
            {language === 'th' ? 'เข้าสู่ระบบ' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </section>
  );
}
