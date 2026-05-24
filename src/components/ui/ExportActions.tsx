import { Download } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { copy } from '../../lib/copy';

type ExportAction = {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
};

type ExportActionsProps = {
  actions: ExportAction[];
  label?: string;
};

export function ExportActions({ actions, label }: ExportActionsProps) {
  const { language } = useLanguage();
  const t = copy[language];
  return (
    <details className="export-actions">
      <summary className="btn btn-secondary btn-md">
        <Download size={18} aria-hidden="true" />
        {label ?? t.export}
      </summary>
      <div className="export-actions-menu">
        {actions.map((action) => (
          <button type="button" key={action.label} onClick={action.onClick}>
            {action.icon}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
