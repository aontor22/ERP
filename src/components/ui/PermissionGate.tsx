import React from 'react';
import { Lock, ShieldAlert, Eye, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ActionPermission, hasPermission, isReadOnlyRole, getRoleProfile } from '../../lib/permissions.js';
import { ActiveModule } from '../layout/Sidebar.js';

interface SecureActionButtonProps {
  action: ActionPermission;
  currentUser: any;
  onClick: (e: React.MouseEvent) => void;
  children: React.ReactNode;
  id?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline';
  icon?: React.ComponentType<{ className?: string }>;
  disabledTooltip?: string;
  hideIfRestricted?: boolean;
  disabled?: boolean;
}

/**
 * Drop-in Button with granular RBAC enforcement and visual locked states
 */
export const SecureActionButton: React.FC<SecureActionButtonProps> = ({
  action,
  currentUser,
  onClick,
  children,
  id,
  className = '',
  variant = 'primary',
  icon: Icon,
  disabledTooltip,
  hideIfRestricted = false,
  disabled = false,
}) => {
  const perm = hasPermission(currentUser, action);
  const isAuditor = currentUser?.role === 'Auditor';

  if (!perm.allowed) {
    if (hideIfRestricted) {
      return null;
    }

    const titleText =
      disabledTooltip ||
      perm.reason ||
      (isAuditor
        ? 'Restricted: Auditor role is strictly Read-Only.'
        : `Restricted: Role '${currentUser?.role || 'Current'}' lacks permission for this action.`);

    return (
      <button
        id={id}
        type="button"
        disabled
        title={titleText}
        className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold cursor-not-allowed transition-all opacity-65 bg-slate-100 dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 shadow-2xs ${className}`}
      >
        <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500 shrink-0" />
        {children}
        <span className="text-3xs font-semibold px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 ml-1">
          {isAuditor ? 'Read-Only' : 'Locked'}
        </span>
      </button>
    );
  }

  // Base styling presets
  const variantStyles = {
    primary:
      'bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-2xs',
    secondary:
      'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700 shadow-2xs',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white border-transparent shadow-2xs',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-2xs',
    outline:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  };

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      {children}
    </button>
  );
};

/**
 * Auditor Read-Only Banner shown across inspection views
 */
export const AuditorReadonlyBanner: React.FC<{
  currentUser: any;
  entityName?: string;
}> = ({ currentUser, entityName = 'records' }) => {
  if (!isReadOnlyRole(currentUser)) {
    return null;
  }

  const roleProfile = getRoleProfile(currentUser);

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 shadow-2xs mb-4">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg">
          <Eye className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight">Statutory Audit Mode Active</span>
            <span className="text-3xs uppercase font-bold px-1.5 py-0.2 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
              Read-Only
            </span>
          </div>
          <p className="text-2xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Active role <span className="font-bold">{roleProfile.title}</span> has read-only inspection access to {entityName}. Creation, modification, and workflow approvals are locked.
          </p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 text-2xs text-amber-700 dark:text-amber-400 font-mono">
        <Lock className="w-3.5 h-3.5" />
        <span>NBR / ISO 27001 Audit Enforced</span>
      </div>
    </div>
  );
};

/**
 * Enterprise Access Denied Screen when a role navigates to an unauthorized module
 */
export const AccessDeniedModuleView: React.FC<{
  module: ActiveModule;
  currentUser: any;
  onNavigate: (mod: ActiveModule) => void;
  onSwitchRole?: (role: any) => void;
}> = ({ module, currentUser, onNavigate, onSwitchRole }) => {
  const profile = getRoleProfile(currentUser);

  return (
    <div className="min-h-[460px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-5">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <span className="text-3xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40">
            RBAC Access Boundary
          </span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Access to {module.toUpperCase()} Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your active role <strong className="text-slate-700 dark:text-slate-300 font-semibold">{profile.role}</strong> does not have permission to view or manage the <strong className="text-slate-700 dark:text-slate-300 font-semibold">{module}</strong> module according to the enterprise security governance matrix.
          </p>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left text-2xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Active User:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser?.name || 'Authorized User'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Department:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser?.department || profile.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Access Tier:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{profile.badgeLabel}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
          {onSwitchRole && (
            <button
              onClick={() => onSwitchRole('Super Admin')}
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
            >
              Switch to Super Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
