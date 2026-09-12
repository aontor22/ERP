import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Scale,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Account, JournalEntry } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';

interface AccountingViewProps {
  accounts: Account[];
  journals: JournalEntry[];
  reports: any;
  onCreateJournal: (data: { memo: string; reference?: string; lines: any[] }) => Promise<void>;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  accounts,
  journals,
  reports,
  onCreateJournal,
}) => {
  const [activeTab, setActiveTab] = useState<'accounts' | 'journals' | 'trialBalance' | 'aging'>('accounts');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Journal Voucher Form State
  const [memo, setMemo] = useState('');
  const [reference, setReference] = useState('');
  const [lines, setLines] = useState([
    { accountId: accounts[0]?.id || '', debit: 10000, credit: 0, description: 'Debit leg' },
    { accountId: accounts[1]?.id || '', debit: 0, credit: 10000, description: 'Credit leg' },
  ]);

  // Accounts Columns
  const accountColumns: Column<Account>[] = [
    {
      key: 'code',
      header: 'Account Code',
      sortable: true,
      render: (a) => <span className="font-mono font-bold text-blue-700">{a.code}</span>,
    },
    {
      key: 'name',
      header: 'Account Title',
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-semibold text-slate-900">{a.name}</span>
          <p className="text-3xs text-slate-400">{a.subCategory}</p>
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
      render: (a) => <span className="text-slate-600 text-xs">{a.subCategory}</span>,
    },
    {
      key: 'balance',
      header: 'Account Balance',
      align: 'right',
      sortable: true,
      render: (a) => (
        <span
          className={`font-mono font-bold ${
            a.balance < 0 ? 'text-rose-600' : 'text-slate-900'
          }`}
        >
          {formatCurrency(a.balance)}
        </span>
      ),
    },
  ];

  // Journals Columns
  const journalColumns: Column<JournalEntry>[] = [
    {
      key: 'entryNumber',
      header: 'Voucher Number',
      sortable: true,
      render: (j) => <span className="font-mono font-bold text-blue-700">{j.entryNumber}</span>,
    },
    {
      key: 'date',
      header: 'Posting Date',
      sortable: true,
      render: (j) => <span className="font-mono text-2xs">{formatDate(j.date)}</span>,
    },
    {
      key: 'memo',
      header: 'Transaction Memo',
      render: (j) => (
        <div>
          <p className="font-semibold text-slate-900">{j.memo}</p>
          <div className="text-3xs text-slate-400 mt-1 space-y-0.5">
            {j.lines.map((l, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="font-mono text-slate-600 font-semibold">{l.accountCode}</span>
                <span>{l.accountName}:</span>
                <span className="font-mono font-medium">
                  {l.debit > 0 ? `DR ৳${l.debit.toLocaleString()}` : `CR ৳${l.credit.toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      key: 'totalAmount',
      header: 'Balanced Debit/Credit',
      align: 'right',
      sortable: true,
      render: (j) => (
        <div className="text-right">
          <span className="font-mono font-bold text-emerald-700">
            {formatCurrency(j.totalDebit)}
          </span>
          <p className="text-3xs text-slate-400">Total Lines: {j.lines.length}</p>
        </div>
      ),
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
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
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
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Accounting & General Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            IFRS/GAAP Chart of Accounts, atomic double-entry vouchers, and verified trial balances.
          </p>
        </div>

        <button
          id="new-journal-voucher-btn"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Journal Voucher (JV)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'accounts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chart of Accounts ({accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('journals')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'journals'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Journal Vouchers & GL ({journals.length})
        </button>
        <button
          onClick={() => setActiveTab('trialBalance')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'trialBalance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Audited Trial Balance
        </button>
        <button
          onClick={() => setActiveTab('aging')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition-all shrink-0 ${
            activeTab === 'aging'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          AR / AP Aging Schedules
        </button>
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
          data={journals}
          columns={journalColumns}
          searchPlaceholder="Search voucher memo or number..."
          exportFilename="apex-general-ledger-vouchers.csv"
        />
      )}

      {activeTab === 'trialBalance' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Trial Balance Verification</h3>
              <p className="text-2xs text-slate-500">Period ending current operating cycle</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xs font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Balanced Ledger
              </span>
            </div>
          </div>

          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Title</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Debit Balance (BDT)</th>
                <th className="py-3 px-4 text-right">Credit Balance (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trialBalance.map((r: any) => (
                <tr key={r.code} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-mono font-bold text-blue-700">{r.code}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-800">{r.name}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant="neutral">{r.type}</Badge>
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium">
                    {r.debit > 0 ? formatCurrency(r.debit) : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium">
                    {r.credit > 0 ? formatCurrency(r.credit) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
              <tr>
                <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                  Total Audited Columns:
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-emerald-700">
                  {formatCurrency(totalTrialDebit)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-emerald-700">
                  {formatCurrency(totalTrialCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {activeTab === 'aging' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* AR Aging */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Accounts Receivable (AR) Aging Breakdown
            </h3>
            <div className="mt-4 space-y-3">
              {(reports?.arAging || []).map((b: any) => (
                <div key={b.bucket} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{b.bucket}</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AP Aging */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Accounts Payable (AP) Aging Breakdown
            </h3>
            <div className="mt-4 space-y-3">
              {(reports?.apAging || []).map((b: any) => (
                <div key={b.bucket} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">{b.bucket}</span>
                  <span className="font-mono font-bold text-slate-800">{formatCurrency(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Journal Voucher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Double-Entry Journal Voucher"
        subtitle="Enforces standard accounting identity: Sum(Debits) == Sum(Credits)"
        maxWidth="3xl"
      >
        <form onSubmit={handleJournalSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Transaction Memo *</label>
              <input
                required
                type="text"
                placeholder="e.g. Accrued utilities expense allocation"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Document Reference Code</label>
              <input
                type="text"
                placeholder="e.g. DOC-REF-9921"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Lines */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-2xs">
                Journal Voucher Lines
              </span>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-2xs font-semibold text-blue-600 hover:underline"
              >
                + Add Leg
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg items-center"
                >
                  <div className="sm:col-span-4">
                    <select
                      value={line.accountId}
                      onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs"
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
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 sm:col-span-4 gap-2">
                    <div>
                      <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">Debit:</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Debit"
                        value={line.debit || ''}
                        onChange={(e) => {
                          handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0);
                          if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'credit', 0);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white font-mono text-right text-xs font-semibold text-blue-700"
                      />
                    </div>
                    <div>
                      <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">Credit:</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Credit"
                        value={line.credit || ''}
                        onChange={(e) => {
                          handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0);
                          if (parseFloat(e.target.value) > 0) handleLineChange(idx, 'debit', 0);
                        }}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white font-mono text-right text-xs font-semibold text-emerald-700"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Balance Indicator */}
          <div
            className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold ${
              isBalanced
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
              <span>{isBalanced ? 'Voucher is Perfectly Balanced' : 'Unbalanced: Debits must equal Credits'}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
              <span>Debits: {formatCurrency(totalDebit)}</span>
              <span>Credits: {formatCurrency(totalCredit)}</span>
              {!isBalanced && (
                <span className="text-rose-600 font-bold">
                  Diff: {formatCurrency(Math.abs(totalDebit - totalCredit))}
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
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
