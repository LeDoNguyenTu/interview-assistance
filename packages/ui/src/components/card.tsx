import { forwardRef, type HTMLAttributes } from 'react';

import { cn } from '../lib/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function Card({ className, ...props }, ref) {
    return (
      <div
        className={cn(
          'rounded-[var(--cl-radius-card)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] text-[var(--cl-color-foreground)] shadow-[var(--cl-shadow-card)]',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

export const CardHeader = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function CardHeader({ className, ...props }, ref) {
    return <header className={cn('p-6 pb-0', className)} ref={ref} {...props} />;
  },
);

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function CardTitle({ className, ...props }, ref) {
    return (
      <h2
        className={cn('text-lg font-bold tracking-[-0.02em]', className)}
        ref={ref}
        {...props}
      />
    );
  },
);

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function CardDescription({ className, ...props }, ref) {
  return (
    <p
      className={cn('mt-2 text-sm leading-6 text-[var(--cl-color-muted-foreground)]', className)}
      ref={ref}
      {...props}
    />
  );
});

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  function CardContent({ className, ...props }, ref) {
    return <div className={cn('p-6', className)} ref={ref} {...props} />;
  },
);

export const CardFooter = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  function CardFooter({ className, ...props }, ref) {
    return <footer className={cn('flex items-center gap-2 p-6 pt-0', className)} ref={ref} {...props} />;
  },
);
