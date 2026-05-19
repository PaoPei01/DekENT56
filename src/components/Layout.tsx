import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function Layout() {
  return (
    <div>
      <nav className="top-nav">
        <Link className="brand" to="/">
          <ShieldCheck size={22} />
          ระบบลงทะเบียนกิจกรรม
        </Link>
        <div className="nav-links">
          <NavLink to="/">รายชื่อ</NavLink>
          <NavLink to="/edit">ขอแก้ไขข้อมูล</NavLink>
          <NavLink to="/admin">แอดมิน</NavLink>
          <NavLink to="/admin/dashboard">แดชบอร์ด</NavLink>
          <NavLink to="/admin/requests">คำขอ</NavLink>
          <NavLink to="/admin/logs">ประวัติ</NavLink>
        </div>
      </nav>
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
