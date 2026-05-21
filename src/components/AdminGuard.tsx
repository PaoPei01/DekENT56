import { useEffect, useState } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { LoadingSkeleton } from './LoadingSkeleton';
import { supabase } from '../lib/supabase';

export function AdminGuard() {
  const [state, setState] = useState<'loading' | 'allowed' | 'login' | 'forbidden'>('loading');

  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setState('login');
        return;
      }
      const { data: isAdmin } = await supabase.rpc('is_admin', { uid: data.user.id });
      setState(isAdmin ? 'allowed' : 'forbidden');
    }
    void check();
  }, []);

  if (state === 'loading') return <LoadingSkeleton />;
  if (state === 'login') return <Navigate to="/login" replace state={{ message: 'admin_required' }} />;
  if (state === 'forbidden') {
    return (
      <section className="narrow-page page-stack">
        <Card className="error-state">
          <h1>ไม่มีสิทธิ์เข้าหน้านี้</h1>
          <p>บัญชีนี้ไม่ใช่ผู้ดูแลระบบ จึงไม่สามารถเปิดหน้าแอดมินได้</p>
          <div className="form-actions">
            <Link className="btn btn-primary" to="/staff">ไปหน้า Staff Mode</Link>
            <Link className="btn btn-secondary" to="/login">จัดการบัญชี</Link>
          </div>
        </Card>
      </section>
    );
  }
  return <Outlet />;
}
