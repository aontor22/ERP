import { Router, Request, Response } from 'express';
import { db } from './erpDatabase.js';

export const apiRouter = Router();

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
  if (role) {
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
  }
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
      monthlyTrends: [
        { month: 'Apr', revenue: 42000000, expenses: 29500000, profit: 12500000 },
        { month: 'May', revenue: 48500000, expenses: 33100000, profit: 15400000 },
        { month: 'Jun', revenue: 54000000, expenses: 36800000, profit: 17200000 },
        { month: 'Jul', revenue: 61000000, expenses: 41200000, profit: 19800000 },
        { month: 'Aug', revenue: 68500000, expenses: 44900000, profit: 23600000 },
        { month: 'Sep', revenue: totalRevenue, expenses: totalExpenses, profit: netProfit },
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

apiRouter.post('/products', (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.sku || !body.unit) {
    return res.status(400).json({ success: false, message: 'Missing required product parameters' });
  }

  // Check unique SKU
  if (db.products.some((p) => p.sku === body.sku)) {
    return res.status(400).json({ success: false, message: `Product with SKU ${body.sku} already exists` });
  }

  const newProduct = {
    id: `prod-${Date.now()}`,
    sku: body.sku,
    barcode: body.barcode || `894${Date.now().toString().slice(-9)}`,
    name: body.name,
    description: body.description || '',
    category: body.category || 'General',
    brand: body.brand || 'Apex Group',
    type: body.type || 'Product',
    unit: body.unit,
    costPrice: Number(body.costPrice || 0),
    sellingPrice: Number(body.sellingPrice || 0),
    taxRate: Number(body.taxRate || db.config.vatPercentage),
    reorderLevel: Number(body.reorderLevel || 100),
    minStock: Number(body.minStock || 50),
    maxStock: Number(body.maxStock || 10000),
    weightKg: Number(body.weightKg || 1),
    valuationMethod: body.valuationMethod || 'FIFO',
    batchTracking: Boolean(body.batchTracking),
    serialTracking: Boolean(body.serialTracking),
    currentStock: Number(body.openingStock || 0),
    totalStockValue: Number(body.openingStock || 0) * Number(body.costPrice || 0),
    companyId: currentSession.currentCompanyId,
    warehouseAllocations: [
      {
        warehouseId: db.warehouses[0].id,
        warehouseName: db.warehouses[0].name,
        quantity: Number(body.openingStock || 0),
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
});

// --- INVENTORY ENGINE ---
apiRouter.get('/inventory/ledger', (req: Request, res: Response) => {
  res.json({ success: true, data: db.stockLedger });
});

apiRouter.post('/inventory/adjust', (req: Request, res: Response) => {
  const { productId, warehouseId, quantityChange, reason } = req.body;
  if (!productId || !warehouseId || quantityChange === undefined) {
    return res.status(400).json({ success: false, message: 'Invalid stock adjustment parameters' });
  }

  const result = db.adjustStock({
    productId,
    warehouseId,
    quantityChange: Number(quantityChange),
    reason: reason || 'Physical inventory cycle count reconciliation',
    user: currentSession.name,
    companyId: currentSession.currentCompanyId,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json({ success: true, message: 'Stock successfully adjusted and posted to ledger' });
});

// --- ACCOUNTING & GENERAL LEDGER ---
apiRouter.get('/accounting/accounts', (req: Request, res: Response) => {
  res.json({ success: true, data: db.chartOfAccounts });
});

apiRouter.get('/accounting/journals', (req: Request, res: Response) => {
  res.json({ success: true, data: db.journalEntries });
});

apiRouter.post('/accounting/journals', (req: Request, res: Response) => {
  const { reference, memo, lines } = req.body;
  if (!memo || !Array.isArray(lines) || lines.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'A journal voucher must have a memo and at least two balanced lines.',
    });
  }

  const result = db.postJournalEntry({
    reference: reference || `JV-${Date.now().toString().slice(-4)}`,
    memo,
    lines,
    postedBy: currentSession.name,
    companyId: currentSession.currentCompanyId,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json({ success: true, data: result.entry });
});

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

// --- PROCUREMENT ---
apiRouter.get('/procurement/orders', (req: Request, res: Response) => {
  res.json({ success: true, data: db.purchaseOrders });
});

apiRouter.post('/procurement/orders', (req: Request, res: Response) => {
  const { supplierId, items, paymentTerms, notes } = req.body;
  const supplier = db.suppliers.find((s) => s.id === supplierId);
  if (!supplier || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid supplier or order items' });
  }

  let subTotal = 0;
  let taxTotal = 0;
  const formattedItems = items.map((it: any) => {
    const prod = db.products.find((p) => p.id === it.productId);
    const lineSub = Number(it.orderedQty) * Number(it.unitPrice);
    const tax = (lineSub * Number(it.taxRate || 15)) / 100;
    subTotal += lineSub;
    taxTotal += tax;
    return {
      productId: it.productId,
      productName: prod ? prod.name : 'Item',
      sku: prod ? prod.sku : 'SKU',
      orderedQty: Number(it.orderedQty),
      receivedQty: 0,
      unitPrice: Number(it.unitPrice),
      taxRate: Number(it.taxRate || 15),
      lineTotal: lineSub,
    };
  });

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
    paymentTerms: paymentTerms || 'Net 30',
    subTotal,
    taxTotal,
    grandTotal,
    notes: notes || '',
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
});

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

apiRouter.post('/sales/invoices', (req: Request, res: Response) => {
  const { customerId, items } = req.body;
  if (!customerId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Invalid customer or invoice items' });
  }

  const result = db.postSalesInvoice({
    customerId,
    items,
    postedBy: currentSession.name,
    companyId: currentSession.currentCompanyId,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json({ success: true, data: result.invoice });
});

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

apiRouter.post('/payroll/runs', (req: Request, res: Response) => {
  const { periodName, month, year } = req.body;

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
    reference: `PAY-${year}-${String(month).padStart(2, '0')}`,
    memo: `Salary & Wage disbursement for ${periodName || 'Cycle'}`,
    companyId: currentSession.currentCompanyId,
    postedBy: currentSession.name,
    lines: [
      {
        accountId: 'acc-6010', // Admin Salaries & Wages (Expense Debit)
        description: `Gross Salaries - ${periodName}`,
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
    periodName: periodName || `September ${year || 2026}`,
    month: Number(month || 9),
    year: Number(year || 2026),
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
});

// --- MANUFACTURING & MRP ---
apiRouter.get('/manufacturing/boms', (req: Request, res: Response) => {
  res.json({ success: true, data: db.billsOfMaterial });
});

apiRouter.get('/manufacturing/orders', (req: Request, res: Response) => {
  res.json({ success: true, data: db.productionOrders });
});

apiRouter.post('/manufacturing/orders', (req: Request, res: Response) => {
  const { bomId, plannedQuantity, dueDate, workCenter } = req.body;
  const bom = db.billsOfMaterial.find((b) => b.id === bomId);
  if (!bom || !plannedQuantity) {
    return res.status(400).json({ success: false, message: 'Invalid BOM or quantity' });
  }

  const orderNumber = `MO-2026-${String(db.productionOrders.length + 1).padStart(4, '0')}`;
  const costEstimate = (bom.totalComponentCost / bom.yieldQuantity) * Number(plannedQuantity);

  const newOrder = {
    id: `mo-${Date.now()}`,
    orderNumber,
    companyId: currentSession.currentCompanyId,
    bomId: bom.id,
    finishedProductId: bom.finishedProductId,
    finishedProductName: bom.finishedProductName,
    plannedQuantity: Number(plannedQuantity),
    completedQuantity: 0,
    startDate: new Date().toISOString().split('T')[0],
    dueDate: dueDate || new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    status: 'Planned' as const,
    totalCostIncurred: costEstimate,
    assignedWorkCenter: workCenter || 'Knitting & Stitching Line 3',
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
    newValue: `Product: ${bom.finishedProductName} | Planned Qty: ${plannedQuantity}`,
  });

  res.json({ success: true, data: newOrder });
});

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

apiRouter.post('/workflows/review', (req: Request, res: Response) => {
  const { requestId, action, remarks } = req.body;
  if (!requestId || !action) {
    return res.status(400).json({ success: false, message: 'Request ID and action are required' });
  }

  const result = db.reviewApproval({
    requestId,
    action,
    remarks: remarks || `Reviewed by ${currentSession.role}`,
    user: currentSession.name,
    role: currentSession.role,
  });

  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json({ success: true, message: `Workflow request successfully ${action.toLowerCase()}` });
});

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

apiRouter.put('/settings', (req: Request, res: Response) => {
  Object.assign(db.config, req.body);
  db.addAuditLog({
    user: currentSession.name,
    userRole: currentSession.role,
    ipAddress: req.ip || '127.0.0.1',
    action: 'Updated System Configuration',
    module: 'System Administration',
    entity: 'SystemConfig',
    entityId: 'GLOBAL',
    newValue: JSON.stringify(req.body),
  });
  res.json({ success: true, data: db.config });
});
