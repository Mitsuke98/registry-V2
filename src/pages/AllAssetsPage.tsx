import React, { useState } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { SmartTable } from '@/components/registry/Primitives';
import { CatPill, VisibilityBadge, StatusBadge, HealthDot, EnableToggle } from '@/components/registry/Kit';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const AllAssetsPage: React.FC = () => {
  const { mcpServers, a2aAgents, skills, prompts, usersList, setItemDisabled, getHealthDisplay } = useRegistry();
  const navigate = useNavigate();
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  const [kindFilter, setKindFilter] = useState<'all' | 'server' | 'agent' | 'skill' | 'prompt'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'rejected' | 'in_review'>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all assets
  const allAssets = [
    ...mcpServers.map(s => ({ ...s, kind: 'server' as const, ownerName: s.ownerName })),
    ...a2aAgents.map(a => ({ ...a, kind: 'agent' as const, ownerName: a.ownerName })),
    ...skills.map(sk => ({ ...sk, kind: 'skill' as const, ownerName: sk.identity?.ownerName || 'Community' })),
    ...prompts.map(p => ({ ...p, kind: 'prompt' as const, ownerName: p.author || 'Community' }))
  ];

  // Apply filters
  const filtered = allAssets.filter(asset => {
    if (kindFilter !== 'all' && asset.kind !== kindFilter) return false;
    if (statusFilter !== 'all' && asset.status !== statusFilter) return false;
    if (ownerFilter !== 'all' && asset.ownerName !== ownerFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return asset.name.toLowerCase().includes(q) || asset.id.toLowerCase().includes(q);
    }
    return true;
  });

  const columns = [
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
      key: 'kind',
      header: 'Kind',
      render: (row: any) => <span className="capitalize font-semibold text-gray-500">{row.kind}</span>
    },
    {
      key: 'ownerName',
      header: 'Owner',
      sortable: true,
      render: (row: any) => <span className="font-medium text-gray-600">{row.ownerName}</span>
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
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2.5" onClick={e => e.stopPropagation()}>
          <EnableToggle 
            checked={!row.disabled} 
            onChange={(checked) => setItemDisabled(row.kind, row.id, !checked)} 
          />
          <button 
            onClick={() => navigate(`/${row.kind}s/${row.id}`)}
            className="p-1 hover:bg-gray-150 rounded text-gray-400 hover:text-primary transition-colors cursor-pointer"
            title="Open Full Detail Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6 space-y-6 select-none">
      
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold tracking-tight text-gray-800">All Platform Assets</h1>
        <p className="text-xs text-gray-500 mt-0.5">Global registry manager across all categories, ownership boundaries, and active workspaces.</p>
      </div>

      {/* Toolbar FilterRow */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3.5 border border-gray-200 rounded-md">
        
        {/* Search */}
        <div className="relative w-48">
          <input 
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search all assets..."
            className="w-full px-2.5 py-1.5 text-xs rounded border border-gray-250 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Kind filter */}
        <select
          value={kindFilter}
          onChange={e => setKindFilter(e.target.value as any)}
          className="px-2.5 py-1.5 text-xs border border-gray-250 rounded bg-white font-semibold text-gray-700 cursor-pointer focus:outline-none"
        >
          <option value="all">All Kinds</option>
          <option value="server">Servers</option>
          <option value="agent">Agents</option>
          <option value="skill">Skills</option>
          <option value="prompt">Prompts</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-2.5 py-1.5 text-xs border border-gray-250 rounded bg-white font-semibold text-gray-700 cursor-pointer focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* Owner filter */}
        <select
          value={ownerFilter}
          onChange={e => setOwnerFilter(e.target.value)}
          className="px-2.5 py-1.5 text-xs border border-gray-250 rounded bg-white font-semibold text-gray-700 cursor-pointer focus:outline-none"
        >
          <option value="all">All Owners</option>
          {usersList.map(u => (
            <option key={u.id} value={u.name}>{u.name}</option>
          ))}
        </select>

        {/* Clear filter triggers */}
        {(kindFilter !== 'all' || statusFilter !== 'all' || ownerFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setKindFilter('all');
              setStatusFilter('all');
              setOwnerFilter('all');
              setSearchQuery('');
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer focus:outline-none"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-md p-4">
        <SmartTable 
          data={filtered} 
          columns={columns} 
          externalToolbar={true} 
          onRowClick={(row) => setSelectedAsset(row)}
        />
      </div>

      {/* Right Side Sheet Panel */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 bg-black/45 z-50 flex justify-end backdrop-blur-xs select-none transition-opacity duration-300"
          onClick={() => setSelectedAsset(null)}
        >
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="p-5 border-b border-gray-255 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <CatPill text={selectedAsset.kind} />
                <h2 className="text-sm font-bold text-gray-800">{selectedAsset.name}</h2>
                <StatusBadge status={selectedAsset.status} disabled={selectedAsset.disabled} deletionRequested={selectedAsset.deletionRequested} />
              </div>
              
              <div className="flex items-center gap-3">
                {/* Enable Toggle */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 px-2 py-1 rounded text-xs select-none">
                  <span className="font-semibold text-gray-500">Enabled</span>
                  <EnableToggle 
                    checked={!selectedAsset.disabled} 
                    onChange={(checked) => {
                      setItemDisabled(selectedAsset.kind, selectedAsset.id, !checked);
                      setSelectedAsset((prev: any) => prev ? { ...prev, disabled: !checked } : null);
                    }} 
                  />
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    navigate(`/${selectedAsset.kind}s/${selectedAsset.id}`);
                  }}
                  className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Edit Full Asset
                </button>

                <button 
                  onClick={() => setSelectedAsset(null)}
                  className="text-gray-400 hover:text-gray-600 text-xs font-bold px-2 py-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sheet Body (Full tabbed layout inside, read-context) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/20">
              {selectedAsset.kind === 'server' && (
                <div className="space-y-6">
                  {/* Overview flat layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Description</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{selectedAsset.description}</p>
                    </div>
                    <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Registry Specs</h4>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div><span className="font-semibold text-gray-400">License:</span> {selectedAsset.license || 'Proprietary'}</div>
                        <div><span className="font-semibold text-gray-400">Owner:</span> {selectedAsset.ownerName}</div>
                        <div><span className="font-semibold text-gray-400">Registered:</span> {new Date(selectedAsset.registeredAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>
                  {/* Technical connection details */}
                  <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                    <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Technical connection endpoint</h4>
                    <div className="space-y-1.5 text-xs text-gray-650 font-mono-custom">
                      <div><span className="font-semibold font-sans text-gray-400">Endpoint:</span> {selectedAsset.tech?.endpoint}</div>
                      <div><span className="font-semibold font-sans text-gray-400">Gateway URL:</span> {selectedAsset.tech?.gatewayUrl}</div>
                      <div><span className="font-semibold font-sans text-gray-400">Auth:</span> {selectedAsset.tech?.authType}</div>
                      <div><span className="font-semibold font-sans text-gray-400">Transport:</span> {selectedAsset.tech?.transport}</div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.kind === 'agent' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Description</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{selectedAsset.description}</p>
                    </div>
                    <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Capabilities</h4>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div><span className="font-semibold text-gray-400">Autonomy:</span> {selectedAsset.autonomy}</div>
                        <div><span className="font-semibold text-gray-400">Reasoning:</span> {selectedAsset.capabilityToggles?.reasoning ? 'Yes' : 'No'}</div>
                        <div><span className="font-semibold text-gray-400">Memory:</span> {selectedAsset.capabilityToggles?.memory ? 'Yes' : 'No'}</div>
                        <div><span className="font-semibold text-gray-400">Collaboration:</span> {selectedAsset.capabilityToggles?.collaboration ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.kind === 'skill' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Description</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{selectedAsset.description}</p>
                    </div>
                    <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                      <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Category & Trust</h4>
                      <div className="space-y-1.5 text-xs text-gray-600">
                        <div><span className="font-semibold text-gray-400">Category:</span> {selectedAsset.category}</div>
                        <div><span className="font-semibold text-gray-400">Downloads:</span> {selectedAsset.downloads}</div>
                        <div><span className="font-semibold text-gray-400">Health:</span> {getHealthDisplay(selectedAsset)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.kind === 'prompt' && (
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-md p-4 bg-white space-y-2">
                    <h4 className="font-bold text-xs text-gray-800 border-b pb-1">Description</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{selectedAsset.description}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sheet Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setSelectedAsset(null)}
                className="px-3 py-1.5 border border-gray-250 rounded text-xs text-gray-600 bg-white hover:bg-gray-50 cursor-pointer font-semibold"
              >
                Close Panel
              </button>
              
              <button
                onClick={() => {
                  navigate(`/${selectedAsset.kind}s/${selectedAsset.id}`);
                  setSelectedAsset(null);
                }}
                className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
              >
                Open Full Asset Page <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
