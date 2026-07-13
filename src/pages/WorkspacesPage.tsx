import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { CardShell } from '@/components/registry/Primitives';
import { EmptyState } from '@/components/registry/Kit';
import { Plus, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

export const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    workspaces, currentUser, createWorkspace, 
    mcpServers, a2aAgents, skills, prompts 
  } = useRegistry();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<string[]>([]);
  const [memberInput, setMemberInput] = useState('');

  const isSA = currentUser?.role === 'super_admin';

  // Filter workspaces: SA sees all, End User sees only workspaces they are a member of
  const visibleWorkspaces = workspaces.filter(ws => {
    if (isSA) return true;
    return ws.members.includes(currentUser?.name || '');
  });

  const getWorkspaceItemCount = (wsId: string) => {
    const sCount = mcpServers.filter(s => s.status === 'approved' && !s.disabled && s.visibility?.workspaceIds?.includes(wsId)).length;
    const aCount = a2aAgents.filter(a => a.status === 'approved' && a.visibility?.workspaceIds?.includes(wsId)).length;
    const skCount = skills.filter(s => s.status === 'approved' && s.visibility?.workspaceIds?.includes(wsId)).length;
    const pCount = prompts.filter(p => p.status === 'approved' && p.visibility?.workspaceIds?.includes(wsId)).length;
    return sCount + aCount + skCount + pCount;
  };

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setMemberInput('');
    }
  };

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Workspace name is required.');
      return;
    }

    createWorkspace({
      name: name.trim(),
      description: description.trim(),
      kind: 'shared',
      ownerName: currentUser?.name || 'Admin',
      members: [currentUser?.name || 'Admin', ...members]
    });

    setIsOpen(false);
    setName('');
    setDescription('');
    setMembers([]);
    toast.success('Workspace created successfully.');
  };

  return (
    <div className="p-6 space-y-6 select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Team Workspaces</h1>
          <p className="text-xs text-gray-500 mt-0.5">Shared collections of assets and access scopes configured across departments.</p>
        </div>
        
        {isSA && (
          <button 
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Workspace
          </button>
        )}
      </div>

      {visibleWorkspaces.length === 0 ? (
        <EmptyState 
          description="You are not a member of any shared team workspaces yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleWorkspaces.map(ws => (
            <div key={ws.id} onClick={() => navigate(`/workspaces/${ws.id}`)} className="cursor-pointer">
              <CardShell 
                kind="server" // Using server card variant as generic folder shell
                name={ws.name}
                subline={`Shared workspace · ${ws.members.length} members`}
                description={ws.description}
                footerText={`${getWorkspaceItemCount(ws.id)} assets configured`}
                topRightSlot={<FolderOpen className="w-4 h-4 text-gray-400" />}
              />
            </div>
          ))}
        </div>
      )}

      {/* CREATE WORKSPACE DIALOG (SA-only) */}
      {isOpen && isSA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <form onSubmit={handleCreateWorkspace}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-800">New Shared Workspace</h3>
                <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 font-bold hover:text-gray-600">✕</button>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Workspace Name *</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    placeholder="e.g. Finance Analytics team"
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Description</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Describe the usage parameters of this workspace..."
                    className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {/* Add member box */}
                <div className="space-y-2">
                  <label className="block font-semibold text-gray-700">Configure Members</label>
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

                  {members.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {members.map(m => (
                        <span key={m} className="inline-flex items-center gap-1 bg-gray-50 border px-2 py-0.5 rounded text-[10px] font-bold text-gray-600">
                          {m}
                          <button type="button" onClick={() => setMembers(members.filter(x => x !== m))} className="text-gray-400 hover:text-gray-600">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs font-semibold">
                <button type="button" onClick={() => setIsOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">Create Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
