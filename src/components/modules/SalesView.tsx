import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Filter,
  RefreshCw,
  Globe2,
} from 'lucide-react';
import { SalesInvoice, Customer, Product } from '../../types/erp.js';
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
import { SecureActionButton, AuditorReadonlyBanner } from '../ui/PermissionGate.js';

interface SalesViewProps {
  invoices: SalesInvoice[];
  customers: Customer[];
  products: Product[];
  onCreateInvoice: (data: any) => Promise<void>;
  baseCurrency?: string;
  onBaseCurrencyChange?: (curr: string) => void;
  currentUser?: any;
}

export const SalesView: React.FC<SalesViewProps> = ({
  invoices,
  customers,
  products,
  onCreateInvoice,
  baseCurrency: propBaseCurrency,
  onBaseCurrencyChange: propOnBaseCurrencyChange,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Multi-currency handling
  const [baseCurrency, setBaseCurrency] = useState<string>(
    propBaseCurrency || getStoredBaseCurrency()
  );
  const [ratesData, setRatesData] = useState<ExchangeRatesData | null>(null);
  const [invoiceCurrencyFilter, setInvoiceCurrencyFilter] = useState<string>('ALL');

  useEffect(() => {
    if (propBaseCurrency && propBaseCurrency !== baseCurrency) {
      setBaseCurrency(propBaseCurrency);
    }
  }, [propBaseCurrency]);

  const handleBaseCurrencyChange = (newBase: string) => {
    setBaseCurrency(newBase);
    saveStoredBaseCurrency(newBase);
    if (propOnBaseCurrencyChange) {
      propOnBaseCurrencyChange(newBase);
    }
  };

  // Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [currency, setCurrency] = useState<string>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(121.5);
  const [notes, setNotes] = useState('Commercial export invoice under Letter of Credit');
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || '',
      quantity: 50,
      unitPrice: 12.5,
      taxRate: 0, // Export invoices are typically zero-rated (0% VAT) under NBR export rules
      taxAmount: 0,
      totalAmount: 0,
    },
  ]);

  // When customer changes, intelligently suggest default trade currency
  const handleCustomerChange = (selectedCustId: string) => {
    setCustomerId(selectedCustId);
    const cust = customers.find((c) => c.id === selectedCustId);
    if (cust) {
      const isExport =
        cust.name.toLowerCase().includes('zara') ||
        cust.name.toLowerCase().includes('inditex') ||
        cust.name.toLowerCase().includes('h&m') ||
        cust.name.toLowerCase().includes('target') ||
        cust.name.toLowerCase().includes('walmart');

      if (isExport) {
        const targetCurr = cust.name.toLowerCase().includes('h&m') ? 'EUR' : 'USD';
        setCurrency(targetCurr);
        // Default export sales to 0% VAT for export bonded warehouse
        setItems(items.map((it) => ({ ...it, taxRate: 0 })));
      } else {
        setCurrency('BDT');
        // Domestic sales default to 15% NBR VAT
        setItems(items.map((it) => ({ ...it, taxRate: 15 })));
      }
    }
  };

  // Sync exchange rate whenever currency or ratesData changes
  useEffect(() => {
    if (currency === baseCurrency) {
      setExchangeRate(1.0);
    } else if (ratesData) {
      const rate =
        ratesData.ratesToBase?.[currency] ||
        (ratesData.rates?.[currency] ? 1 / ratesData.rates[currency] : 1.0);
      setExchangeRate(Number(rate.toFixed(4)));
    }
  }, [currency, baseCurrency, ratesData]);

  // Invoices filtered by currency
  const filteredInvoices = useMemo(() => {
    if (invoiceCurrencyFilter === 'ALL') return invoices;
    return invoices.filter((inv) => (inv.currency || 'BDT') === invoiceCurrencyFilter);
  }, [invoices, invoiceCurrencyFilter]);

  // Aggregate stats across multi-currency
  const stats = useMemo(() => {
    let totalBaseVolume = 0;
    let totalForeignUSD = 0;
    let totalForeignEUR = 0;

    invoices.forEach((inv) => {
      const curr = inv.currency || 'BDT';
      const baseVal = inv.baseGrandTotal ?? inv.grandTotal;
      totalBaseVolume += baseVal;

      if (curr === 'USD') totalForeignUSD += inv.grandTotal;
      if (curr === 'EUR') totalForeignEUR += inv.grandTotal;
    });

    return { totalBaseVolume, totalForeignUSD, totalForeignEUR };
  }, [invoices]);

  const invoiceColumns: Column<SalesInvoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice Number',
      sortable: true,
      render: (inv) => (
        <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer Entity',
      sortable: true,
      render: (inv) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{inv.customerName}</p>
          <p className="text-3xs text-slate-400">Due: {formatDate(inv.dueDate)}</p>
        </div>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Issue Date',
      sortable: true,
      render: (inv) => (
        <span className="font-mono text-2xs dark:text-slate-300">
          {formatDate(inv.invoiceDate)}
        </span>
      ),
    },
    {
      key: 'subTotal',
      header: 'Subtotal (Txn)',
      align: 'right',
      render: (inv) => {
        const curr = inv.currency || 'BDT';
        return (
          <span className="font-mono text-slate-800 dark:text-slate-200">
            {formatMultiCurrency(inv.subTotal, curr)}
          </span>
        );
      },
    },
    {
      key: 'taxTotal',
      header: 'NBR VAT',
      align: 'right',
      render: (inv) => {
        const curr = inv.currency || 'BDT';
        return (
          <span className="font-mono text-slate-800 dark:text-slate-200">
            {inv.taxTotal > 0 ? formatMultiCurrency(inv.taxTotal, curr) : '0% (Export)'}
          </span>
        );
      },
    },
    {
      key: 'grandTotal',
      header: 'Invoice Total (Txn & Base)',
      align: 'right',
      sortable: true,
      render: (inv) => {
        const curr = inv.currency || 'BDT';
        const isForeign = curr !== (inv.baseCurrency || 'BDT');
        const baseTotal = inv.baseGrandTotal ?? inv.grandTotal;

        return (
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5">
              {isForeign && (
                <span className="text-3xs font-mono font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                  {curr}
                </span>
              )}
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs">
                {formatMultiCurrency(inv.grandTotal, curr)}
              </span>
            </div>
            {isForeign && (
              <p className="text-3xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Base: {formatMultiCurrency(baseTotal, inv.baseCurrency || 'BDT')} (@ {inv.exchangeRate})
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Invoice Status',
      render: (inv) => (
        <Badge
          variant={
            inv.status === 'Paid'
              ? 'success'
              : inv.status === 'Posted'
              ? 'primary'
              : inv.status === 'Overdue'
              ? 'danger'
              : 'warning'
          }
        >
          {inv.status}
        </Badge>
      ),
    },
  ];

  const customerColumns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer Account',
      sortable: true,
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
          <p className="text-3xs font-mono text-slate-400 dark:text-slate-500">
            {c.code} | {c.taxNumber}
          </p>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (c) => (
        <div>
          <p className="text-slate-800 dark:text-slate-200">{c.contactPerson}</p>
          <p className="text-3xs text-slate-400">{c.email}</p>
        </div>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      sortable: true,
      render: (c) => (
        <span className="font-mono dark:text-slate-200">{formatCurrency(c.creditLimit)}</span>
      ),
    },
    {
      key: 'outstandingBalance',
      header: 'AR Balance Due (Base)',
      align: 'right',
      sortable: true,
      render: (c) => (
        <span
          className={`font-mono font-bold ${
            c.currentReceivable > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          {formatCurrency(c.currentReceivable)}
        </span>
      ),
    },
    {
      key: 'creditDays',
      header: 'Terms (Days)',
      render: (c) => <Badge variant="neutral">{c.creditDays} Days</Badge>,
    },
  ];

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: products[0]?.id || '',
        quantity: 10,
        unitPrice: currency === 'USD' ? 14.5 : currency === 'EUR' ? 13.0 : (products[0]?.sellingPrice || 1450),
        taxRate: currency === 'BDT' ? 15 : 0,
        taxAmount: 0,
        totalAmount: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) {
        if (currency === 'USD') {
          updated[index].unitPrice = Number((prod.sellingPrice / 121.5).toFixed(2));
        } else if (currency === 'EUR') {
          updated[index].unitPrice = Number((prod.sellingPrice / 132.8).toFixed(2));
        } else {
          updated[index].unitPrice = prod.sellingPrice;
        }
      }
    }
    setItems(updated);
  };

  const computedSubTotal = Number(
    items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0).toFixed(2)
  );
  const computedTax = Number(
    items.reduce((sum, it) => sum + (it.quantity * it.unitPrice * it.taxRate) / 100, 0).toFixed(2)
  );
  const computedGrandTotal = Number((computedSubTotal + computedTax).toFixed(2));

  const baseSubTotal = Number((computedSubTotal * exchangeRate).toFixed(2));
  const baseTax = Number((computedTax * exchangeRate).toFixed(2));
  const baseGrandTotal = Number((computedGrandTotal * exchangeRate).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) return;
    try {
      setLoading(true);
      await onCreateInvoice({
        customerId,
        notes,
        currency,
        currencySymbol: SUPPORTED_CURRENCIES[currency]?.symbol || currency,
        exchangeRate: Number(exchangeRate),
        baseCurrency,
        items,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to post invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Auditor Banner */}
      <AuditorReadonlyBanner currentUser={currentUser} entityName="Sales invoices and Accounts Receivable balances" />

      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sales & International Invoicing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Accounts receivable (AR), multi-currency export billing, NBR VAT-9.1 compliance, and live exchange rate valuation.
          </p>
        </div>

        <SecureActionButton
          id="issue-invoice-btn"
          action="sales:create_invoice"
          currentUser={currentUser}
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          className="w-full sm:w-auto"
        >
          <span>Issue Sales Invoice</span>
        </SecureActionButton>
      </div>

      {/* Multi-Currency Ticker & FX Bar */}
      <CurrencyBar
        baseCurrency={baseCurrency}
        onBaseCurrencyChange={handleBaseCurrencyChange}
        onRatesLoaded={(rates) => setRatesData(rates)}
      />

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Total Invoiced Volume (Base {baseCurrency})
          </span>
          <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
            {formatMultiCurrency(stats.totalBaseVolume, baseCurrency)}
          </span>
          <span className="text-3xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
            <ArrowUpRight className="w-3 h-3" />
            Consolidated across all foreign & local contracts
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Active Foreign Currency Invoiced
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
              ${stats.totalForeignUSD.toLocaleString()} USD
            </span>
            <span className="text-xs font-bold font-mono text-slate-600 dark:text-slate-300">
              €{stats.totalForeignEUR.toLocaleString()} EUR
            </span>
          </div>
          <span className="text-3xs text-slate-400 mt-1 block">
            Ready for export letter of credit settlement
          </span>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
          <span className="text-3xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Export Contract FX Hedging
          </span>
          <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
            100% Real-Time
          </span>
          <span className="text-3xs text-slate-400 mt-1 block">
            GL synced to Bangladesh Bank & Open Exchange Rates
          </span>
        </div>
      </div>

      {/* Tabs & Currency Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-t-xl overflow-x-auto">
        <div className="flex items-center overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'invoices'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Sales Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
              activeTab === 'customers'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Customer Directory & Credit ({customers.length})
          </button>
        </div>

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-1.5 py-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-3xs font-semibold text-slate-500 uppercase tracking-wider">
              Filter Currency:
            </span>
            {['ALL', 'BDT', 'USD', 'EUR', 'GBP'].map((code) => (
              <button
                key={code}
                onClick={() => setInvoiceCurrencyFilter(code)}
                className={`px-2 py-0.5 rounded text-3xs font-bold font-mono transition-colors ${
                  invoiceCurrencyFilter === code
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

      {activeTab === 'invoices' ? (
        <DataTable
          id="sales-invoices-table"
          data={filteredInvoices}
          columns={invoiceColumns}
          searchPlaceholder="Search invoice number or customer..."
          exportFilename="apex-sales-invoices.csv"
        />
      ) : (
        <DataTable
          id="sales-customers-table"
          data={customers}
          columns={customerColumns}
          searchPlaceholder="Search customer accounts..."
          exportFilename="apex-customers.csv"
        />
      )}

      {/* Create Multi-Currency Sales Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Multi-Currency Sales Invoice"
        subtitle="Generates tax invoice, updates inventory, and posts dual-currency balanced GL journal voucher"
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Customer Account *
              </label>
              <select
                value={customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Credit: {formatCurrency(c.creditLimit)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Memo / Export Contract Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Multi-Currency Setting */}
          <div className="p-3 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <Globe2 className="w-4 h-4 text-blue-600" />
                  Transaction Billing Currency:
                </span>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
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
                  Exchange Rate (1 {currency} =):
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

                {currency !== baseCurrency && (
                  <button
                    type="button"
                    onClick={() => {
                      if (ratesData) {
                        const r =
                          ratesData.ratesToBase?.[currency] ||
                          (ratesData.rates?.[currency] ? 1 / ratesData.rates[currency] : 1.0);
                        setExchangeRate(Number(r.toFixed(4)));
                      }
                    }}
                    title="Fetch live exchange rate"
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
              {currency !== baseCurrency && (
                <span className="font-mono text-blue-700 dark:text-blue-400">
                  Dual-Currency Accounting: Invoice billed in {currency}, GL recorded in {baseCurrency} @ {exchangeRate}
                </span>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-2xs">
                Billable Products & Services (Prices in {currency})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                + Add Another Product
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-lg items-center"
                >
                  <div className="sm:col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} (Avail: {p.currentStock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-3 sm:col-span-4 gap-1.5">
                    <div>
                      <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-right text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">Price ({currency}):</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-right text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">VAT %:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="VAT %"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(idx, 'taxRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 font-mono text-right text-xs text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                        {formatMultiCurrency(item.quantity * item.unitPrice, currency)}
                      </div>
                      {currency !== baseCurrency && (
                        <div className="text-3xs font-mono text-slate-400">
                          ≈ {SUPPORTED_CURRENCIES[baseCurrency]?.symbol}{((item.quantity * item.unitPrice) * exchangeRate).toFixed(0)}
                        </div>
                      )}
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-rose-500 hover:text-rose-700 font-bold p-1 rounded hover:bg-rose-50"
                        title="Remove line"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dual-Currency Totals */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Subtotal:</span>
              <div className="text-right font-mono">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatMultiCurrency(computedSubTotal, currency)}
                </span>
                {currency !== baseCurrency && (
                  <span className="text-slate-400 text-3xs ml-2">
                    (Base: {formatMultiCurrency(baseSubTotal, baseCurrency)})
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">VAT Total:</span>
              <div className="text-right font-mono">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatMultiCurrency(computedTax, currency)}
                </span>
                {currency !== baseCurrency && (
                  <span className="text-slate-400 text-3xs ml-2">
                    (Base: {formatMultiCurrency(baseTax, baseCurrency)})
                  </span>
                )}
              </div>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
              <span>Invoice Grand Total:</span>
              <div className="text-right font-mono">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatMultiCurrency(computedGrandTotal, currency)}
                </span>
                {currency !== baseCurrency && (
                  <span className="text-slate-400 text-xs font-normal ml-2">
                    ≈ {formatMultiCurrency(baseGrandTotal, baseCurrency)} Base GL
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-lg text-2xs text-blue-900 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <span>
              <strong>Double-Entry Ledger Effect:</strong> Submitting this invoice atomically posts:
              <br />
              • Debit: Accounts Receivable for {formatMultiCurrency(computedGrandTotal, currency)} (Base: {formatMultiCurrency(baseGrandTotal, baseCurrency)})
              <br />
              • Credit: Sales Operating Revenue for {formatMultiCurrency(computedSubTotal, currency)} (Base: {formatMultiCurrency(baseSubTotal, baseCurrency)})
              {computedTax > 0 && (
                <>
                  <br />
                  • Credit: VAT Output Payable for {formatMultiCurrency(computedTax, currency)} (Base: {formatMultiCurrency(baseTax, baseCurrency)})
                </>
              )}
            </span>
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
              disabled={loading || computedGrandTotal === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Sales Invoice & Journal'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
