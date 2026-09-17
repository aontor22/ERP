import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { formatCurrency } from '../../lib/i18n.js';

export interface MonthlyTrendDataPoint {
  month: string;
  fullMonth?: string;
  revenue: number;
  expenses?: number;
  profit?: number;
  salesGrowth?: number;
  procurementVolume?: number;
  target?: number;
}

interface MonthlyRevenueTrendsChartProps {
  data?: MonthlyTrendDataPoint[];
  invoices?: any[];
  title?: string;
  subtitle?: string;
  height?: number;
  showControls?: boolean;
}

// Default 12-month baseline if parent data is loading or partial
const DEFAULT_12M_TRENDS: MonthlyTrendDataPoint[] = [
  { month: "Oct '25", fullMonth: 'October 2025', revenue: 38200000, expenses: 26500000, profit: 11700000, salesGrowth: 4.2 },
  { month: "Nov '25", fullMonth: 'November 2025', revenue: 41000000, expenses: 28000000, profit: 13000000, salesGrowth: 7.3 },
  { month: "Dec '25", fullMonth: 'December 2025', revenue: 44500000, expenses: 30200000, profit: 14300000, salesGrowth: 8.5 },
  { month: "Jan '26", fullMonth: 'January 2026', revenue: 43000000, expenses: 29800000, profit: 13200000, salesGrowth: -3.4 },
  { month: "Feb '26", fullMonth: 'February 2026', revenue: 46800000, expenses: 31500000, profit: 15300000, salesGrowth: 8.8 },
  { month: "Mar '26", fullMonth: 'March 2026', revenue: 51200000, expenses: 34000000, profit: 17200000, salesGrowth: 9.4 },
  { month: "Apr '26", fullMonth: 'April 2026', revenue: 54500000, expenses: 36200000, profit: 18300000, salesGrowth: 6.4 },
  { month: "May '26", fullMonth: 'May 2026', revenue: 58000000, expenses: 38500000, profit: 19500000, salesGrowth: 6.4 },
  { month: "Jun '26", fullMonth: 'June 2026', revenue: 63200000, expenses: 41800000, profit: 21400000, salesGrowth: 9.0 },
  { month: "Jul '26", fullMonth: 'July 2026', revenue: 67500000, expenses: 44200000, profit: 23300000, salesGrowth: 6.8 },
  { month: "Aug '26", fullMonth: 'August 2026', revenue: 72800000, expenses: 47600000, profit: 25200000, salesGrowth: 7.9 },
  { month: "Sep '26", fullMonth: 'September 2026', revenue: 73200000, expenses: 48100000, profit: 25100000, salesGrowth: 0.5 },
];

export const MonthlyRevenueTrendsChart: React.FC<MonthlyRevenueTrendsChartProps> = ({
  data,
  invoices = [],
  title = 'Monthly Revenue Performance Trends',
  subtitle = '12-month audited operating revenue trajectory, net profit margin, and growth velocity',
  height = 320,
  showControls = true,
}) => {
  const [timeRange, setTimeRange] = useState<'12m' | '6m' | '3m'>('12m');
  const [viewMetric, setViewMetric] = useState<'all' | 'revenue_profit' | 'revenue_expenses' | 'revenue_only'>('revenue_profit');
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);

  // Derive consolidated dataset
  const chartData = useMemo(() => {
    const baseSource = (data && data.length > 0) ? data : DEFAULT_12M_TRENDS;
    
    // Slice based on time range
    let sliced = [...baseSource];
    if (timeRange === '3m') sliced = baseSource.slice(-3);
    else if (timeRange === '6m') sliced = baseSource.slice(-6);

    // Compute average revenue to provide benchmark target line
    const avgRev = sliced.reduce((acc, curr) => acc + (curr.revenue || 0), 0) / (sliced.length || 1);

    return sliced.map((item) => ({
      ...item,
      target: Math.round(avgRev * 1.05), // 5% above average target benchmark
    }));
  }, [data, timeRange]);

  // Executive summary metrics across the selected window
  const metrics = useMemo(() => {
    if (chartData.length === 0) {
      return {
        totalRevenue: 0,
        totalProfit: 0,
        avgRevenue: 0,
        peakMonth: '—',
        peakRevenue: 0,
        latestGrowth: 0,
        marginPercent: 0,
      };
    }

    const totalRev = chartData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalProf = chartData.reduce((sum, d) => sum + (d.profit || 0), 0);
    const avgRev = totalRev / chartData.length;

    let peakR = 0;
    let peakM = '';
    chartData.forEach((d) => {
      if ((d.revenue || 0) > peakR) {
        peakR = d.revenue;
        peakM = d.fullMonth || d.month;
      }
    });

    const latestItem = chartData[chartData.length - 1];
    const latestGrowth = latestItem?.salesGrowth ?? 0;
    const margin = totalRev > 0 ? ((totalProf / totalRev) * 100) : 0;

    return {
      totalRevenue: totalRev,
      totalProfit: totalProf,
      avgRevenue: avgRev,
      peakMonth: peakM,
      peakRevenue: peakR,
      latestGrowth,
      marginPercent: Number(margin.toFixed(1)),
    };
  }, [chartData]);

  // Format currency in compact BDT format for chart axes
  const formatCompactBDT = (val: number) => {
    if (Math.abs(val) >= 10000000) {
      return `৳${(val / 10000000).toFixed(1)} Cr`;
    }
    if (Math.abs(val) >= 1000000) {
      return `৳${(val / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1000) {
      return `৳${(val / 1000).toFixed(0)}k`;
    }
    return `৳${val}`;
  };

  // Custom polished tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload as MonthlyTrendDataPoint;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-lg text-xs space-y-2 min-w-[210px] z-50">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {dataPoint.fullMonth || label}
            </span>
            {dataPoint.salesGrowth !== undefined && (
              <span
                className={`inline-flex items-center text-3xs font-semibold px-1.5 py-0.5 rounded ${
                  dataPoint.salesGrowth >= 0
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {dataPoint.salesGrowth >= 0 ? '+' : ''}{dataPoint.salesGrowth}% MoM
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Revenue:
              </span>
              <span className="font-mono font-bold text-blue-700 dark:text-blue-400">
                {formatCurrency(dataPoint.revenue)}
              </span>
            </div>

            {dataPoint.profit !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                  Net Profit:
                </span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(dataPoint.profit)}
                </span>
              </div>
            )}

            {dataPoint.expenses !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  Expenses:
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {formatCurrency(dataPoint.expenses)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4 transition-colors">
      {/* Chart Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            <span className="text-3xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 rounded">
              Line Visualization
            </span>
          </div>
          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        {showControls && (
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {/* Metric Mode Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-2xs">
              <button
                type="button"
                onClick={() => setViewMetric('revenue_profit')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMetric === 'revenue_profit'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Revenue & Profit
              </button>
              <button
                type="button"
                onClick={() => setViewMetric('revenue_expenses')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMetric === 'revenue_expenses'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Revenue vs Expenses
              </button>
              <button
                type="button"
                onClick={() => setViewMetric('revenue_only')}
                className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  viewMetric === 'revenue_only'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Revenue Only
              </button>
            </div>

            {/* Time Horizon Filter */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-2xs font-semibold">
              {(['12m', '6m', '3m'] as const).map((range) => (
                <button
                  key={range}
                  type="button"
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    timeRange === range
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Scannable Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/40">
          <span className="text-3xs uppercase font-bold text-blue-700 dark:text-blue-400 tracking-wider">
            Period Revenue
          </span>
          <p className="text-base font-bold font-mono text-blue-950 dark:text-blue-200 mt-0.5">
            {formatCompactBDT(metrics.totalRevenue)}
          </p>
          <span className="text-3xs text-slate-500 dark:text-slate-400">
            {chartData.length} months cumulative
          </span>
        </div>

        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
          <span className="text-3xs uppercase font-bold text-emerald-700 dark:text-emerald-400 tracking-wider">
            Avg Monthly Run Rate
          </span>
          <p className="text-base font-bold font-mono text-emerald-950 dark:text-emerald-200 mt-0.5">
            {formatCompactBDT(metrics.avgRevenue)}
          </p>
          <span className="text-3xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
            Margin {metrics.marginPercent}%
          </span>
        </div>

        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg border border-indigo-100 dark:border-indigo-900/40">
          <span className="text-3xs uppercase font-bold text-indigo-700 dark:text-indigo-400 tracking-wider">
            Peak Revenue Month
          </span>
          <p className="text-base font-bold font-mono text-indigo-950 dark:text-indigo-200 mt-0.5">
            {formatCompactBDT(metrics.peakRevenue)}
          </p>
          <span className="text-3xs text-slate-500 dark:text-slate-400 truncate block" title={metrics.peakMonth}>
            {metrics.peakMonth}
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-3xs uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">
            Latest MoM Velocity
          </span>
          <p className={`text-base font-bold font-mono mt-0.5 flex items-center gap-1 ${
            metrics.latestGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {metrics.latestGrowth >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            {metrics.latestGrowth >= 0 ? `+${metrics.latestGrowth}%` : `${metrics.latestGrowth}%`}
          </p>
          <span className="text-3xs text-slate-500 dark:text-slate-400">
            vs prior month cycle
          </span>
        </div>
      </div>

      {/* Main Recharts Line Visualization */}
      <div style={{ width: '100%', height }} className="pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 4 }}>
            <defs>
              <linearGradient id="revenueFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="profitFillGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCompactBDT}
              tick={{ fontSize: 10, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={65}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              iconType="circle"
              iconSize={8}
            />

            {/* Average Revenue Benchmark Line */}
            {showTargetLine && (
              <ReferenceLine
                y={metrics.avgRevenue}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{
                  value: `Average (${formatCompactBDT(metrics.avgRevenue)})`,
                  position: 'insideBottomRight',
                  fill: '#64748b',
                  fontSize: 10,
                }}
              />
            )}

            {/* Revenue Area Underlay for Depth */}
            <Area
              type="monotone"
              dataKey="revenue"
              fill="url(#revenueFillGradient)"
              stroke="none"
              legendType="none"
              tooltipType="none"
            />

            {/* Primary Monthly Revenue Line */}
            <Line
              type="monotone"
              dataKey="revenue"
              name="Monthly Operating Revenue"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
            />

            {/* Optional Net Profit Line */}
            {(viewMetric === 'all' || viewMetric === 'revenue_profit') && (
              <Line
                type="monotone"
                dataKey="profit"
                name="Net Audited Profit"
                stroke="#10b981"
                strokeWidth={2.5}
                strokeDasharray="4 2"
                dot={{ r: 3, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 5, fill: '#059669', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {/* Optional Operating Expenses Line */}
            {(viewMetric === 'all' || viewMetric === 'revenue_expenses') && (
              <Line
                type="monotone"
                dataKey="expenses"
                name="Operating Expenses"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f43f5e', strokeWidth: 1, stroke: '#ffffff' }}
                activeDot={{ r: 5, fill: '#e11d48', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
