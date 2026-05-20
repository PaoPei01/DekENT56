import type { ReactNode } from 'react';
import { Card } from './Card';

type DangerZoneProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

export function DangerZone({ title, description, children }: DangerZoneProps) {
  return (
    <Card className="danger-zone">
      <div>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="danger-zone-actions">{children}</div>
    </Card>
  );
}
