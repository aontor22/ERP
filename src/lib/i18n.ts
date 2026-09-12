// Localization dictionary for ApexERP (English & Bangla)

export type Language = 'en' | 'bn';

export const translations = {
  en: {
    // Navigation
    dashboard: 'Executive Dashboard',
    organization: 'Organizations & Branches',
    products: 'Product & Item Master',
    inventory: 'Inventory & Stock Ledger',
    procurement: 'Procurement & Purchasing',
    sales: 'Sales & Invoicing',
    accounting: 'Accounting & General Ledger',
    hrPayroll: 'HR & Payroll Management',
    manufacturing: 'Manufacturing & MRP',
    workflows: 'Approval Workflows',
    auditLogs: 'Audit Trail & Security',
    reports: 'Financial & BI Reports',
    settings: 'System Administration',

    // Common labels
    searchPlaceholder: 'Search anything (SKU, Invoices, Accounts, Employees)...',
    activeEntity: 'Active Entity',
    branch: 'Branch',
    role: 'Simulate Role',
    notifications: 'Notifications',
    save: 'Save Changes',
    cancel: 'Cancel',
    create: 'Create New',
    exportCsv: 'Export CSV',
    status: 'Status',
    date: 'Date',
    total: 'Total',
    actions: 'Actions',
    currency: 'BDT (৳)',
    loading: 'Processing enterprise transaction...',
    viewDetails: 'View Details',
    balanced: 'Balanced (Debit = Credit)',
    unbalanced: 'Unbalanced Journal',

    // Dashboard metrics
    revenue: 'Operating Revenue',
    netProfit: 'Net Profit',
    cashBank: 'Cash & Bank Reserves',
    receivables: 'Accounts Receivable (AR)',
    payables: 'Accounts Payable (AP)',
    inventoryValue: 'Total Inventory Valuation',
    lowStockAlerts: 'Low Stock Reorder Items',
    pendingApprovals: 'Pending Tier Approvals',
    activeProduction: 'Active Manufacturing Orders',
  },
  bn: {
    // Navigation
    dashboard: 'এক্সিকিউটিভ ড্যাশবোর্ড',
    organization: 'প্রতিষ্ঠান ও শাখাসমূহ',
    products: 'পণ্য ও আইটেম মাস্টার',
    inventory: 'ইনভেন্টরি ও স্টক লেজার',
    procurement: 'ক্রয় ও প্রকিউরমেন্ট',
    sales: 'বিক্রয় ও ইনভয়েসিং',
    accounting: 'অ্যাকাউন্টিং ও সাধারণ লেজার',
    hrPayroll: 'এইচআর ও বেতন ব্যবস্থাপনা',
    manufacturing: 'ম্যানুফ্যাকচারিং ও এমআরপি',
    workflows: 'অনুমোদন ওয়ার্কফ্লো',
    auditLogs: 'অডিট লগ ও নিরাপত্তা ট্রেইল',
    reports: 'আর্থিক ও বিআই রিপোর্ট',
    settings: 'সিস্টেম অ্যাডমিনিস্ট্রেশন',

    // Common labels
    searchPlaceholder: 'অনুসন্ধান করুন (এসকেইউ, ইনভয়েস, হিসাব, কর্মকর্তা)...',
    activeEntity: 'সক্রিয় প্রতিষ্ঠান',
    branch: 'শাখা',
    role: 'ভূমিকা পরিবর্তন',
    notifications: 'বিজ্ঞপ্তি',
    save: 'সংরক্ষণ করুন',
    cancel: 'বাতিল',
    create: 'নতুন তৈরি করুন',
    exportCsv: 'সিএসভি ডাউনলোড',
    status: 'অবস্থা',
    date: 'তারিখ',
    total: 'মোট',
    actions: 'পদক্ষেপ',
    currency: 'টাকা (৳)',
    loading: 'প্রক্রিয়াধীন রয়েছে...',
    viewDetails: 'বিস্তারিত দেখুন',
    balanced: 'ভারসাম্যপূর্ণ (ডেবিট = ক্রেডিট)',
    unbalanced: 'অসমতাহীন জার্নাল',

    // Dashboard metrics
    revenue: 'মোট অর্জিত আয়',
    netProfit: 'নিট মুনাফা',
    cashBank: 'নগদ ও ব্যাংক স্থিতি',
    receivables: 'প্রাপ্য হিসাব (এআর)',
    payables: 'প্রদেয় হিসাব (এপি)',
    inventoryValue: 'মোট মজুদ পণ্যের মূল্য',
    lowStockAlerts: 'কম স্টকের সতর্কতা',
    pendingApprovals: 'অপেক্ষমাণ অনুমোদনসমূহ',
    activeProduction: 'চলমান উৎপাদন আদেশ',
  },
};

export function formatCurrency(amount: number, currencySymbol: string = '৳'): string {
  if (isNaN(amount) || amount === null || amount === undefined) return `${currencySymbol} 0.00`;
  return `${currencySymbol} ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
