import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Percent,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  BarChart3,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '../../lib/i18n.js';
import { HistoricalMonthlyTrend } from '../../types/erp.js';

interface HistoricalTrendsChartProps {
  data?: HistoricalMonthlyTrend[] | any[];
  baseCurrency?: string;
}

type ViewMetric = 'all' | 'revenue_growth' | 'procurement' | 'profitability';
type TimeRange = '12m' | '6m' | '3m';

export const HistoricalTrendsChart: React.FC<HistoricalTrendsChartProps> = ({
  data = [],
  baseCurrency = 'BDT',
}) => {
  const [activeMetric, setActiveMetric] = useState<ViewMetric>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('12m');
  const [showTable, setShowTable] = useState(false);

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (timeRange === '3m') return data.slice(-3);
    if (timeRange === '6m') return data.slice(-6);
    return data; // '12m' (or full slice)
  }, [data, timeRange]);

  // Compute summary stats across the selected period
  const stats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalRevenue: 0,
        totalProcurement: 0,
        avgGrowth: 0,
        peakMonth: '',
        peakRevenue: 0,
        procToRevRatio: 0,
      };
    }

    const totalRev = filteredData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const totalProc = filteredData.reduce((sum, d) => sum + (d.procurementVolume || 0), 0);
    const growthSum = filteredData.reduce((sum, d) => sum + (d.salesGrowth || 0), 0);
    const avgGrowth = Number((growthSum / filteredData.length).toFixed(1));

    let maxRev = 0;
    let maxMonth = '';
    filteredData.forEach((d) => {
      if ((d.revenue || 0) > maxRev) {
        maxRev = d.revenue;
        maxMonth = d.month;
      }
    });

    const ratio = totalRev > 0 ? Number(((totalProc / totalRev) * 100).toFixed(1)) : 0;

    return {
      totalRevenue: totalRev,
      totalProcurement: totalProc,
      avgGrowth,
      peakMonth: maxMonth,
      peakRevenue: maxRev,
      procToRevRatio: ratio,
    };
  }, [filteredData]);

  const formatShortBDT = (val: number) => {
    if (Math.abs(val) >= 10000000) {
      return `৳${(val / 10000000).toFixed(1)} Cr`;
    }
    if (Math.abs(val) >= 1000000) {
      return `৳${(val / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1000) {
      return `৳${(val / 1000).toFixed(0)}k`;
    }
    return `৳${val.toLocaleString()}`;
  };

  // Custom Rich Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const row = payload[0].payload;
      return (
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl text-xs space-y-2 min-w-[210px] font-sans">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              {row.fullMonth || label}
            </span>
            <span
              className={`text-3xs font-mono font-bold px-1.5 py-0.5 rounded ${
                row.salesGrowth >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {row.salesGrowth >= 0 ? `+${row.salesGrowth}%` : `${row.salesGrowth}%`} MoM
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-2xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block" />
                Gross Revenue:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatShortBDT(row.revenue)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block" />
                Sales Growth:
              </span>
              <span
                className={`font-bold ${
                  row.salesGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {row.salesGrowth > 0 ? `+${row.salesGrowth}%` : `${row.salesGrowth}%`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600 inline-block" />
                Procurement Vol:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatShortBDT(row.procurementVolume)}
              </span>
            </div>

            {row.expenses && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block" />
                  Expenses:
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {formatShortBDT(row.expenses)}
                </span>
              </div>
            )}

            {row.profit && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300 font-bold">Net Profit:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatShortBDT(row.profit)}
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
    <div
      id="historical-trends-analytics-card"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4"
    >
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              12-Month Performance Trajectory & Historical Trends
            </h3>
            <span className="text-3xs font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded">
              Audited Ledger Trends
            </span>
          </div>
          <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
            Multi-metric historical trendline tracking monthly revenue, sales growth velocity, and raw material procurement volume.
          </p>
        </div>

        {/* View Mode and Horizon Selectors */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Metric View Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-2xs">
            <button
              onClick={() => setActiveMetric('all')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeMetric === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Metrics
            </button>
            <button
              onClick={() => setActiveMetric('revenue_growth')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeMetric === 'revenue_growth'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Revenue & Growth
            </button>
            <button
              onClick={() => setActiveMetric('procurement')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                activeMetric === 'procurement'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Procurement vs Revenue
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-2xs font-semibold">
            {(['12m', '6m', '3m'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === r
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {r === '12m' ? '12 Months' : r === '6m' ? '6 Months' : '3 Months'}
              </button>
            ))}
          </div>

          {/* Table Toggle Button */}
          <button
            onClick={() => setShowTable(!showTable)}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Toggle Detailed Monthly Data Table"
          >
            {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Metric Highlights Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-3xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Period Revenue</span>
            <span className="w-2 h-2 rounded-full bg-blue-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {formatShortBDT(stats.totalRevenue)}
            </span>
          </div>
          <span className="text-3xs text-slate-400 block mt-0.5">
            Peak: {stats.peakMonth} ({formatShortBDT(stats.peakRevenue)})
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-3xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Avg Sales Growth</span>
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span
              className={`text-base font-bold font-mono ${
                stats.avgGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              {stats.avgGrowth >= 0 ? `+${stats.avgGrowth}%` : `${stats.avgGrowth}%`}
            </span>
            <span className="text-3xs text-slate-400">MoM avg</span>
          </div>
          <span className="text-3xs text-emerald-600 dark:text-emerald-400 block mt-0.5 font-medium">
            Solid expansion trajectory
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-3xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Procurement Volume</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              {formatShortBDT(stats.totalProcurement)}
            </span>
          </div>
          <span className="text-3xs text-slate-400 block mt-0.5">
            Raw materials, yarn & trims
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-3xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Sourcing Intensity</span>
            <span className="w-2 h-2 rounded-full bg-purple-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base font-bold font-mono text-purple-700 dark:text-purple-300">
              {stats.procToRevRatio}%
            </span>
            <span className="text-3xs text-slate-400">Proc / Rev</span>
          </div>
          <span className="text-3xs text-slate-400 block mt-0.5">
            Controlled inventory replenishment
          </span>
        </div>
      </div>

      {/* Main Recharts Visualizer */}
      <div className="h-72 sm:h-80 w-full pt-2" id="recharts-historical-trends-container">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 15, right: 25, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorProcurement" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.4} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />

            {/* Left Y Axis for BDT Values (Revenue & Procurement) */}
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tickFormatter={(val) => `৳${(val / 1000000).toFixed(0)}M`}
            />

            {/* Right Y Axis for Percentage Growth */}
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#f59e0b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `${val}%`}
              domain={[-10, 20]}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              iconType="circle"
            />

            {/* Baseline for 0% growth */}
            <ReferenceLine yAxisId="right" y={0} stroke="#cbd5e1" strokeDasharray="2 2" />

            {/* Procurement Volume: Bar representation */}
            {(activeMetric === 'all' || activeMetric === 'procurement') && (
              <Bar
                yAxisId="left"
                dataKey="procurementVolume"
                name="Procurement Volume (BDT)"
                fill="url(#colorProcurement)"
                radius={[4, 4, 0, 0]}
                barSize={18}
              />
            )}

            {/* Revenue: Area representation */}
            {(activeMetric === 'all' || activeMetric === 'revenue_growth' || activeMetric === 'procurement') && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Revenue (BDT)"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            )}

            {/* Sales Growth %: Line with dot indicators */}
            {(activeMetric === 'all' || activeMetric === 'revenue_growth') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="salesGrowth"
                name="MoM Sales Growth Rate (%)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#f59e0b', strokeWidth: 1.5, stroke: '#ffffff' }}
                activeDot={{ r: 6, fill: '#d97706' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Expandable Monthly Audit Breakdown Table */}
      {showTable && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              12-Month Historical Financial & Procurement Ledger
            </h4>
            <span className="text-3xs text-slate-400">Values in BDT</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-2xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Revenue (BDT)</th>
                  <th className="py-2.5 px-3 text-right">MoM Growth</th>
                  <th className="py-2.5 px-3 text-right">Procurement Volume</th>
                  <th className="py-2.5 px-3 text-right">Proc. Units</th>
                  <th className="py-2.5 px-3 text-right">Expenses</th>
                  <th className="py-2.5 px-3 text-right">Net Profit</th>
                  <th className="py-2.5 px-3 text-right">Net Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {filteredData.map((m: any, idx: number) => {
                  const margin = m.revenue > 0 ? Number(((m.profit / m.revenue) * 100).toFixed(1)) : 0;
                  return (
                    <tr
                      key={m.month || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-slate-100">
                        {m.fullMonth || m.month}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-blue-700 dark:text-blue-400">
                        ৳{m.revenue.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded font-bold text-3xs ${
                            m.salesGrowth >= 0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {m.salesGrowth >= 0 ? (
                            <ArrowUpRight className="w-2.5 h-2.5 inline" />
                          ) : (
                            <ArrowDownRight className="w-2.5 h-2.5 inline" />
                          )}
                          {m.salesGrowth >= 0 ? `+${m.salesGrowth}%` : `${m.salesGrowth}%`}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-400 font-medium">
                        ৳{m.procurementVolume.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500">
                        {m.procurementUnits ? m.procurementUnits.toLocaleString() : '—'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                        ৳{m.expenses.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        ৳{m.profit.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 font-semibold">
                        {margin}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
