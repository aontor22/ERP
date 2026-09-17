import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Clock,
  TrendingUp,
  CheckCircle2,
  Package,
  ArrowRight,
  ShieldAlert,
  Sliders,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Download,
  Info,
  Check,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine,
} from 'recharts';
import { api } from '../../../lib/api.js';
import { InventoryForecastItem, InventoryForecastSummary, StockoutRiskLevel } from '../../../types/erp.js';
import { Badge } from '../../ui/Badge.js';
import { formatCurrency } from '../../../lib/i18n.js';
import { hasPermission, isReadOnlyRole } from '../../../lib/permissions.js';

interface InventoryForecastingModuleProps {
  onRefreshProducts?: () => void;
  onNavigateToProcurement?: () => void;
  currentUser?: any;
}

export const InventoryForecastingModule: React.FC<InventoryForecastingModuleProps> = ({
  onRefreshProducts,
  onNavigateToProcurement,
  currentUser,
}) => {
  const [summary, setSummary] = useState<InventoryForecastSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulation / Scenario Controls
  const [serviceLevel, setServiceLevel] = useState<number>(95);
  const [demandSurge, setDemandSurge] = useState<number>(0);
  const [leadTimeBuffer, setLeadTimeBuffer] = useState<number>(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Action states
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<{ id: string; text: string } | null>(null);

  const fetchForecast = async (sLevel = serviceLevel, surge = demandSurge, buffer = leadTimeBuffer) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getInventoryForecast({
        serviceLevel: sLevel,
        demandSurge: surge,
        leadTimeBuffer: buffer,
      });
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const handleApplyThresholds = async (item: InventoryForecastItem) => {
    try {
      setActionLoadingId(item.productId);
      const res = await api.applyInventoryForecast({
        productId: item.productId,
        suggestedReorderPoint: item.suggestedReorderPoint,
        suggestedReorderQuantity: item.suggestedReorderQuantity,
      });
      setActionSuccessMsg({
        id: item.productId,
        text: `Updated ROP to ${item.suggestedReorderPoint.toLocaleString()} ${item.unit}!`,
      });
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onRefreshProducts) onRefreshProducts();
      await fetchForecast();
    } catch (err: any) {
      alert(err.message || 'Failed to apply thresholds');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGeneratePO = async (item: InventoryForecastItem) => {
    try {
      setActionLoadingId(item.productId);
      const res = await api.createReplenishmentPO({
        productId: item.productId,
        quantity: item.suggestedReorderQuantity,
      });
      setActionSuccessMsg({
        id: item.productId,
        text: `Created draft ${res.data?.poNumber || 'Purchase Order'}!`,
      });
      setTimeout(() => setActionSuccessMsg(null), 4000);
      if (onRefreshProducts) onRefreshProducts();
      await fetchForecast();
    } catch (err: any) {
      alert(err.message || 'Failed to create replenishment PO');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Categories list
  const categories = useMemo(() => {
    if (!summary?.items) return [];
    const set = new Set(summary.items.map((i) => i.category));
    return Array.from(set);
  }, [summary]);

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!summary?.items) return [];
    return summary.items.filter((item) => {
      const matchesSearch =
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || item.category === selectedCategory;

      const matchesRisk =
        selectedRiskFilter === 'ALL' ||
        (selectedRiskFilter === 'CRITICAL' && item.stockoutRiskLevel === 'CRITICAL') ||
        (selectedRiskFilter === 'REORDER' &&
          (item.stockoutRiskLevel === 'CRITICAL' || item.stockoutRiskLevel === 'REORDER_NOW')) ||
        (selectedRiskFilter === 'OPTIMAL' && item.stockoutRiskLevel === 'OPTIMAL') ||
        (selectedRiskFilter === 'OVERSTOCKED' && item.stockoutRiskLevel === 'OVERSTOCKED');

      return matchesSearch && matchesCat && matchesRisk;
    });
  }, [summary, searchQuery, selectedCategory, selectedRiskFilter]);

  // Risk badge helper
  const renderRiskBadge = (risk: StockoutRiskLevel, daysRemaining: number, leadTime: number) => {
    switch (risk) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            CRITICAL STOCKOUT ({daysRemaining}d left &lt; {leadTime}d lead)
          </span>
        );
      case 'REORDER_NOW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            REORDER TRIGGERED (Below ROP)
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            MODERATE ({daysRemaining}d remaining)
          </span>
        );
      case 'OVERSTOCKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Package className="w-3 h-3 text-purple-600" />
            OVERSTOCKED (Excess Buffer)
          </span>
        );
      case 'OPTIMAL':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            OPTIMAL STOCK POSTURE
          </span>
        );
    }
  };

  const exportForecastCSV = () => {
    if (!summary?.items) return;
    const headers = [
      'SKU',
      'Name',
      'Category',
      'Unit',
      'Current Stock',
      'Daily Demand',
      'Lead Time (Days)',
      'Days Remaining',
      'Current ROP',
      'AI Suggested ROP',
      'Suggested EOQ',
      'Estimated Reorder Cost (BDT)',
      'Stockout Risk Level',
      'Preferred Supplier',
    ];
    const rows = summary.items.map((i) => [
      `"${i.sku}"`,
      `"${i.name}"`,
      `"${i.category}"`,
      `"${i.unit}"`,
      i.currentStock,
      i.avgDailyDemand,
      i.supplierLeadTimeDays,
      i.daysOfInventoryRemaining,
      i.currentReorderLevel,
      i.suggestedReorderPoint,
      i.suggestedReorderQuantity,
      i.estimatedReorderCost,
      i.stockoutRiskLevel,
      `"${i.preferredSupplierName || 'Standard Supplier'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ai-inventory-forecasting-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="ai-inventory-forecasting-module" className="space-y-6">
      {/* Top Banner & AI Status */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 rounded-2xl border border-slate-700 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                Gemini 3.8 Flash & Poisson-Normal ROP Engine
              </span>
              <span className="text-2xs text-slate-400">
                {summary ? `Updated ${new Date(summary.lastForecastGeneratedAt).toLocaleTimeString()}` : ''}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              AI-Driven Inventory Replenishment & Lead Time Forecasting
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Dynamically computes statistical safety stocks, continuous-review reorder points (ROP), and Economic Order Quantities (EOQ) based on multi-period sales velocity, supplier delivery variances, and lead time risk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchForecast()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Recalculate AI Forecast
            </button>
            <button
              onClick={exportForecastCSV}
              disabled={!summary?.items}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* AI Executive Supply Chain Briefing */}
        {summary?.aiExecutiveSummary && (
          <div className="mt-5 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-xs text-slate-200 leading-relaxed">
                <span className="font-bold text-amber-300 uppercase tracking-wider mr-2">Executive AI Supply Brief:</span>
                {summary.aiExecutiveSummary}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold tracking-wider text-slate-500">Monitored SKUs</span>
              <Package className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xl font-bold font-mono text-slate-900 mt-1">{summary.totalSkusAnalyzed}</p>
            <p className="text-3xs text-slate-500 mt-0.5">Active catalog items</p>
          </div>

          <div
            className={`p-4 rounded-xl border shadow-2xs ${
              summary.criticalStockoutCount > 0
                ? 'bg-rose-50/70 border-rose-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold tracking-wider text-rose-700">Critical Stockouts</span>
              <ShieldAlert className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-xl font-bold font-mono text-rose-900 mt-1">{summary.criticalStockoutCount}</p>
            <p className="text-3xs text-rose-700 mt-0.5">Days remaining &lt; Lead time</p>
          </div>

          <div
            className={`p-4 rounded-xl border shadow-2xs ${
              summary.reorderRecommendedCount > 0
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold tracking-wider text-amber-800">Reorders Triggered</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-bold font-mono text-amber-900 mt-1">{summary.reorderRecommendedCount}</p>
            <p className="text-3xs text-amber-700 mt-0.5">Stock &le; Suggested ROP</p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold tracking-wider text-slate-500">Replenishment Capital</span>
              <ShoppingCart className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-bold font-mono text-blue-900 mt-1">
              {formatCurrency(summary.totalRecommendedReplenishmentValue)}
            </p>
            <p className="text-3xs text-slate-500 mt-0.5">Recommended EOQ batch investment</p>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-3xs uppercase font-bold tracking-wider text-slate-500">Revenue at Risk</span>
              <TrendingUp className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-lg font-bold font-mono text-rose-700 mt-1">
              {formatCurrency(summary.potentialStockoutRevenueAtRisk)}
            </p>
            <p className="text-3xs text-slate-500 mt-0.5">Potential unfulfilled sales volume</p>
          </div>
        </div>
      )}

      {/* Interactive Scenario & Sensitivity Simulator */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">Supply Chain Scenario & Sensitivity Simulator</h3>
          </div>
          <span className="text-2xs text-slate-500">Adjust parameters to simulate supply shocks and seasonal spikes</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Service Level */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">Fulfillment Service Level (Z-Score)</label>
              <span className="font-mono font-bold text-indigo-600">{serviceLevel}%</span>
            </div>
            <div className="flex gap-2">
              {[90, 95, 99].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setServiceLevel(lvl);
                    fetchForecast(lvl, demandSurge, leadTimeBuffer);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-2xs font-semibold border transition-all ${
                    serviceLevel === lvl
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lvl}% {lvl === 90 ? '(Lean)' : lvl === 95 ? '(Standard)' : '(Critical)'}
                </button>
              ))}
            </div>
            <p className="text-3xs text-slate-400">Higher service level increases safety buffer against stockouts.</p>
          </div>

          {/* Demand Surge Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">Seasonal Demand Surge</label>
              <span className="font-mono font-bold text-indigo-600">
                {demandSurge > 0 ? `+${demandSurge}%` : `${demandSurge}%`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={demandSurge}
              onChange={(e) => setDemandSurge(Number(e.target.value))}
              onMouseUp={() => fetchForecast(serviceLevel, demandSurge, leadTimeBuffer)}
              onTouchEnd={() => fetchForecast(serviceLevel, demandSurge, leadTimeBuffer)}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-3xs text-slate-400">
              <span>0% (Steady-state)</span>
              <span>+25% (Festive/Peak)</span>
              <span>+50% (Surge)</span>
            </div>
          </div>

          {/* Lead Time Congestion Buffer */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">Port / Logistics Congestion Buffer</label>
              <span className="font-mono font-bold text-indigo-600">+{leadTimeBuffer} days</span>
            </div>
            <div className="flex gap-2">
              {[0, 3, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => {
                    setLeadTimeBuffer(days);
                    fetchForecast(serviceLevel, demandSurge, days);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-2xs font-semibold border transition-all ${
                    leadTimeBuffer === days
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {days === 0 ? 'Normal (+0d)' : `+${days} Days Delay`}
                </button>
              ))}
            </div>
            <p className="text-3xs text-slate-400">Simulates customs or shipping delays on supplier arrivals.</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Risk Filter:</span>
          {[
            { key: 'ALL', label: 'All Items' },
            { key: 'CRITICAL', label: 'Critical Stockouts' },
            { key: 'REORDER', label: 'Reorders Needed' },
            { key: 'OPTIMAL', label: 'Optimal' },
            { key: 'OVERSTOCKED', label: 'Overstocked' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setSelectedRiskFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-2xs font-semibold transition-all ${
                selectedRiskFilter === f.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Search SKU or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none w-48 sm:w-60"
          />
        </div>
      </div>

      {/* Forecasting Items Table / Card Matrix */}
      {loading && !summary ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Calculating replenishment models & lead time analysis...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-600">No inventory items match the selected filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.productId;
            const stockPercentOfROP = item.suggestedReorderPoint > 0
              ? Math.min(100, Math.round((item.currentStock / item.suggestedReorderPoint) * 100))
              : 100;

            const isCritical = item.stockoutRiskLevel === 'CRITICAL';
            const isReorder = item.stockoutRiskLevel === 'REORDER_NOW';

            // Chart data for item dynamics
            const chartData = [
              {
                metric: 'Current On-Hand',
                quantity: item.currentStock,
                fill: isCritical ? '#e11d48' : isReorder ? '#f59e0b' : '#10b981',
              },
              {
                metric: 'Lead Time Demand',
                quantity: item.leadTimeDemand,
                fill: '#6366f1',
              },
              {
                metric: 'Safety Stock Buffer',
                quantity: item.safetyStock,
                fill: '#38bdf8',
              },
              {
                metric: 'Suggested ROP',
                quantity: item.suggestedReorderPoint,
                fill: '#475569',
              },
              {
                metric: 'Suggested EOQ',
                quantity: item.suggestedReorderQuantity,
                fill: '#2563eb',
              },
            ];

            return (
              <div
                key={item.productId}
                className={`bg-white rounded-xl border transition-all ${
                  isCritical
                    ? 'border-rose-300 shadow-sm ring-1 ring-rose-200'
                    : isReorder
                    ? 'border-amber-300 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Card Main Row */}
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Product Info & Risk Badge */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {item.sku}
                        </span>
                        <Badge variant="neutral">{item.category}</Badge>
                        <span className="text-3xs text-slate-400 font-medium">Type: {item.type}</span>
                        {renderRiskBadge(item.stockoutRiskLevel, item.daysOfInventoryRemaining, item.supplierLeadTimeDays)}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 truncate">{item.name}</h3>

                      <p className="text-2xs text-slate-500">
                        Preferred Vendor:{' '}
                        <span className="font-semibold text-slate-700">
                          {item.preferredSupplierName || 'Primary Manufacturing Partner'}
                        </span>
                        {' • '}Unit Cost: <span className="font-mono">{formatCurrency(item.costPrice)}</span>
                      </p>
                    </div>

                    {/* Middle: On-Hand vs ROP Bar */}
                    <div className="w-full lg:w-72 space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex justify-between text-2xs">
                        <span className="text-slate-500 font-medium">Stock vs AI Reorder Point</span>
                        <span className="font-mono font-bold text-slate-900">
                          {item.currentStock.toLocaleString()} / {item.suggestedReorderPoint.toLocaleString()} {item.unit}
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${Math.min(100, stockPercentOfROP)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCritical ? 'bg-rose-600' : isReorder ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                        />
                      </div>

                      <div className="flex justify-between text-3xs text-slate-500 font-mono">
                        <span>
                          Run-rate: {item.avgDailyDemand} {item.unit}/day
                        </span>
                        <span className={isCritical ? 'text-rose-600 font-bold' : ''}>
                          {item.daysOfInventoryRemaining} days left
                        </span>
                      </div>
                    </div>

                    {/* Right: Suggested Replenishment Metrics */}
                    <div className="flex items-center gap-4 lg:text-right shrink-0">
                      <div>
                        <span className="text-3xs uppercase font-bold text-indigo-700">Suggested EOQ</span>
                        <p className="text-sm font-bold font-mono text-indigo-950">
                          {item.suggestedReorderQuantity.toLocaleString()} {item.unit}
                        </p>
                        <p className="text-3xs text-slate-500 font-mono">
                          Est. {formatCurrency(item.estimatedReorderCost)}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
                        {isReadOnlyRole(currentUser?.role) ? (
                          <span
                            title={`Role ${currentUser?.role || 'Auditor'} has read-only access. Modification of ROP parameters disabled.`}
                            className="px-2.5 py-1.5 text-2xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                          >
                            <Check className="w-3 h-3 text-slate-400" />
                            ROP Locked
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApplyThresholds(item)}
                            disabled={actionLoadingId === item.productId}
                            title="Apply this suggested ROP to Product Master"
                            className="px-2.5 py-1.5 text-2xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            Apply ROP
                          </button>
                        )}

                        {isReadOnlyRole(currentUser?.role) ? (
                          <span
                            title={`Role ${currentUser?.role || 'Auditor'} has read-only access. Purchase order creation disabled.`}
                            className="px-3 py-1.5 text-2xs font-semibold bg-slate-100 text-slate-400 border border-slate-200 rounded-lg flex items-center justify-center gap-1 cursor-not-allowed"
                          >
                            <ShoppingCart className="w-3 h-3 text-slate-400" />
                            PO Locked
                          </span>
                        ) : (
                          <button
                            onClick={() => handleGeneratePO(item)}
                            disabled={actionLoadingId === item.productId}
                            title="Create replenishment Purchase Order"
                            className="px-3 py-1.5 text-2xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-2xs flex items-center justify-center gap-1"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Order EOQ
                          </button>
                        )}

                        <button
                          onClick={() => setExpandedItemId(isExpanded ? null : item.productId)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="View mathematical dynamics"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Feedback toast */}
                  {actionSuccessMsg?.id === item.productId && (
                    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{actionSuccessMsg.text}</span>
                    </div>
                  )}

                  {/* AI Rationale Snippet */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-2xs text-slate-600">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-800">AI Assessment: </span>
                      {item.aiRationale}
                      <span className="ml-2 font-semibold text-indigo-700">{item.aiActionRecommendation}</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Dynamics Panel with Chart */}
                {isExpanded && (
                  <div className="bg-slate-50/80 p-5 border-t border-slate-200 rounded-b-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                          Inventory Buffer & Lead Time Anatomy for {item.sku}
                        </h4>
                        <p className="text-3xs text-slate-500">
                          Lead Time: {item.supplierLeadTimeDays} days (Variance: &plusmn;{item.leadTimeVarianceDays}d) • Daily Demand: {item.avgDailyDemand} {item.unit}/day (&plusmn;{item.demandStdDev}) • Service Level: {(item.serviceLevelZ === 1.65 ? '95%' : item.serviceLevelZ === 2.33 ? '99%' : '90%')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-3xs font-mono">
                        <span className="text-slate-600">
                          Current Master ROP: <strong className="text-slate-900">{item.currentReorderLevel} {item.unit}</strong>
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-indigo-700">
                          AI Suggested ROP: <strong className="text-indigo-900">{item.suggestedReorderPoint} {item.unit}</strong> (
                          {item.reorderPointDelta >= 0 ? `+${item.reorderPointDelta}` : item.reorderPointDelta})
                        </span>
                      </div>
                    </div>

                    {/* Breakdown Chart */}
                    <div className="h-56 w-full bg-white p-3 rounded-lg border border-slate-200">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="metric" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                          <Tooltip
                            formatter={(val: any) => [`${Number(val).toLocaleString()} ${item.unit}`, 'Quantity']}
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Mathematical Formula Footnote */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-3xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200">
                      <div>
                        <span className="font-bold text-slate-700">Lead Time Demand (LTD):</span>
                        <p className="font-mono mt-0.5">
                          {item.avgDailyDemand} &times; {item.supplierLeadTimeDays}d = {item.leadTimeDemand} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Safety Stock (SS):</span>
                        <p className="font-mono mt-0.5">
                          Z &times; &radic;(L&middot;&sigma;<sub>d</sub>&sup2; + d&sup2;&middot;&sigma;<sub>L</sub>&sup2;) = {item.safetyStock} {item.unit}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700">Wilson EOQ:</span>
                        <p className="font-mono mt-0.5">
                          &radic;(2DS/H) = {item.suggestedReorderQuantity} {item.unit} (Hold: 22%)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
