import type { ReactNode } from 'react';

type RoleAwareBottomNavProps = {
  label: string;
  children: ReactNode;
};

export function RoleAwareBottomNav({ label, children }: RoleAwareBottomNavProps) {
  return (
    <nav className="mobile-bottom-nav" aria-label={label}>
      {children}
    </nav>
  );
}
