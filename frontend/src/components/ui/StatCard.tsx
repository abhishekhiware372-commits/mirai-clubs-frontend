import React from 'react';
import { Card } from './Card';
import { cn } from '../../lib/utils';

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'cyan' | 'violet' | 'emerald' | 'amber';
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'cyan',
  className,
}: StatCardProps) {
  const iconBorders = {
    cyan: 'bg-cyan-950/40 border-cyan-800/40 text-cyan-400',
    violet: 'bg-violet-950/40 border-violet-800/40 text-violet-400',
    emerald: 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400',
    amber: 'bg-amber-950/40 border-amber-800/40 text-amber-400',
  };

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-slate-400 tracking-wide uppercase font-mono">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1 tracking-tight">
            {value}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
              <span className={trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                {trend.value}
              </span>
              <span className="text-slate-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl border shrink-0', iconBorders[accentColor])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
