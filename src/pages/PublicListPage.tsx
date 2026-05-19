import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { majorLabel } from '../lib/major';
import { fetchPublicMajors, fetchPublicProfiles } from '../services/profiles';

export function PublicListPage() {
  const { language, t } = useLanguage();
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
          <p className="eyebrow">{t.participants}</p>
          <h1>{t.searchTitle}</h1>
          <p>{language === 'th' ? 'หน้านี้แสดงเฉพาะชื่อภาษาไทย ชื่อเล่น และสาขาเท่านั้น ข้อมูลติดต่อและข้อมูลสุขภาพถูกซ่อนไว้เพื่อความเป็นส่วนตัว' : 'This page only shows Thai name, nickname, and major. Contact and health details remain private.'}</p>
        </div>
        <strong>{resultText}</strong>
      </div>

      <Card className="privacy-notice">
        <strong>{language === 'th' ? 'ประกาศความเป็นส่วนตัว' : 'Privacy notice'}</strong>
        <span>{t.privacy}</span>
      </Card>

      <div className="toolbar">
        <div className="search-shell">
          <Search size={18} aria-hidden="true" />
          <Input label={t.search} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={language === 'th' ? 'ชื่อ ชื่อเล่น หรือสาขา' : 'Name, nickname, or major'} />
        </div>
        <Select label={t.filterMajor} value={major} onChange={(event) => setMajor(event.target.value)} options={majors ?? []} placeholder={t.all} />
      </div>

      {loading ? <LoadingSkeleton /> : null}
      {error ? <div className="error-state">{error}</div> : null}
      {!loading && !error && participants.length === 0 ? <div className="empty-state">ไม่พบรายชื่อที่ตรงกับการค้นหา</div> : null}

      <div className="participant-grid">
        {participants.map((profile) => (
          <Card className="participant-card" key={profile.id}>
            <h2>{profile.name_th || 'ไม่ระบุชื่อ'}</h2>
            <p>{profile.nickname ? `${t.nickname} ${profile.nickname}` : language === 'th' ? 'ยังไม่มีชื่อเล่น' : 'No nickname yet'}</p>
            <span>{majorLabel(profile.major, language)}</span>
          </Card>
        ))}
      </div>
    </section>
  );
}
