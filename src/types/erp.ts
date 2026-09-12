export type RoleType =
  | 'Super Admin'
  | 'System Admin'
  | 'CEO'
  | 'CFO'
  | 'Finance Manager'
  | 'Accountant'
  | 'Sales Manager'
  | 'Sales Executive'
  | 'Procurement Manager'
  | 'Purchase Officer'
  | 'Warehouse Manager'
  | 'Inventory Officer'
  | 'Production Manager'
  | 'Quality Manager'
  | 'HR Manager'
  | 'Employee'
  | 'Viewer';

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'export'
  | 'print'
  | 'post'
  | 'cancel'
  | 'reverse';

export type PermissionScope =
  | 'organization'
  | 'company'
  | 'branch'
  | 'department'
  | 'warehouse'
  | 'own';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  department: string;
  assignedCompanyIds: string[];
  currentCompanyId: string;
  currentBranchId: string;
  avatarUrl?: string;
  permissions: string[]; // e.g. "inventory:read:company", "accounting:post:organization"
}

export interface Company {
  id: string;
  name: string;
  code: string; // e.g. "APEX-HOLDINGS"
  taxId: string; // e.g. "BIN: 001239845-0101"
  currency: string; // "BDT" or "USD"
  currencySymbol: string;
  address: string;
  city: string;
  country: string;
  fiscalYearStart: string; // e.g. "07-01" or "01-01"
  branches: Branch[];
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address: string;
  isHeadOffice: boolean;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  code: string;
  managerName?: string;
}

export interface Warehouse {
  id: string;
  companyId: string;
  branchId: string;
  name: string;
  code: string;
  location: string;
  totalCapacitySqFt: number;
}

export type ItemType =
  | 'Product'
  | 'Raw Material'
  | 'Finished Good'
  | 'Semi-Finished'
  | 'Service'
  | 'Spare Part'
  | 'Consumable'
  | 'Asset';

export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  type: ItemType;
  unit: string; // "Pcs", "Kg", "Meter", "Box"
  costPrice: number;
  sellingPrice: number;
  taxRate: number; // e.g. 15 for 15% VAT
  reorderLevel: number;
  minStock: number;
  maxStock: number;
  weightKg: number;
  valuationMethod: 'FIFO' | 'WAC' | 'Standard Cost';
  batchTracking: boolean;
  serialTracking: boolean;
  currentStock: number;
  totalStockValue: number;
  companyId: string;
  warehouseAllocations: { warehouseId: string; warehouseName: string; quantity: number }[];
}

export interface StockLedgerEntry {
  id: string;
  timestamp: string;
  companyId: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: 'Receipt' | 'Issue' | 'Transfer' | 'Adjustment' | 'Production Consume' | 'Production Yield';
  referenceDocType: 'PO' | 'SO' | 'Production' | 'Adjustment' | 'Opening';
  referenceDocNumber: string;
  quantityChange: number; // positive or negative
  balanceQuantity: number;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  user: string;
  reason?: string;
}

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  paymentTermsDays: number;
  rating: number; // 1 to 5
  companyId: string;
  totalSpend: number;
  outstandingBalance: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. PO-2026-0001
  supplierId: string;
  supplierName: string;
  companyId: string;
  warehouseId: string;
  warehouseName: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Partially Received' | 'Received' | 'Invoiced' | 'Cancelled';
  paymentTerms: string;
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  notes?: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    orderedQty: number;
    receivedQty: number;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
  }[];
  approvalStatus: 'Not Required' | 'Pending' | 'Approved' | 'Rejected';
  approvedBy?: string;
  approvalDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  taxNumber: string;
  creditLimit: number;
  creditDays: number;
  companyId: string;
  currentReceivable: number;
  status: 'Active' | 'On Hold' | 'Blacklisted';
}

export interface SalesOrder {
  id: string;
  soNumber: string; // e.g. SO-2026-0001
  customerId: string;
  customerName: string;
  companyId: string;
  warehouseId: string;
  orderDate: string;
  deliveryDate: string;
  status: 'Draft' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Invoiced' | 'Cancelled';
  paymentTerms: string;
  subTotal: number;
  taxTotal: number;
  grandTotal: number;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    deliveredQty: number;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
  }[];
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToBase: number; // How many units of Base Currency per 1 unit of this currency
  lastUpdated?: string;
  source?: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  salesOrderId?: string;
  customerId: string;
  customerName: string;
  companyId: string;
  invoiceDate: string;
  dueDate: string;
  status: 'Draft' | 'Posted' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Void';
  currency?: string; // Transaction Currency, e.g. "USD", "EUR", "BDT"
  currencySymbol?: string;
  exchangeRate?: number; // Conversion rate to functional base currency
  baseCurrency?: string; // Functional reporting currency, e.g. "BDT"
  subTotal: number; // In Transaction Currency
  taxTotal: number; // In Transaction Currency
  grandTotal: number; // In Transaction Currency
  baseSubTotal?: number; // Converted into Base Functional Currency
  baseTaxTotal?: number; // Converted into Base Functional Currency
  baseGrandTotal?: number; // Converted into Base Functional Currency
  amountPaid: number;
  balanceDue: number;
  journalEntryId?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    lineTotal: number;
  }[];
}

export interface Account {
  id: string;
  code: string; // e.g. "1010", "1100", "2010"
  name: string;
  category: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  subCategory: string; // e.g. "Cash & Bank", "Accounts Receivable", "Current Liabilities"
  companyId: string;
  balance: number;
  isDebitNormal: boolean;
  isSystemAccount: boolean;
}

export interface JournalLine {
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number; // Functional base currency debit
  credit: number; // Functional base currency credit
  foreignDebit?: number; // Transaction currency debit
  foreignCredit?: number; // Transaction currency credit
  costCenter?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // e.g. JV-2026-0001
  companyId: string;
  date: string;
  reference: string;
  memo: string;
  status: 'Draft' | 'Posted' | 'Reversed';
  currency?: string; // Transaction Currency
  currencySymbol?: string;
  exchangeRate?: number; // Rate to Base Currency
  baseCurrency?: string;
  totalDebit: number; // Transaction Currency total
  totalCredit: number; // Transaction Currency total
  baseTotalDebit?: number; // Functional Base Currency total
  baseTotalCredit?: number; // Functional Base Currency total
  lines: JournalLine[];
  postedBy: string;
  postedAt?: string;
  reversalOfId?: string;
}

export interface Employee {
  id: string;
  employeeCode: string; // e.g. EMP-001
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: string;
  departmentName: string;
  designation: string;
  joiningDate: string;
  salaryBasic: number;
  salaryHouseRent: number;
  salaryMedical: number;
  salaryConveyance: number;
  salaryTotalGross: number;
  status: 'Active' | 'On Leave' | 'Terminated';
  bankAccount: string;
  nationalId: string;
}

export interface PayrollRun {
  id: string;
  periodName: string; // e.g. "September 2026"
  month: number;
  year: number;
  companyId: string;
  status: 'Draft' | 'Calculated' | 'Approved' | 'Posted to GL';
  totalGross: number;
  totalTaxDeductions: number;
  totalProvidentFund: number;
  totalNetPayable: number;
  employeeCount: number;
  processedAt?: string;
  approvedBy?: string;
  journalEntryId?: string;
  slips: {
    employeeId: string;
    employeeName: string;
    basic: number;
    allowances: number;
    overtime: number;
    taxDeduction: number;
    otherDeductions: number;
    netSalary: number;
  }[];
}

export interface BillOfMaterial {
  id: string;
  bomCode: string; // e.g. BOM-PROD-001
  finishedProductId: string;
  finishedProductName: string;
  companyId: string;
  version: string;
  yieldQuantity: number;
  totalComponentCost: number;
  laborCostEstimate: number;
  overheadCostEstimate: number;
  status: 'Active' | 'Under Review' | 'Obsolete';
  components: {
    rawMaterialId: string;
    rawMaterialName: string;
    quantityRequired: number;
    unit: string;
    unitCost: number;
    totalCost: number;
  }[];
}

export interface ProductionOrder {
  id: string;
  orderNumber: string; // e.g. MO-2026-0001
  companyId: string;
  bomId: string;
  finishedProductId: string;
  finishedProductName: string;
  plannedQuantity: number;
  completedQuantity: number;
  startDate: string;
  dueDate: string;
  status: 'Planned' | 'Released' | 'In Progress' | 'Quality Check' | 'Completed' | 'Cancelled';
  totalCostIncurred: number;
  assignedWorkCenter: string;
  materialIssued: boolean;
  qualityPassed: boolean;
}

export interface ApprovalRequest {
  id: string;
  module: 'Procurement' | 'Accounting' | 'Sales' | 'HR' | 'Inventory';
  entityType: 'Purchase Order' | 'Journal Entry' | 'Credit Limit Override' | 'Leave Request' | 'Stock Adjustment';
  entityId: string;
  entityReference: string;
  requestedBy: string;
  requestDate: string;
  amount?: number;
  companyId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  currentApproverRole: RoleType;
  history: {
    step: number;
    role: RoleType;
    action: 'Pending' | 'Approved' | 'Rejected';
    actionBy?: string;
    actionAt?: string;
    remarks?: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userRole: RoleType;
  ipAddress: string;
  action: string;
  module: string;
  entity: string;
  entityId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  companyId?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
  linkModule?: string;
}

export interface SystemConfig {
  defaultCurrency: string;
  currencySymbol: string;
  vatPercentage: number;
  withholdingTaxRate: number;
  fiscalYearCycle: 'July-June' | 'January-December';
  enableBangladeshNBRRules: boolean;
  enableAutoJournalOnInvoicing: boolean;
  enableStrictNegativeStockBlock: boolean;
  approvalThresholdPO: number;
}
