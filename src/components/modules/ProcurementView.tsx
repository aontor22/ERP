import React, { useState } from 'react';
import { ShoppingCart, Plus, Truck, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PurchaseOrder, Supplier, Product } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';

interface ProcurementViewProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  onCreatePO: (poData: any) => Promise<void>;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  purchaseOrders,
  suppliers,
  products,
  onCreatePO,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    {
      productId: products[0]?.id || '',
      orderedQty: 100,
      unitPrice: products[0]?.costPrice || 0,
      taxRate: 15,
    },
  ]);

  const columns: Column<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      sortable: true,
      render: (po) => <span className="font-mono font-bold text-blue-700">{po.poNumber}</span>,
    },
    {
      key: 'supplierName',
      header: 'Supplier Name',
      sortable: true,
      render: (po) => (
        <div>
          <p className="font-semibold text-slate-900">{po.supplierName}</p>
          <p className="text-3xs text-slate-400">Terms: {po.paymentTerms}</p>
        </div>
      ),
    },
    {
      key: 'orderDate',
      header: 'Order Date',
      sortable: true,
      render: (po) => <span className="font-mono text-2xs">{formatDate(po.orderDate)}</span>,
    },
    {
      key: 'grandTotal',
      header: 'Order Value',
      align: 'right',
      sortable: true,
      render: (po) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(po.grandTotal)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Procurement Status',
      render: (po) => (
        <Badge
          variant={
            po.status === 'Received'
              ? 'success'
              : po.status === 'Approved'
              ? 'primary'
              : po.status === 'Pending Approval'
              ? 'warning'
              : 'neutral'
          }
        >
          {po.status}
        </Badge>
      ),
    },
    {
      key: 'approvalStatus',
      header: 'Approval Tier',
      render: (po) => (
        <div className="flex items-center gap-1 text-xs">
          {po.approvalStatus === 'Approved' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span className="font-medium text-slate-700">{po.approvalStatus}</span>
        </div>
      ),
    },
  ];

  const supplierColumns: Column<Supplier>[] = [
    {
      key: 'name',
      header: 'Supplier Entity',
      sortable: true,
      render: (s) => (
        <div>
          <p className="font-semibold text-slate-900">{s.name}</p>
          <p className="text-3xs font-mono text-slate-400">{s.code} | {s.taxNumber}</p>
        </div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (s) => (
        <div>
          <p className="text-slate-800">{s.contactPerson}</p>
          <p className="text-3xs text-slate-400">{s.phone}</p>
        </div>
      ),
    },
    {
      key: 'totalSpend',
      header: 'Cumulative Spend',
      align: 'right',
      sortable: true,
      render: (s) => <span className="font-mono">{formatCurrency(s.totalSpend)}</span>,
    },
    {
      key: 'outstandingBalance',
      header: 'AP Outstanding',
      align: 'right',
      sortable: true,
      render: (s) => (
        <span className="font-mono font-semibold text-amber-700">
          {formatCurrency(s.outstandingBalance)}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Vendor Rating',
      align: 'center',
      render: (s) => (
        <span className="font-bold text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
          ★ {s.rating.toFixed(1)}
        </span>
      ),
    },
  ];

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: products[0]?.id || '',
        orderedQty: 100,
        unitPrice: products[0]?.costPrice || 0,
        taxRate: 15,
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
      if (prod) updated[index].unitPrice = prod.costPrice;
    }
    setItems(updated);
  };

  const computedSubTotal = items.reduce((sum, it) => sum + it.orderedQty * it.unitPrice, 0);
  const computedTax = items.reduce((sum, it) => sum + (it.orderedQty * it.unitPrice * it.taxRate) / 100, 0);
  const computedGrandTotal = computedSubTotal + computedTax;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || items.length === 0) return;
    try {
      setLoading(true);
      await onCreatePO({
        supplierId,
        paymentTerms,
        notes,
        items,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create PO');
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
            Procurement & Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier vendor master, purchase orders, 3-way matching, and approval thresholds.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate Purchase Order</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Purchase Orders ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'suppliers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Supplier Vendor Master ({suppliers.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        <DataTable
          id="procurement-orders-table"
          data={purchaseOrders}
          columns={columns}
          searchPlaceholder="Search PO number or supplier..."
          exportFilename="apex-purchase-orders.csv"
        />
      ) : (
        <DataTable
          id="procurement-suppliers-table"
          data={suppliers}
          columns={supplierColumns}
          searchPlaceholder="Search vendor directory..."
          exportFilename="apex-supplier-master.csv"
        />
      )}

      {/* Create PO Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue New Purchase Order"
        subtitle="Generates PO document. If total exceeds ৳500,000, multi-tier CFO approval is required."
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Commercial Payment Terms</label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="LC 90 Days">Irrevocable LC 90 Days</option>
                <option value="Cash Against Documents (CAD)">Cash Against Documents (CAD)</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-2xs">
                PO Line Items
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
                          {p.sku} — {p.name}
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
                        value={item.orderedQty}
                        onChange={(e) => handleItemChange(idx, 'orderedQty', parseFloat(e.target.value) || 0)}
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
                      ৳{(item.orderedQty * item.unitPrice).toLocaleString()}
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

          {/* Grand total & Approval Warning */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-mono font-semibold">{formatCurrency(computedSubTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Estimated VAT / Tax (15%):</span>
              <span className="font-mono font-semibold">{formatCurrency(computedTax)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Grand Total:</span>
              <span className="font-mono text-blue-700">{formatCurrency(computedGrandTotal)}</span>
            </div>
          </div>

          {computedGrandTotal >= 500000 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-2xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Threshold Warning:</strong> This purchase order exceeds ৳500,000. It will automatically be routed to the CFO approval inbox in accordance with corporate governance policy.
              </span>
            </div>
          )}

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
              {loading ? 'Submitting...' : 'Issue Purchase Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
