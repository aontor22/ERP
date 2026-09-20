import { DateRange, getPresetDateRange } from './ReportDateRangePicker.js';

export interface EntitySegmentFilter {
  entityId: string;     // 'all' | 'comp-textile' | 'comp-logistics' | 'comp-apex-group'
  entityName: string;   // e.g. "Consolidated Group (All Entities)"
  segmentId: string;    // 'all' | 'textile-mfg' | 'logistics-shipping' | 'export-commercial' | 'corporate-shared'
  segmentName: string;  // e.g. "All Operating Segments"
}

export interface ReportPreset {
  id: string;
  name: string;
  description?: string;
  isSystem?: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt?: string;

  // Filter Configurations:
  dateRange: DateRange;
  entitySegment: EntitySegmentFilter;
  reportType?: 'financial' | 'sales' | 'inventory' | 'payroll' | 'analytics';
}

export interface EntityOption {
  id: string;
  name: string;
  code: string;
  taxId: string;
  currency: string;
  type: 'consolidated' | 'subsidiary' | 'holding';
  description: string;
}

export interface SegmentOption {
  id: string;
  name: string;
  code: string;
  description: string;
  relevantEntityId?: string; // 'all' or specific company
}

export const ENTITY_OPTIONS: EntityOption[] = [
  {
    id: 'all',
    name: 'Consolidated Group (All Entities)',
    code: 'GROUP-CONSOL',
    taxId: 'NBR Multi-Entity Group TIN: 481920481-01',
    currency: 'BDT',
    type: 'consolidated',
    description: 'Statutory combined consolidation across all operating subsidiaries and holding entities',
  },
  {
    id: 'comp-textile',
    name: 'Apex Textile & Apparel Mills Ltd.',
    code: 'APEX-TEXTILE',
    taxId: 'BIN: 004829104-0202',
    currency: 'BDT',
    type: 'subsidiary',
    description: 'Composite spinning, dyeing, knitting, and export garments manufacturing facility (Gazipur)',
  },
  {
    id: 'comp-logistics',
    name: 'Apex Global Logistics & Shipping',
    code: 'APEX-LOGISTICS',
    taxId: 'BIN: 007391823-0303',
    currency: 'BDT',
    type: 'subsidiary',
    description: 'Port container depot, terminal freight, customs clearance, and multi-modal logistics (Chittagong)',
  },
  {
    id: 'comp-apex-group',
    name: 'Apex Group Holdings Ltd.',
    code: 'APEX-HOLDINGS',
    taxId: 'BIN: 001928471-0101',
    currency: 'BDT',
    type: 'holding',
    description: 'Corporate headquarters, executive treasury, shared services, and strategic capital management (Dhaka)',
  },
];

export const SEGMENT_OPTIONS: SegmentOption[] = [
  {
    id: 'all',
    name: 'All Operating Segments',
    code: 'SEG-ALL',
    description: 'Full business scope combining manufacturing, supply chain, exports, and administration',
  },
  {
    id: 'textile-mfg',
    name: 'Manufacturing & Spinning Operations',
    code: 'SEG-MFG',
    description: 'Raw cotton, synthetic yarn, fabric knitting, wet dyeing, and finished apparel production',
    relevantEntityId: 'comp-textile',
  },
  {
    id: 'export-commercial',
    name: 'Commercial & Global Export Sales',
    code: 'SEG-EXP',
    description: 'International buyer export orders (Zara, H&M, Inditex) and foreign currency receivables',
    relevantEntityId: 'comp-textile',
  },
  {
    id: 'logistics-shipping',
    name: 'Freight, Terminal & Port Logistics',
    code: 'SEG-LOG',
    description: 'Port depot operations, bonded container handling, marine freight, and bonded transit',
    relevantEntityId: 'comp-logistics',
  },
  {
    id: 'corporate-shared',
    name: 'Corporate Treasury & Shared Services',
    code: 'SEG-CORP',
    description: 'Central treasury, corporate finance, enterprise HR payroll, and NBR tax withholding',
    relevantEntityId: 'comp-apex-group',
  },
];

export const DEFAULT_ENTITY_SEGMENT: EntitySegmentFilter = {
  entityId: 'all',
  entityName: 'Consolidated Group (All Entities)',
  segmentId: 'all',
  segmentName: 'All Operating Segments',
};

// Built-in System Presets (Statutory standards & common executive views)
export const BUILTIN_REPORT_PRESETS: ReportPreset[] = [
  {
    id: 'preset-sys-consolidated-all',
    name: 'Consolidated Group - Audited FY26 (All Time)',
    description: 'Full statutory consolidation across all legal entities and operational divisions (12M Audited)',
    isSystem: true,
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    dateRange: getPresetDateRange('all'),
    entitySegment: {
      entityId: 'all',
      entityName: 'Consolidated Group (All Entities)',
      segmentId: 'all',
      segmentName: 'All Operating Segments',
    },
    reportType: 'financial',
  },
  {
    id: 'preset-sys-textile-ytd',
    name: 'Apex Textile Mills - YTD Performance',
    description: 'Composite manufacturing plant revenue, NBR VAT-9.1 returns, and RMG production margins',
    isSystem: true,
    isDefault: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    dateRange: getPresetDateRange('ytd'),
    entitySegment: {
      entityId: 'comp-textile',
      entityName: 'Apex Textile & Apparel Mills Ltd.',
      segmentId: 'textile-mfg',
      segmentName: 'Manufacturing & Spinning Operations',
    },
    reportType: 'sales',
  },
  {
    id: 'preset-sys-logistics-90d',
    name: 'Logistics & Terminal Freight - Last 90D',
    description: 'Chittagong port depot throughput, customs handling, and supply chain quarterly expenses',
    isSystem: true,
    isDefault: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    dateRange: getPresetDateRange('last90'),
    entitySegment: {
      entityId: 'comp-logistics',
      entityName: 'Apex Global Logistics & Shipping',
      segmentId: 'logistics-shipping',
      segmentName: 'Freight, Terminal & Port Logistics',
    },
    reportType: 'analytics',
  },
  {
    id: 'preset-sys-corporate-30d',
    name: 'Corporate Treasury & Payroll - Last 30D',
    description: 'Headquarters payroll runs, TDS withholding at source, and executive overheads (Trailing 30D)',
    isSystem: true,
    isDefault: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    dateRange: getPresetDateRange('last30'),
    entitySegment: {
      entityId: 'comp-apex-group',
      entityName: 'Apex Group Holdings Ltd.',
      segmentId: 'corporate-shared',
      segmentName: 'Corporate Treasury & Shared Services',
    },
    reportType: 'payroll',
  },
  {
    id: 'preset-sys-inventory-bonded',
    name: 'Bonded Warehouse & Inventory Valuation',
    description: 'Raw materials, dyes, synthetic yarn, and bonded finished goods valuation (Gazipur Bays)',
    isSystem: true,
    isDefault: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    dateRange: getPresetDateRange('all'),
    entitySegment: {
      entityId: 'comp-textile',
      entityName: 'Apex Textile & Apparel Mills Ltd.',
      segmentId: 'all',
      segmentName: 'All Operating Segments',
    },
    reportType: 'inventory',
  },
];

// Local Storage Keys
export const STORAGE_KEY_PRESETS = 'erp_report_presets_v1';
export const STORAGE_KEY_ACTIVE_PRESET_ID = 'erp_active_report_preset_id';

/**
 * Load all presets (built-in + user-saved from localStorage)
 */
export function loadAllReportPresets(): ReportPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PRESETS);
    if (!raw) {
      return BUILTIN_REPORT_PRESETS;
    }
    const userPresets: ReportPreset[] = JSON.parse(raw);
    if (!Array.isArray(userPresets)) {
      return BUILTIN_REPORT_PRESETS;
    }

    // Check if user set a custom default
    const customDefault = userPresets.find((p) => p.isDefault);

    // Merge system presets with user-created presets
    // If a user has overridden default, ensure system default is adjusted
    const systemPresets = BUILTIN_REPORT_PRESETS.map((sys) => ({
      ...sys,
      isDefault: customDefault ? false : sys.isDefault,
    }));

    return [...systemPresets, ...userPresets];
  } catch (err) {
    console.error('Failed to load report presets from localStorage:', err);
    return BUILTIN_REPORT_PRESETS;
  }
}

/**
 * Save custom user presets to localStorage
 */
export function saveUserReportPresets(allPresets: ReportPreset[]): void {
  try {
    const userOnly = allPresets.filter((p) => !p.isSystem);
    localStorage.setItem(STORAGE_KEY_PRESETS, JSON.stringify(userOnly));
  } catch (err) {
    console.error('Failed to save report presets to localStorage:', err);
  }
}

/**
 * Get the active preset ID from localStorage
 */
export function getActivePresetIdFromStorage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_ACTIVE_PRESET_ID);
  } catch {
    return null;
  }
}

/**
 * Save active preset ID to localStorage
 */
export function saveActivePresetIdToStorage(presetId: string | null): void {
  try {
    if (presetId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_PRESET_ID, presetId);
    } else {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_PRESET_ID);
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Compare two filter states to check if they match a preset exactly
 */
export function isFilterMatchingPreset(
  currentDateRange: DateRange,
  currentEntitySegment: EntitySegmentFilter,
  preset: ReportPreset
): boolean {
  const dateMatch =
    currentDateRange.preset === preset.dateRange.preset &&
    currentDateRange.startDate === preset.dateRange.startDate &&
    currentDateRange.endDate === preset.dateRange.endDate;

  const entityMatch =
    currentEntitySegment.entityId === preset.entitySegment.entityId &&
    currentEntitySegment.segmentId === preset.entitySegment.segmentId;

  return dateMatch && entityMatch;
}
