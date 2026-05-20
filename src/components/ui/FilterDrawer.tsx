import type { ReactNode } from 'react';

type FilterDrawerProps = {
  title: string;
  children: ReactNode;
  open?: boolean;
  actions?: ReactNode;
};

export function FilterDrawer({ title, children, open = false, actions }: FilterDrawerProps) {
  return (
    <details className="filter-drawer" open={open}>
      <summary>{title}</summary>
      <div className="filter-drawer-body">
        {children}
        {actions ? <div className="filter-drawer-actions">{actions}</div> : null}
      </div>
    </details>
  );
}
