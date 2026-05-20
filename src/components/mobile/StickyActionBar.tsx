import type { ReactNode } from 'react';

type StickyActionBarProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function StickyActionBar({ children, className = '', label }: StickyActionBarProps) {
  return (
    <div className={`sticky-action-bar ${className}`} aria-label={label}>
      {children}
    </div>
  );
}
