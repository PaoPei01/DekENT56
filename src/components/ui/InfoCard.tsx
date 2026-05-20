import type { ReactNode } from 'react';
import { Card } from './Card';

type InfoCardProps = {
  title: ReactNode;
  value?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

export function InfoCard({ title, value, description, icon, tone = 'default' }: InfoCardProps) {
  return (
    <Card className={`info-card info-card-${tone}`}>
      {icon ? <span className="info-card-icon">{icon}</span> : null}
      <div>
        <span>{title}</span>
        {value ? <strong>{value}</strong> : null}
        {description ? <p>{description}</p> : null}
      </div>
    </Card>
  );
}
