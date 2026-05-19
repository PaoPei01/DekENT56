import { Link, NavLink, Outlet } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export function Layout() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div>
      <nav className="top-nav">
        <Link className="brand" to="/">
          <ShieldCheck size={22} />
          ระบบลงทะเบียนกิจกรรม
        </Link>
        <div className="nav-links">
          <NavLink to="/">{t.participants}</NavLink>
          <NavLink to="/edit">{t.edit}</NavLink>
          <NavLink to="/admin">{t.admin}</NavLink>
          <NavLink to="/admin/dashboard">{t.dashboard}</NavLink>
          <NavLink to="/admin/groups">{t.groups}</NavLink>
          <NavLink to="/staff">Staff</NavLink>
          <NavLink to="/admin/requests">{t.requests}</NavLink>
          <NavLink to="/admin/logs">{t.logs}</NavLink>
          <button className="language-toggle" type="button" onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}>
            {language === 'th' ? 'EN' : 'TH'}
          </button>
        </div>
      </nav>
      <main className="page-shell">
        <Outlet />
      </main>
    </div>
  );
}
