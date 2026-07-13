import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import {
  EntityIcon, StatusBadge, HealthDot, RatePopover, BookmarkToggle,
  EnableToggle, CopyHashField, EmptyState
} from '@/components/registry/Kit';
import { SmartTable, CompareDialog, StatCard } from '@/components/registry/Primitives';
import { 
  Download, Globe, AlertTriangle, Eye, Edit, ChevronDown, ChevronRight, FolderOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

export const SkillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { 
    skills, currentUser, bookmarks, toggleBookmark, rateItem,
    updateItem, setItemDisabled, setItemVisibility, requestDeletion,
    cancelDeletionRequest, deleteItemDirect, can, workspaces, addComment, getHealthDisplay
  } = useRegistry();

  // Find asset
  const skill = skills.find(s => s.id === id);

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isVisibilityOpen, setIsVisibilityOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDelReqOpen, setIsDelReqOpen] = useState(false);
  const [delReason, setDelReason] = useState('');
  
  // Versions Compare states
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
  // File viewer state
  const [selectedFile, setSelectedFile] = useState<{ path: string; content: string } | null>(null);

  // Comment state
  const [newComment, setNewComment] = useState('');

  // Local state for expanded sections
  const allVersions = useMemo(() => {
    const list = [...(skill?.versions || [])];
    list.sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true, sensitivity: 'base' }));
    return list;
  }, [skill?.versions]);

  const getVersionFiles = (v: { version: string; date: string; changelog: string; active: boolean; files?: any[] }) => {
    if (v.files) return v.files;
    if (v.active) return skill?.files || [];
    return [
      { name: 'SKILL.md', kind: 'markdown', sizeKb: 2.2, createdAt: v.date, updatedAt: v.date, content: `# Skill Version ${v.version}\n\nThis is a mock SKILL.md for version ${v.version}.\n\nChangelog: ${v.changelog}` },
      { name: 'main.py', kind: 'script', sizeKb: 8.0, createdAt: v.date, updatedAt: v.date, content: `# main.py for version ${v.version}\n# Auto-generated code.` }
    ];
  };

  const totalFilesCount = useMemo(() => {
    let count = 0;
    allVersions.forEach((v: { version: string; date: string; changelog: string; active: boolean; files?: any[] }) => {
      count += getVersionFiles(v).length;
    });
    return count;
  }, [allVersions, skill?.files]);

  const activeVersionNum = skill?.versions?.find(v => v.active)?.version || '1.0.0';
  const [expandedVersions, setExpandedVersions] = useState<Record<string, boolean>>({
    [activeVersionNum]: true
  });

  const toggleVersionExpanded = (vNum: string) => {
    setExpandedVersions(prev => ({
      ...prev,
      [vNum]: !prev[vNum]
    }));
  };

  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    if (skill) {
      setEditName(skill.name);
      setEditDesc(skill.description);
    }
  }, [skill]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  if (!skill) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-sm font-bold text-gray-800">Skill not found.</h2>
        <button 
          onClick={() => navigate('/catalog')}
          className="mt-4 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground cursor-pointer"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const isBookmarked = bookmarks.skill?.includes(skill.id) || false;
  const isOwner = currentUser?.name === (skill.identity?.ownerName || 'Community');
  const showEditButton = (isOwner && (skill.status === 'pending' || skill.status === 'in_review')) || (currentUser?.role === 'super_admin');

  // Telemetry chart options
  const chartData = [
    { name: '7d ago', downloads: Math.round(skill.downloads * 0.1) },
    { name: '5d ago', downloads: Math.round(skill.downloads * 0.3) },
    { name: '3d ago', downloads: Math.round(skill.downloads * 0.6) },
    { name: 'Today', downloads: skill.downloads }
  ];

  // Blob Download execution
  const handleDownloadFile = () => {
    const fileContents = `# Skill Configuration: ${skill.name}\n` +
      `id: ${skill.id}\n` +
      `version: ${skill.versions?.[0]?.version || '1.0.0'}\n` +
      `author: ${skill.identity?.ownerName || 'Community'}\n\n` +
      `## Description\n${skill.description}\n\n` +
      `## Requirements\n${skill.requirements?.env?.join('\n') || ''}\n`;
      
    const blob = new Blob([fileContents], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${skill.id}-v${skill.versions?.[0]?.version || '1.0.0'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Skill code manifest configuration downloaded.');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error('Name is required.');
      return;
    }
    updateItem('skill', skill.id, { name: editName, description: editDesc });
    setIsEditOpen(false);
  };

  const handleDirectDelete = () => {
    deleteItemDirect('skill', skill.id);
    navigate('/catalog');
    toast.success('Skill deleted.');
  };

  const handleSubmitDelReq = () => {
    requestDeletion('skill', skill.id, delReason);
    setIsDelReqOpen(false);
  };

  const handleCancelDelReq = () => {
    cancelDeletionRequest('skill', skill.id);
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
    addComment('skill', skill.id, newComment.trim());
    setNewComment('');
    toast.success('Comment posted.');
  };

  return (
    <div className="relative select-none pb-12">
      
      {/* Sticky Detail Header on scroll */}
      <div className="sticky top-0 bg-white/95 border-b border-gray-200 px-6 py-3 flex items-center justify-between z-20 backdrop-blur-sm">
        <div className="flex items-center gap-3.5 min-w-0">
          <EntityIcon kind="skill" size="sm" />
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-gray-800 truncate">{skill.name}</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate font-mono-custom">v{skill.versions?.[0]?.version || '1.0.0'} · {skill.identity?.ownerName || 'Community'}</p>
          </div>
          <div className="flex gap-1.5 items-center shrink-0">
            <StatusBadge status={skill.status} disabled={skill.disabled} deletionRequested={skill.deletionRequested} />
            <HealthDot status={getHealthDisplay(skill)} showLabel />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          
          <button 
            onClick={handleDownloadFile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
          >
            <Download className="w-3.5 h-3.5" />
            Download MD
          </button>

          <BookmarkToggle isBookmarked={isBookmarked} onToggle={() => toggleBookmark('skill', skill.id)} />
          <RatePopover itemId={skill.id} currentRating={skill.rating} onRate={(r) => rateItem('skill', skill.id, r)} />
          
          {/* Enable/Disable Switch (Owner/SA) */}
          {can('toggle-disabled', skill) && (
            <div className="flex items-center gap-2 border border-gray-200 rounded px-2.5 py-1 bg-white text-xs select-none">
              <span className="text-[11px] font-semibold text-gray-500">Enabled</span>
              <EnableToggle checked={!skill.disabled} onChange={(checked) => setItemDisabled('skill', skill.id, !checked)} />
            </div>
          )}

          {/* Visibility Popover (Owner/SA) */}
          {can('set-visibility', skill) && (
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
                        checked={skill.visibility?.global || false} 
                        onChange={(e) => setItemVisibility('skill', skill.id, {
                          global: e.target.checked,
                          workspaceIds: skill.visibility?.workspaceIds || []
                        })}
                        className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Workspaces Share</span>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {workspaces.map(ws => {
                          const isChecked = skill.visibility?.workspaceIds?.includes(ws.id) || false;
                          return (
                            <label key={ws.id} className="flex items-center gap-2 text-xs p-1 hover:bg-gray-50 rounded cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const list = skill.visibility?.workspaceIds || [];
                                  const nextList = e.target.checked 
                                    ? [...list, ws.id]
                                    : list.filter(wId => wId !== ws.id);
                                  setItemVisibility('skill', skill.id, {
                                    global: skill.visibility?.global || false,
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
            skill.deletionRequested ? (
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

      {/* 7 Detail Tabs Strip */}
      <div className="px-6 border-b border-gray-200 bg-white select-none">
        <div className="flex items-center gap-6 overflow-x-auto">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'version', label: 'Version history' },
            { key: 'changelog', label: 'Changelog' },
            { key: 'files', label: `Files (${totalFilesCount})` },
            { key: 'scan', label: 'Security risk check' },
            { key: 'audit', label: 'Audit trail' },
            { key: 'comments', label: `Comments (${skill.comments?.length || 0})` }
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
            
            {/* Frontmatter card */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-white border border-gray-200 rounded-md p-5 space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 select-none font-mono">Frontmatter Metadata</h3>
                
                <div className="border border-gray-150 rounded bg-gray-50 p-4 font-mono-custom text-xs text-gray-700 space-y-1.5">
                  <div>name: {skill.name}</div>
                  <div>version: {skill.versions?.[0]?.version || '1.0.0'}</div>
                  <div>sandbox: {JSON.stringify(skill.requirements || {})}</div>
                  <div>network: {skill.requirements?.network ? 'true' : 'false'}</div>
                  <div>category: {skill.category}</div>
                </div>

                <div className="space-y-1 pt-1.5">
                  <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Secure hash signature</span>
                  <CopyHashField hash={skill.contentHash || 'SHA-256: 4f18db0d38b5ef194a2b97c413b1f5e2777174e2d31f0b0938b'} />
                </div>
              </div>

              {/* Downloads Trend Chart */}
              <div className="bg-white border border-gray-200 rounded-md p-5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 select-none">Skill Downloads Trend</h3>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="downloads" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.08} strokeWidth={1.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Requirements & Info Column */}
            <div className="space-y-6">
              
              {/* Python runtime packages card */}
              <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Python Package Requirements</h3>
                {(skill.requirements?.env || []).length === 0 ? (
                  <span className="text-xs text-gray-400 font-medium">No external package dependencies required.</span>
                ) : (
                  <div className="space-y-1.5">
                    {skill.requirements?.env?.map((req: any) => (
                      <div key={req} className="font-mono-custom text-xs text-gray-600 bg-gray-50 border p-1 px-2.5 rounded truncate select-all">
                        {req}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Identity details */}
              <div className="bg-white border border-gray-200 rounded-md p-5 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Identity info</h3>
                <dl className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <dt className="text-gray-400 font-medium">ID slug</dt>
                    <dd className="font-mono text-gray-700">{skill.id}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <dt className="text-gray-400 font-medium">Owner</dt>
                    <dd className="font-semibold text-gray-700">{skill.identity?.ownerName || 'Community'}</dd>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <dt className="text-gray-400 font-medium">Rating score</dt>
                    <dd className="font-semibold text-gray-700">★ {skill.rating.toFixed(1)} ({skill.reviewsCount} votes)</dd>
                  </div>
                  <div className="flex justify-between pb-0">
                    <dt className="text-gray-400 font-medium">Category</dt>
                    <dd className="font-bold text-gray-700 uppercase">{skill.category}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Version history */}
        {activeTab === 'version' && (
          <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
            
            <div className="flex justify-between items-center select-none pb-2 border-b">
              <span className="text-xs text-gray-400 font-bold uppercase font-mono">Version compare list</span>
              {selectedVersions.length === 2 && (
                <button
                  onClick={() => setIsCompareOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Compare Diff
                </button>
              )}
            </div>

            <SmartTable 
              data={(skill.versions || []).map((v: any) => ({ ...v, id: v.version }))}
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
                  header: 'Published',
                  render: (row: any) => <span className="font-mono-custom text-gray-400">{new Date(row.date).toLocaleDateString()}</span>
                },
                {
                  key: 'changelog',
                  header: 'Notes',
                  render: (row: any) => <div className="text-gray-500 max-w-md truncate" dangerouslySetInnerHTML={{ __html: row.changelog }} />
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: any) => <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{row.status.toUpperCase()}</span>
                },
                {
                  key: 'actions',
                  header: 'Download',
                  render: () => (
                    <button onClick={handleDownloadFile} className="p-1 border rounded hover:bg-gray-50 text-gray-600 cursor-pointer shrink-0">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )
                }
              ]}
            />
          </div>
        )}

        {/* Tab 2.5: Changelog Timeline */}
        {activeTab === 'changelog' && (
          <div className="bg-white border border-gray-200 rounded-md p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-6 border-b pb-2">Version Release Changelogs</h3>
            <div className="relative border-l border-teal-200 ml-4 pl-6 space-y-8 select-none">
              {allVersions.map((v: any) => (
                <div key={v.version} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-teal-500 bg-white" />
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        v.active 
                          ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' 
                          : 'bg-gray-250 border border-gray-300 text-gray-700'
                      }`}>
                        v{v.version} {v.active && 'Active'}
                      </span>
                      <span className="text-xs text-gray-400 font-mono-custom">
                        Released: {new Date(v.date).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Changelog Content */}
                    <div 
                      className="text-xs text-gray-650 prose prose-sm max-w-none bg-gray-50 border border-gray-200 rounded p-3"
                      dangerouslySetInnerHTML={{ __html: v.changelog || 'No release notes.' }}
                    />

                    {/* Link back to Files section */}
                    <div>
                      <button
                        onClick={() => {
                          handleTabChange('files');
                          setExpandedVersions(prev => ({
                            ...prev,
                            [v.version]: true
                          }));
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-teal-600 hover:text-teal-800 hover:underline mt-1"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        View files for v{v.version}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Files */}
        {activeTab === 'files' && (
          <div className="space-y-4">
            {allVersions.map((v: any) => {
              const files = getVersionFiles(v);
              const totalSize = files.reduce((acc: number, f: any) => acc + f.sizeKb, 0).toFixed(1);
              const isExpanded = !!expandedVersions[v.version];
              
              return (
                <div key={v.version} className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                  {/* Collapsible Section Header */}
                  <div 
                    onClick={() => toggleVersionExpanded(v.version)}
                    className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-150 cursor-pointer hover:bg-gray-100 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        v.active 
                          ? 'bg-emerald-100 border border-emerald-300 text-emerald-800' 
                          : 'bg-gray-200 border border-gray-300 text-gray-700'
                      }`}>
                        v{v.version} {v.active && 'Active'}
                      </span>
                      <span className="text-xs text-gray-500 font-mono-custom">
                        {new Date(v.date).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({files.length} files, {totalSize} KB)
                      </span>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Section Body */}
                  {isExpanded && (
                    <div className="p-4 bg-white">
                      <SmartTable 
                        data={files.map((f: any) => ({ ...f, id: f.name }))}
                        columns={[
                          {
                            key: 'path',
                            header: 'File Name',
                            sortable: true,
                            render: (row: any) => <span className="font-mono-custom font-bold text-gray-700">{row.name}</span>
                          },
                          {
                            key: 'kind',
                            header: 'Type',
                            sortable: true,
                            render: (row: any) => <span className="text-gray-505 text-xs">{row.kind}</span>
                          },
                          {
                            key: 'size',
                            header: 'File Size',
                            sortable: true,
                            render: (row: any) => <span className="font-mono-custom text-gray-400">{row.sizeKb} KB</span>
                          },
                          {
                            key: 'actions',
                            header: 'Actions',
                            render: (row: any) => (
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => setSelectedFile({ path: row.name, content: row.content })}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    const blob = new Blob([row.content || ''], { type: 'text/markdown' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = row.name;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  Download
                                </button>
                              </div>
                            )
                          }
                        ]}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 4: Security scan details */}
        {activeTab === 'security' || activeTab === 'scan' ? (
          <div className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4 select-none">
              <StatCard
                label="Scan Result Verdict"
                value={getHealthDisplay(skill).toUpperCase()}
                subtext="Derived from the latest security scan pipeline"
                className={getHealthDisplay(skill) === 'Unhealthy' ? 'bg-red-50/10' : getHealthDisplay(skill) === 'Healthy' ? 'bg-emerald-50/10' : ''}
              />
              <StatCard label="Findings Matched" value={skill.scan?.findings?.length || 0} subtext="Total rule matches in last scan" />
            </div>

            <div className="bg-white border border-gray-200 rounded-md p-4 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Risk Scan Rule Catalog</h3>
              
              <SmartTable 
                data={[
                  { id: 'jail', type: 'HIGH', rule: 'Jail escapes checks', desc: 'Detects nested subprocess execution, eval, exec, compile calls.', count: 0 },
                  { id: 'write', type: 'MEDIUM', rule: 'Undeclared writes checks', desc: 'Checks for shutil, os.remove, open write mode writes.', count: 0 },
                  { id: 'net', type: 'MEDIUM', rule: 'Network access check', desc: 'Queries requests, sockets, urllib if network is disabled.', count: 0 },
                  { id: 'token', type: 'LOW', rule: 'Hardcoded tokens check', desc: 'Matches credential expressions like sk-, ghp_ API tags.', count: 0 }
                ]}
                columns={[
                  { key: 'type', header: 'Risk Severity', render: (row: any) => <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${row.type === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-55 text-gray-500 border-gray-255'}`}>{row.type}</span> },
                  { key: 'rule', header: 'Scanned check rule', render: (row: any) => <span className="font-semibold text-gray-700">{row.rule}</span> },
                  { key: 'desc', header: 'Scan description', render: (row: any) => <span className="text-gray-400">{row.desc}</span> },
                  { key: 'findings', header: 'Findings matches', render: (row: any) => <span className="font-mono-custom text-gray-750">{row.count}</span> }
                ]}
              />
            </div>
          </div>
        ) : null}

        {/* Tab 5: Audit Log */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <SmartTable 
              data={((skill as any).auditRecords || []).map((r: any, idx: number) => ({ ...r, id: idx }))}
              columns={[
                {
                  key: 'status',
                  header: 'Action',
                  render: (row: any) => <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{row.healthStatus || 'Update'}</span>
                },
                {
                  key: 'updatedBy',
                  header: 'User identity',
                  render: (row: any) => <span className="font-mono-custom text-gray-605">{row.updatedBy}</span>
                },
                {
                  key: 'whatUpdated',
                  header: 'Audit Details',
                  render: (row: any) => <span className="font-semibold text-gray-750">{row.whatChanged}</span>
                },
                {
                  key: 'date',
                  header: 'Date Performed',
                  render: (row: any) => <span className="font-mono-custom text-gray-450">{new Date(row.editedAt || skill.registeredAt).toLocaleDateString()}</span>
                }
              ]}
            />
          </div>
        )}

        {/* Tab 6: Comments */}
        {activeTab === 'comments' && (
          <div className="space-y-6">
            
            {/* Comment Composer */}
            {currentUser && (
              <form onSubmit={handlePostComment} className="bg-white border border-gray-200 rounded-md p-4 space-y-3.5">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Post a Comment</h3>
                <textarea 
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  rows={3}
                  required
                  placeholder="Share feedback or runtime issues on this skill file..."
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex justify-end">
                  <button type="submit" className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer">
                    Post Comment
                  </button>
                </div>
              </form>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {skill.comments?.length === 0 ? (
                <EmptyState description="No comments have been posted yet." />
              ) : (
                skill.comments?.map((comment, idx) => (
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
                <h3 className="text-sm font-semibold text-gray-800">Edit Skill Config</h3>
                <button type="button" onClick={() => setIsEditOpen(false)} className="text-gray-400 font-bold">✕</button>
              </div>
              <div className="p-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Skill Name *</label>
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
              <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-55">
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
              <h3 className="text-sm font-bold text-gray-800">Directly Delete Skill</h3>
              <p className="text-xs text-gray-505 leading-relaxed">
                Are you sure you want to delete "{skill.name}"? This operation executes immediately and produces a ChangeRecord.
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
                  placeholder="e.g. Skill code has been decommissioned..."
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
          assetName={skill.name}
          verA={selectedVersions[0]}
          verB={selectedVersions[1]}
          onClose={() => {
            setIsCompareOpen(false);
            setSelectedVersions([]);
          }}
        />
      )}

      {/* File Viewer Modal */}
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 select-none">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden z-50 flex flex-col h-[500px]">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-55">
              <h3 className="text-xs font-bold text-gray-800 truncate font-mono-custom">{selectedFile.path}</h3>
              <button type="button" onClick={() => setSelectedFile(null)} className="text-gray-400 font-bold hover:text-gray-700">✕</button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 text-xs font-mono-custom select-text leading-relaxed">
              <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
            </div>
            <div className="flex justify-end px-4 py-3 border-t border-gray-200 bg-gray-55">
              <button onClick={() => setSelectedFile(null)} className="px-3.5 py-1.5 text-xs font-semibold border border-gray-200 rounded bg-white text-gray-700 hover:bg-gray-50 cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
