import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { DataTable } from '@/components/registry/DataTable';
import { EntityIcon, ScanGrade, VerifiedBadge, BookmarkToggle, EmptyState, StatusBadge } from '@/components/registry/UIHelperKit';
import { Badge } from '@/components/ui/badge';
import { StatRow } from '@/components/registry/StatPrimitive';
import { ArrowLeft, UserPlus, FolderSync } from 'lucide-react';

export const WorkspaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspaces, mcpServers, a2aAgents, skills, prompts, currentUser } = useRegistry();
  const { query } = useSearch();

  const workspace = workspaces.find((w) => w.id === id);

  usePageSearch(workspace ? `Search in ${workspace.name}…` : 'Search in workspace…');

  const [kindFilter, setKindFilter] = useState<'all' | 'server' | 'agent' | 'skill' | 'prompt'>('all');
  const [filterPending, setFilterPending] = useState(false);

  if (!workspace) {
    return (
      <EmptyState
        message="Workspace not found. The workspace you are looking for does not exist."
        actionLabel="Back to Workspaces"
        onAction={() => navigate('/workspaces')}
      />
    );
  }

  // Resolve assets mapped to this workspace from item list
  const getWorkspaceItems = () => {
    const list: any[] = [];
    workspace.items.forEach((item) => {
      if (item.kind === 'server') {
        const found = mcpServers.find(s => s.id === item.id);
        if (found) list.push({ ...found, kind: 'server' as const });
      } else if (item.kind === 'agent') {
        const found = a2aAgents.find(a => a.id === item.id);
        if (found) list.push({ ...found, kind: 'agent' as const });
      } else if (item.kind === 'skill') {
        const found = skills.find(s => s.id === item.id);
        if (found) list.push({ ...found, kind: 'skill' as const });
      } else if (item.kind === 'prompt') {
        const found = prompts.find(p => p.id === item.id);
        if (found) list.push({ ...found, kind: 'prompt' as const });
      }
    });

    // Apply Kind Filter
    let filtered = list;
    if (kindFilter !== 'all') {
      filtered = filtered.filter(item => item.kind === kindFilter);
    }

    // Apply Pending Filter
    if (filterPending) {
      filtered = filtered.filter(item => item.status === 'pending' || item.status === 'rejected');
    }

    // Apply Search Query
    const term = query.toLowerCase();
    return filtered.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  };

  const filteredItems = getWorkspaceItems();

  // Compute pending items registered by this user
  const userPendingItems = [
    ...mcpServers.filter(s => s.ownerName === currentUser?.name && s.status === 'pending').map(s => ({ ...s, kind: 'server' })),
    ...a2aAgents.filter(a => a.ownerName === currentUser?.name && a.status === 'pending').map(a => ({ ...a, kind: 'agent' })),
    ...skills.filter(sk => sk.ownerName === currentUser?.name && sk.status === 'pending').map(sk => ({ ...sk, kind: 'skill' })),
    ...prompts.filter(p => p.ownerName === currentUser?.name && p.status === 'pending').map(p => ({ ...p, kind: 'prompt' }))
  ];

  const pendingCount = userPendingItems.length;

  const pendingByKind: Record<string, number> = {};
  userPendingItems.forEach(item => {
    pendingByKind[item.kind] = (pendingByKind[item.kind] || 0) + 1;
  });
  const pendingCaption = Object.entries(pendingByKind)
    .map(([kind, count]) => `${count} ${kind}${count > 1 ? 's' : ''}`)
    .join(' · ') || 'No pending approval items';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      header: 'Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-2 font-medium">
          <EntityIcon kind={row.kind} className="size-4" />
          <span>{row.name}</span>
          <Badge variant="outline" className="text-[9.5px] uppercase font-mono py-0 px-1 rounded-sm select-none">
            {row.kind}
          </Badge>
        </div>
      )
    },
    {
      header: 'Author / Publisher',
      accessor: (row: any) => <span>{row.publisher || row.author || 'Community'}</span>
    },
    {
      header: 'Scans & Grades',
      accessor: (row: any) => (
        <div className="flex items-center gap-2 select-none">
          {row.trust.verified && <VerifiedBadge />}
          <ScanGrade score={row.trust.score} />
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row: any) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: (row: any) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <BookmarkToggle kind={row.kind} id={row.id} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => navigate('/workspaces')}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        <span>Back to Workspaces</span>
      </button>

      {/* Header block */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground truncate leading-tight">
              {workspace.name}
            </h1>
            <Badge variant="outline" className="text-[10.5px] font-normal rounded-sm py-0.5 px-2 select-none bg-background capitalize">
              {workspace.kind}
            </Badge>
          </div>
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            {workspace.description}
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px] text-muted-foreground pt-1 select-none">
            <span>{workspace.ownerIsCurrentUser ? 'Owned by you' : `Owned by ${workspace.ownerName}`}</span>
            <span>·</span>
            <span>{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</span>
            <span>·</span>
            <span>Created {formatDate(workspace.createdAt)}</span>
            <span>·</span>
            <span>{workspace.items.length} items mapped</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 select-none">
          <button className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-accent/60 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer">
            <UserPlus className="size-3.5" />
            <span>Manage members</span>
          </button>
          <button className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-4 h-9 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5">
            <FolderSync className="size-3.5" />
            <span>Map asset</span>
          </button>
        </div>
      </div>

      {/* Stat Cards for Personal Workspace (My Registry) */}
      {workspace.kind === 'personal' && (
        <StatRow
          stats={[
            { value: workspace.items.length, label: 'Items Mapped' },
            { value: `Pending approval (${pendingCount})`, label: 'Awaiting super admin', trend: pendingCount > 0 ? 1 : 0, isWorsening: false, caption: pendingCaption }
          ]}
        />
      )}

      {/* Filter and preset Chip Bar */}
      {workspace.kind === 'personal' && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4 select-none">
          <div className="flex flex-wrap items-center gap-3">
            {(['all', 'server', 'agent', 'skill', 'prompt'] as const).map(k => {
              const isSelected = kindFilter === k;
              return (
                <button
                  key={k}
                  onClick={() => setKindFilter(k)}
                  className={`h-8 px-3.5 rounded-full border text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap capitalize ${
                    isSelected
                      ? 'bg-primary/10 border-primary/20 text-primary font-bold'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {k === 'all' ? 'All Types' : k + 's'}
                </button>
              );
            })}

            <div className="h-4 w-px bg-border mx-1" />

            <button
              onClick={() => setFilterPending(!filterPending)}
              className={`h-8 px-3 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 flex items-center gap-1.5 ${
                filterPending
                  ? 'bg-amber-500 text-white border-amber-500 font-bold'
                  : 'bg-background text-muted-foreground hover:text-foreground border-border'
              }`}
            >
              <span>Pending approval</span>
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums">{pendingCount}</span>
            </button>
          </div>
        </div>
      )}

      {/* Workspace Items List */}
      <div className="space-y-3">
        <h3 className="text-[15px] font-bold text-foreground select-none">Configured Items</h3>
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            No items configured in this workspace matching current search terms/filters.
          </div>
        ) : (
          <DataTable columns={columns} data={filteredItems} onRowClick={(row) => navigate(`/${row.kind === 'prompt' ? 'catalog' : `${row.kind}s`}/${row.id}`)} />
        )}
      </div>
    </div>
  );
};
