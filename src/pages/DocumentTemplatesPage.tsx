import { FileUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { Toast, ToastState } from '../components/ui/Toast';
import { arrayBufferToBase64, extractDocxPlaceholders } from '../lib/documentGeneration';
import { useAsync } from '../hooks/useAsync';
import { deleteDocumentTemplate, fetchDocumentCenterData, uploadDocumentTemplate } from '../services/documents';
import { errorMessage } from '../utils/error';

export function DocumentTemplatesPage() {
  const state = useAsync(fetchDocumentCenterData, []);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const templates = state.data?.templates ?? [];

  async function upload() {
    if (!file) return setToast({ type: 'error', message: 'กรุณาเลือกไฟล์ .docx' });
    try {
      const buffer = await file.arrayBuffer();
      const placeholders = extractDocxPlaceholders(buffer);
      await uploadDocumentTemplate({
        name: name || file.name.replace(/\.docx$/i, ''),
        description,
        file_name: file.name,
        mime_type: file.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        template_content: arrayBufferToBase64(buffer),
        placeholders,
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

  async function remove(id: string) {
    try {
      await deleteDocumentTemplate(id);
      setToast({ type: 'success', message: 'ลบ template แล้ว' });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, 'ลบไม่สำเร็จ') });
    }
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader eyebrow="Document Center" title="DOCX Templates" description="ใช้ placeholder รูปแบบ {project_name}, {start_date}, {budget_total} หรือ loop เช่น {#budget_items}{item_name}{/budget_items}" />
      <Card className="form-grid two-col">
        <Input label="ชื่อ template" value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น เอกสารขออนุมัติโครงการ" />
        <Input label="คำอธิบาย" value={description} onChange={(event) => setDescription(event.target.value)} />
        <label className="field full-span">
          <span>ไฟล์ DOCX</span>
          <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <small>{file?.name ?? 'รองรับเฉพาะ .docx template'}</small>
        </label>
        <div className="form-actions full-span">
          <Button icon={<FileUp size={18} />} onClick={upload}>อัปโหลด template</Button>
        </div>
      </Card>
      {state.loading ? <LoadingSkeleton /> : null}
      <ResponsiveDataTable
        rows={templates}
        getKey={(row) => row.id}
        emptyText="ยังไม่มี template"
        mobileTitle={(row) => row.name}
        mobileSubtitle={(row) => row.file_name}
        mobileMeta={(row) => `${row.placeholders.length} fields`}
        columns={[
          { key: 'name', header: 'Template', render: (row) => <div className="participant-admin-cell"><strong>{row.name}</strong><span>{row.description || row.file_name}</span></div> },
          { key: 'placeholders', header: 'Placeholders', render: (row) => <span>{row.placeholders.slice(0, 8).join(', ') || '-'}</span> },
          { key: 'created', header: 'สร้างเมื่อ', render: (row) => row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-' },
          { key: 'actions', header: 'จัดการ', render: (row) => <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => remove(row.id)}>ลบ</Button> },
        ]}
      />
    </section>
  );
}
