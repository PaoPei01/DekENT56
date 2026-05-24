import { useLanguage } from '../context/LanguageContext';
import { Gear13Icon } from './brand/Gear13Icon';

export function RouteLoadingFallback() {
  const { language } = useLanguage();
  return (
    <section className="route-loading-fallback" role="status" aria-live="polite">
      <Gear13Icon size={34} className="route-loading-gear" />
      <strong>{language === 'th' ? 'กำลังโหลด...' : 'Loading...'}</strong>
    </section>
  );
}
