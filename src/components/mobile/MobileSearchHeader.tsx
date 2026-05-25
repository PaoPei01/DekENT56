import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ReactNode, RefObject } from 'react';

type MobileSearchHeaderProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultText?: string;
  children?: ReactNode;
  trailing?: ReactNode;
  inputRef?: RefObject<HTMLInputElement | null>;
  delay?: number;
  onSubmit?: (value: string) => void;
  submitLabel?: string;
};

export function MobileSearchHeader({ label, value, onChange, placeholder, resultText, children, trailing, inputRef, delay = 180, onSubmit, submitLabel }: MobileSearchHeaderProps) {
  const [draft, setDraft] = useState(value);

  function submitDraft() {
    onChange(draft);
    onSubmit?.(draft);
  }

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const timer = window.setTimeout(() => onChange(draft), delay);
    return () => window.clearTimeout(timer);
  }, [delay, draft, onChange]);

  return (
    <div className="mobile-search-header">
      <label className="mobile-search-field">
        <span>{label}</span>
        <Search size={19} aria-hidden="true" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              submitDraft();
            }
          }}
          placeholder={placeholder}
        />
        {draft ? (
          <button type="button" aria-label="Clear search" onClick={() => setDraft('')}>
            <X size={17} />
          </button>
        ) : null}
      </label>
      {resultText || children ? (
        <div className="mobile-search-meta">
          {resultText ? <strong>{resultText}</strong> : null}
          <span className="mobile-search-actions">
            {onSubmit && submitLabel ? (
              <button type="button" className="mobile-search-submit" onClick={submitDraft}>
                {submitLabel}
              </button>
            ) : null}
            {children}
          </span>
        </div>
      ) : null}
      {trailing ? <div className="mobile-search-trailing">{trailing}</div> : null}
    </div>
  );
}
