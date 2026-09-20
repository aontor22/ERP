import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar,
  ChevronDown,
  Clock,
  RotateCcw,
  Check,
  CalendarRange,
  ArrowRight,
  X,
  Filter,
} from 'lucide-react';

export type DateRangePreset = 'last30' | 'last90' | 'ytd' | 'all' | 'custom';

export interface DateRange {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

// Compute reference dates relative to the active fiscal timeline (default anchor: 2026-09-18)
export function getPresetDateRange(preset: DateRangePreset, anchorDateStr?: string): DateRange {
  const anchor = anchorDateStr ? new Date(anchorDateStr) : new Date();
  // Ensure valid date
  const baseDate = isNaN(anchor.getTime()) ? new Date('2026-09-18') : anchor;
  const currentYear = baseDate.getFullYear();
  const todayStr = baseDate.toISOString().split('T')[0];

  switch (preset) {
    case 'last30': {
      const start = new Date(baseDate);
      start.setDate(start.getDate() - 30);
      return {
        preset: 'last30',
        startDate: start.toISOString().split('T')[0],
        endDate: todayStr,
        label: 'Last 30 Days',
      };
    }
    case 'last90': {
      const start = new Date(baseDate);
      start.setDate(start.getDate() - 90);
      return {
        preset: 'last90',
        startDate: start.toISOString().split('T')[0],
        endDate: todayStr,
        label: 'Last 90 Days',
      };
    }
    case 'ytd': {
      const startStr = `${currentYear}-01-01`;
      return {
        preset: 'ytd',
        startDate: startStr,
        endDate: todayStr,
        label: `Year to Date (${currentYear})`,
      };
    }
    case 'all':
    default: {
      return {
        preset: 'all',
        startDate: '2025-10-01',
        endDate: todayStr,
        label: 'All Time (12M Audited)',
      };
    }
  }
}

export interface PreviousPeriodInfo {
  startDate: string;
  endDate: string;
  label: string;
  shortLabel: string;
  periodType: 'MoM' | 'QoQ' | 'YoY' | 'Prior Period';
}

// Compute the preceding comparison window based on the active date range
export function getPreviousDateRange(range: DateRange): PreviousPeriodInfo {
  const currentStart = new Date(range.startDate);
  const currentEnd = new Date(range.endDate);

  if (range.preset === 'last30') {
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 29);
    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
      label: 'Prior 30 Days',
      shortLabel: 'Prior 30D',
      periodType: 'MoM',
    };
  }

  if (range.preset === 'last90') {
    const prevEnd = new Date(currentStart);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - 89);
    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
      label: 'Prior 90 Days',
      shortLabel: 'Prior 90D',
      periodType: 'QoQ',
    };
  }

  if (range.preset === 'ytd') {
    const prevStartYear = currentStart.getFullYear() - 1;
    const prevStart = new Date(currentStart);
    prevStart.setFullYear(prevStartYear);
    const prevEnd = new Date(currentEnd);
    prevEnd.setFullYear(currentEnd.getFullYear() - 1);
    return {
      startDate: prevStart.toISOString().split('T')[0],
      endDate: prevEnd.toISOString().split('T')[0],
      label: `Same Period ${prevStartYear} (YoY)`,
      shortLabel: `YoY (${prevStartYear})`,
      periodType: 'YoY',
    };
  }

  if (range.preset === 'all') {
    return {
      startDate: '2024-10-01',
      endDate: '2025-09-30',
      label: 'Prior Fiscal Year (FY24-25)',
      shortLabel: 'FY24-25',
      periodType: 'YoY',
    };
  }

  // Custom date range: calculate exact duration in days
  const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime());
  const diffDays = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  const prevEnd = new Date(currentStart);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - (diffDays - 1));
  return {
    startDate: prevStart.toISOString().split('T')[0],
    endDate: prevEnd.toISOString().split('T')[0],
    label: `Prior ${diffDays} Days`,
    shortLabel: `Prior ${diffDays}D`,
    periodType: 'Prior Period',
  };
}

// Map month name abbreviation to 2-digit month string
const MONTH_ABBR_MAP: Record<string, string> = {
  jan: '01',
  feb: '02',
  mar: '03',
  apr: '04',
  may: '05',
  jun: '06',
  jul: '07',
  aug: '08',
  sep: '09',
  oct: '10',
  nov: '11',
  dec: '12',
};

// Converts trend item (e.g., month: "Oct '25" or fullMonth: "October 2025") to "YYYY-MM"
export function getMonthKeyFromTrend(trend: { month?: string; fullMonth?: string }): string | null {
  if (trend.fullMonth) {
    const parts = trend.fullMonth.trim().split(/\s+/);
    if (parts.length >= 2) {
      const monthPrefix = parts[0].slice(0, 3).toLowerCase();
      const monthNum = MONTH_ABBR_MAP[monthPrefix];
      const year = parts[1];
      if (monthNum && year) {
        return `${year}-${monthNum}`;
      }
    }
  }

  if (trend.month) {
    // E.g. "Oct '25"
    const match = trend.month.match(/([a-zA-Z]{3})\s*'?(\d{2})/);
    if (match) {
      const monthPrefix = match[1].toLowerCase();
      const monthNum = MONTH_ABBR_MAP[monthPrefix];
      const shortYear = match[2];
      const fullYear = `20${shortYear}`;
      if (monthNum) {
        return `${fullYear}-${monthNum}`;
      }
    }
  }

  return null;
}

// Checks if a date falls within the selected date range
export function isDateInDateRange(dateStr: string | undefined | null, range: DateRange): boolean {
  if (!dateStr) return true;
  const cleanDate = dateStr.split('T')[0];
  if (range.startDate && cleanDate < range.startDate) return false;
  if (range.endDate && cleanDate > range.endDate) return false;
  return true;
}

// Filter monthly trends according to the selected date range
export function filterMonthlyTrendsByDateRange(
  trends: any[] | undefined,
  range: DateRange
): any[] {
  if (!trends || trends.length === 0) return [];
  if (range.preset === 'all') return trends;

  const startMonthKey = range.startDate.slice(0, 7); // e.g. "2026-01"
  const endMonthKey = range.endDate.slice(0, 7);     // e.g. "2026-09"

  const filtered = trends.filter((item) => {
    const monthKey = getMonthKeyFromTrend(item);
    if (!monthKey) return true;
    return monthKey >= startMonthKey && monthKey <= endMonthKey;
  });

  // If filtered is empty because range is too narrow, fall back to the closest month(s)
  if (filtered.length === 0) {
    const matched = trends.filter((item) => {
      const monthKey = getMonthKeyFromTrend(item);
      return monthKey === endMonthKey || monthKey === startMonthKey;
    });
    if (matched.length > 0) return matched;
    return trends.slice(-3); // fallback to latest quarter
  }

  return filtered;
}

interface ReportDateRangePickerProps {
  value: DateRange;
  onChange: (newRange: DateRange) => void;
  className?: string;
}

export const ReportDateRangePicker: React.FC<ReportDateRangePickerProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.startDate);
  const [customEnd, setCustomEnd] = useState(value.endDate);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Synchronize internal inputs when value prop changes
  useEffect(() => {
    setCustomStart(value.startDate);
    setCustomEnd(value.endDate);
  }, [value.startDate, value.endDate]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectPreset = (preset: DateRangePreset) => {
    setErrorMsg(null);
    if (preset === 'custom') {
      // Switch into custom mode without closing
      return;
    }
    const newRange = getPresetDateRange(preset);
    onChange(newRange);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    if (!customStart || !customEnd) {
      setErrorMsg('Please select both start and end dates.');
      return;
    }
    if (customStart > customEnd) {
      setErrorMsg('Start date must be before or equal to end date.');
      return;
    }
    setErrorMsg(null);
    onChange({
      preset: 'custom',
      startDate: customStart,
      endDate: customEnd,
      label: `Custom (${formatShortDate(customStart)} – ${formatShortDate(customEnd)})`,
    });
    setIsOpen(false);
  };

  const handleResetToAll = () => {
    setErrorMsg(null);
    onChange(getPresetDateRange('all'));
  };

  // Quick shortcut helper for specific quarters
  const handleSetQuickQuarter = (qStart: string, qEnd: string, qLabel: string) => {
    setCustomStart(qStart);
    setCustomEnd(qEnd);
    onChange({
      preset: 'custom',
      startDate: qStart,
      endDate: qEnd,
      label: qLabel,
    });
    setIsOpen(false);
  };

  function formatShortDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(month, 10) - 1;
      return `${day} ${monthNames[mIdx] || month} ${year}`;
    } catch {
      return dateStr;
    }
  }

  // Calculate day difference
  const daysDifference = useMemo(() => {
    try {
      const s = new Date(value.startDate).getTime();
      const e = new Date(value.endDate).getTime();
      const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 1;
    } catch {
      return 1;
    }
  }, [value.startDate, value.endDate]);

  const presetsList: { id: DateRangePreset; title: string; subtitle: string }[] = [
    { id: 'last30', title: 'Last 30 Days', subtitle: 'Recent trailing cycle' },
    { id: 'last90', title: 'Last 90 Days', subtitle: 'Past quarterly trajectory' },
    { id: 'ytd', title: 'Year to Date', subtitle: 'Jan 1 to present' },
    { id: 'all', title: 'All Time (12M)', subtitle: 'Full audited ledger period' },
    { id: 'custom', title: 'Custom Period', subtitle: 'User-specified calendar range' },
  ];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Date Range Picker Trigger Button */}
      <button
        type="button"
        id="report-date-range-picker-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
          value.preset !== 'all'
            ? 'bg-blue-50/70 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-300 ring-1 ring-blue-400/40'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        title="Filter reporting period across all KPI cards, financial ledgers, and Recharts trends"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0">
          <Calendar className="w-3.5 h-3.5" />
        </div>

        <div className="text-left flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 dark:text-white truncate">
              {value.label}
            </span>
            {value.preset !== 'all' && (
              <span className="text-3xs px-1.5 py-0.2 bg-blue-600 text-white rounded font-mono font-medium">
                {daysDifference}d
              </span>
            )}
          </div>
          <span className="text-3xs text-slate-500 dark:text-slate-400 font-mono">
            {formatShortDate(value.startDate)} – {formatShortDate(value.endDate)}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
          }`}
        />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          id="report-date-range-popover"
          className="absolute right-0 sm:left-0 z-50 mt-1.5 w-[330px] sm:w-[380px] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150 text-xs"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                Filter Reporting Period
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
              title="Close picker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Presets Grid */}
          <div className="py-3">
            <span className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-2">
              Standard Accounting Cycles
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presetsList.map((preset) => {
                const isSelected = value.preset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`flex items-start justify-between p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500 font-semibold'
                        : 'bg-slate-50/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{preset.title}</div>
                      <div className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {preset.subtitle}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date Inputs Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xs uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                Custom Calendar Range
              </span>
              <span className="text-3xs text-slate-500 dark:text-slate-400 font-mono">
                ISO (YYYY-MM-DD)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-3xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Start Date (From)
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-3xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  End Date (To)
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick Quarter / Fiscal Period Shortcuts */}
            <div className="mt-2.5 flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => handleSetQuickQuarter('2026-01-01', '2026-03-31', 'Q1 2026 (Jan–Mar)')}
                className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Q1 2026
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickQuarter('2026-04-01', '2026-06-30', 'Q2 2026 (Apr–Jun)')}
                className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Q2 2026
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickQuarter('2026-07-01', '2026-09-30', 'Q3 2026 (Jul–Sep)')}
                className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Q3 2026
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickQuarter('2026-09-01', '2026-09-30', 'Sep 2026 (Current Month)')}
                className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                This Month
              </button>
            </div>

            {errorMsg && (
              <div className="mt-2 text-3xs text-rose-600 dark:text-rose-400 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Actions */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetToAll}
                className="inline-flex items-center gap-1 text-2xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to All</span>
              </button>

              <button
                type="button"
                onClick={handleApplyCustom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>Apply Range</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
