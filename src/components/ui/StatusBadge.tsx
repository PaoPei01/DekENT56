import { Badge } from './Badge';

type StatusBadgeProps = {
  status: 'pending' | 'approved' | 'rejected' | 'info';
  children: string;
};

export function StatusBadge({ status, children }: StatusBadgeProps) {
  return <Badge status={status === 'info' ? 'pending' : status}>{children}</Badge>;
}
