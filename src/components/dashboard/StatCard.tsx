'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: 'green' | 'red' | 'blue' | 'amber' | 'purple';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
}: StatCardProps) {
  const colorConfigs = {
    green: {
      bg: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 dark:from-emerald-500/15 dark:to-emerald-600/5 dark:border-emerald-500/10',
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      shadow: 'hover:shadow-emerald-500/10',
      glow: 'shadow-emerald-500/5',
    },
    red: {
      bg: 'from-rose-500/10 to-rose-600/5 border-rose-500/20 dark:from-rose-500/15 dark:to-rose-600/5 dark:border-rose-500/10',
      iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      shadow: 'hover:shadow-rose-500/10',
      glow: 'shadow-rose-500/5',
    },
    blue: {
      bg: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 dark:from-blue-500/15 dark:to-blue-600/5 dark:border-blue-500/10',
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      shadow: 'hover:shadow-blue-500/10',
      glow: 'shadow-blue-500/5',
    },
    amber: {
      bg: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 dark:from-amber-500/15 dark:to-amber-600/5 dark:border-amber-500/10',
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      shadow: 'hover:shadow-amber-500/10',
      glow: 'shadow-amber-500/5',
    },
    purple: {
      bg: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 dark:from-purple-500/15 dark:to-purple-600/5 dark:border-purple-500/10',
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400',
      shadow: 'hover:shadow-purple-500/10',
      glow: 'shadow-purple-500/5',
    },
  };

  const config = colorConfigs[color];

  return (
    <div
      className={cn(
        'glass relative overflow-hidden rounded-2xl border p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        config.bg,
        config.shadow,
        config.glow
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">{title}</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {value}
            </span>
          </div>
        </div>
        <div className={cn('rounded-xl p-3 transition-all duration-300', config.iconBg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        {subtitle && (
          <span className="text-xs text-[var(--text-tertiary)]">{subtitle}</span>
        )}
        {trend && trendValue && (
          <div
            className={cn(
              'flex items-center space-x-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              trend === 'up'
                ? 'bg-emerald-100/50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                : 'bg-rose-100/50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400'
            )}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
