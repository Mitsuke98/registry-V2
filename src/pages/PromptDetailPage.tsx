import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { 
  EntityIcon, StatusBadge, RatePopover, BookmarkToggle, 
  EnableToggle, EmptyState
} from '@/components/registry/Kit';
import { SmartTable, CompareDialog } from '@/components/registry/Primitives';
import { FEATURES } from '@/config/features';
import { 
  Copy, Globe, Edit, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

export const PromptDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    prompts, currentUser, bookmarks, toggleBookmark, rateItem, 
    updateItem, setItemDisabled, setItemVisibility, requestDeletion, 
    cancelDeletionRequest, deleteItemDirect, can, workspaces, addComment
  } = useRegistry();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDelReqOpen, setIsDelReqOpen] = useState(false);
  const [delReason, setDelReason] = useState('');
  
  // Compare state
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Comments state
  const [newComment, setNewComment] = useState('');

  // Edit states
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // 1. Flag-gate Check
  useEffect(() => {
    if (!FEATURES.prompts) {
      toast.error('Prompts feature store is flag-disabled.');
      navigate('/catalog');
    }
  }, [navigate]);

  const prompt = prompts.find(p => p.id === id);

  useEffect(() => {
    if (prompt) {
      setEditName(prompt.name);
      setEditDesc(prompt.description);
    }
  }, [prompt]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  if (!FEATURES.prompts || !prompt) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-sm font-bold text-gray-800">Prompt not found or feature is disabled.</h2>
      </div>
    );
  }

  const isBookmarked = bookmarks.prompt?.includes(prompt.id) || false;
  const isOwner = currentUser?.name === prompt.author;
  const showEditButton = (isOwner && (prompt.status === 'pending' || prompt.status === 'in_review')) || (currentUser?.role === 'super_admin');

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt.content || '');
    toast.success('Prompt raw text template copied to clipboard.');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Name is required.');
      return;
    }
    updateItem('prompt', prompt.id, { name: editName, description: editDesc });
    setIsEditOpen(false);
  };

  const handleDirectDelete = () => {
    deleteItemDirect('prompt', prompt.id);
    navigate('/catalog');
    toast.success('Prompt deleted.');
  };

  const handleSubmitDelReq = () => {
    requestDeletion('prompt', prompt.id, delReason);
    setIsDelReqOpen(false);
  };

  const handleCancelDelReq = () => {
    cancelDeletionRequest('prompt', prompt.id);
  };

  const handleVersionCheck = (ver: string, checked: boolean) => {
    if (checked) {
      if (selectedVersions.length >= 2) {
        toast.warning('Select maximum 2 versions to compare.');
        return;
      }
      setSelectedVersions([...selectedVersions, ver]);
    } else {
      setSelectedVersions(selectedVersions.filter(v => v !== ver));
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    addComment('prompt', prompt.id, newComment.trim());
    setNewComment('');
    toast.success('Comment posted.');
  };

  return (
    <div className="relative select-none pb-12">
      
      {/* Sticky Detail Header on scroll */}
      <div className="sticky top-0 bg-white/95 border-b border-gray-200 px-6 py-3 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <EntityIcon kind="prompt" size="sm" />
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-gray-800 truncate">{prompt.name}</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono-custom">v{prompt.versions?.[0]?.version || '1.0.0'} · {prompt.author}</p>
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            <StatusBadge status={prompt.status} disabled={prompt.disabled} deletionRequested={prompt.deletionRequested} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          
          <button 
            onClick={handleCopyPrompt}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy Prompt
          </button>

          <BookmarkToggle isBookmarked={isBookmarked} onToggle={() => toggleBookmark('prompt', prompt.id)} />
          <RatePopover itemId={prompt.id} currentRating={prompt.rating} onRate={(r) => rateItem('prompt', prompt.id, r)} />
          
          {/* Enable/Disable Switch (Owner/SA) */}
          {can('toggle-disabled', prompt) && (
            <div className="flex items-center gap-2 border border-gray-200 rounded px-2.5 py-1 bg-white text-xs select-none">
              <span className="text-[11px] font-semibold text-gray-500">Enabled</span>
              <EnableToggle checked={!prompt.disabled} onChange={(checked) => setItemDisabled('prompt', prompt.id, !checked)} />
            </div>
          )}

          {/* Visibility Popover (Owner/SA) */}
          {can('set-visibility', prompt) && (
            <div className="relative">
              <button 
                onClick={() => setIsVisibilityOpen(!isVisibilityOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-55 cursor-pointer focus:outline-none"
              >
                <Globe className="w-3.5 h-3.5 text-gray-505" />
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
                        checked={prompt.visibility?.global || false} 
                        onChange={(e) => setItemVisibility('prompt', prompt.id, {
                          global: e.target.checked,
                          workspaceIds: prompt.visibility?.workspaceIds || []
                        })}
                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workspaces Share</span>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {workspaces.map(ws => {
                          const isChecked = prompt.visibility?.workspaceIds?.includes(ws.id) || false;
                          return (
                            <label key={ws.id} className="flex items-center gap-2 text-xs p-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const list = prompt.visibility?.workspaceIds || [];
                                  const nextList = e.target.checked 
                                    ? [...list, ws.id]
                                    : list.filter(wId => wId !== ws.id);
                                  setItemVisibility('prompt', prompt.id, {
                                    global: prompt.visibility?.global || false,
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
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-55 cursor-pointer focus:outline-none"
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
            prompt.deletionRequested ? (
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

      {/* 4 Detail Tabs Strip */}
      <div className="px-6 border-b border-gray-200 bg-white select-none">
        <div className="flex items-center gap-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'version', label: 'Version Snapshots' },
            { key: 'audit', label: 'Audit Trail' },
            { key: 'comments', label: `Comments (${prompt.comments?.length || 0})` }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap focus:outline-none ${
                activeTab === tab.key 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-gray-505 hover:text-gray-700'
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* Left Column: prompt content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Content Viewer */}
              <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3">
                <div className="flex justify-between items-center select-none">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Template Raw Text</h3>
                  <button onClick={handleCopyPrompt} className="p-1 px-2 border rounded text-gray-600 flex items-center gap-1.5 hover:bg-gray-50 text-[11px] font-semibold cursor-pointer">
                    <Copy className="w-3 h-3" />
                    Copy
                  </button>
                </div>
                <pre className="p-3 bg-gray-50 border rounded font-mono-custom text-[11.5px] max-h-60 overflow-y-auto whitespace-pre-wrap select-all text-gray-750 font-medium">
                  {prompt.content || ''}
                </pre>
              </div>
            </div>

            {/* Right Column: details & args */}
            <div className="space-y-6">
              
              {/* Arguments list */}
              <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Template Variables</h3>
                {prompt.args?.length === 0 ? (
                  <span className="text-xs text-gray-400 font-medium">No dynamic variables required for compilation.</span>
                ) : (
                  <div className="space-y-3 text-xs">
                    {prompt.args?.map(arg => (
                      <div key={arg.name} className="border-b pb-2 last:border-0 last:pb-0">
                        <div className="flex justify-between font-semibold">
                          <span className="font-mono text-gray-700">{arg.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase">{arg.required ? 'Required' : 'Optional'}</span>
                        </div>
                        <p className="text-gray-400 text-[11px] mt-0.5">{arg.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Identity metadata */}
              <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Identity info</h3>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <dt className="text-gray-400 font-medium">ID slug</dt>
                    <dd className="font-mono text-gray-700">{prompt.id}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <dt className="text-gray-400 font-medium">Author</dt>
                    <dd className="font-semibold text-gray-700">{prompt.author}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <dt className="text-gray-400 font-medium">Template Source</dt>
                    <dd className="font-mono text-gray-700">{prompt.source}</dd>
                  </div>
                  <div className="flex justify-between pb-0">
                    <dt className="text-gray-400 font-medium">Rating score</dt>
                    <dd className="font-semibold text-gray-700">★ {prompt.rating.toFixed(1)} ({prompt.reviewsCount} votes)</dd>
                  </div>
                </dl>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Version Snapshots */}
        {activeTab === 'version' && (
          <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
            
            <div className="flex justify-between items-center select-none pb-2 border-b">
              <span className="text-xs text-gray-400 font-bold uppercase font-mono">Snapshot list (no files columns)</span>
              {selectedVersions.length === 2 && (
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
                >
                  Compare Diff
                </button>
              )}
            </div>

            <SmartTable 
              data={(prompt.versions || []).map((v: any) => ({ ...v, id: v.version }))}
              columns={[
                {
                  key: 'compare',
                  header: 'Compare',
                  render: (row: any) => (
                    <input 
                      type="checkbox"
                      checked={selectedVersions.includes(row.version)}
                      onChange={(e) => handleVersionCheck(row.version, e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  )
                },
                {
                  key: 'version',
                  header: 'Version',
                  render: (row: any) => <span className="font-mono-custom font-bold text-gray-800">v{row.version}</span>
                },
                {
                  key: 'date',
                  header: 'Snapshot Date',
                  render: (row: any) => <span className="font-mono-custom text-gray-405">{new Date(row.date).toLocaleDateString()}</span>
                },
                {
                  key: 'changelog',
                  header: 'Release Notes',
                  render: (row: any) => <div className="text-gray-500 truncate max-w-sm" dangerouslySetInnerHTML={{ __html: row.changelog }} />
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: any) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{row.status.toUpperCase()}</span>
                }
              ]}
            />
          </div>
        )}

        {/* Tab 3: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={((prompt as any).auditRecords || []).map((r: any, idx: number) => ({ ...r, id: idx }))}
              columns={[
                {
                  key: 'status',
                  header: 'Action',
                  render: (row: any) => <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{row.healthStatus || 'Update'}</span>
                },
                {
                  key: 'updatedBy',
                  header: 'User email',
                  render: (row: any) => <span className="font-mono-custom text-gray-600">{row.updatedBy}</span>
                },
                {
                  key: 'whatUpdated',
                  header: 'Audit Description',
                  render: (row: any) => <span className="font-semibold text-gray-800">{row.whatChanged}</span>
                },
                {
                  key: 'date',
                  header: 'When',
                  render: (row: any) => <span className="font-mono-custom text-gray-505">{new Date(row.editedAt || prompt.registeredAt || '').toLocaleDateString()}</span>
                }
              ]}
            />
          </div>
        )}

        {/* Tab 4: Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            
            {/* Comment composer */}
            {currentUser && (
              <form onSubmit={handlePostComment} className="bg-white border border-gray-200 rounded-md p-4 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Write a Comment</h3>
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={3}
                  required
                  placeholder="Share feedback on this template variable mappings..."
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex justify-end">
                  <button type="submit" className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">
                    Post Comment
                  </button>
                </div>
              </form>
            )}

            {/* Comments list */}
            <div className="space-y-4">
              {prompt.comments?.length === 0 ? (
                <EmptyState description="No comments have been posted yet." />
              ) : (
                prompt.comments?.map((comment, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-md p-4 shadow-sm select-none">
                    <div className="flex items-center justify-between text-[11px] border-b pb-1.5 mb-2 border-gray-100">
                      <span className="font-bold text-gray-700">{comment.author}</span>
                      <span className="text-gray-400 font-mono-custom">{new Date(comment.date).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed font-semibold">{comment.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Edit Config Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50">
            <form onSubmit={handleSaveEdit}>
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-55">
                <h3 className="text-sm font-semibold text-gray-800">Edit Prompt Config</h3>
                <button type="button" onClick={() => setIsEditOpen(false)} className="text-gray-400 font-bold">✕</button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Prompt Name *</label>
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
                <button type="button" onClick={() => setIsEditOpen(false)} className="px-3.5 py-1.5 border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-55 cursor-pointer">Cancel</button>
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
              <h3 className="text-sm font-bold text-gray-800">Directly Delete Prompt</h3>
              <p className="text-xs text-gray-505 leading-relaxed">
                Are you sure you want to delete "{prompt.name}"? This operation executes immediately and produces a ChangeRecord.
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
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-55">
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
                  placeholder="e.g. Prompt template has been decommissioned..."
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

      {/* Compare Modal */}
      {isCompareOpen && selectedVersions.length === 2 && (
        <CompareDialog 
          assetName={prompt.name}
          verA={selectedVersions[0]}
          verB={selectedVersions[1]}
          onClose={() => {
            setIsCompareOpen(false);
            setSelectedVersions([]);
          }}
        />
      )}

    </div>
  );
};
