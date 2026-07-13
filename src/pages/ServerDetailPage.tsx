import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { 
  EntityIcon, CatPill, StatusBadge, HealthDot, RatePopover, BookmarkToggle, 
  EnableToggle, TestButton, EmptyState, CopyBlock
} from '@/components/registry/Kit';
import { SmartTable, StatCard } from '@/components/registry/Primitives';
import { 
  Edit, Globe, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export const ServerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    mcpServers, currentUser, bookmarks, toggleBookmark, rateItem, 
    updateItem, setItemDisabled, setItemVisibility, requestDeletion, 
    cancelDeletionRequest, deleteItemDirect, can, workspaces, toggleCapabilityItem, getHealthDisplay
  } = useRegistry();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [integrationLang, setIntegrationLang] = useState<'ts' | 'python'>('ts');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [simulateFail, setSimulateFail] = useState(false);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<any | null>(null);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDelReqOpen, setIsDelReqOpen] = useState(false);
  const [delReason, setDelReason] = useState('');
  
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Find asset
  const server = mcpServers.find(s => s.id === id);

  useEffect(() => {
    if (server) {
      setEditName(server.name);
      setEditDesc(server.description);
    }
  }, [server]);

  // Handle tab URL syncing
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  if (!server) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-sm font-bold text-gray-800">MCP Server not found.</h2>
        <button 
          onClick={() => navigate('/catalog')}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isBookmarked = bookmarks.server?.includes(server.id) || false;
  const isOwner = currentUser?.name === server.ownerName;
  const showEditButton = (isOwner && (server.status === 'pending' || server.status === 'in_review')) || (currentUser?.role === 'super_admin');

  // Chart telemetry data
  const chartData = server.weeklyCalls?.map((calls, idx) => ({
    week: `W${idx + 1}`,
    calls,
    errors: server.weeklyErrors?.[idx] || 0
  })) || [];



  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Name is required.');
      return;
    }
    updateItem('server', server.id, { name: editName, description: editDesc });
    setIsEditOpen(false);
  };

  const handleDirectDelete = () => {
    deleteItemDirect('server', server.id);
    navigate('/catalog');
    toast.success('MCP Server deleted.');
  };

  const handleSubmitDelReq = () => {
    requestDeletion('server', server.id, delReason);
    setIsDelReqOpen(false);
  };

  const handleCancelDelReq = () => {
    cancelDeletionRequest('server', server.id);
  };

  const handleRunHealthCheck = () => {
    setIsCheckingHealth(true);
    toast.info('Initializing system health check scan...');
    
    setTimeout(() => {
      if (simulateFail) {
        toast.error('Health scan complete: Critical threat threshold failure!');
        
        const nextTelemetry = {
          uptimePct: 88.4,
          p95LatencyMs: 184,
          errorRatePct: 12.5
        };

        const checkRecord = {
          timestamp: new Date().toISOString(),
          status: 'unhealthy',
          performedBy: currentUser?.name || 'System Scanner',
          responseMs: 184
        };

        const auditRecord = {
          editedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'System Scanner',
          healthStatus: 'Unhealthy',
          whatChanged: 'System Health Scan failed security threshold',
          remark: 'Manual simulation trigger: asset returned unhealthy status code and telemetry checks failed.'
        };

        updateItem('server', server.id, {
          health: {
            ...server.health,
            status: 'unhealthy',
            ...nextTelemetry
          },
          healthChecks: [checkRecord, ...(server.healthChecks || [])],
          auditRecords: [auditRecord, ...(server.auditRecords || [])]
        });
      } else {
        toast.success('Health scan complete: All telemetry components healthy.');
        const nextTelemetry = {
          uptimePct: 99.9,
          p95LatencyMs: 14,
          errorRatePct: 0.01
        };

        const checkRecord = {
          timestamp: new Date().toISOString(),
          status: 'healthy',
          performedBy: currentUser?.name || 'System Scanner',
          responseMs: 14
        };

        const auditRecord = {
          editedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'System Scanner',
          healthStatus: 'Healthy',
          whatChanged: 'System Health Scan passed successfully',
          remark: 'Manual simulation trigger: asset telemetry verification successfully returned status healthy.'
        };

        updateItem('server', server.id, {
          health: {
            ...server.health,
            status: 'healthy',
            ...nextTelemetry
          },
          healthChecks: [checkRecord, ...(server.healthChecks || [])],
          auditRecords: [auditRecord, ...(server.auditRecords || [])]
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
          <EntityIcon kind="server" size="sm" />
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-gray-800 truncate">{server.name}</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono-custom">v{server.version} · {server.publisher?.name || 'Community'}</p>
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            <StatusBadge status={server.status} disabled={server.disabled} deletionRequested={server.deletionRequested} />
            <HealthDot status={server.health?.status || 'healthy'} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <BookmarkToggle isBookmarked={isBookmarked} onToggle={() => toggleBookmark('server', server.id)} />
          <RatePopover itemId={server.id} currentRating={server.rating} onRate={(r) => rateItem('server', server.id, r)} />
          
          {/* Enable/Disable Switch (Owner/SA) */}
          {can('toggle-disabled', server) && (
            <div className="flex items-center gap-2 border border-gray-200 rounded px-2.5 py-1 bg-white text-xs select-none">
              <span className="text-[11px] font-semibold text-gray-500">Enabled</span>
              <EnableToggle checked={!server.disabled} onChange={(checked) => setItemDisabled('server', server.id, !checked)} />
            </div>
          )}

          {/* Visibility Popover (Owner/SA) */}
          {can('set-visibility', server) && (
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
                        checked={server.visibility?.global || false} 
                        onChange={(e) => setItemVisibility('server', server.id, {
                          global: e.target.checked,
                          workspaceIds: server.visibility?.workspaceIds || []
                        })}
                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workspaces Share</span>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {workspaces.map(ws => {
                          const isChecked = server.visibility?.workspaceIds?.includes(ws.id) || false;
                          return (
                            <label key={ws.id} className="flex items-center gap-2 text-xs p-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const list = server.visibility?.workspaceIds || [];
                                  const nextList = e.target.checked 
                                    ? [...list, ws.id]
                                    : list.filter(wId => wId !== ws.id);
                                  setItemVisibility('server', server.id, {
                                    global: server.visibility?.global || false,
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
            server.deletionRequested ? (
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

      {/* 9 Detail Tabs Strip */}
      <div className="px-6 border-b border-gray-200 bg-white select-none">
        <div className="flex items-center gap-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'tools', label: `Tools (${server.tools?.length || 0})` },
            { key: 'resources', label: `Resources (${server.resources?.length || 0})` },
            { key: 'prompts', label: `Prompts (${server.prompts?.length || 0})` },
            { key: 'audit-log', label: 'Audit Log' },
            { key: 'health-status', label: 'Health status' },
            { key: 'integration', label: 'Integration' },
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
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 select-none">Capabilities & Features</h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">{server.description}</p>
                
                {/* Capabilities badges row */}
                <div className="flex flex-wrap gap-2 select-none">
                  {server.capabilities?.tools !== false && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 border border-blue-100">
                      {server.tools?.filter(t => !t.disabled).length || 0} tools · {server.tools?.length || 0} total
                    </span>
                  )}
                  {server.capabilities?.resources !== false && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 text-teal-700 border border-teal-100">
                      {server.resources?.filter(r => !r.disabled).length || 0} resources · {server.resources?.length || 0} total
                    </span>
                  )}
                  {server.capabilities?.prompts !== false && (
                    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded bg-orange-50 text-orange-700 border border-orange-100">
                      {server.prompts?.filter(p => !p.disabled).length || 0} prompts · {server.prompts?.length || 0} total
                    </span>
                  )}
                </div>
              </div>

              {/* Connection & Publisher Card */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Connection & Publisher Specs</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs pt-1">
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Declared Endpoint</dt>
                    <dd className="font-mono bg-gray-50 border p-1 px-2 rounded text-gray-700 truncate select-all">{server.tech?.endpoint || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Gateway Route URL</dt>
                    <dd className="font-mono bg-gray-50 border p-1 px-2 rounded text-gray-700 truncate select-all">{server.tech?.gatewayUrl || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Publisher Identity</dt>
                    <dd className="font-bold text-gray-700">{server.publisher?.name || 'Community'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Publisher Email Contact</dt>
                    <dd className="font-mono text-gray-700 select-all">{server.publisher?.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Authorization Method</dt>
                    <dd className="font-semibold text-gray-700 uppercase">{server.tech?.authType || 'none'}</dd>
                  </div>
                  {server.tech?.authType === 'api-key' && (
                    <>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">API Key Header Name</dt>
                        <dd className="font-mono text-gray-700">{(server.tech as any).apiKeyHeaderName || 'X-API-Key'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Key Format Pattern</dt>
                        <dd className="font-mono text-gray-700">{(server.tech as any).apiKeyFormat || '—'}</dd>
                      </div>
                    </>
                  )}
                  {server.tech?.authType === 'oauth2' && (
                    <>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Authorization URL</dt>
                        <dd className="font-mono text-gray-700">{(server.tech as any).authorizationUrl || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Token URL</dt>
                        <dd className="font-mono text-gray-700">{(server.tech as any).tokenUrl || '—'}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-gray-400 font-semibold mb-1">Scopes</dt>
                        <dd className="font-mono text-gray-700">{(server.tech as any).scopes || '—'}</dd>
                      </div>
                    </>
                  )}
                  {server.tech?.authType === 'bearer' && (
                    <>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Token Endpoint</dt>
                        <dd className="font-mono text-gray-700">{(server.tech as any).tokenEndpoint || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 font-semibold mb-1">Refresh URL</dt>
                        <dd className="font-mono text-gray-700">{(server.tech as any).refreshUrl || '—'}</dd>
                      </div>
                    </>
                  )}
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Transport Medium</dt>
                    <dd className="font-semibold text-gray-700 uppercase">{server.tech?.transport || 'http'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Protocol Version</dt>
                    <dd className="font-mono text-gray-700">{server.tech?.protocolVersion || '1.0.0'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Resource URLs</dt>
                    <dd className="flex items-center gap-3">
                      {server.tech?.docsUrl && (
                        <a href={server.tech.docsUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Docs</a>
                      )}
                      {server.tech?.sourceUrl && (
                        <a href={server.tech.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Source Code</a>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Uptime Stat cards */}
              <div className="grid grid-cols-3 gap-4 select-none">
                <StatCard label="Health Uptime" value={`${server.health?.uptimePct || 100}%`} subtext="Past 30 days status checks" />
                <StatCard label="p95 Response Latency" value={`${server.health?.p95LatencyMs || 0}ms`} subtext="Average request response delay" />
                <StatCard label="Error Rate" value={`${server.health?.errorRatePct || 0}%`} subtext="Failed request percentage" />
              </div>

              {/* Weekly Telemetry calls Chart */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 select-none">Calls & Telemetry Usage History (30d)</h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="week" stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="calls" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.08} strokeWidth={1.5} />
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
                    <HealthDot status={getHealthDisplay(server)} showLabel />
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Approval State</span>
                    <span className={`inline-block font-semibold px-2 py-0.5 rounded-full border text-[11px] badge-status-${server.status}`}>
                      {server.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Asset Class</span>
                    <span className="font-bold text-gray-700">MCP Server</span>
                  </div>
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Transport</span>
                    <span className="font-bold font-mono text-gray-700 uppercase">{server.tech?.transport || 'stdio'}</span>
                  </div>
                </div>
              </div>

              {/* Registry & compliance card */}
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-gray-800 border-b pb-2">Registry & Compliance</h3>
                <dl className="space-y-3.5 text-xs font-mono">
                  <div>
                    <dt className="text-gray-400 font-sans font-semibold mb-0.5">Registered Timestamp</dt>
                    <dd className="text-gray-700 font-sans font-medium">{new Date(server.registeredAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-sans font-semibold mb-0.5">Last Config Update</dt>
                    <dd className="text-gray-700 font-sans font-medium">{new Date(server.updatedAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-sans font-semibold mb-0.5">License Policy Type</dt>
                    <dd className="text-gray-700 font-sans font-bold">{server.license}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tools */}
        {activeTab === 'tools' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={(server.tools || []).map((t: any) => ({ ...t, id: t.name }))}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  sortable: true,
                  render: (row: any) => <span className="font-mono-custom text-gray-800 select-all font-bold">{row.name}</span>
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row: any) => <span className="text-gray-500">{row.description}</span>
                },
                {
                  key: 'similar',
                  header: 'Similar Tools',
                  render: (row: any) => {
                    const similar = row.similar || [];
                    if (similar.length === 0) return <span className="text-gray-400">—</span>;
                    return (
                      <div className="flex flex-wrap gap-1.5">
                        {similar.map((s: any) => <CatPill key={s} text={s} />)}
                      </div>
                    );
                  }
                },
                {
                  key: 'invocations30d',
                  header: 'Invocations (30d)',
                  sortable: true,
                  render: (row: any) => <span className="font-mono-custom text-gray-600">{row.invocations30d?.toLocaleString() || 0}</span>
                },
                {
                  key: 'actions',
                  header: 'Action',
                  render: (row: any) => {
                    const isItemDisabled = !!row.disabled;
                    return (
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold ${isItemDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
                          {isItemDisabled ? 'Off' : 'On'}
                        </span>
                        <EnableToggle 
                          checked={!isItemDisabled} 
                          onChange={() => toggleCapabilityItem(server.id, 'tools', row.name)}
                          disabled={!can('toggle-capability', server)}
                        />
                        <TestButton name={row.name} kind="tool" disabled={isItemDisabled} />
                      </div>
                    );
                  }
                }
              ]}
              renderExpanded={(row: any) => (
                <div className="space-y-3 text-xs text-gray-600 max-w-3xl">
                  <div>
                    <span className="font-bold text-gray-800 block mb-0.5">Description:</span>
                    <p className="leading-relaxed">{row.description || 'No description provided.'}</p>
                  </div>
                  {row.params && (
                    <div>
                      <span className="font-bold text-gray-800 block mb-1">Input Schema:</span>
                      <CopyBlock code={JSON.stringify(row.params, null, 2)} language="json" />
                    </div>
                  )}
                  {row.outputSchema && (
                    <div>
                      <span className="font-bold text-gray-800 block mb-1">Output Schema:</span>
                      <CopyBlock code={JSON.stringify(row.outputSchema, null, 2)} language="json" />
                    </div>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {/* Tab 3: Resources */}
        {activeTab === 'resources' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={(server.resources || []).map((r: any) => ({ ...r, id: r.name }))}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  sortable: true,
                  render: (row: any) => <span className="font-semibold text-gray-800">{row.name}</span>
                },
                {
                  key: 'uriPattern',
                  header: 'URI Pattern',
                  render: (row: any) => <span className="font-mono-custom text-gray-550 select-all">{row.uriPattern}</span>
                },
                {
                  key: 'mimeType',
                  header: 'MIME Type',
                  render: (row: any) => <span className="font-mono-custom text-gray-400">{row.mimeType}</span>
                },
                {
                  key: 'actions',
                  header: 'Action',
                  render: (row: any) => {
                    const isItemDisabled = !!row.disabled;
                    return (
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold ${isItemDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
                          {isItemDisabled ? 'Off' : 'On'}
                        </span>
                        <EnableToggle 
                          checked={!isItemDisabled} 
                          onChange={() => toggleCapabilityItem(server.id, 'resources', row.name)}
                          disabled={!can('toggle-capability', server)}
                        />
                        <TestButton name={row.name} kind="resource" disabled={isItemDisabled} />
                      </div>
                    );
                  }
                }
              ]}
              renderExpanded={(row: any) => (
                <div className="space-y-2 text-xs text-gray-600">
                  <div>
                    <span className="font-bold text-gray-800">Description: </span>
                    {row.description || 'No description provided.'}
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">File size: </span>
                    {row.size || '14.2 KB'}
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">MIME type: </span>
                    {row.mimeType || 'application/json'}
                  </div>
                  <div>
                    <span className="font-bold text-gray-800">About: </span>
                    {row.about || 'Dynamic structured context resource for general agent catalog operations.'}
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* Tab 4: Prompts */}
        {activeTab === 'prompts' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={(server.prompts || []).map((p: any) => ({ ...p, id: p.name }))}
              columns={[
                {
                  key: 'name',
                  header: 'Name',
                  sortable: true,
                  render: (row: any) => <span className="font-mono-custom text-gray-800 font-bold">{row.name}</span>
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row: any) => <span className="text-gray-550">{row.description}</span>
                },
                {
                  key: 'argCount',
                  header: 'Arguments',
                  sortable: true,
                  render: (row: any) => <span className="font-mono-custom text-gray-600 font-bold">{row.argCount}</span>
                },
                {
                  key: 'actions',
                  header: 'Action',
                  render: (row: any) => {
                    const isItemDisabled = !!row.disabled;
                    return (
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold ${isItemDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
                          {isItemDisabled ? 'Off' : 'On'}
                        </span>
                        <EnableToggle 
                          checked={!isItemDisabled} 
                          onChange={() => toggleCapabilityItem(server.id, 'prompts', row.name)}
                          disabled={!can('toggle-capability', server)}
                        />
                        <TestButton name={row.name} kind="prompt" disabled={isItemDisabled} />
                      </div>
                    );
                  }
                }
              ]}
              renderExpanded={(row: any) => {
                const hasArgs = row.argCount > 0 || (row.args && row.args.length > 0);
                return (
                  <div className="space-y-3 text-xs text-gray-600">
                    <div>
                      <span className="font-bold text-gray-800">Description: </span>
                      {row.description || 'No description provided.'}
                    </div>
                    {hasArgs && (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800">Arguments:</span>
                          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border border-red-200 bg-red-50 text-red-700">
                            Arguments required
                          </span>
                        </div>
                        <div className="border border-gray-150 rounded overflow-hidden max-w-md bg-white">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-150">
                              <tr className="text-[10px] font-bold text-gray-400 uppercase">
                                <th className="px-3 py-1.5">Name</th>
                                <th className="px-3 py-1.5">Type</th>
                                <th className="px-3 py-1.5">Required</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-[11px]">
                              {(row.args || [{ name: 'query', type: 'string', required: true }]).map((arg: any) => (
                                <tr key={arg.name}>
                                  <td className="px-3 py-1.5 font-mono text-gray-700">{arg.name}</td>
                                  <td className="px-3 py-1.5 text-gray-500">{arg.type || 'string'}</td>
                                  <td className="px-3 py-1.5 font-semibold text-gray-700">{arg.required ? 'Yes' : 'No'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />
          </div>
        )}

        {/* Tab 5: Audit Log */}
        {activeTab === 'audit-log' && (
          <div className="space-y-4">
            {server.auditRecords?.length === 0 ? (
              <EmptyState description="No compliance logs exist for this server." />
            ) : (
              server.auditRecords?.map((record, idx) => (
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

        {/* Tab 6: Health status */}
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
                    <span className="text-xs text-red-600 font-semibold">Simulate failing the scan (updates error rate & healthDot to Unhealthy)</span>
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
                data={(server.healthChecks || []).map((hc: any, idx: number) => ({ ...hc, id: idx }))}
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

        {/* Tab 7: Integration */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between select-none">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Client connection snippets</span>
              <div className="flex border border-gray-200 rounded overflow-hidden shadow-sm shrink-0">
                <button
                  onClick={() => setIntegrationLang('ts')}
                  className={`p-1 px-3 text-xs font-semibold select-none cursor-pointer focus:outline-none ${
                    integrationLang === 'ts' ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setIntegrationLang('python')}
                  className={`p-1 px-3 text-xs font-semibold select-none cursor-pointer focus:outline-none ${
                    integrationLang === 'python' ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Python
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider select-none">Prerequisites</h4>
              <p className="text-xs text-gray-500">Install the required modelcontextprotocol client library packages:</p>
              <CopyBlock 
                code={integrationLang === 'ts' ? `npm install @modelcontextprotocol/sdk` : `pip install mcp`} 
                language="bash"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider select-none">Client Connection Code</h4>
              <CopyBlock 
                code={integrationLang === 'ts' 
                  ? `import { Client } from "@modelcontextprotocol/sdk/client/index.js";\nimport { HttpClientTransport } from "@modelcontextprotocol/sdk/client/http.js";\n\nconst transport = new HttpClientTransport({\n  url: "${server.tech?.endpoint || 'http://localhost:8080/mcp'}"\n});\n\nconst client = new Client({\n  name: "custom-reconciler-client",\n  version: "1.0.0"\n});\n\nawait client.connect(transport);\nconsole.log("Connected directly to MCP Server");`
                  : `import asyncio\nfrom mcp import ClientSession\nfrom mcp.client.http import http_client\n\nasync def run():\n    async with http_client("${server.tech?.endpoint || 'http://localhost:8080/mcp'}") as (read, write):\n        async with ClientSession(read, write) as session:\n            await session.initialize()\n            print("Connection successful!")\n\nasyncio.run(run())`
                } 
                language={integrationLang === 'ts' ? 'typescript' : 'python'}
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-5 space-y-4">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider select-none">Available API Routes</h4>
              <div className="divide-y divide-gray-100">
                {[
                  { m: 'POST', r: 'tools/list', d: 'Query all registered tools payload schema' },
                  { m: 'POST', r: 'tools/call', d: 'Invoke tool commands inside target server container' },
                  { m: 'POST', r: 'prompts/list', d: 'Retrieve all configured prompt templates' },
                  { m: 'POST', r: 'prompts/get', d: 'Access specific compiled prompt variables' },
                  { m: 'POST', r: 'resources/list', d: 'Query resources schema maps' },
                  { m: 'POST', r: 'resources/read', d: 'Read raw resource text content' }
                ].map((api, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-50 text-blue-700 border border-blue-200 font-bold px-1.5 py-0.5 rounded font-mono-custom text-[10px]">
                        {api.m}
                      </span>
                      <span className="font-mono-custom font-semibold text-gray-700">/{api.r}</span>
                    </div>
                    <span className="text-gray-400 text-[11px]">{api.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Security */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4 select-none">
              <StatCard label="Security grade" value={getHealthDisplay(server) === 'Healthy' ? 'A+' : 'C'} subtext={`Scanned score: ${server.trust?.score || 85}`} />
              <StatCard label="Compliance Status" value="Healthy" subtext="No threat injections caught" />
              <StatCard label="Sandbox Level" value="Compartment" subtext="No local root writing allowed" />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 select-none">8-Rule Scan Matrix</h3>
              <SmartTable 
                data={[
                  { id: 'esc', rule: 'Sandbox escapes protection', severity: 'High', status: 'pass', detail: 'Prevents reading files outside directory scopes.' },
                  { id: 'dep', rule: 'Third-party dependencies scans', severity: 'High', status: 'pass', detail: '0 vulnerabilities detected in NPM packages tree.' },
                  { id: 'net', rule: 'Undeclared network requests checks', severity: 'Medium', status: 'pass', detail: 'Adheres strictly to network bindings.' },
                  { id: 'sec', rule: 'Hardcoded secrets audit', severity: 'High', status: 'pass', detail: 'No static credentials or api keys found.' },
                  { id: 'proc', rule: 'Process execution restriction', severity: 'Medium', status: 'pass', detail: 'Spawns are jailed inside client limits.' },
                  { id: 'mem', rule: 'Memory limits allocation limits', severity: 'Low', status: 'pass', detail: 'Under 100MB runtime buffer usage.' },
                  { id: 'lic', rule: 'License validation match', severity: 'Low', status: 'pass', detail: 'Permissive MIT matches policies.' },
                  { id: 'obf', rule: 'Obfuscated logic checks', severity: 'Medium', status: 'pass', detail: 'Zero base64 binary blocks matched.' }
                ]}
                columns={[
                  { key: 'rule', header: 'Compliance rule', render: (row: any) => <span className="font-semibold text-gray-700">{row.rule}</span> },
                  { key: 'severity', header: 'Severity', render: (row: any) => <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${row.severity === 'High' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{row.severity}</span> },
                  { key: 'status', header: 'Status', render: () => <span className="text-emerald-700 font-bold uppercase">Pass</span> },
                  { key: 'detail', header: 'Detail', render: (row: any) => <span className="text-gray-400">{row.detail}</span> }
                ]}
              />
            </div>
          </div>
        )}

        {/* Tab 9: Version */}
        {activeTab === 'version' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={(server.versions || []).map((v: any) => ({ ...v, id: v.version }))}
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
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Edit Asset Config</h3>
                <button type="button" onClick={() => setIsEditOpen(false)} className="text-gray-400 font-bold">✕</button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Asset Name *</label>
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
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
              <h3 className="text-sm font-bold text-gray-800">Directly Delete MCP Server</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete "{server.name}"? This operation executes immediately and produces a ChangeRecord.
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
                  placeholder="e.g. Server has been decommissioned..."
                  className="w-full px-2.5 py-1.5 border border-gray-255 rounded focus:outline-none focus:ring-1 focus:ring-primary"
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
              uptimePct: 99.8,
              errorRatePct: 0.05,
              p95LatencyMs: 14,
              lastVerified: new Date(new Date(selectedAuditRecord.editedAt).getTime() - 24 * 3600 * 1000).toISOString()
            },
            after: {
              status: "unhealthy",
              uptimePct: 88.4,
              errorRatePct: 12.5,
              p95LatencyMs: 184,
              lastVerified: selectedAuditRecord.editedAt
            },
            changedFields: ['status', 'uptimePct', 'errorRatePct', 'p95LatencyMs', 'lastVerified']
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
              name: server.name,
              version: server.version,
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
              description: server.description,
              version: server.version,
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
                  className="text-gray-400 hover:text-gray-600 text-xs font-semibold px-2.5 py-1 border border-gray-250 rounded bg-white cursor-pointer focus:outline-none"
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

    </div>
  );
};
