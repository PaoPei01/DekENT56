import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useAsync } from '../hooks/useAsync';
import { fetchPublicMajors, fetchPublicProfiles } from '../services/profiles';

export function PublicListPage() {
  const [search, setSearch] = useState('');
  const [major, setMajor] = useState('');
  const { data: majors } = useAsync(fetchPublicMajors, []);
  const { data, loading, error } = useAsync(() => fetchPublicProfiles({ search, major }), [search, major]);
  const participants = data ?? [];
  const resultText = useMemo(() => `${participants.length.toLocaleString('th-TH')} คน`, [participants.length]);

  return (
    <section className="page-stack">
      <div className="hero-strip">
        <div>
          <p className="eyebrow">รายชื่อผู้เข้าร่วม</p>
          <h1>ค้นหารายชื่อกิจกรรม</h1>
          <p>หน้านี้แสดงเฉพาะชื่อเล่น ชื่อภาษาไทย และสาขาเท่านั้น ข้อมูลติดต่อและข้อมูลสุขภาพถูกซ่อนไว้เพื่อความเป็นส่วนตัว</p>
        </div>
        <strong>{resultText}</strong>
      </div>

      <Card className="privacy-notice">
        <strong>ประกาศความเป็นส่วนตัว</strong>
        <span>ข้อมูลอีเมล เบอร์โทร ช่องทางติดต่อ อาการแพ้ โรคประจำตัว และข้อมูลละเอียดอื่น ๆ จะแสดงเฉพาะผู้ดูแลระบบที่เข้าสู่ระบบแล้ว</span>
      </Card>

      <div className="toolbar">
        <div className="search-shell">
          <Search size={18} aria-hidden="true" />
          <Input label="ค้นหา" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ชื่อ ชื่อเล่น หรือสาขา" />
        </div>
        <Select label="กรองสาขา" value={major} onChange={(event) => setMajor(event.target.value)} options={majors ?? []} />
      </div>

      {loading ? <LoadingSkeleton /> : null}
      {error ? <div className="error-state">{error}</div> : null}
      {!loading && !error && participants.length === 0 ? <div className="empty-state">ไม่พบรายชื่อที่ตรงกับการค้นหา</div> : null}

      <div className="participant-grid">
        {participants.map((profile) => (
          <Card className="participant-card" key={profile.id}>
            <h2>{profile.name_th || 'ไม่ระบุชื่อ'}</h2>
            <p>{profile.nickname ? `ชื่อเล่น ${profile.nickname}` : 'ยังไม่มีชื่อเล่น'}</p>
            <span>{profile.major || 'ไม่ระบุสาขา'}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}
