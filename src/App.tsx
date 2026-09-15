import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveModule } from './components/layout/Sidebar.js';
import { Topbar } from './components/layout/Topbar.js';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal.js';
import { Language } from './lib/i18n.js';
import { api } from './lib/api.js';

// Module Views
import { DashboardView } from './components/modules/DashboardView.js';
import { OrganizationView } from './components/modules/OrganizationView.js';
import { ProductsView } from './components/modules/ProductsView.js';
import { InventoryView } from './components/modules/InventoryView.js';
import { ProcurementView } from './components/modules/ProcurementView.js';
import { SalesView } from './components/modules/SalesView.js';
import { AccountingView } from './components/modules/AccountingView.js';
import { HRPayrollView } from './components/modules/HRPayrollView.js';
import { ManufacturingView } from './components/modules/ManufacturingView.js';
import { WorkflowsView } from './components/modules/WorkflowsView.js';
import { AuditView } from './components/modules/AuditView.js';
import { ReportsView } from './components/modules/ReportsView.js';
import { SettingsView } from './components/modules/SettingsView.js';
import { getInitialTheme, applyTheme, ThemeMode } from './lib/theme.js';
import { getStoredBaseCurrency, saveStoredBaseCurrency } from './lib/currency.js';

export default function App() {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [lang, setLang] = useState<Language>('en');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  const handleToggleTheme = (newTheme?: ThemeMode) => {
    const nextTheme = newTheme || (theme === 'dark' ? 'light' : 'dark');
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'apex_theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setTheme(e.newValue);
        applyTheme(e.newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Core App State
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentCompany, setCurrentCompany] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stockLedger, setStockLedger] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);
  const [accountingReports, setAccountingReports] = useState<any>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
  const [boms, setBoms] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [mrpList, setMrpList] = useState<any[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [baseCurrency, setBaseCurrency] = useState<string>(() => getStoredBaseCurrency());

  const handleBaseCurrencyChange = (newBase: string) => {
    setBaseCurrency(newBase);
    saveStoredBaseCurrency(newBase);
  };

  // Fetch all initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        meData,
        orgData,
        statsData,
        productsData,
        ledgerData,
        accountsData,
        journalsData,
        acctReportsData,
        poData,
        suppliersData,
        invData,
        custData,
        empData,
        payrollData,
        bomsData,
        ordersData,
        mrpData,
        approvalsData,
        auditData,
        notifData,
        settingsData,
      ] = await Promise.all([
        api.getMe(),
        api.getOrganizations(),
        api.getDashboardStats(),
        api.getProducts(),
        api.getStockLedger(),
        api.getAccounts(),
        api.getJournals(),
        api.getAccountingReports(),
        api.getPurchaseOrders(),
        api.getSuppliers(),
        api.getSalesInvoices(),
        api.getCustomers(),
        api.getEmployees(),
        api.getPayrollRuns(),
        api.getBOMs(),
        api.getProductionOrders(),
        api.getMRP(),
        api.getApprovalRequests(),
        api.getAuditLogs(),
        api.getNotifications(),
        api.getSettings(),
      ]);

      setCurrentUser(meData);
      setCompanies(orgData.companies || []);
      setWarehouses(orgData.warehouses || []);
      setCurrentCompany(
        orgData.companies?.find((c: any) => c.id === meData.companyId) || orgData.companies?.[0]
      );
      setStats(statsData);
      setProducts(productsData);
      setStockLedger(ledgerData);
      setAccounts(accountsData);
      setJournals(journalsData);
      setAccountingReports(acctReportsData);
      setPurchaseOrders(poData);
      setSuppliers(suppliersData);
      setInvoices(invData);
      setCustomers(custData);
      setEmployees(empData);
      setPayrollRuns(payrollData);
      setBoms(bomsData);
      setProductionOrders(ordersData);
      setMrpList(mrpData);
      setApprovalRequests(approvalsData);
      setAuditLogs(auditData);
      setNotifications(notifData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Failed to load initial ERP data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Refresh data helper after mutation
  const refreshCore = async () => {
    const [
      statsData,
      productsData,
      ledgerData,
      accountsData,
      journalsData,
      acctReportsData,
      poData,
      invData,
      payrollData,
      ordersData,
      mrpData,
      approvalsData,
      auditData,
      notifData,
    ] = await Promise.all([
      api.getDashboardStats(),
      api.getProducts(),
      api.getStockLedger(),
      api.getAccounts(),
      api.getJournals(),
      api.getAccountingReports(),
      api.getPurchaseOrders(),
      api.getSalesInvoices(),
      api.getPayrollRuns(),
      api.getProductionOrders(),
      api.getMRP(),
      api.getApprovalRequests(),
      api.getAuditLogs(),
      api.getNotifications(),
    ]);

    setStats(statsData);
    setProducts(productsData);
    setStockLedger(ledgerData);
    setAccounts(accountsData);
    setJournals(journalsData);
    setAccountingReports(acctReportsData);
    setPurchaseOrders(poData);
    setInvoices(invData);
    setPayrollRuns(payrollData);
    setProductionOrders(ordersData);
    setMrpList(mrpData);
    setApprovalRequests(approvalsData);
    setAuditLogs(auditData);
    setNotifications(notifData);
  };

  // Actions
  const handleSwitchCompany = async (companyId: string) => {
    await api.switchCompany(companyId);
    const matched = companies.find((c) => c.id === companyId);
    if (matched) setCurrentCompany(matched);
    refreshCore();
  };

  const handleSwitchRole = async (role: any) => {
    await api.switchRole(role);
    setCurrentUser((prev: any) => ({ ...prev, role }));
    refreshCore();
  };

  const handleCreateProduct = async (prod: any) => {
    await api.createProduct(prod);
    await refreshCore();
  };

  const handleAdjustStock = async (data: any) => {
    await api.adjustStock(data);
    await refreshCore();
  };

  const handleCreatePO = async (data: any) => {
    await api.createPurchaseOrder(data);
    await refreshCore();
  };

  const handleCreateInvoice = async (data: any) => {
    await api.createSalesInvoice(data);
    await refreshCore();
  };

  const handleCreateJournal = async (data: any) => {
    await api.createJournal(data);
    await refreshCore();
  };

  const handleGeneratePayroll = async (data: any) => {
    await api.generatePayroll(data);
    await refreshCore();
  };

  const handleCreateProductionOrder = async (data: any) => {
    await api.createProductionOrder(data);
    await refreshCore();
  };

  const handleReviewApproval = async (data: any) => {
    await api.reviewApproval(data);
    await refreshCore();
  };

  const handleQuickApprove = async (requestId: string) => {
    await api.reviewApproval({
      requestId,
      action: 'Approved',
      remarks: 'Quick approved from Executive Dashboard',
    });
    await refreshCore();
  };

  const handleMarkNotificationRead = async (id?: string) => {
    await api.markNotificationsRead(id);
    const updated = await api.getNotifications();
    setNotifications(updated);
  };

  const handleUpdateSettings = async (newSettings: any) => {
    await api.updateSettings(newSettings);
    setSettings(newSettings);
  };

  const pendingApprovalsCount = approvalRequests.filter((r) => r.status === 'Pending').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-xl animate-bounce shadow-lg shadow-blue-500/30">
          AX
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Connecting to ApexERP Enterprise Cluster...
        </p>
        <p className="text-2xs font-mono text-slate-500">
          ISO 27001 • NBR VAT-9.1 • Multi-Entity Ledger
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100/70 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-150">
      {/* Sidebar Navigation */}
      <Sidebar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        lang={lang}
        pendingApprovalsCount={pendingApprovalsCount}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar
          currentCompany={currentCompany}
          companies={companies}
          onSwitchCompany={handleSwitchCompany}
          currentUser={currentUser}
          onSwitchRole={handleSwitchRole}
          lang={lang}
          onToggleLang={() => setLang(lang === 'en' ? 'bn' : 'en')}
          onOpenSearch={() => setIsSearchOpen(true)}
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Dynamic Content Panel */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {activeModule === 'dashboard' && (
              <DashboardView
                stats={stats}
                products={products}
                approvalRequests={approvalRequests}
                productionOrders={productionOrders}
                onNavigate={setActiveModule}
                onQuickApprove={handleQuickApprove}
              />
            )}

            {activeModule === 'organization' && (
              <OrganizationView
                companies={companies}
                warehouses={warehouses}
                currentCompany={currentCompany}
                onSwitchCompany={handleSwitchCompany}
              />
            )}

            {activeModule === 'products' && (
              <ProductsView
                products={products}
                onCreateProduct={handleCreateProduct}
              />
            )}

            {activeModule === 'inventory' && (
              <InventoryView
                products={products}
                stockLedger={stockLedger}
                warehouses={warehouses}
                onAdjustStock={handleAdjustStock}
              />
            )}

            {activeModule === 'procurement' && (
              <ProcurementView
                purchaseOrders={purchaseOrders}
                suppliers={suppliers}
                products={products}
                onCreatePO={handleCreatePO}
              />
            )}

            {activeModule === 'sales' && (
              <SalesView
                invoices={invoices}
                customers={customers}
                products={products}
                onCreateInvoice={handleCreateInvoice}
                baseCurrency={baseCurrency}
                onBaseCurrencyChange={handleBaseCurrencyChange}
              />
            )}

            {activeModule === 'accounting' && (
              <AccountingView
                accounts={accounts}
                journals={journals}
                reports={accountingReports}
                onCreateJournal={handleCreateJournal}
                baseCurrency={baseCurrency}
                onBaseCurrencyChange={handleBaseCurrencyChange}
              />
            )}

            {activeModule === 'hrPayroll' && (
              <HRPayrollView
                employees={employees}
                payrollRuns={payrollRuns}
                onGeneratePayroll={handleGeneratePayroll}
              />
            )}

            {activeModule === 'manufacturing' && (
              <ManufacturingView
                boms={boms}
                productionOrders={productionOrders}
                mrpList={mrpList}
                products={products}
                onCreateOrder={handleCreateProductionOrder}
              />
            )}

            {activeModule === 'workflows' && (
              <WorkflowsView
                requests={approvalRequests}
                currentUser={currentUser}
                onReview={handleReviewApproval}
              />
            )}

            {activeModule === 'auditLogs' && (
              <AuditView logs={auditLogs} />
            )}

            {activeModule === 'reports' && (
              <ReportsView
                stats={stats}
                reports={accountingReports}
                products={products}
                invoices={invoices}
                employees={employees}
                currentCompany={currentCompany}
                currentUser={currentUser}
              />
            )}

            {activeModule === 'settings' && (
              <SettingsView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                theme={theme}
                onToggleTheme={handleToggleTheme}
              />
            )}
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveModule}
        products={products}
        invoices={invoices}
        purchaseOrders={purchaseOrders}
        accounts={accounts}
        employees={employees}
      />
    </div>
  );
}
