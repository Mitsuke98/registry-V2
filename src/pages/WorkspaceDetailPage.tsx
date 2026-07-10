import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { DataTable } from '@/components/registry/DataTable';
import { EntityIcon, ScanGrade, VerifiedBadge, BookmarkToggle, EmptyState, StatusBadge } from '@/components/registry/UIHelperKit';
import { Badge } from '@/components/ui/badge';
import { StatRow } from '@/components/registry/StatPrimitive';
import { ArrowLeft, Edit, Trash2, X, Globe, Users, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const KNOWN_USERS = ['Alex Vance', 'Jordan Blake', 'Sarah Chen', 'Michael Scott'];

export const WorkspaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workspaces, mcpServers, a2aAgents, skills, prompts, currentUser, can, updateWorkspace, deleteWorkspace, changeHistory, revertChange } = useRegistry();
  const { query } = useSearch();

  const workspace = workspaces.find((w) => w.id === id);

  usePageSearch(workspace ? `Search in ${workspace.name}…` : 'Search in workspace…');

  const [kindFilter, setKindFilter] = useState<'all' | 'server' | 'agent' | 'skill' | 'prompt'>('all');
  const [filterPending, setFilterPending] = useState(false);

  // Edit/Delete dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Edit form states
  const [editName, setEditName] = useState(workspace?.name || '');
  const [editDescription, setEditDescription] = useState(workspace?.description || '');
  const [editOwner, setEditOwner] = useState(workspace?.ownerName || '');
  const [memberInput, setMemberInput] = useState('');
  const [editMembers, setEditMembers] = useState<string[]>(workspace?.members || []);

  React.useEffect(() => {
    if (workspace) {
      setEditName(workspace.name);
      setEditDescription(workspace.description);
      setEditOwner(workspace.ownerName);
      setEditMembers(workspace.members);
    }
  }, [workspace]);

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
  const workspaceItems = useMemo(() => {
    const list: any[] = [];

    const collectFromList = (sourceList: any[], kind: 'server' | 'agent' | 'skill' | 'prompt') => {
      sourceList.forEach(item => {
        if (workspace.kind === 'personal') {
          // Personal workspace: derive by ownership (all assets owned by workspace ownerName, regardless of status)
          if (item.ownerName === workspace.ownerName) {
            list.push({ ...item, kind });
          }
        } else {
          // Team workspace: derive by visibility (approved, not disabled, shared to it)
          if (item.status === 'approved' && !item.disabled && item.visibility?.workspaceIds?.includes(workspace.id)) {
            list.push({ ...item, kind });
          }
        }
      });
    };

    collectFromList(mcpServers, 'server');
    collectFromList(a2aAgents, 'agent');
    collectFromList(skills, 'skill');
    collectFromList(prompts, 'prompt');
    return list;
  }, [workspace, mcpServers, a2aAgents, skills, prompts]);

  const getWorkspaceItems = () => {
    // Apply Kind Filter
    let filtered = workspaceItems;
    if (kindFilter !== 'all') {
      filtered = filtered.filter(item => item.kind === kindFilter);
    }

    // Apply Pending Filter
    if (filterPending) {
      filtered = filtered.filter(item => item.status === 'pending' || item.status === 'in_review' || item.status === 'rejected');
    }

    // Apply Search Query
    const term = query.toLowerCase();
    return filtered.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  };

  const filteredItems = getWorkspaceItems();

  // Compute pending items registered by this user (including pending + in_review)
  const userPendingItems = [
    ...mcpServers.filter(s => s.ownerName === currentUser?.name && (s.status === 'pending' || s.status === 'in_review')).map(s => ({ ...s, kind: 'server' })),
    ...a2aAgents.filter(a => a.ownerName === currentUser?.name && (a.status === 'pending' || a.status === 'in_review')).map(a => ({ ...a, kind: 'agent' })),
    ...skills.filter(sk => sk.ownerName === currentUser?.name && (sk.status === 'pending' || sk.status === 'in_review')).map(sk => ({ ...sk, kind: 'skill' })),
    ...prompts.filter(p => p.ownerName === currentUser?.name && (p.status === 'pending' || p.status === 'in_review')).map(p => ({ ...p, kind: 'prompt' }))
  ];

  const pendingCount = userPendingItems.length;

  const pendingStats = useMemo(() => {
    let pCount = 0;
    let rCount = 0;
    userPendingItems.forEach(item => {
      if (item.status === 'pending') pCount++;
      else if (item.status === 'in_review') rCount++;
    });
    const parts = [];
    if (pCount > 0) parts.push(`${pCount} pending`);
    if (rCount > 0) parts.push(`${rCount} in review`);
    return parts.join(' · ') || 'No pending approvals';
  }, [userPendingItems]);

  const pendingCaption = pendingStats;

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
      accessor: (row: any) => {
        const isGlobal = row.visibility?.global;
        const isWorkspace = row.visibility?.workspaceIds?.length > 0;
        const isPrivate = !isGlobal && !isWorkspace;

        return (
          <div className="flex items-center gap-2 font-medium">
            <EntityIcon kind={row.kind} className="size-4" />
            <span>{row.name}</span>
            <Badge variant="outline" className="text-[9.5px] uppercase font-mono py-0 px-1 rounded-sm select-none">
              {row.kind}
            </Badge>
            {workspace.kind === 'personal' && (
              <div className="flex items-center gap-1.5 ml-1.5 text-muted-foreground/80 select-none">
                {isGlobal && <span title="Public"><Globe className="size-3.5" /></span>}
                {isWorkspace && <span title="Workspaces"><Users className="size-3.5" /></span>}
                {isPrivate && <span title="Private"><Lock className="size-3.5 text-amber-600/70" /></span>}
              </div>
            )}
          </div>
        );
      }
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
            <span>{workspaceItems.length} items mapped</span>
          </div>
        </div>

        {can('crud-workspace', workspace) && (
          <div className="flex items-center gap-2.5 shrink-0 select-none">
            <Button variant="outline" onClick={() => setIsEditOpen(true)} className="h-9 text-xs font-semibold gap-1.5 cursor-pointer">
              <Edit className="size-3.5" />
              <span>Edit Workspace</span>
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteOpen(true)} className="h-9 text-xs font-semibold gap-1.5 bg-red-600 hover:bg-red-700 text-white cursor-pointer">
              <Trash2 className="size-3.5" />
              <span>Delete Workspace</span>
            </Button>
          </div>
        )}
      </div>

      {/* Stat Cards for Personal Workspace (My Registry) */}
      {workspace.kind === 'personal' && (
        <>
          <StatRow
            stats={[
              { value: workspaceItems.length, label: 'Items Mapped' },
              { value: `Pending approval (${pendingCount})`, label: 'Awaiting super admin', trend: pendingCount > 0 ? 1 : 0, isWorsening: false, caption: pendingCaption }
            ]}
          />

          {/* Recent Changes Card */}
          {(() => {
            const getRelativeTime = (timestampStr: string) => {
              const diff = Date.now() - new Date(timestampStr).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return 'Just now';
              if (mins < 60) return `${mins}m ago`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `${hrs}h ago`;
              return new Date(timestampStr).toLocaleDateString();
            };
            const myChanges = changeHistory.filter(change => change.actor === currentUser?.name);

            return (
              <div className="bg-card border border-border rounded-xl p-5 shadow-none space-y-4">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider select-none">Recent Changes</h3>
                {myChanges.length === 0 ? (
                  <p className="text-xs text-muted-foreground select-none">No recent changes.</p>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {myChanges.map(change => (
                      <div key={change.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 select-none">
                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              change.action.startsWith('workspace')
                                ? 'bg-blue-100 text-blue-800'
                                : change.action === 'delete'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {change.action}
                            </span>
                            <span className="font-mono text-xs font-semibold text-foreground">{change.targetName}</span>
                            <span className="text-[11px] text-muted-foreground">·</span>
                            <span className="text-[11px] text-muted-foreground">{getRelativeTime(change.timestamp)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{change.summary}</p>
                        </div>
                        {can('revert', change) && (
                          <Button
                            onClick={() => revertChange(change.id)}
                            variant="outline"
                            className="h-8 text-xs font-semibold cursor-pointer select-none"
                          >
                            Revert
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
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
      {/* EDIT WORKSPACE DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 bg-card border border-border rounded-xl">
          <DialogHeader className="mb-4 select-none">
            <DialogTitle className="text-base font-bold text-foreground">Edit Workspace</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update details and members for "{workspace.name}".
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => {
            e.preventDefault();
            updateWorkspace(workspace.id, {
              name: editName,
              description: editDescription,
              ownerName: editOwner,
              members: editMembers
            });
            setIsEditOpen(false);
          }} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Name *</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-transparent p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Owner *</label>
              <select
                value={editOwner}
                onChange={e => setEditOwner(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold cursor-pointer focus:outline-none"
              >
                {KNOWN_USERS.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Members</label>
              <div className="flex gap-2">
                <Input
                  value={memberInput}
                  onChange={e => setMemberInput(e.target.value)}
                  placeholder="Add member name..."
                  className="h-9 text-xs flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = memberInput.trim();
                      if (trimmed && !editMembers.includes(trimmed)) {
                        setEditMembers([...editMembers, trimmed]);
                        setMemberInput('');
                      }
                    }
                  }}
                />
                <Button type="button" onClick={() => {
                  const trimmed = memberInput.trim();
                  if (trimmed && !editMembers.includes(trimmed)) {
                    setEditMembers([...editMembers, trimmed]);
                    setMemberInput('');
                  }
                }} variant="outline" className="h-9 text-xs">Add</Button>
              </div>

              {editMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 max-h-[80px] overflow-y-auto">
                  {editMembers.map(m => (
                    <span key={m} className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border/30">
                      <span>{m}</span>
                      <button type="button" onClick={() => setEditMembers(editMembers.filter(item => item !== m))} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 select-none">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="h-9 text-xs font-semibold rounded-lg">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 bg-card border border-border rounded-xl select-none">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-bold text-foreground">Delete Workspace</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you sure you want to delete workspace "{workspace.name}"? This action is reversible. Assets mapped to this workspace will not be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="h-9 text-xs font-semibold rounded-lg">
              Cancel
            </Button>
            <Button onClick={() => {
              deleteWorkspace(workspace.id);
              setIsDeleteOpen(false);
              navigate('/workspaces');
            }} className="h-9 px-5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm">
              Confirm Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
