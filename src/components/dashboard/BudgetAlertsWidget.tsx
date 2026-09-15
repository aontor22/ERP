import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, DollarSign, AlertOctagon, TrendingUp, Sliders } from 'lucide-react';
import { ExpenseBudgetSummary } from '../../types/erp.js';

interface BudgetAlertsWidgetProps {
  budgetAlerts?: {
    totalBudgeted: number;
    totalSpent: number;
    exceededCount: number;
    warningCount: number;
    normalCount: number;
    overallPercentageUsed: number;
    exceededBudgets?: ExpenseBudgetSummary[];
    warningBudgets?: ExpenseBudgetSummary[];
    topAlerts?: ExpenseBudgetSummary[];
    allBudgets?: ExpenseBudgetSummary[];
  };
  onNavigate: (module: string) => void;
}

export const BudgetAlertsWidget: React.FC<BudgetAlertsWidgetProps> = ({
  budgetAlerts,
  onNavigate,
}) => {
  if (!budgetAlerts || !budgetAlerts.allBudgets || budgetAlerts.allBudgets.length === 0) {
    return null;
  }

  const {
    totalBudgeted,
    totalSpent,
    exceededCount,
    warningCount,
    overallPercentageUsed,
    allBudgets,
  } = budgetAlerts;

  const hasExceeded = exceededCount > 0;
  const hasWarning = warningCount > 0;

  const formatShortCurrency = (num: number) => {
    if (Math.abs(num) >= 10000000) {
      return `৳${(num / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(num) >= 100000) {
      return `৳${(num / 100000).toFixed(1)} Lakh`;
    }
    if (Math.abs(num) >= 1000) {
      return `৳${(num / 1000).toFixed(0)}k`;
    }
    return `৳${num.toLocaleString()}`;
  };

  return (
    <div
      id="expense-budget-monitoring-widget"
      className={`rounded-xl border transition-all shadow-2xs overflow-hidden ${
        hasExceeded
          ? 'bg-gradient-to-b from-rose-50/40 via-white to-white dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 border-rose-200 dark:border-rose-900/60'
          : hasWarning
          ? 'bg-gradient-to-b from-amber-50/40 via-white to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 border-amber-200 dark:border-amber-900/60'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      {/* Widget Header & Alert Callout Banner */}
      <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              hasExceeded
                ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                : hasWarning
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {hasExceeded ? (
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            ) : hasWarning ? (
              <AlertOctagon className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                Expense Account Budget Monitoring
              </h3>
              {hasExceeded ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wide bg-rose-100 text-rose-700 dark:bg-rose-900/80 dark:text-rose-200 border border-rose-300 dark:border-rose-700 animate-pulse">
                  {exceededCount} Over-Budget Alert{exceededCount > 1 ? 's' : ''}
                </span>
              ) : hasWarning ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                  {warningCount} Near Threshold
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                  All Budgets On Track
                </span>
              )}
            </div>
            <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live GL ledger debits vs. monthly ceilings for September 2026
            </p>
          </div>
        </div>

        {/* Action button to navigate to Accounting */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 text-2xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-slate-500 dark:text-slate-400">Total Spend:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {formatShortCurrency(totalSpent)} / {formatShortCurrency(totalBudgeted)}
            </span>
            <span
              className={`font-extrabold ${
                overallPercentageUsed > 100
                  ? 'text-rose-600 dark:text-rose-400'
                  : overallPercentageUsed >= 80
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              ({overallPercentageUsed}%)
            </span>
          </div>
          <button
            id="manage-budgets-nav-btn"
            onClick={() => onNavigate('accounting')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-2xs font-semibold transition-colors shadow-2xs"
          >
            <span>Adjust Budgets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress Bars Grid */}
      <div className="p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allBudgets.map((b) => {
            const isExceeded = b.status === 'Exceeded';
            const isWarning = b.status === 'Warning';
            const fillWidth = Math.min(b.percentageUsed, 100);
            const overrun = b.actualSpent - b.monthlyBudget;

            return (
              <div
                key={b.id}
                id={`budget-bar-card-${b.accountCode}`}
                className={`p-3.5 rounded-lg border transition-all ${
                  isExceeded
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/70 shadow-2xs'
                    : isWarning
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {/* Account Code, Name and Status Pill */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-3xs font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {b.accountCode}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {b.accountName}
                      </h4>
                    </div>
                    <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {b.subCategory || 'Operating Expense'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    {isExceeded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-extrabold bg-rose-600 text-white shadow-2xs">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        {b.percentageUsed}% (Exceeded)
                      </span>
                    ) : isWarning ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-bold bg-amber-500 text-white shadow-2xs">
                        <AlertOctagon className="w-2.5 h-2.5" />
                        {b.percentageUsed}% (Warning)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-3xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {b.percentageUsed}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Progress Bar with Threshold Markers */}
                <div className="space-y-1.5 my-2">
                  <div className="relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    {/* 80% Warning marker tick */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 opacity-70"
                      style={{ left: `${b.warningThresholdPercent || 80}%` }}
                      title={`Warning threshold: ${b.warningThresholdPercent || 80}%`}
                    />
                    {/* Fill Bar */}
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isExceeded
                          ? 'bg-rose-500 dark:bg-rose-600'
                          : isWarning
                          ? 'bg-amber-500 dark:bg-amber-500'
                          : 'bg-emerald-500 dark:bg-emerald-500'
                      }`}
                      style={{ width: `${fillWidth}%` }}
                    />
                  </div>

                  {/* Overrun Alert Strip if Exceeded */}
                  {isExceeded && (
                    <div className="flex items-center justify-between text-3xs font-mono font-bold text-rose-700 dark:text-rose-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Threshold Overrun:
                      </span>
                      <span>
                        +{formatShortCurrency(overrun)} over monthly limit (+{(b.percentageUsed - 100).toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Figures: Actual Spent vs Budgeted */}
                <div className="flex items-center justify-between text-2xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 font-mono">
                  <div>
                    <span className="text-3xs uppercase tracking-wider text-slate-400 block">Actual Spent</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatShortCurrency(b.actualSpent)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xs uppercase tracking-wider text-slate-400 block">Budget Ceiling</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {formatShortCurrency(b.monthlyBudget)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-3xs uppercase tracking-wider text-slate-400 block">
                      {isExceeded ? 'Deficit' : 'Remaining'}
                    </span>
                    <span
                      className={`font-bold ${
                        isExceeded
                          ? 'text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExceeded
                        ? `-${formatShortCurrency(Math.abs(b.remainingBudget))}`
                        : `+${formatShortCurrency(b.remainingBudget)}`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary Notice */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-2xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
            <span>Exceeded (&ge;100%)</span>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 ml-2" />
            <span>Warning (80-99%)</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 ml-2" />
            <span>Normal (&lt;80%)</span>
          </div>
          <button
            onClick={() => onNavigate('accounting')}
            className="text-blue-600 dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Accounting Ledger & Budget Controls</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
