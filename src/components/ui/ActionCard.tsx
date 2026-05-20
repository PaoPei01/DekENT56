import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type ActionCardProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  to?: string;
  onClick?: () => void;
  tone?: 'default' | 'primary' | 'danger' | 'emergency';
};

export function ActionCard({ icon, title, description, to, onClick, tone = 'default' }: ActionCardProps) {
  const content = (
    <>
      {icon ? <span className="action-card-icon">{icon}</span> : null}
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </>
  );

  if (to) return <Link className={`action-card action-card-${tone}`} to={to}>{content}</Link>;
  return <button className={`action-card action-card-${tone}`} type="button" onClick={onClick}>{content}</button>;
}
