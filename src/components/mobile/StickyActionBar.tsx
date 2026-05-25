import { useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

type StickyActionBarProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function StickyActionBar({ children, className = '', label }: StickyActionBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const action = target?.closest('button, a, [role="button"]');
    if (action) setCollapsed(true);
  }

  if (collapsed) return null;

  return (
    <div className={`sticky-action-bar ${className}`} aria-label={label} onClickCapture={handleClickCapture}>
      {children}
    </div>
  );
}
