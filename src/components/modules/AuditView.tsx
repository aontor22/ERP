import React from 'react';
import { ShieldAlert, ShieldCheck, Terminal, Filter } from 'lucide-react';
import { AuditLogEntry } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { formatDate } from '../../lib/i18n.js';

interface AuditViewProps {
  logs: AuditLogEntry[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
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
        const isCreate = l.action.includes('Create') || l.action.includes('Post') || l.action.includes('Approve');
        const isDelete = l.action.includes('Delete') || l.action.includes('Reject');
        return (
          <Badge variant={isCreate ? 'success' : isDelete ? 'danger' : 'primary'}>
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
            Immutable Audit Trail & Compliance Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            WORM (Write Once Read Many) compliant tamper-evident audit ledger recording every operational and financial event.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-2xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            SOC 2 / ISO 27001 Cryptographic Integrity
          </span>
        </div>
      </div>

      {/* Logs Table */}
      <DataTable
        id="audit-trail-table"
        data={logs}
        columns={columns}
        searchPlaceholder="Search actor, action, module, or entity ID..."
        exportFilename="apex-audit-trail.csv"
      />
    </div>
  );
};
