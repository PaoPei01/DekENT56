import { CheckCircle2, Clock, Home, RotateCw, Search, UploadCloud, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toast, ToastState } from '../components/ui/Toast';
import { useAsync } from '../hooks/useAsync';
import { groupLabel } from '../lib/grouping';
import { majorLabel } from '../lib/major';
import type { StaffAttendance } from '../lib/types';
import { fetchStaffAttendanceContext, markStaffAttendance } from '../services/staff';

type QueueItem = {
  profileId: string;
  status: StaffAttendance['status'];
  note: string;
  eventDate: string;
};

const queueKey = 'tfbp_staff_attendance_queue';
const statuses: Array<{ value: StaffAttendance['status']; label: string; icon: ReactNode }> = [
  { value: 'present', label: 'มาแล้ว', icon: <CheckCircle2 size={17} /> },
  { value: 'late', label: 'สาย', icon: <Clock size={17} /> },
  { value: 'absent', label: 'ไม่มา', icon: <XCircle size={17} /> },
  { value: 'excused', label: 'ลา/ยกเว้น', icon: <RotateCw size={17} /> },
];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey) || '[]') as QueueItem[];
  } catch {
    return [];
  }
}

function saveQueue(items: QueueItem[]) {
  localStorage.setItem(queueKey, JSON.stringify(items));
}

export function StaffAttendancePage() {
  const [eventDate, setEventDate] = useState(today());
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>(loadQueue);
  const [toast, setToast] = useState<ToastState>(null);
  const state = useAsync(() => fetchStaffAttendanceContext(eventDate), [eventDate]);

  const participants = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (state.data?.participants ?? []).filter((profile) => {
      if (!term) return true;
      return [profile.name_th, profile.name_en, profile.nickname, profile.major, profile.phone]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [search, state.data?.participants]);

  const queueForDate = queue.filter((item) => item.eventDate === eventDate);
  const queueByProfile = new Map(queueForDate.map((item) => [item.profileId, item]));

  async function mark(profileId: string, status: StaffAttendance['status']) {
    const item = { profileId, status, note: '', eventDate };
    try {
      if (!navigator.onLine) throw new Error('offline');
      await markStaffAttendance(profileId, status, '', eventDate);
      setToast({ type: 'success', message: 'บันทึก attendance แล้ว' });
      await state.reload();
    } catch {
      const next = [...queue.filter((queued) => !(queued.profileId === profileId && queued.eventDate === eventDate)), item];
      setQueue(next);
      saveQueue(next);
      setToast({ type: 'success', message: 'เก็บไว้ในคิว offline แล้ว กด Sync เมื่อออนไลน์' });
    }
  }

  async function syncQueue() {
    const remaining: QueueItem[] = [];
    for (const item of queue) {
      try {
        await markStaffAttendance(item.profileId, item.status, item.note, item.eventDate);
      } catch {
        remaining.push(item);
      }
    }
    setQueue(remaining);
    saveQueue(remaining);
    setToast(remaining.length ? { type: 'error', message: `ยัง sync ไม่ครบ ${remaining.length} รายการ` } : { type: 'success', message: 'Sync attendance queue สำเร็จ' });
    await state.reload();
  }

  useEffect(() => {
    function onOnline() {
      if (loadQueue().length) void syncQueue();
    }
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // syncQueue intentionally uses current component state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.length]);

  if (state.loading) return <LoadingSkeleton />;
  if (state.error) return <div className="error-state">{state.error}</div>;
  if (!state.data?.access.can_mark_attendance) return <div className="empty-state">บัญชีนี้ไม่มีสิทธิ์เช็กชื่อ</div>;

  return (
    <section className="page-stack staff-page">
      <Toast toast={toast} />
      <div className="section-heading">
        <p className="eyebrow">Staff Attendance</p>
        <h1>เช็กชื่อ</h1>
        <p>เช็กชื่อเฉพาะกลุ่มที่ได้รับมอบหมาย ถ้าเน็ตหลุด ระบบจะเก็บไว้ในคิวบนเครื่องนี้ก่อน</p>
      </div>

      <div className="staff-sticky-actions">
        <Link className="btn btn-secondary" to="/staff"><Home size={18} />หน้าหลัก</Link>
        <Button variant="secondary" icon={<UploadCloud size={18} />} onClick={syncQueue} disabled={!queue.length}>Sync {queue.length}</Button>
      </div>

      <div className="attendance-toolbar">
        <Input label="วันที่กิจกรรม" type="date" value={eventDate} onChange={(event) => setEventDate(event.target.value)} />
        <div className="search-shell">
          <Search size={18} aria-hidden="true" />
          <Input label="ค้นหา" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ชื่อ ชื่อเล่น เบอร์ หรือสาขา" />
        </div>
      </div>

      <div className="staff-section-head">
        <h2>รายชื่อ</h2>
        <span>{participants.length} คน · คิว {queueForDate.length}</span>
      </div>

      <div className="staff-list">
        {participants.map((profile) => {
          const queued = queueByProfile.get(profile.id);
          const status = queued?.status ?? profile.attendance?.status;
          return (
            <Card className="attendance-card" key={profile.id}>
              <div>
                <h2>{profile.nickname || profile.name_th}</h2>
                <p>{profile.name_th} · {majorLabel(profile.major)}</p>
                <span>{groupLabel(profile.group_assignment?.main_group, profile.group_assignment?.subgroup)}</span>
              </div>
              <div className="attendance-status-line">
                <strong>{status ? statuses.find((item) => item.value === status)?.label : 'ยังไม่เช็ก'}</strong>
                {queued ? <span>รอ sync</span> : profile.attendance?.marked_at ? <span>{new Date(profile.attendance.marked_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span> : null}
              </div>
              <div className="attendance-actions">
                {statuses.map((item) => (
                  <Button key={item.value} variant={status === item.value ? 'primary' : 'secondary'} icon={item.icon} onClick={() => mark(profile.id, item.value)}>
                    {item.label}
                  </Button>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
