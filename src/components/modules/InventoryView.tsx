import React, { useState } from 'react';
import { Boxes, Plus, History, ArrowDownRight, ArrowUpRight, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { Product, StockLedgerEntry } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';
import { InventoryForecastingModule } from './inventory/InventoryForecastingModule.js';

interface InventoryViewProps {
  products: Product[];
  stockLedger: StockLedgerEntry[];
  warehouses: any[];
  onAdjustStock: (data: { productId: string; warehouseId: string; quantityChange: number; reason: string }) => Promise<void>;
  onRefreshProducts?: () => void;
  onNavigateToProcurement?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  stockLedger,
  warehouses,
  onAdjustStock,
  onRefreshProducts,
  onNavigateToProcurement,
}) => {
  const [activeTab, setActiveTab] = useState<'balances' | 'forecast' | 'ledger'>('balances');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(products[0]?.id || '');
  const [selectedWarehouse, setSelectedWarehouse] = useState(warehouses[0]?.id || '');
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState('Cycle count physical inventory variance');
  const [loading, setLoading] = useState(false);

  // Count items below reorder point
  const itemsBelowReorder = products.filter((p) => p.currentStock <= p.reorderLevel).length;

  // Balances Table Columns
  const balanceColumns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU & Name',
      sortable: true,
      render: (p) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-blue-700">{p.sku}</span>
            {p.currentStock <= p.reorderLevel && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-3xs font-bold bg-rose-100 text-rose-800">
                LOW STOCK
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-900">{p.name}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Unit',
      render: (p) => (
        <div>
          <span className="text-slate-800">{p.category}</span>
          <p className="text-2xs text-slate-400">
            Unit: {p.unit} • Lead Time: {p.leadTimeDays || 14}d
          </p>
        </div>
      ),
    },
    {
      key: 'valuationMethod',
      header: 'Valuation Method',
      render: (p) => <Badge variant="neutral">{p.valuationMethod}</Badge>,
    },
    {
      key: 'costPrice',
      header: 'Unit Cost',
      align: 'right',
      sortable: true,
      render: (p) => <span className="font-mono">{formatCurrency(p.costPrice)}</span>,
    },
    {
      key: 'currentStock',
      header: 'On Hand / ROP',
      align: 'right',
      sortable: true,
      render: (p) => {
        const isBelow = p.currentStock <= p.reorderLevel;
        return (
          <div>
            <span className={`font-mono font-bold ${isBelow ? 'text-rose-600' : 'text-slate-900'}`}>
              {p.currentStock.toLocaleString()} {p.unit}
            </span>
            <p className="text-3xs text-slate-400 font-mono">
              ROP: {p.reorderLevel} | Max: {p.maxStock}
            </p>
          </div>
        );
      },
    },
    {
      key: 'totalStockValue',
      header: 'Total Value',
      align: 'right',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-bold text-emerald-700">
          {formatCurrency(p.totalStockValue)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      render: (p) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => {
              setSelectedProduct(p.id);
              setIsAdjustModalOpen(true);
            }}
            className="px-2 py-1 text-2xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
          >
            Adjust
          </button>
          <button
            onClick={() => setActiveTab('forecast')}
            className="px-2 py-1 text-2xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100 transition-colors flex items-center gap-1"
            title="View AI replenishment forecast for this item"
          >
            <Sparkles className="w-2.5 h-2.5" />
            Forecast
          </button>
        </div>
      ),
    },
  ];

  // Ledger Table Columns
  const ledgerColumns: Column<StockLedgerEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      sortable: true,
      render: (l) => <span className="font-mono text-2xs text-slate-500">{formatDate(l.timestamp)}</span>,
    },
    {
      key: 'sku',
      header: 'SKU & Product',
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-mono font-bold text-blue-700">{l.sku}</span>
          <p className="text-slate-800 text-xs">{l.productName}</p>
        </div>
      ),
    },
    {
      key: 'movementType',
      header: 'Movement Type',
      render: (l) => {
        const isReceipt = l.quantityChange > 0;
        return (
          <div className="flex items-center gap-1.5">
            {isReceipt ? (
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
            )}
            <Badge variant={isReceipt ? 'success' : 'danger'}>{l.movementType}</Badge>
          </div>
        );
      },
    },
    {
      key: 'quantityChange',
      header: 'Qty Delta',
      align: 'right',
      sortable: true,
      render: (l) => (
        <span
          className={`font-mono font-bold ${
            l.quantityChange > 0 ? 'text-emerald-700' : 'text-rose-600'
          }`}
        >
          {l.quantityChange > 0 ? `+${l.quantityChange}` : l.quantityChange}
        </span>
      ),
    },
    {
      key: 'balanceQuantity',
      header: 'Post Balance',
      align: 'right',
      render: (l) => <span className="font-mono font-semibold text-slate-800">{l.balanceQuantity}</span>,
    },
    {
      key: 'referenceDocNumber',
      header: 'Reference Doc',
      render: (l) => (
        <div>
          <span className="font-mono text-slate-700 font-semibold">{l.referenceDocNumber}</span>
          <p className="text-3xs text-slate-400">{l.warehouseName}</p>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Authorized By / Reason',
      render: (l) => (
        <div>
          <span className="font-medium text-slate-800">{l.user}</span>
          <p className="text-3xs text-slate-400 truncate max-w-[200px]">{l.reason || 'Standard transaction'}</p>
        </div>
      ),
    },
  ];

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedWarehouse || quantityChange === 0) return;
    try {
      setLoading(true);
      await onAdjustStock({
        productId: selectedProduct,
        warehouseId: selectedWarehouse,
        quantityChange: Number(quantityChange),
        reason: adjustmentReason,
      });
      setIsAdjustModalOpen(false);
      setQuantityChange(0);
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  const totalInventoryValuation = products.reduce((sum, p) => sum + p.totalStockValue, 0);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Inventory Engine & Stock Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable transaction ledger, multi-warehouse stock allocations, and FIFO/WAC valuation.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="text-left sm:text-right px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg flex-1 sm:flex-initial">
            <span className="text-3xs uppercase font-bold text-emerald-700">Total Valuation</span>
            <p className="text-sm font-bold text-emerald-900 font-mono">
              {formatCurrency(totalInventoryValuation)}
            </p>
          </div>
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs w-full sm:w-auto text-center"
          >
            Adjust Stock
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-t-xl overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'balances'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Warehouse Stock Balances ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'forecast'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          AI Inventory Forecasting & Replenishment
          {itemsBelowReorder > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-3xs font-bold bg-rose-100 text-rose-700">
              {itemsBelowReorder} at risk
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Immutable Stock Ledger ({stockLedger.length} Movements)
        </button>
      </div>

      {activeTab === 'balances' ? (
        <DataTable
          id="inventory-balances-table"
          data={products}
          columns={balanceColumns}
          searchPlaceholder="Search on-hand stock balances..."
          exportFilename="inventory-valuation-balances.csv"
        />
      ) : activeTab === 'forecast' ? (
        <InventoryForecastingModule
          onRefreshProducts={onRefreshProducts}
          onNavigateToProcurement={onNavigateToProcurement}
        />
      ) : (
        <DataTable
          id="inventory-ledger-table"
          data={stockLedger}
          columns={ledgerColumns}
          searchPlaceholder="Search historical stock movements..."
          exportFilename="immutable-stock-ledger.csv"
        />
      )}

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Post Stock Adjustment"
        subtitle="Generates an immutable ledger adjustment and updates product balance"
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Product *</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.sku} — {p.name} (Current: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Storage Warehouse *</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Quantity Delta (+ to increase, - to decrease) *
            </label>
            <input
              type="number"
              value={quantityChange}
              onChange={(e) => setQuantityChange(parseFloat(e.target.value) || 0)}
              placeholder="e.g. 50 or -20"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
            />
            <p className="text-3xs text-slate-400 mt-1">
              Note: System strictly prohibits negative inventory balances.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Authorization Reason *</label>
            <textarea
              rows={2}
              required
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || quantityChange === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Posting...' : 'Post Adjustment to Ledger'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
