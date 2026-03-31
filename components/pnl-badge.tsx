'use client';
import { cn } from '@/lib/utils';

interface PnlBadgeProps {
  value: number;
  showSign?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PnlBadge({ value, showSign = true, className, size = 'md' }: PnlBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const formatted = Math.abs(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const display = showSign ? (isPositive ? `+${formatted}` : isNegative ? `-${formatted}` : formatted) : formatted;

  return (
    <span className={cn(
      'font-semibold tabular-nums',
      isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-muted-foreground',
      size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm',
      className
    )}>
      {display}
    </span>
  );
}
