import { useLanguage } from '../context/LanguageContext';
import { RouteLoadingFallback } from './RouteLoadingFallback';

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  const { language } = useLanguage();
  return (
    <div className="skeleton-list" aria-label={language === 'th' ? 'กำลังโหลด' : 'Loading'}>
      <RouteLoadingFallback />
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton" key={index} />
      ))}
    </div>
  );
}
