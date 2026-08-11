import { XIcon } from '@phosphor-icons/react/X';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';

import { cn } from '../lib/cn.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-50 bg-[var(--cl-color-overlay)] backdrop-blur-[2px] data-[state=closed]:animate-[cl-fade-out_var(--cl-duration-fast)_ease-in_forwards] data-[state=open]:animate-[cl-fade-in_var(--cl-duration-normal)_ease-out]',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DialogContent({ children, className, ...props }, ref) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[var(--cl-radius-dialog)] border border-[var(--cl-color-border)] bg-[var(--cl-color-surface)] p-6 text-[var(--cl-color-foreground)] shadow-[var(--cl-shadow-dialog)] outline-none data-[state=closed]:animate-[cl-dialog-out_var(--cl-duration-fast)_ease-in_forwards] data-[state=open]:animate-[cl-dialog-in_var(--cl-duration-normal)_ease-out]',
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Close dialog"
          className="absolute right-3 top-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--cl-radius-control)] text-[var(--cl-color-muted-foreground)] transition-[background-color,color] duration-[var(--cl-duration-fast)] hover:bg-[var(--cl-color-muted)] hover:text-[var(--cl-color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cl-color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--cl-color-surface)]"
        >
          <XIcon aria-hidden="true" size={20} weight="regular" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});
