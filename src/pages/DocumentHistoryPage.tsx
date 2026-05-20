import { History } from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { useAsync } from '../hooks/useAsync';
import { fetchDocumentCenterData } from '../services/documents';

export function DocumentHistoryPage() {
  const state = useAsync(fetchDocumentCenterData, []);
  const history = state.data?.history ?? [];
  return (
    <section className="page-stack">
      <PageHeader eyebrow="Document Center" title="ประวัติเอกสาร" description="รายการเอกสารที่ถูก generate จาก template" />
      {state.loading ? <LoadingSkeleton /> : null}
      <ResponsiveDataTable
        rows={history}
        getKey={(row) => row.id}
        emptyText="ยังไม่มีประวัติเอกสาร"
        mobileTitle={(row) => row.file_name}
        mobileSubtitle={(row) => row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-'}
        mobileMeta={(row) => row.missing_fields.length ? `${row.missing_fields.length} missing` : 'ready'}
        columns={[
          { key: 'file', header: 'ไฟล์', render: (row) => <div className="participant-admin-cell"><strong>{row.file_name}</strong><span>{row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-'}</span></div> },
          { key: 'missing', header: 'ข้อมูลที่ขาด', render: (row) => row.missing_fields.join(', ') || '-' },
          { key: 'preview', header: 'Preview', render: (row) => row.preview_html ? <Card className="document-history-preview"><History size={16} /> มี HTML preview</Card> : '-' },
        ]}
      />
    </section>
  );
}
