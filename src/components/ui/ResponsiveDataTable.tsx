import type { ReactNode } from 'react';
import { Card } from './Card';

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
  emptyText: string;
};

export function ResponsiveDataTable<T>({ rows, columns, getKey, emptyText }: Props<T>) {
  if (!rows.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getKey(row)}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-list">
        {rows.map((row) => (
          <Card key={getKey(row)} className="mobile-row">
            {columns.map((column) => (
              <div key={column.key}>
                <span>{column.header}</span>
                <div>{column.render(row)}</div>
              </div>
            ))}
          </Card>
        ))}
      </div>
    </>
  );
}
