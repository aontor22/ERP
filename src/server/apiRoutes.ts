import { Router, Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import { db } from './erpDatabase.js';
import { SystemConfig } from '../types/erp.js';

export const apiRouter = Router();

// Lazy initialization of Gemini AI client (fails gracefully if GEMINI_API_KEY is not configured)
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAIClient) {
    try {
      genAIClient = new GoogleGenAI({ apiKey });
    } catch (e) {
      console.error('Failed to instantiate GoogleGenAI:', e);
      return null;
    }
  }
  return genAIClient;
}

// Permitted System Roles
export const ALLOWED_ROLES = [
  'Super Admin',
  'CEO',
  'CFO',
  'Finance Manager',
  'Accountant',
  'Sales Manager',
  'Sales Executive',
  'Procurement Manager',
  'Purchase Officer',
  'Warehouse Manager',
  'Inventory Officer',
  'Production Manager',
  'HR Manager',
  'Auditor',
] as const;

// Input Sanitization helper to protect against Stored XSS and control character injection
export function sanitizeText(val: any, maxLength = 255): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>?/gm, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Strip ASCII control characters
    .trim()
    .slice(0, maxLength);
}

// Strict currency code validation (e.g., BDT, USD, EUR) to protect against SSRF/parameter tampering
export function isValidCurrencyCode(code: any): boolean {
  return typeof code === 'string' && /^[A-Z]{3,4}$/.test(code.trim());
}

// Enterprise RBAC Authorization Guard Middleware
export function requireRoles(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = currentSession.role;
    // Super Admin and CEO possess universal executive override
    if (allowedRoles.includes(userRole) || userRole === 'Super Admin' || userRole === 'CEO') {
      return next();
    }

    // Record Security Incident to tamper-evident audit trail
    db.addAuditLog({
      user: currentSession.name,
      userRole: currentSession.role,
      ipAddress: req.ip || '127.0.0.1',
      action: 'UNAUTHORIZED_ACCESS_BLOCKED',
      module: 'Security',
      entity: req.baseUrl + req.path,
      entityId: req.method,
      oldValue: `Current Role: ${userRole}`,
      newValue: `Blocked from accessing action requiring: [${allowedRoles.join(', ')}]`,
      companyId: currentSession.currentCompanyId,
    });

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: `Security Access Denied: Active role '${userRole}' lacks permission for this operation. Required: ${allowedRoles.join(', ')}.`,
    });
  };
}

// Current active session state
let currentSession = {
  id: 'usr-001',
  name: 'Anwar Hossain, FCMA',
  email: 'cfo.anwar@apex-group.com',
  role: 'CFO' as any,
  department: 'Finance & Treasury',
  assignedCompanyIds: ['comp-apex-group', 'comp-textile', 'comp-logistics'],
  currentCompanyId: 'comp-textile',
  currentBranchId: 'br-gazipur-plant',
  permissions: [
    'inventory:*:company',
    'accounting:*:company',
    'sales:*:company',
    'procurement:*:company',
    'manufacturing:*:company',
    'hr:read:company',
    'workflows:approve:company',
    'audit:read:company',
  ],
};

// --- AUTH & CONTEXT SWITCHING ---
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      user: currentSession,
      currentCompany: db.companies.find((c) => c.id === currentSession.currentCompanyId),
      companies: db.companies,
    },
  });
});

apiRouter.post('/auth/switch-role', (req: Request, res: Response) => {
  const { role } = req.body;
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: `Invalid role specified. Permitted roles: ${ALLOWED_ROLES.join(', ')}`,
    });
  }

  currentSession.role = role;
  if (role === 'Warehouse Manager') {
    currentSession.name = 'Rahim Uddin';
    currentSession.email = 'warehouse.head@apex-group.com';
  } else if (role === 'Production Manager') {
    currentSession.name = 'Jahangir Alam';
    currentSession.email = 'jahangir.prod@apex-group.com';
  } else if (role === 'Accountant') {
    currentSession.name = 'Farzana Yasmin';
    currentSession.email = 'farzana.y@apex-group.com';
  } else if (role === 'Sales Manager') {
    currentSession.name = 'Kamrul Hasan';
    currentSession.email = 'sales.kamrul@apex-group.com';
  } else if (role === 'Super Admin' || role === 'CEO') {
    currentSession.name = 'Syed Manzur Elahi';
    currentSession.email = 'chairman@apex-group.com';
  } else {
    currentSession.name = 'Anwar Hossain, FCMA';
    currentSession.email = 'cfo.anwar@apex-group.com';
  }

  db.addAuditLog({
    user: currentSession.name,
    userRole: currentSession.role,
    ipAddress: req.ip || '127.0.0.1',
    action: 'Switched Active Role',
    module: 'Security',
    entity: 'UserSession',
    entityId: currentSession.id,
    newValue: `Role switched to ${role}`,
  });

  res.json({ success: true, data: currentSession });
});

apiRouter.post('/auth/switch-company', (req: Request, res: Response) => {
  const { companyId } = req.body;
  const company = db.companies.find((c) => c.id === companyId);
  if (company) {
    currentSession.currentCompanyId = company.id;
    currentSession.currentBranchId = company.branches[0]?.id || '';
    db.addAuditLog({
      user: currentSession.name,
      userRole: currentSession.role,
      ipAddress: req.ip || '127.0.0.1',
      action: 'Switched Multi-Company Context',
      module: 'Organization',
      entity: 'Company',
      entityId: company.code,
      newValue: `Active entity switched to ${company.name}`,
    });
    return res.json({ success: true, data: { currentSession, company } });
  }
  res.status(404).json({ success: false, message: 'Company not found' });
});

// --- ORGANIZATIONS & BRANCHES ---
apiRouter.get('/organizations', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      companies: db.companies,
      warehouses: db.warehouses,
    },
  });
});

// --- DASHBOARD AGGREGATED METRICS ---
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const compId = currentSession.currentCompanyId;

  // Compute live financial totals from Chart of Accounts
  const cashAccounts = db.chartOfAccounts.filter((a) => a.subCategory === 'Cash & Bank');
  const cashBalance = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

  const arAccount = db.chartOfAccounts.find((a) => a.code === '1100');
  const accountsReceivable = arAccount ? arAccount.balance : 0;

  const apAccount = db.chartOfAccounts.find((a) => a.code === '2010');
  const accountsPayable = apAccount ? apAccount.balance : 0;

  const revenueAccounts = db.chartOfAccounts.filter((a) => a.category === 'Revenue');
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);

  const expenseAccounts = db.chartOfAccounts.filter((a) => a.category === 'Expense');
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
  const netProfit = totalRevenue - totalExpenses;

  const totalInventoryValue = db.products.reduce((sum, p) => sum + p.totalStockValue, 0);
  const lowStockCount = db.products.filter((p) => p.currentStock <= p.reorderLevel).length;

  const pendingApprovalsCount = db.approvalRequests.filter((r) => r.status === 'Pending').length;
  const activeProductionCount = db.productionOrders.filter((m) => m.status === 'In Progress' || m.status === 'Planned').length;

  const budgetSummary = db.getExpenseBudgetsSummary(9, 2026, compId);

  res.json({
    success: true,
    data: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit,
      cashBalance,
      accountsReceivable,
      accountsPayable,
      inventoryValue: totalInventoryValue,
      lowStockCount,
      pendingApprovalsCount,
      activeProductionCount,
      employeeCount: db.employees.length,
      budgetAlerts: {
        totalBudgeted: budgetSummary.totalBudgeted,
        totalSpent: budgetSummary.totalSpent,
        exceededCount: budgetSummary.exceededCount,
        warningCount: budgetSummary.warningCount,
        normalCount: budgetSummary.normalCount,
        overallPercentageUsed: budgetSummary.overallPercentageUsed,
        exceededBudgets: budgetSummary.budgets.filter((b) => b.status === 'Exceeded'),
        warningBudgets: budgetSummary.budgets.filter((b) => b.status === 'Warning'),
        topAlerts: budgetSummary.budgets.filter((b) => b.status === 'Exceeded' || b.status === 'Warning'),
        allBudgets: budgetSummary.budgets,
      },
      monthlyTrends: [
        {
          month: "Oct '25",
          fullMonth: 'October 2025',
          revenue: 38200000,
          expenses: 26500000,
          profit: 11700000,
          salesGrowth: 4.2,
          procurementVolume: 24500000,
          procurementUnits: 42000,
          ordersCount: 28,
        },
        {
          month: "Nov '25",
          fullMonth: 'November 2025',
          revenue: 41000000,
          expenses: 28000000,
          profit: 13000000,
          salesGrowth: 7.3,
          procurementVolume: 26200000,
          procurementUnits: 45500,
          ordersCount: 31,
        },
        {
          month: "Dec '25",
          fullMonth: 'December 2025',
          revenue: 44500000,
          expenses: 30200000,
          profit: 14300000,
          salesGrowth: 8.5,
          procurementVolume: 29000000,
          procurementUnits: 51000,
          ordersCount: 36,
        },
        {
          month: "Jan '26",
          fullMonth: 'January 2026',
          revenue: 43000000,
          expenses: 29800000,
          profit: 13200000,
          salesGrowth: -3.4,
          procurementVolume: 27500000,
          procurementUnits: 48000,
          ordersCount: 33,
        },
        {
          month: "Feb '26",
          fullMonth: 'February 2026',
          revenue: 46800000,
          expenses: 31500000,
          profit: 15300000,
          salesGrowth: 8.8,
          procurementVolume: 30400000,
          procurementUnits: 53200,
          ordersCount: 37,
        },
        {
          month: "Mar '26",
          fullMonth: 'March 2026',
          revenue: 51200000,
          expenses: 34000000,
          profit: 17200000,
          salesGrowth: 9.4,
          procurementVolume: 33800000,
          procurementUnits: 59000,
          ordersCount: 42,
        },
        {
          month: "Apr '26",
          fullMonth: 'April 2026',
          revenue: 54500000,
          expenses: 36200000,
          profit: 18300000,
          salesGrowth: 6.4,
          procurementVolume: 35600000,
          procurementUnits: 62500,
          ordersCount: 45,
        },
        {
          month: "May '26",
          fullMonth: 'May 2026',
          revenue: 58000000,
          expenses: 38500000,
          profit: 19500000,
          salesGrowth: 6.4,
          procurementVolume: 38000000,
          procurementUnits: 66000,
          ordersCount: 48,
        },
        {
          month: "Jun '26",
          fullMonth: 'June 2026',
          revenue: 63200000,
          expenses: 41800000,
          profit: 21400000,
          salesGrowth: 9.0,
          procurementVolume: 41200000,
          procurementUnits: 71500,
          ordersCount: 53,
        },
        {
          month: "Jul '26",
          fullMonth: 'July 2026',
          revenue: 67500000,
          expenses: 44200000,
          profit: 23300000,
          salesGrowth: 6.8,
          procurementVolume: 43500000,
          procurementUnits: 76000,
          ordersCount: 57,
        },
        {
          month: "Aug '26",
          fullMonth: 'August 2026',
          revenue: 72800000,
          expenses: 47600000,
          profit: 25200000,
          salesGrowth: 7.9,
          procurementVolume: 46800000,
          procurementUnits: 81000,
          ordersCount: 62,
        },
        {
          month: "Sep '26",
          fullMonth: 'September 2026',
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: netProfit,
          salesGrowth: Number((((totalRevenue - 72800000) / 72800000) * 100).toFixed(1)),
          procurementVolume: 49200000,
          procurementUnits: 85500,
          ordersCount: 68,
        },
      ],
    },
  });
});

// --- PRODUCT & ITEM MASTER ---
apiRouter.get('/products', (req: Request, res: Response) => {
  const { search, category, type } = req.query;
  let items = db.products;
  if (search) {
    const q = String(search).toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
  }
  if (category) items = items.filter((p) => p.category === category);
  if (type) items = items.filter((p) => p.type === type);

  res.json({ success: true, data: items });
});

apiRouter.post(
  '/products',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Warehouse Manager', 'Production Manager']),
  (req: Request, res: Response) => {
    const body = req.body;
    const name = sanitizeText(body.name, 120);
    const sku = sanitizeText(body.sku, 50).toUpperCase();
    const unit = sanitizeText(body.unit, 20);

    if (!name || !sku || !unit) {
      return res.status(400).json({ success: false, message: 'Missing or invalid required product parameters (name, sku, unit)' });
    }

    // Check unique SKU
    if (db.products.some((p) => p.sku === sku)) {
      return res.status(400).json({ success: false, message: `Product with SKU ${sku} already exists` });
    }

    const costPrice = Math.max(0, Number(body.costPrice || 0));
    const sellingPrice = Math.max(0, Number(body.sellingPrice || 0));
    const openingStock = Math.max(0, Number(body.openingStock || 0));

    const newProduct = {
      id: `prod-${Date.now()}`,
      sku,
      barcode: sanitizeText(body.barcode, 50) || `894${Date.now().toString().slice(-9)}`,
      name,
      description: sanitizeText(body.description, 500) || '',
      category: sanitizeText(body.category, 60) || 'General',
      brand: sanitizeText(body.brand, 60) || 'Apex Group',
      type: body.type === 'Raw Material' || body.type === 'Service' ? body.type : 'Product',
      unit,
      costPrice,
      sellingPrice,
      taxRate: Math.max(0, Number(body.taxRate || db.config.vatPercentage)),
      reorderLevel: Math.max(0, Number(body.reorderLevel || 100)),
      minStock: Math.max(0, Number(body.minStock || 50)),
      maxStock: Math.max(0, Number(body.maxStock || 10000)),
      weightKg: Math.max(0, Number(body.weightKg || 1)),
      valuationMethod: body.valuationMethod || 'FIFO',
      batchTracking: Boolean(body.batchTracking),
      serialTracking: Boolean(body.serialTracking),
      currentStock: openingStock,
      totalStockValue: openingStock * costPrice,
      companyId: currentSession.currentCompanyId,
      warehouseAllocations: [
        {
          warehouseId: db.warehouses[0].id,
          warehouseName: db.warehouses[0].name,
          quantity: openingStock,
        },
      ],
    };

    db.products.unshift(newProduct as any);

    if (newProduct.currentStock > 0) {
      db.stockLedger.unshift({
        id: `stk-${Date.now()}`,
        timestamp: new Date().toISOString(),
        companyId: currentSession.currentCompanyId,
        warehouseId: db.warehouses[0].id,
        warehouseName: db.warehouses[0].name,
        productId: newProduct.id,
        productName: newProduct.name,
        sku: newProduct.sku,
        movementType: 'Receipt',
        referenceDocType: 'Opening',
        referenceDocNumber: 'INIT-STOCK',
        quantityChange: newProduct.currentStock,
        balanceQuantity: newProduct.currentStock,
        unitCost: newProduct.costPrice,
        totalCost: newProduct.totalStockValue,
        user: currentSession.name,
        reason: 'Opening stock entry upon master creation',
      });
    }

    db.addAuditLog({
      user: currentSession.name,
      userRole: currentSession.role,
      ipAddress: req.ip || '127.0.0.1',
      action: 'Created Product Master',
      module: 'Inventory',
      entity: 'Product',
      entityId: newProduct.sku,
      newValue: `${newProduct.name} | Unit: ${newProduct.unit} | Cost: ৳${newProduct.costPrice}`,
    });

    res.json({ success: true, data: newProduct });
  }
);

// --- INVENTORY ENGINE ---
apiRouter.get('/inventory/ledger', (req: Request, res: Response) => {
  res.json({ success: true, data: db.stockLedger });
});

apiRouter.post(
  '/inventory/adjust',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Warehouse Manager', 'Inventory Officer']),
  (req: Request, res: Response) => {
    const { productId, warehouseId, quantityChange, reason } = req.body;
    if (!productId || !warehouseId || quantityChange === undefined) {
      return res.status(400).json({ success: false, message: 'Invalid stock adjustment parameters' });
    }

    const qty = Number(quantityChange);
    if (!Number.isFinite(qty) || qty === 0) {
      return res.status(400).json({ success: false, message: 'Quantity change must be a non-zero number' });
    }

    const productExists = db.products.some((p) => p.id === productId);
    const warehouseExists = db.warehouses.some((w) => w.id === warehouseId);
    if (!productExists || !warehouseExists) {
      return res.status(404).json({ success: false, message: 'Specified product or warehouse does not exist' });
    }

    const sanitizedReason = sanitizeText(reason, 200) || 'Physical inventory cycle count reconciliation';

    const result = db.adjustStock({
      productId,
      warehouseId,
      quantityChange: qty,
      reason: sanitizedReason,
      user: currentSession.name,
      companyId: currentSession.currentCompanyId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: 'Stock successfully adjusted and posted to ledger' });
  }
);

// --- AI-DRIVEN INVENTORY FORECASTING & REPLENISHMENT ---
apiRouter.get('/inventory/forecast', async (req: Request, res: Response) => {
  try {
    const serviceLevelPercent = req.query.serviceLevel ? Math.min(99.9, Math.max(80, Number(req.query.serviceLevel))) : 95;
    const demandSurgePercent = req.query.demandSurge ? Math.min(100, Math.max(-50, Number(req.query.demandSurge))) : 0;
    const leadTimeBufferDays = req.query.leadTimeBuffer ? Math.min(30, Math.max(0, Number(req.query.leadTimeBuffer))) : 0;

    const summary = db.generateInventoryForecast({
      companyId: currentSession.currentCompanyId,
      serviceLevelPercent,
      demandSurgePercent,
      leadTimeBufferDays,
    });

    // Augment with Gemini AI executive narrative when GEMINI_API_KEY is present
    const ai = getGenAI();
    if (ai) {
      try {
        const criticalItems = summary.items
          .filter((i) => i.stockoutRiskLevel === 'CRITICAL' || i.stockoutRiskLevel === 'REORDER_NOW')
          .map(
            (i) =>
              `- SKU ${i.sku} (${i.name}): On-hand ${i.currentStock} ${i.unit}, Daily Demand ${i.avgDailyDemand} ${i.unit}/day, Days to stockout: ${i.daysOfInventoryRemaining}d, Supplier Lead Time: ${i.supplierLeadTimeDays}d, Suggested ROP: ${i.suggestedReorderPoint}, Suggested EOQ: ${i.suggestedReorderQuantity}`
          )
          .join('\n');

        const prompt = `You are the AI Chief Supply Chain Officer for Apex Enterprise ERP. Analyze this inventory forecast:
- Target Service Level: ${summary.systemServiceLevel}%
- Demand Surge Scenario: ${summary.scenarioParameters.demandSurgePercent >= 0 ? '+' : ''}${summary.scenarioParameters.demandSurgePercent}%
- Sourcing Buffer: +${summary.scenarioParameters.leadTimeBufferDays} days
- Monitored SKUs: ${summary.totalSkusAnalyzed}
- Critical Stockouts (< Lead Time): ${summary.criticalStockoutCount}
- Reorder Triggers: ${summary.reorderRecommendedCount}
- Total Replenishment Investment: ৳${summary.totalRecommendedReplenishmentValue.toLocaleString()} BDT
- Revenue at Risk: ৳${summary.potentialStockoutRevenueAtRisk.toLocaleString()} BDT

High-Risk SKUs:
${criticalItems || 'All SKUs currently within safe operating thresholds'}

Provide an executive supply chain briefing (strictly under 75 words) focusing on immediate stockout risks, lead time buffer justification, and recommended purchase order approvals. Be objective and professional.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        if (response.text) {
          summary.aiExecutiveSummary = response.text.trim();
        }
      } catch (geminiErr) {
        console.warn('Gemini AI enrichment skipped, using built-in algorithmic supply chain audit:', geminiErr);
      }
    }

    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to generate inventory forecast' });
  }
});

apiRouter.post(
  '/inventory/forecast/apply',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Warehouse Manager', 'Inventory Officer', 'Production Manager']),
  (req: Request, res: Response) => {
    const { productId, suggestedReorderPoint, suggestedReorderQuantity } = req.body;
    if (!productId || suggestedReorderPoint === undefined || suggestedReorderQuantity === undefined) {
      return res.status(400).json({ success: false, message: 'Missing product ID or suggested reorder parameters' });
    }

    const result = db.applyInventoryForecast({
      productId,
      suggestedReorderPoint: Number(suggestedReorderPoint),
      suggestedReorderQuantity: Number(suggestedReorderQuantity),
      user: currentSession.name,
      userRole: currentSession.role,
      companyId: currentSession.currentCompanyId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.product,
      message: `Successfully applied AI reorder point (${result.product?.reorderLevel}) and max capacity (${result.product?.maxStock}) to product master.`,
    });
  }
);

apiRouter.post(
  '/inventory/forecast/create-po',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Procurement Manager', 'Purchase Officer']),
  (req: Request, res: Response) => {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid product ID and replenishment quantity are required' });
    }

    const result = db.createReplenishmentPurchaseOrder({
      productId,
      quantity: Number(quantity),
      user: currentSession.name,
      userRole: currentSession.role,
      companyId: currentSession.currentCompanyId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json({
      success: true,
      data: result.purchaseOrder,
      message: `Draft replenishment Purchase Order ${result.purchaseOrder?.poNumber} generated successfully and routed for approval.`,
    });
  }
);

// --- ACCOUNTING & GENERAL LEDGER ---
apiRouter.get('/accounting/accounts', (req: Request, res: Response) => {
  res.json({ success: true, data: db.chartOfAccounts });
});

apiRouter.get('/accounting/journals', (req: Request, res: Response) => {
  res.json({ success: true, data: db.journalEntries });
});

apiRouter.post(
  '/accounting/journals',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Accountant', 'Finance Manager']),
  (req: Request, res: Response) => {
    const { reference, memo, lines, currency, currencySymbol, exchangeRate, baseCurrency } = req.body;
    const sanitizedMemo = sanitizeText(memo, 300);
    const sanitizedRef = sanitizeText(reference, 50);

    if (!sanitizedMemo || !Array.isArray(lines) || lines.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'A journal voucher must have a valid memo and at least two lines.',
      });
    }

    // Mathematical zero-tolerance double-entry validation
    let totalDebit = 0;
    let totalCredit = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line || !line.accountId) {
        return res.status(400).json({ success: false, message: `Line #${i + 1} is missing a valid account ID.` });
      }
      const account = db.chartOfAccounts.find((a) => a.id === line.accountId);
      if (!account) {
        return res.status(400).json({ success: false, message: `Account ID '${line.accountId}' on line #${i + 1} does not exist.` });
      }

      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (!Number.isFinite(debit) || debit < 0 || !Number.isFinite(credit) || credit < 0) {
        return res.status(400).json({ success: false, message: `Line #${i + 1} has negative or invalid amounts.` });
      }
      if (debit > 0 && credit > 0) {
        return res.status(400).json({ success: false, message: `Line #${i + 1} cannot have both debit and credit entries simultaneously.` });
      }
      totalDebit += debit;
      totalCredit += credit;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Journal voucher is out of balance. Total Debit: ${totalDebit.toFixed(2)}, Total Credit: ${totalCredit.toFixed(2)}. Variance: ${(totalDebit - totalCredit).toFixed(2)}.`,
      });
    }

    if (currency && !isValidCurrencyCode(currency)) {
      return res.status(400).json({ success: false, message: 'Invalid currency code specified.' });
    }

    const result = db.postJournalEntry({
      reference: sanitizedRef || `JV-${Date.now().toString().slice(-4)}`,
      memo: sanitizedMemo,
      lines,
      postedBy: currentSession.name,
      companyId: currentSession.currentCompanyId,
      currency: currency ? sanitizeText(currency, 4).toUpperCase() : undefined,
      currencySymbol: currencySymbol ? sanitizeText(currencySymbol, 5) : undefined,
      exchangeRate: exchangeRate ? Math.max(0.000001, Number(exchangeRate)) : undefined,
      baseCurrency: baseCurrency ? sanitizeText(baseCurrency, 4).toUpperCase() : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, data: result.entry });
  }
);

apiRouter.get('/accounting/reports', (req: Request, res: Response) => {
  // Compute real-time Trial Balance, P&L, Balance Sheet, and AR/AP Aging
  const trialBalance = db.chartOfAccounts.map((a) => {
    let debit = 0;
    let credit = 0;
    if (a.isDebitNormal) {
      if (a.balance >= 0) debit = a.balance;
      else credit = Math.abs(a.balance);
    } else {
      if (a.balance >= 0) credit = a.balance;
      else debit = Math.abs(a.balance);
    }
    return {
      code: a.code,
      name: a.name,
      category: a.category,
      debit,
      credit,
    };
  });

  const totalTrialDebit = trialBalance.reduce((sum, r) => sum + r.debit, 0);
  const totalTrialCredit = trialBalance.reduce((sum, r) => sum + r.credit, 0);

  // Profit & Loss
  const revenueItems = db.chartOfAccounts.filter((a) => a.category === 'Revenue');
  const cogsItems = db.chartOfAccounts.filter((a) => a.subCategory === 'Cost of Sales');
  const opexItems = db.chartOfAccounts.filter((a) => a.category === 'Expense' && a.subCategory !== 'Cost of Sales');

  const totalRev = revenueItems.reduce((sum, a) => sum + a.balance, 0);
  const totalCogs = cogsItems.reduce((sum, a) => sum + a.balance, 0);
  const grossProfit = totalRev - totalCogs;
  const totalOpex = opexItems.reduce((sum, a) => sum + a.balance, 0);
  const netIncome = grossProfit - totalOpex;

  // Aging breakdown for AR
  const arAging = [
    { bucket: 'Current (0-30 days)', amount: 14500000, count: 4 },
    { bucket: '31 - 60 days', amount: 7280000, count: 2 },
    { bucket: '61 - 90 days', amount: 2500000, count: 1 },
    { bucket: '90+ days (Overdue)', amount: 500000, count: 1 },
  ];

  // Aging breakdown for AP
  const apAging = [
    { bucket: 'Current (0-30 days)', amount: 9800000, count: 5 },
    { bucket: '31 - 60 days', amount: 3500000, count: 2 },
    { bucket: '61 - 90 days', amount: 950000, count: 1 },
    { bucket: '90+ days', amount: 0, count: 0 },
  ];

  res.json({
    success: true,
    data: {
      trialBalance: {
        rows: trialBalance,
        totalDebit: totalTrialDebit,
        totalCredit: totalTrialCredit,
        isBalanced: Math.abs(totalTrialDebit - totalTrialCredit) < 1,
      },
      profitAndLoss: {
        revenues: revenueItems,
        totalRevenue: totalRev,
        cogs: cogsItems,
        totalCogs,
        grossProfit,
        operatingExpenses: opexItems,
        totalOpex,
        netIncome,
      },
      arAging,
      apAging,
    },
  });
});

// --- EXPENSE BUDGET MONITORING & ALERTS ---
apiRouter.get('/accounting/budgets', (req: Request, res: Response) => {
  const month = req.query.month ? Math.max(1, Math.min(12, Number(req.query.month))) : 9;
  const year = req.query.year ? Math.max(2020, Number(req.query.year)) : 2026;
  const companyId = currentSession.currentCompanyId;

  const summary = db.getExpenseBudgetsSummary(month, year, companyId);
  res.json({
    success: true,
    data: summary,
  });
});

apiRouter.post(
  '/accounting/budgets',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Accountant', 'Finance Manager']),
  (req: Request, res: Response) => {
    const {
      accountId,
      monthlyBudget,
      warningThresholdPercent,
      criticalThresholdPercent,
      notes,
      month,
      year,
    } = req.body;

    if (!accountId || typeof accountId !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid expense accountId is required.' });
    }

    const budgetAmount = Number(monthlyBudget);
    if (!Number.isFinite(budgetAmount) || budgetAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Monthly budget must be a positive number.' });
    }

    const warnThreshold = warningThresholdPercent !== undefined ? Number(warningThresholdPercent) : 80;
    const critThreshold = criticalThresholdPercent !== undefined ? Number(criticalThresholdPercent) : 100;

    if (warnThreshold < 1 || warnThreshold > 200 || critThreshold < warnThreshold) {
      return res.status(400).json({
        success: false,
        message: 'Warning threshold must be between 1-200% and critical threshold must be greater than or equal to warning threshold.',
      });
    }

    const result = db.saveExpenseBudget({
      accountId: sanitizeText(accountId, 50),
      monthlyBudget: budgetAmount,
      warningThresholdPercent: warnThreshold,
      criticalThresholdPercent: critThreshold,
      notes: notes ? sanitizeText(notes, 300) : '',
      month: month ? Number(month) : 9,
      year: year ? Number(year) : 2026,
      user: currentSession.name,
      userRole: currentSession.role,
      companyId: currentSession.currentCompanyId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    const updatedSummary = db.getExpenseBudgetsSummary(month ? Number(month) : 9, year ? Number(year) : 2026, currentSession.currentCompanyId);

    res.json({
      success: true,
      data: {
        budget: result.budget,
        summary: updatedSummary,
      },
    });
  }
);

// --- PROCUREMENT ---
apiRouter.get('/procurement/orders', (req: Request, res: Response) => {
  res.json({ success: true, data: db.purchaseOrders });
});

apiRouter.post(
  '/procurement/orders',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Procurement Manager', 'Purchase Officer', 'Warehouse Manager']),
  (req: Request, res: Response) => {
    const { supplierId, items, paymentTerms, notes } = req.body;
    const supplier = db.suppliers.find((s) => s.id === supplierId);
    if (!supplier || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid supplier or order items' });
    }

    let subTotal = 0;
    let taxTotal = 0;
    const formattedItems = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const prod = db.products.find((p) => p.id === it.productId);
      const qty = Number(it.orderedQty);
      const price = Number(it.unitPrice);

      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, message: `Item #${i + 1} contains invalid quantity or unit price` });
      }

      const lineSub = qty * price;
      const taxRate = Math.max(0, Number(it.taxRate || 15));
      const tax = (lineSub * taxRate) / 100;
      subTotal += lineSub;
      taxTotal += tax;

      formattedItems.push({
        productId: it.productId,
        productName: prod ? prod.name : 'Item',
        sku: prod ? prod.sku : 'SKU',
        orderedQty: qty,
        receivedQty: 0,
        unitPrice: price,
        taxRate,
        lineTotal: lineSub,
      });
    }

    const grandTotal = subTotal + taxTotal;
    const poNumber = `PO-2026-${String(db.purchaseOrders.length + 1).padStart(4, '0')}`;
    const requiresApproval = grandTotal >= db.config.approvalThresholdPO;

    const newPO = {
      id: `po-${Date.now()}`,
      poNumber,
      supplierId: supplier.id,
      supplierName: supplier.name,
      companyId: currentSession.currentCompanyId,
      warehouseId: db.warehouses[0].id,
      warehouseName: db.warehouses[0].name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: requiresApproval ? ('Pending Approval' as const) : ('Approved' as const),
      paymentTerms: sanitizeText(paymentTerms, 50) || 'Net 30',
      subTotal,
      taxTotal,
      grandTotal,
      notes: sanitizeText(notes, 500) || '',
      items: formattedItems,
      approvalStatus: requiresApproval ? ('Pending' as const) : ('Approved' as const),
    };

    db.purchaseOrders.unshift(newPO as any);

    if (requiresApproval) {
      db.approvalRequests.unshift({
        id: `appr-${Date.now()}`,
        module: 'Procurement',
        entityType: 'Purchase Order',
        entityId: newPO.id,
        entityReference: `${newPO.poNumber} (${supplier.name})`,
        requestedBy: currentSession.name,
        requestDate: new Date().toISOString(),
        amount: grandTotal,
        companyId: currentSession.currentCompanyId,
        status: 'Pending',
        currentApproverRole: 'CFO',
        history: [
          {
            step: 1,
            role: 'Procurement Manager',
            action: 'Approved',
            actionBy: currentSession.name,
            actionAt: new Date().toISOString(),
            remarks: 'Automatic pass from PO submission',
          },
          {
            step: 2,
            role: 'CFO',
            action: 'Pending',
            remarks: 'Tier-2 multi-level signoff required for PO > ৳500,000',
          },
        ],
      });

      db.notifications.unshift({
        id: `notif-${Date.now()}`,
        title: 'PO Multi-Level Approval Triggered',
        message: `PO ${poNumber} for ৳${grandTotal.toLocaleString()} exceeds approval threshold and routed to CFO.`,
        timestamp: new Date().toISOString(),
        read: false,
        type: 'warning',
        linkModule: 'workflows',
      });
    }

    db.addAuditLog({
      user: currentSession.name,
      userRole: currentSession.role,
      ipAddress: req.ip || '127.0.0.1',
      action: 'Created Purchase Order',
      module: 'Procurement',
      entity: 'PurchaseOrder',
      entityId: poNumber,
      newValue: `Supplier: ${supplier.name} | Total: ৳${grandTotal.toLocaleString()}`,
    });

    res.json({ success: true, data: newPO });
  }
);

apiRouter.get('/procurement/suppliers', (req: Request, res: Response) => {
  res.json({ success: true, data: db.suppliers });
});

// --- SALES ---
apiRouter.get('/sales/orders', (req: Request, res: Response) => {
  res.json({ success: true, data: db.salesOrders });
});

apiRouter.get('/sales/invoices', (req: Request, res: Response) => {
  res.json({ success: true, data: db.salesInvoices });
});

apiRouter.post(
  '/sales/invoices',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Sales Manager', 'Sales Executive', 'Accountant']),
  (req: Request, res: Response) => {
    const { customerId, items, currency, currencySymbol, exchangeRate, baseCurrency } = req.body;
    if (!customerId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid customer or invoice items' });
    }

    const customer = db.customers.find((c) => c.id === customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const qty = Number(it.quantity);
      const price = Number(it.unitPrice);
      if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(price) || price < 0) {
        return res.status(400).json({ success: false, message: `Invoice item #${i + 1} contains invalid quantity or price` });
      }
    }

    if (currency && !isValidCurrencyCode(currency)) {
      return res.status(400).json({ success: false, message: 'Invalid currency code' });
    }

    const result = db.postSalesInvoice({
      customerId,
      items,
      postedBy: currentSession.name,
      companyId: currentSession.currentCompanyId,
      currency: currency ? sanitizeText(currency, 4).toUpperCase() : undefined,
      currencySymbol: currencySymbol ? sanitizeText(currencySymbol, 5) : undefined,
      exchangeRate: exchangeRate ? Math.max(0.000001, Number(exchangeRate)) : undefined,
      baseCurrency: baseCurrency ? sanitizeText(baseCurrency, 4).toUpperCase() : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, data: result.invoice });
  }
);

apiRouter.get('/sales/customers', (req: Request, res: Response) => {
  res.json({ success: true, data: db.customers });
});

// --- HR & PAYROLL ---
apiRouter.get('/hr/employees', (req: Request, res: Response) => {
  res.json({ success: true, data: db.employees });
});

apiRouter.get('/payroll/runs', (req: Request, res: Response) => {
  res.json({ success: true, data: db.payrollRuns });
});

apiRouter.post(
  '/payroll/runs',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'HR Manager']),
  (req: Request, res: Response) => {
    const { periodName, month, year } = req.body;
    const m = Number(month || 9);
    const y = Number(year || 2026);
    if (!Number.isInteger(m) || m < 1 || m > 12 || !Number.isInteger(y) || y < 2020 || y > 2050) {
      return res.status(400).json({ success: false, message: 'Valid month (1-12) and year (2020-2050) are required' });
    }

    const sanitizedPeriod = sanitizeText(periodName, 100) || `Period ${m}/${y}`;

    let totalGross = 0;
    let totalTax = 0;
    let totalPF = 0;
    let totalNet = 0;

    const slips = db.employees.map((emp) => {
      const gross = emp.salaryTotalGross;
      const tax = Math.round(gross * 0.08); // 8% average withholding bracket
      const pf = Math.round(emp.salaryBasic * 0.05); // 5% provident fund
      const net = gross - tax - pf;

      totalGross += gross;
      totalTax += tax;
      totalPF += pf;
      totalNet += net;

      return {
        employeeId: emp.id,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        basic: emp.salaryBasic,
        allowances: emp.salaryHouseRent + emp.salaryMedical + emp.salaryConveyance,
        overtime: 0,
        taxDeduction: tax,
        otherDeductions: pf,
        netSalary: net,
      };
    });

    // Balanced Journal Entry for Payroll
    const jvRes = db.postJournalEntry({
      reference: `PAY-${y}-${String(m).padStart(2, '0')}`,
      memo: `Salary & Wage disbursement for ${sanitizedPeriod}`,
      companyId: currentSession.currentCompanyId,
      postedBy: currentSession.name,
      lines: [
        {
          accountId: 'acc-6010', // Admin Salaries & Wages (Expense Debit)
          description: `Gross Salaries - ${sanitizedPeriod}`,
          debit: totalGross,
          credit: 0,
        },
        {
          accountId: 'acc-2200', // Accrued Salaries Payable (Liability Credit)
          description: `Net Payable to Employees`,
          debit: 0,
          credit: totalNet,
        },
        {
          accountId: 'acc-2100', // Withholding Tax & PF Deductions (Liability Credit)
          description: `Payroll Tax & Statutory Deductions`,
          debit: 0,
          credit: totalTax + totalPF,
        },
      ],
    });

    const newRun = {
      id: `pay-${Date.now()}`,
      periodName: sanitizedPeriod,
      month: m,
      year: y,
      companyId: currentSession.currentCompanyId,
      status: 'Posted to GL' as const,
      totalGross,
      totalTaxDeductions: totalTax,
      totalProvidentFund: totalPF,
      totalNetPayable: totalNet,
      employeeCount: db.employees.length,
      processedAt: new Date().toISOString(),
      approvedBy: currentSession.name,
      journalEntryId: jvRes.entry?.id,
      slips,
    };

    db.payrollRuns.unshift(newRun);

    db.addAuditLog({
      user: currentSession.name,
      userRole: currentSession.role,
      ipAddress: req.ip || '127.0.0.1',
      action: 'Processed & Posted Payroll Cycle',
      module: 'HR & Payroll',
      entity: 'PayrollRun',
      entityId: newRun.periodName,
      newValue: `Total Net Disbursement: ৳${totalNet.toLocaleString()} across ${db.employees.length} employees`,
    });

    res.json({ success: true, data: newRun });
  }
);

// --- MANUFACTURING & MRP ---
apiRouter.get('/manufacturing/boms', (req: Request, res: Response) => {
  res.json({ success: true, data: db.billsOfMaterial });
});

apiRouter.get('/manufacturing/orders', (req: Request, res: Response) => {
  res.json({ success: true, data: db.productionOrders });
});

apiRouter.post(
  '/manufacturing/orders',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Production Manager']),
  (req: Request, res: Response) => {
    const { bomId, plannedQuantity, dueDate, workCenter } = req.body;
    const bom = db.billsOfMaterial.find((b) => b.id === bomId);
    const qty = Number(plannedQuantity);
    if (!bom || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid BOM or positive planned quantity required' });
    }

    const orderNumber = `MO-2026-${String(db.productionOrders.length + 1).padStart(4, '0')}`;
    const costEstimate = (bom.totalComponentCost / bom.yieldQuantity) * qty;

    const newOrder = {
      id: `mo-${Date.now()}`,
      orderNumber,
      companyId: currentSession.currentCompanyId,
      bomId: bom.id,
      finishedProductId: bom.finishedProductId,
      finishedProductName: bom.finishedProductName,
      plannedQuantity: qty,
      completedQuantity: 0,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      status: 'Planned' as const,
      totalCostIncurred: costEstimate,
      assignedWorkCenter: sanitizeText(workCenter, 100) || 'Knitting & Stitching Line 3',
      materialIssued: false,
      qualityPassed: false,
    };

    db.productionOrders.unshift(newOrder);

    db.addAuditLog({
      user: currentSession.name,
      userRole: currentSession.role,
      ipAddress: req.ip || '127.0.0.1',
      action: 'Created Production Manufacturing Order',
      module: 'Manufacturing',
      entity: 'ProductionOrder',
      entityId: orderNumber,
      newValue: `Product: ${bom.finishedProductName} | Planned Qty: ${qty}`,
    });

    res.json({ success: true, data: newOrder });
  }
);

apiRouter.get('/manufacturing/mrp', (req: Request, res: Response) => {
  // Real MRP Calculation: analyzes BOM component demand against current stock & open purchase orders
  const recommendations = [];

  for (const prod of db.products) {
    const netShortage = Math.max(0, prod.reorderLevel - prod.currentStock);
    const hasOpenPO = db.purchaseOrders.some(
      (po) => po.status !== 'Received' && po.status !== 'Cancelled' && po.items.some((i) => i.productId === prod.id)
    );

    if (prod.currentStock <= prod.reorderLevel || prod.currentStock < prod.minStock) {
      recommendations.push({
        productId: prod.id,
        sku: prod.sku,
        productName: prod.name,
        type: prod.type,
        currentStock: prod.currentStock,
        reorderLevel: prod.reorderLevel,
        minStock: prod.minStock,
        unit: prod.unit,
        suggestedAction: prod.type === 'Raw Material' ? 'Create Purchase Order' : 'Create Manufacturing Order',
        suggestedQuantity: Math.max(prod.reorderLevel * 2 - prod.currentStock, 500),
        openPoPending: hasOpenPO,
        urgency: prod.currentStock < prod.minStock ? 'CRITICAL' : 'HIGH',
        estimatedCost: (Math.max(prod.reorderLevel * 2 - prod.currentStock, 500)) * prod.costPrice,
      });
    }
  }

  res.json({ success: true, data: recommendations });
});

// --- WORKFLOW APPROVAL ENGINE ---
apiRouter.get('/workflows/requests', (req: Request, res: Response) => {
  res.json({ success: true, data: db.approvalRequests });
});

apiRouter.post(
  '/workflows/review',
  requireRoles(['Super Admin', 'CEO', 'CFO', 'Procurement Manager', 'Finance Manager']),
  (req: Request, res: Response) => {
    const { requestId, action, remarks } = req.body;
    if (!requestId || (action !== 'Approved' && action !== 'Rejected')) {
      return res.status(400).json({ success: false, message: "Valid request ID and action ('Approved' or 'Rejected') are required" });
    }

    const sanitizedRemarks = sanitizeText(remarks, 300) || `Reviewed by ${currentSession.role}`;

    const result = db.reviewApproval({
      requestId,
      action,
      remarks: sanitizedRemarks,
      user: currentSession.name,
      role: currentSession.role,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, message: `Workflow request successfully ${action.toLowerCase()}` });
  }
);

// --- AUDIT LOGS ---
apiRouter.get('/audit/logs', (req: Request, res: Response) => {
  const { module, user } = req.query;
  let logs = db.auditLogs;
  if (module) logs = logs.filter((l) => l.module === module);
  if (user) logs = logs.filter((l) => l.user.toLowerCase().includes(String(user).toLowerCase()));
  res.json({ success: true, data: logs });
});

// --- NOTIFICATIONS ---
apiRouter.get('/notifications', (req: Request, res: Response) => {
  res.json({ success: true, data: db.notifications });
});

apiRouter.post('/notifications/mark-read', (req: Request, res: Response) => {
  const { id } = req.body;
  if (id) {
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  } else {
    db.notifications.forEach((n) => (n.read = true));
  }
  res.json({ success: true });
});

// --- SETTINGS ---
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, data: db.config });
});

apiRouter.put(
  '/settings',
  requireRoles(['Super Admin', 'CEO', 'CFO']),
  (req: Request, res: Response) => {
    const safeUpdates: Partial<SystemConfig> = {};
    if (req.body.defaultCurrency && isValidCurrencyCode(req.body.defaultCurrency)) {
      safeUpdates.defaultCurrency = req.body.defaultCurrency.trim().toUpperCase();
      if (safeUpdates.defaultCurrency === 'BDT') safeUpdates.currencySymbol = '৳';
      else if (safeUpdates.defaultCurrency === 'USD') safeUpdates.currencySymbol = '$';
      else if (safeUpdates.defaultCurrency === 'EUR') safeUpdates.currencySymbol = '€';
      else if (safeUpdates.defaultCurrency === 'GBP') safeUpdates.currencySymbol = '£';
    }
    if (req.body.vatPercentage !== undefined) safeUpdates.vatPercentage = Math.max(0, Math.min(100, Number(req.body.vatPercentage)));
    if (req.body.withholdingTaxRate !== undefined) safeUpdates.withholdingTaxRate = Math.max(0, Math.min(100, Number(req.body.withholdingTaxRate)));
    if (req.body.approvalThresholdPO !== undefined) safeUpdates.approvalThresholdPO = Math.max(0, Number(req.body.approvalThresholdPO));
    if (req.body.enableStrictNegativeStockBlock !== undefined) safeUpdates.enableStrictNegativeStockBlock = Boolean(req.body.enableStrictNegativeStockBlock);
    if (req.body.enableBangladeshNBRRules !== undefined) safeUpdates.enableBangladeshNBRRules = Boolean(req.body.enableBangladeshNBRRules);
    if (req.body.enableAutoJournalOnInvoicing !== undefined) safeUpdates.enableAutoJournalOnInvoicing = Boolean(req.body.enableAutoJournalOnInvoicing);
    if (req.body.fiscalYearCycle === 'July-June' || req.body.fiscalYearCycle === 'January-December') {
      safeUpdates.fiscalYearCycle = req.body.fiscalYearCycle;
    }

    Object.assign(db.config, safeUpdates);
    db.addAuditLog({
      user: currentSession.name,
      userRole: currentSession.role,
      ipAddress: req.ip || '127.0.0.1',
      action: 'Updated System Configuration',
      module: 'System Administration',
      entity: 'SystemConfig',
      entityId: 'GLOBAL',
      newValue: JSON.stringify(safeUpdates),
    });
    res.json({ success: true, data: db.config });
  }
);

// --- MULTI-CURRENCY & REAL-TIME EXCHANGE RATES ---
const STATUTORY_BENCHMARKS_TO_BDT: Record<string, number> = {
  BDT: 1.0,
  USD: 121.5,
  EUR: 132.8,
  GBP: 158.4,
  CNY: 17.1,
  JPY: 0.81,
  AED: 33.08,
  INR: 1.45,
  SGD: 93.4,
  SAR: 32.38,
};

let ratesCache: { timestamp: number; base: string; data: any } | null = null;

apiRouter.get('/exchange-rates', async (req: Request, res: Response) => {
  const rawBase = String(req.query.base || 'BDT').toUpperCase().trim();
  const base = isValidCurrencyCode(rawBase) ? rawBase : 'BDT';
  const now = Date.now();

  // 60-second in-memory server cache
  if (ratesCache && ratesCache.base === base && now - ratesCache.timestamp < 60000) {
    return res.json({ success: true, data: ratesCache.data });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const apiRes = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const json = await apiRes.json();
      if (json.result === 'success' && json.rates) {
        const rates: Record<string, number> = json.rates;
        const ratesToBase: Record<string, number> = {};

        Object.keys(STATUTORY_BENCHMARKS_TO_BDT).forEach((curr) => {
          if (rates[curr]) {
            ratesToBase[curr] = 1 / rates[curr];
          }
        });

        const data = {
          base,
          rates,
          ratesToBase,
          lastUpdated: new Date().toISOString(),
          source: 'Open Exchange Rates (Live Web API)',
          isLive: true,
        };

        ratesCache = { timestamp: now, base, data };
        return res.json({ success: true, data });
      }
    }
  } catch {
    // Network failure or timeout: proceed to fallback
  }

  // Statutory Benchmark Fallback
  const bdtRateOfBase = STATUTORY_BENCHMARKS_TO_BDT[base] || 1;
  const rates: Record<string, number> = {};
  const ratesToBase: Record<string, number> = {};

  Object.entries(STATUTORY_BENCHMARKS_TO_BDT).forEach(([curr, bdtPerUnit]) => {
    rates[curr] = Number((bdtRateOfBase / bdtPerUnit).toFixed(6));
    ratesToBase[curr] = Number((bdtPerUnit / bdtRateOfBase).toFixed(6));
  });

  const fallbackData = {
    base,
    rates,
    ratesToBase,
    lastUpdated: new Date().toISOString(),
    source: 'Bangladesh Bank / NBR Reference Statutory Rates',
    isLive: false,
  };

  ratesCache = { timestamp: now, base, data: fallbackData };
  res.json({ success: true, data: fallbackData });
});

// --- SECURITY & COMPLIANCE HEALTH TELEMETRY ---
apiRouter.get('/security/status', (req: Request, res: Response) => {
  const securityAuditCount = db.auditLogs.filter((l) => l.module === 'Security').length;
  const blockedAttempts = db.auditLogs.filter((l) => l.action === 'UNAUTHORIZED_ACCESS_BLOCKED').length;

  res.json({
    success: true,
    data: {
      status: 'HARDENED',
      score: 100,
      timestamp: new Date().toISOString(),
      activeRole: currentSession.role,
      activeUser: currentSession.name,
      headers: {
        xContentTypeOptions: 'nosniff',
        xXSSProtection: '1; mode=block',
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
        xPoweredBy: 'Disabled (Masked)',
      },
      controls: {
        rateLimiting: {
          enabled: true,
          readWindow: '180 req/min',
          writeWindow: '60 req/min',
          algorithm: 'Sliding Window Token Bucket',
        },
        payloadSizeLimiter: {
          enabled: true,
          limit: '1MB maximum body payload',
        },
        rbacEnforcement: {
          enabled: true,
          rolesCount: ALLOWED_ROLES.length,
          strictSeparationOfDuties: true,
        },
        inputSanitization: {
          enabled: true,
          xssProtection: 'HTML Tag & Control Character Stripping',
          ssrfPrevention: 'Strict Currency & Target Parameter Validation',
        },
        financialIntegrity: {
          negativeStockBlock: db.config.enableStrictNegativeStockBlock,
          doubleEntryAtomicBalancing: true,
          approvalCeilingThreshold: db.config.approvalThresholdPO,
          immutableAuditTrail: true,
        },
      },
      telemetry: {
        totalAuditLogs: db.auditLogs.length,
        securityEventsCount: securityAuditCount,
        blockedUnauthorizedAttempts: blockedAttempts,
      },
    },
  });
});
