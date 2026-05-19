import { Facebook, Instagram, MessageCircle } from 'lucide-react';

type Props = {
  instagram?: string | null;
  facebook?: string | null;
  lineId?: string | null;
  other?: string | null;
  compact?: boolean;
};

function cleanHandle(value?: string | null) {
  return (value ?? '').trim().replace(/^@/, '');
}

export function ContactLinks({ instagram, facebook, lineId, other, compact = false }: Props) {
  const ig = cleanHandle(instagram);
  const fb = cleanHandle(facebook);
  const line = cleanHandle(lineId);

  if (!ig && !fb && !line && !other) return <span className="muted">-</span>;

  return (
    <div className={`contact-links ${compact ? 'contact-links-compact' : ''}`}>
      {ig ? (
        <a href={`https://www.instagram.com/${ig}/`} target="_blank" rel="noreferrer" aria-label={`Instagram ${ig}`}>
          <Instagram size={16} /> Instagram <strong>{ig}</strong>
        </a>
      ) : null}
      {fb ? (
        <a href={fb.startsWith('http') ? fb : `https://www.facebook.com/search/top?q=${encodeURIComponent(fb)}`} target="_blank" rel="noreferrer" aria-label={`Facebook ${fb}`}>
          <Facebook size={16} /> Facebook <strong>{fb}</strong>
        </a>
      ) : null}
      {line ? (
        <span>
          <MessageCircle size={16} /> Line <strong>{line}</strong>
        </span>
      ) : null}
      {other ? <span>อื่น ๆ <strong>{other}</strong></span> : null}
    </div>
  );
}
