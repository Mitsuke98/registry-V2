import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { useDetailTab } from '@/context/DetailTabContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle2, FileText, AlertTriangle } from 'lucide-react';
import { VerifiedBadge, ScanGrade, StatusBadge, BookmarkToggle, RatePopover, EmptyState } from '@/components/registry/UIHelperKit';

export const SkillDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { skills, getUsedBy } = useRegistry();
  const { query } = useSearch();
  const detailTabContext = useDetailTab();

  const [activeTab, setActiveTabLocal] = useState('overview');

  const skill = skills.find((s) => s.id === id);

  usePageSearch(skill ? `Search in ${skill.name}…` : 'Search skill details…');

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
  const latestVersionDate = skill.versions && skill.versions.length > 0 ? skill.versions[0].date : '';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredVersions = (skill.versions || []).filter((v) =>
    v.version.toLowerCase().includes(query.toLowerCase()) ||
    v.notes.toLowerCase().includes(query.toLowerCase())
  );

  const filteredFiles = (skill.files || []).filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()) ||
    f.kind.toLowerCase().includes(query.toLowerCase())
  );

  const filteredAudits = (skill.trust.audits || []).filter((a) =>
    a.check.toLowerCase().includes(query.toLowerCase()) ||
    a.status.toLowerCase().includes(query.toLowerCase()) ||
    a.detail.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{skill.name}</h1>
            <StatusBadge status={skill.status} />
            {skill.trust.verified && <VerifiedBadge />}
            <ScanGrade score={skill.trust.score} />
          </div>
          <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed">
            {skill.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground pt-1 select-none">
            <span className="font-mono bg-muted/65 px-1.5 py-0.5 rounded border border-border/30 text-foreground truncate select-all">
              {skill.sourceUrl || 'github.com/community/skill'}
            </span>
            <span>·</span>
            <span className="capitalize font-semibold text-foreground">{skill.category}</span>
            <span>·</span>
            <span>Updated {latestVersionDate ? formatDate(latestVersionDate) : '-'}</span>
            <span>·</span>
            <span>★ {skill.stars}</span>
            <span>·</span>
            <span>↓ {skill.downloads.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 select-none">
          <BookmarkToggle kind="skill" id={skill.id} />
          <RatePopover kind="skill" id={skill.id} />
        </div>
      </div>

      {/* Tabs list */}
      <Tabs value={activeTab} onValueChange={setActiveTabLocal} className="space-y-6">
        <TabsList className="border-b border-border w-full justify-start rounded-none h-9 bg-transparent p-0 space-x-6">
          {['overview', 'versions', 'files', 'scan-audits'].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 text-[13.5px] font-semibold text-muted-foreground data-[state=active]:text-primary transition-all h-full bg-transparent shadow-none cursor-pointer"
            >
              <span className="capitalize">{tab === 'scan-audits' ? 'Security scan' : tab}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* 1. Overview Content */}
        <TabsContent value="overview" className="space-y-6 focus:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                <h3 className="text-[14px] font-bold text-foreground select-none">Overview</h3>
                <p className="text-[13.5px] text-muted-foreground leading-relaxed whitespace-pre-line">
                  {skill.longDescription}
                </p>
              </Card>

              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                <h3 className="text-[14px] font-bold text-foreground select-none">Example Snippet</h3>
                <pre className="bg-muted p-4 rounded-lg font-mono text-[12.5px] overflow-auto select-all leading-relaxed whitespace-pre max-h-[300px] border border-border/40">
                  {skill.exampleSnippet}
                </pre>
              </Card>
            </div>

            <div className="space-y-6 select-none">
              <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
                <h3 className="text-[14px] font-bold text-foreground select-none">When to use</h3>
                <ul className="list-disc pl-5 space-y-2 text-[13px] text-muted-foreground leading-relaxed">
                  {skill.whenToUse.map((bullet, idx) => (
                    <li key={idx}>{bullet}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>

          {/* Inputs & Outputs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
              <h3 className="text-[14px] font-bold text-foreground select-none">Inputs</h3>
              {skill.inputs.length === 0 ? (
                <p className="text-[13px] text-muted-foreground italic select-none">No inputs defined.</p>
              ) : (
                <div className="border border-border/50 rounded overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30 select-none">
                      <TableRow className="h-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <TableHead className="py-1">Name</TableHead>
                        <TableHead className="py-1">Type</TableHead>
                        <TableHead className="py-1">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skill.inputs.map((input, idx) => (
                        <TableRow key={idx} className="h-9 text-[12.5px] border-b border-border/40 last:border-0 select-none">
                          <TableCell className="font-mono text-foreground py-1 select-all">{input.name}</TableCell>
                          <TableCell className="py-1">
                            <Badge variant="outline" className="text-[9.5px] uppercase font-normal select-none rounded bg-background">
                              {input.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground py-1">{input.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            <Card className="p-5 bg-card border-border rounded-xl shadow-none space-y-3">
              <h3 className="text-[14px] font-bold text-foreground select-none">Outputs</h3>
              {skill.outputs.length === 0 ? (
                <p className="text-[13px] text-muted-foreground italic select-none">No outputs defined.</p>
              ) : (
                <div className="border border-border/50 rounded overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30 select-none">
                      <TableRow className="h-8 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <TableHead className="py-1">Name</TableHead>
                        <TableHead className="py-1">Type</TableHead>
                        <TableHead className="py-1">Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {skill.outputs.map((output, idx) => (
                        <TableRow key={idx} className="h-9 text-[12.5px] border-b border-border/40 last:border-0 select-none">
                          <TableCell className="font-mono text-foreground py-1 select-all">{output.name}</TableCell>
                          <TableCell className="py-1">
                            <Badge variant="outline" className="text-[9.5px] uppercase font-normal select-none rounded bg-background">
                              {output.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground py-1">{output.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>

          {/* Used By row */}
          <div className="pt-2">
            <h3 className="text-[14px] font-bold text-foreground mb-3 select-none">Used by</h3>
            {servers.length === 0 && agents.length === 0 ? (
              <p className="text-[13px] text-muted-foreground italic select-none">This skill is currently not referenced by any registry servers or agents.</p>
            ) : (
              <div className="flex flex-wrap items-center gap-3 select-none">
                {servers.map((s) => (
                  <Link
                    key={s.id}
                    to={`/servers/${s.id}?tab=skills`}
                    className="inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[12px] bg-card hover:bg-accent hover:border-foreground/20 text-foreground transition-all border-border"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Server</span>
                    <span className="font-medium">{s.name}</span>
                  </Link>
                ))}
                {agents.map((a) => (
                  <Link
                    key={a.id}
                    to={`/agents/${a.id}?tab=skills`}
                    className="inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-[12px] bg-card hover:bg-accent hover:border-foreground/20 text-foreground transition-all border-border"
                  >
                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Agent</span>
                    <span className="font-medium">{a.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 2. Versions Content */}
        <TabsContent value="versions" className="focus:outline-none">
          {filteredVersions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl select-none">
              No matching versions found.
            </div>
          ) : (
            <div className="relative pl-6 border-l border-border/70 ml-3 space-y-6 py-2 select-none">
              {filteredVersions.map((v, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[30.5px] top-1.5 size-2 rounded-full border border-border bg-background" />
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-2">
                    <Badge variant="outline" className="text-[11px] font-mono py-0 px-1.5 rounded-sm select-none bg-background">
                      v{v.version}
                    </Badge>
                    <span className="text-[12.5px] text-muted-foreground tabular-nums select-none">
                      released on {formatDate(v.date)}
                    </span>
                  </div>
                  <p className="text-[13.5px] text-muted-foreground mt-2 leading-relaxed">
                    {v.notes}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. Files Content */}
        <TabsContent value="files" className="focus:outline-none">
          {filteredFiles.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl select-none">
              No matching files found.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40 select-none">
                  <TableRow className="border-b border-border h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <TableHead className="font-medium text-foreground w-[320px]">Name</TableHead>
                    <TableHead className="font-medium text-foreground">Kind</TableHead>
                    <TableHead className="font-medium text-foreground text-center w-[120px]">Size</TableHead>
                    <TableHead className="font-medium text-foreground text-right w-[140px]">Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file, idx) => (
                    <TableRow key={idx} className="border-b border-border/60 last:border-b-0 h-11 text-[13px] select-none">
                      <TableCell className="font-mono text-foreground py-2 select-all flex items-center gap-2">
                        <FileText className="size-4 text-muted-foreground/80 shrink-0" />
                        <span>{file.name}</span>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-[9.5px] uppercase font-normal select-none rounded bg-background">
                          {file.kind}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[13px] text-center tabular-nums py-2">
                        {file.sizeKb.toFixed(1)} KB
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right py-2 pr-4">
                        {formatDate(file.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 4. Security Scan Content */}
        <TabsContent value="scan-audits" className="space-y-6 focus:outline-none">
          <Card className="bg-card border-border rounded-xl shadow-none">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border select-none">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Verification Checklists</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Scanned on {formatDate(skill.trust.scannedAt)}
                </CardDescription>
              </div>
              <ScanGrade score={skill.trust.score} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30 select-none">
                  <TableRow className="border-b border-border h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <TableHead className="font-semibold text-foreground w-1/4">Verification Check</TableHead>
                    <TableHead className="font-semibold text-foreground w-[120px] text-center">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Audit Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((audit: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-border/40 last:border-b-0 h-11 text-xs select-none">
                      <TableCell className="font-semibold text-foreground py-2">{audit.check}</TableCell>
                      <TableCell className="py-2 text-center">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          audit.status === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {audit.status === 'pass' ? <CheckCircle2 className="size-3 text-emerald-700 fill-emerald-50" /> : <AlertTriangle className="size-3 text-amber-700 fill-amber-50" />}
                          <span className="uppercase text-[9.5px]">{audit.status}</span>
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2">{audit.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
