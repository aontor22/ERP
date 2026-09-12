import React, { useState } from 'react';
import { Building2, MapPin, Warehouse, Calendar, Hash, CheckCircle } from 'lucide-react';
import { Company } from '../../types/erp.js';
import { Badge } from '../ui/Badge.js';

interface OrganizationViewProps {
  companies: Company[];
  warehouses: any[];
  currentCompany: Company;
  onSwitchCompany: (id: string) => void;
}

export const OrganizationView: React.FC<OrganizationViewProps> = ({
  companies,
  warehouses,
  currentCompany,
  onSwitchCompany,
}) => {
  const [activeTab, setActiveTab] = useState<'entities' | 'warehouses' | 'sequences'>('entities');

  const numberingSequences = [
    { module: 'Sales Invoices', prefix: 'INV', format: 'INV-2026-XXXX', nextNumber: 'INV-2026-0003', resetPeriod: 'Annual (Fiscal Year)' },
    { module: 'Purchase Orders', prefix: 'PO', format: 'PO-2026-XXXX', nextNumber: 'PO-2026-0003', resetPeriod: 'Annual (Fiscal Year)' },
    { module: 'Sales Orders', prefix: 'SO', format: 'SO-2026-XXXX', nextNumber: 'SO-2026-0003', resetPeriod: 'Annual (Fiscal Year)' },
    { module: 'Journal Vouchers', prefix: 'JV', format: 'JV-2026-XXXX', nextNumber: 'JV-2026-0003', resetPeriod: 'Annual (Fiscal Year)' },
    { module: 'Manufacturing Orders', prefix: 'MO', format: 'MO-2026-XXXX', nextNumber: 'MO-2026-0003', resetPeriod: 'Annual (Fiscal Year)' },
    { module: 'Stock Adjustments', prefix: 'ADJ', format: 'ADJ-2026-XXXX', nextNumber: 'ADJ-2026-0004', resetPeriod: 'Annual (Fiscal Year)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Organization & Multi-Company Structure
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise legal entities, branch operating sites, storage depots, and fiscal calendar.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center overflow-x-auto max-w-full p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold shrink-0 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('entities')}
            className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
              activeTab === 'entities' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Legal Entities ({companies.length})
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
              activeTab === 'warehouses' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Warehouses ({warehouses.length})
          </button>
          <button
            onClick={() => setActiveTab('sequences')}
            className={`px-3 py-1.5 rounded-md transition-all shrink-0 ${
              activeTab === 'sequences' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Document Sequences
          </button>
        </div>
      </div>

      {activeTab === 'entities' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {companies.map((c) => {
            const isCurrent = c.id === currentCompany?.id;
            return (
              <div
                key={c.id}
                className={`bg-white rounded-xl border p-5 transition-all shadow-2xs flex flex-col justify-between ${
                  isCurrent ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">{c.name}</h3>
                        <p className="text-2xs font-mono text-slate-400">{c.code}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <Badge variant="primary">Active Context</Badge>
                    )}
                  </div>

                  <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tax Identification:</span>
                      <span className="font-mono font-medium text-slate-800">{c.taxId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Functional Currency:</span>
                      <span className="font-semibold text-slate-800">{c.currency} ({c.currencySymbol})</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Fiscal Period:</span>
                      <span className="font-medium text-slate-800">July 01 - June 30</span>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Branches & Sites</span>
                      <div className="mt-1.5 space-y-1">
                        {c.branches.map((b) => (
                          <div key={b.id} className="flex items-center gap-1.5 text-2xs text-slate-700">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{b.name} ({b.code})</span>
                            {b.isHeadOffice && <span className="text-3xs text-blue-600 font-bold bg-blue-50 px-1 rounded">HQ</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSwitchCompany(c.id)}
                    disabled={isCurrent}
                    className={`w-full py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                    }`}
                  >
                    {isCurrent ? 'Current Active Entity' : 'Switch Context to Entity'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {warehouses.map((w) => (
            <div key={w.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Warehouse className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{w.name}</h3>
                  <p className="text-2xs font-mono text-slate-400">{w.code}</p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bay / Storage Location:</span>
                  <span className="font-medium text-slate-800">{w.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Storage Area:</span>
                  <span className="font-semibold text-slate-800">{w.totalCapacitySqFt.toLocaleString()} sq. ft.</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status:</span>
                  <Badge variant="success">Operational (Bonded)</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sequences' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900">Deterministic Document Numbering Sequences</h3>
            <p className="text-2xs text-slate-500 mt-0.5">Automated auto-increment sequences with fiscal year tokens.</p>
          </div>
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Transaction Module</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Template Mask</th>
                <th className="py-3 px-4">Next Allocated Number</th>
                <th className="py-3 px-4">Reset Interval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {numberingSequences.map((seq, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{seq.module}</td>
                  <td className="py-3 px-4 font-mono text-slate-700">{seq.prefix}</td>
                  <td className="py-3 px-4 font-mono text-slate-500">{seq.format}</td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-700">{seq.nextNumber}</td>
                  <td className="py-3 px-4 text-slate-500">{seq.resetPeriod}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
