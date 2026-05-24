import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { To } from 'react-router-dom';

type PortalActionCardProps = {
  to: To;
  state?: unknown;
  icon: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  primary?: boolean;
};

export function PortalActionCard({ to, state, icon, title, description, actionLabel, primary = false }: PortalActionCardProps) {
  return (
    <Link className={`staff-action-card ${primary ? 'staff-action-card-primary' : ''}`} to={to} state={state}>
      {icon}
      <strong>{title}</strong>
      <span>{description}</span>
      {actionLabel ? <em>{actionLabel}</em> : null}
    </Link>
  );
}
