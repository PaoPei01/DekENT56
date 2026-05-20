import { Download, Eye, Wand2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { Toast, ToastState } from '../components/ui/Toast';
import { buildDocumentData, findMissingFields, generateDocx, renderPreviewHtml } from '../lib/documentGeneration';
import { useAsync } from '../hooks/useAsync';
import { fetchDocumentCenterData, recordGeneratedDocument } from '../services/documents';
import { errorMessage } from '../utils/error';

export function DocumentGeneratePage() {
  const state = useAsync(fetchDocumentCenterData, []);
  const [templateId, setTemplateId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [toast, setToast] = useState<ToastState>(null);
  const data = state.data;
  const template = data?.templates.find((item) => item.id === templateId) ?? null;
  const payload = useMemo(() => data ? buildDocumentData(data) : {}, [data]);
  const missing = useMemo(() => template ? findMissingFields(template.placeholders, payload) : [], [payload, template]);

  function preview() {
    if (!template) return;
    setPreviewHtml(renderPreviewHtml(template, payload, missing));
  }

  async function download() {
    if (!template || !data) return;
    try {
      const fileName = generateDocx(template, payload);
      const html = previewHtml || renderPreviewHtml(template, payload, missing);
      await recordGeneratedDocument({
        project_profile_id: data.profile?.id ?? null,
        template_id: template.id,
        file_name: fileName,
        placeholders: payload,
        missing_fields: missing,
        preview_html: html,
      });
      setToast({ type: 'success', message: 'สร้างและบันทึกประวัติเอกสารแล้ว' });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, 'สร้าง DOCX ไม่สำเร็จ ตรวจ placeholder ใน template อีกครั้ง') });
    }
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader eyebrow="Document Center" title="Generate DOCX" description="เลือก template ตรวจข้อมูลที่ขาด ดูตัวอย่าง และดาวน์โหลดไฟล์" />
      {state.loading ? <LoadingSkeleton /> : null}
      {data ? (
        <>
          <Card className="form-grid two-col">
            <Select label="Template" value={templateId} onChange={(event) => { setTemplateId(event.target.value); setPreviewHtml(''); }} options={data.templates.map((item) => ({ value: item.id, label: item.name }))} placeholder="เลือก template" />
            <div className="document-readiness">
              <Badge status={missing.length ? 'pending' : 'approved'}>{missing.length ? `ขาด ${missing.length} ช่อง` : 'ข้อมูลพร้อม'}</Badge>
              <span>{template ? `${template.placeholders.length} placeholders` : 'ยังไม่ได้เลือก template'}</span>
            </div>
            <div className="form-actions full-span">
              <Button variant="secondary" icon={<Eye size={18} />} onClick={preview} disabled={!template}>HTML Preview</Button>
              <Button icon={<Download size={18} />} onClick={download} disabled={!template}>ดาวน์โหลด DOCX</Button>
            </div>
          </Card>
          {template ? (
            <Card className="document-missing-card">
              <h2>Missing info checker</h2>
              {missing.length ? <div className="filter-chip-row">{missing.map((field) => <span className="filter-chip" key={field}>{field}</span>)}</div> : <p>ไม่มีข้อมูลที่ขาดสำหรับ template นี้</p>}
            </Card>
          ) : null}
          {previewHtml ? (
            <Card className="document-preview-card">
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </Card>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
