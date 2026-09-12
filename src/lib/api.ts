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

  // Accounting
  getAccounts: () => fetchApi<any[]>('/api/v1/accounting/accounts'),
  getJournals: () => fetchApi<any[]>('/api/v1/accounting/journals'),
  createJournal: (data: { reference?: string; memo: string; lines: any[] }) =>
    fetchApi<any>('/api/v1/accounting/journals', { method: 'POST', body: JSON.stringify(data) }),
  getAccountingReports: () => fetchApi<any>('/api/v1/accounting/reports'),

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
};
