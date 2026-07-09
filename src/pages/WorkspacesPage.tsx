import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { CardShell } from '@/components/registry/CardShell';
import { EntityIcon } from '@/components/registry/UIHelperKit';
import { FolderHeart } from 'lucide-react';

export const WorkspacesPage: React.FC = () => {
  const navigate = useNavigate();
  const { workspaces } = useRegistry();
  const { query } = useSearch();

  usePageSearch('Search workspaces…');

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground select-none">Workspaces</h1>
        <p className="text-[13px] text-muted-foreground mt-1">
          Collections of assets and configurations shared within your teams.
        </p>
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
                    <span>{ws.items.length} items configured</span>
                    <span className="uppercase text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{ws.kind}</span>
                  </div>
                }
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
