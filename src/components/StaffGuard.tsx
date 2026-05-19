import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { LoadingSkeleton } from './LoadingSkeleton';
import { isStaffOrAdmin } from '../services/groups';

export function StaffGuard() {
  const [state, setState] = useState<'loading' | 'allowed' | 'denied'>('loading');

  useEffect(() => {
    async function check() {
      setState((await isStaffOrAdmin()) ? 'allowed' : 'denied');
    }
    void check();
  }, []);

  if (state === 'loading') return <LoadingSkeleton />;
  if (state === 'denied') return <Navigate to="/admin" replace />;
  return <Outlet />;
}
