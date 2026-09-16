import { RoleType } from '../types/erp.js';
import { ActiveModule } from '../components/layout/Sidebar.js';

export type ActionPermission =
  | 'products:create'
  | 'inventory:adjust'
  | 'inventory:forecast_apply'
  | 'inventory:forecast_order'
  | 'procurement:create'
  | 'procurement:approve'
  | 'sales:create_invoice'
  | 'accounting:create_journal'
  | 'accounting:manage_budget'
  | 'hr:generate_payroll'
  | 'manufacturing:create_order'
  | 'manufacturing:update_order'
  | 'workflows:approve'
  | 'workflows:reject'
  | 'settings:manage'
  | 'organization:manage'
  | 'audit:view'
  | 'reports:export';

export interface RolePermissionProfile {
  role: RoleType;
  title: string;
  category: 'Executive' | 'Operations' | 'Finance' | 'Human Resources' | 'Governance & Audit';
  isReadOnly: boolean;
  isAdmin: boolean;
  badgeLabel: string;
  badgeColor: string;
  description: string;
  allowedModules: ActiveModule[];
  allowedActions: ActionPermission[];
}

const ALL_MODULES: ActiveModule[] = [
  'dashboard',
  'organization',
  'products',
  'inventory',
  'procurement',
  'sales',
  'accounting',
  'hrPayroll',
  'manufacturing',
  'workflows',
  'auditLogs',
  'reports',
  'settings',
];

const ALL_ACTIONS: ActionPermission[] = [
  'products:create',
  'inventory:adjust',
  'inventory:forecast_apply',
  'inventory:forecast_order',
  'procurement:create',
  'procurement:approve',
  'sales:create_invoice',
  'accounting:create_journal',
  'accounting:manage_budget',
  'hr:generate_payroll',
  'manufacturing:create_order',
  'manufacturing:update_order',
  'workflows:approve',
  'workflows:reject',
  'settings:manage',
  'organization:manage',
  'audit:view',
  'reports:export',
];

export const ROLE_PROFILES: Record<RoleType, RolePermissionProfile> = {
  'Super Admin': {
    role: 'Super Admin',
    title: 'Super Administrator',
    category: 'Executive',
    isReadOnly: false,
    isAdmin: true,
    badgeLabel: 'Super Admin (Unrestricted)',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    description: 'Unrestricted enterprise administrative authority across all entities, branches, modules, security controls, and settings.',
    allowedModules: ALL_MODULES,
    allowedActions: ALL_ACTIONS,
  },
  'System Admin': {
    role: 'System Admin',
    title: 'System Administrator',
    category: 'Executive',
    isReadOnly: false,
    isAdmin: true,
    badgeLabel: 'System Admin',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
    description: 'Infrastructure management, user provisioning, security audits, and configuration.',
    allowedModules: ALL_MODULES,
    allowedActions: ALL_ACTIONS,
  },
  'CEO': {
    role: 'CEO',
    title: 'Chief Executive Officer',
    category: 'Executive',
    isReadOnly: false,
    isAdmin: true,
    badgeLabel: 'Executive Admin (CEO)',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300 dark:border-purple-700',
    description: 'Universal governance override, strategic decision sign-off, capital expenditure authorizations, and group oversight.',
    allowedModules: ALL_MODULES,
    allowedActions: ALL_ACTIONS,
  },
  'CFO': {
    role: 'CFO',
    title: 'Chief Financial Officer',
    category: 'Finance',
    isReadOnly: false,
    isAdmin: true,
    badgeLabel: 'Finance Admin (CFO)',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    description: 'Ultimate fiscal authority, double-entry journal sign-off, budget threshold adjustments, multi-currency treasury, and approvals.',
    allowedModules: ALL_MODULES,
    allowedActions: [
      'accounting:create_journal',
      'accounting:manage_budget',
      'procurement:create',
      'procurement:approve',
      'sales:create_invoice',
      'workflows:approve',
      'workflows:reject',
      'inventory:forecast_apply',
      'inventory:forecast_order',
      'audit:view',
      'reports:export',
    ],
  },
  'Finance Manager': {
    role: 'Finance Manager',
    title: 'Finance & Accounts Manager',
    category: 'Finance',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Finance Manager',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
    description: 'General ledger oversight, journal voucher authorization, financial statements, and expenditure reviews.',
    allowedModules: ['dashboard', 'organization', 'accounting', 'sales', 'procurement', 'workflows', 'reports', 'auditLogs'],
    allowedActions: [
      'accounting:create_journal',
      'accounting:manage_budget',
      'procurement:approve',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
  },
  'Accountant': {
    role: 'Accountant',
    title: 'General Ledger Accountant',
    category: 'Finance',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Accountant',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-700',
    description: 'Day-to-day general ledger vouchers, AR/AP invoice postings, trial balance generation, and VAT calculations.',
    allowedModules: ['dashboard', 'organization', 'accounting', 'sales', 'procurement', 'reports', 'auditLogs'],
    allowedActions: [
      'accounting:create_journal',
      'sales:create_invoice',
      'audit:view',
      'reports:export',
    ],
  },
  'Auditor': {
    role: 'Auditor',
    title: 'Internal / External Statutory Auditor',
    category: 'Governance & Audit',
    isReadOnly: true,
    isAdmin: false,
    badgeLabel: 'Auditor (Read-Only Mode)',
    badgeColor: 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    description: 'Statutory read-only access for compliance, general ledger auditing, inventory verification, and internal controls inspection. All record mutations, adjustments, and approval actions are strictly blocked.',
    allowedModules: ALL_MODULES,
    // Purely read-only: NO mutations allowed
    allowedActions: [
      'audit:view',
      'reports:export',
    ],
  },
  'Warehouse Manager': {
    role: 'Warehouse Manager',
    title: 'Warehouse & Logistics Manager',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Operations Admin (Warehouse)',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    description: 'Full inventory control: cycle count adjustments, safety stock calculations, ROP applications, goods receipts, and bin allocations.',
    allowedModules: ['dashboard', 'organization', 'products', 'inventory', 'procurement', 'manufacturing', 'workflows', 'reports', 'auditLogs'],
    allowedActions: [
      'products:create',
      'inventory:adjust',
      'inventory:forecast_apply',
      'inventory:forecast_order',
      'audit:view',
      'reports:export',
    ],
  },
  'Inventory Officer': {
    role: 'Inventory Officer',
    title: 'Inventory Operations Officer',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Inventory Officer',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
    description: 'Physical stock counts, delivery receipts, warehouse transfers, and bin management.',
    allowedModules: ['dashboard', 'products', 'inventory', 'reports'],
    allowedActions: [
      'inventory:adjust',
      'inventory:forecast_apply',
    ],
  },
  'Procurement Manager': {
    role: 'Procurement Manager',
    title: 'Head of Procurement & Sourcing',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Procurement Admin',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
    description: 'Direct procurement management: purchase order issuance, vendor catalog master, replenishment orders, and PO workflow approvals.',
    allowedModules: ['dashboard', 'organization', 'products', 'inventory', 'procurement', 'accounting', 'workflows', 'reports', 'auditLogs'],
    allowedActions: [
      'procurement:create',
      'procurement:approve',
      'inventory:forecast_order',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
  },
  'Purchase Officer': {
    role: 'Purchase Officer',
    title: 'Procurement & Purchasing Officer',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Purchase Officer',
    badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700',
    description: 'Vendor RFQs, purchase order drafting, order tracking, and receipt matching.',
    allowedModules: ['dashboard', 'products', 'inventory', 'procurement', 'reports'],
    allowedActions: [
      'procurement:create',
      'inventory:forecast_order',
    ],
  },
  'Sales Manager': {
    role: 'Sales Manager',
    title: 'Commercial & Export Sales Manager',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Commercial Admin (Sales)',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-300 dark:border-violet-700',
    description: 'Commercial sales management: sales order drafting, international export invoicing, customer accounts, and credit limits.',
    allowedModules: ['dashboard', 'organization', 'products', 'inventory', 'sales', 'accounting', 'workflows', 'reports', 'auditLogs'],
    allowedActions: [
      'sales:create_invoice',
      'products:create',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
  },
  'Sales Executive': {
    role: 'Sales Executive',
    title: 'Sales & Customer Accounts Executive',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Sales Executive',
    badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-300 dark:border-violet-700',
    description: 'Customer inquiries, quotations, standard invoicing, and shipment follow-ups.',
    allowedModules: ['dashboard', 'products', 'inventory', 'sales', 'reports'],
    allowedActions: [
      'sales:create_invoice',
    ],
  },
  'Production Manager': {
    role: 'Production Manager',
    title: 'Manufacturing & Plant Operations Manager',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Manufacturing Admin',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    description: 'Plant operations: launch manufacturing orders, MRP material scheduling, shop-floor BOM routing, and job progress updates.',
    allowedModules: ['dashboard', 'organization', 'products', 'inventory', 'manufacturing', 'workflows', 'reports', 'auditLogs'],
    allowedActions: [
      'manufacturing:create_order',
      'manufacturing:update_order',
      'products:create',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
  },
  'Quality Manager': {
    role: 'Quality Manager',
    title: 'Quality Assurance & Control Manager',
    category: 'Operations',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'Quality Manager',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700',
    description: 'Inspection standards, batch acceptance testing, and ISO 9001 compliance logs.',
    allowedModules: ['dashboard', 'products', 'inventory', 'manufacturing', 'reports', 'auditLogs'],
    allowedActions: [
      'audit:view',
    ],
  },
  'HR Manager': {
    role: 'HR Manager',
    title: 'Human Resources & Payroll Manager',
    category: 'Human Resources',
    isReadOnly: false,
    isAdmin: false,
    badgeLabel: 'HR & Payroll Admin',
    badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-700',
    description: 'Staff directory, compensation tiers, statutory tax deductions, and monthly automated payroll batches.',
    allowedModules: ['dashboard', 'organization', 'hrPayroll', 'workflows', 'reports', 'auditLogs'],
    allowedActions: [
      'hr:generate_payroll',
      'workflows:approve',
      'workflows:reject',
      'audit:view',
      'reports:export',
    ],
  },
  'Employee': {
    role: 'Employee',
    title: 'Standard Employee Self-Service',
    category: 'Human Resources',
    isReadOnly: true,
    isAdmin: false,
    badgeLabel: 'Employee Self-Service',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    description: 'Self-service view for pay slips, company announcements, and organizational hierarchy.',
    allowedModules: ['dashboard', 'organization', 'reports'],
    allowedActions: [],
  },
  'Viewer': {
    role: 'Viewer',
    title: 'Read-Only Stakeholder',
    category: 'Governance & Audit',
    isReadOnly: true,
    isAdmin: false,
    badgeLabel: 'Read-Only Viewer',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    description: 'View-only access for external non-auditing stakeholders. No data modification rights.',
    allowedModules: ['dashboard', 'organization', 'reports'],
    allowedActions: [],
  },
};

/**
 * Get role permission profile
 */
export function getRoleProfile(roleOrUser: RoleType | { role?: RoleType } | undefined | null): RolePermissionProfile {
  const role: RoleType =
    typeof roleOrUser === 'string'
      ? (roleOrUser as RoleType)
      : (roleOrUser?.role as RoleType) || 'CFO';

  return ROLE_PROFILES[role] || ROLE_PROFILES['CFO'];
}

/**
 * Check if the active role is in Read-Only mode (e.g. Auditor)
 */
export function isReadOnlyRole(roleOrUser: RoleType | { role?: RoleType } | undefined | null): boolean {
  const profile = getRoleProfile(roleOrUser);
  return profile.isReadOnly;
}

/**
 * Check if user has permission to perform a specific action
 */
export function hasPermission(
  roleOrUser: RoleType | { role?: RoleType } | undefined | null,
  action: ActionPermission
): { allowed: boolean; reason?: string } {
  const profile = getRoleProfile(roleOrUser);

  // Universal Admins
  if (profile.role === 'Super Admin' || profile.role === 'CEO') {
    return { allowed: true };
  }

  // Auditor is strictly read-only for any action other than audit viewing / export
  if (profile.role === 'Auditor') {
    if (action === 'audit:view' || action === 'reports:export') {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Auditor Read-Only Mode: All mutation actions, adjustments, and approvals are strictly prohibited for statutory audit compliance.',
    };
  }

  // Check action whitelist
  if (profile.allowedActions.includes(action)) {
    return { allowed: true };
  }

  // Provide clear role-based explanation
  const actionLabels: Record<ActionPermission, string> = {
    'products:create': 'Create Product Master (requires Warehouse Manager, Production Manager, or Admin)',
    'inventory:adjust': 'Adjust Physical Stock (requires Warehouse Manager or Operations Admin)',
    'inventory:forecast_apply': 'Apply AI ROP Thresholds (requires Warehouse Manager or Operations Admin)',
    'inventory:forecast_order': 'Generate Replenishment Purchase Orders (requires Procurement or Warehouse Manager)',
    'procurement:create': 'Create Purchase Orders (requires Procurement Manager or Purchasing Officer)',
    'procurement:approve': 'Approve Purchase Orders (requires Procurement Manager, CFO, or Executive)',
    'sales:create_invoice': 'Create Sales Invoices (requires Sales Manager or Accountant)',
    'accounting:create_journal': 'Post General Ledger Journal Vouchers (requires Accountant, Finance Manager, or CFO)',
    'accounting:manage_budget': 'Configure Financial Expense Budgets (requires Finance Manager or CFO)',
    'hr:generate_payroll': 'Run Monthly Enterprise Payroll (requires HR Manager or Executive)',
    'manufacturing:create_order': 'Launch Manufacturing Orders (requires Production Manager or Plant Operations)',
    'manufacturing:update_order': 'Update Shop-Floor Progress (requires Production Manager)',
    'workflows:approve': 'Authorize Workflow Requests (requires Manager / Executive authority)',
    'workflows:reject': 'Reject Workflow Requests (requires Manager / Executive authority)',
    'settings:manage': 'Modify System Configurations (requires Super Admin or CEO)',
    'organization:manage': 'Manage Company & Branch Entities (requires Super Admin)',
    'audit:view': 'Inspect Audit Logs',
    'reports:export': 'Export Financial & Operational Reports',
  };

  return {
    allowed: false,
    reason: `Access Restricted: Active role '${profile.role}' does not possess '${actionLabels[action] || action}' permission.`,
  };
}

/**
 * Check if user can access a specific application module
 */
export function canAccessModule(
  roleOrUser: RoleType | { role?: RoleType } | undefined | null,
  module: ActiveModule
): boolean {
  const profile = getRoleProfile(roleOrUser);
  if (profile.role === 'Super Admin' || profile.role === 'CEO') {
    return true;
  }
  return profile.allowedModules.includes(module);
}
