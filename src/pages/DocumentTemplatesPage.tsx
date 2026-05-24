import { FileUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { DocumentEventContextCard } from '../components/documents/DocumentEventContextCard';
import { EventSwitcher } from '../components/events/EventSwitcher';
import { HelpButton } from '../components/help/HelpButton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { Select } from '../components/ui/Select';
import { Toast, ToastState } from '../components/ui/Toast';
import { useEventContext } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { documentTypeLabel, documentTypeOptions, extractDocxPlaceholders, templateVariableGuide } from '../lib/documentGeneration';
import { documentScopeLabel, documentScopeTone } from '../lib/documentEventContext';
import type { DocumentTemplate, DocumentType } from '../lib/documentTypes';
import { useAsync } from '../hooks/useAsync';
import { deleteDocumentTemplate, fetchDocumentCenterData, uploadDocumentTemplate } from '../services/documents';
import { errorMessage } from '../utils/error';

export function DocumentTemplatesPage() {
  const { language } = useLanguage();
  const { currentEventId } = useEventContext();
  const state = useAsync(() => fetchDocumentCenterData(currentEventId), [currentEventId]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('project_approval');
  const [active, setActive] = useState(true);
  const [scope, setScope] = useState<'event' | 'global'>('event');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'event' | 'global'>('all');
  const [file, setFile] = useState<File | null>(null);
  const [detectedPlaceholders, setDetectedPlaceholders] = useState<string[]>([]);
  const [toast, setToast] = useState<ToastState>(null);
  const templates = (state.data?.templates ?? []).filter((template) => {
    if (scopeFilter === 'event') return template.event_id === currentEventId;
    if (scopeFilter === 'global') return !template.event_id;
    return true;
  });
  const invalidPlaceholders = detectedPlaceholders.filter((item) => !/^[a-z0-9_.-]+$/.test(item));

  async function inspectFile(nextFile: File | null) {
    setFile(nextFile);
    setDetectedPlaceholders([]);
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().endsWith('.docx')) {
      setToast({ type: 'error', message: language === 'th' ? 'รองรับเฉพาะไฟล์ .docx เท่านั้น' : 'Only .docx files are supported.' });
      return;
    }
    try {
      setDetectedPlaceholders(extractDocxPlaceholders(await nextFile.arrayBuffer()));
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'อ่านช่องข้อมูลในไฟล์ไม่สำเร็จ' : 'Could not read placeholders from this file.') });
    }
  }

  async function upload() {
    if (!file) return setToast({ type: 'error', message: language === 'th' ? 'กรุณาเลือกไฟล์ .docx' : 'Please choose a .docx file.' });
    if (!file.name.toLowerCase().endsWith('.docx')) return setToast({ type: 'error', message: language === 'th' ? 'รองรับเฉพาะไฟล์ .docx เท่านั้น' : 'Only .docx files are supported.' });
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
        event_id: scope === 'global' ? null : currentEventId,
      });
      setToast({ type: 'success', message: language === 'th' ? `อัปโหลดเทมเพลตแล้ว พบช่องข้อมูล ${placeholders.length} ช่อง` : `Uploaded template with ${placeholders.length} placeholders.` });
      setName('');
      setDescription('');
      setFile(null);
      setDetectedPlaceholders([]);
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'อัปโหลดเทมเพลตไม่สำเร็จ กรุณาตรวจไฟล์แล้วลองอีกครั้ง' : 'Could not upload the template. Check the file and try again.') });
    }
  }

  async function remove(template: DocumentTemplate) {
    try {
      await deleteDocumentTemplate(template);
      setToast({ type: 'success', message: language === 'th' ? 'ลบเทมเพลตแล้ว' : 'Template deleted.' });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'ลบเทมเพลตไม่สำเร็จ กรุณาลองอีกครั้ง' : 'Could not delete the template. Please try again.') });
    }
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow={language === 'th' ? 'ศูนย์เอกสาร' : 'Document Center'}
        title={language === 'th' ? 'เทมเพลตเอกสาร' : 'Document Templates'}
        description={language === 'th' ? 'ใช้ช่องข้อมูล เช่น {project_name} เพื่อให้ระบบเติมข้อมูลให้อัตโนมัติ' : 'Use placeholders such as {project_name} so the system can fill in data automatically.'}
        meta={<EventSwitcher compact />}
        actions={<HelpButton topicId="documents.templates" variant="link" />}
      />
      <DocumentEventContextCard />
      <Card className="template-upload-card" variant="soft">
        <div>
          <p className="eyebrow">{language === 'th' ? 'เทมเพลต DOCX' : 'DOCX template'}</p>
          <h2>{language === 'th' ? 'อัปโหลดเทมเพลต DOCX' : 'Upload DOCX template'}</h2>
          <span>{language === 'th' ? 'ใช้ช่องข้อมูล เช่น {project_name} เพื่อให้ระบบเติมข้อมูลให้อัตโนมัติ ไฟล์จะถูกเก็บไว้ใน Storage ส่วนตัว' : 'Use placeholders such as {project_name} so the system can fill in data automatically. Files stay in private Storage.'}</span>
          <HelpButton topicId="documents.templates" variant="compact" />
        </div>
        <label className="file-drop-zone">
          <FileUp size={28} />
          <strong>{file?.name ?? (language === 'th' ? 'เลือกไฟล์ .docx' : 'Choose a .docx file')}</strong>
          <span>{language === 'th' ? 'รองรับเฉพาะ .docx เท่านั้น' : 'Only .docx files are supported.'}</span>
          <input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => void inspectFile(event.target.files?.[0] ?? null)} />
        </label>
      </Card>
      <Card className="form-grid two-col">
        <Input label={language === 'th' ? 'ชื่อเทมเพลต' : 'Template name'} value={name} onChange={(event) => setName(event.target.value)} placeholder={language === 'th' ? 'เช่น หนังสือขอใช้สถานที่' : 'Example: Venue request letter'} />
        <Select label={language === 'th' ? 'ประเภทเอกสาร' : 'Document type'} value={documentType} options={documentTypeOptions} onChange={(event) => setDocumentType(event.target.value as DocumentType)} />
        <Select label={language === 'th' ? 'ใช้กับ' : 'Scope'} value={scope} options={[
          { value: 'event', label: language === 'th' ? 'กิจกรรมนี้' : 'This event' },
          { value: 'global', label: language === 'th' ? 'ทุกกิจกรรม' : 'Global' },
        ]} onChange={(event) => setScope(event.target.value as 'event' | 'global')} />
        <Input label={language === 'th' ? 'คำอธิบาย' : 'Description'} value={description} onChange={(event) => setDescription(event.target.value)} />
        <label className="field checkbox-field"><span>{language === 'th' ? 'เปิดใช้งาน' : 'Active'}</span><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /></label>
        {detectedPlaceholders.length ? (
          <div className="full-span">
            <strong>{language === 'th' ? 'ช่องข้อมูลที่พบ' : 'Detected placeholders'}</strong>
            <div className="filter-chip-row">
              {detectedPlaceholders.map((item) => <span className="filter-chip" key={item}>{`{${item}}`}</span>)}
            </div>
            {invalidPlaceholders.length ? <p className="error-state">{language === 'th' ? 'พบช่องข้อมูลที่ยังไม่ตรงรูปแบบตัวพิมพ์เล็ก' : 'Some placeholders do not use the required lowercase format'}: {invalidPlaceholders.join(', ')}</p> : null}
          </div>
        ) : null}
        <div className="form-actions full-span">
          <Button icon={<FileUp size={18} />} onClick={upload}>{language === 'th' ? 'อัปโหลดเทมเพลต DOCX' : 'Upload DOCX template'}</Button>
        </div>
      </Card>
      <Card className="privacy-notice">
        <strong>{language === 'th' ? 'ตัวอย่างช่องข้อมูลที่ใช้ได้' : 'Example placeholders'}</strong>
        <span>{templateVariableGuide.map((item) => `{${item}}`).join('  ')}</span>
      </Card>
      <Card className="toolbar">
        <Select label={language === 'th' ? 'กรองเทมเพลต' : 'Filter templates'} value={scopeFilter} options={[
          { value: 'all', label: language === 'th' ? 'ทั้งหมด' : 'All' },
          { value: 'event', label: language === 'th' ? 'กิจกรรมนี้' : 'This event' },
          { value: 'global', label: language === 'th' ? 'ทุกกิจกรรม' : 'Global' },
        ]} onChange={(event) => setScopeFilter(event.target.value as 'all' | 'event' | 'global')} />
      </Card>
      {state.loading ? <LoadingSkeleton /> : null}
      <ResponsiveDataTable
        rows={templates}
        getKey={(row) => row.id}
        emptyText={language === 'th' ? 'ยังไม่มีเทมเพลต' : 'No templates yet'}
        mobileTitle={(row) => row.name}
        mobileSubtitle={(row) => documentTypeLabel(row.document_type)}
        mobileMeta={(row) => documentScopeLabel(row.event_id, currentEventId, language)}
        columns={[
          { key: 'name', header: language === 'th' ? 'เทมเพลต' : 'Template', render: (row) => <div className="participant-admin-cell"><strong>{row.name}</strong><span>{row.file_name}</span></div> },
          { key: 'type', header: language === 'th' ? 'ประเภท' : 'Type', render: (row) => documentTypeLabel(row.document_type) },
          { key: 'placeholders', header: language === 'th' ? 'ช่องข้อมูล' : 'Placeholders', render: (row) => <span>{row.placeholders.slice(0, 8).join(', ') || '-'}</span> },
          { key: 'active', header: language === 'th' ? 'สถานะ' : 'Status', render: (row) => row.is_active ? (language === 'th' ? 'เปิดใช้งาน' : 'Active') : (language === 'th' ? 'ปิดใช้งาน' : 'Inactive') },
          { key: 'event', header: language === 'th' ? 'ขอบเขต' : 'Scope', render: (row) => <span className={`badge badge-${documentScopeTone(row.event_id, currentEventId)}`}>{documentScopeLabel(row.event_id, currentEventId, language)}</span> },
          { key: 'created', header: language === 'th' ? 'สร้างเมื่อ' : 'Created', render: (row) => row.created_at ? new Date(row.created_at).toLocaleString(language === 'th' ? 'th-TH' : 'en-US') : '-' },
          { key: 'actions', header: language === 'th' ? 'จัดการ' : 'Actions', render: (row) => <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => remove(row)}>{language === 'th' ? 'ลบ' : 'Delete'}</Button> },
        ]}
      />
    </section>
  );
}
