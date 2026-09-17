import React, { useState } from 'react';
import { GitPullRequest, CheckCircle2, XCircle, Clock, ShieldCheck, MessageSquare, Lock } from 'lucide-react';
import { ApprovalRequest } from '../../types/erp.js';
import { DataTable, Column } from '../ui/DataTable.js';
import { Badge } from '../ui/Badge.js';
import { Modal } from '../ui/Modal.js';
import { formatCurrency, formatDate } from '../../lib/i18n.js';
import { AuditorReadonlyBanner } from '../ui/PermissionGate.js';
import { hasPermission, isReadOnlyRole } from '../../lib/permissions.js';

interface WorkflowsViewProps {
  requests: ApprovalRequest[];
  currentUser: any;
  onReview: (data: { requestId: string; action: 'Approved' | 'Rejected'; remarks: string }) => Promise<void>;
}

export const WorkflowsView: React.FC<WorkflowsViewProps> = ({
  requests,
  currentUser,
  onReview,
}) => {
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState<'Approved' | 'Rejected'>('Approved');
  const [loading, setLoading] = useState(false);

  const columns: Column<ApprovalRequest>[] = [
    {
      key: 'entityType',
      header: 'Workflow Entity',
      sortable: true,
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900">{r.entityType}</span>
          <p className="font-mono text-2xs text-blue-700 font-semibold">{r.entityReference}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Monetary Exposure',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span className="font-mono font-bold text-slate-900">
          {r.amount ? formatCurrency(r.amount) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'requestedBy',
      header: 'Originator & Date',
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800">{r.requestedBy}</span>
          <p className="text-3xs text-slate-400">{formatDate(r.requestDate)}</p>
        </div>
      ),
    },
    {
      key: 'currentApproverRole',
      header: 'Required Authority Role',
      render: (r) => <Badge variant="primary">{r.currentApproverRole}</Badge>,
    },
    {
      key: 'status',
      header: 'Workflow State',
      render: (r) => (
        <Badge
          variant={
            r.status === 'Approved'
              ? 'success'
              : r.status === 'Rejected'
              ? 'danger'
              : 'warning'
          }
        >
          {r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action / Review',
      align: 'center',
      render: (r) => {
        if (r.status !== 'Pending') {
          return (
            <span className="text-2xs text-slate-400 font-medium">
              Concluded ({r.status})
            </span>
          );
        }

        const canApprove = hasPermission(currentUser, 'workflows:approve') && !isReadOnlyRole(currentUser?.role);

        if (!canApprove) {
          return (
            <span
              title={`Role ${currentUser?.role || 'Auditor'} does not have authority to approve or reject enterprise workflows.`}
              className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded text-xs font-medium inline-flex items-center gap-1 cursor-not-allowed"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Read Only</span>
            </span>
          );
        }

        return (
          <button
            onClick={() => {
              setSelectedRequest(r);
              setRemarks('');
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors shadow-2xs"
          >
            Review Request
          </button>
        );
      },
    },
  ];

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    try {
      setLoading(true);
      await onReview({
        requestId: selectedRequest.id,
        action: actionType,
        remarks: remarks || `Reviewed by ${currentUser?.name || 'Executive'}`,
      });
      setSelectedRequest(null);
    } catch (err: any) {
      alert(err.message || 'Error updating workflow');
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Read-Only Auditor Banner */}
      <AuditorReadonlyBanner currentUser={currentUser} entityName="Enterprise Approval Workflows and Governance Decisions" />

      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Enterprise Approval Workflows
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configurable multi-tier governance rules, capital expenditure thresholds, and executive sign-off.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={pendingCount > 0 ? 'warning' : 'success'} size="md">
            {pendingCount} Pending Decisions
          </Badge>
        </div>
      </div>

      {/* Requests Table */}
      <DataTable
        id="workflows-table"
        data={requests}
        columns={columns}
        searchPlaceholder="Search document reference, type or originator..."
        exportFilename="apex-approval-requests.csv"
      />

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Review Enterprise Workflow Request"
        subtitle={`Document: ${selectedRequest?.entityReference} (${selectedRequest?.entityType})`}
      >
        <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Document Type:</span>
              <span className="font-bold text-slate-800">{selectedRequest?.entityType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reference Identification:</span>
              <span className="font-mono font-bold text-blue-700">{selectedRequest?.entityReference}</span>
            </div>
            {selectedRequest?.amount && (
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction Value:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {formatCurrency(selectedRequest.amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Originating Staff:</span>
              <span className="font-medium text-slate-800">{selectedRequest?.requestedBy}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mandated Tier Role:</span>
              <Badge variant="primary">{selectedRequest?.currentApproverRole}</Badge>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Decision Remarks / Notes *</label>
            <textarea
              required
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide business justification or audit remarks for this decision..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedRequest(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setActionType('Rejected')}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Reject Request
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={() => setActionType('Approved')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              Approve & Authorize
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
