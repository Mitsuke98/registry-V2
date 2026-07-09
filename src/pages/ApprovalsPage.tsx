import React, { useState } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { usePageSearch } from '@/context/SearchContext';
import { DataTable } from '@/components/registry/DataTable';
import { StatusBadge, EntityIcon } from '@/components/registry/UIHelperKit';
import { toast } from 'sonner';
import { Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export const ApprovalsPage: React.FC = () => {
  usePageSearch('Search pending approvals...');
  const { getApprovals, resolveTransfer, workspaces, currentUser, approveItem, declineItem } = useRegistry();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const { waitingOnYou, yourSubmissions, registrationQueue } = getApprovals();

  const getWorkspaceName = (id: string) => {
    return workspaces.find(w => w.id === id)?.name || id;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApproveTransfer = (requestId: string) => {
    resolveTransfer(requestId, 'approved');
    toast.success('Transfer request approved!');
  };

  const handleDeclineTransfer = (requestId: string) => {
    resolveTransfer(requestId, 'declined');
    toast.error('Transfer request declined.');
  };

  const handleApproveRegistration = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, name: string) => {
    approveItem(kind, id);
    toast.success(`Asset "${name}" successfully approved & added to catalog!`);
  };

  const handleDeclineRegistration = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, name: string) => {
    declineItem(kind, id);
    toast.error(`Asset "${name}" has been declined.`);
  };

  // Columns for Transfer Requests (Waiting on you)
  const transferColumns = [
    {
      header: 'Item',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <EntityIcon kind={row.itemKind} className="size-4" />
          <span className="font-semibold text-foreground">{row.itemId}</span>
          <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded font-mono font-bold select-none">{row.itemKind}</span>
        </div>
      )
    },
    {
      header: 'From Workspace',
      accessor: (row: any) => <span>{getWorkspaceName(row.fromWorkspaceId)}</span>
    },
    {
      header: 'To Workspace',
      accessor: (row: any) => <span>{getWorkspaceName(row.toWorkspaceId)}</span>
    },
    {
      header: 'Requested By',
      accessor: (row: any) => <span className="font-mono text-muted-foreground">{row.requestedBy}</span>
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => handleApproveTransfer(row.id)}
            className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            <Check className="size-3 text-emerald-600" />
            <span>Approve</span>
          </button>
          <button
            onClick={() => handleDeclineTransfer(row.id)}
            className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
          >
            <X className="size-3 text-red-600" />
            <span>Decline</span>
          </button>
        </div>
      )
    }
  ];

  // Columns for Registration Queue (Super Admin only)
  const queueColumns = [
    {
      header: 'Kind',
      accessor: (row: any) => (
        <div className="flex items-center gap-2">
          <EntityIcon kind={row.kind} className="size-4" />
          <span className="text-[10px] text-muted-foreground uppercase bg-muted px-2 py-0.5 rounded font-mono font-bold select-none">{row.kind}</span>
        </div>
      )
    },
    {
      header: 'Asset Name',
      accessor: (row: any) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-foreground text-xs">{row.name}</span>
          {expandedItems[row.id] && (
            <span className="text-[11px] text-muted-foreground mt-1 max-w-sm leading-relaxed">{row.description || 'No description provided.'}</span>
          )}
        </div>
      )
    },
    {
      header: 'Publisher',
      accessor: (row: any) => <span className="font-semibold text-xs">{row.publisher}</span>
    },
    {
      header: 'Submitted Date',
      accessor: (row: any) => <span className="text-muted-foreground font-mono text-xs">{new Date(row.registeredAt).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      accessor: (row: any) => {
        const isExpanded = expandedItems[row.id];
        return (
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => toggleExpand(row.id)}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer mr-1"
              title="Toggle Details"
            >
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            <button
              onClick={() => handleApproveRegistration(row.kind, row.id, row.name)}
              className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
            >
              <Check className="size-3 text-emerald-600 animate-pulse" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => handleDeclineRegistration(row.kind, row.id, row.name)}
              className="flex items-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800 text-[11px] font-semibold px-2.5 py-1 rounded cursor-pointer transition-colors"
            >
              <X className="size-3 text-red-600" />
              <span>Decline</span>
            </button>
          </div>
        );
      }
    }
  ];

  // Columns for End User submissions tracking
  const submissionsColumns = [
    {
      header: 'Asset Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-2 font-medium">
          <EntityIcon kind={row.kind} className="size-4" />
          <span>{row.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded font-mono font-bold select-none">{row.kind}</span>
        </div>
      )
    },
    {
      header: 'Date Registered',
      accessor: (row: any) => <span className="text-muted-foreground font-mono">{new Date(row.registeredAt).toLocaleDateString()}</span>
    },
    {
      header: 'Review Status',
      accessor: (row: any) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' && <Clock className="size-3.5 text-amber-500 animate-pulse" />}
          <StatusBadge status={row.status} />
          {row.status === 'pending' && (
            <span className="text-[10px] text-muted-foreground font-semibold italic">(Awaiting super admin)</span>
          )}
        </div>
      )
    }
  ];

  const isSuperAdmin = currentUser?.role === 'super_admin';

  return (
    <div className="space-y-8 select-none">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Governance Approvals</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Review incoming workspace transfers and track registration submissions.
        </p>
      </div>

      {isSuperAdmin ? (
        // ----------------------------------------------------
        // SUPER ADMIN VIEW
        // ----------------------------------------------------
        <>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-bold text-foreground">Registration Queue</h2>
              <span className="text-xs text-muted-foreground font-mono">({registrationQueue.length})</span>
            </div>
            {registrationQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                No pending registrations in the queue.
              </div>
            ) : (
              <DataTable columns={queueColumns} data={registrationQueue} />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-bold text-foreground">Workspace Transfers (Jordan)</h2>
              <span className="text-xs text-muted-foreground font-mono">({waitingOnYou.length})</span>
            </div>
            {waitingOnYou.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                No transfer requests require your attention.
              </div>
            ) : (
              <DataTable columns={transferColumns} data={waitingOnYou} />
            )}
          </div>
        </>
      ) : (
        // ----------------------------------------------------
        // END USER VIEW
        // ----------------------------------------------------
        <>
          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-bold text-foreground">Waiting on Your Approval</h2>
              <span className="text-xs text-muted-foreground font-mono">({waitingOnYou.length})</span>
            </div>
            {waitingOnYou.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                No transfer requests require your attention.
              </div>
            ) : (
              <DataTable columns={transferColumns} data={waitingOnYou} />
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-bold text-foreground">Your Active Submissions</h2>
              <span className="text-xs text-muted-foreground font-mono">({yourSubmissions.length})</span>
            </div>
            {yourSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                No pending registration requests.
              </div>
            ) : (
              <DataTable columns={submissionsColumns} data={yourSubmissions} />
            )}
          </div>
        </>
      )}
    </div>
  );
};
