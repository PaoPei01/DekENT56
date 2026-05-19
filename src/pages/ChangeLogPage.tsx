import { Badge } from '../components/ui/Badge';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { fetchChangeLogs } from '../services/profiles';

export function ChangeLogPage() {
  const { language } = useLanguage();
  const state = useAsync(fetchChangeLogs, []);

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Audit</p>
        <h1>{language === 'th' ? 'ประวัติการเปลี่ยนแปลง' : 'Change log'}</h1>
        <p>{language === 'th' ? 'บันทึกการอนุมัติ ปฏิเสธ และการแก้ไขข้อมูลสำคัญ' : 'Audit records for approvals, rejections, and important data changes.'}</p>
      </div>
      {state.error ? <div className="error-state">{state.error}</div> : null}
      <ResponsiveDataTable
        rows={state.data ?? []}
        getKey={(row) => row.id}
        emptyText={state.loading ? (language === 'th' ? 'กำลังโหลดข้อมูล' : 'Loading data') : (language === 'th' ? 'ยังไม่มีประวัติการเปลี่ยนแปลง' : 'No change logs yet')}
        columns={[
          { key: 'time', header: language === 'th' ? 'เวลา' : 'Time', render: (row) => (row.created_at ? new Date(row.created_at).toLocaleString(language === 'th' ? 'th-TH' : 'en-US') : '-') },
          { key: 'profile', header: language === 'th' ? 'ผู้เข้าร่วม' : 'Participant', render: (row) => row.profiles?.name_th ?? row.profiles?.email ?? '-' },
          {
            key: 'action',
            header: language === 'th' ? 'ประเภท' : 'Type',
            render: (row) => {
              const status = row.action === 'approved' ? 'approved' : row.action === 'rejected' ? 'rejected' : 'pending';
              return <Badge status={status}>{row.action ?? (language === 'th' ? 'เปลี่ยนแปลง' : 'changed')}</Badge>;
            },
          },
          { key: 'detail', header: language === 'th' ? 'รายละเอียด' : 'Details', render: (row) => Object.keys(row.new_data ?? {}).join(', ') || '-' },
        ]}
      />
    </section>
  );
}
