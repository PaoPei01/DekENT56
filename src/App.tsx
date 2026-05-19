import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminGuard } from './components/AdminGuard';
import { Layout } from './components/Layout';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ChangeLogPage } from './pages/ChangeLogPage';
import { PendingRequestsPage } from './pages/PendingRequestsPage';
import { PublicListPage } from './pages/PublicListPage';
import { VerifyEditPage } from './pages/VerifyEditPage';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<PublicListPage />} />
        <Route path="edit" element={<VerifyEditPage />} />
        <Route path="admin" element={<AdminLoginPage />} />
        <Route element={<AdminGuard />}>
          <Route path="admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="admin/requests" element={<PendingRequestsPage />} />
          <Route path="admin/logs" element={<ChangeLogPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
