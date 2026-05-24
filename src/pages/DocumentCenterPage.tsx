import { AlertTriangle, CheckCircle2, FileText, History, Settings, Upload, Wand2 } from 'lucide-react';
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

export function DocumentCenterPage() {
  const { language } = useLanguage();
  const { currentEventId } = useEventContext();
  const state = useAsync(() => fetchDocumentCenterData(currentEventId), [currentEventId]);
  const data = state.data;
  const activeTemplate = data?.templates.find((template) => template.is_active !== false) ?? data?.templates[0] ?? null;
  const payload = data ? buildDocumentData(data) : {};
  const missingFields = data ? findMissingFields(activeTemplate?.document_type ?? 'project_approval', activeTemplate?.placeholders ?? [], payload) : [];
  const projectInfoReady = Boolean(data?.profile?.project_name) && !missingFields.length;
  const lastGenerated = data?.history[0] ?? null;
  const t = {
    title: language === 'th' ? 'ศูนย์เอกสาร' : 'Document Center',
    description: language === 'th'
      ? 'ทำเอกสารตามขั้นตอน ตั้งแต่ข้อมูลตั้งต้น เทมเพลต ตรวจข้อมูลที่ยังขาด จนถึงสร้างไฟล์และดูประวัติ'
      : 'Follow a guided document workflow from project information and templates to missing data checks, generation, and history.',
    projectStatus: projectInfoReady
      ? (language === 'th' ? 'พร้อมสร้างเอกสาร' : 'Ready to generate')
      : (language === 'th' ? 'ข้อมูลตั้งต้นยังไม่ครบ' : 'Project information is incomplete'),
    templateStatus: data?.templates.length
      ? `${data.templates.length} ${language === 'th' ? 'เทมเพลต' : 'templates'}`
      : (language === 'th' ? 'ยังไม่มีเทมเพลต' : 'No templates yet'),
    historyStatus: data?.history.length
      ? (language === 'th' ? 'มีเอกสารที่เคยสร้างแล้ว' : 'Generated documents exist')
      : (language === 'th' ? 'ยังไม่มีประวัติเอกสาร' : 'No generated documents yet'),
  };
  const steps = [
    {
      icon: <Settings size={20} />,
      title: language === 'th' ? 'กรอกข้อมูลตั้งต้น' : 'Fill project information',
      description: language === 'th' ? 'ข้อมูลโครงการ งบประมาณ กำหนดการ สถานที่ และอุปกรณ์' : 'Project, budget, schedule, venue, and equipment details.',
      to: '/admin/documents/settings',
    },
    {
      icon: <Upload size={20} />,
      title: language === 'th' ? 'เลือกหรืออัปโหลดเทมเพลต' : 'Choose or upload a template',
      description: language === 'th' ? 'ใช้เทมเพลต DOCX พร้อมช่องข้อมูล เช่น {project_name}' : 'Use DOCX templates with placeholders such as {project_name}.',
      to: '/admin/documents/templates',
    },
    {
      icon: <AlertTriangle size={20} />,
      title: language === 'th' ? 'ตรวจข้อมูลที่ยังขาด' : 'Check missing information',
      description: language === 'th' ? 'ดูว่าข้อมูลใดต้องกรอกก่อนสร้างเอกสาร' : 'Review fields that should be filled before generating documents.',
      to: '/admin/documents/generate',
    },
    {
      icon: <Wand2 size={20} />,
      title: language === 'th' ? 'สร้างและดาวน์โหลดเอกสาร' : 'Generate and download',
      description: language === 'th' ? 'ดูตัวอย่าง แล้วสร้างไฟล์ DOCX เพื่อใช้งาน' : 'Preview and generate DOCX files for use.',
      to: '/admin/documents/generate',
    },
    {
      icon: <History size={20} />,
      title: language === 'th' ? 'ดูประวัติเอกสาร' : 'View document history',
      description: language === 'th' ? 'เปิดรายการเอกสารที่เคยสร้างและดาวน์โหลดซ้ำ' : 'Review generated documents and download them again.',
      to: '/admin/documents/history',
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
            <DashboardStatCard label={language === 'th' ? 'เทมเพลตเอกสาร' : 'Templates'} value={t.templateStatus} icon={<FileText size={20} />} />
            <DashboardStatCard label={language === 'th' ? 'ประวัติเอกสาร' : 'History'} value={t.historyStatus} icon={<History size={20} />} />
          </div>
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
            {!projectInfoReady ? (
              <Link className="btn btn-secondary document-readiness-action" to="/admin/documents/settings">
                <Settings size={18} />{language === 'th' ? 'ไปกรอกข้อมูลตั้งต้น' : 'Fill missing project info'}
              </Link>
            ) : null}
          </Card>
          <div className="document-flow-steps">
            {steps.map((step, index) => (
              <Link className="document-flow-step" to={step.to} key={step.title}>
                <Badge status={index === 0 && !projectInfoReady ? 'pending' : 'approved'}>{String(index + 1)}</Badge>
                {step.icon}
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </Link>
            ))}
          </div>
          <div className="document-action-grid">
            <Link className="document-action-card" to="/admin/documents/generate"><Wand2 size={22} /><strong>{language === 'th' ? 'เริ่มสร้างเอกสาร' : 'Start document generation'}</strong><span>{language === 'th' ? 'ตรวจข้อมูลที่ยังขาด ดูตัวอย่าง และสร้างไฟล์ DOCX' : 'Check missing information, preview, and generate a DOCX file.'}</span></Link>
            <Link className="document-action-card" to="/admin/documents/templates"><Upload size={22} /><strong>{language === 'th' ? 'จัดการเทมเพลต' : 'Manage templates'}</strong><span>{language === 'th' ? 'อัปโหลดและตรวจช่องข้อมูลของเทมเพลต DOCX' : 'Upload and inspect DOCX template placeholders.'}</span></Link>
            <Link className="document-action-card" to="/admin/documents/history"><History size={22} /><strong>{language === 'th' ? 'ดูประวัติเอกสาร' : 'View history'}</strong><span>{language === 'th' ? 'ดูรายการเอกสารที่เคยสร้างและดาวน์โหลดซ้ำ' : 'Review generated documents and download them again.'}</span></Link>
          </div>
          <Card className="privacy-notice">
            <strong>{language === 'th' ? 'สำหรับผู้ดูแลเท่านั้น' : 'Admin only'}</strong>
            <span>{language === 'th' ? 'ศูนย์เอกสารไม่แสดงข้อมูลส่วนตัวของผู้เข้าร่วมต่อสาธารณะ และยังอยู่ภายใต้สิทธิ์ผู้ดูแลกับ Supabase RLS' : 'Document Center does not expose participant private data publicly and remains protected by admin permissions and Supabase RLS.'}</span>
          </Card>
        </>
      ) : null}
    </section>
  );
}
