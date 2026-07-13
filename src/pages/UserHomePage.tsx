import React, { useState } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { StatCard, SmartTable } from '@/components/registry/Primitives';
import { CatPill, VisibilityBadge, StatusBadge, HealthDot } from '@/components/registry/Kit';
import { AlertCircle, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FEATURES } from '@/config/features';

export const UserHomePage: React.FC = () => {
  const { 
    currentUser, mcpServers, a2aAgents, skills, prompts,
    getApprovals, getAttentionItems, changeHistory, revertChange, getHealthDisplay
  } = useRegistry();
  const navigate = useNavigate();

  const [kindFilter, setKindFilter] = useState<'all' | 'server' | 'agent' | 'skill' | 'prompt'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [performanceMetric, setPerformanceMetric] = useState<'calls' | 'errors' | 'success'>('calls');
  const [performanceAssetId] = useState<string>('all');

  // Filter assets owned by active user. Uses optional chaining rather than
  // an early return so hooks below (needsAttentionFeed) stay unconditional.
  const myServers = mcpServers.filter(s => s.ownerName === currentUser?.name);
  const myAgents = a2aAgents.filter(a => a.ownerName === currentUser?.name);
  const mySkills = skills.filter(s => s.identity?.ownerName === currentUser?.name);
  const myPrompts = prompts.filter(p => p.author === currentUser?.name);

  const totalOwned = myServers.length + myAgents.length + mySkills.length + myPrompts.length;

  // Calculate pending counts
  const { yourSubmissions } = getApprovals();
  const pendingRegs = yourSubmissions.filter(s => s.type === 'registration');
  const pendingVers = yourSubmissions.filter(s => s.type === 'version');
  const pendingDels = yourSubmissions.filter(s => s.type === 'deletion');
  const totalPending = pendingRegs.length + pendingVers.length + pendingDels.length;

  // Active issues owned by user
  const myIssues = getAttentionItems().filter(item => {
    const assetId = item.id.replace('health-', '').replace('risk-', '');
    const isOwned = [...myServers, ...myAgents, ...mySkills, ...myPrompts].some(a => a.id === assetId);
    return isOwned;
  });

  // Calculate total calls 30d across owned assets
  const myCalls30d = myServers.reduce((sum, s) => sum + (s.weeklyCalls?.reduce((a, b) => a + b, 0) || 1200), 0) +
                     myAgents.reduce((sum, a) => sum + (a.weeklyCalls?.reduce((a, b) => a + b, 0) || 800), 0);

  // Home Stats metadata
  const serversCount = myServers.length;
  const agentsCount = myAgents.length;
  const skillsCount = mySkills.length;
  const promptsCount = myPrompts.length;

  // Combined Owned list
  const ownedAssets = [
    ...myServers.map(s => ({ ...s, kind: 'server' as const })),
    ...myAgents.map(a => ({ ...a, kind: 'agent' as const })),
    ...mySkills.map(sk => ({ ...sk, kind: 'skill' as const })),
    ...myPrompts.map(p => ({ ...p, kind: 'prompt' as const }))
  ];

  // Needs Attention items prioritized feed (cap 8)
  const needsAttentionFeed = React.useMemo(() => {
    const feed: any[] = [];
    
    // 1. Health issues
    myIssues.forEach(issue => {
      feed.push({
        id: issue.id,
        category: 'Issues',
        title: issue.title,
        description: issue.description,
        type: 'danger',
        route: issue.route
      });
    });

    // 2. Pending Submissions (Action needed)
    yourSubmissions.forEach(sub => {
      feed.push({
        id: `sub-${sub.id}`,
        category: 'Action needed',
        title: `Pending ${sub.type}: ${sub.name}`,
        description: `Submitted ${new Date(sub.date).toLocaleDateString()}. Status: ${sub.status}`,
        type: 'warning',
        route: '/submissions'
      });
    });

    // 3. Deactivated assets
    ownedAssets.forEach(a => {
      if (a.disabled) {
        feed.push({
          id: `disabled-${a.id}`,
          category: 'Issues',
          title: `Asset disabled: ${a.name}`,
          description: `This asset was manually disabled.`,
          type: 'muted',
          route: `/${a.kind}s/${a.id}`
        });
      }
    });

    return feed.slice(0, 8);
  }, [myIssues, yourSubmissions, ownedAssets]);

  if (!currentUser) return null;

  // Filter owned list for SmartTable
  const filteredOwned = ownedAssets.filter(asset => {
    if (kindFilter !== 'all' && asset.kind !== kindFilter) return false;
    if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
    if (showPendingOnly) {
      const hasPendingVer = asset.versions?.some((v: any) => v.status === 'pending');
      const isPendingReg = asset.status === 'pending' || asset.status === 'in_review';
      const isPendingDel = asset.deletionRequested;
      if (!hasPendingVer && !isPendingReg && !isPendingDel) return false;
    }
    return true;
  });

  // SmartTable columns definition
  const tableColumns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <CatPill text={row.kind} />
          <span className="font-semibold text-gray-800">{row.name}</span>
        </div>
      )
    },
    {
      key: 'version',
      header: 'Version',
      render: (row: any) => {
        const pendingVer = row.versions?.find((v: any) => v.status === 'pending');
        return (
          <div className="flex items-center gap-1.5 font-mono-custom">
            <span>{row.version}</span>
            {pendingVer && (
              <span className="bg-amber-100 text-amber-800 text-[10px] px-1 rounded font-semibold whitespace-nowrap border border-amber-200">
                v{pendingVer.version} pending
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} disabled={row.disabled} deletionRequested={row.deletionRequested} />
    },
    {
      key: 'health',
      header: 'Health',
      render: (row: any) => <HealthDot status={getHealthDisplay(row)} showLabel />
    },
    {
      key: 'visibility',
      header: 'Visibility',
      render: (row: any) => <VisibilityBadge global={row.visibility?.global} workspaceIds={row.visibility?.workspaceIds || []} />
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      render: (row: any) => (
        <span className="text-gray-500 font-mono-custom">
          {new Date(row.updatedAt).toLocaleDateString()}
        </span>
      )
    }
  ];

  // Owned assets dropdown for performance leaderboard
  const perfAssets = ownedAssets.filter(a => a.kind === 'server' || a.kind === 'agent');

  // Performance data resolver
  const getPerformanceData = () => {
    const targetAsset = perfAssets.find(a => a.id === performanceAssetId);
    const targets = targetAsset ? [targetAsset] : perfAssets;

    return targets.map(t => {
      const weeklyData = performanceMetric === 'calls' 
        ? t.weeklyCalls 
        : performanceMetric === 'errors' 
          ? t.weeklyErrors 
          : t.weeklyCalls?.map((c, i) => Math.round(c * (('weeklySuccessRate' in t ? t.weeklySuccessRate[i] : 99) / 100)));

      const totalValue = weeklyData?.reduce((a, b) => a + b, 0) || 0;

      return {
        id: t.id,
        name: t.name,
        kind: t.kind,
        value: totalValue
      };
    }).sort((a, b) => b.value - a.value).slice(0, 5);
  };

  const performanceList = getPerformanceData();

  // User's change logs
  const myChanges = changeHistory.filter(c => c.actor === currentUser.name).slice(0, 5);

  return (
    <div className="p-6 space-y-8 select-none">
      
      {/* Welcome Hero */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-gray-800">Welcome back, {currentUser.name}</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage your registered MCP servers, coordinate agents, and track security status audits.</p>
      </div>

      {/* KPI Cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Your Assets"
          value={totalOwned}
          subtext={`${serversCount} servers · ${agentsCount} agents · ${skillsCount} skills${FEATURES.prompts ? ` · ${promptsCount} prompts` : ''}`}
        />
        <StatCard
          label="Pending Approval"
          value={totalPending}
          subtext={`${pendingRegs.length} regs · ${pendingVers.length} bumps · ${pendingDels.length} deletes`}
          className={totalPending > 0 ? "border-amber-200 bg-amber-50/10" : ""}
        />
        <StatCard
          label="Active Issues"
          value={myIssues.length}
          subtext={`${myIssues.filter(i => i.severity === 'high').length} critical issues active`}
          className={myIssues.length > 0 ? "border-red-200 bg-red-50/10" : ""}
        />
        <StatCard
          label="Total API Calls"
          value={`${(myCalls30d / 1000).toFixed(1)}k`}
          subtext="Aggregate traffic past 30 days"
        />
      </div>

      {/* Split layout: SmartTable Left, Feed Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Your Assets Table Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-150 pb-2.5">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Registered Assets</h2>
            
            {/* Inline presets row */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowPendingOnly(!showPendingOnly)}
                className={`px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer select-none transition-all ${
                  showPendingOnly
                    ? 'bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-300'
                    : 'bg-white text-gray-600 border-gray-250 hover:bg-gray-50'
                }`}
              >
                Pending action ({totalPending})
              </button>

              <select
                value={kindFilter}
                onChange={e => setKindFilter(e.target.value as any)}
                className="px-2 py-1 text-xs border border-gray-200 rounded bg-white font-semibold text-gray-700 cursor-pointer"
              >
                <option value="all">All types</option>
                <option value="server">Servers</option>
                <option value="agent">Agents</option>
                <option value="skill">Skills</option>
                <option value="prompt">Prompts</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="px-2 py-1 text-xs border border-gray-200 rounded bg-white font-semibold text-gray-700 cursor-pointer"
              >
                <option value="all">All status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={filteredOwned} 
              columns={tableColumns} 
              externalToolbar={true} 
              onRowClick={(row) => navigate(`/${row.kind}s/${row.id}`)}
            />
          </div>
        </div>

        {/* Needs attention & changes panel */}
        <div className="space-y-6">
          
          {/* Needs Attention Feed */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Needs Attention</h2>
            <div className="border border-gray-200 rounded-md bg-white overflow-hidden divide-y divide-gray-100 shadow-sm">
              {needsAttentionFeed.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 font-medium">
                  No issues or action items require your attention.
                </div>
              ) : (
                needsAttentionFeed.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    className="p-3 hover:bg-gray-55 cursor-pointer transition-colors flex items-start gap-3 select-none"
                  >
                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${
                      item.type === 'danger' ? 'text-rose-500' : 'text-amber-500'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1 rounded ${
                          item.type === 'danger' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-800 mt-1 truncate">{item.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Performance leaderboard widget */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Asset Traffic (30d)</h2>
              
              <div className="flex border border-gray-200 rounded overflow-hidden shadow-sm shrink-0">
                <button
                  onClick={() => setPerformanceMetric('calls')}
                  className={`p-1 px-2.5 text-[10px] font-semibold select-none cursor-pointer focus:outline-none ${
                    performanceMetric === 'calls' ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Calls
                </button>
                <button
                  onClick={() => setPerformanceMetric('errors')}
                  className={`p-1 px-2.5 text-[10px] font-semibold select-none cursor-pointer focus:outline-none ${
                    performanceMetric === 'errors' ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Errors
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-md bg-white p-4 space-y-3 shadow-sm select-none">
              {performanceList.length === 0 ? (
                <p className="text-center text-xs text-gray-400">No telemetry logs available.</p>
              ) : (
                performanceList.map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-gray-300 font-bold w-4">{idx + 1}</span>
                      <span className="font-bold text-gray-700 truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold font-mono-custom text-gray-600">
                      {item.value.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent changes revert card */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Recent Mutations</h2>
            <div className="border border-gray-200 rounded-md bg-white p-3.5 space-y-3.5 shadow-sm">
              {myChanges.length === 0 ? (
                <p className="text-center text-xs text-gray-400 font-medium py-3">No change logs recorded.</p>
              ) : (
                myChanges.map((chg) => (
                  <div key={chg.id} className="flex items-start justify-between gap-3 text-xs border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1 rounded uppercase">
                          {chg.action}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono-custom">
                          {new Date(chg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 mt-1 truncate">{chg.targetName}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{chg.summary}</p>
                    </div>
                    <button
                      onClick={() => revertChange(chg.id)}
                      className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold border border-gray-250 rounded bg-white text-gray-700 hover:bg-gray-55 cursor-pointer shrink-0"
                      title="Undo mutation"
                    >
                      <Undo2 className="w-3 h-3" />
                      Revert
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
