import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  X,
  Save,
  KeyRound,
  FileCheck2,
  Fingerprint,
  Info,
  Scale,
  Building,
} from 'lucide-react';
import {
  RoleType,
  ActionPermission,
  RoleDefinition,
  SecurityUserAccount,
  SecurityPolicySettings,
  SoDScanReport,
} from '../../types/erp.js';
import { api } from '../../lib/api.js';
import { Badge } from '../ui/Badge.js';
import { setDynamicRolePermissions } from '../../lib/permissions.js';

interface SecurityGovernanceTabProps {
  currentUser?: any;
}

const ACTION_GROUPS: { category: string; actions: { id: ActionPermission; label: string; desc: string }[] }[] = [
  {
    category: 'Inventory & Warehousing',
    actions: [
      { id: 'products:create', label: 'Create Products', desc: 'Create and edit master SKU catalogue' },
      { id: 'inventory:adjust', label: 'Adjust Stock', desc: 'Post physical stock adjustment vouchers' },
      { id: 'inventory:forecast_apply', label: 'Apply AI ROP', desc: 'Update automated reorder point parameters' },
      { id: 'inventory:forecast_order', label: 'Generate Replenishment', desc: 'Convert stock forecasts into draft POs' },
    ],
  },
  {
    category: 'Procurement & Purchasing',
    actions: [
      { id: 'procurement:create', label: 'Create Purchase Orders', desc: 'Draft and submit vendor purchase orders' },
      { id: 'procurement:approve', label: 'Approve Purchase Orders', desc: 'Authorize procurement orders up to ceiling' },
    ],
  },
  {
    category: 'Sales & Commercial',
    actions: [
      { id: 'sales:create_invoice', label: 'Create Sales Invoices', desc: 'Post commercial invoices and customer orders' },
    ],
  },
  {
    category: 'Financial Accounting & Treasury',
    actions: [
      { id: 'accounting:create_journal', label: 'Post Journal Vouchers', desc: 'Post manual double-entry ledger entries' },
      { id: 'accounting:manage_budget', label: 'Configure Budgets', desc: 'Create and amend departmental expense ceilings' },
    ],
  },
  {
    category: 'Human Resources & Payroll',
    actions: [
      { id: 'hr:generate_payroll', label: 'Run Monthly Payroll', desc: 'Execute enterprise payroll calculation and disbursement' },
    ],
  },
  {
    category: 'Manufacturing & MRP',
    actions: [
      { id: 'manufacturing:create_order', label: 'Launch Production Orders', desc: 'Issue factory job cards and routing' },
      { id: 'manufacturing:update_order', label: 'Update Shop Progress', desc: 'Log work center progress and completions' },
    ],
  },
  {
    category: 'Governance & Administrative',
    actions: [
      { id: 'workflows:approve', label: 'Authorize Workflows', desc: 'Approve pending multi-level approvals' },
      { id: 'workflows:reject', label: 'Reject Workflows', desc: 'Decline requests with statutory remarks' },
      { id: 'settings:manage', label: 'Manage Settings', desc: 'Configure enterprise rates, taxes, and rules' },
      { id: 'organization:manage', label: 'Manage Organizations', desc: 'Create companies, plants, and branches' },
      { id: 'audit:view', label: 'Inspect Audit Logs', desc: 'Access immutable WORM audit logs and security telemetry' },
      { id: 'reports:export', label: 'Export Reports', desc: 'Download CSV and PDF reports' },
    ],
  },
];

export const SecurityGovernanceTab: React.FC<SecurityGovernanceTabProps> = ({ currentUser }) => {
  const [subTab, setSubTab] = useState<'matrix' | 'users' | 'sod' | 'policies'>('matrix');

  // Matrix State
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRoleName, setSelectedRoleName] = useState<RoleType>('CFO');
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [roleSearch, setRoleSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Users State
  const [users, setUsers] = useState<SecurityUserAccount[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // SoD State
  const [sodReport, setSodReport] = useState<SoDScanReport | null>(null);
  const [scanningSoD, setScanningSoD] = useState(false);

  // Policies State
  const [policies, setPolicies] = useState<SecurityPolicySettings | null>(null);
  const [savingPolicies, setSavingPolicies] = useState(false);
  const [policySavedMsg, setPolicySavedMsg] = useState('');

  const [loading, setLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    loadAllSecurityData();
  }, []);

  const loadAllSecurityData = async () => {
    try {
      setLoading(true);
      const [rolesData, usersData, policiesData, sodData] = await Promise.all([
        api.getSecurityRoles(),
        api.getSecurityUsers(),
        api.getSecurityPolicies(),
        api.runSoDScan(),
      ]);

      setRoles(rolesData);
      setUsers(usersData);
      setPolicies(policiesData);
      setSodReport(sodData);

      // Initialize active role's permissions
      const initialRole = rolesData.find((r) => r.role === selectedRoleName) || rolesData[0];
      if (initialRole) {
        setSelectedRoleName(initialRole.role);
        setEditingPermissions([...initialRole.allowedActions]);
      }

      // Sync dynamic permission cache
      const map: Record<string, string[]> = {};
      rolesData.forEach((r) => {
        map[r.role] = r.allowedActions;
      });
      setDynamicRolePermissions(map);
    } catch (e) {
      console.error('Failed to fetch security governance data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRole = (roleDef: RoleDefinition) => {
    setSelectedRoleName(roleDef.role);
    setEditingPermissions([...roleDef.allowedActions]);
    setSaveSuccessMsg('');
  };

  const handleToggleAction = (actionId: ActionPermission) => {
    if (selectedRole?.isReadOnly && selectedRoleName === 'Auditor') {
      return; // Auditor cannot have write actions
    }
    setEditingPermissions((prev) =>
      prev.includes(actionId) ? prev.filter((a) => a !== actionId) : [...prev, actionId]
    );
  };

  const handleSavePermissions = async () => {
    try {
      setSavingPermissions(true);
      await api.updateRolePermissions(selectedRoleName, editingPermissions);

      // Update local state
      setRoles((prev) =>
        prev.map((r) => (r.role === selectedRoleName ? { ...r, allowedActions: editingPermissions } : r))
      );

      // Sync permission library cache
      setDynamicRolePermissions({ [selectedRoleName]: editingPermissions });

      setSaveSuccessMsg(`Permissions updated successfully for ${selectedRoleName}.`);
      setTimeout(() => setSaveSuccessMsg(''), 4000);

      // Re-run SoD scan in background to update compliance telemetry
      const updatedReport = await api.runSoDScan();
      setSodReport(updatedReport);
    } catch (err: any) {
      alert(err.message || 'Failed to update role permissions');
    } finally {
      setSavingPermissions(false);
    }
  };

  const handleUpdateUserStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      setUpdatingUserId(userId);
      const updated = await api.updateSecurityUser(userId, { status: nextStatus as any });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: RoleType) => {
    try {
      setUpdatingUserId(userId);
      const updated = await api.updateSecurityUser(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));

      // Refresh SoD analysis
      const updatedReport = await api.runSoDScan();
      setSodReport(updatedReport);
    } catch (err: any) {
      alert(err.message || 'Failed to reassign role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleUserMFA = async (userId: string, currentMFA: boolean) => {
    try {
      setUpdatingUserId(userId);
      const updated = await api.updateSecurityUser(userId, { mfaEnabled: !currentMFA });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle MFA');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleRunSoDScan = async () => {
    try {
      setScanningSoD(true);
      const report = await api.runSoDScan();
      setSodReport(report);
    } catch (err: any) {
      alert(err.message || 'Failed to execute SoD scan');
    } finally {
      setScanningSoD(false);
    }
  };

  const handleSavePolicies = async () => {
    if (!policies) return;
    try {
      setSavingPolicies(true);
      const updated = await api.updateSecurityPolicies(policies);
      setPolicies(updated);
      setPolicySavedMsg('Enterprise security governance policies successfully persisted.');
      setTimeout(() => setPolicySavedMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update security policies');
    } finally {
      setSavingPolicies(false);
    }
  };

  const selectedRole = roles.find((r) => r.role === selectedRoleName);
  const categories = ['All', 'Executive', 'Finance', 'Operations', 'Commercial', 'HR', 'Audit'];

  const filteredRoles = roles.filter((r) => {
    const matchesCat = categoryFilter === 'All' || r.category === categoryFilter;
    const matchesSearch =
      !roleSearch.trim() ||
      r.role.toLowerCase().includes(roleSearch.toLowerCase()) ||
      r.title.toLowerCase().includes(roleSearch.toLowerCase()) ||
      r.description.toLowerCase().includes(roleSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Enterprise RBAC, Separation of Duties (SoD) & Governance
                </h3>
                <p className="text-2xs text-slate-500 dark:text-slate-400">
                  Granular action authorization, dynamic permissions matrix, multi-tenant account control, and statutory conflict scanning.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Health Status Indicator */}
          {sodReport && (
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <div className="text-right">
                <p className="text-3xs uppercase tracking-wider font-bold text-slate-400">Posture Score</p>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {sodReport.overallScore}/100 ({sodReport.postureStatus})
                </p>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${
                  sodReport.overallScore >= 95
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                    : sodReport.overallScore >= 80
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : 'bg-rose-500 ring-4 ring-rose-500/20'
                }`}
              />
            </div>
          )}
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto">
          <button
            id="subtab-matrix-btn"
            onClick={() => setSubTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'matrix'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Role Permissions Matrix ({roles.length})</span>
          </button>

          <button
            id="subtab-users-btn"
            onClick={() => setSubTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'users'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Accounts & MFA ({users.length})</span>
          </button>

          <button
            id="subtab-sod-btn"
            onClick={() => setSubTab('sod')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'sod'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Separation of Duties (SoD)</span>
            {sodReport && sodReport.violationsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-3xs font-bold bg-rose-500 text-white">
                {sodReport.violationsCount}
              </span>
            )}
          </button>

          <button
            id="subtab-policies-btn"
            onClick={() => setSubTab('policies')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'policies'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Security & Governance Policies</span>
          </button>
        </div>
      </div>

      {/* 1. ROLE PERMISSIONS MATRIX TAB */}
      {subTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Role Selector (4 Cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Select Role to Configure
                </h4>
                <span className="text-3xs text-slate-400 font-mono">{filteredRoles.length} roles</span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded text-3xs font-medium transition cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Roles List */}
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                {filteredRoles.map((r) => {
                  const isSelected = r.role === selectedRoleName;
                  return (
                    <button
                      key={r.role}
                      onClick={() => handleSelectRole(r)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.role}</span>
                        <span className={`text-3xs font-bold px-1.5 py-0.2 rounded ${r.badgeColor}`}>
                          {r.category}
                        </span>
                      </div>
                      <p className="text-3xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{r.title}</p>
                      <div className="flex items-center justify-between text-3xs text-slate-400 mt-1.5">
                        <span>{r.allowedActions.length} permitted actions</span>
                        <span>{r.assignedUsersCount} users</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Action Permissions Matrix (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedRole && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-5">
                {/* Role Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedRole.role}</h3>
                      <span className={`text-3xs font-bold px-2 py-0.5 rounded ${selectedRole.badgeColor}`}>
                        {selectedRole.category}
                      </span>
                      {selectedRole.isReadOnly && (
                        <span className="text-3xs font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          Statutory Read-Only
                        </span>
                      )}
                      {selectedRole.isAdmin && (
                        <span className="text-3xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          Executive Override
                        </span>
                      )}
                    </div>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1">{selectedRole.description}</p>
                  </div>

                  {/* Save Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSavePermissions}
                      disabled={savingPermissions || (selectedRole.role === 'Auditor')}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer ${
                        selectedRole.role === 'Auditor'
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {savingPermissions ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Notification */}
                {saveSuccessMsg && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{saveSuccessMsg}</span>
                  </div>
                )}

                {selectedRole.role === 'Auditor' && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg text-2xs text-purple-900 dark:text-purple-300 flex items-center gap-2">
                    <Info className="w-4 h-4 shrink-0 text-purple-600" />
                    <span>
                      Auditor role is strictly locked to Read-Only mode by statutory mandate (Companies Act 1994 & BSEC Guidelines).
                      Write privileges are prevented to preserve audit independence.
                    </span>
                  </div>
                )}

                {/* Action Categories */}
                <div className="space-y-4">
                  {ACTION_GROUPS.map((group) => {
                    const groupGrantedCount = group.actions.filter((a) => editingPermissions.includes(a.id)).length;
                    return (
                      <div
                        key={group.category}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {group.category}
                          </h4>
                          <span className="text-3xs font-mono text-slate-400">
                            {groupGrantedCount} of {group.actions.length} enabled
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.actions.map((act) => {
                            const isGranted = editingPermissions.includes(act.id);
                            return (
                              <button
                                key={act.id}
                                type="button"
                                onClick={() => handleToggleAction(act.id)}
                                disabled={selectedRole.role === 'Auditor'}
                                className={`text-left p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 ${
                                  isGranted
                                    ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-2xs'
                                    : 'bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 ${
                                    isGranted
                                      ? 'bg-blue-600 text-white'
                                      : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                                  }`}
                                >
                                  {isGranted && <Check className="w-3 h-3" />}
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                                    {act.label}
                                  </span>
                                  <span className="text-3xs text-slate-500 dark:text-slate-400 leading-tight block">
                                    {act.desc}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. USER ACCOUNTS & ACCESS CONTROL TAB */}
      {subTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Enterprise User Accounts Directory
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400">
                Manage user role assignments, Multi-Factor Authentication (MFA), account suspension, and multi-company access.
              </p>
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Search user, email, or dept..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-3xs font-semibold">
                <tr>
                  <th className="py-2.5 px-3">User & Email</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Assigned Enterprise Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">MFA</th>
                  <th className="py-2.5 px-3">Company Scope</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const isUpdating = updatingUserId === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{u.name}</div>
                        <div className="text-3xs text-slate-400 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {u.department}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value as RoleType)}
                          disabled={isUpdating}
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-semibold text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                        >
                          {roles.map((r) => (
                            <option key={r.role} value={r.role}>
                              {r.role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-3xs font-bold inline-flex items-center gap-1 ${
                            u.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : u.status === 'Suspended'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => handleToggleUserMFA(u.id, u.mfaEnabled)}
                          disabled={isUpdating}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-3xs font-semibold transition cursor-pointer ${
                            u.mfaEnabled
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          <Fingerprint className="w-3 h-3" />
                          <span>{u.mfaEnabled ? 'Enforced' : 'Disabled'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {u.assignedCompanyIds.map((cid) => (
                            <span
                              key={cid}
                              className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-3xs font-mono"
                            >
                              {cid.replace('comp-', '')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleUpdateUserStatus(u.id, u.status)}
                          disabled={isUpdating}
                          className={`px-2.5 py-1 rounded text-2xs font-semibold transition cursor-pointer ${
                            u.status === 'Active'
                              ? 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50'
                              : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          }`}
                        >
                          {u.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. SEPARATION OF DUTIES (SOD) & CONFLICT MATRIX TAB */}
      {subTab === 'sod' && sodReport && (
        <div className="space-y-5">
          {/* Posture Banner */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Separation of Duties (SoD) & Conflict Matrix
                </h3>
              </div>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Automated continuous compliance auditing preventing toxic combinations of permissions across procurement, accounting, inventory adjustments, and workflow authorization.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunSoDScan}
                disabled={scanningSoD}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningSoD ? 'animate-spin' : ''}`} />
                <span>Run Real-Time SoD Scan</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400">Rules Evaluated</p>
              <p className="text-lg font-mono font-bold text-slate-900 dark:text-white mt-1">
                {sodReport.rulesEvaluatedCount}
              </p>
              <p className="text-3xs text-slate-500 mt-0.5">Statutory Conflict Baseline</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400">Active Violations</p>
              <p
                className={`text-lg font-mono font-bold mt-1 ${
                  sodReport.violationsCount === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {sodReport.violationsCount}
              </p>
              <p className="text-3xs text-slate-500 mt-0.5">Toxic permission pairs</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400">High Risk Conflicts</p>
              <p className="text-lg font-mono font-bold text-rose-600 mt-1">{sodReport.highSeverityCount}</p>
              <p className="text-3xs text-slate-500 mt-0.5">Audit-blocking items</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <p className="text-3xs uppercase tracking-wider font-semibold text-slate-400">Posture Score</p>
              <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {sodReport.overallScore}/100
              </p>
              <p className="text-3xs text-slate-500 mt-0.5">ISO / BSEC Standard</p>
            </div>
          </div>

          {/* Active Violations (if any) */}
          {sodReport.violations.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 p-5 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Detected Conflicts Requiring Segregation ({sodReport.violations.length})
              </h4>
              <div className="space-y-2">
                {sodReport.violations.map((v, i) => (
                  <div
                    key={i}
                    className="p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {v.type === 'ROLE_CONFIG' ? `Role: ${v.roleOrUser}` : `User: ${v.roleOrUser}`}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-3xs font-bold ${
                            v.severity === 'CRITICAL' || v.severity === 'HIGH'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                          }`}
                        >
                          {v.severity} SEVERITY
                        </span>
                      </div>
                      <p className="text-2xs text-slate-600 dark:text-slate-300 mt-0.5">{v.details}</p>
                      <p className="text-3xs text-blue-700 dark:text-blue-400 font-mono mt-1">
                        Mitigation: {v.remediation}
                      </p>
                    </div>
                    <span className="text-3xs font-mono text-slate-400 shrink-0">
                      Rule: {v.ruleCode || v.ruleId}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-900 dark:text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">Zero Separation of Duties Violations Detected</p>
                <p className="text-2xs text-emerald-800 dark:text-emerald-300">
                  All active role matrices and user accounts strictly respect procurement, accounting, and inventory controls without overlapping conflicting authorities.
                </p>
              </div>
            </div>
          )}

          {/* Conflict Rules Registry Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Statutory Conflict Rules Baseline ({sodReport.conflictRules.length})
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-3xs font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Rule Name & Code</th>
                    <th className="py-2.5 px-3">Conflicting Action A</th>
                    <th className="py-2.5 px-3">Conflicting Action B</th>
                    <th className="py-2.5 px-3">Risk Severity</th>
                    <th className="py-2.5 px-3">Regulatory Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sodReport.conflictRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">{rule.title}</span>
                        <p className="text-3xs text-slate-400 font-mono">{rule.code || rule.id}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-3xs text-blue-700 dark:text-blue-300 font-semibold">
                        {rule.primaryAction}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-3xs text-rose-700 dark:text-rose-300 font-semibold">
                        {rule.conflictingAction}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.2 rounded text-3xs font-bold ${
                            rule.riskSeverity === 'CRITICAL' || rule.riskSeverity === 'HIGH'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {rule.riskSeverity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-2xs text-slate-500 dark:text-slate-400 max-w-xs">
                        {rule.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ENTERPRISE SECURITY POLICIES & HARDENING TAB */}
      {subTab === 'policies' && policies && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Enterprise Security & Governance Policies
              </h3>
              <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5">
                Session controls, authentication defenses, financial integrity guards, and audit trail immutability.
              </p>
            </div>

            <button
              onClick={handleSavePolicies}
              disabled={savingPolicies}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              {savingPolicies ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Persist Policies</span>
            </button>
          </div>

          {policySavedMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{policySavedMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Session Management */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                Session & Authentication Controls
              </h4>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Inactivity Session Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={policies.sessionTimeoutMinutes}
                  onChange={(e) =>
                    setPolicies({ ...policies, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })
                  }
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
                <p className="text-3xs text-slate-400 mt-1">Automatic logout after period of idle client inactivity (5 - 480 mins)</p>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Max Failed Login Attempts Before Lockout
                </label>
                <input
                  type="number"
                  value={policies.maxFailedLoginAttempts}
                  onChange={(e) =>
                    setPolicies({ ...policies, maxFailedLoginAttempts: parseInt(e.target.value) || 5 })
                  }
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
                <p className="text-3xs text-slate-400 mt-1">Protects against automated password brute-forcing</p>
              </div>

              <div>
                <label className="block text-2xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  MFA Multi-Factor Authentication Policy
                </label>
                <select
                  value={policies.mfaPolicy}
                  onChange={(e) =>
                    setPolicies({ ...policies, mfaPolicy: e.target.value as any })
                  }
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold"
                >
                  <option value="OPTIONAL">Optional (User Selected)</option>
                  <option value="ENFORCED_FOR_ADMINS">Enforced for Admin & Finance Roles</option>
                  <option value="ENFORCED_FOR_ALL">Strictly Enforced for All Staff</option>
                </select>
              </div>
            </div>

            {/* Financial Integrity & Anti-Tampering */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-500" />
                Financial Integrity & Immutable Logging
              </h4>

              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Strict Negative Stock Block</p>
                  <p className="text-3xs text-slate-400">Hard stop prevented by stock ledger transaction engine</p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.strictNegativeStockBlock}
                  onChange={(e) => setPolicies({ ...policies, strictNegativeStockBlock: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Atomic Double-Entry Balancing</p>
                  <p className="text-3xs text-slate-400">Zero-tolerance math check: Total Debit must equal Total Credit</p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.doubleEntryBalancingCheck}
                  onChange={(e) => setPolicies({ ...policies, doubleEntryBalancingCheck: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">WORM Tamper-Evident Audit Trail</p>
                  <p className="text-3xs text-slate-400">SOC 2 / ISO 27001 Write-Once Immutable Transaction Logs</p>
                </div>
                <input
                  type="checkbox"
                  checked={policies.immutableAuditLogEnforced}
                  onChange={(e) => setPolicies({ ...policies, immutableAuditLogEnforced: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
