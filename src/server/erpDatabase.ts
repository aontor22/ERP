import {
  Account,
  ApprovalRequest,
  AuditLogEntry,
  BillOfMaterial,
  Company,
  Customer,
  Employee,
  ExpenseBudget,
  ExpenseBudgetSummary,
  InventoryForecastItem,
  InventoryForecastSummary,
  JournalEntry,
  PayrollRun,
  Product,
  ProductionOrder,
  PurchaseOrder,
  SalesInvoice,
  SalesOrder,
  RoleType,
  SecurityPolicySettings,
  SecurityUserAccount,
  SoDConflictRule,
  SoDScanReport,
  SoDViolation,
  StockLedgerEntry,
  StockoutRiskLevel,
  Supplier,
  SystemConfig,
  SystemNotification,
  UserSession,
} from '../types/erp.js';

class ERPDatabase {
  public config: SystemConfig = {
    defaultCurrency: 'BDT',
    currencySymbol: '৳',
    vatPercentage: 15,
    withholdingTaxRate: 5,
    fiscalYearCycle: 'July-June',
    enableBangladeshNBRRules: true,
    enableAutoJournalOnInvoicing: true,
    enableStrictNegativeStockBlock: true,
    approvalThresholdPO: 500000, // 500,000 BDT requires higher tier
  };

  public companies: Company[] = [
    {
      id: 'comp-apex-group',
      name: 'Apex Group Holdings Ltd.',
      code: 'APEX-HOLDINGS',
      taxId: 'BIN: 001928471-0101',
      currency: 'BDT',
      currencySymbol: '৳',
      address: 'Plot 42, Gulshan Avenue, Dhaka 1212',
      city: 'Dhaka',
      country: 'Bangladesh',
      fiscalYearStart: '07-01',
      branches: [
        {
          id: 'br-hq',
          companyId: 'comp-apex-group',
          name: 'Apex Tower Headquarters',
          code: 'HQ-DHK',
          address: 'Gulshan-2, Dhaka',
          isHeadOffice: true,
        },
      ],
    },
    {
      id: 'comp-textile',
      name: 'Apex Textile & Apparel Mills Ltd.',
      code: 'APEX-TEXTILE',
      taxId: 'BIN: 004829104-0202',
      currency: 'BDT',
      currencySymbol: '৳',
      address: 'Kashimpur Industrial Area, Gazipur',
      city: 'Gazipur',
      country: 'Bangladesh',
      fiscalYearStart: '07-01',
      branches: [
        {
          id: 'br-gazipur-plant',
          companyId: 'comp-textile',
          name: 'Gazipur Composite Mill 1',
          code: 'PLANT-GZP',
          address: 'Kashimpur, Gazipur',
          isHeadOffice: true,
        },
        {
          id: 'br-ctg-depot',
          companyId: 'comp-textile',
          name: 'Chittagong Port Export Depot',
          code: 'DEPOT-CTG',
          address: 'Agrabad C/A, Chittagong',
          isHeadOffice: false,
        },
      ],
    },
    {
      id: 'comp-logistics',
      name: 'Apex Global Logistics & Shipping',
      code: 'APEX-LOGISTICS',
      taxId: 'BIN: 007391823-0303',
      currency: 'BDT',
      currencySymbol: '৳',
      address: 'Port Access Road, Halishahar, Chittagong',
      city: 'Chittagong',
      country: 'Bangladesh',
      fiscalYearStart: '07-01',
      branches: [
        {
          id: 'br-ctg-port',
          companyId: 'comp-logistics',
          name: 'Halishahar Terminal',
          code: 'TERM-HALI',
          address: 'Chittagong Port Zone',
          isHeadOffice: true,
        },
      ],
    },
  ];

  public warehouses = [
    {
      id: 'wh-gzp-central',
      companyId: 'comp-textile',
      branchId: 'br-gazipur-plant',
      name: 'Central Raw Materials Depot',
      code: 'WH-GZP-01',
      location: 'Gazipur Bay A-12',
      totalCapacitySqFt: 45000,
    },
    {
      id: 'wh-gzp-fg',
      companyId: 'comp-textile',
      branchId: 'br-gazipur-plant',
      name: 'Finished Goods Bonded Warehouse',
      code: 'WH-GZP-02',
      location: 'Gazipur Bay C-04',
      totalCapacitySqFt: 32000,
    },
    {
      id: 'wh-ctg-export',
      companyId: 'comp-textile',
      branchId: 'br-ctg-depot',
      name: 'Chittagong Port CFS Warehouse',
      code: 'WH-CTG-01',
      location: 'Agrabad Port Shed 3',
      totalCapacitySqFt: 28000,
    },
  ];

  public products: Product[] = [
    {
      id: 'prod-001',
      sku: 'RM-CTN-30S',
      barcode: '894102938101',
      name: '100% Combed Cotton Yarn 30/1',
      description: 'High tensile strength combed cotton yarn for export-grade knitwear',
      category: 'Raw Materials',
      brand: 'Apex Spinning',
      type: 'Raw Material',
      unit: 'Kg',
      costPrice: 420,
      sellingPrice: 480,
      taxRate: 5,
      reorderLevel: 2500,
      minStock: 1000,
      maxStock: 25000,
      weightKg: 1,
      valuationMethod: 'FIFO',
      batchTracking: true,
      serialTracking: false,
      currentStock: 8400,
      totalStockValue: 3528000,
      companyId: 'comp-textile',
      leadTimeDays: 14,
      supplierId: 'sup-001',
      supplierName: 'Dhaka Yarn & Spinning Mills Ltd.',
      warehouseAllocations: [
        { warehouseId: 'wh-gzp-central', warehouseName: 'Central Raw Materials Depot', quantity: 8400 },
      ],
    },
    {
      id: 'prod-002',
      sku: 'RM-DYE-NVY',
      barcode: '894102938102',
      name: 'Reactive Navy Blue Eco Dye (Dystar)',
      description: 'OEKO-TEX Standard 100 compliant textile dye',
      category: 'Chemicals & Dyes',
      brand: 'DyStar Eco',
      type: 'Raw Material',
      unit: 'Kg',
      costPrice: 950,
      sellingPrice: 1100,
      taxRate: 15,
      reorderLevel: 400,
      minStock: 200,
      maxStock: 3000,
      weightKg: 1,
      valuationMethod: 'FIFO',
      batchTracking: true,
      serialTracking: false,
      currentStock: 1250,
      totalStockValue: 1187500,
      companyId: 'comp-textile',
      leadTimeDays: 10,
      supplierId: 'sup-003',
      supplierName: 'DyStar Chemicals Bangladesh Ltd.',
      warehouseAllocations: [
        { warehouseId: 'wh-gzp-central', warehouseName: 'Central Raw Materials Depot', quantity: 1250 },
      ],
    },
    {
      id: 'prod-003',
      sku: 'FG-POLO-NAVY-L',
      barcode: '894102938103',
      name: 'Premium Pique Polo Shirt - Navy (L)',
      description: '220 GSM 100% combed cotton polo with ribbed collar and placket',
      category: 'Finished Apparel',
      brand: 'Apex Heritage',
      type: 'Finished Good',
      unit: 'Pcs',
      costPrice: 780,
      sellingPrice: 1450,
      taxRate: 15,
      reorderLevel: 1200,
      minStock: 500,
      maxStock: 12000,
      weightKg: 0.28,
      valuationMethod: 'WAC',
      batchTracking: true,
      serialTracking: false,
      currentStock: 3400,
      totalStockValue: 2652000,
      companyId: 'comp-textile',
      leadTimeDays: 20,
      warehouseAllocations: [
        { warehouseId: 'wh-gzp-fg', warehouseName: 'Finished Goods Bonded Warehouse', quantity: 2800 },
        { warehouseId: 'wh-ctg-export', warehouseName: 'Chittagong Port CFS Warehouse', quantity: 600 },
      ],
    },
    {
      id: 'prod-004',
      sku: 'FG-HOODIE-BLK-M',
      barcode: '894102938104',
      name: 'Heavyweight Fleece Zip Hoodie - Black (M)',
      description: '360 GSM brushed fleece fleece jacket with YKK brass zipper',
      category: 'Finished Apparel',
      brand: 'Apex Heritage',
      type: 'Finished Good',
      unit: 'Pcs',
      costPrice: 1250,
      sellingPrice: 2400,
      taxRate: 15,
      reorderLevel: 800,
      minStock: 300,
      maxStock: 6000,
      weightKg: 0.65,
      valuationMethod: 'WAC',
      batchTracking: true,
      serialTracking: false,
      currentStock: 1950,
      totalStockValue: 2437500,
      companyId: 'comp-textile',
      leadTimeDays: 25,
      warehouseAllocations: [
        { warehouseId: 'wh-gzp-fg', warehouseName: 'Finished Goods Bonded Warehouse', quantity: 1950 },
      ],
    },
    {
      id: 'prod-005',
      sku: 'RM-BTN-CORO-18',
      barcode: '894102938105',
      name: 'Natural Corozo 4-Hole Buttons 18L',
      description: 'Sustainable eco-friendly natural corozo buttons for polo plackets',
      category: 'Trims & Accessories',
      brand: 'Crown Trims',
      type: 'Raw Material',
      unit: 'Gross',
      costPrice: 180,
      sellingPrice: 220,
      taxRate: 15,
      reorderLevel: 80,
      minStock: 40,
      maxStock: 1000,
      weightKg: 0.15,
      valuationMethod: 'FIFO',
      batchTracking: false,
      serialTracking: false,
      currentStock: 320,
      totalStockValue: 57600,
      companyId: 'comp-textile',
      leadTimeDays: 7,
      supplierId: 'sup-002',
      supplierName: 'YKK Fastening Products Bangladesh',
      warehouseAllocations: [
        { warehouseId: 'wh-gzp-central', warehouseName: 'Central Raw Materials Depot', quantity: 320 },
      ],
    },
    {
      id: 'prod-006',
      sku: 'RM-ZIP-YKK-24',
      barcode: '894102938106',
      name: 'YKK Antique Brass Open-End Zipper #5 24"',
      description: 'Heavy duty brass zipper for fleece hoodies and outerwear',
      category: 'Trims & Accessories',
      brand: 'YKK Fastening',
      type: 'Raw Material',
      unit: 'Pcs',
      costPrice: 85,
      sellingPrice: 110,
      taxRate: 15,
      reorderLevel: 450,
      minStock: 200,
      maxStock: 3000,
      weightKg: 0.05,
      valuationMethod: 'FIFO',
      batchTracking: false,
      serialTracking: false,
      currentStock: 140,
      totalStockValue: 11900,
      companyId: 'comp-textile',
      leadTimeDays: 10,
      supplierId: 'sup-002',
      supplierName: 'YKK Fastening Products Bangladesh',
      warehouseAllocations: [
        { warehouseId: 'wh-gzp-central', warehouseName: 'Central Raw Materials Depot', quantity: 140 },
      ],
    },
    {
      id: 'prod-007',
      sku: 'RM-RIB-ELAS-20',
      barcode: '894102938107',
      name: 'Organic Cotton 1x1 Rib Knit Collar Fabric',
      description: 'Pre-shrunk 95/5 cotton elastane rib fabric for cuffs and collars',
      category: 'Raw Materials',
      brand: 'Apex Spinning',
      type: 'Raw Material',
      unit: 'Kg',
      costPrice: 480,
      sellingPrice: 560,
      taxRate: 5,
      reorderLevel: 550,
      minStock: 250,
      maxStock: 3500,
      weightKg: 1,
      valuationMethod: 'FIFO',
      batchTracking: true,
      serialTracking: false,
      currentStock: 480,
      totalStockValue: 230400,
      companyId: 'comp-textile',
      leadTimeDays: 14,
      supplierId: 'sup-001',
      supplierName: 'Dhaka Yarn & Spinning Mills Ltd.',
      warehouseAllocations: [
        { warehouseId: 'wh-gzp-central', warehouseName: 'Central Raw Materials Depot', quantity: 480 },
      ],
    },
  ];

  public stockLedger: StockLedgerEntry[] = [
    {
      id: 'stk-001',
      timestamp: '2026-09-01T09:30:00Z',
      companyId: 'comp-textile',
      warehouseId: 'wh-gzp-central',
      warehouseName: 'Central Raw Materials Depot',
      productId: 'prod-001',
      productName: '100% Combed Cotton Yarn 30/1',
      sku: 'RM-CTN-30S',
      movementType: 'Receipt',
      referenceDocType: 'PO',
      referenceDocNumber: 'PO-2026-0001',
      quantityChange: 10000,
      balanceQuantity: 10000,
      unitCost: 420,
      totalCost: 4200000,
      batchNumber: 'BATCH-2026-YARN-89',
      user: 'Rahim Uddin (Warehouse Supv)',
      reason: 'GRN from Dhaka Yarn Traders',
    },
    {
      id: 'stk-002',
      timestamp: '2026-09-04T14:15:00Z',
      companyId: 'comp-textile',
      warehouseId: 'wh-gzp-central',
      warehouseName: 'Central Raw Materials Depot',
      productId: 'prod-001',
      productName: '100% Combed Cotton Yarn 30/1',
      sku: 'RM-CTN-30S',
      movementType: 'Production Consume',
      referenceDocType: 'Production',
      referenceDocNumber: 'MO-2026-0012',
      quantityChange: -1600,
      balanceQuantity: 8400,
      unitCost: 420,
      totalCost: 672000,
      batchNumber: 'BATCH-2026-YARN-89',
      user: 'Jahangir Alam (Production Eng)',
      reason: 'Issued to Knitting Line 4',
    },
    {
      id: 'stk-003',
      timestamp: '2026-09-08T11:00:00Z',
      companyId: 'comp-textile',
      warehouseId: 'wh-gzp-fg',
      warehouseName: 'Finished Goods Bonded Warehouse',
      productId: 'prod-003',
      productName: 'Premium Pique Polo Shirt - Navy (L)',
      sku: 'FG-POLO-NAVY-L',
      movementType: 'Production Yield',
      referenceDocType: 'Production',
      referenceDocNumber: 'MO-2026-0012',
      quantityChange: 3400,
      balanceQuantity: 3400,
      unitCost: 780,
      totalCost: 2652000,
      batchNumber: 'BATCH-2026-POLO-04',
      user: 'Jahangir Alam (Production Eng)',
      reason: 'Batch QC Pass & Warehouse Inward',
    },
  ];

  public chartOfAccounts: Account[] = [
    // 1000 Assets
    { id: 'acc-1010', code: '1010', name: 'Petty Cash - Gazipur Office', category: 'Asset', subCategory: 'Cash & Bank', companyId: 'comp-textile', balance: 145000, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-1020', code: '1020', name: 'Standard Chartered Operating A/C', category: 'Asset', subCategory: 'Cash & Bank', companyId: 'comp-textile', balance: 48950000, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-1030', code: '1030', name: 'Dutch-Bangla Bank Export LC A/C', category: 'Asset', subCategory: 'Cash & Bank', companyId: 'comp-textile', balance: 32400000, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-1100', code: '1100', name: 'Accounts Receivable (Trade Debtors)', category: 'Asset', subCategory: 'Receivables', companyId: 'comp-textile', balance: 24780000, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-1210', code: '1210', name: 'Inventory - Raw Materials', category: 'Asset', subCategory: 'Inventory', companyId: 'comp-textile', balance: 4773100, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-1220', code: '1220', name: 'Inventory - Finished Goods', category: 'Asset', subCategory: 'Inventory', companyId: 'comp-textile', balance: 5089500, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-1500', code: '1500', name: 'Fixed Assets - Industrial Machinery & Plant', category: 'Asset', subCategory: 'Property, Plant & Equipment', companyId: 'comp-textile', balance: 125000000, isDebitNormal: true, isSystemAccount: false },
    // 2000 Liabilities
    { id: 'acc-2010', code: '2010', name: 'Accounts Payable (Trade Creditors)', category: 'Liability', subCategory: 'Payables', companyId: 'comp-textile', balance: 14250000, isDebitNormal: false, isSystemAccount: true },
    { id: 'acc-2100', code: '2100', name: 'NBR VAT Payable (15% Output Tax)', category: 'Liability', subCategory: 'Tax Liabilities', companyId: 'comp-textile', balance: 3420000, isDebitNormal: false, isSystemAccount: true },
    { id: 'acc-2200', code: '2200', name: 'Accrued Salaries & Employee Dues', category: 'Liability', subCategory: 'Payroll Liabilities', companyId: 'comp-textile', balance: 4210000, isDebitNormal: false, isSystemAccount: true },
    { id: 'acc-2300', code: '2300', name: 'Long Term Bank Financing Facility', category: 'Liability', subCategory: 'Long-term Debt', companyId: 'comp-textile', balance: 50000000, isDebitNormal: false, isSystemAccount: false },
    // 3000 Equity
    { id: 'acc-3010', code: '3010', name: 'Paid-Up Share Capital', category: 'Equity', subCategory: 'Equity', companyId: 'comp-textile', balance: 80000000, isDebitNormal: false, isSystemAccount: true },
    { id: 'acc-3020', code: '3020', name: 'Retained Earnings', category: 'Equity', subCategory: 'Equity', companyId: 'comp-textile', balance: 64127600, isDebitNormal: false, isSystemAccount: true },
    // 4000 Revenue
    { id: 'acc-4010', code: '4010', name: 'Apparel Export Sales Revenue', category: 'Revenue', subCategory: 'Operating Revenue', companyId: 'comp-textile', balance: 58400000, isDebitNormal: false, isSystemAccount: true },
    { id: 'acc-4020', code: '4020', name: 'Domestic Garment Wholesale Revenue', category: 'Revenue', subCategory: 'Operating Revenue', companyId: 'comp-textile', balance: 14800000, isDebitNormal: false, isSystemAccount: true },
    // 5000 Cost of Goods Sold
    { id: 'acc-5010', code: '5010', name: 'COGS - Direct Fabric & Yarn Consumed', category: 'Expense', subCategory: 'Cost of Sales', companyId: 'comp-textile', balance: 29500000, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-5020', code: '5020', name: 'COGS - Factory Direct Labor & Overtime', category: 'Expense', subCategory: 'Cost of Sales', companyId: 'comp-textile', balance: 8200000, isDebitNormal: true, isSystemAccount: true },
    // 6000 Operating Expenses
    { id: 'acc-6010', code: '6010', name: 'Administrative Salaries & Benefits', category: 'Expense', subCategory: 'General & Admin', companyId: 'comp-textile', balance: 4120000, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-6020', code: '6020', name: 'Factory Power, Gas & Utilities (DESCO/Titas)', category: 'Expense', subCategory: 'Operating Expenses', companyId: 'comp-textile', balance: 3100000, isDebitNormal: true, isSystemAccount: true },
    { id: 'acc-6030', code: '6030', name: 'Factory Rent, Plant Repairs & Maintenance', category: 'Expense', subCategory: 'Operating Expenses', companyId: 'comp-textile', balance: 1450000, isDebitNormal: true, isSystemAccount: false },
    { id: 'acc-6040', code: '6040', name: 'Freight, Logistics & Port Export Handling', category: 'Expense', subCategory: 'Operating Expenses', companyId: 'comp-textile', balance: 1200000, isDebitNormal: true, isSystemAccount: false },
    { id: 'acc-6050', code: '6050', name: 'Marketing, Sampling & Buyer Commissions', category: 'Expense', subCategory: 'General & Admin', companyId: 'comp-textile', balance: 1250000, isDebitNormal: true, isSystemAccount: false },
    { id: 'acc-6060', code: '6060', name: 'IT Infrastructure, Cloud ERP & Telecom', category: 'Expense', subCategory: 'General & Admin', companyId: 'comp-textile', balance: 650000, isDebitNormal: true, isSystemAccount: false },
  ];

  public expenseBudgets: ExpenseBudget[] = [
    {
      id: 'bgt-001',
      accountId: 'acc-5010',
      accountCode: '5010',
      accountName: 'COGS - Direct Fabric & Yarn Consumed',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 30000000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'Knitting yarn consumption ceiling for Q3 export commitments',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'CFO Anwar Hossain',
    },
    {
      id: 'bgt-002',
      accountId: 'acc-5020',
      accountCode: '5020',
      accountName: 'COGS - Factory Direct Labor & Overtime',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 7500000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'Direct plant labor and peak shift allowance budget',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'CFO Anwar Hossain',
    },
    {
      id: 'bgt-003',
      accountId: 'acc-6010',
      accountCode: '6010',
      accountName: 'Administrative Salaries & Benefits',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 4500000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'Head office management and administrative staff payroll',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'HR Manager Nasreen Akter',
    },
    {
      id: 'bgt-004',
      accountId: 'acc-6020',
      accountCode: '6020',
      accountName: 'Factory Power, Gas & Utilities (DESCO/Titas)',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 2800000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'High-tension electricity substation and industrial boiler gas billing',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'CFO Anwar Hossain',
    },
    {
      id: 'bgt-005',
      accountId: 'acc-6030',
      accountCode: '6030',
      accountName: 'Factory Rent, Plant Repairs & Maintenance',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 2000000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'Preventative CNC maintenance and warehouse lease buffer',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'Operations Director',
    },
    {
      id: 'bgt-006',
      accountId: 'acc-6040',
      accountCode: '6040',
      accountName: 'Freight, Logistics & Port Export Handling',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 1800000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'Covered van transport Gazipur to Chittagong CFS terminal',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'Logistics Lead',
    },
    {
      id: 'bgt-007',
      accountId: 'acc-6050',
      accountCode: '6050',
      accountName: 'Marketing, Sampling & Buyer Commissions',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 1200000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'European apparel showroom samples and merchandising fee',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'Sales Director Tariqul',
    },
    {
      id: 'bgt-008',
      accountId: 'acc-6060',
      accountCode: '6060',
      accountName: 'IT Infrastructure, Cloud ERP & Telecom',
      companyId: 'comp-textile',
      month: 9,
      year: 2026,
      periodName: 'September 2026',
      monthlyBudget: 800000,
      currency: 'BDT',
      warningThresholdPercent: 80,
      criticalThresholdPercent: 100,
      notes: 'Dedicated fiber link, ERP server compute, and terminal scanners',
      updatedAt: '2026-09-01T08:00:00Z',
      updatedBy: 'IT Manager',
    },
  ];

  public journalEntries: JournalEntry[] = [
    {
      id: 'jv-001',
      entryNumber: 'JV-2026-0001',
      companyId: 'comp-textile',
      date: '2026-09-01',
      reference: 'PO-2026-0001',
      memo: 'Purchased Cotton Yarn 30/1 from Dhaka Yarn Traders on Credit',
      status: 'Posted',
      currency: 'BDT',
      currencySymbol: '৳',
      exchangeRate: 1.0,
      baseCurrency: 'BDT',
      totalDebit: 4200000,
      totalCredit: 4200000,
      baseTotalDebit: 4200000,
      baseTotalCredit: 4200000,
      postedBy: 'CFO Anwar Hossain',
      postedAt: '2026-09-01T10:15:00Z',
      lines: [
        { accountId: 'acc-1210', accountCode: '1210', accountName: 'Inventory - Raw Materials', description: 'Raw Yarn Receipt', debit: 4200000, credit: 0, foreignDebit: 4200000, foreignCredit: 0 },
        { accountId: 'acc-2010', accountCode: '2010', accountName: 'Accounts Payable (Trade Creditors)', description: 'Liability to Dhaka Yarn Traders', debit: 0, credit: 4200000, foreignDebit: 0, foreignCredit: 4200000 },
      ],
    },
    {
      id: 'jv-002',
      entryNumber: 'JV-2026-0002',
      companyId: 'comp-textile',
      date: '2026-09-05',
      reference: 'INV-2026-0001',
      memo: 'Export Sales Invoice INV-2026-0001 to Inditex S.A. ($40,576.13 @ 121.50 BDT/USD)',
      status: 'Posted',
      currency: 'USD',
      currencySymbol: '$',
      exchangeRate: 121.5,
      baseCurrency: 'BDT',
      totalDebit: 40576.13,
      totalCredit: 40576.13,
      baseTotalDebit: 4930000,
      baseTotalCredit: 4930000,
      postedBy: 'Accountant Farzana Yasmin',
      postedAt: '2026-09-05T14:30:00Z',
      lines: [
        { accountId: 'acc-1100', accountCode: '1100', accountName: 'Accounts Receivable (Trade Debtors)', description: 'Receivable from Inditex S.A. ($40,576.13 @ 121.50)', debit: 4930000, credit: 0, foreignDebit: 40576.13, foreignCredit: 0 },
        { accountId: 'acc-4010', accountCode: '4010', accountName: 'Apparel Export Sales Revenue', description: 'Export 3400 Polo Shirts ($40,576.13 @ 121.50)', debit: 0, credit: 4930000, foreignDebit: 0, foreignCredit: 40576.13 },
      ],
    },
  ];

  public suppliers: Supplier[] = [
    {
      id: 'sup-001',
      name: 'Dhaka Yarn & Spinning Mills Ltd.',
      code: 'SUP-DHK-001',
      contactPerson: 'Mr. Shamsul Huda',
      email: 'sales@dhakayarn.com.bd',
      phone: '+880 1711-209384',
      address: 'Narayanganj Spinning Belt, Narayanganj',
      taxNumber: 'TIN-482910398',
      paymentTermsDays: 30,
      rating: 4.8,
      companyId: 'comp-textile',
      totalSpend: 18450000,
      outstandingBalance: 4200000,
    },
    {
      id: 'sup-002',
      name: 'YKK Fastening Products Bangladesh',
      code: 'SUP-YKK-002',
      contactPerson: 'Kazi Tanvir',
      email: 'orders@ykk.com.bd',
      phone: '+880 1819-382910',
      address: 'DEPZ, Savar, Dhaka',
      taxNumber: 'TIN-774920194',
      paymentTermsDays: 45,
      rating: 4.9,
      companyId: 'comp-textile',
      totalSpend: 8600000,
      outstandingBalance: 1250000,
    },
    {
      id: 'sup-003',
      name: 'DyStar Chemicals Bangladesh Ltd.',
      code: 'SUP-DYS-003',
      contactPerson: 'Dr. Munir Ahmed',
      email: 'bd.support@dystar.com',
      phone: '+880 1971-482910',
      address: 'Tongi Industrial Area, Gazipur',
      taxNumber: 'TIN-994820192',
      paymentTermsDays: 30,
      rating: 4.7,
      companyId: 'comp-textile',
      totalSpend: 6200000,
      outstandingBalance: 950000,
    },
  ];

  public purchaseOrders: PurchaseOrder[] = [
    {
      id: 'po-001',
      poNumber: 'PO-2026-0001',
      supplierId: 'sup-001',
      supplierName: 'Dhaka Yarn & Spinning Mills Ltd.',
      companyId: 'comp-textile',
      warehouseId: 'wh-gzp-central',
      warehouseName: 'Central Raw Materials Depot',
      orderDate: '2026-08-28',
      expectedDeliveryDate: '2026-09-02',
      status: 'Received',
      paymentTerms: 'Net 30',
      subTotal: 4200000,
      taxTotal: 210000,
      grandTotal: 4410000,
      notes: 'Export standard packaging required with OEKO-TEX certificate',
      items: [
        {
          productId: 'prod-001',
          productName: '100% Combed Cotton Yarn 30/1',
          sku: 'RM-CTN-30S',
          orderedQty: 10000,
          receivedQty: 10000,
          unitPrice: 420,
          taxRate: 5,
          lineTotal: 4200000,
        },
      ],
      approvalStatus: 'Approved',
      approvedBy: 'CFO Anwar Hossain',
      approvalDate: '2026-08-29',
    },
    {
      id: 'po-002',
      poNumber: 'PO-2026-0002',
      supplierId: 'sup-003',
      supplierName: 'DyStar Chemicals Bangladesh Ltd.',
      companyId: 'comp-textile',
      warehouseId: 'wh-gzp-central',
      warehouseName: 'Central Raw Materials Depot',
      orderDate: '2026-09-08',
      expectedDeliveryDate: '2026-09-18',
      status: 'Pending Approval',
      paymentTerms: 'Net 30',
      subTotal: 1187500,
      taxTotal: 178125,
      grandTotal: 1365625,
      notes: 'Urgent dye batch required for upcoming Autumn fashion delivery',
      items: [
        {
          productId: 'prod-002',
          productName: 'Reactive Navy Blue Eco Dye (Dystar)',
          sku: 'RM-DYE-NVY',
          orderedQty: 1250,
          receivedQty: 0,
          unitPrice: 950,
          taxRate: 15,
          lineTotal: 1187500,
        },
      ],
      approvalStatus: 'Pending',
    },
  ];

  public customers: Customer[] = [
    {
      id: 'cust-001',
      name: 'Inditex S.A. (Zara Sourcing)',
      code: 'CUST-IND-01',
      contactPerson: 'Sofia Rodriguez',
      email: 'sourcing.dhaka@inditex.com',
      phone: '+34 981 185 400',
      address: 'Avenida de la Diputacion, Arteixo, Spain',
      taxNumber: 'VAT-ESB15075062',
      creditLimit: 50000000,
      creditDays: 60,
      companyId: 'comp-textile',
      currentReceivable: 4930000,
      status: 'Active',
    },
    {
      id: 'cust-002',
      name: 'H&M Hennes & Mauritz GBC',
      code: 'CUST-HM-02',
      contactPerson: 'David Lindqvist',
      email: 'production.bd@hm.com',
      phone: '+46 8 796 55 00',
      address: 'Mäster Samuelsgatan 46A, Stockholm, Sweden',
      taxNumber: 'SE556042722001',
      creditLimit: 75000000,
      creditDays: 60,
      companyId: 'comp-textile',
      currentReceivable: 12850000,
      status: 'Active',
    },
    {
      id: 'cust-003',
      name: 'Shwapno Superstores Bangladesh',
      code: 'CUST-SHW-03',
      contactPerson: 'Mahmudur Rahman',
      email: 'procurement@shwapno.com',
      phone: '+880 9678-001002',
      address: 'ACI Centre, 245 Tejgaon I/A, Dhaka',
      taxNumber: 'BIN-000382910-0101',
      creditLimit: 15000000,
      creditDays: 30,
      companyId: 'comp-textile',
      currentReceivable: 7000000,
      status: 'Active',
    },
  ];

  public salesOrders: SalesOrder[] = [
    {
      id: 'so-001',
      soNumber: 'SO-2026-0001',
      customerId: 'cust-001',
      customerName: 'Inditex S.A. (Zara Sourcing)',
      companyId: 'comp-textile',
      warehouseId: 'wh-gzp-fg',
      orderDate: '2026-09-02',
      deliveryDate: '2026-09-20',
      status: 'Delivered',
      paymentTerms: 'LC 60 Days',
      subTotal: 4930000,
      taxTotal: 0, // Export zero-rated
      grandTotal: 4930000,
      items: [
        {
          productId: 'prod-003',
          productName: 'Premium Pique Polo Shirt - Navy (L)',
          sku: 'FG-POLO-NAVY-L',
          quantity: 3400,
          deliveredQty: 3400,
          unitPrice: 1450,
          taxRate: 0,
          lineTotal: 4930000,
        },
      ],
    },
    {
      id: 'so-002',
      soNumber: 'SO-2026-0002',
      customerId: 'cust-003',
      customerName: 'Shwapno Superstores Bangladesh',
      companyId: 'comp-textile',
      warehouseId: 'wh-gzp-fg',
      orderDate: '2026-09-10',
      deliveryDate: '2026-09-16',
      status: 'Confirmed',
      paymentTerms: 'Net 30',
      subTotal: 2400000,
      taxTotal: 360000, // 15% VAT for local sales
      grandTotal: 2760000,
      items: [
        {
          productId: 'prod-004',
          productName: 'Heavyweight Fleece Zip Hoodie - Black (M)',
          sku: 'FG-HOODIE-BLK-M',
          quantity: 1000,
          deliveredQty: 0,
          unitPrice: 2400,
          taxRate: 15,
          lineTotal: 2400000,
        },
      ],
    },
  ];

  public salesInvoices: SalesInvoice[] = [
    {
      id: 'inv-001',
      invoiceNumber: 'INV-2026-0001',
      salesOrderId: 'so-001',
      customerId: 'cust-001',
      customerName: 'Inditex S.A. (Zara Sourcing)',
      companyId: 'comp-textile',
      invoiceDate: '2026-09-05',
      dueDate: '2026-11-05',
      status: 'Posted',
      currency: 'USD',
      currencySymbol: '$',
      exchangeRate: 121.5,
      baseCurrency: 'BDT',
      subTotal: 40576.13,
      taxTotal: 0,
      grandTotal: 40576.13,
      baseSubTotal: 4930000,
      baseTaxTotal: 0,
      baseGrandTotal: 4930000,
      amountPaid: 0,
      balanceDue: 40576.13,
      journalEntryId: 'jv-002',
      items: [
        {
          productId: 'prod-003',
          productName: 'Premium Pique Polo Shirt - Navy (L)',
          quantity: 3400,
          unitPrice: 11.93,
          taxRate: 0,
          lineTotal: 40576.13,
        },
      ],
    },
    {
      id: 'inv-002',
      invoiceNumber: 'INV-2026-0002',
      salesOrderId: 'so-002',
      customerId: 'cust-003',
      customerName: 'Shwapno Superstores Bangladesh',
      companyId: 'comp-textile',
      invoiceDate: '2026-09-11',
      dueDate: '2026-10-11',
      status: 'Draft',
      currency: 'BDT',
      currencySymbol: '৳',
      exchangeRate: 1.0,
      baseCurrency: 'BDT',
      subTotal: 2400000,
      taxTotal: 360000,
      grandTotal: 2760000,
      baseSubTotal: 2400000,
      baseTaxTotal: 360000,
      baseGrandTotal: 2760000,
      amountPaid: 0,
      balanceDue: 2760000,
      items: [
        {
          productId: 'prod-004',
          productName: 'Heavyweight Fleece Zip Hoodie - Black (M)',
          quantity: 1000,
          unitPrice: 2400,
          taxRate: 15,
          lineTotal: 2400000,
        },
      ],
    },
    {
      id: 'inv-003',
      invoiceNumber: 'INV-2026-0003',
      customerId: 'cust-002',
      customerName: 'H&M Hennes & Mauritz GBC',
      companyId: 'comp-textile',
      invoiceDate: '2026-09-08',
      dueDate: '2026-11-08',
      status: 'Posted',
      currency: 'EUR',
      currencySymbol: '€',
      exchangeRate: 132.8,
      baseCurrency: 'BDT',
      subTotal: 25000,
      taxTotal: 0,
      grandTotal: 25000,
      baseSubTotal: 3320000,
      baseTaxTotal: 0,
      baseGrandTotal: 3320000,
      amountPaid: 0,
      balanceDue: 25000,
      items: [
        {
          productId: 'prod-003',
          productName: 'Premium Pique Polo Shirt - Navy (L)',
          quantity: 2200,
          unitPrice: 11.36,
          taxRate: 0,
          lineTotal: 25000,
        },
      ],
    },
  ];

  public employees: Employee[] = [
    {
      id: 'emp-001',
      employeeCode: 'EMP-001',
      companyId: 'comp-textile',
      firstName: 'Anwar',
      lastName: 'Hossain',
      email: 'cfo.anwar@apex-group.com',
      phone: '+880 1713-000101',
      departmentId: 'dept-fin',
      departmentName: 'Finance & Accounting',
      designation: 'Chief Financial Officer (CFO)',
      joiningDate: '2020-03-01',
      salaryBasic: 220000,
      salaryHouseRent: 110000,
      salaryMedical: 22000,
      salaryConveyance: 15000,
      salaryTotalGross: 367000,
      status: 'Active',
      bankAccount: 'SCB-01-928371-01',
      nationalId: '1984269123891',
    },
    {
      id: 'emp-002',
      employeeCode: 'EMP-002',
      companyId: 'comp-textile',
      firstName: 'Farzana',
      lastName: 'Yasmin',
      email: 'farzana.y@apex-group.com',
      phone: '+880 1713-000102',
      departmentId: 'dept-fin',
      departmentName: 'Finance & Accounting',
      designation: 'Senior General Ledger Accountant',
      joiningDate: '2022-01-15',
      salaryBasic: 65000,
      salaryHouseRent: 32500,
      salaryMedical: 6500,
      salaryConveyance: 5000,
      salaryTotalGross: 109000,
      status: 'Active',
      bankAccount: 'DBBL-118-120-4920',
      nationalId: '1992269381029',
    },
    {
      id: 'emp-003',
      employeeCode: 'EMP-003',
      companyId: 'comp-textile',
      firstName: 'Jahangir',
      lastName: 'Alam',
      email: 'jahangir.prod@apex-group.com',
      phone: '+880 1713-000103',
      departmentId: 'dept-mfg',
      departmentName: 'Production & Knitting',
      designation: 'General Manager - Manufacturing',
      joiningDate: '2019-07-01',
      salaryBasic: 160000,
      salaryHouseRent: 80000,
      salaryMedical: 16000,
      salaryConveyance: 12000,
      salaryTotalGross: 268000,
      status: 'Active',
      bankAccount: 'SCB-01-983712-02',
      nationalId: '1980269381092',
    },
    {
      id: 'emp-004',
      employeeCode: 'EMP-004',
      companyId: 'comp-textile',
      firstName: 'Nasima',
      lastName: 'Khatun',
      email: 'nasima.hr@apex-group.com',
      phone: '+880 1713-000104',
      departmentId: 'dept-hr',
      departmentName: 'Human Resources',
      designation: 'Head of Human Resources',
      joiningDate: '2021-05-10',
      salaryBasic: 130000,
      salaryHouseRent: 65000,
      salaryMedical: 13000,
      salaryConveyance: 10000,
      salaryTotalGross: 218000,
      status: 'Active',
      bankAccount: 'BRAC-1502-203918',
      nationalId: '1987269103982',
    },
  ];

  public payrollRuns: PayrollRun[] = [
    {
      id: 'pay-2026-08',
      periodName: 'August 2026',
      month: 8,
      year: 2026,
      companyId: 'comp-textile',
      status: 'Posted to GL',
      totalGross: 962000,
      totalTaxDeductions: 84500,
      totalProvidentFund: 48100,
      totalNetPayable: 829400,
      employeeCount: 4,
      processedAt: '2026-08-31T17:00:00Z',
      approvedBy: 'CFO Anwar Hossain',
      journalEntryId: 'jv-001',
      slips: [
        { employeeId: 'emp-001', employeeName: 'Anwar Hossain', basic: 220000, allowances: 147000, overtime: 0, taxDeduction: 42000, otherDeductions: 11000, netSalary: 314000 },
        { employeeId: 'emp-002', employeeName: 'Farzana Yasmin', basic: 65000, allowances: 44000, overtime: 4500, taxDeduction: 7500, otherDeductions: 3250, netSalary: 102750 },
        { employeeId: 'emp-003', employeeName: 'Jahangir Alam', basic: 160000, allowances: 108000, overtime: 0, taxDeduction: 26000, otherDeductions: 8000, netSalary: 234000 },
        { employeeId: 'emp-004', employeeName: 'Nasima Khatun', basic: 130000, allowances: 88000, overtime: 0, taxDeduction: 9000, otherDeductions: 6500, netSalary: 202500 },
      ],
    },
  ];

  public billsOfMaterial: BillOfMaterial[] = [
    {
      id: 'bom-001',
      bomCode: 'BOM-POLO-NAVY-L',
      finishedProductId: 'prod-003',
      finishedProductName: 'Premium Pique Polo Shirt - Navy (L)',
      companyId: 'comp-textile',
      version: 'v2.4 Production Standard',
      yieldQuantity: 100, // 100 shirts
      totalComponentCost: 48000,
      laborCostEstimate: 18000,
      overheadCostEstimate: 12000,
      status: 'Active',
      components: [
        { rawMaterialId: 'prod-001', rawMaterialName: '100% Combed Cotton Yarn 30/1', quantityRequired: 32, unit: 'Kg', unitCost: 420, totalCost: 13440 },
        { rawMaterialId: 'prod-002', rawMaterialName: 'Reactive Navy Blue Eco Dye (Dystar)', quantityRequired: 3.5, unit: 'Kg', unitCost: 950, totalCost: 3325 },
        { rawMaterialId: 'prod-005', rawMaterialName: 'Natural Corozo 4-Hole Buttons 18L', quantityRequired: 2.1, unit: 'Gross', unitCost: 180, totalCost: 378 },
      ],
    },
  ];

  public productionOrders: ProductionOrder[] = [
    {
      id: 'mo-001',
      orderNumber: 'MO-2026-0012',
      companyId: 'comp-textile',
      bomId: 'bom-001',
      finishedProductId: 'prod-003',
      finishedProductName: 'Premium Pique Polo Shirt - Navy (L)',
      plannedQuantity: 3400,
      completedQuantity: 3400,
      startDate: '2026-09-02',
      dueDate: '2026-09-08',
      status: 'Completed',
      totalCostIncurred: 2652000,
      assignedWorkCenter: 'Knitting & Stitching Bay 4 (Gazipur)',
      materialIssued: true,
      qualityPassed: true,
    },
    {
      id: 'mo-002',
      orderNumber: 'MO-2026-0013',
      companyId: 'comp-textile',
      bomId: 'bom-001',
      finishedProductId: 'prod-003',
      finishedProductName: 'Premium Pique Polo Shirt - Navy (L)',
      plannedQuantity: 2000,
      completedQuantity: 850,
      startDate: '2026-09-09',
      dueDate: '2026-09-18',
      status: 'In Progress',
      totalCostIncurred: 920000,
      assignedWorkCenter: 'Knitting & Stitching Bay 2 (Gazipur)',
      materialIssued: true,
      qualityPassed: false,
    },
  ];

  public approvalRequests: ApprovalRequest[] = [
    {
      id: 'appr-001',
      module: 'Procurement',
      entityType: 'Purchase Order',
      entityId: 'po-002',
      entityReference: 'PO-2026-0002 (DyStar Chemicals)',
      requestedBy: 'Purchase Officer Karim',
      requestDate: '2026-09-08T12:00:00Z',
      amount: 1365625,
      companyId: 'comp-textile',
      status: 'Pending',
      currentApproverRole: 'CFO',
      history: [
        { step: 1, role: 'Procurement Manager', action: 'Approved', actionBy: 'Tariq Islam', actionAt: '2026-09-08T13:10:00Z', remarks: 'Price matches master vendor agreement' },
        { step: 2, role: 'CFO', action: 'Pending', remarks: 'Awaiting cash-flow verification' },
      ],
    },
    {
      id: 'appr-002',
      module: 'Inventory',
      entityType: 'Stock Adjustment',
      entityId: 'adj-091',
      entityReference: 'STK-ADJ-2026-091 (Dye Evaporation Loss - 15kg)',
      requestedBy: 'Warehouse Manager Rahim',
      requestDate: '2026-09-10T15:30:00Z',
      amount: 14250,
      companyId: 'comp-textile',
      status: 'Pending',
      currentApproverRole: 'Finance Manager',
      history: [
        { step: 1, role: 'Finance Manager', action: 'Pending', remarks: 'Physical verification report attached' },
      ],
    },
  ];

  public auditLogs: AuditLogEntry[] = [
    {
      id: 'aud-001',
      timestamp: '2026-09-01T10:15:00Z',
      user: 'Anwar Hossain (CFO)',
      userRole: 'CFO',
      ipAddress: '192.168.10.42',
      action: 'Posted Journal Entry',
      module: 'Accounting',
      entity: 'JournalEntry',
      entityId: 'JV-2026-0001',
      newValue: 'Status: Posted (Debit=4,200,000 / Credit=4,200,000)',
      reason: 'Raw Yarn Receipt from Dhaka Yarn Mills',
      companyId: 'comp-textile',
    },
    {
      id: 'aud-002',
      timestamp: '2026-09-05T14:30:00Z',
      user: 'Farzana Yasmin (Accountant)',
      userRole: 'Accountant',
      ipAddress: '192.168.10.55',
      action: 'Generated Sales Invoice',
      module: 'Sales',
      entity: 'SalesInvoice',
      entityId: 'INV-2026-0001',
      newValue: 'Grand Total: ৳4,930,000 | Inditex S.A.',
      reason: 'Export consignment delivery clearance',
      companyId: 'comp-textile',
    },
    {
      id: 'aud-003',
      timestamp: '2026-09-08T11:00:00Z',
      user: 'Jahangir Alam (Production Eng)',
      userRole: 'Production Manager',
      ipAddress: '192.168.20.12',
      action: 'Completed Production Order',
      module: 'Manufacturing',
      entity: 'ProductionOrder',
      entityId: 'MO-2026-0012',
      newValue: 'Yielded 3,400 Pcs into Finished Goods Depot',
      reason: 'Batch QC Passed at 99.8% first-pass yield',
      companyId: 'comp-textile',
    },
  ];

  public notifications: SystemNotification[] = [
    {
      id: 'notif-001',
      title: 'High-Value PO Approval Required',
      message: 'Purchase Order PO-2026-0002 for ৳1,365,625 from DyStar Chemicals awaits CFO approval.',
      timestamp: '2026-09-08T13:15:00Z',
      read: false,
      type: 'warning',
      linkModule: 'workflows',
    },
    {
      id: 'notif-002',
      title: 'Finished Goods Inward Completed',
      message: '3,400 Pcs Premium Polo Shirts successfully transferred to Bonded Warehouse from MO-2026-0012.',
      timestamp: '2026-09-08T11:05:00Z',
      read: false,
      type: 'success',
      linkModule: 'inventory',
    },
    {
      id: 'notif-003',
      title: 'Low Stock Reorder Alert',
      message: 'Natural Corozo Buttons 18L is approaching minimum safety stock (Current: 320 Gross, Reorder: 80).',
      timestamp: '2026-09-11T08:00:00Z',
      read: true,
      type: 'info',
      linkModule: 'products',
    },
  ];

  // Enterprise Security User Accounts
  public securityUsers: SecurityUserAccount[] = [
    {
      id: 'usr-001',
      name: 'Syed Manzur Elahi',
      email: 'chairman@apex-group.com',
      designation: 'Executive Chairman & Founder',
      department: 'Executive Board',
      role: 'Super Admin',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T21:40:00Z',
      lastLoginIp: '192.168.10.15',
      assignedCompanyIds: ['comp-apex-group', 'comp-textile', 'comp-logistics'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-002',
      name: 'Nasim Ahmed, CISSP',
      email: 'nasim.it@apex-group.com',
      designation: 'Chief Information Security Officer (CISO)',
      department: 'IT & Information Security',
      role: 'System Admin',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T22:15:00Z',
      lastLoginIp: '192.168.10.88',
      assignedCompanyIds: ['comp-apex-group', 'comp-textile', 'comp-logistics'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-003',
      name: 'Anwar Hossain, FCMA',
      email: 'cfo.anwar@apex-group.com',
      designation: 'Chief Financial Officer (CFO)',
      department: 'Finance & Treasury',
      role: 'CFO',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T20:30:00Z',
      lastLoginIp: '192.168.10.42',
      assignedCompanyIds: ['comp-apex-group', 'comp-textile', 'comp-logistics'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-004',
      name: 'Farzana Yasmin',
      email: 'farzana.y@apex-group.com',
      designation: 'Senior General Ledger Accountant',
      department: 'Finance & Accounting',
      role: 'Accountant',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T18:10:00Z',
      lastLoginIp: '192.168.10.55',
      assignedCompanyIds: ['comp-textile'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-005',
      name: 'Tariqul Islam',
      email: 'tariqul.procure@apex-group.com',
      designation: 'Head of Strategic Procurement',
      department: 'Procurement & Supply Chain',
      role: 'Procurement Manager',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T17:45:00Z',
      lastLoginIp: '192.168.10.60',
      assignedCompanyIds: ['comp-textile'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-006',
      name: 'Rahim Uddin',
      email: 'warehouse.head@apex-group.com',
      designation: 'General Manager - Central Warehousing',
      department: 'Logistics & Warehousing',
      role: 'Warehouse Manager',
      status: 'Active',
      mfaEnabled: false,
      lastLogin: '2026-09-19T16:20:00Z',
      lastLoginIp: '192.168.20.10',
      assignedCompanyIds: ['comp-textile'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-007',
      name: 'Jahangir Alam',
      email: 'jahangir.prod@apex-group.com',
      designation: 'General Manager - Manufacturing Mill 1',
      department: 'Production & Knitting',
      role: 'Production Manager',
      status: 'Active',
      mfaEnabled: false,
      lastLogin: '2026-09-19T15:00:00Z',
      lastLoginIp: '192.168.20.12',
      assignedCompanyIds: ['comp-textile'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-008',
      name: 'Kamrul Hasan',
      email: 'sales.kamrul@apex-group.com',
      designation: 'Head of Global Apparel Exports',
      department: 'Commercial & Export Sales',
      role: 'Sales Manager',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T14:15:00Z',
      lastLoginIp: '192.168.10.72',
      assignedCompanyIds: ['comp-textile'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-009',
      name: 'Nusrat Jahan',
      email: 'nusrat.hr@apex-group.com',
      designation: 'Head of Human Resources & Payroll',
      department: 'Human Resources',
      role: 'HR Manager',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T13:30:00Z',
      lastLoginIp: '192.168.10.95',
      assignedCompanyIds: ['comp-apex-group', 'comp-textile'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-010',
      name: 'S. M. Rezwan, FCA',
      email: 'rezwan.audit@kpmg-bangladesh.com',
      designation: 'Lead Statutory Engagement Partner',
      department: 'Statutory External Audit (KPMG)',
      role: 'Auditor',
      status: 'Active',
      mfaEnabled: true,
      lastLogin: '2026-09-19T11:00:00Z',
      lastLoginIp: '103.205.71.18',
      assignedCompanyIds: ['comp-apex-group', 'comp-textile', 'comp-logistics'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-011',
      name: 'Tania Sultana',
      email: 'tania.qc@apex-group.com',
      designation: 'Lead Quality Assurance Inspector',
      department: 'Quality Control & Compliance',
      role: 'Quality Manager',
      status: 'Active',
      mfaEnabled: false,
      lastLogin: '2026-09-18T16:00:00Z',
      lastLoginIp: '192.168.20.15',
      assignedCompanyIds: ['comp-textile'],
      failedLoginAttempts: 0,
    },
    {
      id: 'usr-012',
      name: 'Sumon Barua',
      email: 'sumon.floor@apex-group.com',
      designation: 'Senior Knitting Line Supervisor',
      department: 'Knitting Operations',
      role: 'Employee',
      status: 'Active',
      mfaEnabled: false,
      lastLogin: '2026-09-17T09:30:00Z',
      lastLoginIp: '192.168.20.44',
      assignedCompanyIds: ['comp-textile'],
      failedLoginAttempts: 0,
    },
  ];

  // Configurable Role Permissions Matrix
  public rolePermissions: Record<string, string[]> = {
    'Super Admin': [
      'products:create',
      'inventory:adjust',
      'inventory:forecast_apply',
      'inventory:forecast_order',
      'procurement:create',
      'procurement:approve',
      'sales:create_invoice',
      'accounting:create_journal',
      'accounting:manage_budget',
      'hr:generate_payroll',
      'manufacturing:create_order',
      'manufacturing:update_order',
      'workflows:approve',
      'workflows:reject',
      'settings:manage',
      'organization:manage',
      'audit:view',
      'reports:export',
    ],
    'System Admin': [
      'settings:manage',
      'organization:manage',
      'audit:view',
      'reports:export',
    ],
    'CEO': [
      'products:create',
      'inventory:adjust',
      'inventory:forecast_apply',
      'inventory:forecast_order',
      'procurement:create',
      'procurement:approve',
      'sales:create_invoice',
      'accounting:create_journal',
      'accounting:manage_budget',
      'hr:generate_payroll',
      'manufacturing:create_order',
      'manufacturing:update_order',
      'workflows:approve',
      'workflows:reject',
      'settings:manage',
      'organization:manage',
      'audit:view',
      'reports:export',
    ],
    'CFO': [
      'accounting:create_journal',
      'accounting:manage_budget',
      'procurement:create',
      'procurement:approve',
      'sales:create_invoice',
      'workflows:approve',
      'workflows:reject',
      'inventory:forecast_apply',
      'inventory:forecast_order',
      'audit:view',
      'reports:export',
    ],
    'Finance Manager': [
      'accounting:create_journal',
      'accounting:manage_budget',
      'procurement:approve',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
    'Accountant': [
      'accounting:create_journal',
      'sales:create_invoice',
      'audit:view',
      'reports:export',
    ],
    'Procurement Manager': [
      'procurement:create',
      'procurement:approve',
      'inventory:forecast_order',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
    'Purchase Officer': [
      'procurement:create',
      'inventory:forecast_order',
    ],
    'Warehouse Manager': [
      'products:create',
      'inventory:adjust',
      'inventory:forecast_apply',
      'inventory:forecast_order',
      'audit:view',
      'reports:export',
    ],
    'Inventory Officer': [
      'inventory:adjust',
      'inventory:forecast_apply',
    ],
    'Sales Manager': [
      'sales:create_invoice',
      'products:create',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
    'Sales Executive': [
      'sales:create_invoice',
    ],
    'Production Manager': [
      'manufacturing:create_order',
      'manufacturing:update_order',
      'products:create',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
    'Quality Manager': [
      'audit:view',
    ],
    'HR Manager': [
      'hr:generate_payroll',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
    'Auditor': [
      'audit:view',
      'reports:export',
    ],
    'Employee': [],
    'Viewer': [],
  };

  // Enterprise Security & Governance Policies
  public securityPolicies: SecurityPolicySettings = {
    sessionTimeoutMinutes: 30,
    maxFailedLoginAttempts: 5,
    passwordMinLength: 12,
    requireSpecialChars: true,
    passwordExpiryDays: 90,
    mfaPolicy: 'ENFORCED_FOR_ADMINS',
    immutableAuditLogEnforced: true,
    ipWhitelistingEnabled: false,
    whitelistedIpRanges: ['192.168.10.0/24', '192.168.20.0/24', '10.0.0.0/16'],
    allowConcurrentSessions: false,
    strictNegativeStockBlock: true,
    doubleEntryBalancingCheck: true,
  };

  // Separation of Duties (SoD) Conflict Catalog
  public sodRules: SoDConflictRule[] = [
    {
      id: 'sod-001',
      code: 'SOD-PROC-01',
      title: 'Purchase Order Generation vs Workflow Signoff',
      description: 'The entity initiating purchase order requisitions must not have permission to unilaterally approve their own purchase commitments.',
      primaryAction: 'procurement:create',
      conflictingAction: 'procurement:approve',
      riskSeverity: 'CRITICAL',
      complianceStandard: 'SOX-404',
      remediationRecommendation: 'Separate purchase officer creation from managerial two-tier financial signoff.',
    },
    {
      id: 'sod-002',
      code: 'SOD-FIN-01',
      title: 'General Ledger Journal Posting vs Budget Limit Modification',
      description: 'General ledger accountants creating financial vouchers must not have unrestricted permission to expand budget ceiling allocations.',
      primaryAction: 'accounting:create_journal',
      conflictingAction: 'accounting:manage_budget',
      riskSeverity: 'HIGH',
      complianceStandard: 'COSO-2013',
      remediationRecommendation: 'Restrict budget ceiling management strictly to CFO / Board of Directors.',
    },
    {
      id: 'sod-003',
      code: 'SOD-INV-01',
      title: 'Stock Adjustment Write-Off vs General Ledger Booking',
      description: 'Personnel executing physical stock adjustments must not hold unilateral journal posting authority to prevent unverified inventory write-offs.',
      primaryAction: 'inventory:adjust',
      conflictingAction: 'accounting:create_journal',
      riskSeverity: 'CRITICAL',
      complianceStandard: 'ISO-27001',
      remediationRecommendation: 'Require independent financial ledger reconciliation for physical stock discrepancies.',
    },
    {
      id: 'sod-004',
      code: 'SOD-HR-01',
      title: 'Payroll Calculation Execution vs General Workflow Approval',
      description: 'Human resources administrators computing monthly wage rolls should require independent CFO approval prior to treasury bank disbursement.',
      primaryAction: 'hr:generate_payroll',
      conflictingAction: 'workflows:approve',
      riskSeverity: 'HIGH',
      complianceStandard: 'NBR-VAT',
      remediationRecommendation: 'Mandate independent financial comptroller review on all automated payroll runs.',
    },
    {
      id: 'sod-005',
      code: 'SOD-SALES-01',
      title: 'Sales Invoicing Issuance vs Stock Master Configuration',
      description: 'Commercial sales staff issuing customer invoices should not be permitted to alter product master pricing or inventory baseline records.',
      primaryAction: 'sales:create_invoice',
      conflictingAction: 'products:create',
      riskSeverity: 'MEDIUM',
      complianceStandard: 'COSO-2013',
      remediationRecommendation: 'Segregate product catalog master data maintenance from commercial invoicing desks.',
    },
  ];

  // Helper method for atomic transactional journal creation
  public postJournalEntry(params: {
    reference: string;
    memo: string;
    lines: { accountId: string; description: string; debit: number; credit: number; foreignDebit?: number; foreignCredit?: number }[];
    postedBy: string;
    companyId: string;
    currency?: string;
    currencySymbol?: string;
    exchangeRate?: number;
    baseCurrency?: string;
  }): { success: boolean; entry?: JournalEntry; error?: string } {
    const currency = params.currency || 'BDT';
    const currencySymbol = params.currencySymbol || '৳';
    const exchangeRate = Number(params.exchangeRate || 1);
    const baseCurrency = params.baseCurrency || 'BDT';

    const totalDebit = params.lines.reduce((sum, l) => sum + Number(l.debit || 0), 0);
    const totalCredit = params.lines.reduce((sum, l) => sum + Number(l.credit || 0), 0);

    // Double-entry accounting golden rule
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return {
        success: false,
        error: `Accounting Validation Error: Total Debit (${currencySymbol}${totalDebit.toLocaleString()}) does not balance with Total Credit (${currencySymbol}${totalCredit.toLocaleString()})! Transaction aborted.`,
      };
    }

    const nextNumber = `JV-2026-${String(this.journalEntries.length + 1).padStart(4, '0')}`;
    const baseTotalDebit = Number((totalDebit * exchangeRate).toFixed(2));
    const baseTotalCredit = Number((totalCredit * exchangeRate).toFixed(2));

    const formattedLines = params.lines.map((line) => {
      const acc = this.chartOfAccounts.find((a) => a.id === line.accountId);
      const foreignDebit = Number(line.foreignDebit ?? line.debit ?? 0);
      const foreignCredit = Number(line.foreignCredit ?? line.credit ?? 0);
      const functionalDebit = Number((foreignDebit * exchangeRate).toFixed(2));
      const functionalCredit = Number((foreignCredit * exchangeRate).toFixed(2));

      return {
        accountId: line.accountId,
        accountCode: acc ? acc.code : 'UNKNOWN',
        accountName: acc ? acc.name : 'Unknown Account',
        description: line.description,
        debit: functionalDebit,
        credit: functionalCredit,
        foreignDebit,
        foreignCredit,
      };
    });

    const entry: JournalEntry = {
      id: `jv-${Date.now()}`,
      entryNumber: nextNumber,
      companyId: params.companyId,
      date: new Date().toISOString().split('T')[0],
      reference: params.reference,
      memo: params.memo,
      status: 'Posted',
      currency,
      currencySymbol,
      exchangeRate,
      baseCurrency,
      totalDebit,
      totalCredit,
      baseTotalDebit,
      baseTotalCredit,
      lines: formattedLines,
      postedBy: params.postedBy,
      postedAt: new Date().toISOString(),
    };

    // Update account balances atomically in base currency
    for (const l of formattedLines) {
      const acc = this.chartOfAccounts.find((a) => a.id === l.accountId);
      if (acc) {
        if (acc.isDebitNormal) {
          acc.balance += l.debit - l.credit;
        } else {
          acc.balance += l.credit - l.debit;
        }
      }
    }

    this.journalEntries.unshift(entry);

    // Record immutable audit log
    this.addAuditLog({
      user: params.postedBy,
      userRole: 'Accountant',
      ipAddress: '127.0.0.1',
      action: 'Posted General Ledger Journal',
      module: 'Accounting',
      entity: 'JournalEntry',
      entityId: entry.entryNumber,
      newValue: `Balanced entry ${currencySymbol}${totalDebit.toLocaleString()} (Base ৳${baseTotalDebit.toLocaleString()} @ ${exchangeRate}) posted. Memo: ${params.memo}`,
      companyId: params.companyId,
    });

    return { success: true, entry };
  }

  // Stock Adjustment with automatic ledger and audit trail
  public adjustStock(params: {
    productId: string;
    warehouseId: string;
    quantityChange: number;
    reason: string;
    user: string;
    companyId: string;
  }): { success: boolean; error?: string } {
    const product = this.products.find((p) => p.id === params.productId);
    if (!product) return { success: false, error: 'Product not found' };

    const warehouse = this.warehouses.find((w) => w.id === params.warehouseId);
    if (!warehouse) return { success: false, error: 'Warehouse not found' };

    const newStock = product.currentStock + params.quantityChange;
    if (this.config.enableStrictNegativeStockBlock && newStock < 0) {
      return { success: false, error: `Stock error: Negative stock is prohibited by policy. Available: ${product.currentStock}, Requested change: ${params.quantityChange}` };
    }

    product.currentStock = newStock;
    product.totalStockValue = product.currentStock * product.costPrice;

    // Update warehouse allocation
    const alloc = product.warehouseAllocations.find((a) => a.warehouseId === params.warehouseId);
    if (alloc) {
      alloc.quantity += params.quantityChange;
    } else {
      product.warehouseAllocations.push({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
        quantity: Math.max(0, params.quantityChange),
      });
    }

    const ledgerEntry: StockLedgerEntry = {
      id: `stk-${Date.now()}`,
      timestamp: new Date().toISOString(),
      companyId: params.companyId,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      movementType: 'Adjustment',
      referenceDocType: 'Adjustment',
      referenceDocNumber: `ADJ-${Date.now().toString().slice(-6)}`,
      quantityChange: params.quantityChange,
      balanceQuantity: product.currentStock,
      unitCost: product.costPrice,
      totalCost: Math.abs(params.quantityChange) * product.costPrice,
      user: params.user,
      reason: params.reason,
    };

    this.stockLedger.unshift(ledgerEntry);

    this.addAuditLog({
      user: params.user,
      userRole: 'Warehouse Manager',
      ipAddress: '127.0.0.1',
      action: 'Stock Adjustment',
      module: 'Inventory',
      entity: 'ProductStock',
      entityId: product.sku,
      oldValue: `Stock: ${product.currentStock - params.quantityChange}`,
      newValue: `Stock: ${product.currentStock} (Delta: ${params.quantityChange})`,
      reason: params.reason,
      companyId: params.companyId,
    });

    return { success: true };
  }

  // Create Sales Invoice with full transactional integrity (Sales + Receivables + COGS + Inventory)
  public postSalesInvoice(params: {
    customerId: string;
    items: { productId: string; quantity: number; unitPrice: number; taxRate: number }[];
    postedBy: string;
    companyId: string;
    currency?: string;
    currencySymbol?: string;
    exchangeRate?: number;
    baseCurrency?: string;
  }): { success: boolean; invoice?: SalesInvoice; error?: string } {
    const customer = this.customers.find((c) => c.id === params.customerId);
    if (!customer) return { success: false, error: 'Customer not found' };

    const currency = params.currency || 'BDT';
    const currencySymbol = params.currencySymbol || '৳';
    const exchangeRate = Number(params.exchangeRate || 1);
    const baseCurrency = params.baseCurrency || 'BDT';

    let subTotal = 0;
    let taxTotal = 0;
    const formattedItems = [];

    for (const item of params.items) {
      const prod = this.products.find((p) => p.id === item.productId);
      if (!prod) return { success: false, error: `Product ${item.productId} not found` };

      if (this.config.enableStrictNegativeStockBlock && prod.currentStock < item.quantity) {
        return { success: false, error: `Insufficient inventory for SKU ${prod.sku}. On hand: ${prod.currentStock}, required: ${item.quantity}` };
      }

      const lineTotal = Number((item.quantity * item.unitPrice).toFixed(2));
      const taxLine = Number(((lineTotal * item.taxRate) / 100).toFixed(2));
      subTotal += lineTotal;
      taxTotal += taxLine;

      formattedItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        lineTotal,
      });

      // Reduce inventory
      prod.currentStock -= item.quantity;
      prod.totalStockValue = prod.currentStock * prod.costPrice;

      // Add to stock ledger
      this.stockLedger.unshift({
        id: `stk-${Date.now()}-${prod.id}`,
        timestamp: new Date().toISOString(),
        companyId: params.companyId,
        warehouseId: this.warehouses[0].id,
        warehouseName: this.warehouses[0].name,
        productId: prod.id,
        productName: prod.name,
        sku: prod.sku,
        movementType: 'Issue',
        referenceDocType: 'SO',
        referenceDocNumber: `INV-2026-${String(this.salesInvoices.length + 1).padStart(4, '0')}`,
        quantityChange: -item.quantity,
        balanceQuantity: prod.currentStock,
        unitCost: prod.costPrice,
        totalCost: item.quantity * prod.costPrice,
        user: params.postedBy,
        reason: `Sales dispatch to ${customer.name}`,
      });
    }

    const grandTotal = Number((subTotal + taxTotal).toFixed(2));
    const baseSubTotal = Number((subTotal * exchangeRate).toFixed(2));
    const baseTaxTotal = Number((taxTotal * exchangeRate).toFixed(2));
    const baseGrandTotal = Number((grandTotal * exchangeRate).toFixed(2));

    // Update customer balance in functional base currency
    customer.currentReceivable += baseGrandTotal;

    const invoiceNumber = `INV-2026-${String(this.salesInvoices.length + 1).padStart(4, '0')}`;

    // Generate balanced double entry GL posting in base functional currency
    const jvRes = this.postJournalEntry({
      reference: invoiceNumber,
      memo: `Sales Invoiced to ${customer.name} - ${invoiceNumber} (${currencySymbol}${grandTotal.toLocaleString()} @ ${exchangeRate} ${baseCurrency}/${currency})`,
      companyId: params.companyId,
      postedBy: params.postedBy,
      currency,
      currencySymbol,
      exchangeRate,
      baseCurrency,
      lines: [
        {
          accountId: 'acc-1100', // Accounts Receivable (Debit)
          description: `Trade Receivable from ${customer.name} (${currencySymbol}${grandTotal.toLocaleString()})`,
          debit: grandTotal,
          credit: 0,
        },
        {
          accountId: 'acc-4010', // Sales Revenue (Credit)
          description: `Sales revenue for ${invoiceNumber} (${currencySymbol}${subTotal.toLocaleString()})`,
          debit: 0,
          credit: subTotal,
        },
        ...(taxTotal > 0
          ? [
              {
                accountId: 'acc-2100', // VAT Payable (Credit)
                description: `NBR VAT Output on ${invoiceNumber} (${currencySymbol}${taxTotal.toLocaleString()})`,
                debit: 0,
                credit: taxTotal,
              },
            ]
          : []),
      ],
    });

    const invoice: SalesInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      customerId: customer.id,
      customerName: customer.name,
      companyId: params.companyId,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + customer.creditDays * 86400000).toISOString().split('T')[0],
      status: 'Posted',
      currency,
      currencySymbol,
      exchangeRate,
      baseCurrency,
      subTotal,
      taxTotal,
      grandTotal,
      baseSubTotal,
      baseTaxTotal,
      baseGrandTotal,
      amountPaid: 0,
      balanceDue: grandTotal,
      journalEntryId: jvRes.entry?.id,
      items: formattedItems,
    };

    this.salesInvoices.unshift(invoice);

    this.addAuditLog({
      user: params.postedBy,
      userRole: 'Sales Manager',
      ipAddress: '127.0.0.1',
      action: 'Generated & Posted Sales Invoice',
      module: 'Sales',
      entity: 'SalesInvoice',
      entityId: invoice.invoiceNumber,
      newValue: `Customer: ${customer.name} | Total: ${currencySymbol}${grandTotal.toLocaleString()} (Base: ৳${baseGrandTotal.toLocaleString()} @ ${exchangeRate})`,
      companyId: params.companyId,
    });

    return { success: true, invoice };
  }

  // Workflow Approval transition
  public reviewApproval(params: {
    requestId: string;
    action: 'Approved' | 'Rejected';
    user: string;
    role: string;
    remarks: string;
  }): { success: boolean; error?: string } {
    const req = this.approvalRequests.find((r) => r.id === params.requestId);
    if (!req) return { success: false, error: 'Approval request not found' };

    req.status = params.action;
    req.history.push({
      step: req.history.length + 1,
      role: params.role as any,
      action: params.action,
      actionBy: params.user,
      actionAt: new Date().toISOString(),
      remarks: params.remarks,
    });

    // If PO was approved, transition PO status
    if (req.entityType === 'Purchase Order') {
      const po = this.purchaseOrders.find((p) => p.id === req.entityId);
      if (po) {
        po.approvalStatus = params.action;
        if (params.action === 'Approved') {
          po.status = 'Approved';
          po.approvedBy = params.user;
          po.approvalDate = new Date().toISOString().split('T')[0];
        } else {
          po.status = 'Cancelled';
        }
      }
    }

    this.addAuditLog({
      user: params.user,
      userRole: params.role as any,
      ipAddress: '127.0.0.1',
      action: `${params.action} Workflow Request`,
      module: req.module,
      entity: req.entityType,
      entityId: req.entityReference,
      newValue: `Status changed to ${params.action}. Remarks: ${params.remarks}`,
      companyId: req.companyId,
    });

    return { success: true };
  }

  // Audit log tracker
  public addAuditLog(log: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    const entry: AuditLogEntry = {
      ...log,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(entry);
    // Keep max 200 logs in memory
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  // Expense Budget Monitoring against live GL account balances
  public getExpenseBudgetsSummary(month = 9, year = 2026, companyId = 'comp-textile'): {
    budgets: ExpenseBudgetSummary[];
    totalBudgeted: number;
    totalSpent: number;
    exceededCount: number;
    warningCount: number;
    normalCount: number;
    overallPercentageUsed: number;
  } {
    const relevantBudgets = this.expenseBudgets.filter(
      (b) => b.companyId === companyId && b.month === month && b.year === year
    );

    const summaries: ExpenseBudgetSummary[] = relevantBudgets.map((b) => {
      const account = this.chartOfAccounts.find((a) => a.id === b.accountId);
      const actualSpent = account ? Math.max(0, account.balance) : 0;
      const remainingBudget = b.monthlyBudget - actualSpent;
      const percentageUsed = b.monthlyBudget > 0 ? Number(((actualSpent / b.monthlyBudget) * 100).toFixed(1)) : 0;

      let status: 'Normal' | 'Warning' | 'Exceeded' = 'Normal';
      if (percentageUsed >= (b.criticalThresholdPercent || 100)) {
        status = 'Exceeded';
      } else if (percentageUsed >= (b.warningThresholdPercent || 80)) {
        status = 'Warning';
      }

      return {
        ...b,
        accountName: account ? account.name : b.accountName,
        accountCode: account ? account.code : b.accountCode,
        subCategory: account?.subCategory || 'Operating Expense',
        actualSpent,
        remainingBudget,
        percentageUsed,
        status,
      };
    });

    summaries.sort((a, b) => {
      const score = (s: string) => (s === 'Exceeded' ? 3 : s === 'Warning' ? 2 : 1);
      if (score(b.status) !== score(a.status)) {
        return score(b.status) - score(a.status);
      }
      return b.percentageUsed - a.percentageUsed;
    });

    const totalBudgeted = summaries.reduce((sum, s) => sum + s.monthlyBudget, 0);
    const totalSpent = summaries.reduce((sum, s) => sum + s.actualSpent, 0);
    const exceededCount = summaries.filter((s) => s.status === 'Exceeded').length;
    const warningCount = summaries.filter((s) => s.status === 'Warning').length;
    const normalCount = summaries.filter((s) => s.status === 'Normal').length;
    const overallPercentageUsed = totalBudgeted > 0 ? Number(((totalSpent / totalBudgeted) * 100).toFixed(1)) : 0;

    return {
      budgets: summaries,
      totalBudgeted,
      totalSpent,
      exceededCount,
      warningCount,
      normalCount,
      overallPercentageUsed,
    };
  }

  public saveExpenseBudget(params: {
    accountId: string;
    monthlyBudget: number;
    month?: number;
    year?: number;
    warningThresholdPercent?: number;
    criticalThresholdPercent?: number;
    notes?: string;
    user: string;
    userRole: string;
    companyId: string;
  }): { success: boolean; budget?: ExpenseBudget; error?: string } {
    const account = this.chartOfAccounts.find((a) => a.id === params.accountId);
    if (!account) {
      return { success: false, error: 'Account not found in Chart of Accounts.' };
    }
    if (account.category !== 'Expense') {
      return { success: false, error: 'Budgets can only be assigned to Expense accounts.' };
    }
    if (!Number.isFinite(params.monthlyBudget) || params.monthlyBudget <= 0) {
      return { success: false, error: 'Monthly budget must be a positive number.' };
    }

    const month = params.month ?? 9;
    const year = params.year ?? 2026;
    const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const periodName = `${monthNames[month] || 'Month'} ${year}`;

    const existingIndex = this.expenseBudgets.findIndex(
      (b) => b.accountId === params.accountId && b.month === month && b.year === year && b.companyId === params.companyId
    );

    const now = new Date().toISOString();
    let updated: ExpenseBudget;

    if (existingIndex >= 0) {
      const old = this.expenseBudgets[existingIndex];
      updated = {
        ...old,
        monthlyBudget: params.monthlyBudget,
        warningThresholdPercent: params.warningThresholdPercent ?? old.warningThresholdPercent ?? 80,
        criticalThresholdPercent: params.criticalThresholdPercent ?? old.criticalThresholdPercent ?? 100,
        notes: params.notes ?? old.notes,
        updatedAt: now,
        updatedBy: `${params.user} (${params.userRole})`,
      };
      this.expenseBudgets[existingIndex] = updated;
    } else {
      updated = {
        id: `bgt-${Date.now()}`,
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        companyId: params.companyId,
        month,
        year,
        periodName,
        monthlyBudget: params.monthlyBudget,
        currency: 'BDT',
        warningThresholdPercent: params.warningThresholdPercent ?? 80,
        criticalThresholdPercent: params.criticalThresholdPercent ?? 100,
        notes: params.notes || '',
        updatedAt: now,
        updatedBy: `${params.user} (${params.userRole})`,
      };
      this.expenseBudgets.push(updated);
    }

    this.addAuditLog({
      user: params.user,
      userRole: params.userRole as any,
      ipAddress: '127.0.0.1',
      action: existingIndex >= 0 ? 'Updated Expense Budget' : 'Created Expense Budget',
      module: 'Accounting',
      entity: 'ExpenseBudget',
      entityId: account.code,
      newValue: `${account.name}: Budget ৳${params.monthlyBudget.toLocaleString()} (${periodName})`,
      companyId: params.companyId,
    });

    return { success: true, budget: updated };
  }

  public generateInventoryForecast(params: {
    companyId?: string;
    serviceLevelPercent?: number;
    demandSurgePercent?: number;
    leadTimeBufferDays?: number;
  }): InventoryForecastSummary {
    const serviceLevel = params.serviceLevelPercent ?? 95;
    const demandSurge = params.demandSurgePercent ?? 0;
    const leadTimeBuffer = params.leadTimeBufferDays ?? 0;

    let zScore = 1.65; // 95%
    if (serviceLevel <= 90) zScore = 1.28;
    else if (serviceLevel >= 99) zScore = 2.33;
    else if (serviceLevel >= 98) zScore = 2.05;
    else if (serviceLevel >= 95) zScore = 1.65;
    else zScore = 1.44;

    const relevantProducts = this.products.filter(
      (p) => !params.companyId || p.companyId === params.companyId
    );

    const surgeMultiplier = 1 + demandSurge / 100;

    const demandProfiles: Record<
      string,
      { baseDailyDemand: number; demandStdDev: number; leadTimeDays: number; leadTimeStdDev: number; salesTrendPercent: number }
    > = {
      'RM-CTN-30S': { baseDailyDemand: 240, demandStdDev: 35, leadTimeDays: 14, leadTimeStdDev: 2.5, salesTrendPercent: 8.5 },
      'RM-DYE-NVY': { baseDailyDemand: 45, demandStdDev: 8, leadTimeDays: 10, leadTimeStdDev: 2.0, salesTrendPercent: 6.2 },
      'FG-POLO-NAVY-L': { baseDailyDemand: 85, demandStdDev: 14, leadTimeDays: 20, leadTimeStdDev: 3.0, salesTrendPercent: 12.4 },
      'FG-HOODIE-BLK-M': { baseDailyDemand: 50, demandStdDev: 10, leadTimeDays: 25, leadTimeStdDev: 3.5, salesTrendPercent: 14.8 },
      'RM-BTN-CORO-18': { baseDailyDemand: 8, demandStdDev: 1.5, leadTimeDays: 7, leadTimeStdDev: 1.0, salesTrendPercent: 4.1 },
      'RM-ZIP-YKK-24': { baseDailyDemand: 22, demandStdDev: 4.2, leadTimeDays: 10, leadTimeStdDev: 2.0, salesTrendPercent: 11.0 },
      'RM-RIB-ELAS-20': { baseDailyDemand: 32, demandStdDev: 5.0, leadTimeDays: 14, leadTimeStdDev: 2.5, salesTrendPercent: 7.3 },
    };

    const items: InventoryForecastItem[] = relevantProducts.map((p) => {
      const profile = demandProfiles[p.sku] || {
        baseDailyDemand: Math.max(5, Math.round(p.reorderLevel / 20)),
        demandStdDev: Math.max(1, Math.round(p.reorderLevel / 100)),
        leadTimeDays: p.leadTimeDays || 14,
        leadTimeStdDev: 2,
        salesTrendPercent: 5.0,
      };

      const adjustedDailyDemand = Math.round(profile.baseDailyDemand * surgeMultiplier * 10) / 10;
      const adjustedDemandStdDev = Math.round(profile.demandStdDev * Math.sqrt(surgeMultiplier) * 10) / 10;
      const totalLeadTimeDays = (p.leadTimeDays || profile.leadTimeDays) + leadTimeBuffer;
      const leadTimeVariance = profile.leadTimeStdDev;

      // Safety stock formula: Z * sqrt( L * sigma_d^2 + d^2 * sigma_L^2 )
      const varianceCombined =
        totalLeadTimeDays * Math.pow(adjustedDemandStdDev, 2) +
        Math.pow(adjustedDailyDemand, 2) * Math.pow(leadTimeVariance, 2);
      const safetyStock = Math.round(zScore * Math.sqrt(varianceCombined));

      // Lead time demand: d * L
      const leadTimeDemand = Math.round(adjustedDailyDemand * totalLeadTimeDays);

      // Suggested Reorder Point (ROP): Lead Time Demand + Safety Stock
      const suggestedReorderPoint = leadTimeDemand + safetyStock;
      const reorderPointDelta = suggestedReorderPoint - p.reorderLevel;

      // Economic Order Quantity (EOQ): sqrt( (2 * D * S) / H )
      const annualDemand = adjustedDailyDemand * 365;
      const orderSetupCost = 18000;
      const annualHoldingCostPerUnit = Math.max(12, p.costPrice * 0.22);
      const rawEoq = Math.sqrt((2 * annualDemand * orderSetupCost) / annualHoldingCostPerUnit);

      let suggestedReorderQuantity = Math.max(
        Math.round(rawEoq / 50) * 50,
        Math.round(adjustedDailyDemand * 14)
      );
      if (suggestedReorderQuantity < 10) suggestedReorderQuantity = 10;

      const estimatedReorderCost = suggestedReorderQuantity * p.costPrice;

      const daysRemaining = adjustedDailyDemand > 0 ? p.currentStock / adjustedDailyDemand : 999;
      const roundedDaysRemaining = Math.round(daysRemaining * 10) / 10;

      const stockoutDateObj = new Date();
      stockoutDateObj.setDate(stockoutDateObj.getDate() + Math.min(365, Math.max(0, Math.floor(daysRemaining))));
      const estimatedStockoutDate = stockoutDateObj.toISOString().split('T')[0];

      let stockoutRiskLevel: StockoutRiskLevel = 'OPTIMAL';
      const stockoutWithinLeadTime = daysRemaining <= totalLeadTimeDays;

      if (daysRemaining <= totalLeadTimeDays) {
        stockoutRiskLevel = 'CRITICAL';
      } else if (p.currentStock <= suggestedReorderPoint) {
        stockoutRiskLevel = 'REORDER_NOW';
      } else if (p.currentStock > (p.maxStock || suggestedReorderPoint * 3)) {
        stockoutRiskLevel = 'OVERSTOCKED';
      } else if (daysRemaining <= totalLeadTimeDays * 1.6) {
        stockoutRiskLevel = 'MODERATE';
      } else {
        stockoutRiskLevel = 'OPTIMAL';
      }

      let aiRationale = '';
      let aiActionRecommendation = '';

      if (stockoutRiskLevel === 'CRITICAL') {
        aiRationale = `Critical stockout alert: On-hand inventory (${p.currentStock.toLocaleString()} ${p.unit}) will deplete in ~${roundedDaysRemaining} days at current run-rate (${adjustedDailyDemand} ${p.unit}/day). Sourcing lead time is ${totalLeadTimeDays} days, causing a ${Math.max(1, Math.round(totalLeadTimeDays - roundedDaysRemaining))}-day operational stockout window.`;
        aiActionRecommendation = `Expedite immediate Purchase Order for ${suggestedReorderQuantity.toLocaleString()} ${p.unit} with ${p.supplierName || 'primary supplier'}. Consider priority dispatch to protect active export deadlines.`;
      } else if (stockoutRiskLevel === 'REORDER_NOW') {
        aiRationale = `Inventory (${p.currentStock.toLocaleString()} ${p.unit}) has breached the AI-optimized reorder threshold of ${suggestedReorderPoint.toLocaleString()} ${p.unit}. Consumption rate is ${adjustedDailyDemand} ${p.unit}/day with ${totalLeadTimeDays}-day replenishment window.`;
        aiActionRecommendation = `Approve planned replenishment PO for ${suggestedReorderQuantity.toLocaleString()} ${p.unit} (est. ৳${estimatedReorderCost.toLocaleString()}) to restore safety buffer before peak demand cycles.`;
      } else if (stockoutRiskLevel === 'OVERSTOCKED') {
        aiRationale = `Current stock exceeds optimal holding limits by ~${Math.round(((p.currentStock - (p.maxStock || 1000)) / (p.maxStock || 1000)) * 100)}%. Capital of ~৳${Math.round((p.currentStock - suggestedReorderPoint) * p.costPrice).toLocaleString()} is tied up in excess carrying stock.`;
        aiActionRecommendation = `Pause automated replenishments. Prioritize FIFO batch turnover and allocate surplus finished goods to forthcoming customer orders.`;
      } else if (stockoutRiskLevel === 'MODERATE') {
        aiRationale = `Stock level covers ~${roundedDaysRemaining} days. Expected to reach reorder trigger within ${Math.max(1, Math.round(roundedDaysRemaining - totalLeadTimeDays))} days under current sales and production velocity.`;
        aiActionRecommendation = `Confirm vendor lead times and capacity with ${p.supplierName || 'vendor'} in advance of upcoming reorder cycle.`;
      } else {
        aiRationale = `Healthy inventory equilibrium. On-hand balance provides ${roundedDaysRemaining} days of operational coverage with ${serviceLevel}% statistical service level protection.`;
        aiActionRecommendation = `Maintain current monitoring. Suggested ROP of ${suggestedReorderPoint.toLocaleString()} ${p.unit} safely buffers lead time and demand variations.`;
      }

      return {
        productId: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        type: p.type,
        unit: p.unit,
        currentStock: p.currentStock,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        avgDailyDemand: adjustedDailyDemand,
        demandStdDev: adjustedDemandStdDev,
        monthlyRunRate: Math.round(adjustedDailyDemand * 30),
        salesGrowthTrendPercent: profile.salesTrendPercent,
        supplierLeadTimeDays: totalLeadTimeDays,
        leadTimeVarianceDays: leadTimeVariance,
        preferredSupplierId: p.supplierId,
        preferredSupplierName: p.supplierName,
        serviceLevelZ: zScore,
        safetyStock,
        leadTimeDemand,
        suggestedReorderPoint,
        currentReorderLevel: p.reorderLevel,
        reorderPointDelta,
        suggestedReorderQuantity,
        currentMaxStock: p.maxStock,
        estimatedReorderCost,
        daysOfInventoryRemaining: roundedDaysRemaining,
        stockoutRiskLevel,
        stockoutWithinLeadTime,
        estimatedStockoutDate,
        aiRationale,
        aiActionRecommendation,
      };
    });

    const criticalStockoutCount = items.filter((i) => i.stockoutRiskLevel === 'CRITICAL').length;
    const reorderRecommendedCount = items.filter(
      (i) => i.stockoutRiskLevel === 'CRITICAL' || i.stockoutRiskLevel === 'REORDER_NOW'
    ).length;
    const optimalCount = items.filter((i) => i.stockoutRiskLevel === 'OPTIMAL').length;
    const overstockedCount = items.filter((i) => i.stockoutRiskLevel === 'OVERSTOCKED').length;

    const totalRecommendedReplenishmentValue = items
      .filter((i) => i.stockoutRiskLevel === 'CRITICAL' || i.stockoutRiskLevel === 'REORDER_NOW')
      .reduce((sum, i) => sum + i.estimatedReorderCost, 0);

    const potentialStockoutRevenueAtRisk = items
      .filter((i) => i.stockoutRiskLevel === 'CRITICAL')
      .reduce((sum, i) => sum + i.avgDailyDemand * i.supplierLeadTimeDays * i.sellingPrice, 0);

    const avgLeadTimeDays =
      items.length > 0
        ? Math.round(items.reduce((sum, i) => sum + i.supplierLeadTimeDays, 0) / items.length)
        : 14;

    const aiExecutiveSummary = `AI Inventory Audit: ${criticalStockoutCount} critical stockout alert and ${reorderRecommendedCount} reorder triggers identified across ${items.length} monitored SKUs. Recommended replenishment capital commitment is ৳${totalRecommendedReplenishmentValue.toLocaleString()} to protect ৳${potentialStockoutRevenueAtRisk.toLocaleString()} in potential stockout revenue at risk. Sourcing lead times average ${avgLeadTimeDays} days with ${serviceLevel}% targeted fulfillment service level.`;

    return {
      totalSkusAnalyzed: items.length,
      criticalStockoutCount,
      reorderRecommendedCount,
      optimalCount,
      overstockedCount,
      totalRecommendedReplenishmentValue,
      potentialStockoutRevenueAtRisk,
      avgLeadTimeDays,
      systemServiceLevel: serviceLevel,
      scenarioParameters: {
        serviceLevelPercent: serviceLevel,
        demandSurgePercent: demandSurge,
        leadTimeBufferDays: leadTimeBuffer,
      },
      aiExecutiveSummary,
      lastForecastGeneratedAt: new Date().toISOString(),
      items,
    };
  }

  public applyInventoryForecast(params: {
    productId: string;
    suggestedReorderPoint: number;
    suggestedReorderQuantity: number;
    user: string;
    userRole: string;
    companyId: string;
  }): { success: boolean; product?: Product; error?: string } {
    const product = this.products.find((p) => p.id === params.productId);
    if (!product) {
      return { success: false, error: 'Product not found in master records.' };
    }

    const previousReorderLevel = product.reorderLevel;
    const previousMaxStock = product.maxStock;

    product.reorderLevel = Math.round(params.suggestedReorderPoint);
    product.maxStock = Math.round(
      Math.max(product.reorderLevel * 2, product.reorderLevel + params.suggestedReorderQuantity * 1.5)
    );

    this.addAuditLog({
      user: params.user,
      userRole: params.userRole as any,
      ipAddress: '127.0.0.1',
      action: 'Updated AI Inventory Reorder Policy',
      module: 'Inventory',
      entity: 'Product',
      entityId: product.sku,
      oldValue: `ROP: ${previousReorderLevel} | Max: ${previousMaxStock}`,
      newValue: `AI-ROP: ${product.reorderLevel} | Max: ${product.maxStock} (EOQ: ${params.suggestedReorderQuantity})`,
      companyId: params.companyId,
    });

    return { success: true, product };
  }

  public createReplenishmentPurchaseOrder(params: {
    productId: string;
    quantity: number;
    user: string;
    userRole: string;
    companyId: string;
  }): { success: boolean; purchaseOrder?: PurchaseOrder; error?: string } {
    const product = this.products.find((p) => p.id === params.productId);
    if (!product) return { success: false, error: 'Product not found' };

    const supplier = this.suppliers.find((s) => s.id === product.supplierId) || this.suppliers[0];
    const warehouse = this.warehouses[0];
    const qty = Math.max(1, Math.round(params.quantity));
    const subTotal = qty * product.costPrice;
    const taxTotal = Math.round(subTotal * (product.taxRate / 100));
    const grandTotal = subTotal + taxTotal;

    const poNumber = `PO-2026-${String(this.purchaseOrders.length + 1).padStart(4, '0')}`;
    const orderDate = new Date().toISOString().split('T')[0];
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + (product.leadTimeDays || 14));
    const expectedDeliveryDate = expDate.toISOString().split('T')[0];

    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      companyId: params.companyId,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      orderDate,
      expectedDeliveryDate,
      status: 'Pending Approval',
      paymentTerms: 'Net 30',
      subTotal,
      taxTotal,
      grandTotal,
      notes: `AI Reorder Recommendation: Automated replenishment for SKU ${product.sku} based on historical sales trends and lead time analysis.`,
      items: [
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          orderedQty: qty,
          receivedQty: 0,
          unitPrice: product.costPrice,
          taxRate: product.taxRate,
          lineTotal: subTotal,
        },
      ],
      approvalStatus: 'Pending',
    };

    this.purchaseOrders.unshift(newPO);

    this.addAuditLog({
      user: params.user,
      userRole: params.userRole as any,
      ipAddress: '127.0.0.1',
      action: 'Generated AI Replenishment PO',
      module: 'Procurement',
      entity: 'PurchaseOrder',
      entityId: newPO.poNumber,
      newValue: `Ordered ${qty} ${product.unit} of ${product.sku} from ${supplier.name} (Total: ৳${grandTotal.toLocaleString()})`,
      companyId: params.companyId,
    });

    return { success: true, purchaseOrder: newPO };
  }

  // --- SECURITY & ACCESS CONTROL MANAGEMENT METHODS ---

  public updateUserRole(
    userId: string,
    newRole: RoleType,
    updatedBy: string,
    updatedByRole: string
  ): { success: boolean; user?: SecurityUserAccount; error?: string } {
    const user = this.securityUsers.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: `User with ID ${userId} not found.` };
    }

    const previousRole = user.role;
    user.role = newRole;

    this.addAuditLog({
      user: updatedBy,
      userRole: updatedByRole as any,
      ipAddress: '127.0.0.1',
      action: 'UPDATED_USER_ROLE',
      module: 'Security & Governance',
      entity: 'SecurityUserAccount',
      entityId: user.id,
      oldValue: `Role: ${previousRole}`,
      newValue: `Role: ${newRole} (Modified by ${updatedBy})`,
    });

    return { success: true, user };
  }

  public updateUserStatus(
    userId: string,
    updates: Partial<SecurityUserAccount>,
    updatedBy: string,
    updatedByRole: string
  ): { success: boolean; user?: SecurityUserAccount; error?: string } {
    const user = this.securityUsers.find((u) => u.id === userId);
    if (!user) {
      return { success: false, error: `User with ID ${userId} not found.` };
    }

    const oldState = `Status: ${user.status}, MFA: ${user.mfaEnabled}`;
    if (updates.status !== undefined) user.status = updates.status;
    if (updates.mfaEnabled !== undefined) user.mfaEnabled = updates.mfaEnabled;
    if (updates.customPermissions !== undefined) user.customPermissions = updates.customPermissions;
    if (updates.assignedCompanyIds !== undefined) user.assignedCompanyIds = updates.assignedCompanyIds;

    const newState = `Status: ${user.status}, MFA: ${user.mfaEnabled}`;

    this.addAuditLog({
      user: updatedBy,
      userRole: updatedByRole as any,
      ipAddress: '127.0.0.1',
      action: 'UPDATED_USER_SECURITY_PROFILE',
      module: 'Security & Governance',
      entity: 'SecurityUserAccount',
      entityId: user.id,
      oldValue: oldState,
      newValue: newState,
    });

    return { success: true, user };
  }

  public updateRolePermissions(
    role: RoleType,
    permissions: string[],
    updatedBy: string,
    updatedByRole: string
  ): { success: boolean; permissions?: string[]; error?: string } {
    if (!this.rolePermissions[role]) {
      this.rolePermissions[role] = [];
    }

    const oldPerms = this.rolePermissions[role].join(', ');
    this.rolePermissions[role] = [...permissions];

    this.addAuditLog({
      user: updatedBy,
      userRole: updatedByRole as any,
      ipAddress: '127.0.0.1',
      action: 'UPDATED_ROLE_PERMISSIONS_MATRIX',
      module: 'Security & Governance',
      entity: 'RolePermissions',
      entityId: role,
      oldValue: oldPerms.slice(0, 100),
      newValue: permissions.join(', ').slice(0, 100),
    });

    return { success: true, permissions: this.rolePermissions[role] };
  }

  public updateSecurityPolicies(
    policies: Partial<SecurityPolicySettings>,
    updatedBy: string,
    updatedByRole: string
  ): { success: boolean; policies: SecurityPolicySettings } {
    const oldPolicies = JSON.stringify(this.securityPolicies);
    this.securityPolicies = { ...this.securityPolicies, ...policies };

    this.addAuditLog({
      user: updatedBy,
      userRole: updatedByRole as any,
      ipAddress: '127.0.0.1',
      action: 'UPDATED_ENTERPRISE_SECURITY_POLICIES',
      module: 'Security & Governance',
      entity: 'SecurityPolicySettings',
      entityId: 'global-policy',
      oldValue: oldPolicies.slice(0, 120),
      newValue: JSON.stringify(this.securityPolicies).slice(0, 120),
    });

    return { success: true, policies: this.securityPolicies };
  }

  public runSoDAnalysis(): SoDScanReport {
    const violations: SoDViolation[] = [];
    const EXEMPT_ROLES = ['Super Admin', 'CEO'];

    // 1. Analyze Role Configuration Combinations
    for (const [roleName, perms] of Object.entries(this.rolePermissions)) {
      if (EXEMPT_ROLES.includes(roleName)) continue;

      for (const rule of this.sodRules) {
        if (perms.includes(rule.primaryAction) && perms.includes(rule.conflictingAction)) {
          violations.push({
            ruleId: rule.id,
            ruleCode: rule.code,
            title: rule.title,
            severity: rule.riskSeverity,
            roleOrUser: roleName,
            type: 'ROLE_CONFIG',
            primaryAction: rule.primaryAction,
            conflictingAction: rule.conflictingAction,
            details: `Role '${roleName}' has both '${rule.primaryAction}' and '${rule.conflictingAction}', which creates a direct conflict under ${rule.complianceStandard}.`,
            remediation: rule.remediationRecommendation,
          });
        }
      }
    }

    // 2. Analyze Individual User Assignments
    for (const user of this.securityUsers) {
      if (user.status !== 'Active') continue;
      if (EXEMPT_ROLES.includes(user.role)) continue;

      const basePerms = this.rolePermissions[user.role] || [];
      const userPerms = [...new Set([...basePerms, ...(user.customPermissions || [])])];

      for (const rule of this.sodRules) {
        if (userPerms.includes(rule.primaryAction) && userPerms.includes(rule.conflictingAction)) {
          violations.push({
            ruleId: rule.id,
            ruleCode: rule.code,
            title: rule.title,
            severity: rule.riskSeverity,
            roleOrUser: `${user.name} (${user.role})`,
            type: 'USER_ASSIGNMENT',
            primaryAction: rule.primaryAction,
            conflictingAction: rule.conflictingAction,
            details: `User '${user.name}' holds active rights for both '${rule.primaryAction}' and '${rule.conflictingAction}' simultaneously.`,
            remediation: rule.remediationRecommendation,
          });
        }
      }
    }

    let score = 100;
    let critical = 0;
    let high = 0;
    let medium = 0;

    for (const v of violations) {
      if (v.severity === 'CRITICAL') {
        score -= 15;
        critical++;
      } else if (v.severity === 'HIGH') {
        score -= 8;
        high++;
      } else {
        score -= 4;
        medium++;
      }
    }

    score = Math.max(0, Math.min(100, score));

    let postureStatus: SoDScanReport['postureStatus'] = 'EXCELLENT';
    if (score < 60 || critical >= 2) {
      postureStatus = 'NON_COMPLIANT';
    } else if (score < 75 || critical === 1) {
      postureStatus = 'AT_RISK';
    } else if (score < 90) {
      postureStatus = 'ADEQUATE';
    }

    return {
      timestamp: new Date().toISOString(),
      overallScore: score,
      postureStatus,
      totalRulesEvaluated: this.sodRules.length,
      rulesEvaluatedCount: this.sodRules.length,
      violationsCount: violations.length,
      criticalViolations: critical,
      highViolations: high,
      mediumViolations: medium,
      violations,
      conflictRules: this.sodRules,
    };
  }
}

export const db = new ERPDatabase();
