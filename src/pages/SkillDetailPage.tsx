import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { usePageSearch } from '@/context/SearchContext';
import { useDetailTab } from '@/context/DetailTabContext';
import { toast } from 'sonner';
import { ChartCard } from '@/components/registry/ChartCard';
import { Card } from '@/components/ui/card';
import { DetailHeader } from '@/components/registry/DetailHeader';
import { DetailTabs } from '@/components/registry/DetailTabs';
import { SmartTable } from '@/components/registry/SmartTable';
import { VersionsTable } from '@/components/registry/VersionsTable';
import { CompareDialog } from '@/components/registry/CompareDialog';
import { CopyHashField } from '@/components/registry/CopyHashField';
import { StatusBadge, RatePopover, BookmarkToggle, EmptyState } from '@/components/registry/UIHelperKit';
import { Download, Trash2, Send, FileText, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const SkillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { skills, currentUser, deleteItem, skillComments, addComment, getUsedBy } = useRegistry();
  const detailTabContext = useDetailTab();

  const [activeTab, setActiveTabLocal] = useState('overview');
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [commentText, setCommentText] = useState('');

  // Trend Chart range
  const [trendRange, setTrendRange] = useState<'all' | '30d' | '7d'>('all');

  const skill = skills.find((s) => s.id === id);

  usePageSearch(skill ? `Search in ${skill.name}...` : 'Search skill details...');

  useEffect(() => {
    if (skill) {
      detailTabContext?.setActiveTab(activeTab === 'overview' ? '' : activeTab);
    }
    return () => {
      detailTabContext?.setActiveTab('');
    };
  }, [activeTab, skill, detailTabContext]);

  if (!skill) {
    return (
      <EmptyState
        message="Skill not found. The skill you are looking for does not exist."
        actionLabel="Back to Catalog"
        onAction={() => window.history.back()}
      />
    );
  }

  const { servers, agents } = getUsedBy(skill.id);

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

  const handleDownload = () => {
    const markdownContent = `# ${skill.name}
Version: ${skill.version}
Category: ${skill.category}
Description: ${skill.description}

## Long Description
${skill.longDescription}

## Inputs
${JSON.stringify(skill.inputs, null, 2)}

## Outputs
${JSON.stringify(skill.outputs, null, 2)}
`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${skill.id}-${skill.version}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloaded ${skill.id}-${skill.version}.md`);
  };

  const handleDeleteConfirm = () => {
    deleteItem('skill', skill.id);
    toast.error(`Skill "${skill.name}" has been deleted from catalog and workspaces.`);
    setDeleteOpen(false);
    window.history.back();
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addComment('skill', skill.id, commentText.trim());
    setCommentText('');
    toast.success('Comment posted successfully!');
  };

  // Trend Data based on range selection
  const trendData = useMemo(() => {
    const baseValue = skill.downloads;
    if (trendRange === '7d') {
      return Array.from({ length: 7 }).map((_, i) => ({
        name: `Day ${i + 1}`,
        Downloads: Math.round(baseValue / 30 + Math.random() * 20)
      }));
    }
    if (trendRange === '30d') {
      return Array.from({ length: 30 }).map((_, i) => ({
        name: `D${i + 1}`,
        Downloads: Math.round(baseValue / 12 + Math.random() * 50)
      }));
    }
    // All time (monthly series)
    return [
      { name: 'Jan', Downloads: Math.round(baseValue * 0.1) },
      { name: 'Feb', Downloads: Math.round(baseValue * 0.25) },
      { name: 'Mar', Downloads: Math.round(baseValue * 0.4) },
      { name: 'Apr', Downloads: Math.round(baseValue * 0.6) },
      { name: 'May', Downloads: Math.round(baseValue * 0.75) },
      { name: 'Jun', Downloads: Math.round(baseValue * 0.9) },
      { name: 'Jul', Downloads: baseValue }
    ];
  }, [skill.downloads, trendRange]);

  // Version List and Content snapshot mock
  const versionItems = (skill.versions || []).map(v => {
    let mockContent = `# Skill: ${skill.name} (v${v.version})\n`;
    if (v.version === '1.2.0' || v.version === skill.version) {
      mockContent += `Category: ${skill.category}\n\n## Description\n${skill.longDescription}\n\n## Example Snippet\n${skill.exampleSnippet}\n\n## Rules\n1. Ensure strict bounds compliance.\n2. Handle environment configs securely.`;
    } else {
      mockContent += `Category: ${skill.category}\n\n## Description\n${skill.description}\n\n## Example Snippet\n// Older signature code snippet.`;
    }
    return {
      ...v,
      filesCount: skill.files?.length || 1,
      sizeKb: skill.files?.reduce((acc, f) => acc + f.sizeKb, 0) || 1.5,
      approvalStatus: 'approved',
      content: mockContent
    };
  });

  const selectedV1 = selectedVersions[0] ? versionItems.find(v => v.version === selectedVersions[0]) : null;
  const selectedV2 = selectedVersions[1] ? versionItems.find(v => v.version === selectedVersions[1]) : null;

  const compareButtonDisabled = selectedVersions.length !== 2;

  // Filter comments
  const comments = skillComments[skill.id] || [];

  // Rules Catalog list
  const scanCatalogRules = [
    { rule: 'Exec Calls Check', severity: 'High', detail: 'Flagged symbols: eval, exec, compile, __import__' },
    { rule: 'Shell Command Check', severity: 'High', detail: 'Flagged symbols: subprocess, os.system, os.popen' },
    { rule: 'Env Variable Check', severity: 'High', detail: 'Flagged symbols: os.environ without declarations' },
    { rule: 'File Mutation Check', severity: 'Medium', detail: 'Flagged: open(..., "w"), shutil, rm -rf, os.remove' },
    { rule: 'Undeclared Network', severity: 'Medium', status: 'pass', detail: 'Blocks requests/urllib/socket when network: false' },
    { rule: 'Base64 Obfuscation', severity: 'Medium', detail: 'Flags base64 strings > 200 chars or \\x escapes > 100' },
    { rule: 'Credentials Leaks', severity: 'Low', detail: 'Checks for sk-..., ghp_..., AKIA..., or password =' },
    { rule: 'File Payload Check', severity: 'Low', detail: 'Flags body size exceeding 50 KB' }
  ];

  // Dynamic Findings based on trust score
  const scanFindings = useMemo(() => {
    if (skill.trust.score >= 70) return [];
    return [
      { rule: 'Exec Calls Check', severity: 'High', detail: 'Detected evaluate() block inside main interface script.' },
      { rule: 'File Mutation Check', severity: 'Medium', detail: 'Uses open(..., "w") on temporary config paths.' }
    ];
  }, [skill.trust.score]);

  // Formats file markdown preview beautifully
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-2 text-xs leading-relaxed text-foreground select-text">
        {lines.map((line, idx) => {
          if (line.startsWith('# ')) {
            return <h1 key={idx} className="text-base font-bold border-b border-border/40 pb-1 mt-3">{line.replace('# ', '')}</h1>;
          }
          if (line.startsWith('## ')) {
            return <h2 key={idx} className="text-sm font-semibold mt-2">{line.replace('## ', '')}</h2>;
          }
          if (line.startsWith('- ')) {
            return <li key={idx} className="list-disc ml-4">{line.replace('- ', '')}</li>;
          }
          if (line.trim() === '') {
            return <div key={idx} className="h-1" />;
          }
          // Bold replacement
          let content = line;
          const boldRegex = /\*\*(.*?)\*\*/g;
          const parts = [];
          let lastIndex = 0;
          let match;
          while ((match = boldRegex.exec(content)) !== null) {
            parts.push(content.substring(lastIndex, match.index));
            parts.push(<strong key={match.index} className="font-bold text-foreground">{match[1]}</strong>);
            lastIndex = boldRegex.lastIndex;
          }
          parts.push(content.substring(lastIndex));
          return <p key={idx}>{parts.length > 1 ? parts : line}</p>;
        })}
      </div>
    );
  };

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

  const tabsConfig = [
    { key: 'overview', label: 'Overview' },
    { key: 'version', label: 'Version' },
    { key: 'files', label: 'Files' },
    { key: 'scan', label: 'Scan' },
    { key: 'audit', label: 'Audit' },
    { key: 'comments', label: 'Comments' }
  ];

  return (
    <div className="space-y-6">
      {/* Detail Header */}
      <DetailHeader
        iconName={skill.iconName || 'shield'}
        name={skill.name}
        badgeCluster={
          <>
            <StatusBadge status={skill.status} />
            <span className="inline-flex items-center text-[11px] font-semibold text-primary bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/20">
              Confidence {skill.trust.score}/100
            </span>
          </>
        }
        description={skill.description}
        metaLine={
          <>
            <span className="font-mono">{skill.ownerName}@registry.org</span>
            <span>·</span>
            <span>{skill.files?.length || 1} files in download</span>
            <span>·</span>
            <span>Updated {formatDate(skill.registeredAt)}</span>
          </>
        }
        tags={[]}
        actionSlot={
          <>
            <BookmarkToggle kind="skill" id={skill.id} />
            <RatePopover kind="skill" id={skill.id} />
            <button
              onClick={handleDownload}
              className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="size-4" />
              <span>Download</span>
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

      {/* Detail Tabs with right slot Compare button */}
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

      {/* Tabs Viewports */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Frontmatter card */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Skill Specification</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <dt className="text-muted-foreground font-semibold mb-1">Declared Author</dt>
                    <dd className="text-foreground">{skill.ownerName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-semibold mb-1">Roles / Scope</dt>
                    <dd className="text-foreground">Developer Assistant, Agent Executor</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-semibold mb-1">Target Entities</dt>
                    <dd className="text-foreground">Filesystem, Local Code Repositories</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-semibold mb-1">Network Declared</dt>
                    <dd className="font-semibold text-red-600">Blocked (Offline Sandboxing)</dd>
                  </div>
                </dl>
              </Card>

              {/* Description */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Overview</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed">
                  {skill.longDescription}
                </p>
              </Card>

              {/* Examples */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-2">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Usage Example</h3>
                <pre className="bg-muted p-4 rounded-lg font-mono text-[12px] overflow-auto select-all leading-relaxed whitespace-pre max-h-[300px] border border-border/40 text-foreground">
                  {skill.exampleSnippet}
                </pre>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Downloads trend AreaChart */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Downloads Trend</h3>
                  <div className="flex items-center gap-1 p-0.5 rounded bg-muted/65">
                    {(['all', '30d', '7d'] as const).map(range => (
                      <button
                        key={range}
                        onClick={() => setTrendRange(range)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all cursor-pointer ${
                          trendRange === range ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                        }`}
                      >
                        {range === 'all' ? 'All' : range}
                      </button>
                    ))}
                  </div>
                </div>
                <ChartCard
                  type="area"
                  title=""
                  data={trendData}
                  series={[{ key: 'Downloads', stroke: 'oklch(0.2657 0.1001 279.46)' }]}
                />
              </Card>

              {/* Content Hash Field */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Content Hash (SHA-256)</h3>
                <CopyHashField value="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" />
              </Card>

              {/* Requirements & Declared Values */}
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider select-none">Resource Requirements</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Local System Access</span>
                    <span className="font-semibold text-foreground">ReadOnly Files</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-border/40">
                    <span className="text-muted-foreground">Process Spawn Allowed</span>
                    <span className="font-semibold text-red-600">DENIED</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-muted-foreground">Required Node Version</span>
                    <span className="font-mono text-foreground font-semibold">&gt;=18.0.0</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Used By row */}
          <div className="pt-2 select-none">
            <h3 className="text-sm font-bold text-foreground mb-3">Referenced In Catalog</h3>
            {servers.length === 0 && agents.length === 0 ? (
              <p className="text-[13px] text-muted-foreground italic">This skill is currently not referenced by any registry servers or agents.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                {servers.map((s) => (
                  <Link
                    key={s.id}
                    to={`/servers/${s.id}?tab=overview`}
                    className="inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[12px] bg-card hover:bg-accent hover:border-foreground/20 text-foreground transition-all border-border"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Server</span>
                    <span className="font-medium">{s.name}</span>
                  </Link>
                ))}
                {agents.map((a) => (
                  <Link
                    key={a.id}
                    to={`/agents/${a.id}?tab=overview`}
                    className="inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[12px] bg-card hover:bg-accent hover:border-foreground/20 text-foreground transition-all border-border"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Agent</span>
                    <span className="font-medium">{a.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'version' && (
        <VersionsTable
          versions={versionItems}
          currentVersion={skill.version}
          compareEnabled={true}
          selectedVersions={selectedVersions}
          onSelectVersion={handleSelectVersion}
        />
      )}

      {activeTab === 'files' && (
        <SmartTable
          searchPlaceholder="Search files..."
          searchKeys={['name', 'kind']}
          columns={[
            {
              key: 'name',
              header: 'File Name',
              className: 'font-mono text-primary font-semibold select-all py-2 cursor-pointer hover:underline',
              render: (row) => (
                <button
                  onClick={() => setSelectedFile(row)}
                  className="inline-flex items-center gap-2 text-left font-mono text-primary hover:underline cursor-pointer"
                >
                  <FileText className="size-4 text-muted-foreground/80 shrink-0" />
                  <span>{row.name}</span>
                </button>
              )
            },
            {
              key: 'kind',
              header: 'Kind',
              className: 'w-[140px]',
              render: (row) => (
                <span className="inline-flex text-[9.5px] uppercase font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border/45">
                  {row.kind}
                </span>
              )
            },
            {
              key: 'sizeKb',
              header: 'Size',
              className: 'w-[120px] font-mono text-center tabular-nums',
              render: (row) => <span>{row.sizeKb.toFixed(1)} KB</span>
            },
            {
              key: 'updatedAt',
              header: 'Last Updated',
              className: 'w-[160px] font-mono text-right pr-4',
              render: (row) => <span>{row.updatedAt}</span>
            }
          ]}
          rows={skill.files || []}
        />
      )}

      {activeTab === 'scan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
            {/* Risk score card */}
            <Card className="bg-card border-border rounded-xl shadow-none p-5 flex flex-col justify-between">
              <div>
                <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Clearance Score</div>
                <div className="text-3xl font-extrabold text-foreground tracking-tight select-all">
                  {skill.trust.score}<span className="text-xs font-normal text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground/80 pt-4 border-t border-border/45">
                Note: Flag threshold setting is &ge; 0.70 risk index.
              </div>
            </Card>

            {/* Severity rule Catalog */}
            <Card className="bg-card border-border rounded-xl shadow-none p-0 md:col-span-2 overflow-hidden">
              <Table border-0 className="text-xs">
                <TableHeader className="bg-muted/40 border-b border-border/60">
                  <TableRow className="h-8">
                    <TableHead className="font-bold text-foreground">Rule</TableHead>
                    <TableHead className="font-bold text-foreground w-[100px] text-center">Severity</TableHead>
                    <TableHead className="font-bold text-foreground">Detections</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanCatalogRules.map((rule, idx) => (
                    <TableRow key={idx} className="h-9 border-b border-border/40 last:border-0">
                      <TableCell className="font-semibold text-foreground py-1">{rule.rule}</TableCell>
                      <TableCell className="py-1 text-center">
                        <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded border uppercase ${
                          rule.severity === 'High'
                            ? 'bg-red-500/10 text-red-600 border-red-500/20'
                            : rule.severity === 'Medium'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {rule.severity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-1 truncate max-w-[200px]" title={rule.detail}>
                        {rule.detail}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* Findings card */}
          <Card className="bg-card border-border rounded-xl shadow-none p-5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 select-none">Automated Security Findings</h3>
            {scanFindings.length === 0 ? (
              <div className="py-4 text-center select-none">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold">
                  <CheckCircle2 className="size-4" />
                  <span>No findings detected. Code meets security criteria.</span>
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                {scanFindings.map((find, idx) => (
                  <div key={idx} className="p-3 border border-red-500/20 bg-red-500/[0.02] rounded-lg flex items-start gap-3">
                    <ShieldAlert className="size-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-red-700 dark:text-red-400">{find.rule}</h4>
                      <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">{find.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
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
          rows={skill.auditLogs || []}
        />
      )}

      {activeTab === 'comments' && (
        <div className="space-y-6 select-none">
          <Card className="bg-card border-border rounded-xl shadow-none p-5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-4">Registry Discussions</h3>

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
                  placeholder="Post a reply or review check comments..."
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
            <DialogTitle className="text-base font-bold text-foreground">Confirm Delete Skill</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Are you absolutely sure you want to delete this skill? This will remove it from all workspace registries permanently.
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

      {/* File Viewer Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={(val) => { if (!val) setSelectedFile(null); }}>
          <DialogContent className="sm:max-w-[640px] w-full max-h-[80vh] flex flex-col p-6 bg-card border border-border rounded-xl">
            <DialogHeader className="mb-3 select-none">
              <DialogTitle className="text-base font-bold text-foreground">
                File Viewer: {selectedFile.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Preview file source content inside this skill registration package.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto border border-border/80 rounded-lg bg-muted/20 p-4 font-mono text-[12px] leading-relaxed max-h-[50vh]">
              {selectedFile.kind === 'markdown' ? (
                renderMarkdownPreview(
                  selectedFile.name === 'SKILL.md'
                    ? `# ${skill.name} Spec\n\nVersion: ${skill.version}\nCategory: ${skill.category}\n\n## Overview\n${skill.longDescription}\n\n## When to Use\n${skill.whenToUse.map(w => `- ${w}`).join('\n')}\n\n## Code Signature\n\`\`\`javascript\n${skill.exampleSnippet}\n\`\`\``
                    : `# Raw markdown preview`
                )
              ) : (
                <pre className="select-all text-foreground">
                  {selectedFile.name === 'detector.ts'
                    ? `export class AnomalyDetector {\n  private threshold: number;\n  constructor(opts: { threshold: number }) {\n    this.threshold = opts.threshold;\n  }\n  addDataPoint(p: number) {\n    // ...\n  }\n  isAnomaly(val: number): boolean {\n    return val > this.threshold * 100;\n  }\n}`
                    : `// JavaScript/TypeScript/JSON code source body preview\nconsole.log("Mock file details.");`}
                </pre>
              )}
            </div>
            <div className="flex justify-end pt-4 select-none">
              <Button
                onClick={() => setSelectedFile(null)}
                className="h-9 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Close Preview
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
