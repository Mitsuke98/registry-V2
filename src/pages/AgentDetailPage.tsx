import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { useDetailTab } from '@/context/DetailTabContext';
import { toast } from 'sonner';
import { ChartCard } from '@/components/registry/ChartCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ShieldAlert, HeartHandshake, CheckCircle } from 'lucide-react';
import { VerifiedBadge, ScanGrade, StatusBadge, RatingStars, RatePopover, BookmarkToggle, CopyBlock, EmptyState } from '@/components/registry/UIHelperKit';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { a2aAgents, skills } = useRegistry();
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

  const agent = a2aAgents.find((a) => a.id === id);

  usePageSearch(agent ? `Search in ${agent.name}...` : 'Search agent details...');

  useEffect(() => {
    if (agent) {
      detailTabContext?.setActiveTab(activeTab === 'overview' ? '' : activeTab);
    }
    return () => {
      detailTabContext?.setActiveTab('');
    };
  }, [activeTab, agent, detailTabContext]);

  if (!agent) {
    return (
      <EmptyState
        message="Agent not found. The A2A agent you are looking for does not exist."
        actionLabel="Back to Catalog"
        onAction={() => window.history.back()}
      />
    );
  }

  // Filter skills by parent id and search query
  const agentSkills = skills.filter((s) => s.parentId === agent.id || agent.skillIds?.includes(s.id));
  const filteredSkills = agentSkills.filter((s) =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.description.toLowerCase().includes(query.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const chartData = agent.weeklyCalls.map((calls, index) => ({
    name: `W${index + 1}`,
    Calls: calls,
    'Success Rate': agent.weeklySuccessRate[index] || 100,
  }));

  const a2aEndpointSnippet = `GET ${agent.endpoint} HTTP/1.1
Host: agents.registry.internal
Authorization: Bearer mock_access_token_su_2026`;

  const agentCardSnippet = JSON.stringify(
    {
      agent: {
        id: agent.id,
        name: agent.name,
        version: agent.version,
        endpoint: agent.endpoint,
      },
    },
    null,
    2
  );

  const curlSnippet = `curl -X POST "${agent.endpoint}/call" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer mock_access_token_su_2026" \\
  -d '{
    "task": "Reconcile Stripe balance logs from yesterday"
  }'`;

  return (
    <div className="space-y-8">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-border">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{agent.name}</h1>
            <StatusBadge status={agent.status} />
            {agent.trust.verified && <VerifiedBadge />}
            <ScanGrade score={agent.trust.score} />
          </div>
          <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed">
            {agent.description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground pt-1 select-none">
            <span className="font-semibold text-foreground">{agent.publisher}</span>
            <span>·</span>
            <span className="font-mono text-[12px] bg-muted px-1.5 py-0.5 rounded leading-none">v{agent.version}</span>
            <span>·</span>
            <span>Registered {formatDate(agent.registeredAt)}</span>
            <span>·</span>
            <RatingStars rating={agent.rating} reviewsCount={agent.reviewsCount} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 select-none">
          <BookmarkToggle kind="agent" id={agent.id} />
          <RatePopover kind="agent" id={agent.id} />
          <Button
            onClick={() => toast.success(`Simulating calling agent ${agent.name}...`)}
            className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg border border-transparent shadow-sm cursor-pointer"
          >
            Call agent
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTabLocal} className="space-y-6">
        <TabsList className="flex items-center gap-5 border-b border-border p-0 h-auto bg-transparent w-full rounded-none">
          {['Overview', 'Skills', 'Security scan', 'Integrations'].map((tab) => {
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
              <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Calls (30d)</div>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {agent.totalCalls30d.toLocaleString()}
              </div>
            </Card>
            <Card className="bg-card border-border rounded-xl shadow-none p-5 select-none">
              <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Success Rate</div>
              <div className="text-2xl font-bold tabular-nums text-emerald-600">
                {agent.successRatePct.toFixed(1)}%
              </div>
            </Card>
            <Card className="bg-card border-border rounded-xl shadow-none p-5 select-none">
              <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Response Latency</div>
              <div className="text-2xl font-bold tabular-nums text-foreground">
                {agent.avgResponseMs}ms
              </div>
            </Card>
          </div>

          <ChartCard
            type="line"
            title="Usage & Success Rate — last 12 weeks"
            data={chartData}
            yAxisRight={true}
            series={[
              { key: 'Calls', stroke: 'oklch(0.2657 0.1001 279.46)', yAxisId: 'left' },
              { key: 'Success Rate', stroke: 'oklch(0.60 0.15 150)', dashed: true, yAxisId: 'right' },
            ]}
          />

          <Card className="bg-card border-border rounded-xl shadow-none">
            <CardHeader className="p-5 pb-2 select-none">
              <CardTitle className="text-[14px] font-bold text-foreground">Capabilities & Features</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-4 text-[13.5px] text-muted-foreground leading-relaxed">
              <p>
                {agent.name} acts as a fully governed agent coordinator interface. You can access its skills payload, register workflow parameters, or invoke task pipelines over SSL endpoints.
              </p>

              {agent.capabilities && (
                <div className="pt-4 border-t border-border/50 space-y-3 select-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">Autonomy Level</span>
                    <span className="text-[11px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20 capitalize">
                      {agent.capabilities.autonomyLevel} Autonomy
                    </span>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2">Configured Capabilities</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(agent.capabilities).filter(([k]) => k !== 'autonomyLevel').map(([cap, enabled]) => (
                        <span key={cap} className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                          enabled ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'
                        }`}>
                          {cap.charAt(0).toUpperCase() + cap.slice(1)}: {enabled ? 'Active' : 'Inactive'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-border/50 text-[13px] text-muted-foreground select-none">
                <span className="flex items-center gap-1.5"><HeartHandshake className="size-4" /> {filteredSkills.length} skills exposed</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. Skills */}
        <TabsContent value="skills" className="focus:outline-none">
          {filteredSkills.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl select-none">
              No skills configured.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSkills.map((skill) => (
                <Link key={skill.id} to={`/skills/${skill.id}`} className="block hover:opacity-85 transition-opacity">
                  <Card className="bg-card border-border rounded-xl shadow-none p-5 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-[15px] font-medium text-foreground">{skill.name}</h3>
                        <Badge variant="outline" className="text-[10px] font-normal select-none uppercase tracking-wide">
                          {skill.category}
                        </Badge>
                      </div>
                      <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">
                        {skill.description}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 3. Security Scan */}
        <TabsContent value="security-scan" className="space-y-6 focus:outline-none">
          <Card className="bg-card border-border rounded-xl shadow-none">
            <CardHeader className="p-5 pb-3 flex flex-row items-center justify-between border-b border-border select-none">
              <div>
                <CardTitle className="text-sm font-bold text-foreground">Automated Audits & Verification</CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1">
                  Scanned on {formatDate(agent.trust.scannedAt)}
                </CardDescription>
              </div>
              <ScanGrade score={agent.trust.score} />
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
                  {agent.trust.audits.map((audit: any, idx: number) => (
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

        {/* 4. Integrations */}
        <TabsContent value="integrations" className="space-y-6 focus:outline-none">
          <Card className="bg-card border-border rounded-xl shadow-none overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20 select-none">
              <CardTitle className="text-[14px] font-bold text-foreground">
                A2A Gateway URL Endpoint
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                The target URL to invoke agent executions directly
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CopyBlock code={a2aEndpointSnippet} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-xl shadow-none overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20 select-none">
              <CardTitle className="text-[14px] font-bold text-foreground">
                Agent Manifest Config JSON
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Add this declaration to your routing config
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CopyBlock code={agentCardSnippet} />
            </CardContent>
          </Card>

          <Card className="bg-card border-border rounded-xl shadow-none overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20 select-none">
              <CardTitle className="text-[14px] font-bold text-foreground">
                Curl Trigger Example
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Trigger task executions from script terminals
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CopyBlock code={curlSnippet} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
