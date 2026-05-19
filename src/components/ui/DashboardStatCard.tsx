import type { ReactNode } from 'react';
import { Card } from './Card';

type Props = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ReactNode;
};

export function DashboardStatCard({ label, value, helper, icon }: Props) {
  return (
    <Card className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {helper ? <small>{helper}</small> : null}
      </div>
    </Card>
  );
}
