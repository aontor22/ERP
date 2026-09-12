import React, { useState } from 'react';
import { Plus, Package, Barcode, Layers, DollarSign, AlertCircle } from 'lucide-react';
import { Product } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency } from '../../lib/i18n.js';

interface ProductsViewProps {
  products: Product[];
  onCreateProduct: (product: any) => Promise<void>;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, onCreateProduct }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: 'Finished Apparel',
    type: 'Finished Good',
    unit: 'Pcs',
    costPrice: 0,
    sellingPrice: 0,
    taxRate: 15,
    reorderLevel: 200,
    minStock: 50,
    maxStock: 5000,
    weightKg: 0.3,
    valuationMethod: 'FIFO',
    openingStock: 0,
    batchTracking: true,
  });

  const columns: Column<Product>[] = [
    {
      key: 'sku',
      header: 'SKU / Barcode',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-mono font-bold text-blue-700">{p.sku}</span>
          <div className="flex items-center gap-1 text-3xs text-slate-400 mt-0.5">
            <Barcode className="w-3 h-3" />
            <span>{p.barcode}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Item Description',
      sortable: true,
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="neutral">{p.category}</Badge>
            <span className="text-3xs text-slate-400">Valuation: {p.valuationMethod}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Item Classification',
      render: (p) => (
        <Badge
          variant={
            p.type === 'Finished Good'
              ? 'success'
              : p.type === 'Raw Material'
              ? 'primary'
              : 'info'
          }
        >
          {p.type}
        </Badge>
      ),
    },
    {
      key: 'costPrice',
      header: 'Standard Cost',
      align: 'right',
      sortable: true,
      render: (p) => <span className="font-mono">{formatCurrency(p.costPrice)}</span>,
    },
    {
      key: 'sellingPrice',
      header: 'Selling Price',
      align: 'right',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-medium text-slate-900">
          {formatCurrency(p.sellingPrice)}
        </span>
      ),
    },
    {
      key: 'currentStock',
      header: 'Stock On-Hand',
      align: 'right',
      sortable: true,
      render: (p) => {
        const isLow = p.currentStock <= p.reorderLevel;
        return (
          <div className="text-right">
            <span className={`font-mono font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
              {p.currentStock.toLocaleString()} {p.unit}
            </span>
            <p className="text-3xs text-slate-400">
              Reorder: {p.reorderLevel} {p.unit}
            </p>
          </div>
        );
      },
    },
    {
      key: 'totalStockValue',
      header: 'Valuation Total',
      align: 'right',
      sortable: true,
      render: (p) => (
        <span className="font-mono font-semibold text-slate-800">
          {formatCurrency(p.totalStockValue)}
        </span>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sku) return;
    try {
      setLoading(true);
      await onCreateProduct(formData);
      setIsModalOpen(false);
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        category: 'Finished Apparel',
        type: 'Finished Good',
        unit: 'Pcs',
        costPrice: 0,
        sellingPrice: 0,
        taxRate: 15,
        reorderLevel: 200,
        minStock: 50,
        maxStock: 5000,
        weightKg: 0.3,
        valuationMethod: 'FIFO',
        openingStock: 0,
        batchTracking: true,
      });
    } catch (err: any) {
      alert(err.message || 'Error creating product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Product & Item Master</h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard product definitions, SKU taxonomies, cost valuation metrics, and inventory thresholds.
          </p>
        </div>
        <button
          id="add-product-btn"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Product Master</span>
        </button>
      </div>

      {/* Data Table */}
      <DataTable
        id="products-table"
        data={products}
        columns={columns}
        searchPlaceholder="Search SKU, name, or barcode..."
        searchField={(p) => `${p.sku} ${p.name} ${p.barcode} ${p.category}`}
        exportFilename="apex-product-master.csv"
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Product / Item Master"
        subtitle="Registers standard item catalog with double-entry stock valuation parameters"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product / Item Name *</label>
              <input
                required
                type="text"
                placeholder="e.g. 100% Combed Cotton T-Shirt"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unique SKU Code *</label>
              <input
                required
                type="text"
                placeholder="e.g. FG-TSHIRT-01"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Finished Apparel">Finished Apparel</option>
                <option value="Raw Materials">Raw Materials</option>
                <option value="Chemicals & Dyes">Chemicals & Dyes</option>
                <option value="Trims & Accessories">Trims & Accessories</option>
                <option value="Packaging Materials">Packaging Materials</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Item Classification</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Finished Good">Finished Good</option>
                <option value="Raw Material">Raw Material</option>
                <option value="Semi-Finished">Semi-Finished</option>
                <option value="Service">Service</option>
                <option value="Spare Part">Spare Part</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white"
              >
                <option value="Pcs">Pcs</option>
                <option value="Kg">Kg</option>
                <option value="Meter">Meter</option>
                <option value="Gross">Gross</option>
                <option value="Box">Box</option>
                <option value="Dozen">Dozen</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost Price (BDT) *</label>
              <input
                type="number"
                step="any"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Selling Price (BDT) *</label>
              <input
                type="number"
                step="any"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Valuation Strategy</label>
              <select
                value={formData.valuationMethod}
                onChange={(e) => setFormData({ ...formData, valuationMethod: e.target.value as any })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium"
              >
                <option value="FIFO">FIFO (First In First Out)</option>
                <option value="WAC">Weighted Average Cost (WAC)</option>
                <option value="Standard Cost">Standard Cost</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reorder Safety Level</label>
              <input
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Initial Opening Stock</label>
              <input
                type="number"
                value={formData.openingStock}
                onChange={(e) => setFormData({ ...formData, openingStock: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NBR VAT Rate (%)</label>
              <input
                type="number"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-2xs text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              If opening stock is provided, the system will automatically create an initial Stock Ledger entry and link it to the central depot inventory account.
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Register Item Master'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
