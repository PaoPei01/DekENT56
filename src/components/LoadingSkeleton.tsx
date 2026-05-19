import { useLanguage } from '../context/LanguageContext';

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  const { language } = useLanguage();
  return (
    <div className="skeleton-list" aria-label={language === 'th' ? 'กำลังโหลด' : 'Loading'}>
      {Array.from({ length: count }).map((_, index) => (
        <div className="skeleton" key={index} />
      ))}
    </div>
  );
}
