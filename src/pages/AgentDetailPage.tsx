import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { 
  EntityIcon, StatusBadge, RatePopover, BookmarkToggle, 
  EnableToggle, EmptyState, CopyBlock, HealthDot
} from '@/components/registry/Kit';
import { SmartTable, StatCard } from '@/components/registry/Primitives';
import { 
  Edit, Globe, AlertTriangle, Play
} from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    a2aAgents, skills, currentUser, bookmarks, toggleBookmark, rateItem, 
    updateItem, setItemDisabled, setItemVisibility, requestDeletion, 
    cancelDeletionRequest, deleteItemDirect, can, workspaces, getHealthDisplay
  } = useRegistry();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [simulateFail, setSimulateFail] = useState(false);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any | null>(null);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDelReqOpen, setIsDelReqOpen] = useState(false);
  const [delReason, setDelReason] = useState('');
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedTestSkill, setSelectedTestSkill] = useState('');
  const [testInput, setTestInput] = useState('');
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testStatus, setTestStatus] = useState<'success' | 'failure' | null>(null);
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Find asset
  const agent = a2aAgents.find(a => a.id === id);

  useEffect(() => {
    if (agent) {
      setEditName(agent.name);
      setEditDesc(agent.description);
    }
  }, [agent]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const handleRunTest = () => {
    if (isRunningTest) return;
    setIsRunningTest(true);
    setTestResult(null);
    setTestStatus(null);

    setTimeout(() => {
      setIsRunningTest(false);
      const isFailed = testInput.toLowerCase().includes('error') || testInput.toLowerCase().includes('fail') || simulateFail;
      if (isFailed) {
        setTestStatus('failure');
        setTestResult({
          status: 'error',
          code: 500,
          message: `Failed to execute agent test action: Skill execution timeout on '${selectedTestSkill || 'custom'}' coordination node.`,
          timestamp: new Date().toISOString()
        });
      } else {
        setTestStatus('success');
        setTestResult({
          status: 'success',
          agent: agent?.name,
          skill_invoked: selectedTestSkill || 'custom_message',
          input_payload: testInput || 'Empty prompt input',
          response: `Simulated execution successful. Node processed input and generated a valid outcome with high confidence matching the agent constraints.`,
          latency_ms: Math.floor(Math.random() * 400) + 800,
          tokens_used: Math.floor(Math.random() * 200) + 150
        });
      }
    }, 1200);
  };

  if (!agent) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-sm font-bold text-gray-800">A2A Agent not found.</h2>
        <button 
          onClick={() => navigate('/catalog')}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isBookmarked = bookmarks.agent?.includes(agent.id) || false;
  const isOwner = currentUser?.name === agent.ownerName;
  const showEditButton = (isOwner && (agent.status === 'pending' || agent.status === 'in_review')) || (currentUser?.role === 'super_admin');

  // Chart telemetry data
  const chartData = agent.weeklyCalls?.map((calls, idx) => ({
    week: `W${idx + 1}`,
    calls,
    success: Math.round(calls * ((agent.weeklySuccessRate?.[idx] || 95) / 100))
  })) || [];

  // Skills linked to this agent
  const agentSkills = (agent.skillRefs || []).map(ref => {
    const sObj = skills.find(sk => sk.id === ref.skillId);
    return {
      id: ref.skillId,
      name: sObj?.name || ref.skillId,
      version: ref.version,
      description: sObj?.description || 'Registered skill code configuration.'
    };
  });

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Name is required.');
      return;
    }
    updateItem('agent', agent.id, { name: editName, description: editDesc });
    setIsEditOpen(false);
  };

  const handleDirectDelete = () => {
    deleteItemDirect('agent', agent.id);
    navigate('/catalog');
    toast.success('A2A Agent deleted.');
  };

  const handleSubmitDelReq = () => {
    requestDeletion('agent', agent.id, delReason);
    setIsDelReqOpen(false);
  };

  const handleCancelDelReq = () => {
    cancelDeletionRequest('agent', agent.id);
  };

  const handleRunHealthCheck = () => {
    setIsCheckingHealth(true);
    toast.info('Initializing system health check scan...');
    
    setTimeout(() => {
      if (simulateFail) {
        toast.error('Health scan complete: Critical threat threshold failure!');
        
        const nextTelemetry = {
          successRatePct: 78,
          avgResponseMs: 380,
          totalCalls30d: (agent.totalCalls30d || 0) + 1
        };

        const checkRecord = {
          timestamp: new Date().toISOString(),
          status: 'unhealthy',
          performedBy: currentUser?.name || 'System Scanner',
          responseMs: 380
        };

        const auditRecord = {
          editedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'System Scanner',
          healthStatus: 'Unhealthy',
          whatChanged: 'System Health Scan failed security threshold',
          remark: 'Manual simulation trigger: asset returned unhealthy status code and telemetry checks failed.'
        };

        updateItem('agent', agent.id, {
          health: {
            status: 'unhealthy',
            ...nextTelemetry
          },
          healthChecks: [checkRecord, ...(agent.healthChecks || [])],
          auditRecords: [auditRecord, ...(agent.auditRecords || [])]
        });
      } else {
        toast.success('Health scan complete: All telemetry components healthy.');
        const nextTelemetry = {
          successRatePct: 99,
          avgResponseMs: 12,
          totalCalls30d: (agent.totalCalls30d || 0) + 1
        };

        const checkRecord = {
          timestamp: new Date().toISOString(),
          status: 'healthy',
          performedBy: currentUser?.name || 'System Scanner',
          responseMs: 12
        };

        const auditRecord = {
          editedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'System Scanner',
          healthStatus: 'Healthy',
          whatChanged: 'System Health Scan passed successfully',
          remark: 'Manual simulation trigger: asset telemetry verification successfully returned status healthy.'
        };

        updateItem('agent', agent.id, {
          health: {
            status: 'healthy',
            ...nextTelemetry
          },
          healthChecks: [checkRecord, ...(agent.healthChecks || [])],
          auditRecords: [auditRecord, ...(agent.auditRecords || [])]
        });
      }
      setIsCheckingHealth(false);
    }, 1500);
  };

  return (
    <div className="relative select-none pb-12">
      
      {/* Sticky Detail Header on scroll */}
      <div className="sticky top-0 bg-white/95 border-b border-gray-200 px-6 py-3 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <EntityIcon kind="agent" size="sm" />
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-gray-800 truncate">{agent.name}</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono-custom">v{agent.version} · {agent.publisher?.name || 'Community'}</p>
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            <StatusBadge status={agent.status} disabled={agent.disabled} deletionRequested={agent.deletionRequested} />
            <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
              {agent.autonomy} Autonomy
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
          <BookmarkToggle isBookmarked={isBookmarked} onToggle={() => toggleBookmark('agent', agent.id)} />
          <RatePopover itemId={agent.id} currentRating={agent.rating} onRate={(r) => rateItem('agent', agent.id, r)} />
          
          <button
            onClick={() => {
              toast.success(`Calling agent ${agent.name}...`, {
                description: 'Agent connection loop established. Telemetry returned success.'
              });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/95 font-bold text-xs select-none transition-colors cursor-pointer"
          >
            Call agent
          </button>

          <button
            onClick={() => {
              setSelectedTestSkill('');
              setTestInput('');
              setTestResult(null);
              setTestStatus(null);
              setIsTestDialogOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-bold text-xs select-none transition-colors cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-gray-400" /> Test agent
          </button>
          
          {/* Enable/Disable Switch (Owner/SA) */}
          {can('toggle-disabled', agent) && (
            <div className="flex items-center gap-2 border border-gray-200 rounded px-2.5 py-1 bg-white text-xs select-none">
              <span className="text-[11px] font-semibold text-gray-500">Enabled</span>
              <EnableToggle checked={!agent.disabled} onChange={(checked) => setItemDisabled('agent', agent.id, !checked)} />
            </div>
          )}

          {/* Visibility Popover (Owner/SA) */}
          {can('set-visibility', agent) && (
            <div className="relative">
              <button 
                onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
              >
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                Visibility
              </button>
              {isVisibilityOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsVisibilityOpen(false)}></div>
                  <div className="absolute right-0 mt-1.5 w-64 bg-white border border-gray-200 rounded-md p-4 shadow-floating z-50">
                    <h4 className="text-xs font-bold text-gray-800 mb-2.5 border-b pb-1.5">Visibility settings</h4>
                    
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span className="font-semibold text-gray-600">Public (Global)</span>
                      <input 
                        type="checkbox" 
                        checked={agent.visibility?.global || false} 
                        onChange={(e) => setItemVisibility('agent', agent.id, {
                          global: e.target.checked,
                          workspaceIds: agent.visibility?.workspaceIds || []
                        })}
                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workspaces Share</span>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {workspaces.map(ws => {
                          const isChecked = agent.visibility?.workspaceIds?.includes(ws.id) || false;
                          return (
                            <label key={ws.id} className="flex items-center gap-2 text-xs p-1 hover:bg-gray-55 rounded cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const list = agent.visibility?.workspaceIds || [];
                                  const nextList = e.target.checked 
                                    ? [...list, ws.id]
                                    : list.filter(wId => wId !== ws.id);
                                  setItemVisibility('agent', agent.id, {
                                    global: agent.visibility?.global || false,
                                    workspaceIds: nextList
                                  });
                                }}
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="truncate font-semibold text-gray-700">{ws.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Edit (Owner conditionally/SA always) */}
          {showEditButton && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit
            </button>
          )}

          {/* Disabled Delete Button */}
          <button
            disabled
            className="px-2.5 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
            title="Deletions must be requested — use Request deletion"
          >
            Delete
          </button>

          {/* Actionable deletion requests for Owner only */}
          {isOwner && (
            agent.deletionRequested ? (
              <button
                onClick={handleCancelDelReq}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 cursor-pointer focus:outline-none"
              >
                Cancel Deletion
              </button>
            ) : (
              <button
                onClick={() => setIsDelReqOpen(true)}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 cursor-pointer focus:outline-none"
              >
                Request Deletion
              </button>
            )
          )}
        </div>
      </div>

      {/* 7 Detail Tabs Strip */}
      <div className="px-6 border-b border-gray-200 bg-white select-none">
        <div className="flex items-center gap-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'skills', label: `Skills (${agent.skillRefs?.length || 0})` },
            { key: 'audit-log', label: 'Audit Log' },
            { key: 'health-status', label: 'Health status' },
            { key: 'integration', label: 'Integrations' },
            { key: 'security', label: 'Security' },
            { key: 'version', label: 'Version' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap focus:outline-none ${
                activeTab === tab.key 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Left Column (~2/3) */}
            <div className="xl:col-span-2 space-y-6">
              {/* Description Card */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 select-none">Agent Autonomy & Capabilities</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">{agent.description}</p>
                
                {/* Capabilities badges */}
                <div className="flex flex-wrap gap-2 select-none">
                  {Object.entries(agent.capabilityToggles || {}).map(([key, val]) => (
                    <span key={key} className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded border ${
                      val 
                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                        : 'bg-gray-100 text-gray-400 border-gray-200 line-through'
                    }`}>
                      {key}
                    </span>
                  ))}
                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {agent.skillRefs?.length || 0} skills referenced
                  </span>
                </div>
              </div>

              {/* Connection & Publisher Specs */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Connection & Publisher Specs</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs pt-1">
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Declared Endpoint</dt>
                    <dd className="font-mono bg-gray-50 border p-1 px-2 rounded text-gray-700 truncate select-all">{agent.tech?.endpoint || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Gateway Route URL</dt>
                    <dd className="font-mono bg-gray-50 border p-1 px-2 rounded text-gray-700 truncate select-all">{agent.tech?.gatewayUrl || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Publisher Identity</dt>
                    <dd className="font-bold text-gray-700">{agent.publisher?.name || 'Community'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Publisher Email Contact</dt>
                    <dd className="font-mono text-gray-700 select-all">{agent.publisher?.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Authorization Method</dt>
                    <dd className="font-semibold text-gray-700 uppercase">{agent.tech?.authType || 'none'}</dd>
                  </div>
                  {agent.tech?.authType === 'api-key' && (
                    <>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">API Key Header Name</dt>
                        <dd className="font-mono text-gray-700">{(agent.tech as any).apiKeyHeaderName || 'X-API-Key'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Key Format Pattern</dt>
                        <dd className="font-mono text-gray-700">{(agent.tech as any).apiKeyFormat || '—'}</dd>
                      </div>
                    </>
                  )}
                  {agent.tech?.authType === 'oauth2' && (
                    <>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Authorization URL</dt>
                        <dd className="font-mono text-gray-700">{(agent.tech as any).authorizationUrl || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Token URL</dt>
                        <dd className="font-mono text-gray-700">{(agent.tech as any).tokenUrl || '—'}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-gray-400 font-semibold mb-1">Scopes</dt>
                        <dd className="font-mono text-gray-700">{(agent.tech as any).scopes || '—'}</dd>
                      </div>
                    </>
                  )}
                  {agent.tech?.authType === 'bearer' && (
                    <>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Token Endpoint</dt>
                        <dd className="font-mono text-gray-700">{(agent.tech as any).tokenEndpoint || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Refresh URL</dt>
                        <dd className="font-mono text-gray-700">{(agent.tech as any).refreshUrl || '—'}</dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Transport Medium</dt>
                    <dd className="font-semibold text-gray-700 uppercase">{agent.tech?.transport || 'http'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Protocol Version</dt>
                    <dd className="font-mono text-gray-700">{agent.tech?.protocolVersion || '1.0.0'}</dd>
                  </div>
                </dl>
              </div>

              {/* Uptime Stat cards */}
              <div className="grid grid-cols-3 gap-4 select-none">
                <StatCard label="Response Success Rate" value={`${agent.successRatePct || 100}%`} subtext="Past 30 days execution calls" />
                <StatCard label="Avg Response Latency" value={`${agent.avgResponseMs || 0}ms`} subtext="Average workflow completion delay" />
                <StatCard label="Total calls (30d)" value={agent.totalCalls30d?.toLocaleString() || '0'} subtext="Aggregate request response counts" />
              </div>

              {/* Weekly Telemetry calls Chart */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 select-none">Agent Execution & Call History (30d)</h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="calls" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.08} strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column (~1/3) */}
            <div className="space-y-6">
              {/* StatusPillCard */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Operational State</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Health Status</span>
                    <HealthDot status={getHealthDisplay(agent)} showLabel />
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Approval State</span>
                    <span className={`inline-block font-semibold px-2 py-0.5 rounded-full border text-[11px] badge-status-${agent.status}`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Autonomy Level</span>
                    <span className="font-bold text-gray-700">{agent.autonomy || 'Low'}</span>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Transport</span>
                    <span className="font-bold font-mono text-gray-700 uppercase">{agent.tech?.transport || 'http'}</span>
                  </div>
                </div>
              </div>

              {/* Registry & compliance card */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Registry & Compliance</h3>
                <dl className="space-y-3.5 text-xs font-mono">
                  <div>
                    <dt className="text-gray-400 font-sans font-semibold mb-0.5">Registered Timestamp</dt>
                    <dd className="text-gray-700 font-sans font-medium">{new Date(agent.registeredAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-sans font-semibold mb-0.5">Last Config Update</dt>
                    <dd className="text-gray-700 font-sans font-medium">{new Date(agent.updatedAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-sans font-semibold mb-0.5">License Policy Type</dt>
                    <dd className="text-gray-700 font-sans font-bold">{agent.license}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Skills list */}
        {activeTab === 'skills' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={agentSkills}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  sortable: true,
                  render: (row) => (
                    <Link to={`/skills/${row.id}`} className="text-primary hover:underline font-bold">
                      {row.name}
                    </Link>
                  )
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row) => <span className="text-gray-500">{row.description}</span>
                },
                {
                  key: 'version',
                  header: 'Version',
                  render: (row) => <span className="font-mono-custom text-gray-400">v{row.version}</span>
                },
                {
                  key: 'actions',
                  header: 'Action',
                  render: (row: any) => (
                    <button
                      onClick={() => {
                        setSelectedTestSkill(row.id);
                        setTestInput('');
                        setTestResult(null);
                        setTestStatus(null);
                        setIsTestDialogOpen(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
                    >
                      <Play className="w-3 h-3 text-gray-400" />
                      Test
                    </button>
                  )
                }
              ]}
            />
          </div>
        )}

        {/* Tab 3: Audit Log */}
        {activeTab === 'audit-log' && (
          <div className="space-y-4">
            {agent.auditRecords?.length === 0 ? (
              <EmptyState description="No compliance logs exist for this agent." />
            ) : (
              agent.auditRecords?.map((record, idx) => (
                <div 
                  key={idx} 
                  onDoubleClick={() => setSelectedAuditRecord(record)}
                  title="Double click to view configuration diff"
                  className="bg-white border border-gray-200 rounded-md p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:border-gray-300 cursor-pointer select-none transition-colors"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 rounded-full uppercase leading-none">
                        {record.healthStatus}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono-custom select-all">{record.updatedBy}</span>
                    </div>
                    <h4 className="text-xs font-bold text-gray-800">{record.whatChanged}</h4>
                    <p className="text-xs text-gray-500">{record.remark}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-4 self-end md:self-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedAuditRecord(record); }}
                      className="text-[11px] text-primary hover:underline font-bold bg-gray-50 px-2.5 py-1 border border-gray-200 rounded cursor-pointer"
                    >
                      View changes
                    </button>
                    <span className="text-[10px] text-gray-400 font-mono-custom">{new Date(record.editedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Health status */}
        {activeTab === 'health-status' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-md p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm select-none">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-800">System Telemetry & Health Verification</h3>
                <p className="text-xs text-gray-500">Perform real-time status and security scan checklist on the endpoint.</p>
                {currentUser?.role === 'super_admin' && (
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={simulateFail} 
                      onChange={(e) => setSimulateFail(e.target.checked)}
                      disabled={isCheckingHealth}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-xs text-red-600 font-semibold">Simulate failing the scan (updates success rate & healthDot to Unhealthy)</span>
                  </label>
                )}
              </div>
              <button
                onClick={handleRunHealthCheck}
                disabled={isCheckingHealth}
                className={`px-4 py-2 text-xs font-bold rounded cursor-pointer transition-all shrink-0 ${
                  isCheckingHealth 
                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-wait'
                    : 'bg-primary text-primary-foreground hover:opacity-95'
                }`}
              >
                {isCheckingHealth ? 'Running health check...' : 'Run health check'}
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
              <SmartTable 
                data={(agent.healthChecks || []).map((hc: any, idx: number) => ({ ...hc, id: idx }))}
                columns={[
                  {
                    key: 'timestamp',
                    header: 'Timestamp',
                    render: (row: any) => <span className="font-mono-custom text-gray-550">{new Date(row.timestamp).toLocaleString()}</span>
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (row: any) => {
                      const isHealthy = row.status === 'healthy';
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                          isHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          {row.status.toUpperCase()}
                        </span>
                      );
                    }
                  },
                  {
                    key: 'performedBy',
                    header: 'Performed By',
                    render: (row: any) => <span className="font-mono-custom text-gray-400">{row.performedBy}</span>
                  },
                  {
                    key: 'responseMs',
                    header: 'Response time',
                    render: (row: any) => <span className="font-semibold text-gray-700 font-mono-custom">{row.responseMs} ms</span>
                  }
                ]}
              />
            </div>
          </div>
        )}

        {/* Tab 5: Integration */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-md p-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider select-none">Agent A2A API Handshakes</h4>
              <div className="divide-y divide-gray-100 border-t pt-2">
                {[
                  { m: 'GET', r: '.well-known/agent-card.json', d: 'Query metadata and capability profile of the agent' },
                  { m: 'POST', r: 'message/send', d: 'Send transactional commands or conversation texts' },
                  { m: 'POST', r: 'message/stream', d: 'Open server-sent event socket stream' },
                  { m: 'POST', r: 'tasks/get', d: 'Retrieve active task queues and threads logs' },
                  { m: 'POST', r: 'tasks/cancel', d: 'Kill ongoing task cycles directly' }
                ].map((api, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-3.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-50 text-purple-700 border border-purple-200 font-bold px-1.5 py-0.5 rounded font-mono-custom text-[10px]">
                        {api.m}
                      </span>
                      <span className="font-mono-custom font-semibold text-gray-700">/{api.r}</span>
                    </div>
                    <span className="text-gray-400 text-[11px]">{api.d}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider select-none">Client Connection Code</h4>
              <CopyBlock 
                code={
                  `import requests\n\nurl = "${agent.tech?.endpoint || 'http://localhost:5000/agent'}/message/send"\nheaders = {"Authorization": "Bearer token"}\npayload = {"message": "Reconcile June invoice reports"}\n\nresponse = requests.post(url, json=payload, headers=headers)\nprint(response.json())`
                } 
                language="python"
              />
            </div>
          </div>
        )}

        {/* Tab 6: Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 select-none">
              <StatCard label="Security grade" value={getHealthDisplay(agent) === 'Healthy' ? 'A' : 'B'} subtext={`Scanned score: ${agent.trust?.score || 85}`} />
              <StatCard label="Autonomy guardrails" value="Active" subtext="Tool sandboxing policies matching high tier rules" />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider select-none">Declared Permissions Checklist</h4>
              <div className="divide-y divide-gray-100 text-xs border-t pt-2 space-y-2">
                {[
                  { name: 'Executes nested MCP Server tools', val: 'ALLOW' },
                  { name: 'Allocates dynamic memory index store', val: 'ALLOW' },
                  { name: 'Establishes direct sockets to agent collaborations', val: 'DENY' }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5">
                    <span className="font-semibold text-gray-700">{item.name}</span>
                    <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full border ${
                      item.val === 'ALLOW' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Version */}
        {activeTab === 'version' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={(agent.versions || []).map((v: any) => ({ ...v, id: v.version }))}
              columns={[
                {
                  key: 'version',
                  header: 'Version',
                  render: (row: any) => <span className="font-mono-custom font-bold text-gray-800">v{row.version}</span>
                },
                {
                  key: 'date',
                  header: 'Published',
                  render: (row: any) => <span className="font-mono-custom text-gray-500">{new Date(row.date).toLocaleDateString()}</span>
                },
                {
                  key: 'changelog',
                  header: 'Changelog Notes',
                  render: (row: any) => <div className="text-gray-500 prose leading-relaxed max-w-lg" dangerouslySetInnerHTML={{ __html: row.changelog }} />
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: any) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{row.status.toUpperCase()}</span>
                },
                {
                  key: 'active',
                  header: 'Active',
                  render: (row: any) => row.active ? <span className="text-emerald-600 font-bold">Live Active</span> : <span className="text-gray-400">Archived</span>
                }
              ]}
            />
          </div>
        )}

      </div>

      {/* Edit Config Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-55">
                <h3 className="text-sm font-semibold text-gray-800">Edit Agent Config</h3>
                <button type="button" onClick={() => setIsEditOpen(false)} className="text-gray-400 font-bold">✕</button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Agent Name *</label>
                  <input 
                    type="text" 
                    value={editName} 
                    onChange={e => setEditName(e.target.value)} 
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={editDesc} 
                    onChange={e => setEditDesc(e.target.value)} 
                    rows={4}
                    className="w-full px-2.5 py-1.5 border border-gray-255 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-3.5 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Direct confirm Dialog (SA-only) */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <div className="p-5 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-800">Directly Delete A2A Agent</h3>
              <p className="text-xs text-gray-505 leading-relaxed">
                Are you sure you want to delete "{agent.name}"? This operation executes immediately and produces a ChangeRecord.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-55">
              <button onClick={() => setIsDeleteOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer text-xs font-semibold">Cancel</button>
              <button onClick={handleDirectDelete} className="px-3.5 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer text-xs font-semibold">Delete Directly</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Deletion confirm Dialog (Owner) */}
      {isDelReqOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Submit Deletion Request</h3>
              <button type="button" onClick={() => setIsDelReqOpen(false)} className="text-gray-400 font-bold">✕</button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <p className="text-gray-500">Submit a deletion proposal. A Super Admin must audit and approve this delete before execution.</p>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Reason for Deletion (Optional)</label>
                <textarea 
                  value={delReason}
                  onChange={e => setDelReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Agent has been decommissioned..."
                  className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button onClick={() => setIsDelReqOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer text-xs font-semibold">Cancel</button>
              <button onClick={handleSubmitDelReq} className="px-3.5 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer text-xs font-semibold">Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Diff Viewer Modal */}
      {selectedAuditRecord && (() => {
        // Generate deterministic before/after configurations
        const what = (selectedAuditRecord.whatChanged || '').toLowerCase();
        let diff = {
          before: null as any,
          after: {} as any,
          changedFields: [] as string[]
        };

        if (what.includes('health') || what.includes('scan')) {
          diff = {
            before: {
              status: "healthy",
              successRatePct: 99,
              avgResponseMs: 12,
              totalCalls30d: agent.totalCalls30d || 140,
              lastVerified: new Date(new Date(selectedAuditRecord.editedAt).getTime() - 24 * 3600 * 1000).toISOString()
            },
            after: {
              status: "unhealthy",
              successRatePct: 78,
              avgResponseMs: 380,
              totalCalls30d: (agent.totalCalls30d || 140) + 1,
              lastVerified: selectedAuditRecord.editedAt
            },
            changedFields: ['status', 'successRatePct', 'avgResponseMs', 'totalCalls30d', 'lastVerified']
          };
        } else if (what.includes('disabled') || what.includes('enabled') || what.includes('toggle')) {
          const isOff = what.includes('disable') || what.includes('off');
          diff = {
            before: {
              enabled: isOff,
              updatedAt: new Date(new Date(selectedAuditRecord.editedAt).getTime() - 3600 * 1000).toISOString()
            },
            after: {
              enabled: !isOff,
              updatedAt: selectedAuditRecord.editedAt
            },
            changedFields: ['enabled', 'updatedAt']
          };
        } else if (what.includes('registered') || what.includes('create')) {
          diff = {
            before: null,
            after: {
              name: agent.name,
              version: agent.version,
              status: "pending",
              visibility: "private"
            },
            changedFields: ['name', 'version', 'status', 'visibility']
          };
        } else {
          diff = {
            before: {
              description: "Initial workspace configurations and capability profiles.",
              version: "1.0.0",
              updatedAt: new Date(new Date(selectedAuditRecord.editedAt).getTime() - 12 * 3600 * 1000).toISOString()
            },
            after: {
              description: agent.description,
              version: agent.version,
              updatedAt: selectedAuditRecord.editedAt
            },
            changedFields: ['description', 'version', 'updatedAt']
          };
        }

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 backdrop-blur-sm select-none">
            <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[85vh] z-50">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
                <div>
                  <h2 className="text-sm font-bold text-gray-800">Audit Configuration Diff</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5 font-semibold font-mono-custom">
                    {selectedAuditRecord.whatChanged} · Edited by {selectedAuditRecord.updatedBy}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedAuditRecord(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold px-2.5 py-1 border border-gray-255 rounded bg-white cursor-pointer focus:outline-none"
                >
                  Close
                </button>
              </div>

              {/* Side-by-side panels */}
              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0 bg-gray-50/20">
                {/* Before (Red) */}
                <div className="border border-red-150 rounded-lg bg-red-50/10 p-4 flex flex-col">
                  <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-3 block">
                    Before State (- Removed / Old Value)
                  </span>
                  {diff.before ? (
                    <div className="font-mono text-xs text-gray-700 bg-white border border-red-100 rounded p-3 overflow-auto flex-1 select-all">
                      {Object.entries(diff.before).map(([key, val]) => {
                        const isChanged = diff.changedFields.includes(key);
                        return (
                          <div key={key} className={`py-0.5 px-1 rounded ${isChanged ? 'bg-red-50 text-red-800 font-semibold line-through' : ''}`}>
                            <span className="text-gray-400">{key}:</span> {String(val)}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-xs text-center py-12 bg-white border border-gray-150 rounded flex-1 flex items-center justify-center font-sans">
                      — No previous state (New Asset Creation) —
                    </div>
                  )}
                </div>

                {/* After (Green) */}
                <div className="border border-emerald-150 rounded-lg bg-emerald-50/10 p-4 flex flex-col">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-3 block">
                    After State (+ Added / Modified Value)
                  </span>
                  <div className="font-mono text-xs text-gray-700 bg-white border border-emerald-100 rounded p-3 overflow-auto flex-1 select-all">
                    {Object.entries(diff.after).map(([key, val]) => {
                      const isChanged = diff.changedFields.includes(key);
                      return (
                        <div key={key} className={`py-0.5 px-1 rounded ${isChanged ? 'bg-emerald-50 text-emerald-800 font-bold' : ''}`}>
                          <span className="text-gray-400">{key}:</span> {String(val)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-3 border-t border-gray-150 bg-gray-50/50 flex justify-end rounded-b-lg">
                <span className="text-[10px] font-mono-custom text-gray-400 self-center">
                  Timestamp: {new Date(selectedAuditRecord.editedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Test Dialog */}
      {isTestDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 backdrop-blur-sm select-none" onClick={() => setIsTestDialogOpen(false)}>
          <div className="bg-white border border-gray-255 rounded-lg shadow-xl max-w-xl w-full flex flex-col max-h-[90vh] z-50" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 rounded-t-lg">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Test Agent: {agent.name}</h2>
                <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">Simulate agent interaction using selected skill reference or direct command.</p>
              </div>
              <button 
                onClick={() => setIsTestDialogOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1 border border-transparent rounded focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 gap-4">
                {/* Select Skill */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Target Skill Reference</label>
                  <select 
                    value={selectedTestSkill}
                    onChange={(e) => setSelectedTestSkill(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded p-2 focus:ring-1 focus:ring-primary focus:outline-none bg-white font-semibold text-gray-700"
                  >
                    <option value="">Custom / Direct Message (No Skill Ref)</option>
                    {agentSkills.map((sk: any) => (
                      <option key={sk.id} value={sk.id}>{sk.name} (v{sk.version})</option>
                    ))}
                  </select>
                </div>

                {/* Input Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Test Prompt Input</label>
                  <textarea 
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    placeholder="Enter message or prompt context to test... (Include 'error' or 'fail' to test execution failure)"
                    className="w-full h-24 text-xs border border-gray-200 rounded p-2.5 focus:ring-1 focus:ring-primary focus:outline-none font-mono-custom text-gray-700 bg-white"
                  />
                </div>
              </div>

              {/* Simulation Result */}
              {isRunningTest && (
                <div className="p-4 border border-dashed rounded bg-gray-50 flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mb-2"></div>
                  <span className="text-xs text-gray-400 font-bold">Running skill coordination logic simulation...</span>
                </div>
              )}

              {testResult && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Simulation Outcome</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      testStatus === 'success' 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                        : 'bg-rose-50 border-rose-300 text-rose-800'
                    }`}>
                      {testStatus}
                    </span>
                  </label>
                  <CopyBlock code={JSON.stringify(testResult, null, 2)} language="json" />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-150 bg-gray-50/50 flex justify-between items-center rounded-b-lg">
              <label className="flex items-center gap-1.5 text-xs text-gray-550 select-none cursor-pointer">
                <input 
                  type="checkbox"
                  checked={simulateFail}
                  onChange={(e) => setSimulateFail(e.target.checked)}
                  className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Simulate Node Failure</span>
              </label>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setIsTestDialogOpen(false)}
                  className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  disabled={isRunningTest}
                  onClick={handleRunTest}
                  className="px-3.5 py-1.5 rounded bg-primary text-white hover:bg-primary/95 cursor-pointer text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunningTest ? 'Simulating...' : 'Run Simulation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
