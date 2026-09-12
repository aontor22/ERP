import React, { useState, useEffect } from 'react';
import { Search, Package, Receipt, ShoppingCart, Users, BookOpen, ArrowRight } from 'lucide-react';
import { ActiveModule } from './Sidebar.js';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: ActiveModule) => void;
  products: any[];
  invoices: any[];
  purchaseOrders: any[];
  accounts: any[];
  employees: any[];
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  products,
  invoices,
  purchaseOrders,
  accounts,
  employees,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle search modal
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  // Search results
  const matchedProducts = q ? products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedInvoices = q ? invoices.filter((i) => i.invoiceNumber.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedPOs = q ? purchaseOrders.filter((po) => po.poNumber.toLowerCase().includes(q) || po.supplierName.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedAccounts = q ? accounts.filter((a) => a.code.includes(q) || a.name.toLowerCase().includes(q)).slice(0, 3) : [];
  const matchedEmployees = q ? employees.filter((e) => `${e.firstName} ${e.lastName}`.toLowerCase().includes(q) || e.designation.toLowerCase().includes(q)).slice(0, 3) : [];

  const totalMatches = matchedProducts.length + matchedInvoices.length + matchedPOs.length + matchedAccounts.length + matchedEmployees.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100">
        {/* Search input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/80">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, invoices, POs, accounts, employees..."
            className="w-full bg-transparent text-sm focus:outline-hidden text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
          <kbd className="px-1.5 py-0.5 text-2xs font-mono font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-3 text-xs space-y-3">
          {q.length === 0 && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              Type anything to search across master records and operational documents...
            </div>
          )}

          {q.length > 0 && totalMatches === 0 && (
            <div className="py-8 text-center text-slate-400 dark:text-slate-500">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}

          {matchedProducts.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-2xs font-bold uppercase text-slate-400 dark:text-slate-500">Products & Inventory</p>
              {matchedProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onNavigate('products');
                    onClose();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</p>
                      <p className="text-2xs text-slate-400 dark:text-slate-500">SKU: {p.sku} | Stock: {p.currentStock} {p.unit}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          )}

          {matchedInvoices.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-2xs font-bold uppercase text-slate-400 dark:text-slate-500">Sales Invoices</p>
              {matchedInvoices.map((i) => (
                <button
                  key={i.id}
                  onClick={() => {
                    onNavigate('sales');
                    onClose();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{i.invoiceNumber} - {i.customerName}</p>
                      <p className="text-2xs text-slate-400 dark:text-slate-500">৳{i.grandTotal.toLocaleString()} | {i.status}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          )}

          {matchedPOs.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-2xs font-bold uppercase text-slate-400 dark:text-slate-500">Purchase Orders</p>
              {matchedPOs.map((po) => (
                <button
                  key={po.id}
                  onClick={() => {
                    onNavigate('procurement');
                    onClose();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingCart className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{po.poNumber} - {po.supplierName}</p>
                      <p className="text-2xs text-slate-400 dark:text-slate-500">৳{po.grandTotal.toLocaleString()} | {po.status}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          )}

          {matchedAccounts.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-2xs font-bold uppercase text-slate-400 dark:text-slate-500">Chart of Accounts</p>
              {matchedAccounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    onNavigate('accounting');
                    onClose();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{a.code} - {a.name}</p>
                      <p className="text-2xs text-slate-400 dark:text-slate-500">{a.category} | Balance: ৳{a.balance.toLocaleString()}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          )}

          {matchedEmployees.length > 0 && (
            <div>
              <p className="px-2 pb-1 text-2xs font-bold uppercase text-slate-400 dark:text-slate-500">Employees</p>
              {matchedEmployees.map((e) => (
                <button
                  key={e.id}
                  onClick={() => {
                    onNavigate('hrPayroll');
                    onClose();
                  }}
                  className="w-full p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 flex items-center justify-between text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{e.firstName} {e.lastName}</p>
                      <p className="text-2xs text-slate-400 dark:text-slate-500">{e.designation} | {e.departmentName}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
