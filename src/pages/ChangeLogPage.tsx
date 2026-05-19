import { Badge } from '../components/ui/Badge';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { useAsync } from '../hooks/useAsync';
import { fetchChangeLogs } from '../services/profiles';

export function ChangeLogPage() {
  const state = useAsync(fetchChangeLogs, []);

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Audit</p>
        <h1>ประวัติการเปลี่ยนแปลง</h1>
        <p>บันทึกการอนุมัติ ปฏิเสธ และการแก้ไขข้อมูลสำคัญ</p>
      </div>
      {state.error ? <div className="error-state">{state.error}</div> : null}
      <ResponsiveDataTable
        rows={state.data ?? []}
        getKey={(row) => row.id}
        emptyText={state.loading ? 'กำลังโหลดข้อมูล' : 'ยังไม่มีประวัติการเปลี่ยนแปลง'}
        columns={[
          { key: 'time', header: 'เวลา', render: (row) => (row.created_at ? new Date(row.created_at).toLocaleString('th-TH') : '-') },
          { key: 'profile', header: 'ผู้เข้าร่วม', render: (row) => row.profiles?.name_th ?? row.profiles?.email ?? '-' },
          {
            key: 'action',
            header: 'ประเภท',
            render: (row) => {
              const status = row.action === 'approved' ? 'approved' : row.action === 'rejected' ? 'rejected' : 'pending';
              return <Badge status={status}>{row.action ?? 'เปลี่ยนแปลง'}</Badge>;
            },
          },
          { key: 'detail', header: 'รายละเอียด', render: (row) => Object.keys(row.new_data ?? {}).join(', ') || '-' },
        ]}
      />
    </section>
  );
}
