import React, { useState, useMemo } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { usePageSearch } from '@/context/SearchContext';
import { SmartTable } from '@/components/registry/SmartTable';
import { DataTable } from '@/components/registry/DataTable';
import { StatusBadge, EntityIcon, VerifiedBadge, ScanGrade } from '@/components/registry/UIHelperKit';
import { FEATURES } from '@/config/features';
import { toast } from 'sonner';
import { Check, X, Clock, RefreshCw, Eye, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EditAssetDialog } from '@/components/registry/EditAssetDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

type AssetKind = 'server' | 'agent' | 'skill' | 'prompt';

export const ApprovalsPage: React.FC = () => {
  usePageSearch('Search approvals...');
  const {
    mcpServers,
    a2aAgents,
    skills,
    prompts,
    currentUser,
    getApprovals,
    approveItem,
    rejectItem,
    markInReview,
    updateItem,
    setItemDisabled,
    can,
    changeHistory,
    revertChange
  } = useRegistry();

  const isSuperAdmin = currentUser?.role === 'super_admin';

  // State for Kind selection
  const [activeKind, setActiveKind] = useState<AssetKind>('server');

  // KPI Status filter: 'pending' | 'approved' | 'in_review' | 'rejected' | 'all'
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'in_review' | 'rejected' | 'all'>('all');

  // Filter Row States
  const [healthFilter, setHealthFilter] = useState<'all' | 'healthy' | 'unhealthy'>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | 'AB' | 'C' | 'DF'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog management
  const [detailItem, setDetailItem] = useState<{ kind: AssetKind; item: any } | null>(null);
  const [editItem, setEditItem] = useState<{ kind: AssetKind; item: any } | null>(null);

  // Read end user data
  const { yourSubmissions } = getApprovals();



  // Status-dependent filtering helpers
  const getRawItemsOfKind = (kind: AssetKind) => {
    if (kind === 'server') return mcpServers;
    if (kind === 'agent') return a2aAgents;
    if (kind === 'skill') return skills;
    return prompts;
  };

  const rawItems = getRawItemsOfKind(activeKind);

  // Live count KPIs for the active kind
  const counts = useMemo(() => {
    const list = getRawItemsOfKind(activeKind);
    return {
      pending: list.filter(item => item.status === 'pending').length,
      approved: list.filter(item => item.status === 'approved').length,
      in_review: list.filter(item => item.status === 'in_review').length,
      rejected: list.filter(item => item.status === 'rejected').length,
      total: list.length
    };
  }, [activeKind, mcpServers, a2aAgents, skills, prompts]);

  // Derived health checker helper
  const isHealthyItem = (kind: AssetKind, item: any): boolean => {
    if (kind === 'server') {
      return item.health?.status === 'healthy';
    }
    if (kind === 'agent') {
      return (item.successRatePct ?? 0) >= 85;
    }
    // Skills and prompts don't have active pings, assume healthy
    return true;
  };

  // Grade filter helper (Score check)
  const getItemGradeRange = (score: number): 'AB' | 'C' | 'DF' => {
    if (score >= 85) return 'AB';
    if (score >= 70) return 'C';
    return 'DF';
  };

  // Composite Filter implementation
  const filteredItems = useMemo(() => {
    return rawItems.filter(item => {
      // 1. Status Filter
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // 2. Health Filter (Servers & Agents only)
      if (activeKind !== 'skill') {
        if (healthFilter === 'healthy' && !isHealthyItem(activeKind, item)) return false;
        if (healthFilter === 'unhealthy' && isHealthyItem(activeKind, item)) return false;
      } else {
        // 3. Grade Filter (Skills only)
        if (gradeFilter !== 'all') {
          const score = item.trust?.score ?? 90;
          if (getItemGradeRange(score) !== gradeFilter) return false;
        }
      }
      // 4. Search Filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchesName = (item.name || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [rawItems, statusFilter, healthFilter, gradeFilter, searchQuery, activeKind]);

  // Reset Filters
  const handleResetFilters = () => {
    setStatusFilter('all');
    setHealthFilter('all');
    setGradeFilter('all');
    setSearchQuery('');
  };

  // Detail view trigger
  const handleOpenDetail = (item: any) => {
    setDetailItem({ kind: activeKind, item });
  };

  // Edit view trigger
  const handleOpenEdit = (item: any) => {
    setEditItem({ kind: activeKind, item });
  };


  // Action status updaters
  const handleStatusChange = (kind: AssetKind, id: string, name: string, nextStatus: 'approved' | 'rejected' | 'in_review') => {
    if (nextStatus === 'approved') {
      approveItem(kind, id);
      toast.success(`Asset "${name}" successfully approved & added to catalog.`);
    } else if (nextStatus === 'rejected') {
      rejectItem(kind, id);
      toast.error(`Asset "${name}" has been rejected.`);
    } else {
      markInReview(kind, id);
      toast.info(`Asset "${name}" marked as In Review.`);
    }
    setDetailItem(null);
  };

  // Toggle delist
  const handleToggleDisabled = (kind: AssetKind, id: string, name: string, currentVal: boolean) => {
    setItemDisabled(kind, id, !currentVal);
    if (!currentVal) {
      toast.error(`"${name}" disabled — hidden from the catalog.`);
    } else {
      toast.success(`"${name}" enabled — restored to the catalog.`);
    }
  };

  // End user columns submissions
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
          {(row.status === 'pending' || row.status === 'in_review') && <Clock className="size-3.5 text-amber-500 animate-pulse" />}
          <StatusBadge status={row.status} />
          {(row.status === 'pending' || row.status === 'in_review') && (
            <span className="text-[10px] text-muted-foreground font-semibold italic">(Awaiting super admin)</span>
          )}
        </div>
      )
    }
  ];



  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">Governance & Approvals</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5 select-none">
            {isSuperAdmin
              ? 'Super Admin Dashboard to audit configurations, verify trust ratings, and manage registries.'
              : 'Review submitted assets and monitor pending workspace transfer requests.'}
          </p>
        </div>
      </div>

      {isSuperAdmin ? (
        // ---------------------------------------------------------------------
        // SUPER ADMIN VIEW
        // ---------------------------------------------------------------------
        <div className="space-y-6">
          {/* Kind tabs */}
          <div className="border-b border-border/80 flex items-center justify-between select-none">
            <div className="flex gap-6 text-sm font-semibold">
              {(['server', 'agent', 'skill', 'prompt'] as AssetKind[]).map(kind => {
                const isPrompt = kind === 'prompt';
                const disabled = isPrompt && !FEATURES.prompts;
                const label = kind === 'server'
                  ? 'MCP Servers'
                  : kind === 'agent'
                    ? 'A2A Agents'
                    : kind === 'skill'
                      ? 'SkillHub'
                      : 'Prompt Store';
                
                const active = activeKind === kind;
                
                return (
                  <div key={kind} className="relative group">
                    <button
                      disabled={disabled}
                      onClick={() => {
                        setActiveKind(kind);
                        handleResetFilters();
                      }}
                      className={`pb-3 font-semibold text-sm transition-all border-b-2 cursor-pointer ${
                        disabled
                          ? 'opacity-45 cursor-not-allowed text-muted-foreground border-transparent'
                          : active
                            ? 'text-primary border-primary'
                            : 'text-muted-foreground hover:text-foreground border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                    {disabled && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-popover border text-popover-foreground text-[10px] py-1 px-2 rounded whitespace-nowrap shadow-md z-50">
                        Disabled for now
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleResetFilters}
              className="h-8 px-3 rounded border border-border bg-background hover:bg-accent text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="size-3" />
              <span>Reset Filters</span>
            </button>
          </div>

          {/* 5 KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 select-none">
            {[
              { key: 'pending', label: 'Pending approvals', value: counts.pending },
              { key: 'approved', label: 'Approved', value: counts.approved },
              { key: 'in_review', label: 'In review', value: counts.in_review },
              { key: 'rejected', label: 'Rejected', value: counts.rejected },
              { key: 'all', label: 'Total registered', value: counts.total }
            ].map(kpi => {
              const active = statusFilter === kpi.key;
              return (
                <Card
                  key={kpi.key}
                  onClick={() => setStatusFilter(active ? 'all' : (kpi.key as any))}
                  className={`p-4 bg-card cursor-pointer border transition-all hover:border-foreground/20 rounded-xl flex flex-col justify-between ${
                    active ? 'border-primary ring-1 ring-primary/10 bg-primary/[0.01]' : 'border-border'
                  }`}
                >
                  <div className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">{kpi.label}</div>
                  <div className={`text-2xl font-black mt-2 tracking-tight ${active ? 'text-primary' : 'text-foreground'}`}>
                    {kpi.value}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Filter row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
            <div className="flex-1 max-w-sm">
              <Input
                type="text"
                placeholder="Search name & description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-9 text-xs rounded-lg border border-border"
              />
            </div>
            <div className="flex items-center gap-3">
              {activeKind !== 'skill' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">Health:</span>
                  <select
                    value={healthFilter}
                    onChange={e => setHealthFilter(e.target.value as any)}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold cursor-pointer focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="healthy">Healthy</option>
                    <option value="unhealthy">Unhealthy</option>
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground font-semibold">Scan Grade:</span>
                  <select
                    value={gradeFilter}
                    onChange={e => setGradeFilter(e.target.value as any)}
                    className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold cursor-pointer focus:outline-none"
                  >
                    <option value="all">All Grades</option>
                    <option value="AB">A / B (Verified / Safe)</option>
                    <option value="C">C (Needs Check)</option>
                    <option value="DF">D / F (Low Score)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* SmartTable */}
          <SmartTable
            externalToolbar={true}
            columns={[
              {
                key: 'idx',
                header: '#',
                className: 'w-[50px] font-mono text-center tabular-nums',
                render: (_, index) => <span>{index + 1}</span>
              },
              {
                key: 'name',
                header: 'Name',
                className: 'font-mono text-primary font-bold max-w-[150px] truncate select-all',
                render: (row) => <span>{row.name}</span>
              },
              {
                key: 'description',
                header: 'Description',
                className: 'max-w-[280px] truncate text-muted-foreground',
                render: (row) => <span>{row.description}</span>
              },
              {
                key: 'health',
                header: activeKind === 'skill' ? 'Scan Score' : 'Health',
                className: 'w-[140px]',
                render: (row) => {
                  if (activeKind === 'skill') {
                    const score = row.trust?.score ?? 90;
                    return (
                      <div className="flex items-center gap-1.5 select-none">
                        <ScanGrade score={score} />
                        <span className="text-[11.5px] font-semibold text-muted-foreground font-mono">({score})</span>
                      </div>
                    );
                  }
                  const healthy = isHealthyItem(activeKind, row);
                  return (
                    <div className="flex items-center gap-2 select-none">
                      <span className={`size-2.5 rounded-full ${healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[11px] font-semibold uppercase">{healthy ? 'Healthy' : 'Degraded'}</span>
                    </div>
                  );
                }
              },
              {
                key: 'status',
                header: 'Approval Status',
                className: 'w-[130px]',
                render: (row) => (
                  <div className="flex items-center gap-2 select-none">
                    <StatusBadge status={row.status} />
                    {row.disabled && (
                      <span className="text-[9.5px] font-bold border border-red-500/20 bg-red-500/5 text-red-600 px-1.5 py-0.5 rounded uppercase leading-none">
                        Disabled
                      </span>
                    )}
                  </div>
                )
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'w-[200px] text-right pr-4',
                render: (row) => (
                  <div className="flex items-center justify-end gap-3" onClick={e => e.stopPropagation()}>
                    {/* Delist Switch */}
                    <div className="flex items-center gap-2" title="Enable/Disable delisting">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold select-none">Delist</span>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!row.disabled}
                          onChange={() => handleToggleDisabled(activeKind, row.id, row.name, !!row.disabled)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-muted/80 rounded-full peer peer-focus:ring-1 peer-focus:ring-primary/20 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary relative"></div>
                      </label>
                    </div>
                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(row)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Edit specifications"
                    >
                      <Edit3 className="size-4" />
                    </button>
                    {/* Detail audit */}
                    <button
                      onClick={() => handleOpenDetail(row)}
                      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Audit asset details"
                    >
                      <Eye className="size-4" />
                    </button>
                  </div>
                )
              }
            ]}
            rows={filteredItems}
            className={filteredItems.length === 0 ? 'pointer-events-none opacity-80' : ''}
          />



          {/* Change History Audit section */}
          <div className="space-y-4 pt-6 border-t border-border mt-6 select-none">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] font-bold text-foreground">Change History</h2>
              <span className="text-xs text-muted-foreground font-mono">({changeHistory.length})</span>
            </div>
            {changeHistory.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card">
                No changes recorded yet.
              </div>
            ) : (
              <SmartTable
                columns={[
                  {
                    key: 'timestamp',
                    header: 'Timestamp',
                    render: (row) => <span>{new Date(row.timestamp).toLocaleString()}</span>
                  },
                  {
                    key: 'actor',
                    header: 'Actor',
                    render: (row) => (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-foreground">{row.actor}</span>
                        <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded font-mono font-bold">{row.actorRole}</span>
                      </div>
                    )
                  },
                  {
                    key: 'action',
                    header: 'Action',
                    render: (row) => (
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                        row.action.startsWith('workspace')
                          ? 'bg-blue-100 text-blue-800'
                          : row.action === 'delete'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.action}
                      </span>
                    )
                  },
                  {
                    key: 'targetName',
                    header: 'Target Name',
                    render: (row) => <span className="font-mono text-xs font-semibold text-foreground">{row.targetName}</span>
                  },
                  {
                    key: 'summary',
                    header: 'Summary',
                    render: (row) => <span className="text-xs text-muted-foreground">{row.summary}</span>
                  },
                  {
                    key: 'revert',
                    header: 'Revert',
                    className: 'text-right pr-4',
                    render: (row) => (
                      can('revert', row) && (
                        <Button
                          onClick={() => revertChange(row.id)}
                          variant="outline"
                          className="h-8 text-xs font-semibold cursor-pointer"
                        >
                          Revert
                        </Button>
                      )
                    )
                  }
                ]}
                rows={changeHistory}
              />
            )}
          </div>
        </div>
      ) : (
        // ---------------------------------------------------------------------
        // END USER VIEW
        // ---------------------------------------------------------------------
        <div className="space-y-6">


          <div className="space-y-4">
            <div className="flex items-baseline gap-2 select-none">
              <h2 className="text-[15px] font-bold text-foreground">Your Active Submissions</h2>
              <span className="text-xs text-muted-foreground font-mono">({yourSubmissions.length})</span>
            </div>
            {yourSubmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl bg-card select-none">
                No pending registration requests.
              </div>
            ) : (
              <DataTable columns={submissionsColumns} data={yourSubmissions} />
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------------
          SUPER ADMIN VERIFY DETAIL DIALOG
          --------------------------------------------------------------------- */}
      {detailItem && (
        <Dialog open={!!detailItem} onOpenChange={val => { if(!val) setDetailItem(null); }}>
          <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto p-6 bg-card border border-border rounded-xl">
            <DialogHeader className="mb-4 select-none">
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <EntityIcon kind={detailItem.kind} className="size-5" />
                <span>Verify Registry Submission</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Audit credentials, scan results, and details for "{detailItem.item.name}".
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 text-xs">
              {/* Identity block */}
              <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-2 select-none">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">Asset Identity</h4>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">ID:</span> <span className="font-mono font-semibold text-foreground select-all">{detailItem.item.id}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Version:</span> <span className="font-mono text-foreground">{detailItem.item.version || '1.0.0'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Publisher:</span> <span className="font-semibold text-foreground">{detailItem.item.publisher || detailItem.item.ownerName || 'Community'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Submitted:</span> <span className="text-foreground">{new Date(detailItem.item.registeredAt).toLocaleDateString()}</span>
                  </div>
                </dl>
                {detailItem.item.tags && detailItem.item.tags.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1">
                    {detailItem.item.tags.map((tag: string) => (
                      <span key={tag} className="text-[10px] bg-background border px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Technical config */}
              <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-2">
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] select-none">Technical Configuration</h4>
                {detailItem.kind === 'server' ? (
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground select-none">Transport Protocol:</span>
                      <span className="font-mono text-foreground font-semibold uppercase">{detailItem.item.transport}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground select-none">Declared Tools:</span>
                      <span className="text-foreground font-semibold select-all">{(detailItem.item.tools || []).length} tools</span>
                    </div>
                  </dl>
                ) : detailItem.kind === 'agent' ? (
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground select-none">Endpoint URI:</span>
                      <span className="font-mono text-primary font-semibold select-all break-all">{detailItem.item.endpoint}</span>
                    </div>
                  </dl>
                ) : detailItem.kind === 'skill' ? (
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground select-none">Category:</span>
                      <span className="text-foreground font-semibold">{detailItem.item.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground select-none">Registered Files:</span>
                      <span className="font-mono text-foreground font-semibold">{(detailItem.item.files || []).length} items</span>
                    </div>
                  </dl>
                ) : (
                  <dl className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground select-none">Arg Count:</span>
                      <span className="font-mono text-foreground font-semibold">{detailItem.item.argCount}</span>
                    </div>
                    <div className="space-y-1 pt-1.5 select-all">
                      <span className="text-muted-foreground select-none">Template Content:</span>
                      <pre className="p-2 border rounded bg-muted/40 font-mono text-[11px] max-h-[100px] overflow-y-auto whitespace-pre-wrap leading-relaxed text-foreground">
                        {detailItem.item.content}
                      </pre>
                    </div>
                  </dl>
                )}
              </div>

              {/* Capabilities block */}
              {detailItem.item.capabilities && (
                <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-2 select-none">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">Capabilities</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(detailItem.item.capabilities).map(([key, val]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between border-b pb-1">
                        <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className={`font-bold ${val ? 'text-emerald-600' : 'text-red-500'}`}>{val ? 'YES' : 'NO'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trust & Scan block */}
              {detailItem.item.trust && (
                <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-2 select-none">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">Security scan & trust block</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Scan Grade:</span>
                      <ScanGrade score={detailItem.item.trust.score} />
                      <span className="font-mono text-muted-foreground">({detailItem.item.trust.score}/100)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Verified Badge:</span>
                      <span className="scale-95">{detailItem.item.trust.verified ? <VerifiedBadge /> : <span className="text-red-500 font-bold uppercase text-[9px] border px-1 rounded bg-red-50">NO</span>}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Skills Changelog */}
              {detailItem.kind === 'skill' && detailItem.item.versions && (
                <div className="p-4 bg-muted/20 border border-border/40 rounded-lg space-y-2">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px] select-none">Changelog versions</h4>
                  <div className="space-y-1.5 max-h-[100px] overflow-y-auto select-none">
                    {detailItem.item.versions.map((ver: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start border-b pb-1 border-border/45 last:border-0 last:pb-0">
                        <span className="font-mono font-bold text-foreground">{ver.version}</span>
                        <span className="text-muted-foreground italic text-[11px] truncate max-w-[200px]" title={ver.notes}>{ver.notes}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 mt-6 border-t pt-4 select-none">
              <Button
                variant="outline"
                onClick={() => handleStatusChange(detailItem.kind, detailItem.item.id, detailItem.item.name, 'in_review')}
                className="w-full sm:w-auto h-9 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 border-sky-300 bg-sky-50/50 hover:bg-sky-100/50 text-sky-800"
              >
                <Clock className="size-3.5 text-sky-600" />
                <span>Mark as in review</span>
              </Button>
              <Button
                onClick={() => handleStatusChange(detailItem.kind, detailItem.item.id, detailItem.item.name, 'rejected')}
                className="w-full sm:w-auto h-9 px-4 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-800"
              >
                <X className="size-3.5 text-red-600" />
                <span>Reject</span>
              </Button>
              <Button
                onClick={() => handleStatusChange(detailItem.kind, detailItem.item.id, detailItem.item.name, 'approved')}
                className="w-full sm:w-auto h-9 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1 shadow-sm"
              >
                <Check className="size-3.5 text-primary-foreground" />
                <span>Approve</span>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <EditAssetDialog
        isOpen={!!editItem}
        onOpenChange={val => { if (!val) setEditItem(null); }}
        kind={editItem?.kind || 'server'}
        item={editItem?.item}
        onSave={updates => {
          if (editItem) {
            updateItem(editItem.kind, editItem.item.id, updates);
            toast.success('Changes saved successfully!');
            setEditItem(null);
          }
        }}
      />
    </div>
  );
};
