import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../lib/cn.js';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type = 'text', ...props }, ref) {
    return (
      <input
        className={cn(
          'min-h-11 w-full rounded-[var(--cl-radius-control)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] px-4 py-2 text-base text-[var(--cl-color-foreground)] shadow-[var(--cl-shadow-control)] transition-[border-color,box-shadow] duration-[var(--cl-duration-fast)] placeholder:text-[var(--cl-color-muted-foreground)] focus-visible:border-[var(--cl-color-ring)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-background)] disabled:cursor-not-allowed disabled:bg-[var(--cl-color-muted)] disabled:opacity-60 sm:text-sm',
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
