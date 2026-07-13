import React, { useState, useMemo } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { SmartTable } from '@/components/registry/Primitives';
import {
  EntityIcon, StatusBadge, HealthDot
} from '@/components/registry/Kit';
import { 
  Check, X, Undo2, AlertTriangle, Search, ChevronDown, ChevronRight, FileText
} from 'lucide-react';
import { toast } from 'sonner';

export const ApprovalsPage: React.FC = () => {
  const { 
    currentUser, getApprovals, approveItem, rejectItem, markInReview,
    changeHistory, revertChange, can, workspaces, getHealthDisplay
  } = useRegistry();

  const isSA = currentUser?.role === 'super_admin';
  const { yourSubmissions, registrationQueue } = getApprovals();

  // Navigation & filter states
  const [selectedKindTab, setSelectedKindTab] = useState<'all' | 'server' | 'agent' | 'skill' | 'prompt'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<string>('diff');
  
  // Collapsible rails
  const [sectionsExpanded, setSectionsExpanded] = useState<Record<string, boolean>>({
    registrations: true,
    versions: true,
    deletions: true
  });

  // Bulk selections
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'approve' | 'reject' | null>(null);

  // Group queue items
  const filteredQueue = useMemo(() => {
    return registrationQueue.filter((asset: any) => {
      if (selectedKindTab !== 'all' && asset.kind !== selectedKindTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(q) || 
          asset.ownerName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [registrationQueue, selectedKindTab, searchQuery]);

  const groupedQueue = useMemo(() => {
    const registrations: any[] = [];
    const newVersions: any[] = [];
    const deletionRequests: any[] = [];

    filteredQueue.forEach((asset: any) => {
      if (asset.deletionRequested) {
        deletionRequests.push(asset);
      } else if (asset.versions?.some((v: any) => (v.status === 'pending' || v.status === 'in_review') && !v.active)) {
        newVersions.push(asset);
      } else {
        registrations.push(asset);
      }
    });

    return { registrations, newVersions, deletionRequests };
  }, [filteredQueue]);

  // Find currently selected item in queue
  const selectedItem = registrationQueue.find((a: any) => a.id === selectedAssetId) || null;

  // Track subtab defaults when selected item changes
  React.useEffect(() => {
    if (selectedItem) {
      if (selectedItem.deletionRequested) {
        setActiveSubTab('deletion-context');
      } else if (selectedItem.versions?.some((v: any) => v.status === 'pending' && !v.active)) {
        setActiveSubTab('diff');
      } else {
        setActiveSubTab('overview');
      }
    }
  }, [selectedAssetId]);

  const handleAction = (asset: any, action: 'approved' | 'rejected' | 'in_review') => {
    if (action === 'approved') {
      approveItem(asset.kind, asset.id);
      toast.success(`Request approved successfully.`);
    } else if (action === 'rejected') {
      rejectItem(asset.kind, asset.id);
      toast.error(`Request rejected.`);
    } else if (action === 'in_review') {
      markInReview(asset.kind, asset.id);
      toast.info(`Request marked In Review.`);
    }
    // Select next item in list if possible
    const index = filteredQueue.findIndex(a => a.id === asset.id);
    if (filteredQueue.length > 1) {
      const nextItem = filteredQueue[index + 1] || filteredQueue[index - 1];
      setSelectedAssetId(nextItem.id);
    } else {
      setSelectedAssetId(null);
    }
  };

  const toggleSection = (section: string) => {
    setSectionsExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBulkAction = () => {
    if (!bulkActionType || selectedRequestIds.length === 0) return;
    
    selectedRequestIds.forEach(id => {
      const asset = registrationQueue.find((a: any) => a.id === id);
      if (asset) {
        if (bulkActionType === 'approve') {
          approveItem(asset.kind, asset.id);
        } else {
          rejectItem(asset.kind, asset.id);
        }
      }
    });

    toast.success(`Bulk ${bulkActionType}d ${selectedRequestIds.length} requests.`);
    setSelectedRequestIds([]);
    setIsBulkDialogOpen(false);
    setSelectedAssetId(null);
  };

  // Keyboard navigation for rail selection walking
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredQueue.length === 0) return;
    const currentIndex = filteredQueue.findIndex(a => a.id === selectedAssetId);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % filteredQueue.length;
      setSelectedAssetId(filteredQueue[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + filteredQueue.length) % filteredQueue.length;
      setSelectedAssetId(filteredQueue[prevIndex].id);
    }
  };

  // Submissions page columns for End Users
  const userSubmissionsColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <EntityIcon kind={row.kind} size="sm" />
          <span className="font-semibold text-gray-800">{row.name}</span>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Submission Type',
      render: (row: any) => <span className="text-[10px] font-bold border px-1.5 py-0.5 rounded bg-gray-50 text-gray-550 uppercase">{row.type}</span>
    },
    {
      key: 'date',
      header: 'Submitted',
      render: (row: any) => <span className="font-mono-custom text-gray-550">{new Date(row.date).toLocaleDateString()}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={row.status} />
          {row.status === 'pending' && <span className="text-[10px] text-gray-400 font-medium italic">(Awaiting super admin audit)</span>}
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 select-none max-w-7xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-gray-800">Governance & Approvals console</h1>
        <p className="text-xs text-gray-500 mt-0.5">Audit registry submissions, review versions differences, and verify deletion payloads.</p>
      </div>

      {!isSA ? (
        // END USER PENDING SUBMISSIONS VIEW
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Your Submissions history</h3>
          {yourSubmissions.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 font-medium border border-dashed border-gray-200 rounded bg-white">
              No registration requests submitted yet.
            </div>
          ) : (
            <SmartTable data={yourSubmissions} columns={userSubmissionsColumns} />
          )}
        </div>
      ) : (
        // SUPER ADMIN MISSION CONTROL TWO-PANE VIEW
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Rail Queue */}
            <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg flex flex-col max-h-[680px] overflow-hidden shadow-sm">
              {/* Kind Tabs */}
              <div className="border-b border-gray-200 p-3 bg-gray-50/50 flex gap-1.5 overflow-x-auto">
                {(['all', 'server', 'agent', 'skill'] as const).map(k => (
                  <button
                    key={k}
                    onClick={() => {
                      setSelectedKindTab(k);
                      setSelectedAssetId(null);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
                      selectedKindTab === k
                        ? 'bg-primary text-white'
                        : 'bg-white border border-gray-200 text-gray-450 hover:bg-gray-50'
                    }`}
                  >
                    {k === 'all' ? 'All' : `${k}s`}
                  </button>
                ))}
                <button disabled className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-300 cursor-not-allowed">
                  Prompts (Off)
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-3 border-b border-gray-100 flex items-center gap-2 bg-white">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search queue..."
                  className="w-full text-xs bg-transparent focus:outline-none"
                />
              </div>

              {/* Request Sections */}
              <div className="flex-1 overflow-y-auto divide-y divide-gray-100 max-h-[500px]">
                
                {/* 1. Registrations */}
                <div>
                  <div 
                    onClick={() => toggleSection('registrations')}
                    className="px-4 py-2.5 bg-gray-50/40 flex items-center justify-between text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-100"
                  >
                    <span>Registrations ({groupedQueue.registrations.length})</span>
                    {sectionsExpanded.registrations ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  </div>

                  {sectionsExpanded.registrations && (
                    <div className="divide-y divide-gray-50">
                      {groupedQueue.registrations.length === 0 ? (
                        <p className="p-3 text-[11px] text-gray-400 italic text-center">No registration requests.</p>
                      ) : (
                        groupedQueue.registrations.map(asset => (
                          <div 
                            key={asset.id} 
                            onClick={() => setSelectedAssetId(asset.id)}
                            className={`p-3 flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 transition-all ${
                              selectedAssetId === asset.id ? 'border-l-4 border-primary bg-primary/5' : ''
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedRequestIds.includes(asset.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedRequestIds(prev => [...prev, asset.id]);
                                } else {
                                  setSelectedRequestIds(prev => prev.filter(id => id !== asset.id));
                                }
                              }}
                              className="rounded border-gray-300 mt-0.5 text-primary focus:ring-primary shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-gray-800 text-xs block truncate">{asset.name}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">{asset.ownerName} · {new Date(asset.registeredAt || Date.now()).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 2. New Versions */}
                <div>
                  <div 
                    onClick={() => toggleSection('versions')}
                    className="px-4 py-2.5 bg-gray-50/40 flex items-center justify-between text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-100"
                  >
                    <span>New Versions ({groupedQueue.newVersions.length})</span>
                    {sectionsExpanded.versions ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  </div>

                  {sectionsExpanded.versions && (
                    <div className="divide-y divide-gray-50">
                      {groupedQueue.newVersions.length === 0 ? (
                        <p className="p-3 text-[11px] text-gray-400 italic text-center">No version updates pending.</p>
                      ) : (
                        groupedQueue.newVersions.map(asset => (
                          <div 
                            key={asset.id} 
                            onClick={() => setSelectedAssetId(asset.id)}
                            className={`p-3 flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 transition-all ${
                              selectedAssetId === asset.id ? 'border-l-4 border-primary bg-primary/5' : ''
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedRequestIds.includes(asset.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedRequestIds(prev => [...prev, asset.id]);
                                } else {
                                  setSelectedRequestIds(prev => prev.filter(id => id !== asset.id));
                                }
                              }}
                              className="rounded border-gray-300 mt-0.5 text-primary focus:ring-primary shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-gray-800 text-xs block truncate">{asset.name}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">Version bump pending · {asset.ownerName}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Deletions */}
                <div>
                  <div 
                    onClick={() => toggleSection('deletions')}
                    className="px-4 py-2.5 bg-gray-50/40 flex items-center justify-between text-xs font-bold text-gray-700 cursor-pointer hover:bg-gray-50 select-none border-b border-gray-100"
                  >
                    <span>Deletion Requests ({groupedQueue.deletionRequests.length})</span>
                    {sectionsExpanded.deletions ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                  </div>

                  {sectionsExpanded.deletions && (
                    <div className="divide-y divide-gray-50">
                      {groupedQueue.deletionRequests.length === 0 ? (
                        <p className="p-3 text-[11px] text-gray-400 italic text-center">No deletion requests.</p>
                      ) : (
                        groupedQueue.deletionRequests.map(asset => (
                          <div 
                            key={asset.id} 
                            onClick={() => setSelectedAssetId(asset.id)}
                            className={`p-3 flex items-start gap-2.5 cursor-pointer hover:bg-gray-50 transition-all ${
                              selectedAssetId === asset.id ? 'border-l-4 border-primary bg-primary/5' : ''
                            }`}
                          >
                            <input 
                              type="checkbox"
                              checked={selectedRequestIds.includes(asset.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedRequestIds(prev => [...prev, asset.id]);
                                } else {
                                  setSelectedRequestIds(prev => prev.filter(id => id !== asset.id));
                                }
                              }}
                              className="rounded border-gray-300 mt-0.5 text-primary focus:ring-primary shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-rose-700 text-xs block truncate">{asset.name}</span>
                              <span className="text-[10px] text-gray-400 block mt-0.5">Request Deletion · {asset.ownerName}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right Pane Details */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg flex flex-col min-h-[600px] overflow-hidden shadow-sm relative">
              {selectedItem ? (
                <div className="flex-1 flex flex-col h-full">
                  {/* Top Bar Summary */}
                  <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4 select-none">
                    <div className="flex items-center gap-3">
                      <EntityIcon kind={selectedItem.kind} />
                      <div>
                        <h2 className="text-sm font-bold text-gray-800">{selectedItem.name}</h2>
                        <span className="text-[10px] text-gray-400 mt-0.5 block font-semibold">
                          Submitted by {selectedItem.ownerName} · {selectedItem.publisher?.email || 'No email'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedItem.status} />
                      <HealthDot status={getHealthDisplay(selectedItem)} showLabel />
                    </div>
                  </div>

                  {/* sticky Action Bar */}
                  <div className="sticky top-0 bg-white border-b border-gray-150 px-5 py-3 flex gap-2.5 z-10">
                    <button
                      onClick={() => handleAction(selectedItem, 'approved')}
                      className="px-4 py-1.5 bg-primary text-white hover:bg-primary/95 text-xs font-bold rounded shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve Request
                    </button>
                    <button
                      onClick={() => handleAction(selectedItem, 'in_review')}
                      className="px-4 py-1.5 bg-sky-50 text-sky-700 border border-sky-300 hover:bg-sky-100 text-xs font-bold rounded cursor-pointer"
                    >
                      Mark in Review
                    </button>
                    <button
                      onClick={() => handleAction(selectedItem, 'rejected')}
                      className="px-4 py-1.5 bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 text-xs font-bold rounded cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>

                  {/* In-pane Tab Navigation */}
                  <div className="px-5 border-b border-gray-200 flex gap-4 select-none mt-2">
                    {selectedItem.deletionRequested && (
                      <button
                        onClick={() => setActiveSubTab('deletion-context')}
                        className={`pb-2 text-xs font-bold ${activeSubTab === 'deletion-context' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-655'}`}
                      >
                        Deletion Context
                      </button>
                    )}
                    {selectedItem.versions?.some((v: any) => v.status === 'pending' && !v.active) && (
                      <button
                        onClick={() => setActiveSubTab('diff')}
                        className={`pb-2 text-xs font-bold ${activeSubTab === 'diff' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-655'}`}
                      >
                        What's Changing (Diff)
                      </button>
                    )}
                    <button
                      onClick={() => setActiveSubTab('overview')}
                      className={`pb-2 text-xs font-bold ${activeSubTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-655'}`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveSubTab('technical')}
                      className={`pb-2 text-xs font-bold ${activeSubTab === 'technical' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-655'}`}
                    >
                      Technical specs
                    </button>
                  </div>

                  {/* Sub tab panels */}
                  <div className="p-5 flex-1 overflow-y-auto bg-gray-50/10">
                    
                    {activeSubTab === 'deletion-context' && (
                      <div className="space-y-4 max-w-xl text-xs">
                        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded space-y-2">
                          <h4 className="font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            Deletion Request Details
                          </h4>
                          <p className="font-semibold text-rose-600 mt-1">
                            Reason: {selectedItem.deletionReason || 'No reason specified by owner.'}
                          </p>
                        </div>
                        <div className="bg-white border rounded p-4 space-y-3 select-none">
                          <h4 className="font-bold text-gray-800 border-b pb-1">Governance Impact Check</h4>
                          <dl className="space-y-2 text-xs">
                            <div>
                              <dt className="text-gray-400 font-semibold">Active Workspaces Impacted</dt>
                              <dd className="font-bold text-gray-700 mt-0.5">
                                {workspaces.filter(ws => selectedItem.visibility?.workspaceIds?.includes(ws.id)).map(ws => ws.name).join(', ') || 'None (Private Asset)'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-gray-400 font-semibold">Global Visibility Status</dt>
                              <dd className="font-semibold text-gray-700 mt-0.5">
                                {selectedItem.visibility?.global ? 'Public Catalog Visibility' : 'Workspace / Private Restricted'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}

                    {activeSubTab === 'diff' && (
                      <div className="space-y-4 select-none">
                        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded">
                          Staged payload version changes waiting for approval. Approving applies changes and deactivates prior versions.
                        </div>
                        
                        {/* Mock Version Diff View */}
                        <div className="border border-gray-255 rounded-lg overflow-hidden bg-white shadow-sm flex flex-col">
                          <div className="px-4 py-2 border-b border-gray-150 bg-gray-50/50 flex items-center justify-between text-[11px] font-bold uppercase text-gray-500">
                            <span>Staged pending version payload</span>
                            <span>v{selectedItem.version} pending</span>
                          </div>
                          
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs text-gray-700 bg-gray-50/10">
                            <div className="border border-red-105 rounded bg-red-50/5 p-3 flex flex-col">
                              <span className="text-[10px] font-bold text-red-700 uppercase font-sans mb-2 block">Before State (- Active)</span>
                              <div className="space-y-1">
                                <div><span className="text-gray-400">description:</span> {selectedItem.description}</div>
                                <div><span className="text-gray-400">version:</span> v1.0.0</div>
                                <div><span className="text-gray-400">authType:</span> none</div>
                              </div>
                            </div>
                            <div className="border border-emerald-105 rounded bg-emerald-50/5 p-3 flex flex-col">
                              <span className="text-[10px] font-bold text-emerald-700 uppercase font-sans mb-2 block">After State (+ Staged)</span>
                              <div className="space-y-1">
                                <div className="bg-emerald-50 font-bold"><span className="text-gray-400">description:</span> {selectedItem.description} (Optimized for agent execution)</div>
                                <div className="bg-emerald-50 font-bold"><span className="text-gray-400">version:</span> v{selectedItem.version}</div>
                                <div><span className="text-gray-400">authType:</span> none</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSubTab === 'overview' && (
                      <div className="space-y-4 max-w-2xl text-xs">
                        <div className="bg-white border border-gray-150 rounded p-4 space-y-2 shadow-xs">
                          <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] text-gray-450 mb-2">Description</h4>
                          <p className="text-gray-650 leading-relaxed font-semibold">{selectedItem.description}</p>
                        </div>

                        {selectedItem.kind === 'skill' && (
                          <div className="bg-white border border-gray-150 rounded p-4 space-y-2 shadow-xs select-all">
                            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] text-gray-455">Inputs / Outputs Contract</h4>
                            <div className="font-mono text-gray-700 pt-2 space-y-1">
                              <div><span className="text-gray-400">inputs:</span> {JSON.stringify(selectedItem.inputs || [])}</div>
                              <div><span className="text-gray-400">outputs:</span> {JSON.stringify(selectedItem.outputs || [])}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {activeSubTab === 'technical' && (
                      <div className="space-y-4 max-w-2xl text-xs select-none">
                        <div className="bg-white border border-gray-150 rounded p-4 space-y-3 shadow-xs">
                          <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px] text-gray-455 border-b pb-1.5">Connection settings</h4>
                          <dl className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <dt className="text-gray-400 font-semibold">Endpoint Command</dt>
                              <dd className="font-mono-custom text-gray-700 truncate mt-0.5 font-bold">{selectedItem.tech?.endpoint || '—'}</dd>
                            </div>
                            <div>
                              <dt className="text-gray-400 font-semibold">Transport Medium</dt>
                              <dd className="font-semibold text-gray-700 uppercase mt-0.5">{selectedItem.tech?.transport || 'http'}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center p-8 bg-gray-50/20">
                  <div className="text-center select-none border border-dashed border-gray-200 rounded p-12 max-w-md bg-white">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                    <span className="text-xs font-bold text-gray-800 block">Select a request to review</span>
                    <span className="text-[11px] text-gray-400 mt-1 block">Walk the left queue list using ↑ and ↓ arrow keys, and perform approvals audits.</span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Bulk Operations Bar */}
          {selectedRequestIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-lg px-5 py-3 shadow-2xl flex items-center gap-6 z-50 animate-in fade-in slide-in-from-bottom duration-200">
              <span className="text-xs font-bold select-none">{selectedRequestIds.length} requests selected for bulk action</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setBulkActionType('approve');
                    setIsBulkDialogOpen(true);
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-bold cursor-pointer"
                >
                  Bulk Approve
                </button>
                <button
                  onClick={() => {
                    setBulkActionType('reject');
                    setIsBulkDialogOpen(true);
                  }}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded text-xs font-bold cursor-pointer"
                >
                  Bulk Reject
                </button>
                <button
                  onClick={() => setSelectedRequestIds([])}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-650 rounded text-xs font-bold cursor-pointer"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Collapsible Change History */}
          <div className="border border-gray-200 bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-150 flex items-center justify-between text-xs font-bold text-gray-800">
              <span>Super Admin Activity Change History ({changeHistory.length})</span>
              <span className="text-[10px] text-gray-400 normal-case font-medium">Reversible changes trail</span>
            </div>
            <div className="p-4">
              {changeHistory.length === 0 ? (
                <p className="text-xs text-gray-455 italic text-center py-4">No audit changes recorded yet.</p>
              ) : (
                <SmartTable 
                  data={changeHistory}
                  columns={[
                    {
                      key: 'timestamp',
                      header: 'Timestamp',
                      render: (row: any) => <span className="font-mono-custom text-gray-500">{new Date(row.timestamp).toLocaleString()}</span>
                    },
                    {
                      key: 'actor',
                      header: 'Actor',
                      render: (row: any) => (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-750">{row.actor}</span>
                          <span className="text-[9px] font-mono border px-1 rounded bg-gray-50 text-gray-400 uppercase font-bold">{row.actorRole}</span>
                        </div>
                      )
                    },
                    {
                      key: 'action',
                      header: 'Action',
                      render: (row: any) => (
                        <span className={`text-[10px] font-mono font-bold uppercase px-1.5 rounded ${
                          row.action === 'delete' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'
                        }`}>{row.action}</span>
                      )
                    },
                    {
                      key: 'targetName',
                      header: 'Target Asset',
                      render: (row: any) => <span className="font-bold text-gray-800">{row.targetName}</span>
                    },
                    {
                      key: 'summary',
                      header: 'Change Summary',
                      render: (row: any) => <span className="text-gray-500">{row.summary}</span>
                    },
                    {
                      key: 'revert',
                      header: 'Revert',
                      render: (row: any) => (
                        can('revert', row) && (
                          <button
                            onClick={() => {
                              revertChange(row.id);
                              toast.success('Mutation rollback successful.');
                            }}
                            className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold border border-gray-250 bg-white text-gray-700 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <Undo2 className="w-3 h-3" />
                            Revert
                          </button>
                        )
                      )
                    }
                  ]}
                />
              )}
            </div>
          </div>

          {/* Bulk Confirmation Dialog */}
          {isBulkDialogOpen && (
            <div className="fixed inset-0 bg-black/45 z-55 flex items-center justify-center p-4 backdrop-blur-xs select-none">
              <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-sm w-full p-6 text-xs space-y-4">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-500" />
                  <span>Confirm Bulk Operation</span>
                </div>
                <p className="text-gray-600 leading-relaxed font-semibold">
                  Are you absolutely sure you want to bulk <strong className="uppercase">{bulkActionType}</strong> the {selectedRequestIds.length} selected submission requests?
                </p>
                <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
                  <button
                    onClick={() => setIsBulkDialogOpen(false)}
                    className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-755 hover:bg-gray-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAction}
                    className="px-3.5 py-1.5 rounded bg-primary text-white hover:opacity-95 cursor-pointer"
                  >
                    Yes, Confirm Bulk Action
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
