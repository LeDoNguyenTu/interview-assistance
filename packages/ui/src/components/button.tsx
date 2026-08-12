import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'default' | 'compact';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--cl-color-primary)] text-white shadow-[var(--cl-shadow-control)] hover:bg-[var(--cl-color-primary-hover)]',
  secondary:
    'border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] text-[var(--cl-color-foreground)] hover:bg-[var(--cl-color-muted)]',
  destructive:
    'bg-[var(--cl-color-destructive)] text-[var(--cl-color-on-destructive)] shadow-[var(--cl-shadow-control)] hover:bg-[var(--cl-color-destructive-hover)]',
  ghost: 'text-[var(--cl-color-foreground)] hover:bg-[var(--cl-color-muted)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'min-h-11 px-4 py-2 text-sm',
  compact: 'min-h-11 min-w-11 px-4 py-2 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      size = 'default',
      type = 'button',
      variant = 'primary',
      ...props
    },
    ref,
  ) {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-[var(--cl-radius-control)] font-semibold tracking-[-0.01em] transition-[background-color,color,box-shadow,transform] duration-[var(--cl-duration-fast)] ease-out motion-safe:active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-background)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        type={type}
        {...props}
      />
    );
  },
);
