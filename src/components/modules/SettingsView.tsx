import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Sliders,
  CheckCircle2,
  Save,
  Key,
  Globe2,
  Sun,
  Moon,
  Eye,
  Monitor,
  Zap,
  Check,
} from 'lucide-react';
import { Badge } from '../ui/Badge.js';
import { applyTheme, ThemeMode } from '../../lib/theme.js';
import { SecureActionButton, AuditorReadonlyBanner } from '../ui/PermissionGate.js';
import { SecurityGovernanceTab } from './SecurityGovernanceTab.js';

interface SettingsViewProps {
  settings: any;
  onUpdateSettings: (newSettings: any) => Promise<void>;
  theme?: ThemeMode;
  onToggleTheme?: (newTheme?: ThemeMode) => void;
  currentUser?: any;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  theme = 'light',
  onToggleTheme,
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'tax' | 'rbac' | 'system' | 'appearance'>('appearance');
  const [formData, setFormData] = useState(settings || {});
  const [saved, setSaved] = useState(false);

  const isDarkMode = theme === 'dark';

  const handleThemeChange = (selectedTheme: ThemeMode) => {
    if (onToggleTheme) {
      onToggleTheme(selectedTheme);
    } else {
      applyTheme(selectedTheme);
    }
    setFormData((prev: any) => ({
      ...prev,
      darkMode: selectedTheme === 'dark',
      themePreference: selectedTheme,
    }));
  };

  const rbacRoles = [
    {
      role: 'Super Admin',
      description: 'Unrestricted enterprise administrative authority across all entities and settings',
      permissions: ['Manage Users', 'Approve All Workflows', 'Post All Journals', 'Manage Master Data', 'System Configuration'],
    },
    {
      role: 'CFO',
      description: 'Chief Financial Officer: ultimate fiscal authority, journal approval, budget ceilings',
      permissions: ['Approve POs > ৳500K', 'Approve Journals', 'View Financial Reports', 'Manage Bank Accounts', 'Authorize Disbursals'],
    },
    {
      role: 'Accountant',
      description: 'Day-to-day general ledger vouchers, AR/AP postings, VAT returns preparation',
      permissions: ['Draft Journal Vouchers', 'Create Sales Invoices', 'Record Supplier Bills', 'Generate Trial Balance'],
    },
    {
      role: 'Warehouse Manager',
      description: 'Bonded storage control, material goods receipt, stock transfers and adjustments',
      permissions: ['Post Stock Adjustments', 'Receive PO Shipments', 'Inspect Quality', 'Manage Bin Locations'],
    },
    {
      role: 'Production Manager',
      description: 'Manufacturing operations, MRP scheduling, work center routing, yield monitoring',
      permissions: ['Create Production Orders', 'Update Job Progress', 'View BOMs', 'Requisition Materials'],
    },
    {
      role: 'Sales Manager',
      description: 'Customer credit limits, quotation workflows, sales order authorization',
      permissions: ['Create Sales Orders', 'Approve Credit Extensions', 'View Customer Aging', 'Issue Invoices'],
    },
    {
      role: 'HR Manager',
      description: 'Staff directory, compensation bands, monthly payroll calculations',
      permissions: ['Manage Staff Directory', 'Run Monthly Payroll', 'Update Tax Brackets', 'Issue Pay Slips'],
    },
  ];

  const handleSave = async () => {
    try {
      await onUpdateSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving settings');
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-Only Auditor Banner */}
      <AuditorReadonlyBanner currentUser={currentUser} entityName="System configurations, NBR parameters, and governance settings" />

      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            System Administration & Governance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Display accessibility, Bangladesh NBR tax parameters, and granular RBAC security matrix.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Header Theme Toggle */}
          <button
            type="button"
            id="settings-header-theme-toggle"
            onClick={() => handleThemeChange(isDarkMode ? 'light' : 'dark')}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs"
            title="Toggle day / night operation mode"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Night Mode (Active)</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-600" />
                <span>Day Mode (Active)</span>
              </>
            )}
          </button>

          <SecureActionButton
            id="save-settings-btn"
            action="settings:update"
            currentUser={currentUser}
            onClick={handleSave}
            icon={Save}
            className="w-full sm:w-auto"
          >
            <span>Save System Configurations</span>
          </SecureActionButton>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>System configuration parameters committed and applied across all company entities.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 rounded-t-xl overflow-x-auto whitespace-nowrap transition-colors">
        <button
          id="tab-appearance"
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'appearance'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Display & Accessibility (Dark Mode)</span>
        </button>
        <button
          id="tab-tax"
          onClick={() => setActiveTab('tax')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'tax'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Taxation & Compliance (NBR Bangladesh)
        </button>
        <button
          id="tab-rbac"
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'rbac'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Security, RBAC & Governance (SoD)
        </button>
        <button
          id="tab-system"
          onClick={() => setActiveTab('system')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'system'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Security Policies & Workflows
        </button>
      </div>

      {/* APPEARANCE & DARK MODE ACCESSIBILITY TAB */}
      {activeTab === 'appearance' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Display Theme & Night-Time Ergonomics
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Configure visual presentation for factory floor operators, warehouse shifts, and accounting audit marathons.
                Toggling globally updates all Tailwind CSS classes, persists your preference in local storage, and eliminates high-glare eye fatigue.
              </p>
            </div>

            {/* Direct Switch control */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Night Mode
              </span>
              <button
                type="button"
                role="switch"
                id="night-mode-switch"
                aria-checked={isDarkMode}
                onClick={() => handleThemeChange(isDarkMode ? 'light' : 'dark')}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isDarkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span className="sr-only">Toggle night-time operation mode</span>
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isDarkMode ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Theme Selection Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Theme Palette Presets
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Light Mode Preset Card */}
              <button
                type="button"
                id="select-light-theme-btn"
                onClick={() => handleThemeChange('light')}
                className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  !isDarkMode
                    ? 'border-blue-600 bg-blue-50/20 dark:bg-slate-800/80 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {!isDarkMode && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">Daytime Enterprise (Light)</h5>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">High-clarity daytime contrast for standard office monitors</p>
                  </div>
                </div>

                {/* Color Swatches Preview */}
                <div className="mt-4 p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-300" />
                    <span className="w-4 h-4 rounded-full bg-white border border-slate-300" />
                    <span className="w-4 h-4 rounded-full bg-blue-600" />
                    <span className="text-slate-600 font-medium ml-1">Off-White Canvas & Slate</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-3xs font-semibold bg-slate-100 text-slate-700">
                    Default
                  </span>
                </div>
              </button>

              {/* Dark Mode Preset Card */}
              <button
                type="button"
                id="select-dark-theme-btn"
                onClick={() => handleThemeChange('dark')}
                className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                  isDarkMode
                    ? 'border-blue-500 bg-slate-800/90 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {isDarkMode && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">Night-Time Operation (Dark)</h5>
                    <p className="text-2xs text-slate-500 dark:text-slate-400">Deep slate surfaces for low-light shifts, control rooms, and OLED screens</p>
                  </div>
                </div>

                {/* Color Swatches Preview */}
                <div className="mt-4 p-3 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between text-2xs">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-slate-950 border border-slate-800" />
                    <span className="w-4 h-4 rounded-full bg-slate-900 border border-slate-700" />
                    <span className="w-4 h-4 rounded-full bg-blue-500" />
                    <span className="text-slate-300 font-medium ml-1">Deep Slate & High Contrast</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-3xs font-semibold bg-slate-800 text-amber-300 border border-slate-700">
                    Accessible
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Accessibility & Ergonomics Badges Grid */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Ergonomic & Shift Operations Specifications
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-1">
                  <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>WCAG 2.1 AA Contrast</span>
                </div>
                <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Strict 4.5:1 text-to-surface contrast ratio maintained across all tables, forms, badges, and modals.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-1">
                  <Monitor className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Circadian Glare Reduction</span>
                </div>
                <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Prevents ocular fatigue and melatonin disruption for night-shift accountants and production operators.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold text-xs mb-1">
                  <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Instant Class Injection</span>
                </div>
                <p className="text-2xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Direct DOM `.dark` manipulation with persistent storage in local cache and pre-hydration prevention of FOUC.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAXATION TAB */}
      {activeTab === 'tax' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6 transition-colors">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">National Board of Revenue (NBR) Tax Rules</h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">Value Added Tax (VAT Act 2012) and Tax Deducted at Source (TDS)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Standard NBR VAT Rate (%)</label>
              <input
                type="number"
                value={formData.standardVatRate || 15}
                onChange={(e) => setFormData({ ...formData, standardVatRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1">Default statutory rate under NBR VAT Act</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">TDS Withholding Tax Rate (%)</label>
              <input
                type="number"
                value={formData.withholdingTaxRate || 5}
                onChange={(e) => setFormData({ ...formData, withholdingTaxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1">Deducted from vendor payments &gt; ৳25,000</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">VDS (VAT Deducted at Source) (%)</label>
              <input
                type="number"
                value={formData.vdsRate || 7.5}
                onChange={(e) => setFormData({ ...formData, vdsRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-3xs text-slate-400 dark:text-slate-500 mt-1">Statutory withholding on service procurement</p>
            </div>
          </div>
        </div>
      )}

      {/* RBAC & SECURITY GOVERNANCE TAB */}
      {activeTab === 'rbac' && (
        <SecurityGovernanceTab currentUser={currentUser} />
      )}

      {/* SYSTEM & POLICIES TAB */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4 transition-colors">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Governance & Approval Ceiling Parameters</h3>
            <p className="text-2xs text-slate-500 dark:text-slate-400">Corporate threshold rules requiring executive oversight</p>
          </div>

          <div className="space-y-4 text-xs">
            {/* Inline Accessibility Feature under System */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-amber-500" />
                  Night-Time Operation Accessibility
                </p>
                <p className="text-2xs text-slate-400 dark:text-slate-400">Apply dark palette styling globally across all ERP interfaces for shift work</p>
              </div>
              <button
                type="button"
                onClick={() => handleThemeChange(isDarkMode ? 'light' : 'dark')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  isDarkMode
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                {isDarkMode ? 'Dark Enabled' : 'Enable Dark'}
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">PO Executive Approval Ceiling</p>
                <p className="text-2xs text-slate-400 dark:text-slate-400">Purchase orders exceeding this amount require CFO authorization</p>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">৳500,000.00</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Negative Stock Prevention Policy</p>
                <p className="text-2xs text-slate-400 dark:text-slate-400">Hard stop prevented by stock ledger transaction engine</p>
              </div>
              <Badge variant="success">Strictly Enforced (No Overselling)</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Double-Entry Ledger Balancing Check</p>
                <p className="text-2xs text-slate-400 dark:text-slate-400">Total debit must mathematically equal total credit before commit</p>
              </div>
              <Badge variant="success">Zero-Tolerance Atomic Validation</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
