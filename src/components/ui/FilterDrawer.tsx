import type { ReactNode } from 'react';

type FilterDrawerProps = {
  title: string;
  children: ReactNode;
  open?: boolean;
  actions?: ReactNode;
  className?: string;
};

export function FilterDrawer({ title, children, open = false, actions, className = '' }: FilterDrawerProps) {
  return (
    <details className={`filter-drawer ${className}`} open={open}>
      <summary>{title}</summary>
      <div className="filter-drawer-body">
        {children}
        {actions ? <div className="filter-drawer-actions">{actions}</div> : null}
      </div>
    </details>
  );
}
