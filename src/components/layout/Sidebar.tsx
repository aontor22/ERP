import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Package,
  Boxes,
  ShoppingCart,
  Receipt,
  BookOpen,
  Users,
  Factory,
  GitPullRequest,
  ShieldAlert,
  BarChart3,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import { Language, translations } from '../../lib/i18n.js';
import { canAccessModule, isReadOnlyRole, getRoleProfile } from '../../lib/permissions.js';
import { Lock, Shield, Eye } from 'lucide-react';

export type ActiveModule =
  | 'dashboard'
  | 'organization'
  | 'products'
  | 'inventory'
  | 'procurement'
  | 'sales'
  | 'accounting'
  | 'hrPayroll'
  | 'manufacturing'
  | 'workflows'
  | 'auditLogs'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeModule: ActiveModule;
  onSelectModule: (mod: ActiveModule) => void;
  lang: Language;
  currentUser?: any;
  pendingApprovalsCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  lang,
  currentUser,
  pendingApprovalsCount = 0,
  isOpen = false,
  onClose,
}) => {
  const t = translations[lang];
  const isAuditor = currentUser?.role === 'Auditor';
  const roleProf = getRoleProfile(currentUser);

  const sections = [
    {
      group: 'Core',
      items: [
        { id: 'dashboard' as ActiveModule, label: t.dashboard, icon: LayoutDashboard },
        { id: 'organization' as ActiveModule, label: t.organization, icon: Building2 },
      ],
    },
    {
      group: 'Operations',
      items: [
        { id: 'products' as ActiveModule, label: t.products, icon: Package },
        { id: 'inventory' as ActiveModule, label: t.inventory, icon: Boxes },
        { id: 'procurement' as ActiveModule, label: t.procurement, icon: ShoppingCart },
        { id: 'sales' as ActiveModule, label: t.sales, icon: Receipt },
      ],
    },
    {
      group: 'Finance & Human Resources',
      items: [
        { id: 'accounting' as ActiveModule, label: t.accounting, icon: BookOpen },
        { id: 'hrPayroll' as ActiveModule, label: t.hrPayroll, icon: Users },
      ],
    },
    {
      group: 'Industry & Governance',
      items: [
        { id: 'manufacturing' as ActiveModule, label: t.manufacturing, icon: Factory },
        {
          id: 'workflows' as ActiveModule,
          label: t.workflows,
          icon: GitPullRequest,
          badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
        },
        { id: 'auditLogs' as ActiveModule, label: t.auditLogs, icon: ShieldAlert },
      ],
    },
    {
      group: 'Management',
      items: [
        { id: 'reports' as ActiveModule, label: t.reports, icon: BarChart3 },
        { id: 'settings' as ActiveModule, label: t.settings, icon: Settings },
      ],
    },
  ];

  const handleSelect = (id: ActiveModule) => {
    onSelectModule(id);
    if (onClose) {
      onClose();
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm tracking-tight">
            AX
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-sm">ApexERP</span>
              <span className="text-2xs bg-blue-500/20 text-blue-300 font-semibold px-1.5 py-0.2 rounded border border-blue-400/20">
                ENT
              </span>
            </div>
            <p className="text-2xs text-slate-400 font-medium">Enterprise Suite v2.4</p>
          </div>
        </div>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
        {sections.map((section) => (
          <div key={section.group}>
            <p className="px-3 pb-1.5 text-3xs font-bold uppercase tracking-wider text-slate-500">
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;
                const isAccessible = canAccessModule(currentUser, item.id);

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : isAccessible
                        ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-800/40 hover:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isAccessible ? 'text-slate-400' : 'text-slate-600'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isAccessible && (
                        <Lock className="w-3 h-3 text-slate-600" />
                      )}
                      {item.badge !== undefined && (
                        <span
                          className={`text-2xs px-1.5 py-0.2 rounded-full font-bold ${
                            isActive
                              ? 'bg-white text-blue-700'
                              : 'bg-rose-500/90 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Role Profile Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/50 shrink-0">
        <div className="flex items-center justify-between text-2xs mb-1">
          <span className="text-slate-400 font-semibold truncate max-w-[130px]">
            {currentUser?.name || 'Active User'}
          </span>
          <span
            className={`text-3xs font-bold px-1.5 py-0.2 rounded ${
              isAuditor
                ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                : roleProf.isAdmin
                ? 'bg-blue-900/60 text-blue-300 border border-blue-700/50'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            {isAuditor ? 'Auditor' : roleProf.isAdmin ? 'Admin' : 'Operator'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-3xs text-slate-400">
          {isAuditor ? (
            <>
              <Eye className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-purple-300 truncate">Read-Only Audit Mode Active</span>
            </>
          ) : roleProf.isAdmin ? (
            <>
              <Shield className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-blue-300 truncate">Full Admin Privileges</span>
            </>
          ) : (
            <>
              <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="text-slate-300 truncate">{currentUser?.role || 'User'}</span>
            </>
          )}
        </div>
      </div>

      {/* Database & Compliance Status Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/30 text-2xs space-y-1 shrink-0">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">Cluster Synchronized</span>
          </span>
          <span className="font-mono text-slate-500">ISO 27001</span>
        </div>
        <p className="text-slate-500 text-3xs">NBR VAT-9.1 Automated Double-Entry Engine</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-800 h-full">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onClose}
          />
          <div className="relative w-72 max-w-[82vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
