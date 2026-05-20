import type { ReactNode } from 'react';

type PageSectionProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageSection({ title, description, actions, children, className = '' }: PageSectionProps) {
  return (
    <section className={`page-section ${className}`}>
      {title || description || actions ? (
        <div className="page-section-head">
          <div>
            {title ? <h2>{title}</h2> : null}
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="page-section-actions">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
