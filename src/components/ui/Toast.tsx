import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';

export type ToastState = {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  durationMs?: number;
} | null;

type ToastProps = {
  toast: ToastState;
  onDismiss?: () => void;
};

const DEFAULT_TOAST_DURATION_MS = 4500;

export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(Boolean(toast));
  const [paused, setPaused] = useState(false);
  const remainingMsRef = useRef(DEFAULT_TOAST_DURATION_MS);
  const startedAtRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  const clearDismissTimer = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    setVisible(false);
    onDismiss?.();
  }, [clearDismissTimer, onDismiss]);

  useEffect(() => {
    if (!toast) {
      clearDismissTimer();
      setVisible(false);
      return;
    }
    remainingMsRef.current = toast.durationMs ?? DEFAULT_TOAST_DURATION_MS;
    setPaused(false);
    setVisible(true);
    return clearDismissTimer;
  }, [clearDismissTimer, toast]);

  useEffect(() => {
    if (!toast || !visible || paused) return undefined;
    clearDismissTimer();
    startedAtRef.current = Date.now();
    timeoutRef.current = window.setTimeout(dismiss, remainingMsRef.current);
    return clearDismissTimer;
  }, [clearDismissTimer, dismiss, paused, toast, visible]);

  if (!toast || !visible) return null;
  const durationMs = toast.durationMs ?? DEFAULT_TOAST_DURATION_MS;
  return (
    <div
      className={`toast toast-${toast.type} ${paused ? 'toast-paused' : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => {
        if (!timeoutRef.current) return;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - (Date.now() - startedAtRef.current));
        setPaused(true);
      }}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => {
        if (!timeoutRef.current) return;
        remainingMsRef.current = Math.max(0, remainingMsRef.current - (Date.now() - startedAtRef.current));
        setPaused(true);
      }}
      onBlur={() => setPaused(false)}
      style={{ '--toast-duration': `${durationMs}ms` } as CSSProperties}
    >
      <span>{toast.message}</span>
      <button type="button" className="toast-close" aria-label="Dismiss notification" onClick={dismiss}>
        <X size={16} aria-hidden="true" />
      </button>
      <span className="toast-progress" aria-hidden="true" />
    </div>
  );
}

export type ToastSetter = (toast: ToastState) => void;
export type ToastProviderValue = { toast: ToastState; setToast: ToastSetter };
export type WithChildren = { children: ReactNode };
