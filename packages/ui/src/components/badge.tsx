import type { HTMLAttributes } from 'react';
import { cn } from '../cn';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-700/50 text-slate-300',
  success: 'bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 ring-1 ring-inset ring-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 ring-1 ring-inset ring-red-500/20',
  muted: 'bg-slate-700/30 text-slate-400',
};

export function Badge({ variant = 'default', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
      {...rest}
    />
  );
}
