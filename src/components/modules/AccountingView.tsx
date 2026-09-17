import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Scale,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  DollarSign,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Account, JournalEntry } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';
import { CurrencyBar } from '../ui/CurrencyBar.js';
import {
  SUPPORTED_CURRENCIES,
  getStoredBaseCurrency,
  saveStoredBaseCurrency,
  convertCurrency,
  formatMultiCurrency,
  ExchangeRatesData,
} from '../../lib/currency.js';
import { ExpenseBudgetManager } from '../accounting/ExpenseBudgetManager.js';
import { SecureActionButton, AuditorReadonlyBanner } from '../ui/PermissionGate.js';

interface AccountingViewProps {
  accounts: Account[];
  journals: JournalEntry[];
  reports: any;
  budgets?: any;
  onRefreshBudgets?: () => void;
  onCreateJournal: (data: any) => Promise<void>;
  baseCurrency?: string;
  onBaseCurrencyChange?: (curr: string) => void;
  currentUser?: any;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  accounts,
  journals,
  reports,
  budgets,
  onRefreshBudgets,
  onCreateJournal,
  baseCurrency: propBaseCurrency,
  onBaseCurrencyChange: propOnBaseCurrencyChange,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'journals' | 'trialBalance' | 'aging' | 'budgets'>('accounts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Multi-Currency State
  const [baseCurrency, setBaseCurrency] = useState<string>(
    propBaseCurrency || getStoredBaseCurrency()
  );
  const [ratesData, setRatesData] = useState<ExchangeRatesData | null>(null);
  const [reportingCurrency, setReportingCurrency] = useState<string>(baseCurrency);
  const [journalCurrencyFilter, setJournalCurrencyFilter] = useState<string>('ALL');

  // Sync if prop updates
  useEffect(() => {
    if (propBaseCurrency && propBaseCurrency !== baseCurrency) {
      setBaseCurrency(propBaseCurrency);
      setReportingCurrency(propBaseCurrency);
    }
  }, [propBaseCurrency]);

  const handleBaseCurrencyChange = (newBase: string) => {
    setBaseCurrency(newBase);
    setReportingCurrency(newBase);
    saveStoredBaseCurrency(newBase);
    if (propOnBaseCurrencyChange) {
      propOnBaseCurrencyChange(newBase);
    }
  };

  // Journal Voucher Form State
  const [memo, setMemo] = useState('');
  const [reference, setReference] = useState('');
  const [transactionCurrency, setTransactionCurrency] = useState<string>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(121.5);
  const [lines, setLines] = useState([
    { accountId: accounts[0]?.id || '', debit: 10000, credit: 0, description: 'Debit leg' },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 10000, description: 'Credit leg' },
  ]);

  // Update exchange rate when transaction currency or base changes
  useEffect(() => {
    if (transactionCurrency === baseCurrency) {
      setExchangeRate(1.0);
    } else if (ratesData) {
      // Rates to base: 1 transactionCurrency = X baseCurrency
      const rate = ratesData.ratesToBase?.[transactionCurrency] ||
        (ratesData.rates?.[transactionCurrency] ? 1 / ratesData.rates[transactionCurrency] : 1.0);
      setExchangeRate(Number(rate.toFixed(4)));
    }
  }, [transactionCurrency, baseCurrency, ratesData]);

  // Conversion helper for reporting view
  const getReportingRate = (fromCurr: string) => {
    if (fromCurr === reportingCurrency) return 1;
    const { rate } = convertCurrency(1, fromCurr, reportingCurrency, ratesData);
    return rate;
  };

  const currentReportingRate = getReportingRate(baseCurrency);

  // Filtered Journals
  const filteredJournals = useMemo(() => {
    if (journalCurrencyFilter === 'ALL') return journals;
    return journals.filter((j) => (j.currency || 'BDT') === journalCurrencyFilter);
  }, [journals, journalCurrencyFilter]);

  // Accounts Columns with reporting currency conversion option
  const accountColumns: Column<Account>[] = [
    {
      key: 'code',
      header: 'Account Code',
      sortable: true,
      render: (a) => <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{a.code}</span>,
    },
    {
      key: 'name',
      header: 'Account Title',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100">{a.name}</span>
          <p className="text-3xs text-slate-400 dark:text-slate-500">{a.subCategory}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Classification',
      render: (a) => (
        <Badge
          variant={
            a.category === 'Asset'
              ? 'primary'
              : a.category === 'Liability'
              ? 'warning'
              : a.category === 'Equity'
              ? 'neutral'
              : a.category === 'Revenue'
              ? 'success'
              : 'danger'
          }
        >
          {a.category}
        </Badge>
      ),
    },
    {
      key: 'subCategory',
      header: 'Sub-Category',
      render: (a) => <span className="text-slate-600 dark:text-slate-400 text-xs">{a.subCategory}</span>,
    },
    {
      key: 'balance',
      header: `Account Balance (${reportingCurrency})`,
      align: 'right',
      sortable: true,
      render: (a) => {
        const converted = a.balance * currentReportingRate;
        return (
          <div className="text-right">
            <span
              className={`font-mono font-bold ${
                converted < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {formatMultiCurrency(converted, reportingCurrency)}
            </span>
            {reportingCurrency !== baseCurrency && (
              <p className="text-3xs font-mono text-slate-400">
                Base: {formatMultiCurrency(a.balance, baseCurrency)}
              </p>
            )}
          </div>
        );
      },
    },
  ];

  // Journals Columns with Multi-Currency presentation
  const journalColumns: Column<JournalEntry>[] = [
    {
      key: 'entryNumber',
      header: 'Voucher Number',
      sortable: true,
      render: (j) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-blue-700 dark:text-blue-400">{j.entryNumber}</span>
          {j.reference && (
            <span className="font-mono text-3xs text-slate-400 dark:text-slate-500">{j.reference}</span>
          )}
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Posting Date',
      sortable: true,
      render: (j) => <span className="font-mono text-2xs dark:text-slate-300">{formatDate(j.date)}</span>,
    },
    {
      key: 'memo',
      header: 'Transaction Memo & Multi-Currency Legs',
      render: (j) => {
        const curr = j.currency || 'BDT';
        return (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{j.memo}</p>
              {curr !== (j.baseCurrency || 'BDT') && (
                <span className="text-3xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  {curr}
                </span>
              )}
            </div>
            <div className="text-3xs text-slate-500 dark:text-slate-400 mt-1 space-y-0.5">
              {j.lines.map((l, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-1.5 font-mono">
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{l.accountCode}</span>
                  <span className="text-slate-400">{l.accountName}:</span>
                  <span className="font-medium text-slate-900 dark:text-slate-200">
                    {l.foreignDebit && l.foreignDebit > 0
                      ? `DR ${formatMultiCurrency(l.foreignDebit, curr)}`
                      : l.foreignCredit && l.foreignCredit > 0
                      ? `CR ${formatMultiCurrency(l.foreignCredit, curr)}`
                      : l.debit > 0
                      ? `DR ${formatMultiCurrency(l.debit, j.baseCurrency || 'BDT')}`
                      : `CR ${formatMultiCurrency(l.credit, j.baseCurrency || 'BDT')}`}
                  </span>
                  {curr !== (j.baseCurrency || 'BDT') && (
                    <span className="text-slate-400 text-3xs">
                      (≈ {j.baseCurrency || 'BDT'} {(l.debit > 0 ? l.debit : l.credit).toLocaleString()})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      },
    },
    {
      key: 'totalAmount',
      header: 'Amount (Transaction / Base)',
      align: 'right',
      sortable: true,
      render: (j) => {
        const curr = j.currency || 'BDT';
        const isForeign = curr !== (j.baseCurrency || 'BDT');
        const baseAmount = j.baseTotalDebit ?? (j.totalDebit * (j.exchangeRate || 1));

        return (
          <div className="text-right">
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
              {formatMultiCurrency(j.totalDebit, curr)}
            </span>
            {isForeign && (
              <p className="text-3xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Base: {formatMultiCurrency(baseAmount, j.baseCurrency || 'BDT')} (@ {j.exchangeRate})
              </p>
            )}
            <p className="text-3xs text-slate-400 dark:text-slate-500">{j.lines.length} Voucher Legs</p>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'GL Status',
      render: (j) => (
        <Badge variant={j.status === 'Posted' ? 'success' : 'warning'}>
          {j.status}
        </Badge>
      ),
    },
  ];

  // Journal Line Handlers
  const handleAddLine = () => {
    setLines([...lines, { accountId: accounts[0]?.id || '', debit: 0, credit: 0, description: '' }]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length > 2) {
      setLines(lines.filter((_, idx) => idx !== index));
    }
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;
    setLines(updated);
  };

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const baseTotalDebit = Number((totalDebit * exchangeRate).toFixed(2));
  const baseTotalCredit = Number((totalCredit * exchangeRate).toFixed(2));

  const handleJournalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Double-entry violation: Total Debits must equal Total Credits.');
      return;
    }
    try {
      setLoading(true);
      await onCreateJournal({
        memo,
        reference,
        currency: transactionCurrency,
        currencySymbol: SUPPORTED_CURRENCIES[transactionCurrency]?.symbol || transactionCurrency,
        exchangeRate: Number(exchangeRate),
        baseCurrency,
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: Number((Number(l.debit || 0) * exchangeRate).toFixed(2)),
          credit: Number((Number(l.credit || 0) * exchangeRate).toFixed(2)),
          foreignDebit: Number(l.debit) || 0,
          foreignCredit: Number(l.credit) || 0,
          description: l.description,
        })),
      });
      setIsModalOpen(false);
      setMemo('');
      setReference('');
    } catch (err: any) {
      alert(err.message || 'Error posting journal entry');
    } finally {
      setLoading(false);
    }
  };

  const trialBalance = reports?.trialBalance || [];
  const totalTrialDebit = trialBalance.reduce((sum: number, r: any) => sum + r.debit, 0);
  const totalTrialCredit = trialBalance.reduce((sum: number, r: any) => sum + r.credit, 0);

  return (
    <div className="space-y-6">
      {/* Read-Only Auditor Banner */}
      <AuditorReadonlyBanner currentUser={currentUser} entityName="General Ledger accounts, vouchers, and trial balances" />

      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Accounting & General Ledger
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            IFRS/GAAP Multi-Currency Chart of Accounts, atomic double-entry vouchers, and verified trial balances.
          </p>
        </div>

        <SecureActionButton
          id="new-journal-voucher-btn"
          action="accounting:create_journal"
          currentUser={currentUser}
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          className="w-full sm:w-auto"
        >
          <span>New Journal Voucher (JV)</span>
        </SecureActionButton>
      </div>

      {/* Multi-Currency & Live Exchange Rates Ticker Bar */}
      <CurrencyBar
        baseCurrency={baseCurrency}
        onBaseCurrencyChange={handleBaseCurrencyChange}
        onRatesLoaded={(rates) => setRatesData(rates)}
      />

      {/* Tabs & View Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-t-xl overflow-x-auto">
        <div className="flex items-center overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'accounts'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Chart of Accounts ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('journals')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'journals'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Journal Vouchers & GL ({journals.length})
          </button>
          <button
            onClick={() => setActiveTab('trialBalance')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'trialBalance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Audited Trial Balance
          </button>
          <button
            onClick={() => setActiveTab('aging')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
              activeTab === 'aging'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            AR / AP Aging Schedules
          </button>
          <button
            id="accounting-expense-budgets-tab"
            onClick={() => setActiveTab('budgets')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'budgets'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>Expense Budgets & Monitoring</span>
            {budgets?.exceededCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-extrabold bg-rose-600 text-white animate-pulse">
                {budgets.exceededCount} Exceeded
              </span>
            ) : budgets?.warningCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-amber-500 text-white">
                {budgets.warningCount} Warn
              </span>
            ) : null}
          </button>
        </div>

        {/* Currency Presentation Options for Accounts & Trial Balance */}
        {(activeTab === 'accounts' || activeTab === 'trialBalance') && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-3xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Display Currency:
            </span>
            <select
              value={reportingCurrency}
              onChange={(e) => setReportingCurrency(e.target.value)}
              className="text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-200"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
            {reportingCurrency !== baseCurrency && (
              <span className="text-3xs text-blue-600 dark:text-blue-400 font-mono">
                (@ {currentReportingRate.toFixed(4)})
              </span>
            )}
          </div>
        )}

        {/* Currency Filter for Journals */}
        {activeTab === 'journals' && (
          <div className="flex items-center gap-1.5 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
              Currency:
            </span>
            {['ALL', 'BDT', 'USD', 'EUR', 'GBP'].map((code) => (
              <button
                key={code}
                onClick={() => setJournalCurrencyFilter(code)}
                className={`px-2 py-0.5 rounded text-3xs font-bold font-mono transition-colors ${
                  journalCurrencyFilter === code
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeTab === 'accounts' && (
        <DataTable
          id="chart-of-accounts-table"
          data={accounts}
          columns={accountColumns}
          searchPlaceholder="Search account code, title or category..."
          exportFilename="apex-chart-of-accounts.csv"
        />
      )}

      {activeTab === 'journals' && (
        <DataTable
          id="journal-vouchers-table"
          data={filteredJournals}
          columns={journalColumns}
          searchPlaceholder="Search voucher memo or number..."
          exportFilename="apex-general-ledger-vouchers.csv"
        />
      )}

      {activeTab === 'trialBalance' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Audited Trial Balance Verification ({reportingCurrency})
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Period ending current operating cycle • Base Currency:{' '}
                <strong>{baseCurrency}</strong>
                {reportingCurrency !== baseCurrency && (
                  <span>
                    {' '}
                    • Converted to <strong>{reportingCurrency}</strong> @{' '}
                    {currentReportingRate.toFixed(4)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Balanced Ledger
              </span>
            </div>
          </div>

          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Debit Balance ({reportingCurrency})</th>
                <th className="py-3 px-4 text-right">Credit Balance ({reportingCurrency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trialBalance.map((r: any) => {
                const debitConverted = r.debit * currentReportingRate;
                const creditConverted = r.credit * currentReportingRate;
                return (
                  <tr key={r.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700 dark:text-blue-400">{r.code}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{r.name}</td>
                    <td className="py-2.5 px-4">
                      <Badge variant="neutral">{r.type}</Badge>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium">
                      {debitConverted > 0 ? formatMultiCurrency(debitConverted, reportingCurrency) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium">
                      {creditConverted > 0 ? formatMultiCurrency(creditConverted, reportingCurrency) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100/80 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                  Total Audited Columns:
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  {formatMultiCurrency(totalTrialDebit * currentReportingRate, reportingCurrency)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  {formatMultiCurrency(totalTrialCredit * currentReportingRate, reportingCurrency)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {activeTab === 'aging' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Accounts Receivable Aging (AR)
            </h3>
            <p className="text-2xs text-slate-500 mb-4">Outstanding customer receivables by aging bracket</p>
            <div className="space-y-3">
              {[
                { bucket: 'Current (0 - 30 days)', amount: 4930000, count: 1, color: 'bg-emerald-500' },
                { bucket: 'Past Due (31 - 60 days)', amount: 2400000, count: 1, color: 'bg-amber-500' },
                { bucket: 'Past Due (61 - 90 days)', amount: 850000, count: 1, color: 'bg-orange-500' },
                { bucket: 'Critical (> 90 days)', amount: 0, count: 0, color: 'bg-rose-500' },
              ].map((b) => (
                <div key={b.bucket} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${b.color}`} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{b.bucket}</span>
                    </div>
                    <span className="text-3xs text-slate-400">{b.count} invoices pending</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    {formatCurrency(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Accounts Payable Aging (AP)
            </h3>
            <p className="text-2xs text-slate-500 mb-4">Vendor liabilities and raw material trade credits</p>
            <div className="space-y-3">
              {[
                { bucket: 'Current (0 - 30 days)', amount: 1365625, count: 1, color: 'bg-emerald-500' },
                { bucket: 'Past Due (31 - 60 days)', amount: 500000, count: 1, color: 'bg-amber-500' },
                { bucket: 'Past Due (61 - 90 days)', amount: 0, count: 0, color: 'bg-orange-500' },
                { bucket: 'Critical (> 90 days)', amount: 0, count: 0, color: 'bg-rose-500' },
              ].map((b) => (
                <div key={b.bucket} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${b.color}`} />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{b.bucket}</span>
                    </div>
                    <span className="text-3xs text-slate-400">{b.count} bills due</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                    {formatCurrency(b.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'budgets' && (
        <ExpenseBudgetManager
          accounts={accounts}
          initialBudgetsSummary={budgets}
          baseCurrency={baseCurrency}
          onBudgetUpdated={onRefreshBudgets}
          currentUser={currentUser}
        />
      )}

      {/* Interactive Multi-Currency Journal Voucher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Multi-Currency Double-Entry Journal Voucher"
        subtitle="Enforces standard accounting identity with real-time foreign currency valuation"
        maxWidth="3xl"
      >
        <form onSubmit={handleJournalSubmit} className="space-y-4 text-xs">
          {/* Header row: Memo, Reference, Currency & FX Rate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Memo *</label>
              <input
                required
                type="text"
                placeholder="e.g. Inditex export payment realization or FX revaluation"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Document Reference Code</label>
              <input
                type="text"
                placeholder="e.g. DOC-REF-9921"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Multi-Currency Selection & Exchange Rate Box */}
          <div className="p-3 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  Transaction Currency:
                </span>
                <select
                  value={transactionCurrency}
                  onChange={(e) => setTransactionCurrency(e.target.value)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs text-slate-900 dark:text-white"
                >
                  {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} ({c.symbol}) — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-2xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  1 {transactionCurrency} =
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-right font-bold text-xs text-slate-900 dark:text-white"
                  />
                  <span className="font-bold font-mono text-xs text-slate-700 dark:text-slate-300">
                    {baseCurrency}
                  </span>
                </div>

                {transactionCurrency !== baseCurrency && (
                  <button
                    type="button"
                    onClick={() => {
                      if (ratesData) {
                        const r = ratesData.ratesToBase?.[transactionCurrency] ||
                          (ratesData.rates?.[transactionCurrency] ? 1 / ratesData.rates[transactionCurrency] : 1.0);
                        setExchangeRate(Number(r.toFixed(4)));
                      }
                    }}
                    title="Reset to live benchmark rate"
                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-3xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>
                Functional Base Currency: <strong>{baseCurrency} ({SUPPORTED_CURRENCIES[baseCurrency]?.symbol})</strong>
              </span>
              {transactionCurrency !== baseCurrency && (
                <span className="font-mono text-blue-700 dark:text-blue-400">
                  Valuation: All line items entered in {transactionCurrency} will be converted at rate {exchangeRate} to {baseCurrency} in GL
                </span>
              )}
            </div>
          </div>

          {/* Lines */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-2xs">
                Voucher Legs (Values in {transactionCurrency})
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add Leg
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {lines.map((line, idx) => {
                const lineDebitInBase = Number(((line.debit || 0) * exchangeRate).toFixed(2));
                const lineCreditInBase = Number(((line.credit || 0) * exchangeRate).toFixed(2));

                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg items-center"
                  >
                    <div className="sm:col-span-4">
                      <select
                        value={line.accountId}
                        onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} — {a.name} ({a.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Leg description"
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 sm:col-span-4 gap-2">
                      <div>
                        <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">
                          Debit ({transactionCurrency}):
                        </span>
                        <input
                          type="number"
                          step="any"
                          placeholder={`Debit (${transactionCurrency})`}
                          value={line.debit || ''}
                          onChange={(e) => {
                            handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0);
                            if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'credit', 0);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-right text-xs font-semibold text-blue-700 dark:text-blue-400"
                        />
                        {transactionCurrency !== baseCurrency && (line.debit || 0) > 0 && (
                          <span className="text-3xs font-mono text-slate-400 block text-right mt-0.5">
                            ≈ {SUPPORTED_CURRENCIES[baseCurrency]?.symbol}{lineDebitInBase.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">
                          Credit ({transactionCurrency}):
                        </span>
                        <input
                          type="number"
                          step="any"
                          placeholder={`Credit (${transactionCurrency})`}
                          value={line.credit || ''}
                          onChange={(e) => {
                            handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0);
                            if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'debit', 0);
                          }}
                          className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-right text-xs font-semibold text-emerald-700 dark:text-emerald-400"
                        />
                        {transactionCurrency !== baseCurrency && (line.credit || 0) > 0 && (
                          <span className="text-3xs font-mono text-slate-400 block text-right mt-0.5">
                            ≈ {SUPPORTED_CURRENCIES[baseCurrency]?.symbol}{lineCreditInBase.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Balance Indicator & Dual-Currency Summary */}
          <div
            className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
              isBalanced
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>
                {isBalanced
                  ? `Balanced in ${transactionCurrency}`
                  : `Unbalanced in ${transactionCurrency}`}
              </span>
            </div>
            <div className="flex flex-col sm:items-end gap-0.5 font-mono text-xs">
              <div className="flex gap-3">
                <span>Debits: {formatMultiCurrency(totalDebit, transactionCurrency)}</span>
                <span>Credits: {formatMultiCurrency(totalCredit, transactionCurrency)}</span>
              </div>
              {transactionCurrency !== baseCurrency && (
                <span className="text-3xs font-mono text-slate-500 dark:text-slate-400 font-normal">
                  Functional Equivalent: {formatMultiCurrency(baseTotalDebit, baseCurrency)} Base GL
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isBalanced || !memo}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Journal to General Ledger'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
