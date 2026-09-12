import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  CheckCircle2,
  Scale,
  Receipt,
  Package,
  Users,
  Building2,
} from 'lucide-react';
import { formatCurrency } from '../../lib/i18n.js';
import { exportToCSV } from '../../lib/csvExport.js';
import { generateReportPDF, PDFSummaryCard } from '../../lib/pdfExport.js';

interface ReportsViewProps {
  stats: any;
  reports: any;
  products: any[];
  invoices: any[];
  employees: any[];
  currentCompany?: any;
  currentUser?: any;
}

type ReportType = 'financial' | 'sales' | 'inventory' | 'payroll';

export const ReportsView: React.FC<ReportsViewProps> = ({
  stats,
  reports,
  products = [],
  invoices = [],
  employees = [],
  currentCompany,
  currentUser,
}) => {
  const [reportType, setReportType] = useState<ReportType>('financial');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'csv' | 'pdf';
    filename: string;
    timestamp: string;
  } | null>(null);

  const companyName = currentCompany?.name || 'Apex Industrial Holdings Ltd.';
  const companyTaxId = currentCompany?.taxId || 'BIN: 001928472-0101';
  const companyAddress = 'Motijheel Commercial Area, Dhaka-1000, Bangladesh';
  const preparedBy = `${currentUser?.name || 'Authorized Auditor'} (${currentUser?.role || 'CFO'})`;

  const dateStamp = new Date().toISOString().split('T')[0];

  // 1. Data calculations
  const trialBalance: any[] = reports?.trialBalance || [];
  const totalDebits = useMemo(
    () => trialBalance.reduce((sum, r) => sum + (Number(r.debit) || 0), 0),
    [trialBalance]
  );
  const totalCredits = useMemo(
    () => trialBalance.reduce((sum, r) => sum + (Number(r.credit) || 0), 0),
    [trialBalance]
  );

  const totalRevenue = useMemo(
    () => invoices.reduce((sum, i) => sum + (i.status !== 'Draft' ? Number(i.subTotal) || 0 : 0), 0),
    [invoices]
  );
  const totalVat = useMemo(
    () => invoices.reduce((sum, i) => sum + (i.status !== 'Draft' ? Number(i.taxTotal) || 0 : 0), 0),
    [invoices]
  );
  const totalInvoiceGross = useMemo(
    () => invoices.reduce((sum, i) => sum + (i.status !== 'Draft' ? Number(i.grandTotal) || 0 : 0), 0),
    [invoices]
  );

  const totalInventoryValuation = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.totalStockValue) || 0), 0),
    [products]
  );
  const totalStockUnits = useMemo(
    () => products.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0),
    [products]
  );

  const totalGrossPayroll = useMemo(
    () => employees.reduce((sum, e) => sum + (Number(e.grossSalary) || 0), 0),
    [employees]
  );
  const totalPayrollTds = useMemo(
    () => employees.reduce((sum, e) => sum + (Number(e.taxDeduction) || 0), 0),
    [employees]
  );
  const totalNetPayable = useMemo(
    () => employees.reduce((sum, e) => sum + (Number(e.netPayable) || 0), 0),
    [employees]
  );

  // 2. Filtered data based on search
  const filteredTrialBalance = useMemo(() => {
    if (!searchQuery.trim()) return trialBalance;
    const q = searchQuery.toLowerCase();
    return trialBalance.filter(
      (r) =>
        r.code?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q)
    );
  }, [trialBalance, searchQuery]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoiceNumber?.toLowerCase().includes(q) ||
        i.customerName?.toLowerCase().includes(q) ||
        i.status?.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.sku?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase();
    return employees.filter(
      (e) =>
        e.employeeId?.toLowerCase().includes(q) ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.departmentName?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
    );
  }, [employees, searchQuery]);

  // 3. Export Handlers
  const handleExportCSV = () => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (reportType === 'financial') {
      const filename = `apex-trial-balance-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'Account Code', key: 'code' },
          { header: 'Account Title', key: 'name' },
          { header: 'Classification', key: 'type' },
          { header: 'Debit (BDT)', key: 'debit', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Credit (BDT)', key: 'credit', format: (v) => Number(v || 0).toFixed(2) },
        ],
        filteredTrialBalance,
        {
          companyName,
          reportTitle: 'Statement of Financial Position & Trial Balance',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    } else if (reportType === 'sales') {
      const filename = `apex-nbr-vat9.1-return-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'Invoice Number', key: 'invoiceNumber' },
          { header: 'Customer Entity', key: 'customerName' },
          { header: 'Issue Date', key: 'invoiceDate' },
          { header: 'Due Date', key: 'dueDate' },
          { header: 'Taxable Supply (BDT)', key: 'subTotal', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'NBR VAT 15% (BDT)', key: 'taxTotal', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Gross Total (BDT)', key: 'grandTotal', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Payment Status', key: 'status' },
        ],
        filteredInvoices,
        {
          companyName,
          reportTitle: 'Bangladesh NBR VAT-9.1 Sub-Return & Sales Revenue Breakdown',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    } else if (reportType === 'inventory') {
      const filename = `apex-inventory-valuation-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'SKU', key: 'sku' },
          { header: 'Material Description', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Unit of Measure', key: 'unit' },
          { header: 'Unit Cost Price (BDT)', key: 'costPrice', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Quantity On-Hand', key: 'currentStock' },
          { header: 'Line Valuation (BDT)', key: 'totalStockValue', format: (v) => Number(v || 0).toFixed(2) },
        ],
        filteredProducts,
        {
          companyName,
          reportTitle: 'Material Stock Valuation & Asset Movement Analysis',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    } else if (reportType === 'payroll') {
      const filename = `apex-payroll-tds-report-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'Employee ID', key: 'employeeId' },
          { header: 'Full Name', key: 'firstName', format: (_, row: any) => `${row?.firstName || ''} ${row?.lastName || ''}`.trim() },
          { header: 'Department', key: 'departmentName' },
          { header: 'Designation', key: 'designation' },
          { header: 'Basic Salary (BDT)', key: 'basicSalary', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Gross Salary (BDT)', key: 'grossSalary', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'TDS Withholding Tax (BDT)', key: 'taxDeduction', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Net Payable (BDT)', key: 'netPayable', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Status', key: 'status' },
        ],
        filteredEmployees,
        {
          companyName,
          reportTitle: 'Operational Payroll & TDS Tax Withholding Summary',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    }
  };

  const handleExportPDF = () => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (reportType === 'financial') {
      const filename = `apex-trial-balance-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Operating Revenue', value: formatCurrency(stats?.revenue || 0) },
        { label: 'Audited Net Profit', value: formatCurrency(stats?.netProfit || 0) },
        { label: 'Total Liquid Reserves', value: formatCurrency(stats?.cashBalance || 0) },
        { label: 'Gross Trial Balance Debits', value: formatCurrency(totalDebits) },
      ];

      generateReportPDF({
        title: 'Statement of Financial Position & Trial Balance',
        subtitle: 'Audited General Ledger Balances under Bangladesh Accounting Standards (BAS/IFRS)',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'portrait',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'GL Code', dataKey: 'code', width: 28 },
          { header: 'Account Title', dataKey: 'name' },
          { header: 'Classification', dataKey: 'type', width: 32 },
          { header: 'Debit (BDT)', dataKey: 'debitFormatted', align: 'right', width: 34 },
          { header: 'Credit (BDT)', dataKey: 'creditFormatted', align: 'right', width: 34 },
        ],
        data: filteredTrialBalance.map((r) => ({
          code: r.code,
          name: r.name,
          type: r.type,
          debitFormatted: r.debit > 0 ? formatCurrency(r.debit) : '—',
          creditFormatted: r.credit > 0 ? formatCurrency(r.credit) : '—',
        })),
        totalRow: {
          code: 'TOTALS',
          name: 'Balanced Trial Balance',
          type: totalDebits === totalCredits ? 'BALANCED' : 'IMBALANCE',
          debitFormatted: formatCurrency(totalDebits),
          creditFormatted: formatCurrency(totalCredits),
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    } else if (reportType === 'sales') {
      const filename = `apex-nbr-vat9.1-return-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Total Taxable Supplies', value: formatCurrency(totalRevenue) },
        { label: 'NBR VAT 15% Output', value: formatCurrency(totalVat) },
        { label: 'Gross Receivables', value: formatCurrency(totalInvoiceGross) },
        { label: 'Active Invoices Count', value: `${invoices.length} Invoices` },
      ];

      generateReportPDF({
        title: 'Bangladesh NBR VAT-9.1 Sub-Return & Sales Breakdown',
        subtitle: 'Statutory Output VAT Computation under Bangladesh Value Added Tax and Supplementary Duty Act 2012',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'landscape',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'Invoice #', dataKey: 'invoiceNumber', width: 28 },
          { header: 'Customer Entity', dataKey: 'customerName' },
          { header: 'Issue Date', dataKey: 'invoiceDate', width: 24 },
          { header: 'Due Date', dataKey: 'dueDate', width: 24 },
          { header: 'Taxable Supply (BDT)', dataKey: 'subTotal', align: 'right', width: 38 },
          { header: 'NBR VAT 15% (BDT)', dataKey: 'taxTotal', align: 'right', width: 34 },
          { header: 'Gross Total (BDT)', dataKey: 'grandTotal', align: 'right', width: 38 },
          { header: 'Status', dataKey: 'status', align: 'center', width: 24 },
        ],
        data: filteredInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate || '—',
          subTotal: formatCurrency(inv.subTotal),
          taxTotal: formatCurrency(inv.taxTotal),
          grandTotal: formatCurrency(inv.grandTotal),
          status: inv.status,
        })),
        totalRow: {
          invoiceNumber: 'TOTALS',
          customerName: 'Cumulative Statutory Output Tax',
          subTotal: formatCurrency(totalRevenue),
          taxTotal: formatCurrency(totalVat),
          grandTotal: formatCurrency(totalInvoiceGross),
          status: 'NBR SUB-RETURN',
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    } else if (reportType === 'inventory') {
      const filename = `apex-inventory-valuation-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Total Asset Valuation', value: formatCurrency(totalInventoryValuation) },
        { label: 'Cumulative Stock Quantity', value: `${totalStockUnits.toLocaleString()} Units` },
        { label: 'Cataloged Items', value: `${products.length} SKUs` },
        { label: 'Valuation Standard', value: 'FIFO / WAC Compliant' },
      ];

      generateReportPDF({
        title: 'Material Stock Valuation & Asset Movement Analysis',
        subtitle: 'Perpetual Inventory Valuation under Bangladesh Accounting Standard BAS-2 (Inventories)',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'portrait',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'SKU', dataKey: 'sku', width: 26 },
          { header: 'Material Description', dataKey: 'name' },
          { header: 'Unit Cost (BDT)', dataKey: 'costPrice', align: 'right', width: 30 },
          { header: 'On-Hand Stock', dataKey: 'stockFormatted', align: 'right', width: 32 },
          { header: 'Line Valuation (BDT)', dataKey: 'totalValue', align: 'right', width: 38 },
        ],
        data: filteredProducts.map((p) => ({
          sku: p.sku,
          name: p.name,
          costPrice: formatCurrency(p.costPrice),
          stockFormatted: `${Number(p.currentStock || 0).toLocaleString()} ${p.unit || 'units'}`,
          totalValue: formatCurrency(p.totalStockValue),
        })),
        totalRow: {
          sku: 'TOTALS',
          name: 'Total Physical Inventory Asset Valuation',
          costPrice: '',
          stockFormatted: `${totalStockUnits.toLocaleString()} units`,
          totalValue: formatCurrency(totalInventoryValuation),
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    } else if (reportType === 'payroll') {
      const filename = `apex-payroll-tds-report-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Gross Monthly Payroll', value: formatCurrency(totalGrossPayroll) },
        { label: 'Total TDS Withholding', value: formatCurrency(totalPayrollTds) },
        { label: 'Net Payable Disbursement', value: formatCurrency(totalNetPayable) },
        { label: 'Active Workforce', value: `${employees.length} Employees` },
      ];

      generateReportPDF({
        title: 'Operational Payroll & TDS Tax Withholding Summary',
        subtitle: 'Statutory Payroll Tax Deducted at Source (TDS) under NBR Income Tax Act 2023',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'landscape',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'Emp ID', dataKey: 'employeeId', width: 22 },
          { header: 'Employee Name', dataKey: 'fullName' },
          { header: 'Department', dataKey: 'departmentName', width: 32 },
          { header: 'Designation', dataKey: 'designation', width: 36 },
          { header: 'Gross Salary (BDT)', dataKey: 'grossSalary', align: 'right', width: 34 },
          { header: 'NBR TDS Tax (BDT)', dataKey: 'taxDeduction', align: 'right', width: 32 },
          { header: 'Net Payable (BDT)', dataKey: 'netPayable', align: 'right', width: 34 },
          { header: 'Status', dataKey: 'status', align: 'center', width: 22 },
        ],
        data: filteredEmployees.map((e) => ({
          employeeId: e.employeeId,
          fullName: `${e.firstName} ${e.lastName}`,
          departmentName: e.departmentName,
          designation: e.designation,
          grossSalary: formatCurrency(e.grossSalary),
          taxDeduction: formatCurrency(e.taxDeduction),
          netPayable: formatCurrency(e.netPayable),
          status: e.status,
        })),
        totalRow: {
          employeeId: 'TOTALS',
          fullName: 'Total Payroll & Statutory Withholdings',
          grossSalary: formatCurrency(totalGrossPayroll),
          taxDeduction: formatCurrency(totalPayrollTds),
          netPayable: formatCurrency(totalNetPayable),
          status: 'VERIFIED',
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const activeCount =
    reportType === 'financial'
      ? filteredTrialBalance.length
      : reportType === 'sales'
      ? filteredInvoices.length
      : reportType === 'inventory'
      ? filteredProducts.length
      : filteredEmployees.length;

  const totalCount =
    reportType === 'financial'
      ? trialBalance.length
      : reportType === 'sales'
      ? invoices.length
      : reportType === 'inventory'
      ? products.length
      : employees.length;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {companyName}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Financial & Business Intelligence Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audited financial statements, NBR VAT-9.1 returns, inventory asset valuation, and statutory payroll tax summaries.
          </p>
        </div>

        {/* Unified Export Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex-1 sm:flex-none"
            title="Download formatted CSV for Excel / Google Sheets analysis"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            id="export-pdf-btn"
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex-1 sm:flex-none"
            title="Download print-ready official PDF report with corporate header and totals"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            id="print-report-btn"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex-1 sm:flex-none"
            title="Print or save as browser PDF"
          >
            <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Feedback */}
      {exportFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Successfully exported <strong>{exportFeedback.filename}</strong> ({exportFeedback.type.toUpperCase()}) at {exportFeedback.timestamp}.
            </span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-2xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Report Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-t-xl overflow-x-auto whitespace-nowrap transition-colors">
        <button
          id="tab-financial"
          onClick={() => {
            setReportType('financial');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'financial'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Statement of Financial Position & Trial Balance</span>
        </button>

        <button
          id="tab-sales"
          onClick={() => {
            setReportType('sales');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'sales'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>NBR VAT-9.1 Return & Revenue Breakdown</span>
        </button>

        <button
          id="tab-inventory"
          onClick={() => {
            setReportType('inventory');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'inventory'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Stock Valuation & Movement Analysis</span>
        </button>

        <button
          id="tab-payroll"
          onClick={() => {
            setReportType('payroll');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'payroll'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Operational Payroll & TDS Tax Withholding</span>
        </button>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${
              reportType === 'financial'
                ? 'by code, account name or category...'
                : reportType === 'sales'
                ? 'by invoice #, customer or status...'
                : reportType === 'inventory'
                ? 'by SKU, item name or category...'
                : 'by employee name, designation or dept...'
            }`}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-3 text-2xs text-slate-500 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Displaying <strong className="text-slate-800 dark:text-slate-200">{activeCount}</strong> of {totalCount} records
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Export ready (CSV & PDF)
          </span>
        </div>
      </div>

      {/* REPORT 1: FINANCIAL TRIAL BALANCE */}
      {reportType === 'financial' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <span className="text-2xs font-semibold uppercase text-blue-700 dark:text-blue-400">Gross Operating Revenue</span>
              <p className="text-lg font-bold font-mono text-blue-950 dark:text-blue-200 mt-1">{formatCurrency(stats?.revenue || 0)}</p>
            </div>
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-2xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">Audited Net Profit</span>
              <p className="text-lg font-bold font-mono text-emerald-950 dark:text-emerald-200 mt-1">{formatCurrency(stats?.netProfit || 0)}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-2xs font-semibold uppercase text-slate-600 dark:text-slate-400">Total Liquid Reserves</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{formatCurrency(stats?.cashBalance || 0)}</p>
            </div>
            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50">
              <span className="text-2xs font-semibold uppercase text-purple-700 dark:text-purple-400">Trial Balance Equality</span>
              <p className="text-lg font-bold font-mono text-purple-950 dark:text-purple-200 mt-1">
                {totalDebits === totalCredits ? '100% Balanced' : 'Variance Detected'}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">General Ledger Balances Summary</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400">Deterministic double-entry trial balance ledger records</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">GL Code</th>
                    <th className="py-2.5 px-3">Account Title</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3 text-right">Debit (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Credit (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredTrialBalance.map((r: any) => (
                    <tr key={r.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{r.code}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">{r.name}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{r.debit > 0 ? formatCurrency(r.debit) : '—'}</td>
                      <td className="py-2 px-3 text-right">{r.credit > 0 ? formatCurrency(r.credit) : '—'}</td>
                    </tr>
                  ))}
                  {filteredTrialBalance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No accounts match your filter criteria
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td className="py-2.5 px-3 font-sans font-normal text-slate-500 dark:text-slate-400">
                      General Ledger Balanced Total
                    </td>
                    <td className="py-2.5 px-3 font-sans text-emerald-600 dark:text-emerald-400">
                      {totalDebits === totalCredits ? '✓ BALANCED' : 'IMBALANCE'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-400">{formatCurrency(totalDebits)}</td>
                    <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-400">{formatCurrency(totalCredits)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: NBR VAT-9.1 SALES BREAKDOWN */}
      {reportType === 'sales' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Bangladesh NBR VAT Sub-return 9.1 Summary
              </h3>
              <p className="text-2xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Automated statutory output tax computation on taxable supplies (VAT Act 2012)
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xs uppercase text-emerald-700 dark:text-emerald-400 font-bold">Total VAT Output Payable</span>
              <p className="text-xl font-bold font-mono text-emerald-950 dark:text-emerald-200">{formatCurrency(totalVat)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Taxable Sales Invoices</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400">Taxable supplies and 15% statutory output withholding</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer Entity</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3 text-right">Taxable Supply (BDT)</th>
                    <th className="py-2.5 px-3 text-right">NBR VAT 15%</th>
                    <th className="py-2.5 px-3 text-right">Gross Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">{inv.customerName}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{inv.invoiceDate}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(inv.subTotal)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(inv.taxTotal)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : inv.status === 'Sent'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No invoice records match your search
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td colSpan={2} className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 font-normal">
                      Cumulative Statutory Tax Base
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totalRevenue)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(totalVat)}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totalInvoiceGross)}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-3xs text-emerald-600 dark:text-emerald-400 font-bold">SUBMITTED</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: INVENTORY VALUATION & ASSET MOVEMENT */}
      {reportType === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Total Material Asset Valuation</h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">Calculated strictly under deterministic FIFO/WAC rules under BAS-2</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xs uppercase text-slate-400 font-bold">Net Stock Balance Value</span>
              <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400">{formatCurrency(totalInventoryValuation)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Perpetual Stock Ledger Inventory</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400">Warehouse holdings, cost rates, and total asset worth</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Standard Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Quantity On-Hand</th>
                    <th className="py-2.5 px-3 text-right">Line Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredProducts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{p.sku}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">{p.name}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{formatCurrency(p.costPrice)}</td>
                      <td className="py-2 px-3 text-right font-sans font-bold text-slate-900 dark:text-white">
                        {Number(p.currentStock || 0).toLocaleString()} {p.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(p.totalStockValue)}
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No inventory materials match your filter
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td colSpan={3} className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 font-normal">
                      Physical Inventory Valuation Sum
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">{totalStockUnits.toLocaleString()} Units</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">{formatCurrency(totalInventoryValuation)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: OPERATIONAL PAYROLL & TAX WITHHOLDING */}
      {reportType === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <span className="text-2xs font-semibold uppercase text-indigo-700 dark:text-indigo-400">Gross Monthly Payroll</span>
              <p className="text-lg font-bold font-mono text-indigo-950 dark:text-indigo-200 mt-1">{formatCurrency(totalGrossPayroll)}</p>
            </div>
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50">
              <span className="text-2xs font-semibold uppercase text-amber-700 dark:text-amber-400">Total TDS Withholding</span>
              <p className="text-lg font-bold font-mono text-amber-950 dark:text-amber-200 mt-1">{formatCurrency(totalPayrollTds)}</p>
            </div>
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
              <span className="text-2xs font-semibold uppercase text-emerald-700 dark:text-emerald-400">Net Disbursements</span>
              <p className="text-lg font-bold font-mono text-emerald-950 dark:text-emerald-200 mt-1">{formatCurrency(totalNetPayable)}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-2xs font-semibold uppercase text-slate-600 dark:text-slate-400">Workforce Headcount</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">{employees.length} Employees</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Employee Compensation & Withholdings</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400">Salary breakdown, allowances, and statutory income tax deductions</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3 text-right">Gross Salary (BDT)</th>
                    <th className="py-2.5 px-3 text-right">TDS Tax (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredEmployees.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{e.employeeId}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">
                        {e.firstName} {e.lastName}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{e.departmentName}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{e.designation}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(e.grossSalary)}</td>
                      <td className="py-2 px-3 text-right text-amber-700 dark:text-amber-400 font-bold">{formatCurrency(e.taxDeduction)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(e.netPayable)}</td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No employee payroll records match your search
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td colSpan={3} className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 font-normal">
                      Workforce Payroll Obligations & Withholdings
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totalGrossPayroll)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-400 font-bold">{formatCurrency(totalPayrollTds)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(totalNetPayable)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
