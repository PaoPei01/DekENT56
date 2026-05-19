import { AlertTriangle, CheckCircle2, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ResponsiveDataTable } from '../components/ui/ResponsiveDataTable';
import { Toast, ToastState } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { groupLabel } from '../lib/grouping';
import { majorLabel } from '../lib/major';
import { fetchAdminStaffProfiles, importStaffRecords } from '../services/staffManagement';
import { errorMessage } from '../utils/error';
import { parseStaffImportWorkbook, type StaffImportPreview } from '../utils/staffImport';

export function StaffImportPage() {
  const { language } = useLanguage();
  const existingState = useAsync(() => fetchAdminStaffProfiles(), []);
  const [preview, setPreview] = useState<StaffImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const existingDuplicates = useMemo(() => {
    if (!preview) return [];
    const existing = existingState.data ?? [];
    const byStudent = new Set(existing.map((row) => row.student_id?.toLowerCase()).filter(Boolean));
    const byEmail = new Set(existing.map((row) => row.email?.toLowerCase()).filter(Boolean));
    const byPhone = new Set(existing.map((row) => row.phone).filter(Boolean));
    return preview.rows.flatMap((row) => [
      row.profile.student_id && byStudent.has(row.profile.student_id.toLowerCase()) ? { type: 'student_id', value: row.profile.student_id, name: row.profile.name_th } : null,
      row.profile.email && byEmail.has(row.profile.email.toLowerCase()) ? { type: 'email', value: row.profile.email, name: row.profile.name_th } : null,
      row.profile.phone && byPhone.has(row.profile.phone) ? { type: 'phone', value: row.profile.phone, name: row.profile.name_th } : null,
    ].filter((item): item is { type: string; value: string; name: string | null } => Boolean(item)));
  }, [existingState.data, preview]);

  async function parseFile(file: File) {
    setLoading(true);
    try {
      const result = await parseStaffImportWorkbook(file);
      setPreview(result);
      setToast({ type: 'success', message: language === 'th' ? `อ่านไฟล์สำเร็จ ${result.rows.length} แถว` : `Parsed ${result.rows.length} rows` });
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'อ่านไฟล์ไม่สำเร็จ' : 'Import preview failed') });
    } finally {
      setLoading(false);
    }
  }

  async function commitImport() {
    if (!preview?.rows.length) return;
    setLoading(true);
    try {
      const result = await importStaffRecords(preview.rows);
      setToast({ type: 'success', message: language === 'th' ? `นำเข้าสำเร็จ ${result.imported} รายการ` : `Imported ${result.imported} records` });
      await existingState.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'นำเข้าไม่สำเร็จ' : 'Import failed') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <div className="section-heading">
        <p className="eyebrow">Staff Import</p>
        <h1>{language === 'th' ? 'นำเข้าข้อมูลสตาฟจาก Excel' : 'Import staff from Excel'}</h1>
        <p>{language === 'th' ? 'ระบบจะแสดง preview, duplicate warning, contact parsing และข้อมูลที่ขาดก่อนบันทึกลง Supabase' : 'Preview duplicate warnings, contact parsing, and missing data before committing to Supabase.'}</p>
      </div>

      <Card className="import-drop-card">
        <FileSpreadsheet size={28} />
        <div>
          <strong>{language === 'th' ? 'เลือกไฟล์ Excel' : 'Choose Excel file'}</strong>
          <span>{language === 'th' ? 'รองรับ sheet ข้อมูลทีมงาน, ข้อมูลสตาฟ, staff_profiles_import และ staff_base_assignments' : 'Supports sheets ข้อมูลทีมงาน, ข้อมูลสตาฟ, staff_profiles_import, and staff_base_assignments.'}</span>
        </div>
        <label className="btn btn-primary">
          <UploadCloud size={18} />
          {language === 'th' ? 'เลือกไฟล์' : 'Select file'}
          <input
            type="file"
            accept=".xlsx,.xls"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void parseFile(file);
            }}
          />
        </label>
        <Link className="btn btn-secondary" to="/admin/staff">{language === 'th' ? 'กลับหน้าสตาฟ' : 'Back to staff'}</Link>
      </Card>

      {loading || existingState.loading ? <LoadingSkeleton /> : null}
      {existingState.error ? <div className="error-state">{existingState.error}</div> : null}

      {preview ? (
        <>
          <div className="stats-grid">
            <Card className="stat-card"><div><p>{language === 'th' ? 'แถวที่อ่านได้' : 'Parsed rows'}</p><strong>{preview.rows.length}</strong></div></Card>
            <Card className="stat-card"><div><p>{language === 'th' ? 'ซ้ำในไฟล์' : 'Duplicates in file'}</p><strong>{preview.duplicates.length}</strong></div></Card>
            <Card className="stat-card"><div><p>{language === 'th' ? 'ซ้ำกับระบบเดิม' : 'Existing matches'}</p><strong>{existingDuplicates.length}</strong></div></Card>
            <Card className="stat-card"><div><p>{language === 'th' ? 'ข้อมูลขาด' : 'Missing data'}</p><strong>{preview.rows.filter((row) => row.warnings.length).length}</strong></div></Card>
          </div>

          <Card className="warning-panel">
            <h2>{language === 'th' ? 'Preview ก่อนบันทึก' : 'Preview before commit'}</h2>
            <p>{language === 'th' ? `Sheets: ${preview.sheets.join(', ')}` : `Sheets: ${preview.sheets.join(', ')}`}</p>
            {[...preview.warnings, ...preview.duplicates.map((item) => `${item.type} duplicate: ${item.value} (${item.count})`), ...existingDuplicates.map((item) => `${item.type} already exists: ${item.value}`)].slice(0, 30).map((warning) => (
              <p key={warning}><AlertTriangle size={14} /> {warning}</p>
            ))}
          </Card>

          <ResponsiveDataTable
            rows={preview.rows}
            getKey={(row) => row.row_key}
            emptyText={language === 'th' ? 'ยังไม่มีข้อมูล preview' : 'No preview rows'}
            mobileDetailsLabel={language === 'th' ? 'รายละเอียด' : 'Details'}
            mobileTitle={(row) => row.profile.nickname || row.profile.name_th || row.profile.student_id}
            mobileSubtitle={(row) => `${row.profile.name_th || '-'} · ${majorLabel(row.profile.major, language)}`}
            mobileMeta={(row) => groupLabel(row.assignment.main_group, row.assignment.subgroup, language)}
            columns={[
              { key: 'name', header: language === 'th' ? 'ชื่อ' : 'Name', render: (row) => <div className="participant-admin-cell"><strong>{row.profile.name_th}</strong><span>{row.profile.nickname} · {row.profile.student_id}</span></div> },
              { key: 'major', header: language === 'th' ? 'สาขา' : 'Major', render: (row) => majorLabel(row.profile.major, language) },
              { key: 'position', header: language === 'th' ? 'ตำแหน่ง' : 'Position', render: (row) => row.profile.position || '-' },
              { key: 'group', header: language === 'th' ? 'กลุ่ม' : 'Group', render: (row) => groupLabel(row.assignment.main_group, row.assignment.subgroup, language) },
              { key: 'contact', header: language === 'th' ? 'แยก contact' : 'Parsed contact', render: (row) => <span>{['IG ' + (row.contact_preview.instagram ?? '-'), 'Line ' + (row.contact_preview.line_id ?? '-'), 'FB ' + (row.contact_preview.facebook ?? '-')].join(' · ')}</span> },
              { key: 'warnings', header: language === 'th' ? 'คำเตือน' : 'Warnings', render: (row) => row.warnings.length ? row.warnings.join(', ') : <CheckCircle2 size={16} /> },
            ]}
          />

          <div className="admin-action-bar">
            <Button icon={<UploadCloud size={18} />} onClick={commitImport} disabled={loading || !preview.rows.length}>
              {language === 'th' ? 'Commit Import ลง Supabase' : 'Commit import to Supabase'}
            </Button>
          </div>
        </>
      ) : null}
    </section>
  );
}
