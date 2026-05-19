import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Button } from './Button';

type ModalProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Modal({ open, title, children, onClose }: ModalProps) {
  const { language } = useLanguage();
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <Button variant="ghost" icon={<X size={18} />} aria-label={language === 'th' ? 'ปิด' : 'Close'} onClick={onClose} />
        </div>
        {children}
      </section>
    </div>
  );
}
