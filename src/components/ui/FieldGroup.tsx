import type { ReactNode } from 'react';

type FieldGroupProps = {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
};

export function FieldGroup({ title, description, children }: FieldGroupProps) {
  return (
    <fieldset className="field-group">
      <legend>{title}</legend>
      {description ? <p>{description}</p> : null}
      <div className="field-group-grid">{children}</div>
    </fieldset>
  );
}
