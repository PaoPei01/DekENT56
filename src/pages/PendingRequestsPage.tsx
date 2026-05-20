import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Toast, ToastState } from '../components/ui/Toast';
import { useLanguage } from '../context/LanguageContext';
import { useAsync } from '../hooks/useAsync';
import { fieldLabel } from '../lib/constants';
import type { EditRequest } from '../lib/types';
import { approveEditRequest, fetchPendingRequests, rejectEditRequest } from '../services/profiles';
import { errorMessage } from '../utils/error';

export function PendingRequestsPage() {
  const { language } = useLanguage();
  const state = useAsync(fetchPendingRequests, []);
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<ToastState>(null);

  async function approve(request: EditRequest) {
    try {
      await approveEditRequest(request.id);
      setToast({ type: 'success', message: language === 'th' ? 'อนุมัติคำขอแล้ว' : 'Request approved' });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'อนุมัติไม่สำเร็จ' : 'Approval failed') });
    }
  }

  async function reject(request: EditRequest) {
    try {
      await rejectEditRequest(request.id, noteById[request.id] ?? '');
      setToast({ type: 'success', message: language === 'th' ? 'ปฏิเสธคำขอแล้ว' : 'Request rejected' });
      await state.reload();
    } catch (err) {
      setToast({ type: 'error', message: errorMessage(err, language === 'th' ? 'ปฏิเสธไม่สำเร็จ' : 'Rejection failed') });
    }
  }

  function displayValue(value: unknown) {
    if (value === true) return language === 'th' ? 'เปิด' : 'On';
    if (value === false) return language === 'th' ? 'ปิด' : 'Off';
    return String(value ?? '-');
  }

  function changedEntries(request: EditRequest) {
    const oldData = (request.old_data ?? {}) as Record<string, unknown>;
    const newData = (request.new_data ?? {}) as Record<string, unknown>;
    const normalize = (value: unknown) => value === '' || value == null ? null : String(value).trim();
    return Object.entries(newData).filter(([key, value]) => normalize(oldData[key]) !== normalize(value));
  }

  return (
    <section className="page-stack">
      <Toast toast={toast} />
      <div className="section-heading">
        <p className="eyebrow">Requests</p>
        <h1>{language === 'th' ? 'คำขอแก้ไขที่รออนุมัติ' : 'Pending edit requests'}</h1>
      </div>
      {state.loading ? <LoadingSkeleton /> : null}
      {state.error ? <div className="error-state">{state.error}</div> : null}
      {!state.loading && !state.data?.length ? <div className="empty-state">{language === 'th' ? 'ยังไม่มีคำขอที่รออนุมัติ' : 'No pending requests'}</div> : null}
      <div className="request-list">
        {(state.data ?? []).map((request) => (
          <Card key={request.id} className="request-card">
            <div className="request-header">
              <div>
                <h2>{request.profiles?.name_th ?? request.requested_by_email}</h2>
                <p>{request.requested_by_email}</p>
              </div>
              <Badge status="pending">{language === 'th' ? 'รออนุมัติ' : 'Pending'}</Badge>
            </div>
            <div className="diff-grid">
              {changedEntries(request).map(([key, value]) => (
                <div key={key}>
                  <span>{fieldLabel(key, language)}</span>
                  <del>{displayValue((request.old_data as Record<string, unknown> | null)?.[key])}</del>
                  <strong>{displayValue(value)}</strong>
                </div>
              ))}
              {!changedEntries(request).length ? <p className="muted">{language === 'th' ? 'ไม่มีข้อมูลที่เปลี่ยนจากเดิม' : 'No changed fields'}</p> : null}
            </div>
            <Input
              label={language === 'th' ? 'หมายเหตุกรณีปฏิเสธ' : 'Rejection note'}
              value={noteById[request.id] ?? ''}
              onChange={(event) => setNoteById({ ...noteById, [request.id]: event.target.value })}
            />
            <div className="admin-action-bar">
              <Button icon={<Check size={18} />} onClick={() => approve(request)}>
                {language === 'th' ? 'อนุมัติ' : 'Approve'}
              </Button>
              <Button variant="danger" icon={<X size={18} />} onClick={() => reject(request)}>
                {language === 'th' ? 'ปฏิเสธ' : 'Reject'}
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
