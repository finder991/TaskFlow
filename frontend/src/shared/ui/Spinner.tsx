import { cn } from '@/shared/lib';

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Завантаження"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
        className ?? 'h-5 w-5',
      )}
    />
  );
}
