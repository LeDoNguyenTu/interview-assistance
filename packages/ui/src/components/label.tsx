import * as LabelPrimitive from '@radix-ui/react-label';

import { cn } from '../lib/cn.js';

export const Label = ({ className, ...props }: LabelPrimitive.LabelProps) => (
  <LabelPrimitive.Root
    className={cn(
      'text-sm font-semibold leading-none text-[var(--cl-color-foreground)] peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
      className,
    )}
    {...props}
  />
);
