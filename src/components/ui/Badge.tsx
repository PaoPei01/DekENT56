type BadgeProps = {
  status?: 'pending' | 'approved' | 'rejected';
  children: string;
};

export function Badge({ status = 'pending', children }: BadgeProps) {
  return <span className={`badge badge-${status}`}>{children}</span>;
}
