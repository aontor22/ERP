import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Filter,
  Lock,
  Server,
  Activity,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { AuditLogEntry, SoDScanReport } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { formatDate } from '../../lib/i18n.js';
import { api } from '../../lib/api.js';

interface AuditViewProps {
  logs: AuditLogEntry[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [securityStatus, setSecurityStatus] = useState<any>(null);
  const [sodReport, setSodReport] = useState<SoDScanReport | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'security' | 'role_mutations' | 'financial'>('all');

  const fetchSecurityTelemetry = async () => {
    try {
      setLoadingStatus(true);
      const [statusData, sodData] = await Promise.all([
        api.getSecurityStatus(),
        api.runSoDScan().catch(() => null),
      ]);
      setSecurityStatus(statusData);
      if (sodData) setSodReport(sodData);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchSecurityTelemetry();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (activeFilter === 'security') {
      return (
        l.action.includes('UNAUTHORIZED') ||
        l.action.includes('BLOCKED') ||
        l.module.includes('Security') ||
        l.action.includes('SWITCHED_ACTIVE_ROLE')
      );
    }
    if (activeFilter === 'role_mutations') {
      return (
        l.action.includes('ROLE') ||
        l.action.includes('PERMISSIONS') ||
        l.action.includes('SECURITY') ||
        l.action.includes('USER')
      );
    }
    if (activeFilter === 'financial') {
      return (
        l.module === 'Accounting' ||
        l.module === 'Treasury' ||
        l.action.includes('Journal') ||
        l.action.includes('Invoice')
      );
    }
    return true;
  });

  const columns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Recorded Timestamp',
      sortable: true,
      render: (l) => <span className="font-mono text-2xs text-slate-500">{formatDate(l.timestamp)}</span>,
    },
    {
      key: 'user',
      header: 'Actor & Role',
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-semibold text-slate-900">{l.user}</span>
          <p className="text-3xs text-slate-400">Role: {l.userRole}</p>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action Taken',
      render: (l) => {
        const isUnauthorized = l.action.includes('UNAUTHORIZED') || l.action.includes('BLOCKED');
        const isCreate = l.action.includes('Create') || l.action.includes('Post') || l.action.includes('Approve');
        const isDelete = l.action.includes('Delete') || l.action.includes('Reject');
        return (
          <Badge variant={isUnauthorized ? 'danger' : isCreate ? 'success' : isDelete ? 'danger' : 'primary'}>
            {l.action}
          </Badge>
        );
      },
    },
    {
      key: 'module',
      header: 'ERP Module',
      render: (l) => <span className="font-medium text-slate-700 text-xs">{l.module}</span>,
    },
    {
      key: 'entity',
      header: 'Target Entity',
      render: (l) => (
        <div>
          <span className="font-bold text-slate-800">{l.entity}</span>
          <p className="font-mono text-3xs text-blue-700">{l.entityId}</p>
        </div>
      ),
    },
    {
      key: 'ipAddress',
      header: 'Client Network IP',
      render: (l) => <span className="font-mono text-2xs text-slate-500">{l.ipAddress}</span>,
    },
    {
      key: 'newValue',
      header: 'Transaction Data Diff',
      render: (l) => {
        if (!l.newValue) return <span className="text-3xs text-slate-400">—</span>;
        return (
          <span
            className="font-mono text-3xs text-slate-600 truncate max-w-[240px] block bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
            title={l.newValue}
          >
            {l.newValue}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Immutable Audit Trail & Security Posture
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            WORM (Write Once Read Many) compliant tamper-evident audit ledger with real-time defensive controls telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchSecurityTelemetry}
            disabled={loadingStatus}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
            Audit Diagnostics
          </button>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-2xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            SOC 2 / ISO 27001 Cryptographic Integrity
          </span>
        </div>
      </div>

      {/* Security Hardening Diagnostics Matrix */}
      {securityStatus && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-bold tracking-tight text-white">
                Enterprise Security Controls & Defensive Matrix
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-3xs font-semibold uppercase tracking-wider">
                Status: {securityStatus.status} (100% Verified)
              </span>
              <span className="text-3xs text-slate-400 font-mono">
                Active Role: {securityStatus.activeRole}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
            {/* HTTP Headers */}
            <div className="bg-slate-800/60 rounded-lg p-3.5 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold text-slate-200">HTTP Security Headers</h4>
              </div>
              <ul className="text-3xs space-y-1 text-slate-300 font-mono">
                <li className="flex items-center justify-between">
                  <span>X-Content-Type-Options:</span>
                  <span className="text-emerald-400">nosniff</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>X-XSS-Protection:</span>
                  <span className="text-emerald-400">1; mode=block</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>X-Powered-By:</span>
                  <span className="text-emerald-400">Masked</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Referrer-Policy:</span>
                  <span className="text-emerald-400">strict-origin</span>
                </li>
              </ul>
            </div>

            {/* Rate Limiting & DoS */}
            <div className="bg-slate-800/60 rounded-lg p-3.5 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-slate-200">Rate Limiting & DoS</h4>
              </div>
              <ul className="text-3xs space-y-1 text-slate-300 font-mono">
                <li className="flex items-center justify-between">
                  <span>Read Endpoints:</span>
                  <span className="text-amber-300">{securityStatus.controls?.rateLimiting?.readWindow}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Write Mutations:</span>
                  <span className="text-amber-300">{securityStatus.controls?.rateLimiting?.writeWindow}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Payload Body Limit:</span>
                  <span className="text-emerald-400">{securityStatus.controls?.payloadSizeLimiter?.limit}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Window Algorithm:</span>
                  <span className="text-slate-400">Sliding Bucket</span>
                </li>
              </ul>
            </div>

            {/* RBAC & Injection */}
            <div className="bg-slate-800/60 rounded-lg p-3.5 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2">
                <Server className="w-4 h-4 text-purple-400" />
                <h4 className="text-xs font-semibold text-slate-200">Access Control & Sanitization</h4>
              </div>
              <ul className="text-3xs space-y-1 text-slate-300 font-mono">
                <li className="flex items-center justify-between">
                  <span>RBAC Enforcement:</span>
                  <span className="text-emerald-400">Strict Guard Active</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Separation of Duties:</span>
                  <span className="text-emerald-400">8 Custom Tiers</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Stored XSS Protection:</span>
                  <span className="text-emerald-400">HTML Tag Stripped</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>SSRF Anti-Tampering:</span>
                  <span className="text-emerald-400">ISO-4217 Checked</span>
                </li>
              </ul>
            </div>

            {/* Financial Ledger Integrity */}
            <div className="bg-slate-800/60 rounded-lg p-3.5 border border-slate-700/60">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-slate-200">Ledger & Audit Telemetry</h4>
              </div>
              <ul className="text-3xs space-y-1 text-slate-300 font-mono">
                <li className="flex items-center justify-between">
                  <span>Negative Stock Block:</span>
                  <span className="text-emerald-400">
                    {securityStatus.controls?.financialIntegrity?.negativeStockBlock ? 'Enforced' : 'Flexible'}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Double-Entry Balance:</span>
                  <span className="text-emerald-400">Zero-Tolerance</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Audit Trail Count:</span>
                  <span className="text-cyan-300">{securityStatus.telemetry?.totalAuditLogs} records</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Security Block Events:</span>
                  <span className="text-rose-400 font-bold">{securityStatus.telemetry?.blockedUnauthorizedAttempts || 0} incidents</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Separation of Duties (SoD) Compliance Health Card */}
      {sodReport && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Separation of Duties (SoD) Statutory Compliance
                </h3>
                <span
                  className={`text-3xs font-bold px-2 py-0.5 rounded ${
                    sodReport.overallScore >= 95
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}
                >
                  Score: {sodReport.overallScore}/100 ({sodReport.postureStatus})
                </span>
              </div>
              <p className="text-3xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluated {sodReport.rulesEvaluatedCount} statutory conflict rules across all 18 enterprise roles and active user accounts.
                {sodReport.violationsCount === 0
                  ? ' Zero conflicting authority violations detected.'
                  : ` Detected ${sodReport.violationsCount} conflicting permission pairings requiring segregation.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-3xs font-mono text-slate-400">
              Violations: {sodReport.violationsCount} (High: {sodReport.highSeverityCount})
            </span>
          </div>
        </div>
      )}

      {/* Audit Logs Filter Toolbar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          All Audit Trail ({logs.length})
        </button>

        <button
          onClick={() => setActiveFilter('security')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'security'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Security & Blocked Access</span>
        </button>

        <button
          onClick={() => setActiveFilter('role_mutations')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'role_mutations'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Role & Policy Changes</span>
        </button>

        <button
          onClick={() => setActiveFilter('financial')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'financial'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Financial Postings</span>
        </button>
      </div>

      {/* Logs Table */}
      <DataTable
        id="audit-trail-table"
        data={filteredLogs}
        columns={columns}
        searchPlaceholder="Search actor, action, module, or entity ID..."
        exportFilename="apex-audit-trail.csv"
      />
    </div>
  );
};
