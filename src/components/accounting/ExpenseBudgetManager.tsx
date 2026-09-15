import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  DollarSign,
  Plus,
  Sliders,
  Filter,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  X,
  Calendar,
  Layers,
  Edit2,
  Info,
} from 'lucide-react';
import { Account, ExpenseBudgetSummary } from '../../types/erp.js';
import { api } from '../../lib/api.js';

interface ExpenseBudgetManagerProps {
  accounts: Account[];
  initialBudgetsSummary?: {
    budgets: ExpenseBudgetSummary[];
    totalBudgeted: number;
    totalSpent: number;
    exceededCount: number;
    warningCount: number;
    normalCount: number;
    overallPercentageUsed: number;
  };
  baseCurrency?: string;
  onBudgetUpdated?: () => void;
}

export const ExpenseBudgetManager: React.FC<ExpenseBudgetManagerProps> = ({
  accounts,
  initialBudgetsSummary,
  baseCurrency = 'BDT',
  onBudgetUpdated,
}) => {
  const [budgetsSummary, setBudgetsSummary] = useState(initialBudgetsSummary);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Exceeded' | 'Warning' | 'Normal'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected period
  const [selectedMonth, setSelectedMonth] = useState(9);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAccountId, setModalAccountId] = useState('');
  const [modalBudgetAmount, setModalBudgetAmount] = useState<number | ''>('');
  const [modalWarnThreshold, setModalWarnThreshold] = useState(80);
  const [modalCritThreshold, setModalCritThreshold] = useState(100);
  const [modalNotes, setModalNotes] = useState('');
  const [modalError, setModalError] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch / Refresh Budgets
  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.getExpenseBudgets(selectedMonth, selectedYear);
      if (res) {
        setBudgetsSummary(res);
      }
    } catch (err) {
      console.error('Failed to load expense budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedMonth, selectedYear]);

  // Sync if initial prop changes
  useEffect(() => {
    if (initialBudgetsSummary) {
      setBudgetsSummary(initialBudgetsSummary);
    }
  }, [initialBudgetsSummary]);

  const expenseAccounts = accounts.filter((a) => a.category === 'Expense');

  const formatCurrency = (val: number) => {
    return `৳${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const handleOpenCreateModal = (targetAccount?: Account | ExpenseBudgetSummary) => {
    setModalError('');
    if (targetAccount) {
      const accountId = 'accountId' in targetAccount ? targetAccount.accountId : targetAccount.id;
      setModalAccountId(accountId);
      const existing = budgetsSummary?.budgets.find((b) => b.accountId === accountId);
      if (existing) {
        setModalBudgetAmount(existing.monthlyBudget);
        setModalWarnThreshold(existing.warningThresholdPercent || 80);
        setModalCritThreshold(existing.criticalThresholdPercent || 100);
        setModalNotes(existing.notes || '');
      } else {
        const defaultBudget = 'balance' in targetAccount ? Math.round(targetAccount.balance * 1.1) : 1000000;
        setModalBudgetAmount(defaultBudget > 0 ? defaultBudget : 1000000);
        setModalWarnThreshold(80);
        setModalCritThreshold(100);
        setModalNotes('');
      }
    } else {
      const firstAcc = expenseAccounts[0];
      setModalAccountId(firstAcc?.id || '');
      const existing = budgetsSummary?.budgets.find((b) => b.accountId === firstAcc?.id);
      setModalBudgetAmount(existing ? existing.monthlyBudget : 2000000);
      setModalWarnThreshold(80);
      setModalCritThreshold(100);
      setModalNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAccountId) {
      setModalError('Please choose an expense account.');
      return;
    }
    if (!modalBudgetAmount || Number(modalBudgetAmount) <= 0) {
      setModalError('Please enter a valid monthly budget ceiling greater than 0.');
      return;
    }
    if (modalWarnThreshold >= modalCritThreshold) {
      setModalError('Warning threshold % must be lower than Critical threshold %.');
      return;
    }

    try {
      setSaving(true);
      setModalError('');
      await api.saveExpenseBudget({
        accountId: modalAccountId,
        monthlyBudget: Number(modalBudgetAmount),
        warningThresholdPercent: Number(modalWarnThreshold),
        criticalThresholdPercent: Number(modalCritThreshold),
        notes: modalNotes,
        month: selectedMonth,
        year: selectedYear,
      });

      setIsModalOpen(false);
      await fetchBudgets();
      if (onBudgetUpdated) {
        onBudgetUpdated();
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to save expense budget.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Budgets
  const allBudgets = budgetsSummary?.budgets || [];
  const filteredBudgets = allBudgets.filter((b) => {
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.accountName.toLowerCase().includes(q) ||
        b.accountCode.toLowerCase().includes(q) ||
        (b.subCategory && b.subCategory.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const totalBudgeted = budgetsSummary?.totalBudgeted || 0;
  const totalSpent = budgetsSummary?.totalSpent || 0;
  const exceededCount = budgetsSummary?.exceededCount || 0;
  const warningCount = budgetsSummary?.warningCount || 0;
  const normalCount = budgetsSummary?.normalCount || 0;
  const overallPercentageUsed = budgetsSummary?.overallPercentageUsed || 0;
  const netVariance = totalBudgeted - totalSpent;

  // Selected account for preview in modal
  const selectedAccountForModal = expenseAccounts.find((a) => a.id === modalAccountId);
  const selectedAccActual = selectedAccountForModal ? selectedAccountForModal.balance : 0;
  const previewPercentage =
    modalBudgetAmount && Number(modalBudgetAmount) > 0
      ? Number(((selectedAccActual / Number(modalBudgetAmount)) * 100).toFixed(1))
      : 0;

  return (
    <div className="space-y-6" id="expense-budget-manager">
      {/* Top Controls & Period Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Expense Account Budget Monitoring
            </h2>
            <span className="text-3xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300">
              GL Variance Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time tracking of general ledger debits against monthly operational budget ceilings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-3xs font-bold uppercase text-slate-500">Period:</span>
            <select
              value={`${selectedMonth}-${selectedYear}`}
              onChange={(e) => {
                const [m, y] = e.target.value.split('-').map(Number);
                setSelectedMonth(m);
                setSelectedYear(y);
              }}
              className="bg-transparent font-bold text-slate-900 dark:text-slate-100 focus:outline-none text-xs"
            >
              <option value="9-2026">September 2026 (Active Fiscal)</option>
              <option value="8-2026">August 2026</option>
              <option value="7-2026">July 2026</option>
              <option value="10-2026">October 2026</option>
            </select>
          </div>

          <button
            id="set-expense-budget-btn"
            onClick={() => handleOpenCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Set / Edit Budget</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Budget */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Budgeted
            </span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(totalBudgeted)}
            </h3>
            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
              Across {allBudgets.length} monitored expense heads
            </p>
          </div>
        </div>

        {/* Total Spend */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Actual GL Spend
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-white">
              {formatCurrency(totalSpent)}
            </h3>
            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
              {overallPercentageUsed}% of total budget ceiling consumed
            </p>
          </div>
        </div>

        {/* Variance */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Net Variance
            </span>
            <div
              className={`p-2 rounded-lg ${
                netVariance < 0
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {netVariance < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
          </div>
          <div className="mt-2">
            <h3
              className={`text-xl font-bold font-mono ${
                netVariance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {netVariance < 0 ? `-${formatCurrency(Math.abs(netVariance))}` : `+${formatCurrency(netVariance)}`}
            </h3>
            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
              {netVariance < 0 ? 'Budget Overrun / Deficit' : 'Unspent Allocation Remaining'}
            </p>
          </div>
        </div>

        {/* Alerts status count */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-3xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Threshold Alerts
            </span>
            <div
              className={`p-2 rounded-lg ${
                exceededCount > 0
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                {exceededCount} Exceeded
              </span>
              <span className="text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                • {warningCount} Warning
              </span>
            </div>
            <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
              {normalCount} accounts comfortably on-track
            </p>
          </div>
        </div>
      </div>

      {/* Critical Threshold Alert Banner if Any Account Exceeded */}
      {exceededCount > 0 && (
        <div
          id="budget-exceeded-alert-banner"
          className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/70 text-rose-700 dark:text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="font-bold text-rose-900 dark:text-rose-200">
                Monthly Budget Ceiling Breached ({exceededCount} Account{exceededCount > 1 ? 's' : ''})
              </h4>
              <p className="text-rose-700 dark:text-rose-300/90 text-2xs mt-0.5">
                The following expense accounts have exceeded their defined monthly limits:
                <strong className="ml-1">
                  {allBudgets
                    .filter((b) => b.status === 'Exceeded')
                    .map((b) => `${b.accountCode} (${b.percentageUsed}%)`)
                    .join(', ')}
                </strong>
                . Immediate CFO or management review is advised.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterStatus('Exceeded')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg text-2xs shrink-0 self-start sm:self-auto shadow-2xs"
          >
            Show Exceeded Only
          </button>
        </div>
      )}

      {/* Overall Budget Utilization Progress Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Overall Operating Expense Budget Consumption
            </span>
            <span className="text-3xs text-slate-500 ml-2">
              (৳{totalSpent.toLocaleString()} of ৳{totalBudgeted.toLocaleString()})
            </span>
          </div>
          <span
            className={`font-mono font-bold ${
              overallPercentageUsed > 100
                ? 'text-rose-600 dark:text-rose-400'
                : overallPercentageUsed >= 80
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {overallPercentageUsed}% Consumed
          </span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentageUsed > 100
                ? 'bg-rose-600'
                : overallPercentageUsed >= 80
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(overallPercentageUsed, 100)}%` }}
          />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Filter:</span>
          {(['ALL', 'Exceeded', 'Warning', 'Normal'] as const).map((status) => {
            const count =
              status === 'ALL'
                ? allBudgets.length
                : status === 'Exceeded'
                ? exceededCount
                : status === 'Warning'
                ? warningCount
                : normalCount;

            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-lg text-2xs font-semibold transition-colors shrink-0 ${
                  filterStatus === status
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {status === 'ALL' ? 'All Accounts' : status} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            placeholder="Search account code, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Expense Budgets List & Progress Bar Cards */}
      <div className="space-y-3">
        {filteredBudgets.length > 0 ? (
          filteredBudgets.map((b) => {
            const isExceeded = b.status === 'Exceeded';
            const isWarning = b.status === 'Warning';
            const fillWidth = Math.min(b.percentageUsed, 100);
            const overrun = b.actualSpent - b.monthlyBudget;

            return (
              <div
                key={b.id}
                id={`budget-row-${b.accountCode}`}
                className={`p-4 bg-white dark:bg-slate-900 rounded-xl border transition-all ${
                  isExceeded
                    ? 'border-rose-300 dark:border-rose-900/70 shadow-2xs'
                    : isWarning
                    ? 'border-amber-300 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Account Identification */}
                  <div className="flex items-start gap-3 min-w-[280px]">
                    <div
                      className={`p-2.5 rounded-lg shrink-0 ${
                        isExceeded
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                          : isWarning
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isExceeded ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isWarning ? (
                        <AlertOctagon className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-2xs font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                          {b.accountCode}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {b.accountName}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-3xs text-slate-500 dark:text-slate-400">
                        <span>{b.subCategory || 'Operating Expense'}</span>
                        <span>•</span>
                        <span>
                          Thresholds: Warn at {b.warningThresholdPercent || 80}%, Exceeded at {b.criticalThresholdPercent || 100}%
                        </span>
                      </div>
                      {b.notes && (
                        <p className="text-3xs text-slate-400 italic mt-0.5">
                          Note: {b.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Visual Threshold Indicator */}
                  <div className="flex-1 max-w-xl space-y-1.5">
                    <div className="flex items-center justify-between text-2xs">
                      <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
                        Budget Utilization
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold ${
                            isExceeded
                              ? 'text-rose-600 dark:text-rose-400'
                              : isWarning
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {b.percentageUsed}%
                        </span>
                        {isExceeded ? (
                          <span className="text-3xs font-extrabold px-1.5 py-0.5 rounded bg-rose-600 text-white">
                            EXCEEDED
                          </span>
                        ) : isWarning ? (
                          <span className="text-3xs font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                            WARNING
                          </span>
                        ) : (
                          <span className="text-3xs font-medium px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                            NORMAL
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      {/* 80% Warning marker */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10 opacity-75"
                        style={{ left: `${b.warningThresholdPercent || 80}%` }}
                        title={`Warning threshold: ${b.warningThresholdPercent || 80}%`}
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded
                            ? 'bg-rose-500 dark:bg-rose-600'
                            : isWarning
                            ? 'bg-amber-500 dark:bg-amber-500'
                            : 'bg-emerald-500 dark:bg-emerald-500'
                        }`}
                        style={{ width: `${fillWidth}%` }}
                      />
                    </div>

                    {isExceeded && (
                      <p className="text-3xs text-rose-600 dark:text-rose-400 font-mono font-semibold">
                        Overrun: +{formatCurrency(overrun)} ({(b.percentageUsed - 100).toFixed(1)}% over ceiling)
                      </p>
                    )}
                  </div>

                  {/* Financial Metrics */}
                  <div className="flex items-center justify-between md:justify-end gap-6 text-xs shrink-0 font-mono">
                    <div className="text-left md:text-right">
                      <span className="text-3xs uppercase tracking-wider text-slate-400 block">Spent / Budget</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(b.actualSpent)}
                      </span>
                      <span className="text-3xs text-slate-500 block">
                        of {formatCurrency(b.monthlyBudget)}
                      </span>
                    </div>

                    <div className="text-right min-w-[90px]">
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
                          ? `-${formatCurrency(Math.abs(b.remainingBudget))}`
                          : `+${formatCurrency(b.remainingBudget)}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenCreateModal(b)}
                      title="Adjust Budget"
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <p className="text-xs text-slate-500">No expense budgets match the current filter criteria.</p>
          </div>
        )}
      </div>

      {/* Unbudgeted Expense Accounts Callout */}
      {expenseAccounts.some((a) => !allBudgets.some((b) => b.accountId === a.id)) && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Some expense accounts in your Chart of Accounts do not have monthly budget ceilings configured yet.
            </span>
          </div>
          <button
            onClick={() => {
              const unbudgeted = expenseAccounts.find((a) => !allBudgets.some((b) => b.accountId === a.id));
              if (unbudgeted) handleOpenCreateModal(unbudgeted);
            }}
            className="text-2xs font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
          >
            Configure Remaining &rarr;
          </button>
        </div>
      )}

      {/* Modal: Define / Edit Expense Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Define Monthly Expense Budget
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveBudget} className="p-5 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Account Dropdown */}
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Expense Account (General Ledger)
                </label>
                <select
                  value={modalAccountId}
                  onChange={(e) => {
                    const accId = e.target.value;
                    setModalAccountId(accId);
                    const existing = allBudgets.find((b) => b.accountId === accId);
                    if (existing) {
                      setModalBudgetAmount(existing.monthlyBudget);
                      setModalWarnThreshold(existing.warningThresholdPercent || 80);
                      setModalCritThreshold(existing.criticalThresholdPercent || 100);
                      setModalNotes(existing.notes || '');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100"
                >
                  {expenseAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} - {a.name} ({a.subCategory}) [GL: ৳{a.balance.toLocaleString()}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly Budget Input */}
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Monthly Budget Allocation ({baseCurrency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">৳</span>
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    placeholder="e.g. 5000000"
                    value={modalBudgetAmount}
                    onChange={(e) => setModalBudgetAmount(e.target.value ? Number(e.target.value) : '')}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <p className="text-3xs text-slate-500 mt-1">
                  Current fiscal month spend on this ledger: ৳{selectedAccActual.toLocaleString()}
                </p>
              </div>

              {/* Threshold Sliders */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-3xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Warning Alert Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="150"
                    value={modalWarnThreshold}
                    onChange={(e) => setModalWarnThreshold(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-amber-700 dark:text-amber-400"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Alerts at {modalWarnThreshold}%</span>
                </div>
                <div>
                  <label className="block text-3xs font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                    Critical Ceiling Limit (%)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="200"
                    value={modalCritThreshold}
                    onChange={(e) => setModalCritThreshold(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-rose-700 dark:text-rose-400"
                  />
                  <span className="text-3xs text-slate-400 mt-0.5 block">Exceeded at {modalCritThreshold}%</span>
                </div>
              </div>

              {/* Dynamic Live Preview Card */}
              {modalBudgetAmount && Number(modalBudgetAmount) > 0 && (
                <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100/50 dark:bg-slate-800/60 space-y-1 text-2xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Live Impact Preview:</span>
                    <span
                      className={`font-bold ${
                        previewPercentage >= modalCritThreshold
                          ? 'text-rose-600'
                          : previewPercentage >= modalWarnThreshold
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {previewPercentage}% Utilized (
                      {previewPercentage >= modalCritThreshold
                        ? 'Exceeded'
                        : previewPercentage >= modalWarnThreshold
                        ? 'Warning'
                        : 'On Track'}
                      )
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        previewPercentage >= modalCritThreshold
                          ? 'bg-rose-500'
                          : previewPercentage >= modalWarnThreshold
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(previewPercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-2xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Budget Rationale / Operating Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Approved under Q3 Operating Plan by CFO"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-2xs"
                >
                  {saving ? 'Saving...' : 'Save & Enforce Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
