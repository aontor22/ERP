import React, { useState } from 'react';
import { Users, Plus, Play, CheckCircle2, DollarSign, Calendar, FileText } from 'lucide-react';
import { Employee, PayrollRun } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';

interface HRPayrollViewProps {
  employees: Employee[];
  payrollRuns: PayrollRun[];
  onGeneratePayroll: (data: { periodName: string; month: number; year: number }) => Promise<void>;
}

export const HRPayrollView: React.FC<HRPayrollViewProps> = ({
  employees,
  payrollRuns,
  onGeneratePayroll,
}) => {
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [periodName, setPeriodName] = useState('April 2026 Regular Payroll');
  const [month, setMonth] = useState(4);
  const [year, setYear] = useState(2026);
  const [loading, setLoading] = useState(false);

  // Employee Columns
  const employeeColumns: Column<Employee>[] = [
    {
      key: 'employeeCode',
      header: 'Staff ID & Name',
      sortable: true,
      render: (e) => (
        <div>
          <span className="font-mono font-bold text-blue-700">{e.employeeCode}</span>
          <p className="font-semibold text-slate-900">{e.firstName} {e.lastName}</p>
          <p className="text-3xs text-slate-400">{e.email}</p>
        </div>
      ),
    },
    {
      key: 'designation',
      header: 'Designation & Dept',
      sortable: true,
      render: (e) => (
        <div>
          <span className="font-medium text-slate-800">{e.designation}</span>
          <p className="text-3xs text-slate-400">{e.departmentName}</p>
        </div>
      ),
    },
    {
      key: 'joiningDate',
      header: 'Joining Date',
      render: (e) => <span className="font-mono text-2xs">{formatDate(e.joiningDate)}</span>,
    },
    {
      key: 'baseSalary',
      header: 'Basic Salary',
      align: 'right',
      sortable: true,
      render: (e) => <span className="font-mono">{formatCurrency(e.salaryBasic)}</span>,
    },
    {
      key: 'grossSalary',
      header: 'Gross Compensation',
      align: 'right',
      sortable: true,
      render: (e) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(e.salaryTotalGross)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Employment Status',
      render: (e) => <Badge variant={e.status === 'Active' ? 'success' : 'neutral'}>{e.status}</Badge>,
    },
  ];

  // Payroll Run Columns
  const payrollColumns: Column<PayrollRun>[] = [
    {
      key: 'periodName',
      header: 'Payroll Period',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-bold text-slate-900">{p.periodName}</p>
          <p className="text-3xs font-mono text-slate-400">{p.month}/{p.year}</p>
        </div>
      ),
    },
    {
      key: 'employeeCount',
      header: 'Headcount',
      align: 'center',
      render: (p) => <span className="font-semibold text-slate-800">{p.employeeCount} Staff</span>,
    },
    {
      key: 'totalGross',
      header: 'Total Gross Pay',
      align: 'right',
      render: (p) => <span className="font-mono">{formatCurrency(p.totalGross)}</span>,
    },
    {
      key: 'totalTaxDeductions',
      header: 'Tax / PF Withheld',
      align: 'right',
      render: (p) => (
        <span className="font-mono text-rose-600">
          -{formatCurrency(p.totalTaxDeductions + (p.totalProvidentFund || 0))}
        </span>
      ),
    },
    {
      key: 'totalNetPayable',
      header: 'Disbursed Net Pay',
      align: 'right',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-emerald-700">
          {formatCurrency(p.totalNetPayable)}
        </span>
      ),
    },
    {
      key: 'journalEntryId',
      header: 'GL Voucher',
      render: (p) => (
        <Badge variant="primary">{p.journalEntryId || 'Posted'}</Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => <Badge variant="success">{p.status}</Badge>,
    },
  ];

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onGeneratePayroll({ periodName, month, year });
      setIsPayrollModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error generating payroll');
    } finally {
      setLoading(false);
    }
  };

  const totalMonthlyPayroll = employees.reduce(
    (sum, e) => sum + (e.salaryTotalGross || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            HR & Enterprise Payroll Processing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Employee registry, salary structures, statutory tax deductions, and automated payroll GL vouchers.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="text-left sm:text-right px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex-1 sm:flex-initial">
            <span className="text-3xs uppercase font-bold text-blue-700">Monthly Gross Run</span>
            <p className="text-sm font-bold text-blue-900 font-mono">
              {formatCurrency(totalMonthlyPayroll)}
            </p>
          </div>
          <button
            onClick={() => setIsPayrollModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs w-full sm:w-auto"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Process Payroll Run</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'employees'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Employee Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'payroll'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Executed Payroll Cycles ({payrollRuns.length})
        </button>
      </div>

      {activeTab === 'employees' ? (
        <DataTable
          id="hr-employees-table"
          data={employees}
          columns={employeeColumns}
          searchPlaceholder="Search staff ID, name, or designation..."
          exportFilename="apex-employee-roster.csv"
        />
      ) : (
        <DataTable
          id="hr-payroll-table"
          data={payrollRuns}
          columns={payrollColumns}
          searchPlaceholder="Search payroll periods..."
          exportFilename="apex-payroll-runs.csv"
        />
      )}

      {/* Execute Payroll Modal */}
      <Modal
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
        title="Execute Enterprise Payroll Cycle"
        subtitle="Computes base salaries, house rent, medical allowances, tax withholdings, and generates GL journal entry"
      >
        <form onSubmit={handlePayrollSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Payroll Period Title *</label>
            <input
              required
              type="text"
              value={periodName}
              onChange={(e) => setPeriodName(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fiscal Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value={1}>January</option>
                <option value={2}>February</option>
                <option value={3}>March</option>
                <option value={4}>April</option>
                <option value={5}>May</option>
                <option value={6}>June</option>
                <option value={7}>July</option>
                <option value={8}>August</option>
                <option value={9}>September</option>
                <option value={10}>October</option>
                <option value={11}>November</option>
                <option value={12}>December</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fiscal Year</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Active Staff Headcount:</span>
              <span className="font-bold text-slate-800">{employees.length} Employees</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Estimated Total Gross:</span>
              <span className="font-mono font-bold text-slate-900">{formatCurrency(totalMonthlyPayroll)}</span>
            </div>
            <div className="flex justify-between text-2xs text-slate-500">
              <span>Automatic Double-Entry Allocation:</span>
              <span>Debit 5000 (Salaries) / Credit 1010 (Bank)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPayrollModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing Disbursal...' : 'Disburse Payroll & Post Journal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
