import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../lib/cn.js';

type BadgeTone = 'default' | 'muted' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const toneClasses: Record<BadgeTone, string> = {
  default: 'bg-[var(--cl-color-accent)] text-[var(--cl-color-accent-foreground)]',
  muted: 'bg-[var(--cl-color-muted)] text-[var(--cl-color-muted-foreground)]',
  success: 'bg-[var(--cl-color-status-success-surface)] text-[var(--cl-color-status-success)]',
  warning: 'bg-[var(--cl-color-status-warning-surface)] text-[var(--cl-color-status-warning)]',
  danger: 'bg-[var(--cl-color-status-danger-surface)] text-[var(--cl-color-destructive)]',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, tone = 'default', ...props },
  ref,
) {
  return (
    <span
      className={cn(
        'inline-flex min-h-6 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tracking-[0.01em]',
        toneClasses[tone],
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
