import { useEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';

type StickyActionBarProps = {
  children: ReactNode;
  className?: string;
  label?: string;
};

export function StickyActionBar({ children, className = '', label }: StickyActionBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (collapsed) return undefined;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target instanceof Node ? event.target : null;
      if (target && barRef.current?.contains(target)) return;
      setCollapsed(true);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setCollapsed(true);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [collapsed]);

  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    const target = event.target instanceof HTMLElement ? event.target : null;
    const action = target?.closest('button, a, [role="button"]');
    if (action) setCollapsed(true);
  }

  if (collapsed) return null;

  return (
    <div ref={barRef} className={`sticky-action-bar ${className}`} aria-label={label} onClickCapture={handleClickCapture}>
      {children}
    </div>
  );
}
