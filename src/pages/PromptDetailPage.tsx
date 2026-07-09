import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { usePageSearch } from '@/context/SearchContext';
import { useDetailTab } from '@/context/DetailTabContext';
import { FEATURES } from '@/config/features';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { DetailHeader } from '@/components/registry/DetailHeader';
import { DetailTabs } from '@/components/registry/DetailTabs';
import { SmartTable } from '@/components/registry/SmartTable';
import { VersionsTable } from '@/components/registry/VersionsTable';
import { CompareDialog } from '@/components/registry/CompareDialog';
import { copyText, VerifiedBadge, ScanGrade, StatusBadge, RatingStars, RatePopover, BookmarkToggle, EmptyState } from '@/components/registry/UIHelperKit';
import { Copy, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const PromptDetailPage: React.FC = () => {
  // If the prompts feature is off, redirect to home page.
  if (!FEATURES.prompts) {
    return <Navigate to="/" replace />;
  }

  const { id } = useParams<{ id: string }>();
  const { prompts, currentUser, deleteItem, promptComments, addComment } = useRegistry();
  const detailTabContext = useDetailTab();

  const [activeTab, setActiveTabLocal] = useState('overview');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [commentText, setCommentText] = useState('');

  const prompt = prompts.find((p) => p.id === id);

  usePageSearch(prompt ? `Search in ${prompt.name}...` : 'Search prompt details...');

  useEffect(() => {
    if (prompt) {
      detailTabContext?.setActiveTab(activeTab === 'overview' ? '' : activeTab);
    }
    return () => {
      detailTabContext?.setActiveTab('');
    };
  }, [activeTab, prompt, detailTabContext]);

  if (!prompt) {
    return (
      <EmptyState
        message="Prompt not found. The prompt you are looking for does not exist."
        actionLabel="Back to Catalog"
        onAction={() => window.history.back()}
      />
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCopyPrompt = () => {
    copyText(prompt.content);
    toast.success('Prompt copied to clipboard!');
  };

  const handleDeleteConfirm = () => {
    deleteItem('prompt', prompt.id);
    toast.error(`Prompt "${prompt.name}" has been deleted.`);
    setDeleteOpen(false);
    window.history.back();
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment('prompt', prompt.id, commentText.trim());
    setCommentText('');
    toast.success('Comment posted successfully!');
  };

  const versionItems = (prompt.versions || []).map(v => ({
    ...v,
    approvalStatus: 'approved'
  }));

  const selectedV1 = selectedVersions[0] ? versionItems.find(v => v.version === selectedVersions[0]) : null;
  const selectedV2 = selectedVersions[1] ? versionItems.find(v => v.version === selectedVersions[1]) : null;

  const compareButtonDisabled = selectedVersions.length !== 2;
  const comments = promptComments[prompt.id] || [];

  const handleSelectVersion = (version: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(version)) {
        return prev.filter(v => v !== version);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, version];
    });
  };

  // Check if there are arguments/variables declared
  const hasArgs = prompt.argCount > 0;
  const mockArgs = [
    { name: 'diff', type: 'string', description: 'The raw git diff block.' },
    { name: 'author', type: 'string', description: 'GitHub username of pull request submitter.' },
    { name: 'target_branch', type: 'string', description: 'Target branch name (e.g. main).' }
  ].slice(0, prompt.argCount);

  const tabsConfig = [
    { key: 'overview', label: 'Overview' },
    { key: 'version', label: 'Version' },
    { key: 'audit', label: 'Audit' },
    { key: 'comments', label: 'Comments' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <DetailHeader
        iconName={prompt.iconName || 'scroll'}
        name={prompt.name}
        badgeCluster={
          <>
            <StatusBadge status={prompt.status} />
            {prompt.trust?.verified && <VerifiedBadge />}
            {prompt.trust && <ScanGrade score={prompt.trust.score} />}
          </>
        }
        description={prompt.description}
        metaLine={
          <>
            <span className="font-mono">{prompt.author}@registry.org</span>
            <span>·</span>
            <span>Created {formatDate(prompt.createdAt)}</span>
            <span>·</span>
            <RatingStars rating={prompt.rating || 0.0} reviewsCount={prompt.reviewsCount || 0} />
          </>
        }
        tags={prompt.tags || []}
        actionSlot={
          <>
            <BookmarkToggle kind="prompt" id={prompt.id} />
            <RatePopover kind="prompt" id={prompt.id} />
            <button
              onClick={handleCopyPrompt}
              className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Copy className="size-4" />
              <span>Copy Prompt</span>
            </button>
            {currentUser?.role === 'super_admin' && (
              <button
                onClick={() => setDeleteOpen(true)}
                className="h-9 px-3 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-600 inline-flex items-center gap-1.5 cursor-pointer text-xs font-semibold"
              >
                <Trash2 className="size-4" />
                <span>Delete</span>
              </button>
            )}
          </>
        }
      />

      {/* Detail Tabs */}
      <DetailTabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTabLocal}
        rightAction={
          activeTab === 'version' ? (
            <button
              disabled={compareButtonDisabled}
              onClick={() => setCompareOpen(true)}
              className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Compare ({selectedVersions.length}/2)
            </button>
          ) : undefined
        }
      />

      {/* Tab Viewports */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Metadata Card */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 select-none">Prompt Specifications</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground font-semibold mb-1">Author</dt>
                    <dd className="text-foreground">{prompt.author}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-semibold mb-1">Source origin</dt>
                    <dd className="text-foreground">{prompt.source || 'Library fixtures'}</dd>
                  </div>
                </dl>
              </Card>

              {/* Prompt Content Card */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                <div className="flex items-center justify-between select-none">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Prompt Template Body</h3>
                  <button
                    onClick={handleCopyPrompt}
                    className="h-7 px-2.5 rounded border border-border bg-background hover:bg-accent text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="size-3" />
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="bg-muted p-4 rounded-lg font-mono text-[12.5px] overflow-auto select-all leading-relaxed whitespace-pre border border-border/40 text-foreground max-h-[400px]">
                  {prompt.content}
                </pre>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Identity Card */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3 select-none">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Identity Details</h3>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Prompt ID</span>
                    <span className="font-mono text-foreground">{prompt.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Registry Owner</span>
                    <span className="text-foreground">{prompt.ownerName}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/40 pb-1.5">
                    <span className="text-muted-foreground">Created Date</span>
                    <span className="text-foreground">{formatDate(prompt.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Used</span>
                    <span className="text-foreground">{formatDate(prompt.lastUsedAt)}</span>
                  </div>
                </dl>
              </Card>

              {/* Requirements / Arguments Card */}
              {hasArgs && (
                <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Declared Variables</h3>
                  <div className="space-y-3 select-none">
                    {mockArgs.map((arg, idx) => (
                      <div key={idx} className="text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-semibold text-foreground select-all">{arg.name}</span>
                          <span className="text-[10px] uppercase font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded leading-none">
                            {arg.type}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-normal">{arg.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'version' && (
        <VersionsTable
          versions={versionItems}
          currentVersion={prompt.version}
          compareEnabled={true}
          selectedVersions={selectedVersions}
          onSelectVersion={handleSelectVersion}
          hideFilesAndSize={true}
        />
      )}

      {activeTab === 'audit' && (
        <SmartTable
          searchPlaceholder="Search audit events..."
          searchKeys={['action', 'user', 'details']}
          columns={[
            {
              key: 'action',
              header: 'Action',
              className: 'w-[130px] py-2',
              render: (row) => {
                const act = row.action.toLowerCase();
                let colorClass = 'bg-muted text-muted-foreground border-border';
                if (act === 'approved') {
                  colorClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                } else if (act === 'scanned') {
                  colorClass = 'bg-primary/10 text-primary border-primary/20';
                }
                return (
                  <span className={`inline-flex text-[9.5px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${colorClass}`}>
                    {row.action}
                  </span>
                );
              }
            },
            {
              key: 'user',
              header: 'Auditor User',
              className: 'font-mono text-muted-foreground select-all',
              render: (row) => <span>{row.user}</span>
            },
            {
              key: 'details',
              header: 'Details',
              render: (row) => <span className="font-semibold text-foreground">{row.details}</span>
            },
            {
              key: 'when',
              header: 'When',
              className: 'w-[160px] font-mono text-right pr-4',
              render: (row) => <span>{formatDateTime(row.when)}</span>
            }
          ]}
          rows={[
            { action: 'approved', user: 'jordan@blake.com', details: `v${prompt.version} approved by Admin`, when: prompt.createdAt }
          ]}
        />
      )}

      {activeTab === 'comments' && (
        <div className="space-y-6 select-none">
          <Card className="bg-card border-border rounded-xl shadow-none p-5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Prompt Discussions</h3>

            {comments.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-border/80 rounded-xl text-xs text-muted-foreground mb-4">
                No comments posted yet. Start the discussion below.
              </div>
            ) : (
              <div className="space-y-4 mb-6 divide-y divide-border/40">
                {comments.map((comm, idx) => (
                  <div key={idx} className={`flex gap-3 text-xs ${idx > 0 ? 'pt-4' : ''}`}>
                    <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-sans">
                      {comm.initials}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{comm.author}</span>
                        <span className="font-mono text-[10px] text-muted-foreground">{formatDateTime(comm.date)}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{comm.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handlePostComment} className="flex gap-3">
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold font-sans shrink-0">
                {currentUser?.initials || 'AV'}
              </div>
              <div className="flex-1 space-y-3">
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Post a reply or check comments..."
                  rows={3}
                  className="w-full rounded-lg border border-border bg-muted/20 p-3 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="h-8 px-4 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="size-3" />
                    <span>Post Comment</span>
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Compare Version Dialog */}
      {selectedV1 && selectedV2 && (
        <CompareDialog
          open={compareOpen}
          onOpenChange={setCompareOpen}
          v1Name={`v${selectedV1.version}`}
          v2Name={`v${selectedV2.version}`}
          v1Content={selectedV1.content || ''}
          v2Content={selectedV2.content || ''}
        />
      )}

      {/* Delete Item Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[420px] p-6 bg-card border border-border rounded-xl select-none">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-bold text-foreground">Confirm Delete Prompt</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you absolutely sure you want to delete this prompt? This will remove it from all workspace registries permanently.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="h-9 px-4 text-xs font-semibold rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="h-9 px-4 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 flex items-center gap-1.5"
            >
              <Trash2 className="size-3.5" />
              <span>Confirm Delete</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
