'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'profit' | 'loss' | 'neutral' | 'info';
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, icon, variant = 'default', className }: StatCardProps) {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  const variantStyles = {
    default: 'border-border',
    profit: 'border-emerald-500/20 bg-emerald-500/5',
    loss: 'border-red-500/20 bg-red-500/5',
    neutral: 'border-border',
    info: 'border-blue-500/20 bg-blue-500/5',
  };

  const valueStyles = {
    default: 'text-foreground',
    profit: 'text-emerald-400',
    loss: 'text-red-400',
    neutral: 'text-foreground',
    info: 'text-blue-400',
  };

  return (
    <Card className={cn('p-5 border', variantStyles[variant], className)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        {icon && (
          <div className={cn('p-2 rounded-lg', variant === 'profit' ? 'bg-emerald-500/10' : variant === 'loss' ? 'bg-red-500/10' : variant === 'info' ? 'bg-blue-500/10' : 'bg-muted')}>
            <div className={cn('w-4 h-4', variant === 'profit' ? 'text-emerald-400' : variant === 'loss' ? 'text-red-400' : variant === 'info' ? 'text-blue-400' : 'text-muted-foreground')}>
              {icon}
            </div>
          </div>
        )}
      </div>
      <div className={cn('text-2xl font-bold tracking-tight', valueStyles[variant])}>{value}</div>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-2">
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs font-medium', isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-muted-foreground')}>
              {isPositive ? <TrendingUp className="w-3 h-3" /> : isNegative ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              <span>{isPositive ? '+' : ''}{trend.toFixed(1)}%</span>
            </div>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
