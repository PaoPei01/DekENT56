import { FileText } from 'lucide-react';
import { EventSwitcher } from '../events/EventSwitcher';
import { HelpButton } from '../help/HelpButton';
import { Card } from '../ui/Card';
import { useLanguage } from '../../context/LanguageContext';
import { useEventContext } from '../../context/EventContext';
import { documentEventName } from '../../lib/documentEventContext';

type DocumentEventContextCardProps = {
  showGlobalTemplateNote?: boolean;
};

export function DocumentEventContextCard({ showGlobalTemplateNote = true }: DocumentEventContextCardProps) {
  const { language } = useLanguage();
  const { currentEvent } = useEventContext();
  return (
    <Card className="document-event-context-card" variant="soft">
      <FileText size={28} />
      <div>
        <p className="eyebrow">{language === 'th' ? 'บริบทกิจกรรม' : 'Event context'}</p>
        <h2>{documentEventName(currentEvent, language)}</h2>
        <p>{language === 'th' ? 'ข้อมูลเอกสารด้านล่างใช้กับกิจกรรมที่เลือก' : 'The document data below belongs to the selected event.'}</p>
        {showGlobalTemplateNote ? <p>{language === 'th' ? 'Template ที่ใช้ได้ทุกกิจกรรมจะแสดงร่วมด้วย' : 'Templates available to all events are shown together.'}</p> : null}
      </div>
      <div className="document-event-context-actions">
        <HelpButton topicId="documents.event-documents" variant="compact" />
        <EventSwitcher compact />
      </div>
    </Card>
  );
}
