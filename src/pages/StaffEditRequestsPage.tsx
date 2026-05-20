import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { Toast, ToastState } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { approveStaffEditRequest, fetchAdminStaffEditRequests, rejectStaffEditRequest, staffDisplayName } from '../services/staffProfiles';
import { errorMessage } from '../utils/error';

const sectionLabels: Record<string, { th: string; en: string }> = {
  profile: { th: 'ข้อมูลติดต่อ', en: 'Contact' },
  medical: { th: 'ข้อมูลสุขภาพ', en: 'Medical' },
  assignment: { th: 'หน้าที่/กลุ่ม', en: 'Assignment' },
};

const fieldLabels: Record<string, { th: string; en: string }> = {
  phone: { th: 'เบอร์โทร', en: 'Phone' },
  line_id: { th: 'LINE ID', en: 'LINE ID' },
  instagram: { th: 'Instagram', en: 'Instagram' },
  facebook: { th: 'Facebook', en: 'Facebook' },
  disease: { th: 'โรคประจำตัว', en: 'Medical condition' },
  drug_allergy: { th: 'แพ้ยา', en: 'Drug allergy' },
  food_allergy: { th: 'แพ้อาหาร', en: 'Food allergy' },
  medical_note: { th: 'หมายเหตุสุขภาพ', en: 'Medical note' },
  primary_role: { th: 'ฝ่ายหลัก', en: 'Primary duty' },
  secondary_roles: { th: 'ฝ่ายเสริม', en: 'Secondary duties' },
  main_group: { th: 'สี', en: 'Color group' },
  subgroup: { th: 'กลุ่มย่อย', en: 'Subgroup' },
  base_number: { th: 'ฐาน', en: 'Base' },
};

export function StaffEditRequestsPage() {
  const { language } = useLanguage();
  const state = useAsync(fetchAdminStaffEditRequests, []);
  const [toast, setToast] = useState<ToastState>(null);
  const rows = state.data ?? [];

  async function review(id: string, approved: boolean) {
    try {
      if (approved) await approveStaffEditRequest(id);
      else await rejectStaffEditRequest(id, language === 'th' ? 'ปฏิเสธโดยผู้ดูแล' : 'Rejected by admin');
      setToast({ type: 'success', message: approved ? (language === 'th' ? 'อนุมัติคำขอแล้ว' : 'Request approved') : (language === 'th' ? 'ปฏิเสธคำขอแล้ว' : 'Request rejected') });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'ดำเนินการไม่สำเร็จ' : 'Action failed') });
    }
  }

  function renderRequestData(data: unknown) {
    const root = (data ?? {}) as Record<string, Record<string, unknown>>;
    const sections = Object.entries(root)
      .map(([section, values]) => [
        section,
        Object.entries(values ?? {}).filter(([, value]) => value !== null && value !== undefined && value !== ''),
      ] as const)
      .filter(([, entries]) => entries.length);

    if (!sections.length) return <span className="muted">{language === 'th' ? 'ไม่มีรายละเอียดที่เปลี่ยน' : 'No changed details'}</span>;

    return (
      <div className="request-summary-list">
        {sections.map(([section, entries]) => (
          <div className="request-summary-section" key={section}>
            <strong>{sectionLabels[section]?.[language] ?? section}</strong>
            {entries.map(([field, value]) => (
              <div className="request-summary-row" key={`${section}-${field}`}>
                <span>{fieldLabels[field]?.[language] ?? field}</span>
                <b>{Array.isArray(value) ? value.join(', ') : String(value)}</b>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <PageHeader eyebrow="Staff Requests" title={language === 'th' ? 'คำขอแก้ไขโปรไฟล์ทีมงาน' : 'Staff Profile Requests'} description={language === 'th' ? 'อนุมัติหรือปฏิเสธคำขอแก้ไขข้อมูลสำคัญของทีมงาน' : 'Review sensitive staff profile update requests.'} />
      <div className="stats-grid">
        <Card className="stat-card"><div><p>{language === 'th' ? 'รออนุมัติ' : 'Pending'}</p><strong>{rows.filter((row) => row.status === 'pending').length}</strong></div></Card>
        <Card className="stat-card"><div><p>{language === 'th' ? 'ทั้งหมด' : 'Total'}</p><strong>{rows.length}</strong></div></Card>
      </div>
      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <div className="error-state">{state.error}</div> : null}
      <ResponsiveDataTable
        rows={rows}
        getKey={(row) => row.id}
        emptyText={language === 'th' ? 'ไม่มีคำขอแก้ไขทีมงาน' : 'No staff edit requests'}
        mobileTitle={(row) => staffDisplayName(row.staff_profile ?? { nickname_th: null, nickname: null, nickname_en: null, name_th: null, name_en: null, student_id: null })}
        mobileSubtitle={(row) => `${row.status} · ${new Date(row.created_at ?? '').toLocaleString(language === 'th' ? 'th-TH' : 'en-US')}`}
        columns={[
          { key: 'staff', header: language === 'th' ? 'ทีมงาน' : 'Staff', render: (row) => staffDisplayName(row.staff_profile ?? { nickname_th: null, nickname: null, nickname_en: null, name_th: null, name_en: null, student_id: null }) },
          { key: 'status', header: language === 'th' ? 'สถานะ' : 'Status', render: (row) => <Badge status={row.status === 'approved' ? 'approved' : row.status === 'rejected' ? 'rejected' : 'pending'}>{row.status}</Badge> },
          { key: 'new_data', header: language === 'th' ? 'ข้อมูลใหม่' : 'New data', render: (row) => renderRequestData(row.new_data) },
          { key: 'created', header: language === 'th' ? 'วันที่ส่ง' : 'Created', render: (row) => new Date(row.created_at ?? '').toLocaleString(language === 'th' ? 'th-TH' : 'en-US') },
          {
            key: 'actions',
            header: language === 'th' ? 'จัดการ' : 'Actions',
            render: (row) => row.status === 'pending' ? (
              <div className="row-actions">
                <Button icon={<Check size={16} />} onClick={() => review(row.id, true)}>{language === 'th' ? 'อนุมัติ' : 'Approve'}</Button>
                <Button variant="danger" icon={<X size={16} />} onClick={() => review(row.id, false)}>{language === 'th' ? 'ปฏิเสธ' : 'Reject'}</Button>
              </div>
            ) : '-',
          },
        ]}
      />
    </section>
  );
}
