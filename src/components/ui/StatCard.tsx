import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  id?: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon: LucideIcon;
  variant?: 'default' | 'emerald' | 'blue' | 'amber' | 'purple';
}

export const StatCard: React.FC<StatCardProps> = ({
  id,
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
}) => {
  const iconColor = {
    default: 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800',
    emerald: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-800',
    blue: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800',
    amber: 'text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-800',
    purple: 'text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-100 dark:border-purple-800',
  }[variant];

  return (
    <div
      id={id}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase">{title}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1.5 tracking-tight">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {trend && (
            <span
              className={`font-semibold ${
                trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
