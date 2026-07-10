import React from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { useNavigate } from 'react-router-dom';
import { CardShell } from '@/components/registry/CardShell';
import { StatRow } from '@/components/registry/StatPrimitive';
import { EntityIcon, ScanGrade, VerifiedBadge } from '@/components/registry/UIHelperKit';
import { FEATURES } from '@/config/features';

export const HomePage: React.FC = () => {
  const { mcpServers, a2aAgents, skills, prompts, getPlatformStatus, getApprovals } = useRegistry();
  const navigate = useNavigate();

  const platformStatus = getPlatformStatus();
  const approvals = getApprovals();

  // Platform statistics
  const totalAssets = mcpServers.length + a2aAgents.length + skills.length + (FEATURES.prompts ? prompts.length : 0);
  const pendingApprovalsCount = (approvals.registrationQueue?.length || 0) + approvals.yourSubmissions.length;
  
  // Calculate active issues
  const serverIssues = mcpServers.filter(s => s.health.status !== 'healthy').length;
  const agentIssues = a2aAgents.filter(a => a.successRatePct < 85).length;
  const skillIssues = skills.filter(s => s.trust.score < 70).length;
  const activeIssues = serverIssues + agentIssues + skillIssues;

  // Derive total calls past 30d
  const serverCalls = mcpServers.reduce((acc, s) => acc + s.weeklyCalls.reduce((sum, c) => sum + c, 0), 0);
  const agentCalls = a2aAgents.reduce((acc, a) => acc + a.weeklyCalls.reduce((sum, c) => sum + c, 0), 0);
  const totalCalls = serverCalls + agentCalls;

  const statItems = [
    { value: totalAssets, label: 'Total Assets' },
    { value: pendingApprovalsCount, label: 'Pending Approvals', trend: pendingApprovalsCount > 0 ? 1 : 0, isWorsening: pendingApprovalsCount > 0 },
    { value: activeIssues, label: 'Active Issues', trend: activeIssues, isWorsening: activeIssues > 0 },
    { value: `${(totalCalls / 1000).toFixed(1)}k`, label: 'Calls (30d)' },
  ];

  // Approved only listings for trending items
  const allApproved = [
    ...mcpServers.filter(s => s.status === 'approved').map(s => ({ ...s, kind: 'server' as const })),
    ...a2aAgents.filter(a => a.status === 'approved').map(a => ({ ...a, kind: 'agent' as const })),
    ...skills.filter(sk => sk.status === 'approved').map(sk => ({ ...sk, kind: 'skill' as const, rating: 5, reviewsCount: 10 })),
    ...(FEATURES.prompts ? prompts.filter(p => p.status === 'approved').map(p => ({ ...p, kind: 'prompt' as const })) : [])
  ];

  // Sort by rating or downloads to pick exactly 3 trending items
  const trendingItems = allApproved
    .sort((a, b) => {
      const aVal = ('downloads' in a ? a.downloads : ('totalCalls30d' in a ? a.totalCalls30d : 0)) || 0;
      const bVal = ('downloads' in b ? b.downloads : ('totalCalls30d' in b ? b.totalCalls30d : 0)) || 0;
      return bVal - aVal;
    })
    .slice(0, 3);

  // Recent activity static list
  const recentActivities = [
    { text: 'Postgres MCP gateway scanned & approved', timeAgo: '2h ago', route: '/catalog?facet=servers' },
    { text: 'Invoice Reconciler released version 1.2.0', timeAgo: '5h ago', route: '/catalog?facet=agents' },
    { text: 'Prompt Injection Filter configured in Personal Workspace', timeAgo: '1d ago', route: '/workspaces' },
    { text: 'Structured PDF Extraction successfully validated', timeAgo: '2d ago', route: '/catalog?facet=skills' }
  ];

  return (
    <div className="space-y-10">
      {/* 1. Compact Hero Area */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 border-b border-border pb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">Registry</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            The governed home for MCP servers, A2A agents, and skills.
          </p>
          {/* Platform status indicator */}
          <div className="flex items-center gap-2 mt-4 select-none">
            <span className={`size-2 rounded-full shrink-0 ${platformStatus.healthy ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[12.5px] font-semibold text-muted-foreground">{platformStatus.message}</span>
          </div>
        </div>
      </div>

      {/* 2. Platform StatCards */}
      <StatRow stats={statItems} />

      {/* 3. Navigation tiles CardShells */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
        <CardShell
          variant="tile"
          icon={<EntityIcon kind="server" />}
          title="MCP Servers"
          count={mcpServers.length}
          linkTo="/catalog?facet=servers"
        />
        <CardShell
          variant="tile"
          icon={<EntityIcon kind="agent" />}
          title="A2A Agents"
          count={a2aAgents.length}
          linkTo="/catalog?facet=agents"
        />
        <CardShell
          variant="tile"
          icon={<EntityIcon kind="skill" />}
          title="Skills Hub"
          count={skills.length}
          linkTo="/catalog?facet=skills"
        />
        <div className={FEATURES.prompts ? '' : 'opacity-50 pointer-events-none'}>
          <CardShell
            variant="tile"
            icon={<EntityIcon kind="prompt" />}
            title={FEATURES.prompts ? "Prompt Store" : "Prompts (Coming soon)"}
            count={FEATURES.prompts ? prompts.length : 0}
            linkTo={FEATURES.prompts ? "/catalog?facet=prompts" : undefined}
          />
        </div>
      </div>

      {/* 4. Trending Section */}
      <div className="space-y-4">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight select-none">Trending Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {trendingItems.map((item) => (
            <CardShell
              key={item.id}
              variant="entity"
              icon={<EntityIcon kind={item.kind} />}
              title={item.name}
              subTitle={`by ${'publisher' in item ? item.publisher : 'Community'}`}
              description={item.description}
              linkTo={`/${item.kind === 'prompt' ? 'catalog' : `${item.kind}s`}/${item.id}`}
              metaPills={[
                item.trust.verified && <VerifiedBadge key="v" />,
                <ScanGrade key="g" score={item.trust.score} />
              ].filter(Boolean) as React.ReactNode[]}
              footer={
                <div className="flex items-center justify-between w-full font-mono text-[11px]">
                  <span>Rating: {item.rating.toFixed(1)} ★</span>
                  <span className="uppercase text-[10px] tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{item.kind}</span>
                </div>
              }
            />
          ))}
        </div>
      </div>

      {/* 5. Recent Activity Feed */}
      <div className="space-y-4 select-none">
        <h2 className="text-[16px] font-bold text-foreground tracking-tight">Recent Platform Activity</h2>
        <div className="border border-border rounded-xl bg-card divide-y divide-border/60 overflow-hidden shadow-sm">
          {recentActivities.map((act, idx) => (
            <div
              key={idx}
              onClick={() => navigate(act.route)}
              className="px-6 py-4 flex items-center justify-between hover:bg-accent/60 cursor-pointer transition-colors text-xs font-medium"
            >
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-primary/40 shrink-0" />
                <span className="text-foreground">{act.text}</span>
              </div>
              <span className="text-muted-foreground font-mono">{act.timeAgo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slim footer flow indicators strip */}
      <div className="flex items-center justify-center gap-6 py-4 text-xs font-semibold text-muted-foreground/80 border-t border-border select-none">
        <span>Register asset</span>
        <span>→</span>
        <span>Verified & scanned</span>
        <span>→</span>
        <span>Shared via workspaces</span>
      </div>
    </div>
  );
};
