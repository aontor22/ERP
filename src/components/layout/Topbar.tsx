import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Building2,
  ShieldCheck,
  Globe,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Info,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { RoleType, SystemNotification } from '../../types/erp.js';
import { Language, translations } from '../../lib/i18n.js';
import { getRoleProfile, isReadOnlyRole } from '../../lib/permissions.js';

interface TopbarProps {
  currentCompany: any;
  companies: any[];
  onSwitchCompany: (id: string) => void;
  currentUser: any;
  onSwitchRole: (role: RoleType) => void;
  lang: Language;
  onToggleLang: () => void;
  onOpenSearch: () => void;
  notifications: SystemNotification[];
  onMarkNotificationRead: (id?: string) => void;
  onToggleMobileMenu?: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentCompany,
  companies,
  onSwitchCompany,
  currentUser,
  onSwitchRole,
  lang,
  onToggleLang,
  onOpenSearch,
  notifications,
  onMarkNotificationRead,
  onToggleMobileMenu,
  theme = 'light',
  onToggleTheme,
}) => {
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');

  const t = translations[lang];
  const unreadCount = notifications.filter((n) => !n.read).length;

  const roles: RoleType[] = [
    'Super Admin',
    'System Admin',
    'CEO',
    'CFO',
    'Finance Manager',
    'Accountant',
    'Procurement Manager',
    'Purchase Officer',
    'Warehouse Manager',
    'Inventory Officer',
    'Production Manager',
    'Quality Manager',
    'Sales Manager',
    'Sales Executive',
    'HR Manager',
    'Auditor',
    'Employee',
    'Viewer',
  ];

  const filteredRoles = roles.filter((r) => {
    if (!roleSearch.trim()) return true;
    const q = roleSearch.toLowerCase();
    const prof = getRoleProfile(r);
    return (
      r.toLowerCase().includes(q) ||
      prof.category.toLowerCase().includes(q) ||
      prof.title.toLowerCase().includes(q) ||
      prof.badgeLabel.toLowerCase().includes(q)
    );
  });

  // Close menus when clicking outside
  useEffect(() => {
    const closeAll = () => {
      setShowCompanyMenu(false);
      setShowRoleMenu(false);
      setShowNotifMenu(false);
    };
    window.addEventListener('click', closeAll);
    return () => window.removeEventListener('click', closeAll);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between shadow-2xs shrink-0 transition-colors duration-150">
      {/* Left: Mobile hamburger & Multi-Company context dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            id="mobile-nav-toggle-btn"
            onClick={onToggleMobileMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            id="company-switcher-btn"
            onClick={() => {
              setShowCompanyMenu(!showCompanyMenu);
              setShowRoleMenu(false);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 sm:gap-2.5 px-2 sm:px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-750 transition-colors text-left"
          >
            <div className="p-1 sm:p-1.5 bg-blue-600 text-white rounded-md shadow-xs">
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <p className="text-3xs sm:text-2xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                {t.activeEntity}
              </p>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[100px] xs:max-w-[140px] sm:max-w-[180px]">
                  {currentCompany?.name || 'Select Entity'}
                </span>
                <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
              </div>
            </div>
          </button>

          {showCompanyMenu && (
            <div className="absolute left-0 mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <p className="px-3 py-1.5 text-2xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Company Entity
              </p>
              {companies.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onSwitchCompany(c.id);
                    setShowCompanyMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                    c.id === currentCompany?.id
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-semibold">{c.name}</p>
                    <p className="text-2xs text-slate-400 dark:text-slate-500 font-normal">{c.taxId}</p>
                  </div>
                  {c.id === currentCompany?.id && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Middle: Global Search Input for Desktop */}
      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-3.5 py-1.5 text-xs text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>{t.searchPlaceholder}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-2xs font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right Controls: Role Switcher, Language, Theme, Notifications, User */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          aria-label="Search ERP records"
          className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Search (Ctrl+K)"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Quick Theme Toggle Button */}
        {onToggleTheme && (
          <button
            id="theme-toggle-btn"
            onClick={onToggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 transition-colors shadow-2xs"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme (Night-Time Operation)'}
            aria-label="Toggle dark mode theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            )}
          </button>
        )}

        {/* Role Switcher (Simulate RBAC) */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            id="role-switcher-btn"
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowCompanyMenu(false);
              setShowNotifMenu(false);
            }}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border transition-colors text-xs font-medium ${
              currentUser?.role === 'Auditor'
                ? 'border-purple-300 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-300 hover:bg-purple-100/70'
                : 'border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-950/70 text-amber-900 dark:text-amber-300'
            }`}
            title="Switch user role to test granular permissions and read-only states"
          >
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline text-2xs uppercase font-semibold opacity-75">
              Role:
            </span>
            <span className="font-semibold text-xs max-w-[85px] sm:max-w-none truncate">{currentUser?.role || 'CFO'}</span>
            {currentUser?.role === 'Auditor' && (
              <span className="hidden md:inline-flex items-center text-3xs font-bold uppercase px-1.5 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                Read-Only
              </span>
            )}
            <ChevronDown className="w-3 h-3 shrink-0 opacity-75" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-1.5 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Enterprise Role ({filteredRoles.length}/18)
                </span>
                <span className="text-3xs text-blue-600 dark:text-blue-400 font-mono font-semibold">RBAC Matrix</span>
              </div>

              {/* Role Quick Filter */}
              <div className="mb-2 px-1">
                <input
                  type="text"
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  placeholder="Filter role or category..."
                  className="w-full px-2.5 py-1 text-2xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-0.5 pr-0.5">
                {filteredRoles.map((r) => {
                  const prof = getRoleProfile(r);
                  const isSelected = r === currentUser?.role;
                  return (
                    <button
                      key={r}
                      onClick={() => {
                        onSwitchRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate font-semibold">{r}</span>
                          {prof.isReadOnly && (
                            <span className="text-3xs font-bold px-1 py-0.2 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300">
                              Read-Only
                            </span>
                          )}
                          {prof.isAdmin && (
                            <span className="text-3xs font-bold px-1 py-0.2 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-3xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {prof.category} &bull; {prof.badgeLabel}
                        </p>
                      </div>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <button
          onClick={onToggleLang}
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
          title="Toggle Language (English / বাংলা)"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="font-semibold uppercase text-xs">{lang === 'en' ? 'বাংলা' : 'EN'}</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            id="notifications-btn"
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowCompanyMenu(false);
              setShowRoleMenu(false);
            }}
            className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-2xs flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-1.5 w-[calc(100vw-2rem)] sm:w-96 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight uppercase">
                  Notifications ({unreadCount})
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={() => onMarkNotificationRead()}
                    className="text-2xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex gap-3 ${
                        !n.read ? 'bg-blue-50/40 dark:bg-blue-950/40' : ''
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        ) : n.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{n.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 text-2xs mt-0.5 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">No alerts right now</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-7 h-7 rounded-full bg-slate-800 dark:bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">
            {currentUser?.name?.slice(0, 2)?.toUpperCase() || 'AH'}
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]">
              {currentUser?.name}
            </p>
            <p className="text-2xs text-slate-400 dark:text-slate-500 font-medium truncate">{currentUser?.department}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
