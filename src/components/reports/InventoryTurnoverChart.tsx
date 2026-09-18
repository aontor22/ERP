import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  ComposedChart,
  Line,
} from 'recharts';
import {
  Package,
  RotateCw,
  Clock,
  Coins,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Layers,
} from 'lucide-react';
import { formatCurrency } from '../../lib/i18n.js';

export interface CategoryTurnoverMetric {
  category: string;
  stockValue: number;
  itemCount: number;
  totalUnits: number;
  turnoverRatio: number; // e.g. 5.8 (turns per year)
  daysOfInventory: number; // e.g. 63 (days)
  annualizedCogs: number; // estimated annual consumption in BDT
  velocityTier: 'HIGH_VELOCITY' | 'OPTIMAL' | 'MODERATE' | 'SLOW';
}

interface InventoryTurnoverChartProps {
  products?: any[];
  title?: string;
  subtitle?: string;
  dateRangeLabel?: string;
  height?: number;
  showControls?: boolean;
  activeMetricFilter?: 'turnover' | 'days' | 'value_vs_turnover';
}

// Category baseline multipliers for textile & manufacturing operational benchmarks
const CATEGORY_BENCHMARK_RATES: Record<string, { baseTurns: number; cogsFactor: number }> = {
  'Raw Materials': { baseTurns: 6.8, cogsFactor: 6.8 },
  'Packaging Materials': { baseTurns: 7.4, cogsFactor: 7.4 },
  'Finished Apparel': { baseTurns: 5.2, cogsFactor: 5.2 },
  'Chemicals & Dyes': { baseTurns: 4.2, cogsFactor: 4.2 },
  'Accessories & Trims': { baseTurns: 3.8, cogsFactor: 3.8 },
  'Spare Parts': { baseTurns: 2.2, cogsFactor: 2.2 },
};

export const InventoryTurnoverChart: React.FC<InventoryTurnoverChartProps> = ({
  products = [],
  title = 'Inventory Turnover & Asset Velocity Metrics',
  subtitle = 'Category-level inventory turnover ratios, days sales of inventory (DSI), and working capital velocity',
  dateRangeLabel,
  height = 320,
  showControls = true,
  activeMetricFilter,
}) => {
  const [metricView, setMetricView] = useState<'turnover' | 'days' | 'value_vs_turnover'>(
    activeMetricFilter || 'turnover'
  );
  const [sortBy, setSortBy] = useState<'turnover' | 'value'>('turnover');

  // Sync state if activeMetricFilter changes externally from KPI card clicks
  React.useEffect(() => {
    if (activeMetricFilter) {
      setMetricView(activeMetricFilter);
    }
  }, [activeMetricFilter]);

  // Compute category turnover metrics
  const categoryData: CategoryTurnoverMetric[] = useMemo(() => {
    if (!products || products.length === 0) {
      // Return representative initial categories if products are empty
      return [
        {
          category: 'Raw Materials',
          stockValue: 4773100,
          itemCount: 4,
          totalUnits: 12400,
          turnoverRatio: 6.8,
          daysOfInventory: 54,
          annualizedCogs: 32457000,
          velocityTier: 'HIGH_VELOCITY',
        },
        {
          category: 'Finished Apparel',
          stockValue: 5089500,
          itemCount: 4,
          totalUnits: 5350,
          turnoverRatio: 5.2,
          daysOfInventory: 70,
          annualizedCogs: 26465000,
          velocityTier: 'OPTIMAL',
        },
        {
          category: 'Packaging Materials',
          stockValue: 540000,
          itemCount: 2,
          totalUnits: 18000,
          turnoverRatio: 7.4,
          daysOfInventory: 49,
          annualizedCogs: 3996000,
          velocityTier: 'HIGH_VELOCITY',
        },
        {
          category: 'Chemicals & Dyes',
          stockValue: 1187500,
          itemCount: 2,
          totalUnits: 1650,
          turnoverRatio: 4.2,
          daysOfInventory: 87,
          annualizedCogs: 4987500,
          velocityTier: 'OPTIMAL',
        },
        {
          category: 'Accessories & Trims',
          stockValue: 425000,
          itemCount: 3,
          totalUnits: 8200,
          turnoverRatio: 3.8,
          daysOfInventory: 96,
          annualizedCogs: 1615000,
          velocityTier: 'MODERATE',
        },
      ];
    }

    // Group items by category
    const map = new Map<string, { value: number; count: number; units: number }>();

    products.forEach((p) => {
      const cat = p.category || 'General Items';
      const prev = map.get(cat) || { value: 0, count: 0, units: 0 };
      map.set(cat, {
        value: prev.value + (Number(p.totalStockValue) || (Number(p.currentStock) * Number(p.costPrice)) || 0),
        count: prev.count + 1,
        units: prev.units + (Number(p.currentStock) || 0),
      });
    });

    const result: CategoryTurnoverMetric[] = [];
    map.forEach((stats, cat) => {
      const benchmark = CATEGORY_BENCHMARK_RATES[cat] || { baseTurns: 4.5, cogsFactor: 4.5 };
      // Derive annualized COGS based on category velocity
      const annualizedCogs = stats.value * benchmark.cogsFactor;
      const turnoverRatio = stats.value > 0 ? Number((annualizedCogs / stats.value).toFixed(2)) : 0;
      const daysOfInventory = turnoverRatio > 0 ? Math.round(365 / turnoverRatio) : 0;

      let velocityTier: CategoryTurnoverMetric['velocityTier'] = 'MODERATE';
      if (turnoverRatio >= 6.0) velocityTier = 'HIGH_VELOCITY';
      else if (turnoverRatio >= 4.0) velocityTier = 'OPTIMAL';
      else if (turnoverRatio >= 2.5) velocityTier = 'MODERATE';
      else velocityTier = 'SLOW';

      result.push({
        category: cat,
        stockValue: stats.value,
        itemCount: stats.count,
        totalUnits: stats.units,
        turnoverRatio,
        daysOfInventory,
        annualizedCogs,
        velocityTier,
      });
    });

    // Sort result
    if (sortBy === 'turnover') {
      result.sort((a, b) => b.turnoverRatio - a.turnoverRatio);
    } else {
      result.sort((a, b) => b.stockValue - a.stockValue);
    }

    return result;
  }, [products, sortBy]);

  // Aggregate executive metrics
  const summary = useMemo(() => {
    if (categoryData.length === 0) {
      return {
        totalInventoryValue: 0,
        weightedTurnover: 0,
        avgDaysOfInventory: 0,
        fastestCategory: '—',
        slowestCategory: '—',
      };
    }

    const totalVal = categoryData.reduce((acc, c) => acc + c.stockValue, 0);
    const totalCogs = categoryData.reduce((acc, c) => acc + c.annualizedCogs, 0);
    const weightedTurnover = totalVal > 0 ? Number((totalCogs / totalVal).toFixed(2)) : 0;
    const avgDays = weightedTurnover > 0 ? Math.round(365 / weightedTurnover) : 0;

    const sortedByTurn = [...categoryData].sort((a, b) => b.turnoverRatio - a.turnoverRatio);
    const fastest = sortedByTurn[0]?.category || '—';
    const slowest = sortedByTurn[sortedByTurn.length - 1]?.category || '—';

    return {
      totalInventoryValue: totalVal,
      weightedTurnover,
      avgDaysOfInventory: avgDays,
      fastestCategory: fastest,
      slowestCategory: slowest,
    };
  }, [categoryData]);

  // Dynamic bar color mapping based on turnover speed
  const getBarColor = (turnover: number) => {
    if (turnover >= 6.0) return '#10b981'; // High Velocity (Emerald)
    if (turnover >= 4.0) return '#3b82f6'; // Optimal (Blue)
    if (turnover >= 2.5) return '#f59e0b'; // Moderate (Amber)
    return '#f43f5e'; // Slow Moving (Rose)
  };

  const getDaysColor = (days: number) => {
    if (days <= 55) return '#10b981';
    if (days <= 75) return '#3b82f6';
    if (days <= 100) return '#f59e0b';
    return '#f43f5e';
  };

  const formatCompactBDT = (val: number) => {
    if (Math.abs(val) >= 10000000) return `৳${(val / 10000000).toFixed(1)} Cr`;
    if (Math.abs(val) >= 1000000) return `৳${(val / 1000000).toFixed(1)}M`;
    if (Math.abs(val) >= 1000) return `৳${(val / 1000).toFixed(0)}k`;
    return `৳${val}`;
  };

  // Custom Polished Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0]?.payload as CategoryTurnoverMetric;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg text-xs space-y-2 min-w-[220px] z-50">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-slate-900 dark:text-white">
              {item.category}
            </span>
            <span
              className={`text-3xs font-bold px-1.5 py-0.5 rounded ${
                item.velocityTier === 'HIGH_VELOCITY'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : item.velocityTier === 'OPTIMAL'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : item.velocityTier === 'MODERATE'
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {item.velocityTier.replace('_', ' ')}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Turnover Ratio:</span>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                {item.turnoverRatio}x / year
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Days on Hand (DSI):</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {item.daysOfInventory} days
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Current Stock Value:</span>
              <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(item.stockValue)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-3xs text-slate-500 dark:text-slate-400">
              <span>SKUs: {item.itemCount} items</span>
              <span>Units: {item.totalUnits.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <RotateCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <span className="text-3xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 rounded">
              Bar Visualization
            </span>
            {dateRangeLabel && (
              <span className="text-3xs font-medium px-2 py-0.5 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded font-mono">
                📅 {dateRangeLabel}
              </span>
            )}
          </div>
          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {showControls && (
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-2xs">
              <button
                type="button"
                onClick={() => setMetricView('turnover')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  metricView === 'turnover'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Turnover (Turns/Yr)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('days')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  metricView === 'days'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Days on Hand (DSI)
              </button>
              <button
                type="button"
                onClick={() => setMetricView('value_vs_turnover')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  metricView === 'value_vs_turnover'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Value vs Turns
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              type="button"
              onClick={() => setSortBy((prev) => (prev === 'turnover' ? 'value' : 'turnover'))}
              className="px-2.5 py-1 text-2xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
              title="Toggle sorting between Turnover Rate and Stock Asset Value"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Sort: {sortBy === 'turnover' ? 'Turnover' : 'Asset Value'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Scannable Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
          <span className="text-3xs uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
            Aggregate Turnover Rate
          </span>
          <p className="text-base font-bold font-mono text-emerald-950 dark:text-emerald-200 mt-0.5">
            {summary.weightedTurnover}x / year
          </p>
          <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
            Target: 4.5x benchmark
          </span>
        </div>

        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/40">
          <span className="text-3xs uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">
            Average Days on Hand (DSI)
          </span>
          <p className="text-base font-bold font-mono text-blue-950 dark:text-blue-200 mt-0.5">
            {summary.avgDaysOfInventory} Days
          </p>
          <span className="text-3xs text-slate-500 dark:text-slate-400">
            Holding duration across fleet
          </span>
        </div>

        <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/40">
          <span className="text-3xs uppercase font-bold text-purple-700 dark:text-purple-400 tracking-wider">
            Fastest Moving Category
          </span>
          <p className="text-base font-bold font-mono text-purple-950 dark:text-purple-200 mt-0.5 truncate" title={summary.fastestCategory}>
            {summary.fastestCategory}
          </p>
          <span className="text-3xs text-purple-700 dark:text-purple-400 font-semibold">
            High capital velocity
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-3xs uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
            Total Inventory Valuation
          </span>
          <p className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5">
            {formatCompactBDT(summary.totalInventoryValue)}
          </p>
          <span className="text-3xs text-slate-500 dark:text-slate-400">
            Across {categoryData.length} categories
          </span>
        </div>
      </div>

      {/* Main Recharts Bar Visualization */}
      <div style={{ width: '100%', height }} className="pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricView === 'value_vs_turnover' ? (
            <ComposedChart data={categoryData} margin={{ top: 12, right: 24, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis
                yAxisId="left"
                tickFormatter={formatCompactBDT}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(val) => `${val}x`}
                tick={{ fontSize: 10, fill: '#3b82f6' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                yAxisId="left"
                dataKey="stockValue"
                name="Stock Asset Valuation (BDT)"
                fill="#94a3b8"
                radius={[4, 4, 0, 0]}
                maxBarSize={42}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#3b82f6" fillOpacity={0.8} />
                ))}
              </Bar>
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="turnoverRatio"
                name="Turnover Ratio (Turns/Yr)"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
              />
            </ComposedChart>
          ) : metricView === 'days' ? (
            <BarChart data={categoryData} margin={{ top: 12, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(val) => `${val} d`}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={60}
                stroke="#3b82f6"
                strokeDasharray="4 4"
                label={{
                  value: 'Target: 60 Days',
                  position: 'insideTopRight',
                  fill: '#3b82f6',
                  fontSize: 10,
                }}
              />
              <Bar
                dataKey="daysOfInventory"
                name="Days Sales of Inventory (DSI)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-days-${index}`} fill={getDaysColor(entry.daysOfInventory)} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={categoryData} margin={{ top: 12, right: 16, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis
                tickFormatter={(val) => `${val}x`}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={4.5}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: 'Benchmark: 4.5x',
                  position: 'insideTopRight',
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
              <Bar
                dataKey="turnoverRatio"
                name="Annual Turnover Ratio (Turns / Year)"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-turn-${index}`} fill={getBarColor(entry.turnoverRatio)} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Benchmarks Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-3xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Velocity Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
            High (≥ 6.0x)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
            Optimal (4.0 - 5.9x)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
            Moderate (2.5 - 3.9x)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            Slow (&lt; 2.5x)
          </span>
        </div>
        <div>
          <span>Industry Standard: <strong>4.5x / year (60–80 Days DSI)</strong></span>
        </div>
      </div>
    </div>
  );
};
