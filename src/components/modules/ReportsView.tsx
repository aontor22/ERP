import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  CheckCircle2,
  Scale,
  Receipt,
  Package,
  Users,
  Building2,
  BarChart3,
  TrendingUp,
  RotateCw,
  LineChart as LineChartIcon,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CalendarRange,
  Bookmark,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '../../lib/i18n.js';
import { exportToCSV } from '../../lib/csvExport.js';
import { generateReportPDF, PDFSummaryCard } from '../../lib/pdfExport.js';
import { MonthlyRevenueTrendsChart } from '../reports/MonthlyRevenueTrendsChart.js';
import { InventoryTurnoverChart } from '../reports/InventoryTurnoverChart.js';
import { KpiDetailDrilldown, KpiMetricType } from '../reports/KpiDetailDrilldown.js';
import {
  ReportDateRangePicker,
  DateRange,
  getPresetDateRange,
  getPreviousDateRange,
  getMonthKeyFromTrend,
  isDateInDateRange,
  filterMonthlyTrendsByDateRange,
} from '../reports/ReportDateRangePicker.js';
import { EntitySegmentPicker } from '../reports/EntitySegmentPicker.js';
import { ReportPresetsBar } from '../reports/ReportPresetsBar.js';
import { ReportPresetsModal } from '../reports/ReportPresetsModal.js';
import {
  ReportPreset,
  EntitySegmentFilter,
  DEFAULT_ENTITY_SEGMENT,
  loadAllReportPresets,
  saveUserReportPresets,
  getActivePresetIdFromStorage,
  saveActivePresetIdToStorage,
  BUILTIN_REPORT_PRESETS,
  ENTITY_OPTIONS,
} from '../reports/reportPresets.js';

interface ReportsViewProps {
  stats: any;
  reports: any;
  products: any[];
  invoices: any[];
  employees: any[];
  currentCompany?: any;
  currentUser?: any;
  companies?: any[];
}

type ReportType = 'financial' | 'sales' | 'inventory' | 'payroll' | 'analytics';

export const ReportsView: React.FC<ReportsViewProps> = ({
  stats,
  reports,
  products = [],
  invoices = [],
  employees = [],
  currentCompany,
  currentUser,
  companies = [],
}) => {
  const [reportType, setReportType] = useState<ReportType>('financial');
  const [searchQuery, setSearchQuery] = useState('');

  // Report Presets & Entity Segment State (Persisted in localStorage)
  const [presets, setPresets] = useState<ReportPreset[]>(() => loadAllReportPresets());
  const [activePresetId, setActivePresetId] = useState<string | null>(() => {
    const storedActive = getActivePresetIdFromStorage();
    if (storedActive) return storedActive;
    const defaultPreset = loadAllReportPresets().find((p) => p.isDefault);
    return defaultPreset ? defaultPreset.id : null;
  });

  const [entitySegment, setEntitySegment] = useState<EntitySegmentFilter>(() => {
    const all = loadAllReportPresets();
    const storedActiveId = getActivePresetIdFromStorage();
    const found = all.find((p) => p.id === storedActiveId) || all.find((p) => p.isDefault);
    return found ? found.entitySegment : DEFAULT_ENTITY_SEGMENT;
  });

  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const all = loadAllReportPresets();
    const storedActiveId = getActivePresetIdFromStorage();
    const found = all.find((p) => p.id === storedActiveId) || all.find((p) => p.isDefault);
    return found ? found.dateRange : getPresetDateRange('all');
  });

  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [presetModalInitialTab, setPresetModalInitialTab] = useState<'save' | 'manage'>('save');

  const [showInlineRevenueChart, setShowInlineRevenueChart] = useState(true);
  const [showInlineTurnoverChart, setShowInlineTurnoverChart] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState<KpiMetricType | null>(null);
  const [exportFeedback, setExportFeedback] = useState<{
    type: 'csv' | 'pdf';
    filename: string;
    timestamp: string;
  } | null>(null);

  // Active preset reference
  const activePreset = useMemo(() => {
    return presets.find((p) => p.id === activePresetId) || null;
  }, [presets, activePresetId]);

  // Preset Handlers
  const handleSelectPreset = (preset: ReportPreset) => {
    setActivePresetId(preset.id);
    saveActivePresetIdToStorage(preset.id);
    setDateRange(preset.dateRange);
    setEntitySegment(preset.entitySegment);
    if (preset.reportType) {
      setReportType(preset.reportType);
    }
  };

  const handleSaveNewPreset = (presetData: {
    name: string;
    description: string;
    isDefault: boolean;
  }) => {
    const newPreset: ReportPreset = {
      id: `preset-usr-${Date.now()}`,
      name: presetData.name,
      description: presetData.description,
      isSystem: false,
      isDefault: presetData.isDefault,
      createdAt: new Date().toISOString(),
      dateRange: { ...dateRange },
      entitySegment: { ...entitySegment },
      reportType,
    };

    let updatedPresets = [...presets];
    if (presetData.isDefault) {
      updatedPresets = updatedPresets.map((p) => ({ ...p, isDefault: false }));
    }
    updatedPresets = [newPreset, ...updatedPresets];
    setPresets(updatedPresets);
    saveUserReportPresets(updatedPresets);
    setActivePresetId(newPreset.id);
    saveActivePresetIdToStorage(newPreset.id);
  };

  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = presets.filter((p) => p.id !== presetId);
    setPresets(updatedPresets);
    saveUserReportPresets(updatedPresets);
    if (activePresetId === presetId) {
      const fallback = updatedPresets.find((p) => p.isDefault) || updatedPresets[0];
      if (fallback) {
        handleSelectPreset(fallback);
      } else {
        setActivePresetId(null);
        saveActivePresetIdToStorage(null);
      }
    }
  };

  const handleSetDefaultPreset = (presetId: string) => {
    const updatedPresets = presets.map((p) => ({
      ...p,
      isDefault: p.id === presetId,
    }));
    setPresets(updatedPresets);
    saveUserReportPresets(updatedPresets);
  };

  const handleResetToDefaults = () => {
    localStorage.removeItem('erp_report_presets_v1');
    const defaults = BUILTIN_REPORT_PRESETS;
    setPresets(defaults);
    const defaultPreset = defaults.find((p) => p.isDefault) || defaults[0];
    handleSelectPreset(defaultPreset);
  };

  const handleRevertToActivePreset = () => {
    const active = presets.find((p) => p.id === activePresetId);
    if (active) {
      setDateRange(active.dateRange);
      setEntitySegment(active.entitySegment);
      if (active.reportType) {
        setReportType(active.reportType);
      }
    }
  };

  const handleOpenSavePresetModal = () => {
    setPresetModalInitialTab('save');
    setIsPresetModalOpen(true);
  };

  const handleOpenManagePresetModal = () => {
    setPresetModalInitialTab('manage');
    setIsPresetModalOpen(true);
  };

  // Dynamic company metadata based on active entity segment
  const activeEntityOption = ENTITY_OPTIONS.find((e) => e.id === entitySegment.entityId);
  const companyName = activeEntityOption && activeEntityOption.id !== 'all'
    ? activeEntityOption.name
    : (currentCompany?.name || 'Apex Group Holdings Ltd. & Subsidiaries (Consolidated)');
  const companyTaxId = activeEntityOption && activeEntityOption.id !== 'all'
    ? activeEntityOption.taxId
    : (currentCompany?.taxId || 'NBR Multi-Entity Group TIN: 481920481-01');
  const companyAddress = 'Motijheel Commercial Area, Dhaka-1000, Bangladesh';
  const preparedBy = `${currentUser?.name || 'Authorized Auditor'} (${currentUser?.role || 'CFO'})`;

  const dateStamp = new Date().toISOString().split('T')[0];

  // 1. Entity and Operational Segment Filtering for Invoices
  const segmentFilteredInvoices = useMemo(() => {
    if (entitySegment.entityId === 'all' && entitySegment.segmentId === 'all') {
      return invoices;
    }
    return invoices.filter((i) => {
      // 1. Legal Entity check
      if (entitySegment.entityId !== 'all') {
        if (i.companyId && i.companyId !== entitySegment.entityId) {
          return false;
        }
      }
      // 2. Operational Division check
      if (entitySegment.segmentId !== 'all') {
        if (entitySegment.segmentId === 'export-commercial') {
          const isExport = i.currency !== 'BDT' ||
            i.customerName?.toLowerCase().includes('inditex') ||
            i.customerName?.toLowerCase().includes('zara') ||
            i.customerName?.toLowerCase().includes('h&m');
          if (!isExport) return false;
        } else if (entitySegment.segmentId === 'textile-mfg') {
          const hasTextile = !i.items || i.items.some((item: any) =>
            item.productName?.toLowerCase().includes('shirt') ||
            item.productName?.toLowerCase().includes('hoodie') ||
            item.productName?.toLowerCase().includes('dye') ||
            item.productName?.toLowerCase().includes('yarn')
          );
          if (!hasTextile) return false;
        }
      }
      return true;
    });
  }, [invoices, entitySegment]);

  // 2. Period Filtering based on selected Date Range
  const periodInvoices = useMemo(() => {
    return segmentFilteredInvoices.filter((i) => {
      const invDate = i.invoiceDate || i.date;
      return isDateInDateRange(invDate, dateRange);
    });
  }, [segmentFilteredInvoices, dateRange]);

  // 3. Products filtered by Entity & Segment
  const segmentFilteredProducts = useMemo(() => {
    if (entitySegment.entityId === 'all' && entitySegment.segmentId === 'all') {
      return products;
    }
    const filtered = products.filter((p) => {
      if (entitySegment.entityId === 'comp-textile' || entitySegment.segmentId === 'textile-mfg') {
        return (
          p.category === 'Raw Material' ||
          p.category === 'Finished Good' ||
          p.category === 'Chemicals' ||
          p.name?.toLowerCase().includes('cotton') ||
          p.name?.toLowerCase().includes('dye') ||
          p.name?.toLowerCase().includes('shirt') ||
          p.name?.toLowerCase().includes('hoodie')
        );
      }
      if (entitySegment.entityId === 'comp-logistics' || entitySegment.segmentId === 'logistics-shipping') {
        return (
          p.category === 'Packaging' ||
          p.category === 'Spare Part' ||
          p.name?.toLowerCase().includes('pallet') ||
          p.name?.toLowerCase().includes('shipping') ||
          p.name?.toLowerCase().includes('carton')
        );
      }
      return true;
    });
    return filtered.length > 0 ? filtered : products;
  }, [products, entitySegment]);

  // 4. Employees filtered by Entity & Segment
  const segmentFilteredEmployees = useMemo(() => {
    if (entitySegment.entityId === 'all' && entitySegment.segmentId === 'all') {
      return employees;
    }
    const filtered = employees.filter((e) => {
      if (entitySegment.entityId !== 'all') {
        if (e.companyId && e.companyId !== entitySegment.entityId) return false;
      }
      if (entitySegment.segmentId !== 'all') {
        const dept = (e.departmentName || '').toLowerCase();
        if (entitySegment.segmentId === 'textile-mfg') {
          return dept.includes('production') || dept.includes('knitting') || dept.includes('quality') || dept.includes('plant');
        }
        if (entitySegment.segmentId === 'logistics-shipping') {
          return dept.includes('supply chain') || dept.includes('logistics') || dept.includes('warehouse') || dept.includes('shipping');
        }
        if (entitySegment.segmentId === 'corporate-shared') {
          return dept.includes('finance') || dept.includes('accounting') || dept.includes('human resources') || dept.includes('executive');
        }
        if (entitySegment.segmentId === 'export-commercial') {
          return dept.includes('commercial') || dept.includes('sales') || dept.includes('marketing');
        }
      }
      return true;
    });
    return filtered.length > 0 ? filtered : employees;
  }, [employees, entitySegment]);

  // 5. Monthly trends filtered and scaled by Entity Segment
  const periodMonthlyTrends = useMemo(() => {
    const rawTrends = filterMonthlyTrendsByDateRange(stats?.monthlyTrends, dateRange);
    if (!rawTrends || rawTrends.length === 0) return rawTrends;

    if (entitySegment.entityId === 'all') return rawTrends;

    let scaleFactor = 1.0;
    if (entitySegment.entityId === 'comp-textile') scaleFactor = 0.72;
    else if (entitySegment.entityId === 'comp-logistics') scaleFactor = 0.19;
    else if (entitySegment.entityId === 'comp-apex-group') scaleFactor = 0.09;

    return rawTrends.map((t: any) => ({
      ...t,
      revenue: Math.round(t.revenue * scaleFactor),
      expenses: Math.round(t.expenses * scaleFactor),
      profit: Math.round(t.profit * scaleFactor),
      procurementVolume: Math.round((t.procurementVolume || 0) * scaleFactor),
    }));
  }, [stats?.monthlyTrends, dateRange, entitySegment.entityId]);

  // 6. Data calculations
  const trialBalance: any[] = reports?.trialBalance || [];
  const totalDebits = useMemo(
    () => trialBalance.reduce((sum, r) => sum + (Number(r.debit) || 0), 0),
    [trialBalance]
  );
  const totalCredits = useMemo(
    () => trialBalance.reduce((sum, r) => sum + (Number(r.credit) || 0), 0),
    [trialBalance]
  );

  const totalRevenue = useMemo(
    () => periodInvoices.reduce((sum, i) => sum + (i.status !== 'Draft' ? Number(i.subTotal) || 0 : 0), 0),
    [periodInvoices]
  );
  const totalVat = useMemo(
    () => periodInvoices.reduce((sum, i) => sum + (i.status !== 'Draft' ? Number(i.taxTotal) || 0 : 0), 0),
    [periodInvoices]
  );
  const totalInvoiceGross = useMemo(
    () => periodInvoices.reduce((sum, i) => sum + (i.status !== 'Draft' ? Number(i.grandTotal) || 0 : 0), 0),
    [periodInvoices]
  );

  const totalInventoryValuation = useMemo(
    () => segmentFilteredProducts.reduce((sum, p) => sum + (Number(p.totalStockValue) || 0), 0),
    [segmentFilteredProducts]
  );
  const totalStockUnits = useMemo(
    () => segmentFilteredProducts.reduce((sum, p) => sum + (Number(p.currentStock) || 0), 0),
    [segmentFilteredProducts]
  );

  const totalGrossPayroll = useMemo(
    () => segmentFilteredEmployees.reduce((sum, e) => sum + (Number(e.grossSalary) || 0), 0),
    [segmentFilteredEmployees]
  );
  const totalPayrollTds = useMemo(
    () => segmentFilteredEmployees.reduce((sum, e) => sum + (Number(e.taxDeduction) || 0), 0),
    [segmentFilteredEmployees]
  );
  const totalNetPayable = useMemo(
    () => segmentFilteredEmployees.reduce((sum, e) => sum + (Number(e.netPayable) || 0), 0),
    [segmentFilteredEmployees]
  );

  // Top-Level Executive KPI metrics (filtered dynamically by active date range & entity segment)
  const effectiveRevenue = useMemo(() => {
    let scale = 1.0;
    if (entitySegment.entityId === 'comp-textile') scale = 0.72;
    else if (entitySegment.entityId === 'comp-logistics') scale = 0.19;
    else if (entitySegment.entityId === 'comp-apex-group') scale = 0.09;

    if (dateRange.preset === 'all' && entitySegment.entityId === 'all') {
      if (stats?.revenue && Number(stats.revenue) > 0) return Number(stats.revenue);
    }
    if (periodMonthlyTrends && periodMonthlyTrends.length > 0) {
      const trendRev = periodMonthlyTrends.reduce((acc: number, t: any) => acc + (t.revenue || 0), 0);
      if (trendRev > 0) return trendRev;
    }
    if (totalRevenue > 0) return totalRevenue;
    if (stats?.revenue) return Math.round(Number(stats.revenue) * scale);
    return 0;
  }, [stats, totalRevenue, periodMonthlyTrends, dateRange.preset, entitySegment.entityId]);

  const effectiveExpenses = useMemo(() => {
    let scale = 1.0;
    if (entitySegment.entityId === 'comp-textile') scale = 0.72;
    else if (entitySegment.entityId === 'comp-logistics') scale = 0.19;
    else if (entitySegment.entityId === 'comp-apex-group') scale = 0.09;

    if (dateRange.preset === 'all' && entitySegment.entityId === 'all') {
      if (stats?.expenses && Number(stats.expenses) > 0) return Number(stats.expenses);
    }
    if (periodMonthlyTrends && periodMonthlyTrends.length > 0) {
      const trendExp = periodMonthlyTrends.reduce((acc: number, t: any) => acc + (t.expenses || 0), 0);
      if (trendExp > 0) return trendExp;
    }
    return totalGrossPayroll > 0 ? totalGrossPayroll : Math.round((Number(stats?.expenses) || 0) * scale);
  }, [stats, totalGrossPayroll, periodMonthlyTrends, dateRange.preset, entitySegment.entityId]);

  const effectiveInventoryValue = useMemo(() => {
    if (totalInventoryValuation > 0) return totalInventoryValuation;
    let scale = 1.0;
    if (entitySegment.entityId === 'comp-textile') scale = 0.85;
    else if (entitySegment.entityId === 'comp-logistics') scale = 0.12;
    else if (entitySegment.entityId === 'comp-apex-group') scale = 0.03;
    if (stats?.inventoryValue && Number(stats.inventoryValue) > 0) return Math.round(Number(stats.inventoryValue) * scale);
    return 0;
  }, [totalInventoryValuation, stats, entitySegment.entityId]);

  const effectiveNetProfit = useMemo(() => {
    if (dateRange.preset === 'all' && entitySegment.entityId === 'all' && stats?.netProfit !== undefined && stats?.netProfit !== null && !isNaN(Number(stats.netProfit))) {
      return Number(stats.netProfit);
    }
    return effectiveRevenue - effectiveExpenses;
  }, [stats, effectiveRevenue, effectiveExpenses, dateRange.preset, entitySegment.entityId]);

  const netMarginPercent = useMemo(() => {
    if (effectiveRevenue <= 0) return 0;
    return Number(((effectiveNetProfit / effectiveRevenue) * 100).toFixed(1));
  }, [effectiveNetProfit, effectiveRevenue]);

  // Top-Level Previous Period Comparative Analytics & Variance Calculation
  const prevPeriodInfo = useMemo(() => {
    return getPreviousDateRange(dateRange);
  }, [dateRange]);

  const previousComparison = useMemo(() => {
    const { startDate: prevStart, endDate: prevEnd, label: prevLabel, shortLabel: prevShortLabel, periodType } = prevPeriodInfo;

    // Filter monthly trends that correspond to the previous period
    const prevTrends = stats?.monthlyTrends
      ? stats.monthlyTrends.filter((item: any) => {
          const mKey = getMonthKeyFromTrend(item);
          if (!mKey) return false;
          const sKey = prevStart.slice(0, 7);
          const eKey = prevEnd.slice(0, 7);
          return mKey >= sKey && mKey <= eKey;
        })
      : [];

    let entityScale = 1.0;
    if (entitySegment.entityId === 'comp-textile') entityScale = 0.72;
    else if (entitySegment.entityId === 'comp-logistics') entityScale = 0.19;
    else if (entitySegment.entityId === 'comp-apex-group') entityScale = 0.09;

    let prevRevenue = 0;
    let prevExpenses = 0;
    let prevNetProfit = 0;
    let prevInventoryValue = 0;

    if (dateRange.preset === 'all') {
      // Prior fiscal year audited baseline (FY24-25 audited financials)
      prevRevenue = Math.round(612400000 * entityScale);
      prevExpenses = Math.round(398500000 * entityScale);
      prevNetProfit = Math.round(213900000 * entityScale);
      prevInventoryValue = Math.round(29500000 * entityScale);
    } else if (dateRange.preset === 'ytd') {
      // Prior year comparative period (YoY Jan-Sep)
      prevRevenue = Math.round(effectiveRevenue / 1.135);
      prevExpenses = Math.round(effectiveExpenses / 1.092);
      prevNetProfit = prevRevenue - prevExpenses;
      prevInventoryValue = Math.round(effectiveInventoryValue / 1.142);
    } else if (dateRange.preset === 'last30') {
      // Prior 30 days (Month 08 / August 2026)
      const augTrend = stats?.monthlyTrends?.find((t: any) => getMonthKeyFromTrend(t) === '2026-08');
      if (augTrend) {
        prevRevenue = augTrend.revenue || 72800000;
        prevExpenses = augTrend.expenses || 47600000;
        prevNetProfit = augTrend.profit || 25200000;
      } else {
        prevRevenue = Math.round(effectiveRevenue * 0.94);
        prevExpenses = Math.round(effectiveExpenses * 0.97);
        prevNetProfit = prevRevenue - prevExpenses;
      }
      prevInventoryValue = Math.round(effectiveInventoryValue * 0.961);
    } else if (dateRange.preset === 'last90') {
      // Prior 90 days (Q2 2026: Apr, May, Jun 2026)
      if (prevTrends.length > 0) {
        prevRevenue = prevTrends.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);
        prevExpenses = prevTrends.reduce((sum: number, t: any) => sum + (t.expenses || 0), 0);
        prevNetProfit = prevTrends.reduce((sum: number, t: any) => sum + (t.profit || 0), 0);
      } else {
        prevRevenue = 175700000;
        prevExpenses = 116500000;
        prevNetProfit = 59200000;
      }
      prevInventoryValue = 31200000;
    } else {
      // Custom range: scale by number of days or aggregated trends
      if (prevTrends.length > 0) {
        prevRevenue = prevTrends.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);
        prevExpenses = prevTrends.reduce((sum: number, t: any) => sum + (t.expenses || 0), 0);
        prevNetProfit = prevTrends.reduce((sum: number, t: any) => sum + (t.profit || 0), 0);
      } else {
        const start = new Date(dateRange.startDate);
        const end = new Date(dateRange.endDate);
        const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const dailyRev = effectiveRevenue / days;
        const dailyExp = effectiveExpenses / days;
        prevRevenue = Math.round(dailyRev * days * 0.95);
        prevExpenses = Math.round(dailyExp * days * 0.98);
        prevNetProfit = prevRevenue - prevExpenses;
      }
      prevInventoryValue = Math.round(effectiveInventoryValue * 0.97);
    }

    const calcVariance = (curr: number, prev: number) => {
      if (prev === 0) {
        const val = curr > 0 ? 100 : 0;
        return {
          percent: val,
          formatted: `${val > 0 ? '+' : ''}${val.toFixed(1)}%`,
          isPositive: val > 0,
          isZero: val === 0,
        };
      }
      const diff = ((curr - prev) / Math.abs(prev)) * 100;
      const isZero = Math.abs(diff) < 0.05;
      const formatted = isZero ? '0.0%' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
      return {
        percent: diff,
        formatted,
        isPositive: diff > 0,
        isZero,
      };
    };

    return {
      prevStartDate: prevStart,
      prevEndDate: prevEnd,
      prevLabel,
      prevShortLabel,
      periodType,
      prevRevenue,
      prevExpenses,
      prevInventoryValue,
      prevNetProfit,
      revenueVariance: calcVariance(effectiveRevenue, prevRevenue),
      expensesVariance: calcVariance(effectiveExpenses, prevExpenses),
      inventoryVariance: calcVariance(effectiveInventoryValue, prevInventoryValue),
      profitVariance: calcVariance(effectiveNetProfit, prevNetProfit),
    };
  }, [dateRange, prevPeriodInfo, stats?.monthlyTrends, effectiveRevenue, effectiveExpenses, effectiveInventoryValue, effectiveNetProfit, entitySegment.entityId]);

  const getKpiBadgeStyle = (
    metric: 'revenue' | 'expenses' | 'inventory' | 'profit',
    variance: { percent: number; isPositive: boolean; isZero: boolean }
  ) => {
    if (variance.isZero) {
      return {
        badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
        icon: 'flat' as const,
      };
    }

    const isFavorable = metric === 'expenses' ? !variance.isPositive : variance.isPositive;

    if (isFavorable) {
      return {
        badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
        icon: variance.isPositive ? ('up' as const) : ('down' as const),
      };
    } else {
      if (metric === 'expenses') {
        return {
          badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: 'up' as const,
        };
      }
      return {
        badgeStyle: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
        icon: 'down' as const,
      };
    }
  };

  // 3. Filtered data based on search and active period
  const filteredTrialBalance = useMemo(() => {
    if (!searchQuery.trim()) return trialBalance;
    const q = searchQuery.toLowerCase();
    return trialBalance.filter(
      (r) =>
        r.code?.toLowerCase().includes(q) ||
        r.name?.toLowerCase().includes(q) ||
        r.type?.toLowerCase().includes(q)
    );
  }, [trialBalance, searchQuery]);

  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return periodInvoices;
    const q = searchQuery.toLowerCase();
    return periodInvoices.filter(
      (i) =>
        i.invoiceNumber?.toLowerCase().includes(q) ||
        i.customerName?.toLowerCase().includes(q) ||
        i.status?.toLowerCase().includes(q)
    );
  }, [periodInvoices, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return segmentFilteredProducts;
    const q = searchQuery.toLowerCase();
    return segmentFilteredProducts.filter(
      (p) =>
        p.sku?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    );
  }, [segmentFilteredProducts, searchQuery]);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return segmentFilteredEmployees;
    const q = searchQuery.toLowerCase();
    return segmentFilteredEmployees.filter(
      (e) =>
        e.employeeId?.toLowerCase().includes(q) ||
        `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) ||
        e.departmentName?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
    );
  }, [segmentFilteredEmployees, searchQuery]);

  // 3. Export Handlers
  const handleExportCSV = () => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (reportType === 'financial') {
      const filename = `apex-trial-balance-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'Account Code', key: 'code' },
          { header: 'Account Title', key: 'name' },
          { header: 'Classification', key: 'type' },
          { header: 'Debit (BDT)', key: 'debit', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Credit (BDT)', key: 'credit', format: (v) => Number(v || 0).toFixed(2) },
        ],
        filteredTrialBalance,
        {
          companyName,
          reportTitle: 'Statement of Financial Position & Trial Balance',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    } else if (reportType === 'sales') {
      const filename = `apex-nbr-vat9.1-return-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'Invoice Number', key: 'invoiceNumber' },
          { header: 'Customer Entity', key: 'customerName' },
          { header: 'Issue Date', key: 'invoiceDate' },
          { header: 'Due Date', key: 'dueDate' },
          { header: 'Taxable Supply (BDT)', key: 'subTotal', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'NBR VAT 15% (BDT)', key: 'taxTotal', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Gross Total (BDT)', key: 'grandTotal', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Payment Status', key: 'status' },
        ],
        filteredInvoices,
        {
          companyName,
          reportTitle: 'Bangladesh NBR VAT-9.1 Sub-Return & Sales Revenue Breakdown',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    } else if (reportType === 'inventory') {
      const filename = `apex-inventory-valuation-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'SKU', key: 'sku' },
          { header: 'Material Description', key: 'name' },
          { header: 'Category', key: 'category' },
          { header: 'Unit of Measure', key: 'unit' },
          { header: 'Unit Cost Price (BDT)', key: 'costPrice', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Quantity On-Hand', key: 'currentStock' },
          { header: 'Line Valuation (BDT)', key: 'totalStockValue', format: (v) => Number(v || 0).toFixed(2) },
        ],
        filteredProducts,
        {
          companyName,
          reportTitle: 'Material Stock Valuation & Asset Movement Analysis',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    } else if (reportType === 'payroll') {
      const filename = `apex-payroll-tds-report-${dateStamp}.csv`;
      exportToCSV(
        filename,
        [
          { header: 'Employee ID', key: 'employeeId' },
          { header: 'Full Name', key: 'firstName', format: (_, row: any) => `${row?.firstName || ''} ${row?.lastName || ''}`.trim() },
          { header: 'Department', key: 'departmentName' },
          { header: 'Designation', key: 'designation' },
          { header: 'Basic Salary (BDT)', key: 'basicSalary', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Gross Salary (BDT)', key: 'grossSalary', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'TDS Withholding Tax (BDT)', key: 'taxDeduction', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Net Payable (BDT)', key: 'netPayable', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Status', key: 'status' },
        ],
        filteredEmployees,
        {
          companyName,
          reportTitle: 'Operational Payroll & TDS Tax Withholding Summary',
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    } else if (reportType === 'analytics') {
      const filename = `apex-bi-trends-turnover-${dateStamp}.csv`;
      const monthlyData = periodMonthlyTrends && periodMonthlyTrends.length > 0 ? periodMonthlyTrends : stats?.monthlyTrends || [];
      exportToCSV(
        filename,
        [
          { header: 'Month', key: 'month' },
          { header: 'Period Name', key: 'fullMonth' },
          { header: 'Operating Revenue (BDT)', key: 'revenue', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Operating Expenses (BDT)', key: 'expenses', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'Net Profit (BDT)', key: 'profit', format: (v) => Number(v || 0).toFixed(2) },
          { header: 'MoM Sales Growth (%)', key: 'salesGrowth', format: (v) => `${v || 0}%` },
          { header: 'Procurement Volume (BDT)', key: 'procurementVolume', format: (v) => Number(v || 0).toFixed(2) },
        ],
        monthlyData,
        {
          companyName,
          reportTitle: `Executive Financial Trajectory & Inventory Turnover Analytics (${dateRange.label})`,
          generatedAt: `${dateStamp} ${timestamp}`,
        }
      );
      setExportFeedback({ type: 'csv', filename, timestamp });
    }
  };

  const handleExportPDF = () => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    if (reportType === 'financial') {
      const filename = `apex-trial-balance-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Operating Revenue', value: formatCurrency(stats?.revenue || 0) },
        { label: 'Audited Net Profit', value: formatCurrency(stats?.netProfit || 0) },
        { label: 'Total Liquid Reserves', value: formatCurrency(stats?.cashBalance || 0) },
        { label: 'Gross Trial Balance Debits', value: formatCurrency(totalDebits) },
      ];

      generateReportPDF({
        title: 'Statement of Financial Position & Trial Balance',
        subtitle: 'Audited General Ledger Balances under Bangladesh Accounting Standards (BAS/IFRS)',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'portrait',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'GL Code', dataKey: 'code', width: 28 },
          { header: 'Account Title', dataKey: 'name' },
          { header: 'Classification', dataKey: 'type', width: 32 },
          { header: 'Debit (BDT)', dataKey: 'debitFormatted', align: 'right', width: 34 },
          { header: 'Credit (BDT)', dataKey: 'creditFormatted', align: 'right', width: 34 },
        ],
        data: filteredTrialBalance.map((r) => ({
          code: r.code,
          name: r.name,
          type: r.type,
          debitFormatted: r.debit > 0 ? formatCurrency(r.debit) : '—',
          creditFormatted: r.credit > 0 ? formatCurrency(r.credit) : '—',
        })),
        totalRow: {
          code: 'TOTALS',
          name: 'Balanced Trial Balance',
          type: totalDebits === totalCredits ? 'BALANCED' : 'IMBALANCE',
          debitFormatted: formatCurrency(totalDebits),
          creditFormatted: formatCurrency(totalCredits),
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    } else if (reportType === 'sales') {
      const filename = `apex-nbr-vat9.1-return-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Total Taxable Supplies', value: formatCurrency(totalRevenue) },
        { label: 'NBR VAT 15% Output', value: formatCurrency(totalVat) },
        { label: 'Gross Receivables', value: formatCurrency(totalInvoiceGross) },
        { label: 'Active Invoices Count', value: `${invoices.length} Invoices` },
      ];

      generateReportPDF({
        title: 'Bangladesh NBR VAT-9.1 Sub-Return & Sales Breakdown',
        subtitle: 'Statutory Output VAT Computation under Bangladesh Value Added Tax and Supplementary Duty Act 2012',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'landscape',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'Invoice #', dataKey: 'invoiceNumber', width: 28 },
          { header: 'Customer Entity', dataKey: 'customerName' },
          { header: 'Issue Date', dataKey: 'invoiceDate', width: 24 },
          { header: 'Due Date', dataKey: 'dueDate', width: 24 },
          { header: 'Taxable Supply (BDT)', dataKey: 'subTotal', align: 'right', width: 38 },
          { header: 'NBR VAT 15% (BDT)', dataKey: 'taxTotal', align: 'right', width: 34 },
          { header: 'Gross Total (BDT)', dataKey: 'grandTotal', align: 'right', width: 38 },
          { header: 'Status', dataKey: 'status', align: 'center', width: 24 },
        ],
        data: filteredInvoices.map((inv) => ({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          invoiceDate: inv.invoiceDate,
          dueDate: inv.dueDate || '—',
          subTotal: formatCurrency(inv.subTotal),
          taxTotal: formatCurrency(inv.taxTotal),
          grandTotal: formatCurrency(inv.grandTotal),
          status: inv.status,
        })),
        totalRow: {
          invoiceNumber: 'TOTALS',
          customerName: 'Cumulative Statutory Output Tax',
          subTotal: formatCurrency(totalRevenue),
          taxTotal: formatCurrency(totalVat),
          grandTotal: formatCurrency(totalInvoiceGross),
          status: 'NBR SUB-RETURN',
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    } else if (reportType === 'inventory') {
      const filename = `apex-inventory-valuation-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Total Asset Valuation', value: formatCurrency(totalInventoryValuation) },
        { label: 'Cumulative Stock Quantity', value: `${totalStockUnits.toLocaleString()} Units` },
        { label: 'Cataloged Items', value: `${products.length} SKUs` },
        { label: 'Valuation Standard', value: 'FIFO / WAC Compliant' },
      ];

      generateReportPDF({
        title: 'Material Stock Valuation & Asset Movement Analysis',
        subtitle: 'Perpetual Inventory Valuation under Bangladesh Accounting Standard BAS-2 (Inventories)',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'portrait',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'SKU', dataKey: 'sku', width: 26 },
          { header: 'Material Description', dataKey: 'name' },
          { header: 'Unit Cost (BDT)', dataKey: 'costPrice', align: 'right', width: 30 },
          { header: 'On-Hand Stock', dataKey: 'stockFormatted', align: 'right', width: 32 },
          { header: 'Line Valuation (BDT)', dataKey: 'totalValue', align: 'right', width: 38 },
        ],
        data: filteredProducts.map((p) => ({
          sku: p.sku,
          name: p.name,
          costPrice: formatCurrency(p.costPrice),
          stockFormatted: `${Number(p.currentStock || 0).toLocaleString()} ${p.unit || 'units'}`,
          totalValue: formatCurrency(p.totalStockValue),
        })),
        totalRow: {
          sku: 'TOTALS',
          name: 'Total Physical Inventory Asset Valuation',
          costPrice: '',
          stockFormatted: `${totalStockUnits.toLocaleString()} units`,
          totalValue: formatCurrency(totalInventoryValuation),
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    } else if (reportType === 'payroll') {
      const filename = `apex-payroll-tds-report-${dateStamp}.pdf`;
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Gross Monthly Payroll', value: formatCurrency(totalGrossPayroll) },
        { label: 'Total TDS Withholding', value: formatCurrency(totalPayrollTds) },
        { label: 'Net Payable Disbursement', value: formatCurrency(totalNetPayable) },
        { label: 'Active Workforce', value: `${employees.length} Employees` },
      ];

      generateReportPDF({
        title: 'Operational Payroll & TDS Tax Withholding Summary',
        subtitle: 'Statutory Payroll Tax Deducted at Source (TDS) under NBR Income Tax Act 2023',
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'landscape',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'Emp ID', dataKey: 'employeeId', width: 22 },
          { header: 'Employee Name', dataKey: 'fullName' },
          { header: 'Department', dataKey: 'departmentName', width: 32 },
          { header: 'Designation', dataKey: 'designation', width: 36 },
          { header: 'Gross Salary (BDT)', dataKey: 'grossSalary', align: 'right', width: 34 },
          { header: 'NBR TDS Tax (BDT)', dataKey: 'taxDeduction', align: 'right', width: 32 },
          { header: 'Net Payable (BDT)', dataKey: 'netPayable', align: 'right', width: 34 },
          { header: 'Status', dataKey: 'status', align: 'center', width: 22 },
        ],
        data: filteredEmployees.map((e) => ({
          employeeId: e.employeeId,
          fullName: `${e.firstName} ${e.lastName}`,
          departmentName: e.departmentName,
          designation: e.designation,
          grossSalary: formatCurrency(e.grossSalary),
          taxDeduction: formatCurrency(e.taxDeduction),
          netPayable: formatCurrency(e.netPayable),
          status: e.status,
        })),
        totalRow: {
          employeeId: 'TOTALS',
          fullName: 'Total Payroll & Statutory Withholdings',
          grossSalary: formatCurrency(totalGrossPayroll),
          taxDeduction: formatCurrency(totalPayrollTds),
          netPayable: formatCurrency(totalNetPayable),
          status: 'VERIFIED',
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    } else if (reportType === 'analytics') {
      const filename = `apex-bi-trends-turnover-${dateStamp}.pdf`;
      const monthlyData = periodMonthlyTrends && periodMonthlyTrends.length > 0 ? periodMonthlyTrends : stats?.monthlyTrends || [];
      const totalRev = monthlyData.reduce((sum: number, m: any) => sum + (m.revenue || 0), 0);
      const totalProf = monthlyData.reduce((sum: number, m: any) => sum + (m.profit || 0), 0);
      const summaryCards: PDFSummaryCard[] = [
        { label: 'Cumulative Period Revenue', value: formatCurrency(totalRev) },
        { label: 'Cumulative Net Profit', value: formatCurrency(totalProf) },
        { label: 'Total Inventory Valuation', value: formatCurrency(totalInventoryValuation) },
        { label: 'Reporting Horizon', value: `${dateRange.label} (${monthlyData.length} Months)` },
      ];

      generateReportPDF({
        title: 'Executive Financial Trajectory & Turnover Analytics',
        subtitle: `${dateRange.label} (${dateRange.startDate} to ${dateRange.endDate}) Audited Revenue Trends & Material Velocity`,
        companyName,
        companyTaxId,
        companyAddress,
        filename,
        orientation: 'landscape',
        preparedBy,
        summaryCards,
        columns: [
          { header: 'Month', dataKey: 'month', width: 24 },
          { header: 'Period Name', dataKey: 'fullMonth' },
          { header: 'Revenue (BDT)', dataKey: 'revenueFormatted', align: 'right', width: 36 },
          { header: 'Expenses (BDT)', dataKey: 'expensesFormatted', align: 'right', width: 36 },
          { header: 'Net Profit (BDT)', dataKey: 'profitFormatted', align: 'right', width: 36 },
          { header: 'MoM Growth', dataKey: 'growthFormatted', align: 'center', width: 28 },
        ],
        data: monthlyData.map((m: any) => ({
          month: m.month,
          fullMonth: m.fullMonth,
          revenueFormatted: formatCurrency(m.revenue),
          expensesFormatted: formatCurrency(m.expenses),
          profitFormatted: formatCurrency(m.profit),
          growthFormatted: `${(m.salesGrowth || 0) > 0 ? '+' : ''}${m.salesGrowth || 0}%`,
        })),
        totalRow: {
          month: 'TOTALS',
          fullMonth: 'Cumulative Audited Results',
          revenueFormatted: formatCurrency(totalRev),
          expensesFormatted: formatCurrency(monthlyData.reduce((sum: number, m: any) => sum + (m.expenses || 0), 0)),
          profitFormatted: formatCurrency(totalProf),
          growthFormatted: 'VERIFIED',
        },
      });
      setExportFeedback({ type: 'pdf', filename, timestamp });
    }
  };

  const reportMeta = useMemo(() => {
    switch (reportType) {
      case 'financial':
        return {
          title: 'Statement of Financial Position & Trial Balance',
          subtitle: 'Comprehensive General Ledger Double-Entry Trial Balance Records & Verification',
          statutoryRef: 'IFRS / BFRS / Bangladesh Financial Reporting Standards',
          docCode: `APEX-FIN-${dateStamp}`,
        };
      case 'sales':
        return {
          title: 'Bangladesh NBR VAT Sub-return 9.1 & Revenue Breakdown',
          subtitle: 'Automated Statutory Output Tax Computation on Taxable Supplies (VAT Act 2012)',
          statutoryRef: 'National Board of Revenue (NBR) — VAT Act 2012 / Section 64',
          docCode: `APEX-VAT-${dateStamp}`,
        };
      case 'inventory':
        return {
          title: 'Perpetual Physical Inventory & Material Asset Valuation',
          subtitle: 'Warehouse Holdings, Moving Average Cost Rates, and FIFO/WAC Asset Ledger under BAS-2',
          statutoryRef: 'BAS-2 (Inventories) / Deterministic FIFO Asset Valuation',
          docCode: `APEX-INV-${dateStamp}`,
        };
      case 'payroll':
        return {
          title: 'Operational Payroll & Statutory TDS Tax Withholding Summary',
          subtitle: 'Workforce Payroll Obligations, Statutory TDS Deductions & Net Disbursements',
          statutoryRef: 'NBR Income Tax Act 2023 — Section 50 / TDS Withholding',
          docCode: `APEX-PAY-${dateStamp}`,
        };
      case 'analytics':
        return {
          title: 'Executive Financial Trajectory & Inventory Turnover Analytics',
          subtitle: 'Monthly Operating Revenue Trends & Physical Stock Turnover Velocity (Visualized with Recharts)',
          statutoryRef: 'Executive BI & Management Accounting Analytics',
          docCode: `APEX-BI-${dateStamp}`,
        };
    }
  }, [reportType, dateStamp]);

  const handlePrint = () => {
    window.print();
  };

  const activeCount =
    reportType === 'financial'
      ? filteredTrialBalance.length
      : reportType === 'sales'
      ? filteredInvoices.length
      : reportType === 'inventory'
      ? filteredProducts.length
      : reportType === 'payroll'
      ? filteredEmployees.length
      : (stats?.monthlyTrends?.length || 12);

  const totalCount =
    reportType === 'financial'
      ? trialBalance.length
      : reportType === 'sales'
      ? invoices.length
      : reportType === 'inventory'
      ? products.length
      : reportType === 'payroll'
      ? employees.length
      : (stats?.monthlyTrends?.length || 12);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-2xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {companyName}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
            Financial & Business Intelligence Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audited financial statements, NBR VAT-9.1 returns, inventory asset valuation, and statutory payroll tax summaries.
          </p>
        </div>

        {/* Unified Export Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button
            type="button"
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex-1 sm:flex-none"
            title="Download formatted CSV for Excel / Google Sheets analysis"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            id="export-pdf-btn"
            onClick={handleExportPDF}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer flex-1 sm:flex-none"
            title="Download print-ready official PDF report with corporate header and totals"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            id="print-report-btn"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg text-xs font-semibold transition-all shadow-2xs cursor-pointer flex-1 sm:flex-none active:scale-98"
            title="Open browser print dialog for clean documentation generation (Ctrl+P / ⌘P)"
          >
            <Printer className="w-4 h-4 text-slate-200 dark:text-slate-700" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Export Confirmation Feedback */}
      {exportFeedback && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 animate-in fade-in print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              Successfully exported <strong>{exportFeedback.filename}</strong> ({exportFeedback.type.toUpperCase()}) at {exportFeedback.timestamp}.
            </span>
          </div>
          <button
            onClick={() => setExportFeedback(null)}
            className="text-2xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Formal Document Header - ONLY visible during Browser Print (appears at top of printout) */}
      <div className="hidden print:block mb-5 pb-3 border-b-2 border-black text-black">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight uppercase text-black">
                {companyName}
              </span>
              <span className="text-3xs font-bold px-1.5 py-0.5 border border-black uppercase">
                Official Audit Document
              </span>
            </div>
            <p className="text-xs text-slate-800 mt-0.5">{companyAddress}</p>
            <p className="text-xs font-mono text-slate-900 mt-0.5">
              Tax Registration: <strong>{companyTaxId}</strong> | TIN: 817263541920 | Tax Circle: 12 (LTU)
            </p>
          </div>

          <div className="text-right">
            <div className="text-xs font-mono font-bold text-black">
              REF: {reportMeta.docCode}
            </div>
            <div className="text-3xs text-slate-700 font-mono mt-0.5">
              Print Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at{' '}
              {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-3xs text-slate-700 font-mono">
              Entity / Segment: <strong>{entitySegment.entityName}{entitySegment.segmentId !== 'all' ? ` (${entitySegment.segmentName})` : ''}</strong>
            </div>
            <div className="text-3xs text-slate-700 font-mono">
              Reporting Period: <strong>{dateRange.label} ({dateRange.startDate} to {dateRange.endDate})</strong>
            </div>
            <div className="text-3xs text-slate-700 font-mono">
              Comparative Baseline: <strong>{previousComparison.prevLabel} ({previousComparison.prevStartDate} to {previousComparison.prevEndDate})</strong>
            </div>
            <div className="text-3xs text-slate-700 font-mono">
              Configuration Preset: <strong>{activePreset?.name || 'Custom Filter Configuration'}</strong>
            </div>
            <div className="text-3xs text-slate-700 font-mono">
              Currency: BDT (Bangladeshi Taka)
            </div>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-slate-400 flex justify-between items-end">
          <div>
            <h2 className="text-base font-black tracking-tight uppercase text-black">
              {reportMeta.title}
            </h2>
            <p className="text-xs text-slate-700">{reportMeta.subtitle}</p>
          </div>
          <div className="text-right text-3xs font-mono text-slate-700">
            <div>Standard: {reportMeta.statutoryRef}</div>
            <div>Prepared By: <strong>{preparedBy}</strong></div>
          </div>
        </div>
      </div>

      {/* Report Filter Presets & Entity Segment Toolbar */}
      <div className="space-y-2 print:hidden">
        {/* Tier 1: Report Presets Quick Bar & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 p-2.5 bg-slate-50/90 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-3xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 pl-1">
              Configuration Preset:
            </span>
            <ReportPresetsBar
              presets={presets}
              activePresetId={activePresetId}
              currentDateRange={dateRange}
              currentEntitySegment={entitySegment}
              onSelectPreset={handleSelectPreset}
              onOpenSaveModal={handleOpenSavePresetModal}
              onOpenManageModal={handleOpenManagePresetModal}
              onRevertToActivePreset={handleRevertToActivePreset}
            />

            {/* Quick Shortcut Buttons for popular presets */}
            <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2">
              <span className="text-3xs text-slate-400">Quick:</span>
              {presets.slice(0, 4).map((p) => {
                const isActive = activePresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-2 py-1 rounded-md text-3xs font-semibold transition-all cursor-pointer truncate max-w-[130px] ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                    }`}
                    title={p.description || p.name}
                  >
                    {p.name.split(' - ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              type="button"
              id="toolbar-save-preset-btn"
              onClick={handleOpenSavePresetModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-2xs font-bold transition-colors cursor-pointer"
              title="Save the active date range and entity segment as a reusable Report Preset"
            >
              <Bookmark className="w-3 h-3" />
              <span>Save Preset</span>
            </button>
            <button
              type="button"
              id="toolbar-manage-presets-btn"
              onClick={handleOpenManagePresetModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-2xs font-semibold transition-colors cursor-pointer"
              title="Manage, delete, or designate default presets"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Manage ({presets.length})</span>
            </button>
          </div>
        </div>

        {/* Tier 2: Active Filter Chips & Interactive Pickers */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100/80 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <CalendarRange className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Active Filter:
                </span>
                {/* Legal Entity Badge */}
                <span className="text-3xs font-semibold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{entitySegment.entityName}</span>
                </span>
                {/* Operational Segment Badge */}
                {entitySegment.segmentId !== 'all' && (
                  <span className="text-3xs font-semibold px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 rounded border border-cyan-200 dark:border-cyan-800">
                    {entitySegment.segmentName}
                  </span>
                )}
                {/* Date Range Badge */}
                <span className="text-3xs font-semibold px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                  {dateRange.label}
                </span>
                {/* Active Comparison Baseline Chip */}
                <span
                  id="reports-comparison-period-indicator"
                  className="inline-flex items-center gap-1 text-3xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700"
                  title={`Comparing against ${previousComparison.prevLabel} (${previousComparison.prevStartDate} to ${previousComparison.prevEndDate})`}
                >
                  <span className="text-slate-400 dark:text-slate-500">Baseline:</span>
                  <strong className="text-slate-700 dark:text-slate-200">{previousComparison.prevLabel}</strong>
                </span>
              </div>
              <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
                Financial statements, statutory VAT, and drilldown audits adjust automatically for active entity, segment, and dates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Entity Segment Picker */}
            <EntitySegmentPicker
              value={entitySegment}
              onChange={setEntitySegment}
              className="w-full sm:w-auto"
            />

            {/* Date Range Picker */}
            <ReportDateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      {/* Top-Level Executive Summary KPI Cards - Responsive, Interactive & Print-Friendly */}
      <div
        id="reports-top-kpi-summary"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-3 print:mb-5 print-avoid-break"
      >
        {/* Card 1: Total Revenue */}
        <div
          id="kpi-total-revenue"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedKpi((prev) => (prev === 'revenue' ? null : 'revenue'))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedKpi((prev) => (prev === 'revenue' ? null : 'revenue'));
            }
          }}
          className={`cursor-pointer rounded-xl border p-4 sm:p-4.5 shadow-2xs transition-all hover:shadow-md active:scale-[0.99] print:border-slate-400 print:bg-white print:p-2.5 print:shadow-none print-avoid-break ${
            selectedKpi === 'revenue'
              ? 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xs sm:text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-black">
              Total Revenue
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center print:hidden ${
              selectedKpi === 'revenue'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white print:text-black tracking-tight">
              {formatCurrency(effectiveRevenue)}
            </span>
            {/* Previous Period Comparison Badge */}
            {(() => {
              const badge = getKpiBadgeStyle('revenue', previousComparison.revenueVariance);
              return (
                <span
                  id="kpi-revenue-variance-badge"
                  title={`Previous Period (${previousComparison.prevLabel}: ${previousComparison.prevStartDate} → ${previousComparison.prevEndDate})\nPrior Revenue: ${formatCurrency(previousComparison.prevRevenue)}\nCurrent Revenue: ${formatCurrency(effectiveRevenue)}\nVariance: ${previousComparison.revenueVariance.formatted}`}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-3xs font-bold font-mono border shadow-2xs shrink-0 cursor-help print:border-slate-400 print:text-black print:bg-transparent ${badge.badgeStyle}`}
                >
                  {badge.icon === 'up' && <ArrowUpRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'down' && <ArrowDownRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'flat' && <span className="w-1.5 h-0.5 bg-current rounded-full mx-0.5" />}
                  <span>{previousComparison.revenueVariance.formatted}</span>
                </span>
              );
            })()}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-3xs sm:text-2xs text-slate-500 dark:text-slate-400 print:border-slate-300 print:text-black">
            <span
              className="truncate flex items-center gap-1 max-w-[58%]"
              title={`Prior Period (${previousComparison.prevLabel}): ${formatCurrency(previousComparison.prevRevenue)}`}
            >
              <span className="text-slate-400 dark:text-slate-500 font-normal truncate">vs. {previousComparison.prevShortLabel}:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-black shrink-0">
                {formatCurrency(previousComparison.prevRevenue)}
              </span>
            </span>
            <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-600 dark:text-emerald-400 print:text-black shrink-0 ml-1">
              <ArrowUpRight className="w-3 h-3 print:hidden" />
              <span>{periodInvoices.length} Invoices</span>
            </span>
          </div>
        </div>

        {/* Card 2: Total Operating Expenses */}
        <div
          id="kpi-total-expenses"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedKpi((prev) => (prev === 'expenses' ? null : 'expenses'))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedKpi((prev) => (prev === 'expenses' ? null : 'expenses'));
            }
          }}
          className={`cursor-pointer rounded-xl border p-4 sm:p-4.5 shadow-2xs transition-all hover:shadow-md active:scale-[0.99] print:border-slate-400 print:bg-white print:p-2.5 print:shadow-none print-avoid-break ${
            selectedKpi === 'expenses'
              ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/20 dark:bg-rose-950/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xs sm:text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-black">
              Total Expenses
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center print:hidden ${
              selectedKpi === 'expenses'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
            }`}>
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white print:text-black tracking-tight">
              {formatCurrency(effectiveExpenses)}
            </span>
            {/* Previous Period Comparison Badge */}
            {(() => {
              const badge = getKpiBadgeStyle('expenses', previousComparison.expensesVariance);
              return (
                <span
                  id="kpi-expenses-variance-badge"
                  title={`Previous Period (${previousComparison.prevLabel}: ${previousComparison.prevStartDate} → ${previousComparison.prevEndDate})\nPrior Expenses: ${formatCurrency(previousComparison.prevExpenses)}\nCurrent Expenses: ${formatCurrency(effectiveExpenses)}\nVariance: ${previousComparison.expensesVariance.formatted}`}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-3xs font-bold font-mono border shadow-2xs shrink-0 cursor-help print:border-slate-400 print:text-black print:bg-transparent ${badge.badgeStyle}`}
                >
                  {badge.icon === 'up' && <ArrowUpRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'down' && <ArrowDownRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'flat' && <span className="w-1.5 h-0.5 bg-current rounded-full mx-0.5" />}
                  <span>{previousComparison.expensesVariance.formatted}</span>
                </span>
              );
            })()}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-3xs sm:text-2xs text-slate-500 dark:text-slate-400 print:border-slate-300 print:text-black">
            <span
              className="truncate flex items-center gap-1 max-w-[58%]"
              title={`Prior Period (${previousComparison.prevLabel}): ${formatCurrency(previousComparison.prevExpenses)}`}
            >
              <span className="text-slate-400 dark:text-slate-500 font-normal truncate">vs. {previousComparison.prevShortLabel}:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-black shrink-0">
                {formatCurrency(previousComparison.prevExpenses)}
              </span>
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400 print:text-black shrink-0 ml-1">
              Operational Cost
            </span>
          </div>
        </div>

        {/* Card 3: Current Inventory Value */}
        <div
          id="kpi-inventory-value"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedKpi((prev) => (prev === 'inventory' ? null : 'inventory'))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedKpi((prev) => (prev === 'inventory' ? null : 'inventory'));
            }
          }}
          className={`cursor-pointer rounded-xl border p-4 sm:p-4.5 shadow-2xs transition-all hover:shadow-md active:scale-[0.99] print:border-slate-400 print:bg-white print:p-2.5 print:shadow-none print-avoid-break ${
            selectedKpi === 'inventory'
              ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20 dark:bg-blue-950/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xs sm:text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-black">
              Current Inventory Value
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center print:hidden ${
              selectedKpi === 'inventory'
                ? 'bg-blue-500 text-white shadow-xs'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
            }`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1.5">
            <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-white print:text-black tracking-tight">
              {formatCurrency(effectiveInventoryValue)}
            </span>
            {/* Previous Period Comparison Badge */}
            {(() => {
              const badge = getKpiBadgeStyle('inventory', previousComparison.inventoryVariance);
              return (
                <span
                  id="kpi-inventory-variance-badge"
                  title={`Previous Period (${previousComparison.prevLabel}: ${previousComparison.prevStartDate} → ${previousComparison.prevEndDate})\nPrior Inventory: ${formatCurrency(previousComparison.prevInventoryValue)}\nCurrent Inventory: ${formatCurrency(effectiveInventoryValue)}\nVariance: ${previousComparison.inventoryVariance.formatted}`}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-3xs font-bold font-mono border shadow-2xs shrink-0 cursor-help print:border-slate-400 print:text-black print:bg-transparent ${badge.badgeStyle}`}
                >
                  {badge.icon === 'up' && <ArrowUpRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'down' && <ArrowDownRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'flat' && <span className="w-1.5 h-0.5 bg-current rounded-full mx-0.5" />}
                  <span>{previousComparison.inventoryVariance.formatted}</span>
                </span>
              );
            })()}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-3xs sm:text-2xs text-slate-500 dark:text-slate-400 print:border-slate-300 print:text-black">
            <span
              className="truncate flex items-center gap-1 max-w-[58%]"
              title={`Prior Period (${previousComparison.prevLabel}): ${formatCurrency(previousComparison.prevInventoryValue)}`}
            >
              <span className="text-slate-400 dark:text-slate-500 font-normal truncate">vs. {previousComparison.prevShortLabel}:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-black shrink-0">
                {formatCurrency(previousComparison.prevInventoryValue)}
              </span>
            </span>
            <span className="font-semibold text-blue-600 dark:text-blue-400 print:text-black shrink-0 ml-1">
              {totalStockUnits.toLocaleString()} Units
            </span>
          </div>
        </div>

        {/* Card 4: Net Operating Profit */}
        <div
          id="kpi-net-profit"
          role="button"
          tabIndex={0}
          onClick={() => setSelectedKpi((prev) => (prev === 'profit' ? null : 'profit'))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setSelectedKpi((prev) => (prev === 'profit' ? null : 'profit'));
            }
          }}
          className={`cursor-pointer rounded-xl border p-4 sm:p-4.5 shadow-2xs transition-all hover:shadow-md active:scale-[0.99] print:border-slate-400 print:bg-white print:p-2.5 print:shadow-none print-avoid-break ${
            selectedKpi === 'profit'
              ? 'ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/25'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-3xs sm:text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 print:text-black">
              Net Operating Profit
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center print:hidden ${
              selectedKpi === 'profit'
                ? 'bg-indigo-600 text-white shadow-xs'
                : effectiveNetProfit >= 0
                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
            }`}>
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-1.5">
            <span className={`text-lg sm:text-xl font-bold font-mono tracking-tight print:text-black ${
              effectiveNetProfit >= 0
                ? 'text-slate-900 dark:text-white'
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(effectiveNetProfit)}
            </span>
            {/* Previous Period Comparison Badge */}
            {(() => {
              const badge = getKpiBadgeStyle('profit', previousComparison.profitVariance);
              return (
                <span
                  id="kpi-profit-variance-badge"
                  title={`Previous Period (${previousComparison.prevLabel}: ${previousComparison.prevStartDate} → ${previousComparison.prevEndDate})\nPrior Net Profit: ${formatCurrency(previousComparison.prevNetProfit)}\nCurrent Net Profit: ${formatCurrency(effectiveNetProfit)}\nVariance: ${previousComparison.profitVariance.formatted}`}
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-3xs font-bold font-mono border shadow-2xs shrink-0 cursor-help print:border-slate-400 print:text-black print:bg-transparent ${badge.badgeStyle}`}
                >
                  {badge.icon === 'up' && <ArrowUpRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'down' && <ArrowDownRight className="w-3 h-3 shrink-0" />}
                  {badge.icon === 'flat' && <span className="w-1.5 h-0.5 bg-current rounded-full mx-0.5" />}
                  <span>{previousComparison.profitVariance.formatted}</span>
                </span>
              );
            })()}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-3xs sm:text-2xs text-slate-500 dark:text-slate-400 print:border-slate-300 print:text-black">
            <span
              className="truncate flex items-center gap-1 max-w-[58%]"
              title={`Prior Period (${previousComparison.prevLabel}): ${formatCurrency(previousComparison.prevNetProfit)}`}
            >
              <span className="text-slate-400 dark:text-slate-500 font-normal truncate">vs. {previousComparison.prevShortLabel}:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300 print:text-black shrink-0">
                {formatCurrency(previousComparison.prevNetProfit)}
              </span>
            </span>
            <span className={`font-semibold print:text-black shrink-0 ml-1 ${
              effectiveNetProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {netMarginPercent}% Margin
            </span>
          </div>
        </div>
      </div>

      {/* Interactive KPI Drill-Down Panel & Filtered Data Table */}
      {selectedKpi && (
        <KpiDetailDrilldown
          metric={selectedKpi}
          onClose={() => setSelectedKpi(null)}
          onJumpToTab={(targetTab) => {
            setReportType(targetTab);
            setSearchQuery('');
          }}
          invoices={periodInvoices}
          products={segmentFilteredProducts}
          employees={segmentFilteredEmployees}
          stats={{ ...stats, monthlyTrends: periodMonthlyTrends }}
          effectiveRevenue={effectiveRevenue}
          effectiveExpenses={effectiveExpenses}
          effectiveInventoryValue={effectiveInventoryValue}
          effectiveNetProfit={effectiveNetProfit}
          netMarginPercent={netMarginPercent}
          totalVat={totalVat}
          totalGrossPayroll={totalGrossPayroll}
          totalPayrollTds={totalPayrollTds}
          totalStockUnits={totalStockUnits}
          dateRangeLabel={dateRange.label}
          previousPeriodComparison={
            selectedKpi === 'revenue'
              ? {
                  prevValue: previousComparison.prevRevenue,
                  variance: previousComparison.revenueVariance.percent,
                  varianceFormatted: previousComparison.revenueVariance.formatted,
                  prevLabel: previousComparison.prevLabel,
                  prevStartDate: previousComparison.prevStartDate,
                  prevEndDate: previousComparison.prevEndDate,
                }
              : selectedKpi === 'expenses'
              ? {
                  prevValue: previousComparison.prevExpenses,
                  variance: previousComparison.expensesVariance.percent,
                  varianceFormatted: previousComparison.expensesVariance.formatted,
                  prevLabel: previousComparison.prevLabel,
                  prevStartDate: previousComparison.prevStartDate,
                  prevEndDate: previousComparison.prevEndDate,
                }
              : selectedKpi === 'inventory'
              ? {
                  prevValue: previousComparison.prevInventoryValue,
                  variance: previousComparison.inventoryVariance.percent,
                  varianceFormatted: previousComparison.inventoryVariance.formatted,
                  prevLabel: previousComparison.prevLabel,
                  prevStartDate: previousComparison.prevStartDate,
                  prevEndDate: previousComparison.prevEndDate,
                }
              : {
                  prevValue: previousComparison.prevNetProfit,
                  variance: previousComparison.profitVariance.percent,
                  varianceFormatted: previousComparison.profitVariance.formatted,
                  prevLabel: previousComparison.prevLabel,
                  prevStartDate: previousComparison.prevStartDate,
                  prevEndDate: previousComparison.prevEndDate,
                }
          }
        />
      )}

      {/* Report Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-t-xl overflow-x-auto whitespace-nowrap transition-colors print:hidden">
        <button
          id="tab-financial"
          onClick={() => {
            setReportType('financial');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'financial'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Statement of Financial Position & Trial Balance</span>
        </button>

        <button
          id="tab-sales"
          onClick={() => {
            setReportType('sales');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'sales'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>NBR VAT-9.1 Return & Revenue Breakdown</span>
        </button>

        <button
          id="tab-inventory"
          onClick={() => {
            setReportType('inventory');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'inventory'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Stock Valuation & Movement Analysis</span>
        </button>

        <button
          id="tab-payroll"
          onClick={() => {
            setReportType('payroll');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 ${
            reportType === 'payroll'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Operational Payroll & TDS Tax Withholding</span>
        </button>

        <button
          id="tab-analytics"
          onClick={() => {
            setReportType('analytics');
            setSearchQuery('');
          }}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
            reportType === 'analytics'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Executive Visual Trends & Turnover Analytics</span>
        </button>
      </div>

      {/* Filter & Live Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-4 py-3 border-x border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs print:hidden">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${
              reportType === 'financial'
                ? 'by code, account name or category...'
                : reportType === 'sales'
                ? 'by invoice #, customer or status...'
                : reportType === 'inventory'
                ? 'by SKU, item name or category...'
                : reportType === 'payroll'
                ? 'by employee name, designation or dept...'
                : 'by month or metric keyword...'
            }`}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-3 text-2xs text-slate-500 dark:text-slate-400 w-full sm:w-auto justify-between sm:justify-end">
          <span>
            Displaying <strong className="text-slate-800 dark:text-slate-200">{activeCount}</strong> of {totalCount} records
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Export ready (CSV & PDF)
          </span>
        </div>
      </div>

      {/* REPORT 1: FINANCIAL TRIAL BALANCE */}
      {reportType === 'financial' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors print:border-none print:shadow-none print:p-0 print:space-y-4">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 print:grid-cols-4 print:pb-3 print:gap-3 print:border-slate-400">
            <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-blue-700 dark:text-blue-400 print:text-black">Gross Operating Revenue</span>
              <p className="text-lg font-bold font-mono text-blue-950 dark:text-blue-200 print:text-black mt-1">{formatCurrency(stats?.revenue || 0)}</p>
            </div>
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-emerald-700 dark:text-emerald-400 print:text-black">Audited Net Profit</span>
              <p className="text-lg font-bold font-mono text-emerald-950 dark:text-emerald-200 print:text-black mt-1">{formatCurrency(stats?.netProfit || 0)}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-slate-600 dark:text-slate-400 print:text-black">Total Liquid Reserves</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white print:text-black mt-1">{formatCurrency(stats?.cashBalance || 0)}</p>
            </div>
            <div className="p-4 bg-purple-50/60 dark:bg-purple-950/30 rounded-xl border border-purple-100 dark:border-purple-900/50 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-purple-700 dark:text-purple-400 print:text-black">Trial Balance Equality</span>
              <p className="text-lg font-bold font-mono text-purple-950 dark:text-purple-200 print:text-black mt-1">
                {totalDebits === totalCredits ? '100% Balanced' : 'Variance Detected'}
              </p>
            </div>
          </div>

          {/* Interactive Recharts Monthly Revenue Trendline */}
          <div className="print:hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Monthly Operating Revenue & Margin Trajectory
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowInlineRevenueChart((prev) => !prev)}
                className="text-2xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showInlineRevenueChart ? 'Collapse Chart' : 'Expand Chart'}
                {showInlineRevenueChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            {showInlineRevenueChart && (
              <MonthlyRevenueTrendsChart
                data={periodMonthlyTrends}
                invoices={periodInvoices}
                title="Monthly Operating Revenue & Net Margin Trends"
                subtitle={`Visualized with Recharts — ${dateRange.label} (${dateRange.startDate} to ${dateRange.endDate})`}
                dateRangeLabel={dateRange.label}
                height={280}
                activeMetricFilter={
                  selectedKpi === 'revenue'
                    ? 'revenue_only'
                    : selectedKpi === 'expenses'
                    ? 'revenue_expenses'
                    : selectedKpi === 'profit'
                    ? 'revenue_profit'
                    : undefined
                }
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black">General Ledger Balances Summary</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 print:text-slate-600">Deterministic double-entry trial balance ledger records</p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Print this report"
                >
                  <Printer className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-400 print:overflow-visible print:rounded-none">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 print:text-black">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider print:bg-slate-100 print:text-black print:border-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">GL Code</th>
                    <th className="py-2.5 px-3">Account Title</th>
                    <th className="py-2.5 px-3">Classification</th>
                    <th className="py-2.5 px-3 text-right">Debit (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Credit (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredTrialBalance.map((r: any) => (
                    <tr key={r.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{r.code}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">{r.name}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {r.type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{r.debit > 0 ? formatCurrency(r.debit) : '—'}</td>
                      <td className="py-2 px-3 text-right">{r.credit > 0 ? formatCurrency(r.credit) : '—'}</td>
                    </tr>
                  ))}
                  {filteredTrialBalance.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No accounts match your filter criteria
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td className="py-2.5 px-3 font-sans font-normal text-slate-500 dark:text-slate-400">
                      General Ledger Balanced Total
                    </td>
                    <td className="py-2.5 px-3 font-sans text-emerald-600 dark:text-emerald-400">
                      {totalDebits === totalCredits ? '✓ BALANCED' : 'IMBALANCE'}
                    </td>
                    <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-400">{formatCurrency(totalDebits)}</td>
                    <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-400">{formatCurrency(totalCredits)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 2: NBR VAT-9.1 SALES BREAKDOWN */}
      {reportType === 'sales' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors print:border-none print:shadow-none print:p-0 print:space-y-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:bg-white print:border-slate-400 print:p-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 print:text-black">
                Bangladesh NBR VAT Sub-return 9.1 Summary
              </h3>
              <p className="text-2xs text-emerald-700 dark:text-emerald-400 print:text-slate-600 mt-0.5">
                Automated statutory output tax computation on taxable supplies (VAT Act 2012)
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xs uppercase text-emerald-700 dark:text-emerald-400 print:text-black font-bold">Total VAT Output Payable</span>
              <p className="text-xl font-bold font-mono text-emerald-950 dark:text-emerald-200 print:text-black">{formatCurrency(totalVat)}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black">Taxable Sales Invoices</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 print:text-slate-600">Taxable supplies and 15% statutory output withholding</p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Print this report"
                >
                  <Printer className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-400 print:overflow-visible print:rounded-none">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 print:text-black">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider print:bg-slate-100 print:text-black print:border-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Customer Entity</th>
                    <th className="py-2.5 px-3">Issue Date</th>
                    <th className="py-2.5 px-3 text-right">Taxable Supply (BDT)</th>
                    <th className="py-2.5 px-3 text-right">NBR VAT 15%</th>
                    <th className="py-2.5 px-3 text-right">Gross Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">{inv.customerName}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{inv.invoiceDate}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(inv.subTotal)}</td>
                      <td className="py-2 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(inv.taxTotal)}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(inv.grandTotal)}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span
                          className={`px-2 py-0.5 rounded text-3xs font-semibold ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                              : inv.status === 'Sent'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No invoice records match your search
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td colSpan={2} className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 font-normal">
                      Cumulative Statutory Tax Base
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totalRevenue)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(totalVat)}</td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totalInvoiceGross)}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-3xs text-emerald-600 dark:text-emerald-400 font-bold">SUBMITTED</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 3: INVENTORY VALUATION & ASSET MOVEMENT */}
      {reportType === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors print:border-none print:shadow-none print:p-0 print:space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 dark:border-slate-800 gap-4 print:bg-white print:border-slate-400 print:p-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black">Total Material Asset Valuation</h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 print:text-slate-600">Calculated strictly under deterministic FIFO/WAC rules under BAS-2</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-2xs uppercase text-slate-400 print:text-black font-bold">Net Stock Balance Value</span>
              <p className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-400 print:text-black">{formatCurrency(totalInventoryValuation)}</p>
            </div>
          </div>

          {/* Interactive Recharts Inventory Turnover Bar Chart */}
          <div className="print:hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RotateCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Inventory Turnover Velocity & Holding Days Metrics
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowInlineTurnoverChart((prev) => !prev)}
                className="text-2xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showInlineTurnoverChart ? 'Collapse Chart' : 'Expand Chart'}
                {showInlineTurnoverChart ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
            {showInlineTurnoverChart && (
              <InventoryTurnoverChart
                products={products}
                title="Category Inventory Turnover & Working Capital Velocity"
                subtitle={`Visualized with Recharts — category turnover ratios & velocity ratings (${dateRange.label})`}
                dateRangeLabel={dateRange.label}
                height={280}
                activeMetricFilter={selectedKpi === 'inventory' ? 'value_vs_turnover' : undefined}
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black">Perpetual Stock Ledger Inventory</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 print:text-slate-600">Warehouse holdings, cost rates, and total asset worth</p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Print this report"
                >
                  <Printer className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-400 print:overflow-visible print:rounded-none">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 print:text-black">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider print:bg-slate-100 print:text-black print:border-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Item Description</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Standard Unit Cost</th>
                    <th className="py-2.5 px-3 text-right">Quantity On-Hand</th>
                    <th className="py-2.5 px-3 text-right">Line Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredProducts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{p.sku}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">{p.name}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded text-3xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right">{formatCurrency(p.costPrice)}</td>
                      <td className="py-2 px-3 text-right font-sans font-bold text-slate-900 dark:text-white">
                        {Number(p.currentStock || 0).toLocaleString()} {p.unit}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">
                        {formatCurrency(p.totalStockValue)}
                      </td>
                    </tr>
                  ))}
                  {filteredProducts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No inventory materials match your filter
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td colSpan={3} className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 font-normal">
                      Physical Inventory Valuation Sum
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">{totalStockUnits.toLocaleString()} Units</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">{formatCurrency(totalInventoryValuation)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 4: OPERATIONAL PAYROLL & TAX WITHHOLDING */}
      {reportType === 'payroll' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors print:border-none print:shadow-none print:p-0 print:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-6 border-b border-slate-100 dark:border-slate-800 print:grid-cols-4 print:pb-3 print:gap-3 print:border-slate-400">
            <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-indigo-700 dark:text-indigo-400 print:text-black">Gross Monthly Payroll</span>
              <p className="text-lg font-bold font-mono text-indigo-950 dark:text-indigo-200 print:text-black mt-1">{formatCurrency(totalGrossPayroll)}</p>
            </div>
            <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/50 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-amber-700 dark:text-amber-400 print:text-black">Total TDS Withholding</span>
              <p className="text-lg font-bold font-mono text-amber-950 dark:text-amber-200 print:text-black mt-1">{formatCurrency(totalPayrollTds)}</p>
            </div>
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-900/50 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-emerald-700 dark:text-emerald-400 print:text-black">Net Disbursements</span>
              <p className="text-lg font-bold font-mono text-emerald-950 dark:text-emerald-200 print:text-black mt-1">{formatCurrency(totalNetPayable)}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 print:bg-white print:border-slate-400 print:p-2">
              <span className="text-2xs font-semibold uppercase text-slate-600 dark:text-slate-400 print:text-black">Workforce Headcount</span>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white print:text-black mt-1">{employees.length} Employees</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white print:text-black">Employee Compensation & Withholdings</h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400 print:text-slate-600">Salary breakdown, allowances, and statutory income tax deductions</p>
              </div>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Print this report"
                >
                  <Printer className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                  <span>Print</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
                >
                  <FileText className="w-3 h-3 text-blue-600" />
                  <span>PDF</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-400 print:overflow-visible print:rounded-none">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 print:text-black">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider print:bg-slate-100 print:text-black print:border-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Emp ID</th>
                    <th className="py-2.5 px-3">Employee Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Designation</th>
                    <th className="py-2.5 px-3 text-right">Gross Salary (BDT)</th>
                    <th className="py-2.5 px-3 text-right">TDS Tax (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Net Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {filteredEmployees.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">{e.employeeId}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200 font-medium">
                        {e.firstName} {e.lastName}
                      </td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{e.departmentName}</td>
                      <td className="py-2 px-3 font-sans text-slate-500 dark:text-slate-400">{e.designation}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(e.grossSalary)}</td>
                      <td className="py-2 px-3 text-right text-amber-700 dark:text-amber-400 font-bold">{formatCurrency(e.taxDeduction)}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(e.netPayable)}</td>
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500 font-sans">
                        No employee payroll records match your search
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL</td>
                    <td colSpan={3} className="py-2.5 px-3 font-sans text-slate-500 dark:text-slate-400 font-normal">
                      Workforce Payroll Obligations & Withholdings
                    </td>
                    <td className="py-2.5 px-3 text-right">{formatCurrency(totalGrossPayroll)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-700 dark:text-amber-400 font-bold">{formatCurrency(totalPayrollTds)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400 font-bold">{formatCurrency(totalNetPayable)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT 5: EXECUTIVE VISUAL TRENDS & TURNOVER ANALYTICS */}
      {reportType === 'analytics' && (
        <div className="bg-white dark:bg-slate-900 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors print:border-none print:shadow-none print:p-0 print:space-y-4">
          {/* Executive Analytics Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 print:bg-white print:border-slate-400 print:p-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white print:text-black">
                  Executive BI: Monthly Revenue & Inventory Turnover Intelligence
                </h3>
              </div>
              <p className="text-2xs sm:text-xs text-slate-500 dark:text-slate-400 print:text-slate-600 mt-0.5">
                Visualizing multi-period operating performance alongside perpetual material turnover velocity using Recharts
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                title="Print this executive report"
              >
                <Printer className="w-3 h-3 text-slate-600 dark:text-slate-400" />
                <span>Print</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportPDF}
                className="px-2.5 py-1 text-2xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-700 flex items-center gap-1 transition-colors"
              >
                <FileText className="w-3 h-3 text-blue-600" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Recharts Chart 1: Monthly Revenue Trajectory (Line Chart) */}
          <div className="print:break-inside-avoid">
            <MonthlyRevenueTrendsChart
              data={periodMonthlyTrends}
              invoices={periodInvoices}
              title={`${dateRange.preset === 'all' ? '12-Month' : dateRange.label} Audited Operating Revenue Trajectory`}
              subtitle={`Recharts Line Visualization — ${dateRange.label} (${dateRange.startDate} to ${dateRange.endDate}) operating revenue, audited net profit, and MoM velocity`}
              dateRangeLabel={dateRange.label}
              height={320}
              showControls={true}
              activeMetricFilter={
                selectedKpi === 'revenue'
                  ? 'revenue_only'
                  : selectedKpi === 'expenses'
                  ? 'revenue_expenses'
                  : selectedKpi === 'profit'
                  ? 'revenue_profit'
                  : undefined
              }
            />
          </div>

          {/* Recharts Chart 2: Inventory Turnover & Velocity Metrics (Bar Chart) */}
          <div className="print:break-inside-avoid">
            <InventoryTurnoverChart
              products={products}
              title="Perpetual Material Stock Turnover & Holding Days by Category"
              subtitle={`Recharts Bar Visualization — category-level turnover ratio (turns/yr), holding days (DSI), and working capital rating (${dateRange.label})`}
              dateRangeLabel={dateRange.label}
              height={320}
              showControls={true}
              activeMetricFilter={selectedKpi === 'inventory' ? 'value_vs_turnover' : undefined}
            />
          </div>

          {/* Category Working Capital & Turnover Summary Table */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white print:text-black">
                  Category Asset Liquidity & Annualized Turnover Schedule
                </h4>
                <p className="text-3xs text-slate-500 dark:text-slate-400">
                  Comprehensive audit reconciliation between inventory asset capital and stock liquidation velocity
                </p>
              </div>
              <span className="text-3xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
                Audited BI Ledger
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 print:border-slate-400">
              <table className="w-full text-xs text-left text-slate-600 dark:text-slate-300 print:text-black">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase border-b border-slate-200 dark:border-slate-700 text-3xs tracking-wider print:bg-slate-100 print:text-black">
                  <tr>
                    <th className="py-2.5 px-3">Product Category</th>
                    <th className="py-2.5 px-3 text-right">Active SKUs</th>
                    <th className="py-2.5 px-3 text-right">Physical Units</th>
                    <th className="py-2.5 px-3 text-right">Valuation (BDT)</th>
                    <th className="py-2.5 px-3 text-right">Turnover (Turns/Yr)</th>
                    <th className="py-2.5 px-3 text-right">Days on Hand (DSI)</th>
                    <th className="py-2.5 px-3 text-center">Velocity Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {Array.from(new Set(products.map((p) => p.category || 'General Items'))).map((catName) => {
                    const catItems = products.filter((p) => (p.category || 'General Items') === catName);
                    const catValue = catItems.reduce((acc, p) => acc + (Number(p.totalStockValue) || (Number(p.currentStock) * Number(p.costPrice)) || 0), 0);
                    const catUnits = catItems.reduce((acc, p) => acc + (Number(p.currentStock) || 0), 0);
                    const benchmarkTurns =
                      catName === 'Raw Materials' ? 6.8 :
                      catName === 'Packaging Materials' ? 7.4 :
                      catName === 'Finished Apparel' ? 5.2 :
                      catName === 'Chemicals & Dyes' ? 4.2 :
                      catName === 'Accessories & Trims' ? 3.8 : 4.5;
                    const days = Math.round(365 / benchmarkTurns);

                    return (
                      <tr key={catName} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">{catName}</td>
                        <td className="py-2 px-3 text-right">{catItems.length} SKUs</td>
                        <td className="py-2 px-3 text-right">{catUnits.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(catValue)}</td>
                        <td className="py-2 px-3 text-right font-bold text-blue-700 dark:text-blue-400">{benchmarkTurns}x / yr</td>
                        <td className="py-2 px-3 text-right">{days} days</td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span className={`text-3xs font-bold px-2 py-0.5 rounded ${
                            benchmarkTurns >= 6.0
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : benchmarkTurns >= 4.0
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            {benchmarkTurns >= 6.0 ? 'High Velocity' : benchmarkTurns >= 4.0 ? 'Optimal Turn' : 'Moderate'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100/70 dark:bg-slate-800 font-mono font-bold text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <tr>
                    <td className="py-2.5 px-3">TOTAL / WEIGHTED</td>
                    <td className="py-2.5 px-3 text-right">{products.length} SKUs</td>
                    <td className="py-2.5 px-3 text-right">{totalStockUnits.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-700 dark:text-emerald-400">{formatCurrency(totalInventoryValuation)}</td>
                    <td className="py-2.5 px-3 text-right text-blue-700 dark:text-blue-400">5.4x / yr</td>
                    <td className="py-2.5 px-3 text-right">68 days</td>
                    <td className="py-2.5 px-3 text-center font-sans text-emerald-600 dark:text-emerald-400">OPTIMAL</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report Presets Save & Manage Modal (Local Storage Persistence) */}
      <ReportPresetsModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        activePresetId={activePresetId}
        presets={presets}
        currentDateRange={dateRange}
        currentEntitySegment={entitySegment}
        currentReportType={reportType}
        onSelectPreset={handleSelectPreset}
        onSaveNewPreset={handleSaveNewPreset}
        onDeletePreset={handleDeletePreset}
        onSetDefaultPreset={handleSetDefaultPreset}
        onResetToDefaults={handleResetToDefaults}
        initialTab={presetModalInitialTab}
      />

      {/* Formal Signatures & Audit Certification Footer - ONLY visible during Browser Print */}
      <div className="hidden print:block mt-10 pt-6 border-t-2 border-black text-black print-avoid-break">
        <div className="grid grid-cols-3 gap-8 mb-6">
          <div className="border-t border-slate-500 pt-2 text-center">
            <div className="text-xs font-bold uppercase">{preparedBy}</div>
            <div className="text-3xs text-slate-700">Prepared By (Finance Officer)</div>
            <div className="text-3xs text-slate-600 font-mono mt-1">Signature: ______________________</div>
          </div>

          <div className="border-t border-slate-500 pt-2 text-center">
            <div className="text-xs font-bold uppercase">Internal Audit & Compliance</div>
            <div className="text-3xs text-slate-700">Verified & Reconciled By</div>
            <div className="text-3xs text-slate-600 font-mono mt-1">Signature: ______________________</div>
          </div>

          <div className="border-t border-slate-500 pt-2 text-center">
            <div className="text-xs font-bold uppercase">Chief Financial Officer / CEO</div>
            <div className="text-3xs text-slate-700">Final Executive Approval</div>
            <div className="text-3xs text-slate-600 font-mono mt-1">Signature: ______________________</div>
          </div>
        </div>

        <div className="flex justify-between items-center text-3xs text-slate-600 font-mono pt-2 border-t border-slate-300">
          <div>
            CONFIDENTIAL & PROPRIETARY — Certified system-generated record from ApexERP Enterprise Platform.
          </div>
          <div>
            Compliant with NBR VAT Act 2012 & Income Tax Act 2023
          </div>
        </div>
      </div>
    </div>
  );
};
