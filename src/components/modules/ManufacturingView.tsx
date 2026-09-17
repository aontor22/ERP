import React, { useState } from 'react';
import { Factory, Plus, Layers, Cpu, CheckCircle2, AlertTriangle, Play, Check } from 'lucide-react';
import { BillOfMaterial, ProductionOrder, Product } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';
import { SecureActionButton, AuditorReadonlyBanner } from '../ui/PermissionGate.js';

interface ManufacturingViewProps {
  boms: BillOfMaterial[];
  productionOrders: ProductionOrder[];
  mrpList: any[];
  products: Product[];
  onCreateOrder: (order: any) => Promise<void>;
  currentUser?: any;
}

export const ManufacturingView: React.FC<ManufacturingViewProps> = ({
  boms,
  productionOrders,
  mrpList,
  products,
  onCreateOrder,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'boms' | 'mrp'>('orders');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [bomId, setBomId] = useState(boms[0]?.id || '');
  const [plannedQty, setPlannedQty] = useState(500);
  const [dueDate, setDueDate] = useState('2026-04-30');

  // Manufacturing Order Columns
  const orderColumns: Column<ProductionOrder>[] = [
    {
      key: 'orderNumber',
      header: 'MO Number',
      sortable: true,
      render: (m) => <span className="font-mono font-bold text-blue-700">{m.orderNumber}</span>,
    },
    {
      key: 'finishedProductName',
      header: 'Product to Produce',
      sortable: true,
      render: (m) => (
        <div>
          <p className="font-semibold text-slate-900">{m.finishedProductName}</p>
          <p className="text-3xs text-slate-400">Work Center: {m.assignedWorkCenter}</p>
        </div>
      ),
    },
    {
      key: 'plannedQuantity',
      header: 'Progress / Yield',
      sortable: true,
      render: (m) => {
        const progressPct = Math.min(100, Math.round((m.completedQuantity / m.plannedQuantity) * 100));
        return (
          <div className="w-36">
            <div className="flex justify-between text-2xs font-semibold mb-1">
              <span>{m.completedQuantity} / {m.plannedQuantity} Pcs</span>
              <span>{progressPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'dueDate',
      header: 'Schedule',
      render: (m) => (
        <div>
          <span className="font-mono text-2xs">{formatDate(m.startDate)}</span>
          <span className="text-slate-400 mx-1">&rarr;</span>
          <span className="font-mono text-2xs font-semibold text-slate-800">{formatDate(m.dueDate)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Production Status',
      render: (m) => (
        <Badge
          variant={
            m.status === 'Completed'
              ? 'success'
              : m.status === 'In Progress'
              ? 'primary'
              : m.status === 'Quality Check'
              ? 'warning'
              : 'neutral'
          }
        >
          {m.status}
        </Badge>
      ),
    },
  ];

  // BOM Columns
  const bomColumns: Column<BillOfMaterial>[] = [
    {
      key: 'bomCode',
      header: 'BOM Code',
      sortable: true,
      render: (b) => <span className="font-mono font-bold text-blue-700">{b.bomCode}</span>,
    },
    {
      key: 'finishedProductName',
      header: 'Finished Product',
      sortable: true,
      render: (b) => (
        <div>
          <p className="font-semibold text-slate-900">{b.finishedProductName}</p>
          <p className="text-3xs text-slate-400">Batch Yield: {b.yieldQuantity} Units</p>
        </div>
      ),
    },
    {
      key: 'totalComponentCost',
      header: 'Standard Batch Cost',
      align: 'right',
      render: (b) => (
        <span className="font-mono font-bold text-slate-900">
          {formatCurrency(b.totalComponentCost)}
        </span>
      ),
    },
    {
      key: 'components',
      header: 'Recipe Components',
      render: (b) => (
        <div className="text-3xs text-slate-600 space-y-0.5">
          {b.components.map((c, idx) => (
            <div key={idx}>
              • {c.rawMaterialName}: <span className="font-mono font-semibold">{c.quantityRequired} {c.unit}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Engineering Status',
      render: (b) => <Badge variant="success">{b.status}</Badge>,
    },
  ];

  // MRP Columns
  const mrpColumns: Column<any>[] = [
    {
      key: 'sku',
      header: 'Material SKU',
      sortable: true,
      render: (r) => <span className="font-mono font-bold text-blue-700">{r.sku}</span>,
    },
    {
      key: 'materialName',
      header: 'Required Raw Material',
      sortable: true,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.materialName}</p>
          <p className="text-3xs text-slate-400">Unit of measure: {r.unit}</p>
        </div>
      ),
    },
    {
      key: 'requiredQuantity',
      header: 'Gross Production Demand',
      align: 'right',
      render: (r) => (
        <span className="font-mono font-semibold text-slate-800">
          {r.requiredQuantity.toLocaleString()} {r.unit}
        </span>
      ),
    },
    {
      key: 'availableStock',
      header: 'Stock On-Hand',
      align: 'right',
      render: (r) => (
        <span className="font-mono text-slate-700">
          {r.availableStock.toLocaleString()} {r.unit}
        </span>
      ),
    },
    {
      key: 'deficit',
      header: 'Net Deficit (Reorder Need)',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span
          className={`font-mono font-bold ${
            r.deficit > 0 ? 'text-rose-600' : 'text-emerald-700'
          }`}
        >
          {r.deficit > 0 ? `-${r.deficit.toLocaleString()} ${r.unit}` : 'Sufficient'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'MRP Readiness',
      render: (r) => (
        <Badge variant={r.deficit > 0 ? 'danger' : 'success'}>
          {r.deficit > 0 ? 'Shortage Alert' : 'Ready to Manufacture'}
        </Badge>
      ),
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onCreateOrder({
        bomId,
        plannedQuantity: Number(plannedQty),
        dueDate,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Error creating manufacturing order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Auditor Banner */}
      <AuditorReadonlyBanner currentUser={currentUser} entityName="Bills of Materials (BOM), Manufacturing Orders, and MRP calculations" />

      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Manufacturing & MRP Production
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Multi-level Bills of Materials (BOM), shop-floor routing, work centers, and material requirements planning.
          </p>
        </div>

        <SecureActionButton
          id="launch-mo-btn"
          action="manufacturing:execute"
          currentUser={currentUser}
          onClick={() => setIsModalOpen(true)}
          icon={Plus}
          className="w-full sm:w-auto"
        >
          <span>Launch Manufacturing Order</span>
        </SecureActionButton>
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
          Active Production Orders ({productionOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('boms')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'boms'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Bills of Materials / Recipes ({boms.length})
        </button>
        <button
          onClick={() => setActiveTab('mrp')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'mrp'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Live Material Requirement Planning (MRP)
        </button>
      </div>

      {activeTab === 'orders' && (
        <DataTable
          id="mfg-orders-table"
          data={productionOrders}
          columns={orderColumns}
          searchPlaceholder="Search order number or product..."
          exportFilename="apex-production-orders.csv"
        />
      )}

      {activeTab === 'boms' && (
        <DataTable
          id="mfg-boms-table"
          data={boms}
          columns={bomColumns}
          searchPlaceholder="Search BOM code or recipe..."
          exportFilename="apex-bills-of-materials.csv"
        />
      )}

      {activeTab === 'mrp' && (
        <DataTable
          id="mfg-mrp-table"
          data={mrpList}
          columns={mrpColumns}
          searchPlaceholder="Search material requirements..."
          exportFilename="apex-mrp-requirements.csv"
        />
      )}

      {/* Create Manufacturing Order Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Manufacturing Production Order"
        subtitle="Schedules shop floor line, reserves required raw materials according to BOM, and initiates batch tracking"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Bill of Materials (BOM) *</label>
            <select
              value={bomId}
              onChange={(e) => setBomId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
            >
              {boms.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.bomCode} — {b.finishedProductName} (Yield: {b.yieldQuantity} Units)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Production Units *</label>
              <input
                type="number"
                min="1"
                value={plannedQty}
                onChange={(e) => setPlannedQty(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Planned Completion Date *</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-2xs text-blue-900 flex items-start gap-2">
            <Cpu className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              The MRP engine will immediately verify stock buffers for fabric, dyes, and packaging in the central bonded warehouse and flag any required purchasing requisitions.
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
              {loading ? 'Scheduling...' : 'Launch Production Order'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
