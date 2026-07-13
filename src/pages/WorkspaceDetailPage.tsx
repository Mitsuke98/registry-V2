import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { SmartTable } from '@/components/registry/Primitives';
import { 
  EntityIcon, StatusBadge, EmptyState
} from '@/components/registry/Kit';
import { ArrowLeft, Plus, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const WorkspaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    workspaces, mcpServers, a2aAgents, skills, prompts, 
    currentUser, updateWorkspace, deleteWorkspace, updateItem 
  } = useRegistry();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false);

  // Edit Workspace Form States
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMembers, setEditMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');

  // Add Asset Form States
  const [selectedAssetKey, setSelectedAssetKey] = useState('');

  const workspace = workspaces.find(w => w.id === id);

  React.useEffect(() => {
    if (workspace) {
      setEditName(workspace.name);
      setEditDescription(workspace.description);
      setEditMembers(workspace.members || []);
    }
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="p-8 text-center select-none">
        <h2 className="text-sm font-bold text-gray-800">Workspace not found.</h2>
        <button 
          onClick={() => navigate('/workspaces')}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground cursor-pointer"
        >
          Return to Workspaces
        </button>
      </div>
    );
  }

  const isSA = currentUser?.role === 'super_admin';

  // Gather approved assets sharing this workspace
  const workspaceServers = mcpServers.filter(s => s.status === 'approved' && s.visibility?.workspaceIds?.includes(workspace.id)).map(s => ({ ...s, kind: 'server' as const }));
  const workspaceAgents = a2aAgents.filter(a => a.status === 'approved' && a.visibility?.workspaceIds?.includes(workspace.id)).map(a => ({ ...a, kind: 'agent' as const }));
  const workspaceSkills = skills.filter(s => s.status === 'approved' && s.visibility?.workspaceIds?.includes(workspace.id)).map(s => ({ ...s, kind: 'skill' as const }));
  const workspacePrompts = prompts.filter(p => p.status === 'approved' && p.visibility?.workspaceIds?.includes(workspace.id)).map(p => ({ ...p, kind: 'prompt' as const }));

  const workspaceItems = [...workspaceServers, ...workspaceAgents, ...workspaceSkills, ...workspacePrompts];

  // Candidates for "Add Asset" picker: Approved assets NOT shared in this workspace
  const availableServers = mcpServers.filter(s => s.status === 'approved' && !s.visibility?.workspaceIds?.includes(workspace.id)).map(s => ({ ...s, kind: 'server' as const }));
  const availableAgents = a2aAgents.filter(a => a.status === 'approved' && !a.visibility?.workspaceIds?.includes(workspace.id)).map(a => ({ ...a, kind: 'agent' as const }));
  const availableSkills = skills.filter(s => s.status === 'approved' && !s.visibility?.workspaceIds?.includes(workspace.id)).map(s => ({ ...s, kind: 'skill' as const }));
  const availablePrompts = prompts.filter(p => p.status === 'approved' && !p.visibility?.workspaceIds?.includes(workspace.id)).map(p => ({ ...p, kind: 'prompt' as const }));

  const addCandidates = [...availableServers, ...availableAgents, ...availableSkills, ...availablePrompts];

  const handleAddAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetKey) {
      toast.error('Select an asset to associate.');
      return;
    }

    const [kind, id] = selectedAssetKey.split('|');
    const assetList = kind === 'server' ? mcpServers : kind === 'agent' ? a2aAgents : kind === 'skill' ? skills : prompts;
    const targetAsset = assetList.find(a => a.id === id);

    if (targetAsset) {
      const currentIds = targetAsset.visibility?.workspaceIds || [];
      updateItem(kind as any, id, {
        visibility: {
          global: targetAsset.visibility?.global || false,
          workspaceIds: [...currentIds, workspace.id]
        }
      });
      toast.success('Asset shared in workspace.');
      setIsAddAssetOpen(false);
      setSelectedAssetKey('');
    }
  };

  const handleRemoveAsset = (item: any) => {
    const currentIds = item.visibility?.workspaceIds || [];
    updateItem(item.kind, item.id, {
      visibility: {
        global: item.visibility?.global || false,
        workspaceIds: currentIds.filter((wId: string) => wId !== workspace.id)
      }
    });
    toast.success('Asset removed from workspace share.');
  };

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (trimmed && !editMembers.includes(trimmed)) {
      setEditMembers([...editMembers, trimmed]);
      setMemberInput('');
    }
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    updateWorkspace(workspace.id, {
      name: editName.trim(),
      description: editDescription.trim(),
      members: editMembers
    });
    setIsEditOpen(false);
    toast.success('Workspace updated.');
  };

  const handleDeleteWorkspace = () => {
    // Revoke share links before delete
    workspaceItems.forEach(item => {
      const currentIds = item.visibility?.workspaceIds || [];
      updateItem(item.kind, item.id, {
        visibility: {
          global: item.visibility?.global || false,
          workspaceIds: currentIds.filter((wId: string) => wId !== workspace.id)
        }
      });
    });

    deleteWorkspace(workspace.id);
    navigate('/workspaces');
    toast.success('Workspace deleted.');
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2">
          <EntityIcon kind={row.kind} size="sm" />
          <span className="font-semibold text-gray-800">{row.name}</span>
        </div>
      )
    },
    {
      key: 'kind',
      header: 'Kind',
      render: (row: any) => <span className="capitalize font-semibold text-gray-400">{row.kind}</span>
    },
    {
      key: 'ownerName',
      header: 'Owner',
      render: (row: any) => <span className="font-medium text-gray-600">{row.ownerName}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: any) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      header: 'Remove Share',
      render: (row: any) => {
        if (!isSA) return <span className="text-gray-400">—</span>;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveAsset(row);
            }}
            className="px-2 py-1 text-[10px] font-bold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded cursor-pointer"
          >
            Remove Share
          </button>
        );
      }
    }
  ];

  return (
    <div className="p-6 space-y-6 select-none">
      
      {/* Back link */}
      <button 
        onClick={() => navigate('/workspaces')}
        className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to workspaces</span>
      </button>

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-gray-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-800">{workspace.name}</h1>
            <span className="bg-gray-100 border text-gray-500 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wide">
              Shared Team Workspace
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xl">{workspace.description}</p>
          <div className="text-[11px] text-gray-450 font-semibold pt-1">
            Owned by {workspace.ownerName} · {workspace.members?.length || 0} members · {workspaceItems.length} assets mapped
          </div>
        </div>

        {isSA && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAddAssetOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Asset
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
            >
              Edit Workspace
            </button>
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-red-600 text-white hover:bg-red-700 cursor-pointer focus:outline-none"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Assets list (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Shared Workspace Assets</h2>
          <div className="bg-white border border-gray-200 rounded-md p-4">
            {workspaceItems.length === 0 ? (
              <EmptyState description="No assets have been added to this shared workspace yet." />
            ) : (
              <SmartTable 
                data={workspaceItems}
                columns={columns}
                externalToolbar={true}
                onRowClick={(row) => navigate(`/${row.kind === 'prompt' ? 'catalog' : `${row.kind}s`}/${row.id}`)}
              />
            )}
          </div>
        </div>

        {/* Workspace Members side panel (1/3 width) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Workspace Members</h2>
          <div className="border border-gray-200 rounded bg-white p-4 space-y-3 shadow-sm select-none">
            {workspace.members?.map(m => (
              <div key={m} className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 shrink-0">
                  {m.split(' ').map(x => x[0]).join('')}
                </div>
                <div>
                  <span className="font-bold text-gray-700 block">{m}</span>
                  <span className="text-[10px] text-gray-400">{m === workspace.ownerName ? 'Workspace Owner' : 'Team Member'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ADD ASSET DIALOG (SA-only) */}
      {isAddAssetOpen && isSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <form onSubmit={handleAddAssetSubmit}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Add Asset to Workspace</h3>
                <button type="button" onClick={() => setIsAddAssetOpen(false)} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
              </div>
              <div className="p-4 text-xs space-y-3">
                <p className="text-gray-500">Select an approved registry asset to share in this workspace.</p>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Approved Assets Candidates</label>
                  <select
                    value={selectedAssetKey}
                    onChange={e => setSelectedAssetKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded bg-white text-gray-700 cursor-pointer focus:outline-none"
                    required
                  >
                    <option value="">Select Asset...</option>
                    {addCandidates.map(c => (
                      <option key={`${c.kind}|${c.id}`} value={`${c.kind}|${c.id}`}>
                        [{c.kind.toUpperCase()}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs font-semibold">
                <button type="button" onClick={() => setIsAddAssetOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-55 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">Add Share</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT WORKSPACE DIALOG (SA-only) */}
      {isEditOpen && isSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <form onSubmit={handleSaveWorkspace}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">Edit Workspace</h3>
                <button type="button" onClick={() => setIsEditOpen(false)} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Workspace Name *</label>
                  <input 
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={editDescription}
                    onChange={e => setEditDescription(e.target.value)}
                    rows={3}
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Add member box */}
                <div className="space-y-2">
                  <label className="block font-semibold text-gray-700">Members</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={memberInput}
                      onChange={e => setMemberInput(e.target.value)}
                      placeholder="e.g. Sarah Chen"
                      className="flex-1 px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMember();
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={handleAddMember}
                      className="px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50 font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {editMembers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {editMembers.map(m => (
                        <span key={m} className="inline-flex items-center gap-1 bg-gray-55 border px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">
                          {m}
                          <button type="button" onClick={() => setEditMembers(editMembers.filter(x => x !== m))} className="text-gray-400 hover:text-gray-600">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-55 text-xs font-semibold">
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE WORKSPACE DIALOG (SA-only) */}
      {isDeleteOpen && isSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-sm bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <div className="p-5 text-center space-y-3">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
              <h3 className="text-sm font-bold text-gray-800">Delete Workspace</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Are you sure you want to delete workspace "{workspace.name}"? Shared links for all associated assets will be revoked.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-55">
              <button onClick={() => setIsDeleteOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer text-xs font-semibold">Cancel</button>
              <button onClick={handleDeleteWorkspace} className="px-3.5 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 cursor-pointer text-xs font-semibold">Delete Directly</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
