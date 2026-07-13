import React, { useState, useMemo } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { EntityIcon, EnableToggle } from '@/components/registry/Kit';
import { Check, X, ArrowRight, Activity, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const AdminDashboardPage: React.FC = () => {
  const { 
    mcpServers, a2aAgents, skills, 
    getPlatformStatus, getApprovals, changeHistory, approveItem, rejectItem, revertChange
  } = useRegistry();
  const navigate = useNavigate();

  // Platform Status & Queue
  const status = getPlatformStatus();
  const { registrationQueue } = getApprovals();

  // Quick configuration toggles
  const [allowStdio, setAllowStdio] = useState(true);
  const [enforceTls, setEnforceTls] = useState(true);
  const [autoQuarantine, setAutoQuarantine] = useState(false);

  // Operations widgets metrics
  const totalHealthy = useMemo(() => {
    return mcpServers.filter(s => s.health?.status === 'healthy').length + 
           a2aAgents.filter(a => a.health?.status === 'healthy').length;
  }, [mcpServers, a2aAgents]);

  const totalUnhealthy = useMemo(() => {
    return mcpServers.filter(s => s.health?.status === 'unhealthy').length + 
           a2aAgents.filter(a => a.health?.status === 'unhealthy').length;
  }, [mcpServers, a2aAgents]);

  const healthRate = useMemo(() => {
    const total = totalHealthy + totalUnhealthy;
    return total > 0 ? Math.round((totalHealthy / total) * 100) : 100;
  }, [totalHealthy, totalUnhealthy]);

  const avgSecurityScore = useMemo(() => {
    const allScored = [
      ...mcpServers.map(s => s.trust?.score || 85),
      ...a2aAgents.map(a => a.trust?.score || 85),
      ...skills.map(sk => sk.trust?.score || 85)
    ];
    return allScored.length > 0 
      ? Math.round(allScored.reduce((acc, score) => acc + score, 0) / allScored.length) 
      : 88;
  }, [mcpServers, a2aAgents, skills]);

  const securityScoreColor = useMemo(() => {
    if (avgSecurityScore > 90) return 'text-emerald-700';
    if (avgSecurityScore >= 75) return 'text-amber-600';
    return 'text-rose-700';
  }, [avgSecurityScore]);

  // First 3 items in the approvals queue
  const approvalsPreview = useMemo(() => {
    return registrationQueue.slice(0, 3);
  }, [registrationQueue]);

  // Quick config toggles handler
  const handleToggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    toast.success(`Platform setting updated: ${key} is now ${value ? 'ENABLED' : 'DISABLED'}.`);
  };

  // 3 most recent entries in changeHistory
  const recentHistory = useMemo(() => {
    return changeHistory.slice(0, 3);
  }, [changeHistory]);

  return (
    <div className="p-6 space-y-8 select-none max-w-6xl mx-auto">
      
      {/* 1. Header Banner */}
      <div className="border-b border-gray-200 pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-gray-800 font-sans uppercase">Jordan's Operations Console</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Governance dashboard for active server endpoints, authentication logs, and registry approvals.
          </p>
        </div>
        
        {/* Platform Status */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-3 py-1.5 shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${status.healthy ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-xs font-semibold text-gray-700">{status.message}</span>
        </div>
      </div>

      {/* 2. Operations Console Widgets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        
        <div className="bg-white border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">System Health Rate</span>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-800">{healthRate}%</span>
            <span className="text-[10px] text-gray-400 font-semibold">Healthy servers/agents</span>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Avg Security Score</span>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${securityScoreColor}`}>{avgSecurityScore}/100</span>
            <span className="text-[10px] text-gray-400 font-semibold">Scans aggregate</span>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Avg Scan Latency</span>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-gray-850">48ms</span>
            <span className="text-[10px] text-gray-400 font-semibold">Hardcoded benchmark</span>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4 flex flex-col justify-between shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block font-mono">Avg Prompt Grade</span>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-teal-700">A+</span>
            <span className="text-[10px] text-gray-400 font-semibold">Lint aggregation score</span>
          </div>
        </div>

      </div>

      {/* 3. Approvals Queue Preview & Quick Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Approvals Queue Preview (2/3 width) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-xs font-bold text-gray-450 uppercase tracking-wider font-mono">Approvals Queue Preview ({registrationQueue.length})</h2>
            <button 
              onClick={() => navigate('/approvals')}
              className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5"
            >
              Manage approvals console <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2 select-none">
            {approvalsPreview.length === 0 ? (
              <div className="py-12 border border-dashed rounded text-center text-xs text-gray-400 bg-white font-medium">
                No items pending in approvals queue.
              </div>
            ) : (
              approvalsPreview.map(asset => (
                <div 
                  key={asset.id}
                  onClick={() => navigate(`/approvals?id=${asset.id}`)}
                  className="bg-white border border-gray-200 rounded p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-gray-300 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <EntityIcon kind={asset.kind} size="sm" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block truncate max-w-xs">{asset.name}</span>
                      <span className="text-[10px] text-gray-400 block mt-0.5 font-semibold">Submitted by {asset.ownerName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        approveItem(asset.kind, asset.id);
                        toast.success(`Stated asset approved directly.`);
                      }}
                      className="p-1 border rounded hover:bg-gray-50 text-emerald-600 bg-white"
                      title="Direct Approve"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        rejectItem(asset.kind, asset.id);
                        toast.error(`Stated asset rejected.`);
                      }}
                      className="p-1 border rounded hover:bg-gray-50 text-rose-600 bg-white"
                      title="Direct Reject"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick configuration toggles (1/3 width) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-450 uppercase tracking-wider font-mono">Platform Toggles</h2>
          <div className="border border-gray-200 bg-white p-5 rounded-lg space-y-4 shadow-xs">
            
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Allow raw STDIO</span>
                <span className="text-[10px] text-gray-400 mt-0.5 block font-semibold">Permit standard IO pipes connections</span>
              </div>
              <EnableToggle 
                checked={allowStdio} 
                onChange={(checked) => handleToggle('Allow raw STDIO', checked, setAllowStdio)} 
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Enforce TLS verification</span>
                <span className="text-[10px] text-gray-400 mt-0.5 block font-semibold">Restrict connections to secure SSL/TLS</span>
              </div>
              <EnableToggle 
                checked={enforceTls} 
                onChange={(checked) => handleToggle('Enforce TLS verification', checked, setEnforceTls)} 
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Auto-quarantine flagged</span>
                <span className="text-[10px] text-gray-400 mt-0.5 block font-semibold">Deactivate asset immediately on threat alert</span>
              </div>
              <EnableToggle 
                checked={autoQuarantine} 
                onChange={(checked) => handleToggle('Auto-quarantine flagged assets', checked, setAutoQuarantine)} 
              />
            </div>

          </div>
        </div>

      </div>

      {/* 4. Audit Trail Widget (collapsible-styled) */}
      <div className="border border-gray-200 rounded-lg bg-white overflow-hidden shadow-xs">
        <div className="px-5 py-3 border-b bg-gray-50/50 flex items-center justify-between text-xs font-bold text-gray-800">
          <span>Admin Quick Rollback Trail</span>
          <span className="text-[10px] text-gray-400 normal-case font-medium">Reverts the 3 most recent entries</span>
        </div>
        <div className="divide-y divide-gray-100 p-2">
          {recentHistory.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 italic text-center font-medium">No rollback items available.</p>
          ) : (
            recentHistory.map((act) => (
              <div key={act.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/30">
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-750">{act.actor}</span>
                    <span className="text-[9px] font-mono border px-1 rounded bg-gray-50 text-gray-400 font-bold uppercase">{act.action}</span>
                    <span className="text-[10px] text-gray-400 font-mono-custom">{new Date(act.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-500 mt-1 font-semibold truncate text-[11px]">{act.summary} · {act.targetName}</p>
                </div>
                
                <button
                  onClick={() => {
                    revertChange(act.id);
                    toast.success('Governance rollback command completed successfully.');
                  }}
                  className="px-2 py-1 text-[10px] font-bold border border-gray-250 bg-white hover:bg-gray-50 text-gray-650 rounded flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3 h-3 text-gray-500" /> Rollback
                </button>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
