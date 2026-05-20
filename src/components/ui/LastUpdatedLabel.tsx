import { Clock3 } from 'lucide-react';

type LastUpdatedLabelProps = {
  value?: string | Date | null;
  fallback?: string;
};

export function LastUpdatedLabel({ value, fallback = '-' }: LastUpdatedLabelProps) {
  const text = value ? new Date(value).toLocaleString('th-TH') : fallback;
  return (
    <span className="last-updated-label">
      <Clock3 size={14} />
      {text}
    </span>
  );
}
