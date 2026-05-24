import { Download, Eye } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EventSwitcher } from '../components/events/EventSwitcher';
import { DocumentEventContextCard } from '../components/documents/DocumentEventContextCard';
import { HelpButton } from '../components/help/HelpButton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Toast, ToastState } from '../components/ui/Toast';
import { useEventContext } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { buildDocumentData, documentTypeLabel, downloadBlob, findMissingFields, renderDocxBlob, renderPreviewHtml } from '../lib/documentGeneration';
import { documentScopeLabel, documentScopeTone } from '../lib/documentEventContext';
import type { DocumentType } from '../lib/documentTypes';
import { useAsync } from '../hooks/useAsync';
import { downloadTemplateBuffer, fetchDocumentCenterData, recordGeneratedDocument, uploadGeneratedDocx } from '../services/documents';
import { errorMessage } from '../utils/error';

export function DocumentGeneratePage() {
  const { currentEventId } = useEventContext();
  const { language } = useLanguage();
  const state = useAsync(() => fetchDocumentCenterData(currentEventId), [currentEventId]);
  const [templateId, setTemplateId] = useState('');
  const [documentType, setDocumentType] = useState<DocumentType>('project_approval');
  const [title, setTitle] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const data = state.data;
  const templates = (data?.templates ?? []).filter((item) => item.is_active !== false && item.document_type === documentType);
  const template = templates.find((item) => item.id === templateId) ?? null;
  const payload = useMemo(() => data ? buildDocumentData(data) : {}, [data]);
  const missing = useMemo(() => template ? findMissingFields(documentType, template.placeholders, payload) : findMissingFields(documentType, [], payload), [documentType, payload, template]);

  function preview() {
    setPreviewHtml(renderPreviewHtml(documentType, title || template?.name || documentTypeLabel(documentType), payload, missing));
  }

  async function download() {
    if (!template || !data) return;
    setGenerating(true);
    try {
      const fileTitle = title || template.name || documentTypeLabel(documentType);
      const html = previewHtml || renderPreviewHtml(documentType, fileTitle, payload, missing);
      const reserved = await recordGeneratedDocument({
        project_profile_id: data.profile?.id ?? null,
        template_id: template.id,
        file_name: `${fileTitle.replace(/[^\wก-๙.-]+/g, '-')}.docx`,
        title: fileTitle,
        document_type: documentType,
        version: 0,
        status: 'generating',
        output_docx_path: '',
        placeholders: payload,
        snapshot_data: payload,
        missing_fields: missing.map((item) => item.field),
        preview_html: html,
        event_id: currentEventId,
      });
      const fileName = `${fileTitle.replace(/[^\wก-๙.-]+/g, '-')}_v${reserved.version}.docx`;
      const buffer = await downloadTemplateBuffer(template);
      const blob = renderDocxBlob(buffer, payload);
      const outputPath = await uploadGeneratedDocx(fileName, blob);
      downloadBlob(blob, fileName);
      await recordGeneratedDocument({
        id: reserved.id,
        project_profile_id: data.profile?.id ?? null,
        template_id: template.id,
        file_name: fileName,
        title: fileTitle,
        document_type: documentType,
        version: reserved.version,
        status: missing.length ? 'incomplete' : 'generated',
        output_docx_path: outputPath,
        placeholders: payload,
        snapshot_data: payload,
        missing_fields: missing.map((item) => item.field),
        preview_html: html,
        event_id: currentEventId,
      });
      setToast({ type: 'success', message: language === 'th' ? `สร้างและดาวน์โหลดเอกสาร v${reserved.version} แล้ว` : `Generated and downloaded document v${reserved.version}` });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'สร้างเอกสารไม่สำเร็จ กรุณาตรวจเทมเพลตและลองอีกครั้ง' : 'Could not generate the document. Check the template and try again.') });
    } finally {
      setGenerating(false);
    }
  }

  const documentTypeOptions = [
    { value: 'project_approval', label: language === 'th' ? 'เอกสารขออนุมัติโครงการ' : 'Project approval' },
    { value: 'venue_request', label: language === 'th' ? 'หนังสือขอใช้สถานที่' : 'Venue request' },
    { value: 'equipment_borrow', label: language === 'th' ? 'เอกสารยืมอุปกรณ์' : 'Equipment borrow request' },
    { value: 'support_request', label: language === 'th' ? 'หนังสือขอความอนุเคราะห์' : 'Support request' },
    { value: 'invitation_letter', label: language === 'th' ? 'หนังสือเชิญ' : 'Invitation letter' },
    { value: 'closing_report', label: language === 'th' ? 'รายงานสรุปโครงการ' : 'Closing report' },
    { value: 'custom', label: language === 'th' ? 'กำหนดเอง' : 'Custom' },
  ];

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader
        eyebrow={language === 'th' ? 'ศูนย์เอกสาร' : 'Document Center'}
        title={language === 'th' ? 'สร้างและดาวน์โหลดเอกสาร' : 'Generate and download'}
        description={language === 'th' ? 'เลือกเทมเพลต ตรวจข้อมูลที่ยังขาด ดูตัวอย่างก่อนสร้างไฟล์ และดาวน์โหลดเอกสารพร้อมใช้งาน' : 'Choose a template, check missing information, preview the document, and download a ready-to-use DOCX file.'}
        meta={<EventSwitcher compact />}
        actions={<HelpButton topicId="documents.generate" variant="link" />}
      />
      {state.loading ? <LoadingSkeleton /> : null}
      {data ? (
        <>
          <DocumentEventContextCard />
          <Card className="form-grid two-col">
            <Select label={language === 'th' ? 'ประเภทเอกสาร' : 'Document type'} value={documentType} onChange={(event) => { setDocumentType(event.target.value as DocumentType); setTemplateId(''); setPreviewHtml(''); }} options={documentTypeOptions} />
            <Select label={language === 'th' ? 'เทมเพลตเอกสาร' : 'Document template'} value={templateId} onChange={(event) => { setTemplateId(event.target.value); setPreviewHtml(''); }} options={templates.map((item) => ({ value: item.id, label: item.name }))} placeholder={language === 'th' ? 'เลือกเทมเพลต' : 'Choose template'} />
            <Input label={language === 'th' ? 'ชื่อเอกสาร' : 'Document title'} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={template?.name ?? documentTypeLabel(documentType)} />
            <div className="document-readiness">
              <Badge status={missing.length ? 'pending' : 'approved'}>{missing.length ? (language === 'th' ? `ขาด ${missing.length} ช่อง` : `${missing.length} missing`) : (language === 'th' ? 'ข้อมูลพร้อม' : 'Ready')}</Badge>
              {template ? <Badge status={documentScopeTone(template.event_id, currentEventId)}>{documentScopeLabel(template.event_id, currentEventId, language)}</Badge> : null}
              <span>{template ? `${template.placeholders.length} ${language === 'th' ? 'ช่องข้อมูล' : 'placeholders'} · ${missing.length ? (language === 'th' ? 'ยังไม่พร้อมเต็มที่' : 'Needs review') : (language === 'th' ? 'พร้อมสร้าง' : 'Ready to generate')}` : (language === 'th' ? 'ยังไม่ได้เลือกเทมเพลต' : 'No template selected')}</span>
            </div>
            <div className="form-actions full-span">
              <Button variant="secondary" icon={<Eye size={18} />} onClick={preview}>{language === 'th' ? 'ดูตัวอย่าง' : 'Preview'}</Button>
              <Button icon={<Download size={18} />} onClick={download} disabled={!template || generating}>{generating ? (language === 'th' ? 'กำลังสร้างเอกสาร...' : 'Generating...') : (language === 'th' ? 'สร้างและดาวน์โหลดเอกสาร' : 'Generate and download')}</Button>
            </div>
          </Card>
          {template ? (
            <Card className="privacy-notice" variant="soft">
              <strong>{language === 'th' ? 'ขอบเขตเทมเพลต' : 'Template scope'}</strong>
              <span>{documentScopeLabel(template.event_id, currentEventId, language)} · {language === 'th' ? 'ข้อมูลที่เติมในเอกสารจะใช้ข้อมูลของกิจกรรมที่เลือกด้านบน' : 'Document data comes from the selected event above.'}</span>
            </Card>
          ) : null}
          <Card className="document-missing-card" variant={missing.length ? 'warning' : 'success'}>
            <div className="section-title-row">
              <h2>{language === 'th' ? 'ข้อมูลที่ยังขาด' : 'Missing information'}</h2>
            </div>
            {missing.length ? (
              <div className="document-missing-groups">
                <div>
                  <strong>{language === 'th' ? 'ยังมีข้อมูลที่ต้องกรอกก่อนสร้างเอกสาร' : 'Some information is required before generating this document.'}</strong>
                  <div className="filter-chip-row">{missing.map((item) => <span className="filter-chip" key={item.field}>{item.label}</span>)}</div>
                </div>
                <Link className="btn btn-secondary document-readiness-action" to="/admin/documents/settings">{language === 'th' ? 'ไปกรอกข้อมูลตั้งต้น' : 'Fill missing project info'}</Link>
              </div>
            ) : <p>{language === 'th' ? 'ไม่มีข้อมูลที่ขาดสำหรับเอกสารประเภทนี้' : 'No missing information for this document type.'}</p>}
          </Card>
          {previewHtml ? <Card className="document-preview-card"><div dangerouslySetInnerHTML={{ __html: previewHtml }} /></Card> : null}
        </>
      ) : null}
    </section>
  );
}
