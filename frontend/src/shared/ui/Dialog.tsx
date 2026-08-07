import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"

      aria-labelledby={title ? titleId : undefined}
    >
      <div
        className={cn('mt-10 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl sm:mt-0', className)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            {title}
          </h2>
        )}
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
        <div className={cn(title && 'mt-4')}>{children}</div>
      </div>
    </div>,
    document.body,
  );
}
