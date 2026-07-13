import React, { useMemo } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '@/components/registry/Primitives';
import { CatPill } from '@/components/registry/Kit';
import { Server, User, PlusCircle, CheckCircle, ShieldAlert, Cpu } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { mcpServers, a2aAgents, skills, prompts, getHealthDisplay } = useRegistry();
  const navigate = useNavigate();

  // Total count across all facets
  const totalAssetsCount = useMemo(() => {
    return mcpServers.length + a2aAgents.length + skills.length + prompts.length;
  }, [mcpServers, a2aAgents, skills, prompts]);

  // Operational Servers
  const operationalServers = useMemo(() => {
    return mcpServers.filter(s => s.health?.status === 'healthy' && !s.disabled).length;
  }, [mcpServers]);

  // Agent Population
  const agentPopulation = useMemo(() => {
    return a2aAgents.filter(a => !a.disabled).length;
  }, [a2aAgents]);

  // Reusable Skills downloads count
  const reusableSkillsDownloads = useMemo(() => {
    return skills.reduce((sum, s) => sum + (s.downloads || 0), 0);
  }, [skills]);

  // Secured Prompts count
  const securedPromptsCount = useMemo(() => {
    return prompts.filter(p => p.status === 'approved' && !p.disabled).length;
  }, [prompts]);

  // Combined reverse-chronological list of recent activity (up to 5 items)
  const recentActivities = useMemo(() => {
    const list = [
      ...mcpServers.map(s => ({ ...s, kind: 'server' as const })),
      ...a2aAgents.map(a => ({ ...a, kind: 'agent' as const })),
      ...skills.map(sk => ({ ...sk, kind: 'skill' as const, ownerName: sk.identity?.ownerName || 'Community' })),
      ...prompts.map(p => ({ ...p, kind: 'prompt' as const, ownerName: p.author || 'Community' }))
    ];
    // Sort by updatedAt descending
    list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return list.slice(0, 5);
  }, [mcpServers, a2aAgents, skills, prompts]);

  // Compliance calculations
  const complianceStats = useMemo(() => {
    const list = [
      ...mcpServers,
      ...a2aAgents,
      ...skills,
      ...prompts
    ];
    const totalScans = list.length;
    const healthyScans = list.filter(item => getHealthDisplay(item) === 'Healthy' && !item.disabled).length;
    const percentHealthy = totalScans > 0 ? Math.round((healthyScans / totalScans) * 100) : 100;
    const totalUnhealthy = list.filter(item => getHealthDisplay(item) === 'Unhealthy' || item.disabled).length;

    return { percentHealthy, totalUnhealthy };
  }, [mcpServers, a2aAgents, skills, prompts, getHealthDisplay]);

  return (
    <div className="p-6 space-y-8 select-none max-w-6xl mx-auto">
      
      {/* 1. Hero / Header */}
      <div className="border-b border-gray-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">Agent Nexus</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Governed operations console for model capabilities and agent configurations.
          </p>
        </div>
        
        {/* Asset counts badge */}
        <div className="bg-primary/5 border border-primary/20 rounded px-3 py-1.5 flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-primary">{totalAssetsCount} Governance Assets in Catalog</span>
        </div>
      </div>

      {/* 2. Quick-Start Wizards Row */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Quick-start setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div 
            onClick={() => navigate('/register?kind=server')}
            className="border border-gray-200 bg-white p-5 rounded-lg hover:border-primary cursor-pointer transition-all duration-150 flex items-start gap-4 shadow-xs"
          >
            <div className="p-2 bg-blue-50 text-blue-600 rounded">
              <Server className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                Register an MCP Server <PlusCircle className="w-3.5 h-3.5 text-gray-400" />
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Expose dynamic data endpoints, schema tools, and prompt definitions directly into the secure gateway router.
              </p>
            </div>
          </div>

          <div 
            onClick={() => navigate('/register?kind=agent')}
            className="border border-gray-200 bg-white p-5 rounded-lg hover:border-primary cursor-pointer transition-all duration-150 flex items-start gap-4 shadow-xs"
          >
            <div className="p-2 bg-purple-50 text-purple-600 rounded">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1">
                Register an A2A Agent <PlusCircle className="w-3.5 h-3.5 text-gray-400" />
              </h3>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Establish autonomous agent-to-agent identities, bind reasoning permissions, and attach skills.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Nexus Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard label="Operational Servers" value={operationalServers} subtext="Healthy stdout/HTTP gateways" />
        <StatCard label="Agent Population" value={agentPopulation} subtext="Active A2A workflows" />
        <StatCard label="Reusable Skills" value={`${(reusableSkillsDownloads / 1000).toFixed(1)}k`} subtext="Downloads aggregated" />
        <StatCard label="Secured Prompts" value={securedPromptsCount} subtext="Validated prompt templates" />
      </div>

      {/* 4. Split: Activity Feed & Compliance Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity Feed (2/3 width) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Recent activity feed</h2>
          <div className="border border-gray-200 rounded-lg bg-white overflow-hidden divide-y divide-gray-100 shadow-xs">
            {recentActivities.map((act) => (
              <div 
                key={act.id} 
                onClick={() => navigate(`/${act.kind}s/${act.id}`)}
                className="p-4 flex items-center justify-between hover:bg-gray-50/50 cursor-pointer transition-colors text-xs font-semibold"
              >
                <div className="flex items-center gap-3">
                  <CatPill text={act.kind} />
                  <span className="text-gray-800 truncate max-w-sm">{act.name}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-400 font-mono-custom text-[11px]">
                  <span>{act.ownerName || 'Community'}</span>
                  <span>·</span>
                  <span>{new Date(act.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance panel (1/3 width) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Platform compliance check</h2>
          <div className="border border-gray-200 rounded-lg bg-white p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-3 border-b pb-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-gray-800 block">Sanitization status</span>
                <span className="text-[10px] text-gray-450 mt-0.5 block font-semibold">Checks scanner parameters clean rate</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 border rounded-md">
                <span className="text-lg font-black text-emerald-700 block">{complianceStats.percentHealthy}%</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Healthy Scans</span>
              </div>
              <div className="p-3 bg-gray-50 border rounded-md">
                <span className="text-lg font-black text-rose-700 block">{complianceStats.totalUnhealthy}</span>
                <span className="text-[10px] text-gray-400 font-bold uppercase mt-1 block">Unhealthy / Off</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/40 border border-blue-100 rounded text-[11px] text-blue-700 leading-relaxed font-semibold flex gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <span>All assets are verified against standard checks before publish inclusion.</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
