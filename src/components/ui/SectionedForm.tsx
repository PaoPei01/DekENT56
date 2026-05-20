import type { ReactNode } from 'react';

type SectionedFormProps = {
  children: ReactNode;
  className?: string;
};

export function SectionedForm({ children, className = '' }: SectionedFormProps) {
  return <div className={`sectioned-form ${className}`}>{children}</div>;
}
