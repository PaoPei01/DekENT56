import { Download, History } from 'lucide-react';
import { useState } from 'react';
import { DocumentEventContextCard } from '../components/documents/DocumentEventContextCard';
import { EventSwitcher } from '../components/events/EventSwitcher';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { Toast, ToastState } from '../components/ui/Toast';
import { useEventContext } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { documentTypeLabel, downloadBlob } from '../lib/documentGeneration';
import { documentEventName, documentScopeLabel, documentScopeTone } from '../lib/documentEventContext';
import { useAsync } from '../hooks/useAsync';
import { downloadGeneratedDocument, fetchDocumentCenterData } from '../services/documents';
import { errorMessage } from '../utils/error';

export function DocumentHistoryPage() {
  const { currentEvent, currentEventId } = useEventContext();
  const { language } = useLanguage();
  const state = useAsync(() => fetchDocumentCenterData(currentEventId), [currentEventId]);
  const [toast, setToast] = useState<ToastState>(null);
  const history = state.data?.history ?? [];
  const templates = state.data?.templates ?? [];

  async function download(row: typeof history[number]) {
    try {
      const blob = await downloadGeneratedDocument(row);
      downloadBlob(blob, row.file_name);
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'ดาวน์โหลดเอกสารไม่สำเร็จ' : 'Could not download the document.') });
    }
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow={language === 'th' ? 'ศูนย์เอกสาร' : 'Document Center'}
        title={language === 'th' ? 'ประวัติเอกสาร' : 'Document history'}
        description={language === 'th' ? 'ดูเอกสารที่เคยสร้าง ดาวน์โหลดซ้ำ หรือตรวจสอบว่าใช้เทมเพลตใด' : 'View generated documents, download them again, or check which template was used.'}
        meta={<EventSwitcher compact />}
      />
      {state.loading ? <LoadingSkeleton /> : null}
      <DocumentEventContextCard />
      <ResponsiveDataTable
        rows={history}
        getKey={(row) => row.id}
        emptyText={language === 'th' ? 'ยังไม่มีประวัติเอกสาร' : 'No generated documents yet'}
        mobileTitle={(row) => row.title || row.file_name}
        mobileSubtitle={(row) => `${documentEventName(currentEvent, language)} · ${documentTypeLabel(row.document_type)} v${row.version}`}
        mobileMeta={(row) => {
          const template = templates.find((item) => item.id === row.template_id);
          return `${documentScopeLabel(template?.event_id, currentEventId, language)} · ${row.status ?? 'generated'}`;
        }}
        mobileActions={(row) => <Button variant="secondary" icon={<Download size={16} />} onClick={() => download(row)}>{language === 'th' ? 'ดาวน์โหลด' : 'Download'}</Button>}
        columns={[
          { key: 'file', header: language === 'th' ? 'ไฟล์' : 'File', render: (row) => <div className="participant-admin-cell"><strong>{row.title || row.file_name}</strong><span>{row.file_name}</span></div> },
          { key: 'event', header: language === 'th' ? 'กิจกรรม' : 'Event', render: (row) => <div className="participant-admin-cell"><strong>{row.event_id ? documentEventName(currentEvent, language) : (language === 'th' ? 'ทุกกิจกรรม' : 'Global')}</strong><span>{row.event_id ? (language === 'th' ? 'ข้อมูลกิจกรรมที่เลือก' : 'Selected event data') : (language === 'th' ? 'global/history เดิม' : 'Global or legacy history')}</span></div> },
          { key: 'scope', header: language === 'th' ? 'ขอบเขตเทมเพลต' : 'Template scope', render: (row) => {
            const template = templates.find((item) => item.id === row.template_id);
            return <Badge status={documentScopeTone(template?.event_id, currentEventId)}>{documentScopeLabel(template?.event_id, currentEventId, language)}</Badge>;
          } },
          { key: 'type', header: language === 'th' ? 'ประเภท' : 'Type', render: (row) => documentTypeLabel(row.document_type) },
          { key: 'version', header: language === 'th' ? 'เวอร์ชัน' : 'Version', render: (row) => `v${row.version}` },
          { key: 'status', header: language === 'th' ? 'สถานะ' : 'Status', render: (row) => row.status ?? '-' },
          { key: 'generated', header: language === 'th' ? 'สร้างเมื่อ' : 'Generated', render: (row) => (row.generated_at ?? row.created_at) ? new Date(row.generated_at ?? row.created_at ?? '').toLocaleString(language === 'th' ? 'th-TH' : 'en-US') : '-' },
          { key: 'missing', header: language === 'th' ? 'ข้อมูลที่ขาด' : 'Missing information', render: (row) => row.missing_fields.join(', ') || '-' },
          { key: 'preview', header: language === 'th' ? 'ดูตัวอย่าง' : 'Preview', render: (row) => row.preview_html ? <Card className="document-history-preview"><History size={16} /> {language === 'th' ? 'มีตัวอย่าง' : 'Preview saved'}</Card> : '-' },
          { key: 'actions', header: language === 'th' ? 'ดาวน์โหลด' : 'Download', render: (row) => <Button variant="secondary" icon={<Download size={16} />} onClick={() => download(row)}>{language === 'th' ? 'ดาวน์โหลด' : 'Download'}</Button> },
        ]}
      />
    </section>
  );
}
