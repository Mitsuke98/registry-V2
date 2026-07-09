import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { useDetailTab } from '@/context/DetailTabContext';
import { toast } from 'sonner';
import { ChartCard } from '@/components/registry/ChartCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, ShieldAlert, HeartHandshake, CheckCircle, BookOpen, Clock } from 'lucide-react';
import { VerifiedBadge, ScanGrade, StatusBadge, RatingStars, RatePopover, BookmarkToggle, CopyBlock, EmptyState } from '@/components/registry/UIHelperKit';

export const ServerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { mcpServers, toggleServerHealth } = useRegistry();
  const { query } = useSearch();
  const detailTabContext = useDetailTab();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTabLocal] = useState(tabParam || 'overview');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTabLocal(tab);
    }
  }, [searchParams]);

  const server = mcpServers.find((s) => s.id === id);

  usePageSearch(server ? `Search in ${server.name}...` : 'Search server details...');

  useEffect(() => {
    if (server) {
      detailTabContext?.setActiveTab(activeTab === 'overview' ? '' : activeTab);
    }
    return () => {
      detailTabContext?.setActiveTab('');
    };
  }, [activeTab, server, detailTabContext]);

  if (!server) {
    return (
      <EmptyState
        message="Server not found. The server you are looking for does not exist."
        actionLabel="Back to Catalog"
        onAction={() => window.history.back()}
      />
    );
  }

  // Filter lists by search query
  const filteredTools = server.tools.filter((t: any) =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.description.toLowerCase().includes(query.toLowerCase())
  );

  const filteredResources = server.resources.filter((r: any) =>
    r.name.toLowerCase().includes(query.toLowerCase()) ||
    r.uri.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPrompts = server.prompts.filter((p: any) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const chartData = server.weeklyCalls.map((calls, index) => ({
    name: `W${index + 1}`,
    Calls: calls,
  }));

  // Integration Snippets
  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        [server.id]: {
          command: server.transport === 'stdio' ? 'npx' : undefined,
          args: server.transport === 'stdio' ? ['-y', `@modelcontextprotocol/server-${server.id}`] : undefined,
          url: server.transport !== 'stdio' ? `https://api.modelcontextprotocol.io/v1/sse/${server.id}` : undefined,
        },
      },
    },
    null,
    2
  );

  const cliInstall = `npm install -g @modelcontextprotocol/server-${server.id}`;

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{server.name}</h1>
            <StatusBadge status={server.status} />
            {server.trust.verified && <VerifiedBadge />}
            <ScanGrade score={server.trust.score} />
          </div>
          <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed">
            {server.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground pt-1 select-none">
            <span className="font-semibold text-foreground">{server.publisher}</span>
            <span>·</span>
            <span className="font-mono text-[12px] bg-muted px-1.5 py-0.5 rounded leading-none">v{server.version}</span>
            <span>·</span>
            <span className="font-mono text-[12px] uppercase">{server.transport}</span>
            <span>·</span>
            <span>Registered {formatDate(server.registeredAt)}</span>
            <span>·</span>
            <RatingStars rating={server.rating} reviewsCount={server.reviewsCount} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 select-none">
          <BookmarkToggle kind="server" id={server.id} />
          <RatePopover kind="server" id={server.id} />
          <button
            onClick={() => {
              toggleServerHealth(server.id);
              toast.success('Simulated server health status toggle!');
            }}
            className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-accent/60 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="size-3.5" />
            <span>Simulate toggle health</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTabLocal} className="space-y-6">
        <TabsList className="flex items-center gap-5 border-b border-border p-0 h-auto bg-transparent w-full rounded-none">
          {['Overview', 'Tools', 'Resources', 'Prompts', 'Security scan', 'Integrations'].map((tab) => {
            const key = tab.toLowerCase().replace(' ', '-');
            const isActive = activeTab === key;
            return (
              <TabsTrigger
                key={key}
                value={key}
                className={`py-2 px-1 text-[13.5px] font-semibold border-b-2 bg-transparent rounded-none shadow-none translate-y-[1px] transition-all cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary font-bold'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Tab contents */}
        {/* 1. Overview */}
        <TabsContent value="overview" className="space-y-6 focus:outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-border rounded-xl shadow-none p-5 select-none">
              <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Uptime Status</div>
              <div className="flex items-center gap-2">
                <span className={`size-2.5 rounded-full shrink-0 ${server.health.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-2xl font-bold tabular-nums text-foreground">{server.health.uptimePct.toFixed(2)}%</span>
              </div>
            </Card>
            <Card className="bg-card border-border rounded-xl shadow-none p-5 select-none">
              <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">p95 Latency</div>
              <div className="text-2xl font-bold tabular-nums text-foreground">{server.health.p95LatencyMs}ms</div>
            </Card>
            <Card className="bg-card border-border rounded-xl shadow-none p-5 select-none">
              <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Error Rate</div>
              <div className="text-2xl font-bold tabular-nums text-foreground">{server.health.errorRatePct.toFixed(2)}%</div>
            </Card>
          </div>

          <ChartCard
            type="area"
            title="Usage — last 12 weeks calls"
            data={chartData}
            series={[{ key: 'Calls', stroke: 'oklch(0.2657 0.1001 279.46)' }]}
          />

          <Card className="bg-card border-border rounded-xl shadow-none">
            <CardHeader className="p-5 pb-2 select-none">
              <CardTitle className="text-[14px] font-bold text-foreground">Capabilities & Features</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4 text-[13.5px] text-muted-foreground leading-relaxed">
              <p>
                {server.name} implements high-performance context providers strictly using the Model Context Protocol. You can connect it natively using stdio transport or register a remote SSE gateway client configuration.
              </p>
              
              {server.capabilities && (
                <div className="pt-4 border-t border-border/50 select-none">
                  <div className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Configured Capabilities</div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(server.capabilities).map(([cap, enabled]) => (
                      <span key={cap} className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                        enabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {cap.charAt(0).toUpperCase() + cap.slice(1)}: {enabled ? 'Active' : 'Inactive'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-border/50 text-[13px] text-muted-foreground select-none">
                <span className="flex items-center gap-1.5"><HeartHandshake className="size-4" /> {server.tools.length} tools exposed</span>
                <span className="flex items-center gap-1.5"><BookOpen className="size-4" /> {server.resources.length} resources exposed</span>
                <span className="flex items-center gap-1.5"><Clock className="size-4" /> {server.prompts.length} templates configured</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Tools */}
        <TabsContent value="tools" className="focus:outline-none">
          {filteredTools.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl select-none">
              No tools exposed.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40 select-none">
                  <TableRow className="border-b border-border h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <TableHead className="font-semibold text-foreground w-[220px]">Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTools.map((tool: any) => (
                    <TableRow key={tool.name} className="border-b border-border/60 last:border-b-0 h-11 text-[13px] select-none">
                      <TableCell className="font-mono font-bold text-foreground py-2 select-all">
                        {tool.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2">{tool.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 3. Resources */}
        <TabsContent value="resources" className="focus:outline-none">
          {filteredResources.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl select-none">
              No resources exposed.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40 select-none">
                  <TableRow className="border-b border-border h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <TableHead className="font-semibold text-foreground w-[240px]">Name</TableHead>
                    <TableHead className="font-semibold text-foreground">URI Pattern</TableHead>
                    <TableHead className="font-semibold text-foreground w-[180px]">MIME Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResources.map((res: any) => (
                    <TableRow key={res.name} className="border-b border-border/60 last:border-b-0 h-11 text-[13px] select-none">
                      <TableCell className="font-semibold text-foreground py-2">{res.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground py-2 truncate max-w-[400px] select-all" title={res.uri}>
                        {res.uri}
                      </TableCell>
                      <TableCell className="font-mono text-[12.5px] py-2">{res.mimeType || 'application/json'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 4. Prompts */}
        <TabsContent value="prompts" className="focus:outline-none">
          {filteredPrompts.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl select-none">
              No prompt templates configured.
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40 select-none">
                  <TableRow className="border-b border-border h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <TableHead className="font-semibold text-foreground w-[220px]">Name</TableHead>
                    <TableHead className="font-semibold text-foreground">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrompts.map((p: any) => (
                    <TableRow key={p.name} className="border-b border-border/60 last:border-b-0 h-11 text-[13px] select-none">
                      <TableCell className="font-mono font-bold text-foreground py-2 select-all">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-2">{p.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* 5. Security Scan */}
        <TabsContent value="security-scan" className="space-y-6 focus:outline-none">
          <Card className="bg-card border-border rounded-xl shadow-none">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border select-none">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Automated Audits & Verification</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Scanned on {formatDate(server.trust.scannedAt)}
                </CardDescription>
              </div>
              <ScanGrade score={server.trust.score} />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30 select-none">
                  <TableRow className="border-b border-border h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <TableHead className="font-semibold text-foreground w-1/4">Verification Check</TableHead>
                    <TableHead className="font-semibold text-foreground w-[120px]">Status</TableHead>
                    <TableHead className="font-semibold text-foreground">Audit Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {server.trust.audits.map((audit: any, idx: number) => (
                    <TableRow key={idx} className="border-b border-border/40 last:border-b-0 h-11 text-xs select-none">
                      <TableCell className="font-semibold text-foreground py-2">{audit.check}</TableCell>
                      <TableCell className="py-2">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          audit.status === 'pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {audit.status === 'pass' ? <CheckCircle className="size-3 text-emerald-700 fill-emerald-50" /> : <ShieldAlert className="size-3 text-red-700 fill-red-50" />}
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

        {/* 6. Integrations */}
        <TabsContent value="integrations" className="space-y-6 focus:outline-none">
          <Card className="bg-card border-border rounded-xl shadow-none overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20 select-none">
              <CardTitle className="text-[14px] font-bold text-foreground">
                Claude Desktop Configuration JSON
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Append this snippet to your desktop configuration file
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CopyBlock code={claudeConfig} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-xl shadow-none overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20 select-none">
              <CardTitle className="text-[14px] font-bold text-foreground">
                CLI Installation
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Run this command to fetch and install the server packages
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CopyBlock code={cliInstall} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
