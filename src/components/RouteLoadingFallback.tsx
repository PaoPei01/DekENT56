import { useLanguage } from '../context/LanguageContext';

export function RouteLoadingFallback() {
  const { language } = useLanguage();
  return (
    <section className="route-loading-fallback" role="status" aria-live="polite">
      <span className="route-loading-dot" aria-hidden="true" />
      <strong>{language === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading data...'}</strong>
    </section>
  );
}
