import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRegistry } from '@/data/RegistryContext';

interface EditAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  kind: 'server' | 'agent' | 'skill' | 'prompt';
  item: any;
  onSave: (updates: any) => void;
}

export const EditAssetDialog: React.FC<EditAssetDialogProps> = ({
  isOpen,
  onOpenChange,
  kind,
  item,
  onSave
}) => {
  const { workspaces, currentUser } = useRegistry();
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editEndpoint, setEditEndpoint] = useState('');
  const [editTransport, setEditTransport] = useState<'stdio' | 'sse' | 'http'>('stdio');
  const [editCategory, setEditCategory] = useState('');
  const [editTagsString, setEditTagsString] = useState('');
  const [editGlobal, setEditGlobal] = useState(false);
  const [editWorkspaceIds, setEditWorkspaceIds] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setEditName(item.name || '');
      setEditDescription(item.description || '');
      setEditVersion(item.version || '1.0.0');
      setEditEndpoint(item.endpoint || '');
      setEditTransport(item.transport || 'stdio');
      setEditCategory(item.category || '');
      setEditTagsString((item.tags || []).join(', '));
      setEditGlobal(item.visibility?.global ?? false);
      setEditWorkspaceIds(item.visibility?.workspaceIds ?? []);
    }
  }, [item]);

  const selectableWorkspaces = React.useMemo(() => {
    if (!currentUser) return [];
    const teams = workspaces.filter(w => w.kind === 'team');
    if (currentUser.role === 'super_admin') {
      return teams;
    }
    return teams.filter(w => w.members.includes(currentUser.name));
  }, [workspaces, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = editTagsString.split(',').map(t => t.trim()).filter(Boolean);
    const updates: any = {
      name: editName,
      description: editDescription,
      version: editVersion,
      tags: tagsArray,
      visibility: {
        global: editGlobal,
        workspaceIds: editWorkspaceIds
      }
    };
    if (kind === 'server') {
      updates.transport = editTransport;
    } else if (kind === 'agent') {
      updates.endpoint = editEndpoint;
    } else if (kind === 'skill') {
      updates.category = editCategory;
    }
    onSave(updates);
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto p-6 bg-card border border-border rounded-xl">
        <DialogHeader className="mb-4 select-none">
          <DialogTitle className="text-base font-bold text-foreground">Edit Asset Details</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Edit core properties for "{item.name}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground select-none border-b pb-1">Basic Info</h4>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Name</label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} required className="h-9 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-semibold select-none">Description</label>
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={2}
                required
                className="w-full rounded-lg border border-border bg-transparent p-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-semibold select-none">Version</label>
                <Input value={editVersion} onChange={e => setEditVersion(e.target.value)} required className="h-9 text-xs font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-semibold select-none">Tags (comma-separated)</label>
                <Input value={editTagsString} onChange={e => setEditTagsString(e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
          </div>

          {/* Technical Config */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground select-none border-b pb-1">Technical details</h4>
            {kind === 'server' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground font-semibold select-none">Transport</label>
                  <select
                    value={editTransport}
                    onChange={e => setEditTransport(e.target.value as any)}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold cursor-pointer focus:outline-none"
                  >
                    <option value="stdio">STDIO</option>
                    <option value="sse">SSE</option>
                    <option value="http">HTTP</option>
                  </select>
                </div>
              </div>
            ) : kind === 'agent' ? (
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-semibold select-none">Endpoint URI</label>
                <Input value={editEndpoint} onChange={e => setEditEndpoint(e.target.value)} required className="h-9 text-xs font-mono" />
              </div>
            ) : kind === 'skill' ? (
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-semibold select-none">Category</label>
                <Input value={editCategory} onChange={e => setEditCategory(e.target.value)} required className="h-9 text-xs" />
              </div>
            ) : null}
          </div>

          {/* Visibility settings */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground select-none border-b pb-1">Visibility Settings</h4>
            
            <div className="flex items-center justify-between p-2.5 rounded-lg border bg-muted/10">
              <div className="flex flex-col select-none">
                <span className="text-[11px] font-semibold text-foreground">Global Catalog Listing</span>
                <span className="text-[10px] text-muted-foreground">List this asset in the public registry.</span>
              </div>
              <input
                type="checkbox"
                checked={editGlobal}
                onChange={e => setEditGlobal(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {selectableWorkspaces.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold select-none">Share to Team Workspaces</label>
                <div className="max-h-32 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-background">
                  {selectableWorkspaces.map(ws => (
                    <label key={ws.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-accent/40 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={editWorkspaceIds.includes(ws.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setEditWorkspaceIds([...editWorkspaceIds, ws.id]);
                          } else {
                            setEditWorkspaceIds(editWorkspaceIds.filter(id => id !== ws.id));
                          }
                        }}
                        className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                      />
                      <div className="flex flex-col select-none">
                        <span className="font-semibold text-[11px]">{ws.name}</span>
                        <span className="text-[9.5px] text-muted-foreground truncate max-w-[380px]">{ws.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Readonly capabilities */}
          <div className="p-3.5 border border-dashed rounded-lg bg-muted/15 space-y-1 select-none">
            <div className="text-[11px] font-bold text-foreground">Capabilities</div>
            <div className="text-[10px] text-muted-foreground italic">
              Capabilities can only be set during registration.
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 select-none">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-semibold rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
