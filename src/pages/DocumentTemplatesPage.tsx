import { FileUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { Select } from '../components/ui/Select';
import { Toast, ToastState } from '../components/ui/Toast';
import { documentTypeLabel, documentTypeOptions, extractDocxPlaceholders, templateVariableGuide } from '../lib/documentGeneration';
import type { DocumentTemplate, DocumentType } from '../lib/documentTypes';
import { useAsync } from '../hooks/useAsync';
import { deleteDocumentTemplate, fetchDocumentCenterData, uploadDocumentTemplate } from '../services/documents';
import { errorMessage } from '../utils/error';

export function DocumentTemplatesPage() {
  const state = useAsync(fetchDocumentCenterData, []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('project_approval');
  const [active, setActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const templates = state.data?.templates ?? [];

  async function upload() {
    if (!file) return setToast({ type: 'error', message: 'กรุณาเลือกไฟล์ .docx' });
    if (!file.name.toLowerCase().endsWith('.docx')) return setToast({ type: 'error', message: 'รองรับเฉพาะไฟล์ .docx เท่านั้น' });
    try {
      const buffer = await file.arrayBuffer();
      const placeholders = extractDocxPlaceholders(buffer);
      await uploadDocumentTemplate({
        name: name || file.name.replace(/\.docx$/i, ''),
        description,
        document_type: documentType,
        file,
        placeholders,
        is_active: active,
      });
      setToast({ type: 'success', message: `อัปโหลด template แล้ว พบ placeholder ${placeholders.length} ช่อง` });
      setName('');
      setDescription('');
      setFile(null);
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, 'อัปโหลดไม่สำเร็จ') });
    }
  }

  async function remove(template: DocumentTemplate) {
    try {
      await deleteDocumentTemplate(template);
      setToast({ type: 'success', message: 'ลบ template แล้ว' });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, 'ลบไม่สำเร็จ') });
    }
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader eyebrow="Document Center" title="DOCX Templates" description="ใช้ docxtemplater syntax ตัวพิมพ์เล็ก เช่น {project_name}, {event_date_th}, {#schedule_items}{time_range} {title}{/schedule_items}" />
      <Card className="form-grid two-col">
        <Input label="ชื่อ template" value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น หนังสือขอใช้สถานที่" />
        <Select label="ประเภทเอกสาร" value={documentType} options={documentTypeOptions} onChange={(event) => setDocumentType(event.target.value as DocumentType)} />
        <Input label="คำอธิบาย" value={description} onChange={(event) => setDescription(event.target.value)} />
        <label className="field checkbox-field"><span>เปิดใช้งาน</span><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /></label>
        <label className="field full-span">
          <span>ไฟล์ DOCX</span>
          <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <small>{file?.name ?? 'รองรับเฉพาะ .docx template และเก็บใน private Supabase Storage'}</small>
        </label>
        <div className="form-actions full-span">
          <Button icon={<FileUp size={18} />} onClick={upload}>อัปโหลด template</Button>
        </div>
      </Card>
      <Card className="privacy-notice">
        <strong>Template variable guide</strong>
        <span>{templateVariableGuide.map((item) => `{${item}}`).join('  ')}</span>
      </Card>
      {state.loading ? <LoadingSkeleton /> : null}
      <ResponsiveDataTable
        rows={templates}
        getKey={(row) => row.id}
        emptyText="ยังไม่มี template"
        mobileTitle={(row) => row.name}
        mobileSubtitle={(row) => documentTypeLabel(row.document_type)}
        mobileMeta={(row) => row.is_active ? 'active' : 'inactive'}
        columns={[
          { key: 'name', header: 'Template', render: (row) => <div className="participant-admin-cell"><strong>{row.name}</strong><span>{row.file_name}</span></div> },
          { key: 'type', header: 'ประเภท', render: (row) => documentTypeLabel(row.document_type) },
          { key: 'placeholders', header: 'Placeholders', render: (row) => <span>{row.placeholders.slice(0, 8).join(', ') || '-'}</span> },
          { key: 'active', header: 'สถานะ', render: (row) => row.is_active ? 'active' : 'inactive' },
          { key: 'created', header: 'สร้างเมื่อ', render: (row) => row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-' },
          { key: 'actions', header: 'จัดการ', render: (row) => <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => remove(row)}>ลบ</Button> },
        ]}
      />
    </section>
  );
}
