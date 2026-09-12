import React, { useState } from 'react';
import { Receipt, Plus, Users, CheckCircle2, AlertCircle, ArrowUpRight, DollarSign } from 'lucide-react';
import { SalesInvoice, Customer, Product } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';

interface SalesViewProps {
  invoices: SalesInvoice[];
  customers: Customer[];
  products: Product[];
  onCreateInvoice: (data: any) => Promise<void>;
}

export const SalesView: React.FC<SalesViewProps> = ({
  invoices,
  customers,
  products,
  onCreateInvoice,
}) => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [notes, setNotes] = useState('Standard export trade contract invoice');
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || '',
      quantity: 50,
      unitPrice: products[0]?.sellingPrice || 0,
      taxRate: 15,
      taxAmount: 0,
      totalAmount: 0,
    },
  ]);

  const invoiceColumns: Column<SalesInvoice>[] = [
    {
      key: 'invoiceNumber',
      header: 'Invoice Number',
      sortable: true,
      render: (inv) => <span className="font-mono font-bold text-blue-700">{inv.invoiceNumber}</span>,
    },
    {
      key: 'customerName',
      header: 'Customer Entity',
      sortable: true,
      render: (inv) => (
        <div>
          <p className="font-semibold text-slate-900">{inv.customerName}</p>
          <p className="text-3xs text-slate-400">Due: {formatDate(inv.dueDate)}</p>
        </div>
      ),
    },
    {
      key: 'invoiceDate',
      header: 'Issue Date',
      sortable: true,
      render: (inv) => <span className="font-mono text-2xs">{formatDate(inv.invoiceDate)}</span>,
    },
    {
      key: 'subTotal',
      header: 'Subtotal',
      align: 'right',
      render: (inv) => <span className="font-mono">{formatCurrency(inv.subTotal)}</span>,
    },
    {
      key: 'taxTotal',
      header: 'NBR VAT (15%)',
      align: 'right',
      render: (inv) => <span className="font-mono">{formatCurrency(inv.taxTotal)}</span>,
    },
    {
      key: 'grandTotal',
      header: 'Grand Total',
      align: 'right',
      sortable: true,
      render: (inv) => (
        <span className="font-mono font-bold text-emerald-700">
          {formatCurrency(inv.grandTotal)}
        </span>
      ),
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
          <p className="font-semibold text-slate-900">{c.name}</p>
          <p className="text-3xs font-mono text-slate-400">{c.code} | {c.taxNumber}</p>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (c) => (
        <div>
          <p className="text-slate-800">{c.contactPerson}</p>
          <p className="text-3xs text-slate-400">{c.email}</p>
        </div>
      ),
    },
    {
      key: 'creditLimit',
      header: 'Credit Limit',
      align: 'right',
      sortable: true,
      render: (c) => <span className="font-mono">{formatCurrency(c.creditLimit)}</span>,
    },
    {
      key: 'outstandingBalance',
      header: 'AR Balance Due',
      align: 'right',
      sortable: true,
      render: (c) => (
        <span
          className={`font-mono font-bold ${
            c.currentReceivable > 0 ? 'text-amber-700' : 'text-slate-600'
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
        unitPrice: products[0]?.sellingPrice || 0,
        taxRate: 15,
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
      if (prod) updated[index].unitPrice = prod.sellingPrice;
    }
    setItems(updated);
  };

  const computedSubTotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  const computedTax = items.reduce((sum, it) => sum + (it.quantity * it.unitPrice * it.taxRate) / 100, 0);
  const computedGrandTotal = computedSubTotal + computedTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || items.length === 0) return;
    try {
      setLoading(true);
      await onCreateInvoice({
        customerId,
        notes,
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
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales & Customer Invoicing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Accounts receivable (AR), billing cycles, VAT-9.1 compliance, and customer credit limits.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Sales Invoice</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Sales Invoices ({invoices.length})
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'customers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Customer Directory & Credit ({customers.length})
        </button>
      </div>

      {activeTab === 'invoices' ? (
        <DataTable
          id="sales-invoices-table"
          data={invoices}
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

      {/* Create Sales Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Sales Invoice"
        subtitle="Generates tax invoice, updates inventory, and automatically creates balanced GL journal voucher"
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer Account *</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Credit: {formatCurrency(c.creditLimit)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Memo / Contract Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-2xs">
                Billable Products & Services
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-2xs font-semibold text-blue-600 hover:underline"
              >
                + Add Another Product
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg items-center"
                >
                  <div className="sm:col-span-5">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} — {p.name} (Avail: {p.currentStock})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-2 sm:col-span-4 gap-2">
                    <div>
                      <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white font-mono text-right text-xs"
                      />
                    </div>
                    <div>
                      <span className="sm:hidden text-3xs text-slate-400 block mb-0.5 font-medium">Price:</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded bg-white font-mono text-right text-xs"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <div className="text-right font-mono font-bold text-slate-800 text-xs">
                      ৳{(item.quantity * item.unitPrice).toLocaleString()}
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

          {/* Totals */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-mono font-semibold">{formatCurrency(computedSubTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">NBR VAT-9.1 (15%):</span>
              <span className="font-mono font-semibold">{formatCurrency(computedTax)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Invoice Grand Total:</span>
              <span className="font-mono text-emerald-700">{formatCurrency(computedGrandTotal)}</span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-2xs text-blue-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong>Double-Entry Ledger Effect:</strong> Submitting this invoice atomically posts:
              <br />
              • Debit: Accounts Receivable (1200) for {formatCurrency(computedGrandTotal)}
              <br />
              • Credit: Sales Operating Revenue (4000) for {formatCurrency(computedSubTotal)}
              <br />
              • Credit: VAT Output Payable (2100) for {formatCurrency(computedTax)}
            </span>
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
