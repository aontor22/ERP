import { InventoryForecastSummary } from '../types/erp.js';

// API Client for ApexERP

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.message || data.error || 'API request failed');
  }
  return data.data;
}

export const api = {
  // Auth
  getMe: () => fetchApi<any>('/api/v1/auth/me'),
  switchRole: (role: string) => fetchApi<any>('/api/v1/auth/switch-role', { method: 'POST', body: JSON.stringify({ role }) }),
  switchCompany: (companyId: string) => fetchApi<any>('/api/v1/auth/switch-company', { method: 'POST', body: JSON.stringify({ companyId }) }),

  // Organizations
  getOrganizations: () => fetchApi<any>('/api/v1/organizations'),

  // Dashboard
  getDashboardStats: () => fetchApi<any>('/api/v1/dashboard/stats'),

  // Products
  getProducts: (params?: { search?: string; category?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/api/v1/products${q ? `?${q}` : ''}`);
  },
  createProduct: (product: any) => fetchApi<any>('/api/v1/products', { method: 'POST', body: JSON.stringify(product) }),

  // Inventory
  getStockLedger: () => fetchApi<any[]>('/api/v1/inventory/ledger'),
  adjustStock: (data: { productId: string; warehouseId: string; quantityChange: number; reason: string }) =>
    fetchApi<any>('/api/v1/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getInventoryForecast: (params?: { serviceLevel?: number; demandSurge?: number; leadTimeBuffer?: number }) => {
    const q = new URLSearchParams();
    if (params?.serviceLevel) q.append('serviceLevel', String(params.serviceLevel));
    if (params?.demandSurge !== undefined) q.append('demandSurge', String(params.demandSurge));
    if (params?.leadTimeBuffer !== undefined) q.append('leadTimeBuffer', String(params.leadTimeBuffer));
    const qs = q.toString();
    return fetchApi<InventoryForecastSummary>(`/api/v1/inventory/forecast${qs ? `?${qs}` : ''}`);
  },
  applyInventoryForecast: (data: {
    productId: string;
    suggestedReorderPoint: number;
    suggestedReorderQuantity: number;
  }) => fetchApi<any>('/api/v1/inventory/forecast/apply', { method: 'POST', body: JSON.stringify(data) }),
  createReplenishmentPO: (data: { productId: string; quantity: number }) =>
    fetchApi<any>('/api/v1/inventory/forecast/create-po', { method: 'POST', body: JSON.stringify(data) }),

  // Accounting
  getAccounts: () => fetchApi<any[]>('/api/v1/accounting/accounts'),
  getJournals: () => fetchApi<any[]>('/api/v1/accounting/journals'),
  createJournal: (data: { reference?: string; memo: string; lines: any[] }) =>
    fetchApi<any>('/api/v1/accounting/journals', { method: 'POST', body: JSON.stringify(data) }),
  getAccountingReports: () => fetchApi<any>('/api/v1/accounting/reports'),
  getExpenseBudgets: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.append('month', String(month));
    if (year) params.append('year', String(year));
    const qs = params.toString();
    return fetchApi<any>(`/api/v1/accounting/budgets${qs ? `?${qs}` : ''}`);
  },
  saveExpenseBudget: (data: {
    accountId: string;
    monthlyBudget: number;
    warningThresholdPercent?: number;
    criticalThresholdPercent?: number;
    notes?: string;
    month?: number;
    year?: number;
  }) => fetchApi<any>('/api/v1/accounting/budgets', { method: 'POST', body: JSON.stringify(data) }),

  // Procurement
  getPurchaseOrders: () => fetchApi<any[]>('/api/v1/procurement/orders'),
  createPurchaseOrder: (data: any) => fetchApi<any>('/api/v1/procurement/orders', { method: 'POST', body: JSON.stringify(data) }),
  getSuppliers: () => fetchApi<any[]>('/api/v1/procurement/suppliers'),

  // Sales
  getSalesOrders: () => fetchApi<any[]>('/api/v1/sales/orders'),
  getSalesInvoices: () => fetchApi<any[]>('/api/v1/sales/invoices'),
  createSalesInvoice: (data: any) => fetchApi<any>('/api/v1/sales/invoices', { method: 'POST', body: JSON.stringify(data) }),
  getCustomers: () => fetchApi<any[]>('/api/v1/sales/customers'),

  // HR & Payroll
  getEmployees: () => fetchApi<any[]>('/api/v1/hr/employees'),
  getPayrollRuns: () => fetchApi<any[]>('/api/v1/payroll/runs'),
  generatePayroll: (data: { periodName: string; month: number; year: number }) =>
    fetchApi<any>('/api/v1/payroll/runs', { method: 'POST', body: JSON.stringify(data) }),

  // Manufacturing
  getBOMs: () => fetchApi<any[]>('/api/v1/manufacturing/boms'),
  getProductionOrders: () => fetchApi<any[]>('/api/v1/manufacturing/orders'),
  createProductionOrder: (data: any) => fetchApi<any>('/api/v1/manufacturing/orders', { method: 'POST', body: JSON.stringify(data) }),
  getMRP: () => fetchApi<any[]>('/api/v1/manufacturing/mrp'),

  // Workflows
  getApprovalRequests: () => fetchApi<any[]>('/api/v1/workflows/requests'),
  reviewApproval: (data: { requestId: string; action: 'Approved' | 'Rejected'; remarks: string }) =>
    fetchApi<any>('/api/v1/workflows/review', { method: 'POST', body: JSON.stringify(data) }),

  // Audit
  getAuditLogs: (params?: { module?: string; user?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return fetchApi<any[]>(`/api/v1/audit/logs${q ? `?${q}` : ''}`);
  },

  // Notifications
  getNotifications: () => fetchApi<any[]>('/api/v1/notifications'),
  markNotificationsRead: (id?: string) => fetchApi<any>('/api/v1/notifications/mark-read', { method: 'POST', body: JSON.stringify({ id }) }),

  // Settings
  getSettings: () => fetchApi<any>('/api/v1/settings'),
  updateSettings: (data: any) => fetchApi<any>('/api/v1/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Multi-Currency & Real-Time Exchange Rates
  getExchangeRates: (base?: string) =>
    fetchApi<any>(`/api/v1/exchange-rates${base ? `?base=${encodeURIComponent(base)}` : ''}`),

  // Security & Compliance Telemetry
  getSecurityStatus: () => fetchApi<any>('/api/v1/security/status'),
};
