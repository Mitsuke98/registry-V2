import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { CardShell } from '@/components/registry/CardShell';
import { EntityIcon } from '@/components/registry/UIHelperKit';
import { FolderHeart, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const KNOWN_USERS = ['Alex Vance', 'Jordan Blake', 'Sarah Chen', 'Michael Scott'];

export const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaces, can, createWorkspace, mcpServers, a2aAgents, skills, prompts } = useRegistry();
  const { query } = useSearch();

  usePageSearch('Search workspaces…');

  const getWorkspaceItemCount = (ws: any) => {
    let count = 0;
    const countInList = (sourceList: any[]) => {
      sourceList.forEach(item => {
        if (ws.kind === 'personal') {
          if (item.ownerName === ws.ownerName) count++;
        } else {
          if (item.status === 'approved' && !item.disabled && item.visibility?.workspaceIds?.includes(ws.id)) {
            count++;
          }
        }
      });
    };
    countInList(mcpServers);
    countInList(a2aAgents);
    countInList(skills);
    countInList(prompts);
    return count;
  };

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('Jordan Blake');
  const [memberInput, setMemberInput] = useState('');
  const [members, setMembers] = useState<string[]>([]);

  const handleAddMember = () => {
    const trimmed = memberInput.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers([...members, trimmed]);
      setMemberInput('');
    }
  };

  const handleRemoveMember = (m: string) => {
    setMembers(members.filter(item => item !== m));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    createWorkspace({
      name,
      description,
      kind: 'team',
      ownerName: owner,
      members
    });
    setIsOpen(false);
    // Reset form
    setName('');
    setDescription('');
    setOwner('Jordan Blake');
    setMembers([]);
  };

  const filteredWorkspaces = workspaces.filter((ws) => {
    const term = query.toLowerCase();
    return (
      ws.name.toLowerCase().includes(term) ||
      ws.description.toLowerCase().includes(term) ||
      ws.ownerName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">Workspaces</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Collections of assets and configurations shared within your teams.
          </p>
        </div>
        {can('crud-workspace') && (
          <Button onClick={() => setIsOpen(true)} className="h-9 text-xs font-semibold gap-1.5 cursor-pointer">
            <Plus className="size-4" />
            <span>New workspace</span>
          </Button>
        )}
      </div>

      {filteredWorkspaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-12 text-center bg-card select-none">
          <FolderHeart className="size-8 text-muted-foreground/60 mb-2" />
          <p className="text-[13px] text-muted-foreground">No workspaces match your query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((ws) => (
            <div key={ws.id} onClick={() => navigate(`/workspaces/${ws.id}`)} className="cursor-pointer">
              <CardShell
                variant="entity"
                icon={<EntityIcon kind="prompt" className="size-4" />} // Folder placeholder icon style
                title={ws.name}
                subTitle={ws.ownerIsCurrentUser ? 'Personal Workspace' : `Shared by ${ws.ownerName}`}
                description={ws.description}
                footer={
                  <div className="flex items-center justify-between w-full select-none font-mono text-[11px]">
                    <span>{getWorkspaceItemCount(ws)} items configured</span>
                    <span className="uppercase text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{ws.kind}</span>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* CREATE WORKSPACE DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px] p-6 bg-card border border-border rounded-xl">
          <DialogHeader className="mb-4 select-none">
            <DialogTitle className="text-base font-bold text-foreground">Create Workspace</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define a new team workspace.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Name *</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Marketing Tools, Dev Team, etc."
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe this workspace..."
                className="w-full rounded-lg border border-border bg-transparent p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Owner *</label>
              <select
                value={owner}
                onChange={e => setOwner(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold cursor-pointer focus:outline-none"
              >
                {KNOWN_USERS.map(user => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Members</label>
              <div className="flex gap-2">
                <Input
                  value={memberInput}
                  onChange={e => setMemberInput(e.target.value)}
                  placeholder="Add member name..."
                  className="h-9 text-xs flex-1"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddMember} variant="outline" className="h-9 text-xs">Add</Button>
              </div>

              {members.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 max-h-[80px] overflow-y-auto">
                  {members.map(m => (
                    <span key={m} className="inline-flex items-center gap-1 text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border/30">
                      <span>{m}</span>
                      <button type="button" onClick={() => handleRemoveMember(m)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 select-none">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="h-9 text-xs font-semibold rounded-lg">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm">
                Create Workspace
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
