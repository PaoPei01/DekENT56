import { AlertTriangle, FileText, MapPinned } from 'lucide-react';
import type { Announcement } from '../services/announcements';

type AnnouncementCardProps = {
  item: Announcement;
  compact?: boolean;
};

export function AnnouncementCard({ item, compact = false }: AnnouncementCardProps) {
  const icon = item.type === 'emergency' ? <AlertTriangle size={18} /> : item.type === 'map' || item.type === 'traffic' ? <MapPinned size={18} /> : <FileText size={18} />;
  return (
    <article className={`announcement-card priority-${item.priority} ${compact ? 'compact' : ''}`}>
      {item.image_url && !compact ? <img src={item.image_url} alt="" loading="lazy" /> : null}
      <div>
        <span className="announcement-type">{icon}{item.type}</span>
        <h3>{item.title}</h3>
        {item.description ? <p className="announcement-description">{item.description}</p> : null}
        <div className="staff-contact-row">
          {item.file_url ? <a href={item.file_url} target="_blank" rel="noreferrer">PDF / File</a> : null}
          {item.external_url ? <a href={item.external_url} target="_blank" rel="noreferrer">Link</a> : null}
        </div>
      </div>
    </article>
  );
}
