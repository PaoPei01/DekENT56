import type { ReactNode } from 'react';
import { Card } from './Card';

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  mobileHidden?: boolean;
  mobileLabel?: string;
  priority?: 'primary' | 'secondary' | 'detail';
  align?: 'left' | 'center' | 'right';
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  emptyText: string;
  caption?: string;
  ariaLabel?: string;
  density?: 'comfortable' | 'compact';
  stickyHeader?: boolean;
  mobileTitle?: (row: T) => ReactNode;
  mobileSubtitle?: (row: T) => ReactNode;
  mobileMeta?: (row: T) => ReactNode;
  mobileActions?: (row: T) => ReactNode;
  mobileDetailsLabel?: string;
  mobileDefaultOpen?: boolean;
  getRowTone?: (row: T) => 'normal' | 'warning' | 'danger' | 'success';
};

export function ResponsiveDataTable<T>({
  rows,
  columns,
  getKey,
  emptyText,
  caption,
  ariaLabel,
  density = 'comfortable',
  stickyHeader = true,
  mobileTitle,
  mobileSubtitle,
  mobileMeta,
  mobileActions,
  mobileDetailsLabel = 'Details',
  mobileDefaultOpen = false,
  getRowTone,
}: Props<T>) {
  if (!rows.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <>
      <div className={`table-wrap table-${density} ${stickyHeader ? 'table-sticky' : ''}`}>
        <table aria-label={ariaLabel}>
          {caption ? <caption>{caption}</caption> : null}
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={column.align ? `cell-${column.align}` : undefined}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getKey(row)} className={`row-tone-${getRowTone?.(row) ?? 'normal'}`}>
                {columns.map((column) => (
                  <td key={column.key} className={column.align ? `cell-${column.align}` : undefined}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-list">
        {rows.map((row) => (
          <Card key={getKey(row)} className={`mobile-row row-tone-${getRowTone?.(row) ?? 'normal'}`} variant="soft">
            {mobileTitle || mobileSubtitle || mobileMeta ? (
              <div className="mobile-row-head">
                <div>
                  {mobileTitle ? <strong>{mobileTitle(row)}</strong> : null}
                  {mobileSubtitle ? <span>{mobileSubtitle(row)}</span> : null}
                </div>
                {mobileMeta ? <em>{mobileMeta(row)}</em> : null}
              </div>
            ) : null}
            <details open={mobileDefaultOpen}>
              <summary>{mobileDetailsLabel}</summary>
              {columns.filter((column) => column.key !== 'actions' && !column.mobileHidden).map((column) => (
                <div key={column.key} className={column.priority ? `mobile-detail-${column.priority}` : undefined}>
                  <span>{column.mobileLabel ?? column.header}</span>
                  <div>{column.render(row)}</div>
                </div>
              ))}
            </details>
            {mobileActions ? <div className="mobile-card-actions">{mobileActions(row)}</div> : columns.find((column) => column.key === 'actions')?.render(row)}
          </Card>
        ))}
      </div>
    </>
  );
}
