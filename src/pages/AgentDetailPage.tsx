import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { usePageSearch } from '@/context/SearchContext';
import { useDetailTab } from '@/context/DetailTabContext';
import { toast } from 'sonner';
import { ChartCard } from '@/components/registry/ChartCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailHeader } from '@/components/registry/DetailHeader';
import { StatusPillCard } from '@/components/registry/StatusPillCard';
import type { StatusPillConfig } from '@/components/registry/StatusPillCard';
import { DetailTabs } from '@/components/registry/DetailTabs';
import { SubTabs } from '@/components/registry/SubTabs';
import { SmartTable } from '@/components/registry/SmartTable';
import { EnableToggle, TestButton } from '@/components/registry/TestDialogs';
import { VersionsTable } from '@/components/registry/VersionsTable';
import { VerifiedBadge, ScanGrade, StatusBadge, RatingStars, RatePopover, BookmarkToggle, CopyBlock, EmptyState } from '@/components/registry/UIHelperKit';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRow, TableCell } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export const AgentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { a2aAgents, skills } = useRegistry();
  const detailTabContext = useDetailTab();

  const activeTab = searchParams.get('tab') || 'overview';
  const [overviewSubTab, setOverviewSubTab] = useState<'info' | 'connection' | 'registry'>('info');
  const [selectedAudit, setSelectedAudit] = useState<any | null>(null);

  // Integration states
  const [integrationLang, setIntegrationLang] = useState<'ts' | 'python'>('ts');
  const [responseSubTab, setResponseSubTab] = useState<'success' | 'errors' | 'format'>('success');

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
        message="Agent not found. The agent you are looking for does not exist."
        actionLabel="Back to Catalog"
        onAction={() => window.history.back()}
      />
    );
  }

  const handleTabChange = (key: string) => {
    setSearchParams({ tab: key });
  };

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
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Derive agent health status from successRatePct
  const agentHealth = agent.successRatePct >= 97
    ? 'healthy'
    : agent.successRatePct >= 90
      ? 'degraded'
      : 'down';

  // Get autonomy level
  const autonomy = agent.capabilities?.autonomyLevel || 'Mid';

  // Pills Config
  const statusPills: StatusPillConfig[] = [
    { label: 'Health Status', value: agentHealth, variant: 'health' },
    { label: 'Approval Status', value: agent.status, variant: 'approval' },
    { label: 'Entity Type', value: 'A2A Agent', variant: 'neutral' },
    { label: 'Autonomy Level', value: autonomy.toUpperCase(), variant: 'neutral' }
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'skills', label: 'Skills' },
    { key: 'audit-log', label: 'Audit Log' },
    { key: 'health-status', label: 'Health Status' },
    { key: 'integration', label: 'Integrations' },
    { key: 'security', label: 'Security' },
    { key: 'version', label: 'Version' }
  ];

  // Connection info definitions
  const agentEndpoint = agent.endpoint || `https://api.agentregistry.internal/v1/agents/${agent.id}`;
  const gatewayUrl = `${agentEndpoint}/message`;

  // Get exposed skills
  const agentSkills = skills.filter((s) => s.parentId === agent.id || agent.skillIds?.includes(s.id));

  // Security scan rules
  const securityRules = [
    { rule: 'Sandbox Escapes & Jail Check', severity: 'High', status: agent.trust.score >= 85 ? 'pass' : 'warn', detail: 'Prevents reading files outside root directory scopes.' },
    { rule: 'Third-party Dependency Audits', severity: 'High', status: agent.trust.score >= 90 ? 'pass' : 'fail', detail: 'Checks for known vulnerabilities in package trees.' },
    { rule: 'Hardcoded Authentication Secrets', severity: 'High', status: 'pass', detail: 'Zero static passwords or API tokens found.' },
    { rule: 'Network Access Sanity', severity: 'Medium', status: 'pass', detail: 'HTTP transports require certified SSL targets.' },
    { rule: 'Process Execution Safety', severity: 'Medium', status: 'pass', detail: 'Restricts arbitrary shell spawns.' },
    { rule: 'Memory Allocations Overhead', severity: 'Low', status: 'pass', detail: 'Memory footprints remain under 60MB thresholds.' },
    { rule: 'License Compliance Check', severity: 'Low', status: 'pass', detail: 'Permissive OS license matches policy rules.' },
    { rule: 'API Call Rate Limits', severity: 'Low', status: 'pass', detail: 'Internal request throttles are configured.' }
  ];

  // Integration snippets
  const cliInstall = integrationLang === 'ts'
    ? `npm install @modelcontextprotocol/agent-sdk`
    : `pip install mcp-agent-sdk`;

  const codeExample = integrationLang === 'ts'
    ? `import { AgentClient } from "@modelcontextprotocol/agent-sdk";

const client = new AgentClient({
  endpoint: "${agentEndpoint}",
  authToken: "mock_access_token_su_2026"
});

const response = await client.sendMessage({
  message: "Reconcile Stripe balance logs from yesterday",
  stream: false
});
console.log("Agent response:", response);`
    : `import asyncio
from mcp_agent import AgentClient

async def main():
    client = AgentClient(
        endpoint="${agentEndpoint}",
        auth_token="mock_access_token_su_2026"
    )
    response = await client.send_message(
        message="Reconcile Stripe balance logs from yesterday"
    )
    print("Agent response:", response)

asyncio.run(main())`;

  const successResponse = `{
  "status": "completed",
  "result": {
    "output": "Stripe balance reconciled successfully: 2 discrepancies resolved.",
    "tokensUsed": 1024,
    "latencyMs": 1420
  }
}`;

  const commonErrors = `{
  "status": "error",
  "error": {
    "code": "AUTONOMY_BLOCKED",
    "message": "Task requires high autonomy. Current policy limit is set to Mid."
  }
}`;

  const errorFormat = `{
  "status": "failed",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Agent service execution timed out."
  }
}`;

  // Fake chart data for lines
  const chartData = agent.weeklyCalls.map((calls, index) => ({
    name: `W${index + 1}`,
    Calls: calls,
    'Success Rate': agent.weeklySuccessRate ? agent.weeklySuccessRate[index] : 100,
  }));

  // Setup capabilities list
  const capabilityToggles = [
    { key: 'reasoning', label: 'Reasoning' },
    { key: 'memory', label: 'Memory' },
    { key: 'collaboration', label: 'Collaboration' },
    { key: 'streaming', label: 'Streaming' },
    { key: 'multimodal', label: 'Multimodal' },
    { key: 'logging', label: 'Logging' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <DetailHeader
        iconName={agent.iconName || 'bot'}
        name={agent.name}
        badgeCluster={
          <>
            <StatusBadge status={agent.status} />
            {agent.trust.verified && <VerifiedBadge />}
            <ScanGrade score={agent.trust.score} />
          </>
        }
        description={agent.description}
        metaLine={
          <>
            <span className="font-semibold text-foreground">{agent.publisher}</span>
            <span>·</span>
            <span>Registered {formatDate(agent.registeredAt)}</span>
            <span>·</span>
            <RatingStars rating={agent.rating} reviewsCount={agent.reviewsCount} />
          </>
        }
        tags={agent.tags}
        actionSlot={
          <>
            <BookmarkToggle kind="agent" id={agent.id} />
            <RatePopover kind="agent" id={agent.id} />
            <Button
              onClick={() => toast.success(`Simulating calling agent ${agent.name}...`)}
              className="h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/95 rounded-lg border border-transparent shadow-sm cursor-pointer"
            >
              Call agent
            </Button>
          </>
        }
      />

      {/* Status Pill Card */}
      <StatusPillCard pills={statusPills} />

      {/* Detail Tabs */}
      <DetailTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={handleTabChange}
      />

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <SubTabs
            tabs={[
              { key: 'info', label: 'Capability Overview' },
              { key: 'connection', label: 'Connection & Publisher' },
              { key: 'registry', label: 'Registry & Compliance' }
            ]}
            activeTab={overviewSubTab}
            onChange={(key) => setOverviewSubTab(key as any)}
          />

          {overviewSubTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none">
                <Card className="bg-card border-border rounded-xl shadow-none p-5">
                  <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Calls (30d)</div>
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {agent.totalCalls30d.toLocaleString()}
                  </div>
                </Card>
                <Card className="bg-card border-border rounded-xl shadow-none p-5">
                  <div className="text-[12px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Success Rate</div>
                  <div className="text-2xl font-bold tabular-nums text-emerald-600">
                    {agent.successRatePct.toFixed(1)}%
                  </div>
                </Card>
                <Card className="bg-card border-border rounded-xl shadow-none p-5">
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

              <Card className="bg-card border-border rounded-xl shadow-none p-5">
                <h3 className="text-sm font-bold text-foreground mb-3">Capabilities & Features</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-2 border border-border/80 bg-muted/20 px-3 py-1.5 rounded-lg text-xs text-foreground font-semibold">
                      <Sparkles className="size-4 text-primary" />
                      <span>{agentSkills.length} Skills Exposed</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/40">
                    <div className="text-[10px] font-bold text-foreground uppercase tracking-wider mb-2 select-none">Configured Capabilities</div>
                    <div className="flex flex-wrap gap-2 select-none">
                      {capabilityToggles.map((cap) => {
                        const isEnabled = agent.capabilities?.[cap.key] ?? false;
                        return (
                          <span
                            key={cap.key}
                            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border ${
                              isEnabled
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {cap.label}: {isEnabled ? 'Active' : 'Inactive'}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {overviewSubTab === 'connection' && (
            <Card className="bg-card border-border rounded-xl shadow-none p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Connection & Publisher Information</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Agent Endpoint</dt>
                  <dd className="font-mono bg-muted p-1 px-2 rounded text-foreground select-all inline-block truncate max-w-full">
                    {agentEndpoint}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Gateway URL</dt>
                  <dd className="font-mono bg-muted p-1 px-2 rounded text-foreground select-all inline-block truncate max-w-full">
                    {gatewayUrl}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Publisher Name</dt>
                  <dd className="font-semibold text-foreground">{agent.publisher}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Publisher Contact</dt>
                  <dd className="font-mono text-foreground">{agent.publisher.toLowerCase().replace(' ', '')}@registry.org</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Authentication Type</dt>
                  <dd className="font-semibold text-foreground">OAuth 2.0 / Token Auth</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-medium mb-1">Protocol Version</dt>
                  <dd className="font-mono text-foreground">A2A 1.0.0 (Standard)</dd>
                </div>
              </dl>
            </Card>
          )}

          {overviewSubTab === 'registry' && (
            <Card className="bg-card border-border rounded-xl shadow-none p-6 space-y-4">
              <h3 className="text-sm font-bold text-foreground">Registry Registry Compliance</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs font-mono">
                <div>
                  <dt className="text-muted-foreground font-sans font-medium mb-1">Compliance Status</dt>
                  <dd className="font-sans font-semibold text-emerald-600">Fully Compliant</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-sans font-medium mb-1">Submitted Date</dt>
                  <dd className="text-foreground">{formatDate(agent.registeredAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-sans font-medium mb-1">Last Updated</dt>
                  <dd className="text-foreground">{formatDate(agent.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-sans font-medium mb-1">License</dt>
                  <dd className="font-sans font-semibold text-foreground">MIT License</dd>
                </div>
              </dl>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'skills' && (
        <SmartTable
          searchPlaceholder="Search skills..."
          searchKeys={['name', 'description']}
          columns={[
            {
              key: 'name',
              header: 'Name',
              className: 'w-[220px] py-2',
              render: (row) => (
                <Link to={`/skills/${row.id}`} className="font-semibold text-primary hover:underline select-all">
                  {row.name}
                </Link>
              )
            },
            {
              key: 'description',
              header: 'Description',
              render: (row) => <span className="text-muted-foreground">{row.description}</span>
            },
            {
              key: 'version',
              header: 'Skill Version',
              className: 'w-[120px] font-mono text-center',
              render: (row) => <span>v{row.version}</span>
            },
            {
              key: 'action',
              header: 'Status',
              className: 'w-[100px] text-center',
              render: (row) => (
                <div className="flex justify-center">
                  <EnableToggle itemKey={agent.id} capabilityKind="skill" capabilityName={row.id} />
                </div>
              )
            },
            {
              key: 'test',
              header: 'Test',
              className: 'w-[80px] text-center',
              render: (row) => <TestButton name={row.name} kind="skill" />
            }
          ]}
          rows={agentSkills}
        />
      )}

      {activeTab === 'audit-log' && (
        <SmartTable
          searchPlaceholder="Search logs..."
          searchKeys={['whatUpdated', 'updatedBy', 'auditorRemark']}
          columns={[
            { key: 'status', header: 'Status' },
            { key: 'whatUpdated', header: 'Change' },
            { key: 'updatedBy', header: 'Actor' },
            { key: 'auditorRemark', header: 'Auditor Remark' },
            { key: 'date', header: 'Date' }
          ]}
          rows={agent.auditLogs || [
            { id: 'a1', status: 'Healthy', whatUpdated: 'Version bumped to v1.2.0', updatedBy: 'system@registry.org', auditorRemark: 'Automatic build checks complete.', date: agent.updatedAt }
          ]}
          renderRow={(row, rIdx, cols) => (
            <TableRow key={row.id || rIdx} className="hover:bg-transparent border-0">
              <TableCell colSpan={cols.length} className="p-2 border-0">
                <div className="border border-border/80 rounded-xl p-4 bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border border-border/50 ${
                        row.status.toLowerCase() === 'approved' || row.status.toLowerCase() === 'healthy'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}>
                        <span className={`size-1.5 rounded-full ${row.status.toLowerCase() === 'approved' || row.status.toLowerCase() === 'healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span>{row.status}</span>
                      </span>
                      <span className="text-xs font-mono text-muted-foreground select-all">{row.updatedBy}</span>
                    </div>
                    <h4 className="text-[13.5px] font-semibold text-foreground">{row.whatUpdated}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{row.auditorRemark}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center select-none">
                    <span className="text-xs text-muted-foreground font-mono">{formatDateTime(row.date)}</span>
                    <button
                      onClick={() => setSelectedAudit(row)}
                      className="h-8 px-3 rounded border border-border bg-background hover:bg-accent text-xs font-semibold cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        />
      )}

      {activeTab === 'health-status' && (
        <SmartTable
          searchPlaceholder="Search health checks..."
          searchKeys={['status', 'performedBy']}
          columns={[
            {
              key: 'timestamp',
              header: 'Timestamp',
              className: 'font-mono py-2 w-[220px]',
              render: (row) => <span>{formatDateTime(row.timestamp)}</span>
            },
            {
              key: 'status',
              header: 'Status',
              className: 'w-[120px]',
              render: (row) => {
                const isHealthy = row.status === 'healthy';
                return (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    <span className={`size-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="uppercase text-[9px]">{row.status}</span>
                  </span>
                );
              }
            },
            {
              key: 'performedBy',
              header: 'Performed By',
              className: 'font-mono text-muted-foreground select-all',
              render: (row) => <span>{row.performedBy}</span>
            },
            {
              key: 'responseTimeMs',
              header: 'Response Time',
              className: 'font-mono tabular-nums text-right w-[140px] pr-4',
              render: (row) => <span className="font-semibold text-foreground">{row.responseTimeMs} ms</span>
            }
          ]}
          rows={agent.healthChecks || [
            { timestamp: agent.updatedAt, status: agentHealth, performedBy: 'healthcheck-daemon@registry.org', responseTimeMs: agent.avgResponseMs }
          ]}
        />
      )}

      {activeTab === 'integration' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between select-none">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Client Platform Sample</span>
            <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-muted border border-border/40">
              <button
                onClick={() => setIntegrationLang('ts')}
                className={`text-[11px] font-semibold py-1 px-3 rounded-md transition-all cursor-pointer ${
                  integrationLang === 'ts' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                TypeScript
              </button>
              <button
                onClick={() => setIntegrationLang('python')}
                className={`text-[11px] font-semibold py-1 px-3 rounded-md transition-all cursor-pointer ${
                  integrationLang === 'python' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          {/* Prerequisites */}
          <Card className="bg-card border-border rounded-xl shadow-none p-5 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Prerequisites</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Install the agent messaging SDK to handle communication envelopes:
            </p>
            <CopyBlock code={cliInstall} />
          </Card>

          {/* Endpoint Reference */}
          <Card className="bg-card border-border rounded-xl shadow-none overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20 select-none">
              <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">Endpoint Gateway Reference</CardTitle>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-border/60 font-mono text-[12px]">
              {[
                { method: 'GET', endpoint: `.well-known/agent-card.json`, purpose: 'Query public registration metadata card.' },
                { method: 'POST', endpoint: `message/send`, purpose: 'Send query message to agent coordinator.' },
                { method: 'POST', endpoint: `message/stream`, purpose: 'Initiate server-sent events SSE messaging stream.' },
                { method: 'POST', endpoint: `tasks/get`, purpose: 'Query current background queue task details.' },
                { method: 'POST', endpoint: `tasks/cancel`, purpose: 'Terminate a currently running workflow task.' }
              ].map((routeItem, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-bold text-[10px]">
                      {routeItem.method}
                    </span>
                    <span className="text-foreground font-semibold select-all">{agentEndpoint.replace(/https?:\/\/[^\/]+/, '')}/{routeItem.endpoint}</span>
                  </div>
                  <span className="text-muted-foreground font-sans text-xs">{routeItem.purpose}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Required Headers */}
          <Card className="bg-card border-border rounded-xl shadow-none p-5 space-y-2 select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Required Request Headers</h3>
            <div className="font-mono text-[12px] bg-muted/65 p-3 rounded-lg border border-border/40 text-foreground space-y-1.5">
              <div>Content-Type: application/json</div>
              <div>Authorization: Bearer mock_access_token_su_2026</div>
            </div>
          </Card>

          {/* Code Example */}
          <Card className="bg-card border-border rounded-xl shadow-none p-5 space-y-3">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Connection Code Sample</h3>
            <CopyBlock code={codeExample} />
          </Card>

          {/* Example Response */}
          <Card className="bg-card border-border rounded-xl shadow-none overflow-hidden">
            <CardHeader className="p-5 pb-3 border-b border-border bg-muted/20 flex flex-row items-center justify-between select-none">
              <CardTitle className="text-xs font-bold text-foreground uppercase tracking-wider">Response Samples</CardTitle>
              <SubTabs
                tabs={[
                  { key: 'success', label: 'Success' },
                  { key: 'errors', label: 'Common Errors' },
                  { key: 'format', label: 'Error Format' }
                ]}
                activeTab={responseSubTab}
                onChange={(key) => setResponseSubTab(key as any)}
              />
            </CardHeader>
            <CardContent className="p-5">
              {responseSubTab === 'success' && <CopyBlock code={successResponse} />}
              {responseSubTab === 'errors' && <CopyBlock code={commonErrors} />}
              {responseSubTab === 'format' && <CopyBlock code={errorFormat} />}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Header Verify Badges */}
          <Card className="bg-card border-border rounded-xl shadow-none p-5 select-none flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-foreground">Verified Integration Grade</h3>
              <p className="text-xs text-muted-foreground">Detailed scan checklist for security clearances.</p>
            </div>
            <div className="flex items-center gap-2">
              <VerifiedBadge />
              <ScanGrade score={agent.trust.score} />
              <span className="inline-flex items-center text-[11px] font-mono font-bold bg-muted border px-2 py-0.5 rounded-full text-foreground">
                Risk: {(1 - agent.trust.score / 100).toFixed(2)}
              </span>
            </div>
          </Card>

          {/* Security audits SmartTable */}
          <SmartTable
            columns={[
              {
                key: 'rule',
                header: 'Audit Rule',
                className: 'font-semibold text-foreground py-2',
                render: (row) => <span>{row.rule}</span>
              },
              {
                key: 'severity',
                header: 'Severity',
                className: 'w-[100px] text-center',
                render: (row) => {
                  const isHigh = row.severity === 'High';
                  return (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isHigh ? 'bg-red-500/10 text-red-600 border-red-500/20' : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {row.severity}
                    </span>
                  );
                }
              },
              {
                key: 'status',
                header: 'Status',
                className: 'w-[100px] text-center',
                render: (row) => {
                  const pass = row.status === 'pass';
                  const warn = row.status === 'warn';
                  return (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      pass ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : warn ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      <span className={`size-1.5 rounded-full ${pass ? 'bg-emerald-500' : warn ? 'bg-amber-500' : 'bg-red-500'}`} />
                      <span className="uppercase text-[9px]">{row.status}</span>
                    </span>
                  );
                }
              },
              {
                key: 'detail',
                header: 'Verification Detail',
                render: (row) => <span className="text-muted-foreground">{row.detail}</span>
              }
            ]}
            rows={securityRules}
          />

          {/* Declared permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border-border rounded-xl shadow-none p-5 space-y-3 select-none">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Declared Sandbox Permissions</h3>
              <div className="space-y-2">
                {[
                  { name: 'Network Communications Outbound', allow: true },
                  { name: 'Environment Variables Reading', allow: false },
                  { name: 'Local File Directory Access', allow: false }
                ].map((perm, pIdx) => (
                  <div key={pIdx} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                    <span className="font-medium text-foreground">{perm.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      perm.allow
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                    }`}>
                      {perm.allow ? 'ALLOW' : 'DENY'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Auth Posture */}
            <Card className="bg-card border-border rounded-xl shadow-none p-5 space-y-3 select-none">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Authentication Posture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connects through OAuth client credentials. Access tokens expire after 3600 seconds and are automatically refreshed. No personal developer keys are stored inside this service context.
              </p>
            </Card>
          </div>

          {/* Scan History */}
          <Card className="bg-card border-border rounded-xl shadow-none p-5 space-y-3 select-none">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Scan Clearance History</h3>
            <div className="space-y-3 font-mono text-xs">
              {[
                { date: '2026-07-01', score: agent.trust.score, grade: 'A' },
                { date: '2026-06-15', score: Math.max(agent.trust.score - 2, 70), grade: 'B' },
                { date: '2026-05-18', score: Math.max(agent.trust.score - 4, 70), grade: 'B' }
              ].map((hist, hIdx) => (
                <div key={hIdx} className="flex items-center justify-between border-b border-border/40 pb-2 last:border-0 last:pb-0">
                  <span className="text-muted-foreground">{hist.date}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-foreground font-semibold">Score: {hist.score}</span>
                    <span className="font-sans font-bold bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px]">
                      GRADE {hist.grade}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'version' && (
        <VersionsTable
          versions={[
            {
              version: agent.version,
              date: agent.updatedAt,
              notes: 'Regular agent logic maintenance and package bumps.',
              filesCount: agentSkills.length,
              sizeKb: 18.2,
              approvalStatus: 'approved'
            },
            {
              version: '1.0.0',
              date: agent.registeredAt,
              notes: 'Initial agent registration with the registry.',
              filesCount: 1,
              sizeKb: 5.4,
              approvalStatus: 'approved'
            }
          ]}
          currentVersion={agent.version}
          compareEnabled={false}
        />
      )}

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <Dialog open={!!selectedAudit} onOpenChange={(val) => { if (!val) setSelectedAudit(null); }}>
          <DialogContent className="sm:max-w-[480px] p-6 bg-card border border-border rounded-xl">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold text-foreground">Audit Record Detail</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Registry compliance check logged by platform scanners.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-xs select-none">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Audit ID</span>
                <span className="font-mono text-foreground">{selectedAudit.id}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Registry Status</span>
                <span className="font-semibold text-foreground uppercase">{selectedAudit.status}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Updated Action</span>
                <span className="font-semibold text-foreground">{selectedAudit.whatUpdated}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Updated By</span>
                <span className="font-mono text-foreground">{selectedAudit.updatedBy}</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground font-medium">Timestamp</span>
                <span className="font-mono text-foreground">{formatDateTime(selectedAudit.date)}</span>
              </div>
              <div className="space-y-1 pt-1">
                <span className="text-muted-foreground font-medium">Auditor Remarks</span>
                <p className="bg-muted/40 p-2.5 rounded-lg border border-border/30 text-foreground font-sans leading-relaxed">
                  {selectedAudit.auditorRemark}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end mt-6 select-none">
              <Button
                onClick={() => setSelectedAudit(null)}
                className="h-9 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
