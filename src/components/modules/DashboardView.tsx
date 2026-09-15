import React from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Building,
  Package,
  AlertOctagon,
  ClipboardCheck,
  Factory,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatCard } from '../ui/StatCard.js';
import { Badge } from '../ui/Badge.js';
import { formatCurrency } from '../../lib/i18n.js';
import { ActiveModule } from '../layout/Sidebar.js';
import { BudgetAlertsWidget } from '../dashboard/BudgetAlertsWidget.js';
import { HistoricalTrendsChart } from '../dashboard/HistoricalTrendsChart.js';

interface DashboardViewProps {
  stats: any;
  products: any[];
  approvalRequests: any[];
  productionOrders: any[];
  budgetAlerts?: any;
  onNavigate: (module: ActiveModule) => void;
  onQuickApprove: (requestId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  products,
  approvalRequests,
  productionOrders,
  budgetAlerts,
  onNavigate,
  onQuickApprove,
}) => {
  if (!stats) return <div className="p-8 text-center text-slate-400">Loading live ERP metrics...</div>;

  const lowStockItems = products.filter((p) => p.currentStock <= p.reorderLevel);
  const pendingApprovals = approvalRequests.filter((r) => r.status === 'Pending');
  const activeBudgetAlerts = budgetAlerts || stats?.budgetAlerts;

  return (
    <div className="space-y-6">
      {/* Top Banner with Org Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time financial status, operational workflows, and supply chain health.
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigate('accounting')}
            className="flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100/70 transition-colors shadow-2xs"
          >
            New Journal Voucher
          </button>
          <button
            onClick={() => onNavigate('sales')}
            className="flex-1 sm:flex-initial text-center px-3 py-2 sm:py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs"
          >
            Create Invoice
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Operating Revenue"
          value={formatCurrency(stats.revenue)}
          subtitle="+14.2% vs prior quarter"
          trend={{ value: '+14.2%', isPositive: true }}
          icon={TrendingUp}
          variant="emerald"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(stats.netProfit)}
          subtitle="Operating margin 38.6%"
          trend={{ value: '+9.4%', isPositive: true }}
          icon={DollarSign}
          variant="blue"
        />
        <StatCard
          title="Cash & Bank Balance"
          value={formatCurrency(stats.cashBalance)}
          subtitle="SCB + DBBL Operating accounts"
          icon={Building}
          variant="default"
        />
        <StatCard
          title="Accounts Receivable (AR)"
          value={formatCurrency(stats.accountsReceivable)}
          subtitle="Uncollected trade invoices"
          trend={{ value: 'Aging clean', isPositive: true }}
          icon={CreditCard}
          variant="amber"
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Accounts Payable (AP)"
          value={formatCurrency(stats.accountsPayable)}
          subtitle="Trade liabilities due"
          icon={CreditCard}
        />
        <StatCard
          title="Total Inventory Value"
          value={formatCurrency(stats.inventoryValue)}
          subtitle="WAC / FIFO deterministic value"
          icon={Package}
        />
        <StatCard
          title="Low-Stock Alerts"
          value={lowStockItems.length}
          subtitle="Items below safety threshold"
          trend={lowStockItems.length > 0 ? { value: `${lowStockItems.length} urgent`, isPositive: false } : undefined}
          icon={AlertOctagon}
          variant={lowStockItems.length > 0 ? 'amber' : 'default'}
        />
        <StatCard
          title="Pending Approvals"
          value={pendingApprovals.length}
          subtitle="Requires executive sign-off"
          icon={ClipboardCheck}
          variant={pendingApprovals.length > 0 ? 'purple' : 'default'}
        />
      </div>

      {/* Visual Alert & Expense Budget Monitoring Section */}
      {activeBudgetAlerts && (
        <BudgetAlertsWidget
          budgetAlerts={activeBudgetAlerts}
          onNavigate={onNavigate}
        />
      )}

      {/* Trends Graph & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts 12-Month Historical Trends (Revenue, Sales Growth & Procurement Volume) */}
        <div className="lg:col-span-2">
          <HistoricalTrendsChart data={stats.monthlyTrends || []} />
        </div>

        {/* Pending Workflow Approvals widget */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">Pending Approvals</h3>
              <button
                onClick={() => onNavigate('workflows')}
                className="text-2xs text-blue-600 hover:underline font-semibold"
              >
                View all ({pendingApprovals.length})
              </button>
            </div>

            <div className="space-y-3">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{req.entityType}</span>
                      <Badge variant="warning">{req.currentApproverRole}</Badge>
                    </div>
                    <p className="text-slate-600 text-2xs truncate">{req.entityReference}</p>
                    {req.amount && (
                      <p className="font-semibold text-slate-900 text-xs">
                        {formatCurrency(req.amount)}
                      </p>
                    )}
                    <div className="pt-1 flex items-center justify-end gap-2">
                      <button
                        onClick={() => onQuickApprove(req.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-2xs font-semibold transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  No approval bottlenecks. All documents processed!
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-2xs text-slate-500">
            <span>Enforced Multi-Tier RBAC Engine</span>
            <span className="text-blue-600 font-semibold cursor-pointer hover:underline" onClick={() => onNavigate('workflows')}>
              Workflow Rules &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Low Stock Alerts & Active Manufacturing Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Inventory Reorder Thresholds
              </h3>
              <p className="text-2xs text-slate-500">Materials below designated buffer limits</p>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-2xs text-blue-600 hover:underline font-semibold"
            >
              Stock Ledger &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {lowStockItems.length > 0 ? (
              lowStockItems.slice(0, 4).map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{p.name}</p>
                    <p className="text-2xs text-slate-400">
                      SKU: {p.sku} | Unit Cost: {formatCurrency(p.costPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-rose-600">
                      {p.currentStock} {p.unit}
                    </p>
                    <p className="text-2xs text-slate-400">Reorder Level: {p.reorderLevel}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                All inventory levels exceed minimum safety buffers.
              </div>
            )}
          </div>
        </div>

        {/* Active Production Orders */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Live Manufacturing Execution
              </h3>
              <p className="text-2xs text-slate-500">Shop-floor batch tracking and MRP yield</p>
            </div>
            <button
              onClick={() => onNavigate('manufacturing')}
              className="text-2xs text-blue-600 hover:underline font-semibold"
            >
              Shop Floor &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {productionOrders.slice(0, 4).map((m) => (
              <div key={m.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{m.orderNumber}</span>
                    <Badge variant={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'primary' : 'warning'}>
                      {m.status}
                    </Badge>
                  </div>
                  <p className="text-2xs text-slate-500 mt-0.5">{m.finishedProductName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">
                    {m.completedQuantity} / {m.plannedQuantity} Pcs
                  </p>
                  <p className="text-2xs text-slate-400">Due: {m.dueDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
