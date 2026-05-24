import { AlertTriangle, CheckCircle2, FileText, History, Settings, Upload, Wand2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { EventSwitcher } from '../components/events/EventSwitcher';
import { DocumentEventContextCard } from '../components/documents/DocumentEventContextCard';
import { HelpButton } from '../components/help/HelpButton';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { DashboardStatCard } from '../components/ui/DashboardStatCard';
import { PageHeader } from '../components/ui/PageHeader';
import { useEventContext } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { buildDocumentData, findMissingFields } from '../lib/documentGeneration';
import { fetchDocumentCenterData } from '../services/documents';

type DocumentStepTone = 'pending' | 'approved' | 'rejected';

export function DocumentCenterPage() {
  const { language } = useLanguage();
  const { currentEventId } = useEventContext();
  const state = useAsync(() => fetchDocumentCenterData(currentEventId), [currentEventId]);
  const data = state.data;
  const activeTemplate = data?.templates.find((template) => template.is_active !== false) ?? data?.templates[0] ?? null;
  const payload = data ? buildDocumentData(data) : {};
  const missingFields = data ? findMissingFields(activeTemplate?.document_type ?? 'project_approval', activeTemplate?.placeholders ?? [], payload) : [];
  const projectInfoReady = Boolean(data?.profile?.project_name) && !missingFields.length;
  const templateCount = data?.templates.length ?? 0;
  const historyCount = data?.history.length ?? 0;
  const generationReady = projectInfoReady && templateCount > 0;
  const lastGenerated = data?.history[0] ?? null;
  const statusText = {
    ready: language === 'th' ? 'พร้อม' : 'Ready',
    incomplete: language === 'th' ? 'ยังไม่ครบ' : 'Incomplete',
    missing: language === 'th' ? 'ยังไม่มี' : 'Missing',
    review: language === 'th' ? 'ตรวจสอบ' : 'Review',
  };
  const t = {
    title: language === 'th' ? 'ศูนย์เอกสาร' : 'Document Center',
    description: language === 'th'
      ? 'เลือกเทมเพลต ตรวจข้อมูลที่ยังขาด ดูตัวอย่างก่อนสร้างไฟล์ และดาวน์โหลดเอกสารพร้อมใช้งาน'
      : 'Choose a template, check missing information, preview the document, and download a ready-to-use DOCX file.',
    projectStatus: projectInfoReady
      ? (language === 'th' ? 'พร้อมสร้างเอกสาร' : 'Ready to generate')
      : (language === 'th' ? 'ข้อมูลตั้งต้นยังไม่ครบ' : 'Project information is incomplete'),
    templateStatus: templateCount
      ? `${templateCount} ${language === 'th' ? 'เทมเพลต' : 'templates'}`
      : (language === 'th' ? 'ยังไม่มีเทมเพลต' : 'No templates yet'),
    historyStatus: historyCount
      ? `${historyCount} ${language === 'th' ? 'ไฟล์' : 'files'}`
      : (language === 'th' ? 'ยังไม่มีประวัติเอกสาร' : 'No generated documents yet'),
    generationStatus: generationReady
      ? (language === 'th' ? 'พร้อมสร้าง' : 'Ready')
      : (language === 'th' ? 'ตรวจสอบก่อนสร้าง' : 'Review first'),
  };
  const steps: Array<{
    icon: ReactNode;
    title: string;
    description: string;
    to: string;
    status: string;
    tone: DocumentStepTone;
  }> = [
    {
      icon: <Settings size={20} />,
      title: language === 'th' ? 'กรอกข้อมูลตั้งต้น' : 'Fill project information',
      description: language === 'th' ? 'ข้อมูลโครงการ งบประมาณ กำหนดการ สถานที่ และอุปกรณ์' : 'Project, budget, schedule, venue, and equipment details.',
      to: '/admin/documents/settings',
      status: projectInfoReady ? statusText.ready : statusText.incomplete,
      tone: projectInfoReady ? 'approved' : 'pending',
    },
    {
      icon: <Upload size={20} />,
      title: language === 'th' ? 'เลือกหรืออัปโหลดเทมเพลต' : 'Choose or upload a template',
      description: language === 'th' ? 'ใช้เทมเพลต DOCX พร้อมช่องข้อมูล เช่น {project_name}' : 'Use DOCX templates with placeholders such as {project_name}.',
      to: '/admin/documents/templates',
      status: templateCount ? statusText.ready : statusText.missing,
      tone: templateCount ? 'approved' : 'pending',
    },
    {
      icon: <AlertTriangle size={20} />,
      title: language === 'th' ? 'ตรวจข้อมูลที่ยังขาด' : 'Check missing information',
      description: language === 'th' ? 'ดูว่าข้อมูลใดต้องกรอกก่อนสร้างเอกสาร' : 'Review fields that should be filled before generating documents.',
      to: '/admin/documents/generate',
      status: missingFields.length ? statusText.review : statusText.ready,
      tone: missingFields.length ? 'pending' : 'approved',
    },
    {
      icon: <Wand2 size={20} />,
      title: language === 'th' ? 'สร้างและดาวน์โหลดเอกสาร' : 'Generate and download',
      description: language === 'th' ? 'ดูตัวอย่าง แล้วสร้างไฟล์ DOCX เพื่อใช้งาน' : 'Preview and generate DOCX files for use.',
      to: '/admin/documents/generate',
      status: generationReady ? statusText.ready : statusText.review,
      tone: generationReady ? 'approved' : 'pending',
    },
    {
      icon: <History size={20} />,
      title: language === 'th' ? 'ดูประวัติเอกสาร' : 'View document history',
      description: language === 'th' ? 'เปิดรายการเอกสารที่เคยสร้างและดาวน์โหลดซ้ำ' : 'Review generated documents and download them again.',
      to: '/admin/documents/history',
      status: historyCount ? statusText.ready : statusText.missing,
      tone: historyCount ? 'approved' : 'pending',
    },
  ];

  return (
    <section className="page-stack document-center-page">
      <PageHeader
        eyebrow={language === 'th' ? 'ศูนย์เอกสาร' : 'Document Center'}
        title={t.title}
        description={t.description}
        meta={<EventSwitcher compact />}
        actions={<HelpButton topicId="documents.overview" variant="link" />}
      />
      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <div className="error-state">{state.error}</div> : null}
      {data ? (
        <>
          <DocumentEventContextCard />
          <div className="stats-grid">
            <DashboardStatCard label={language === 'th' ? 'ข้อมูลตั้งต้น' : 'Project info'} value={t.projectStatus} icon={<Settings size={20} />} />
            <DashboardStatCard label={language === 'th' ? 'เทมเพลต' : 'Templates'} value={t.templateStatus} icon={<FileText size={20} />} />
            <DashboardStatCard label={language === 'th' ? 'เอกสารที่เคยสร้าง' : 'Generated documents'} value={t.historyStatus} icon={<History size={20} />} />
            <DashboardStatCard label={language === 'th' ? 'สถานะพร้อมสร้าง' : 'Generation readiness'} value={t.generationStatus} icon={<Wand2 size={20} />} />
          </div>
          {!projectInfoReady ? (
            <Card className="document-readiness-panel" variant="warning">
              <div className="document-readiness-summary">
                <AlertTriangle size={24} />
                <div>
                  <p className="eyebrow">{language === 'th' ? 'ต้องตรวจข้อมูลก่อนสร้างไฟล์' : 'Action needed before generation'}</p>
                  <h2>{language === 'th' ? 'ข้อมูลตั้งต้นยังไม่ครบ' : 'Project information is incomplete'}</h2>
                  <span>{language === 'th' ? 'ต้องกรอกข้อมูลโครงการก่อนสร้างเอกสาร เพื่อให้ระบบเติมข้อมูลลงในเทมเพลตได้ถูกต้อง' : 'Fill in project information before generating documents so the system can populate templates correctly.'}</span>
                </div>
              </div>
              <Link className="btn btn-secondary document-readiness-action" to="/admin/documents/settings">
                <Settings size={18} />{language === 'th' ? 'ไปกรอกข้อมูลตั้งต้น' : 'Fill project information'}
              </Link>
            </Card>
          ) : null}
          <Card className="document-readiness-panel" variant={projectInfoReady ? 'success' : 'warning'}>
            <div className="document-readiness-summary">
              {projectInfoReady ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              <div>
                <p className="eyebrow">{language === 'th' ? 'ความพร้อมเอกสาร' : 'Document readiness'}</p>
                <h2>{t.projectStatus}</h2>
                <span>{language === 'th' ? 'ตรวจข้อมูลตั้งต้น เทมเพลต ข้อมูลที่ยังขาด และประวัติเอกสารล่าสุด' : 'Review project information, templates, missing fields, and the latest generated document.'}</span>
              </div>
            </div>
            <div className="document-readiness-grid">
              <div>
                <strong>{language === 'th' ? 'ข้อมูลตั้งต้น' : 'Project info'}</strong>
                <span>{data.profile?.project_name ?? (language === 'th' ? 'ยังไม่ได้กรอกชื่อโครงการ' : 'Project name is not set')}</span>
              </div>
              <div>
                <strong>{language === 'th' ? 'เทมเพลต' : 'Templates'}</strong>
                <span>{t.templateStatus}</span>
              </div>
              <div>
                <strong>{language === 'th' ? 'ข้อมูลที่ยังขาด' : 'Missing information'}</strong>
                {missingFields.length ? (
                  <div className="filter-chip-row">{missingFields.slice(0, 6).map((item) => <span className="filter-chip" key={item.field}>{item.label}</span>)}</div>
                ) : (
                  <span>{language === 'th' ? 'ไม่พบข้อมูลที่ยังขาดจากเทมเพลตหลัก' : 'No missing fields found from the primary template.'}</span>
                )}
              </div>
              <div>
                <strong>{language === 'th' ? 'เอกสารล่าสุด' : 'Last generated document'}</strong>
                <span>{lastGenerated ? `${lastGenerated.title} · v${lastGenerated.version}` : (language === 'th' ? 'ยังไม่มีเอกสารที่เคยสร้างแล้ว' : 'No generated documents yet')}</span>
              </div>
            </div>
          </Card>
          <div className="document-flow-steps">
            {steps.map((step, index) => (
              <Link className="document-flow-step" to={step.to} key={step.title}>
                <div className="document-flow-step-meta">
                  <Badge status={step.tone}>{String(index + 1)}</Badge>
                  <Badge status={step.tone}>{step.status}</Badge>
                </div>
                {step.icon}
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </Link>
            ))}
          </div>
          <div className="document-action-grid">
            <Link className="document-action-card" to="/admin/documents/generate"><Wand2 size={22} /><strong>{language === 'th' ? 'เริ่มสร้างเอกสาร' : 'Start document generation'}</strong><span>{language === 'th' ? 'เลือกเทมเพลต ตรวจข้อมูลที่ยังขาด และสร้างไฟล์ DOCX' : 'Choose a template, check missing information, and generate a DOCX file.'}</span></Link>
            <Link className="document-action-card" to="/admin/documents/templates"><Upload size={22} /><strong>{language === 'th' ? 'จัดการเทมเพลต' : 'Manage templates'}</strong><span>{language === 'th' ? 'อัปโหลดหรือจัดการไฟล์เทมเพลต DOCX' : 'Upload or manage DOCX template files.'}</span></Link>
            <Link className="document-action-card" to="/admin/documents/history"><History size={22} /><strong>{language === 'th' ? 'ดูประวัติเอกสาร' : 'View history'}</strong><span>{language === 'th' ? 'ดูรายการเอกสารที่เคยสร้างและดาวน์โหลดซ้ำ' : 'View generated documents and download them again.'}</span></Link>
          </div>
          <Card className="privacy-notice">
            <strong>{language === 'th' ? 'สำหรับผู้ดูแลเท่านั้น' : 'Admin only'}</strong>
            <span>{language === 'th' ? 'ศูนย์เอกสารสำหรับผู้ดูแลเท่านั้น เอกสารและไฟล์ที่สร้างไม่แสดงต่อสาธารณะ' : 'Document Center is for admins only. Generated documents and files are not public.'}</span>
          </Card>
        </>
      ) : null}
    </section>
  );
}
