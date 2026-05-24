import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type PortalActionCardProps = {
  to: string;
  icon: ReactNode;
  title: string;
  description: string;
  primary?: boolean;
};

export function PortalActionCard({ to, icon, title, description, primary = false }: PortalActionCardProps) {
  return (
    <Link className={`staff-action-card ${primary ? 'staff-action-card-primary' : ''}`} to={to}>
      {icon}
      <strong>{title}</strong>
      <span>{description}</span>
    </Link>
  );
}

