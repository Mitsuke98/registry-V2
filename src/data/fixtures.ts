import type { User, McpServer, A2AAgent, SkillEntity, PromptEntity, Workspace, DeletionRequest, ChangeRecord } from './types';

// ----------------------------------------------------
// Seed Users
// ----------------------------------------------------
export const users: User[] = [
  {
    id: 'alex-vance',
    name: 'Alex Vance',
    email: 'alex@vance.com',
    initials: 'AV',
    role: 'end_user',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'jordan-blake',
    name: 'Jordan Blake',
    email: 'jordan@blake.com',
    initials: 'JB',
    role: 'super_admin',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'priya-nair',
    name: 'Priya Nair',
    email: 'priya@nair.com',
    initials: 'PN',
    role: 'end_user',
    active: true,
    createdAt: '2026-02-15T00:00:00Z',
  },
  {
    id: 'marcus-trent',
    name: 'Marcus Trent',
    email: 'marcus@trent.com',
    initials: 'MT',
    role: 'end_user',
    active: true,
    createdAt: '2026-03-10T00:00:00Z',
  },
  {
    id: 'deactivated-user',
    name: 'Inactive User',
    email: 'inactive@registry.org',
    initials: 'IU',
    role: 'end_user',
    active: false,
    createdAt: '2026-01-10T00:00:00Z',
  }
];

// Helper to get active users for SSO login
export const activeUsers = users.filter(u => u.active);

// ----------------------------------------------------
// Seed Workspaces (SA-created only, personal workspaces do not exist)
// ----------------------------------------------------
export const workspaces: Workspace[] = [
  {
    id: 'shared-design',
    name: 'Design Systems',
    description: 'Standardizing visual tokens and layout schemas across product interfaces.',
    kind: 'shared',
    ownerName: 'Alex Vance',
    members: ['Alex Vance', 'Priya Nair', 'Marcus Trent'],
    createdAt: '2026-05-15T00:00:00Z',
  },
  {
    id: 'shared-data',
    name: 'Data Platform',
    description: 'Engineering centralized data pipelines and database gateways.',
    kind: 'shared',
    ownerName: 'Priya Nair',
    members: ['Priya Nair', 'Alex Vance'],
    createdAt: '2026-05-10T00:00:00Z',
  },
  {
    id: 'user-guild-sec',
    name: 'Security Guild Workspace',
    description: 'Coordinating threat analysis and input filters workspace-wide.',
    kind: 'user',
    ownerName: 'Marcus Trent',
    members: ['Marcus Trent', 'Alex Vance'],
    createdAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'user-ops',
    name: 'Operations Central Workspace',
    description: 'Automation, system metrics checks, and cluster control scripts.',
    kind: 'user',
    ownerName: 'Jordan Blake',
    members: ['Jordan Blake', 'Alex Vance', 'Priya Nair'],
    createdAt: '2026-05-20T00:00:00Z',
  }
];

// ----------------------------------------------------
// Preseeded Bookmarks
// ----------------------------------------------------
export const preseededBookmarks = {
  server: ['github-mcp', 'filesystem-mcp'],
  agent: ['invoice-reconciler'],
  skill: ['prompt-injection-filter'],
  prompt: ['explain-pr']
};

// ----------------------------------------------------
// 10 MCP Servers
// ----------------------------------------------------
export const mcpServers: McpServer[] = [
  {
    id: 'github-mcp',
    name: 'GitHub MCP',
    description: 'Integrates with GitHub API to manage repositories, create issues, view pull requests, and commit files.',
    version: '1.4.2',
    license: 'MIT',
    publisher: {
      name: 'Alex Vance',
      email: 'alex@vance.com',
      organization: 'VCS Masters',
      website: 'https://github.com',
      supportEmail: 'support@vcsmasters.com',
      supportUrl: 'https://vcsmasters.com/support'
    },
    tech: {
      endpoint: 'http://localhost:8080/mcp/github',
      gatewayUrl: 'http://gateway.internal/github',
      authType: 'oauth2',
      transport: 'stdio',
      protocolVersion: '1.1.0',
      docsUrl: 'https://docs.github.com',
      sourceUrl: 'https://github.com/vcs-masters/mcp-github'
    },
    capabilities: {
      tools: true,
      resources: true,
      prompts: true
    },
    tags: ['github', 'vcs', 'git', 'api'],
    ownerName: 'Alex Vance',
    status: 'approved',
    registeredAt: '2026-05-15T08:00:00Z',
    updatedAt: '2026-07-01T10:00:00Z',
    lastUsedAt: '2026-07-06T16:55:00Z',
    rating: 4.8,
    reviewsCount: 142,
    health: { uptimePct: 99.95, p95LatencyMs: 245, errorRatePct: 0.02, status: 'healthy' },
    weeklyCalls: [450, 480, 520, 490, 510, 530, 580, 610, 590, 630, 670, 710],
    weeklyErrors: [2, 1, 3, 2, 4, 3, 2, 4, 5, 2, 1, 2],
    tools: [
      { name: 'git_clone', description: 'Clones a remote repository to a local path.', params: { repo: 'string', dest: 'string' }, invocations30d: 480 },
      { name: 'git_commit', description: 'Commits staged files with a descriptive message.', params: { msg: 'string' }, invocations30d: 1250 },
      { name: 'create_pull_request', description: 'Creates a new pull request against target branch.', params: { title: 'string', body: 'string' }, invocations30d: 210 }
    ],
    resources: [
      { name: 'GitHub Repository Metadata Schema', uriPattern: 'github://schemas/repository.json', mimeType: 'application/json' },
      { name: 'GitHub Rate Limit Info', uriPattern: 'github://limits/api-usage', mimeType: 'application/json' }
    ],
    prompts: [
      { name: 'explain_pull_request', description: 'Generates a markdown summary detailing changes in file diffs.', argCount: 1 }
    ],
    auditRecords: [
      { healthStatus: 'Approved', whatChanged: 'Configuration update', updatedBy: 'jordan@blake.com', remark: 'Verified OAuth settings look safe.', editedAt: '2026-07-06T16:55:00Z' },
      { healthStatus: 'Healthy', whatChanged: 'Version bumped to 1.4.2', updatedBy: 'alex@vance.com', remark: 'Uptime remains stable.', editedAt: '2026-07-01T10:00:00Z' }
    ],
    healthChecks: [
      { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 142 },
      { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 151 },
      { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 139 },
      { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 162 },
      { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 140 },
      { timestamp: '2026-07-06T16:30:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 148 },
      { timestamp: '2026-07-06T16:25:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 153 },
      { timestamp: '2026-07-06T16:20:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 144 },
      { timestamp: '2026-07-06T16:15:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 141 },
      { timestamp: '2026-07-06T16:10:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 138 },
      { timestamp: '2026-07-06T16:05:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 480 },
      { timestamp: '2026-07-06T16:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 135 }
    ],
    versions: [
      { version: '1.4.2', date: '2026-07-01T10:00:00Z', changelog: 'Security key rotation and OAuth2 token setup.', status: 'approved', active: true },
      { version: '1.4.0', date: '2026-06-15T09:00:00Z', changelog: 'Initial setup of tools and repository cloners.', status: 'approved', active: false }
    ],
    iconName: 'github',
    trust: {
      verified: true,
      score: 98,
      scannedAt: '2026-07-01T12:00:00Z',
      audits: [
        { check: 'Dependency Scan', status: 'pass', detail: '0 vulnerabilities found.' },
        { check: 'Static Analysis', status: 'pass', detail: 'No style or lint violations.' },
        { check: 'Secrets Check', status: 'pass', detail: 'No keys found.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-design', 'shared-data'] }
  },
  {
    id: 'postgres-mcp',
    name: 'Postgres MCP',
    description: 'Secure read-write gateway for PostgreSQL databases with query optimization and schema inspection capabilities.',
    version: '2.1.0',
    license: 'Apache-2.0',
    publisher: { name: 'Priya Nair', email: 'priya@nair.com', organization: 'Supabase' },
    tech: { endpoint: 'http://localhost:5432/mcp', gatewayUrl: 'http://gateway.internal/postgres', authType: 'bearer', transport: 'sse', protocolVersion: '1.1.0' },
    capabilities: { tools: true, resources: true, prompts: true },
    tags: ['database', 'sql', 'postgres', 'backend'],
    ownerName: 'Priya Nair',
    status: 'approved',
    registeredAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-06-25T11:00:00Z',
    lastUsedAt: '2026-07-06T16:45:00Z',
    rating: 4.9,
    reviewsCount: 218,
    health: { uptimePct: 99.99, p95LatencyMs: 45, errorRatePct: 0.00, status: 'healthy' },
    weeklyCalls: [1200, 1250, 1300, 1280, 1350, 1420, 1400, 1450, 1490, 1530, 1600, 1680],
    weeklyErrors: [5, 4, 3, 6, 8, 5, 4, 7, 6, 8, 10, 5],
    tools: [
      { name: 'execute_sql_query', description: 'Executes a raw SQL statement with bindings against database.', params: { sql: 'string' }, invocations30d: 8400 },
      { name: 'describe_database_table', description: 'Inspects column types of a table.', params: { table: 'string' }, invocations30d: 650 }
    ],
    resources: [
      { name: 'Database Structural Schema Dump', uriPattern: 'postgres://schemas/active_relations', mimeType: 'application/sql' }
    ],
    prompts: [
      { name: 'generate_sql_query', description: 'Translates natural language questions to PostgreSQL statements.', argCount: 1 }
    ],
    auditRecords: [],
    healthChecks: [
      { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 42 }
    ],
    versions: [
      { version: '2.1.0', date: '2026-06-25T11:00:00Z', changelog: 'Support read-only connection pooling and dynamic schema updates.', status: 'approved', active: true }
    ],
    iconName: 'database',
    trust: {
      verified: true,
      score: 95,
      scannedAt: '2026-06-25T11:00:00Z',
      audits: [
        { check: 'Syntax Validation', status: 'pass', detail: 'Complies with standard SQL definitions.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-data'] }
  },
  {
    id: 'slack-mcp',
    name: 'Slack MCP',
    description: 'Sends messages, manages channels, lists users, and listens to event streams within your Slack workspace.',
    version: '0.9.1',
    license: 'MIT',
    publisher: { name: 'Marcus Trent', email: 'marcus@trent.com', organization: 'Slack Community' },
    tech: { endpoint: 'https://api.slack.com/mcp', gatewayUrl: 'https://gateway.internal/slack', authType: 'oauth2', transport: 'http', protocolVersion: '1.0.0' },
    capabilities: { tools: true, resources: true, prompts: false },
    tags: ['communication', 'chat', 'slack', 'collaboration'],
    ownerName: 'Marcus Trent',
    status: 'approved',
    registeredAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-20T10:00:00Z',
    lastUsedAt: '2026-07-04T12:00:00Z',
    rating: 4.2,
    reviewsCount: 88,
    health: { uptimePct: 98.4, p95LatencyMs: 380, errorRatePct: 1.8, status: 'unhealthy' },
    weeklyCalls: [300, 310, 290, 320, 350, 330, 340, 310, 280, 270, 290, 310],
    weeklyErrors: [8, 6, 7, 9, 10, 8, 12, 11, 9, 8, 7, 9],
    tools: [
      { name: 'slack_send_message', description: 'Post text or blocks message layout to slack channels.', params: { channel: 'string', text: 'string' }, invocations30d: 910 }
    ],
    resources: [
      { name: 'Slack public channel names metadata', uriPattern: 'slack://channels/public-list', mimeType: 'application/json' }
    ],
    prompts: [],
    auditRecords: [],
    healthChecks: [
      { timestamp: '2026-07-06T16:55:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 380 }
    ],
    versions: [
      { version: '0.9.1', date: '2026-05-20T10:00:00Z', changelog: 'Support oauth tokens configuration.', status: 'approved', active: true }
    ],
    iconName: 'message-square',
    trust: {
      verified: true,
      score: 87,
      scannedAt: '2026-05-20T10:00:00Z',
      audits: [
        { check: 'OAuth Validation', status: 'pass', detail: 'Token scopes comply with security policies.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['user-guild-sec'] }
  },
  {
    id: 'filesystem-mcp',
    name: 'Filesystem MCP',
    description: 'Allows secure local file operations including reading, writing, searching, and structural analysis.',
    version: '1.0.0',
    license: 'MIT',
    publisher: { name: 'Alex Vance', email: 'alex@vance.com', organization: 'Vite Team' },
    tech: { endpoint: 'stdio://run', gatewayUrl: 'stdio://localhost', authType: 'none', transport: 'stdio', protocolVersion: '1.1.0' },
    capabilities: { tools: true, resources: true, prompts: false },
    tags: ['local', 'files', 'system', 'utility'],
    ownerName: 'Alex Vance',
    status: 'approved',
    registeredAt: '2026-01-15T09:00:00Z',
    updatedAt: '2026-01-15T09:00:00Z',
    lastUsedAt: '2026-07-02T08:00:00Z',
    rating: 4.7,
    reviewsCount: 312,
    health: { uptimePct: 100.0, p95LatencyMs: 12, errorRatePct: 0.00, status: 'healthy' },
    weeklyCalls: [2200, 2300, 2150, 2400, 2450, 2500, 2600, 2550, 2650, 2700, 2800, 2950],
    weeklyErrors: [0, 1, 0, 0, 2, 1, 0, 0, 1, 0, 2, 0],
    tools: [
      { name: 'read_file_content', description: 'Reads content of a target text file.', params: { path: 'string' }, invocations30d: 12400 },
      { name: 'write_file_content', description: 'Writes string content to target path.', params: { path: 'string', content: 'string' }, invocations30d: 6300 }
    ],
    resources: [
      { name: 'Workspace directory structures index', uriPattern: 'file://workspace/tree.txt', mimeType: 'text/plain' }
    ],
    prompts: [],
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.0.0', date: '2026-01-15T09:00:00Z', changelog: 'Initial setup of read/write limits.', status: 'approved', active: true }
    ],
    iconName: 'folder',
    trust: {
      verified: true,
      score: 99,
      scannedAt: '2026-01-15T09:00:00Z',
      audits: [
        { check: 'Sandbox Jail Check', status: 'pass', detail: 'Prevents path traversals outside project roots.' }
      ]
    },
    visibility: { global: true, workspaceIds: [] }
  },
  {
    id: 'stripe-mcp',
    name: 'Stripe MCP',
    description: 'Sandbox gateway to search invoices, retrieve transaction reports, and handle dispute parameters.',
    version: '0.1.0',
    license: 'Proprietary',
    publisher: { name: 'Alex Vance', email: 'alex@vance.com' },
    tech: { endpoint: 'http://localhost:9099/stripe', gatewayUrl: 'http://gateway.internal/stripe', authType: 'api-key', transport: 'http', protocolVersion: '1.0.0' },
    capabilities: { tools: true, resources: true, prompts: false },
    tags: ['payment', 'stripe', 'finance', 'sandbox'],
    ownerName: 'Alex Vance',
    status: 'pending',
    registeredAt: '2026-07-01T14:30:00Z',
    updatedAt: '2026-07-02T14:30:00Z',
    rating: 3.5,
    reviewsCount: 4,
    health: { uptimePct: 97.2, p95LatencyMs: 820, errorRatePct: 2.1, status: 'unhealthy' },
    weeklyCalls: [10, 15, 20, 25, 30, 28, 35, 42, 40, 50, 48, 55],
    weeklyErrors: [1, 2, 1, 2, 3, 2, 3, 4, 3, 4, 3, 5],
    tools: [
      { name: 'list_stripe_charges', description: 'Query customer billing records with standard pagination.', params: { limit: 'number' }, invocations30d: 85 }
    ],
    resources: [
      { name: 'Standard Stripe Event Webhook layout', uriPattern: 'stripe://schemas/events.json', mimeType: 'application/json' }
    ],
    prompts: [],
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '0.1.0', date: '2026-07-01T14:30:00Z', changelog: 'Sandbox testing version.', status: 'pending', active: true }
    ],
    iconName: 'credit-card',
    trust: {
      verified: false,
      score: 72,
      scannedAt: '2026-07-02T14:30:00Z',
      audits: [
        { check: 'API Key Check', status: 'warn', detail: 'Uses sandbox keys but permissions are overly broad.' }
      ]
    },
    visibility: { global: false, workspaceIds: [] }
  },
  {
    id: 'figma-mcp',
    name: 'Figma MCP',
    description: 'Inspect designs, read frames, export assets, and query style elements from Figma documents.',
    version: '1.2.0',
    license: 'MIT',
    publisher: { name: 'Priya Nair', email: 'priya@nair.com', organization: 'Figma' },
    tech: { endpoint: 'http://localhost:3010/figma', gatewayUrl: 'http://gateway.internal/figma', authType: 'oauth2', transport: 'sse', protocolVersion: '1.1.0' },
    capabilities: { tools: true, resources: true, prompts: false },
    tags: ['design', 'figma', 'ui-ux', 'assets'],
    ownerName: 'Priya Nair',
    status: 'approved',
    registeredAt: '2026-04-25T11:00:00Z',
    updatedAt: '2026-04-25T11:00:00Z',
    lastUsedAt: '2026-06-30T11:00:00Z',
    rating: 4.5,
    reviewsCount: 74,
    health: { uptimePct: 99.8, p95LatencyMs: 310, errorRatePct: 0.15, status: 'healthy' },
    weeklyCalls: [150, 170, 160, 180, 190, 210, 205, 220, 215, 230, 240, 250],
    weeklyErrors: [2, 3, 1, 2, 4, 3, 2, 5, 4, 3, 2, 1],
    tools: [
      { name: 'figma_get_file_json', description: 'Extracts style node hierarchies from a Figma layout key.', params: { fileKey: 'string' }, invocations30d: 410 }
    ],
    resources: [
      { name: 'Figma Layout Style variables node link', uriPattern: 'figma://files/design-variables', mimeType: 'application/json' }
    ],
    prompts: [],
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.2.0', date: '2026-04-25T11:00:00Z', changelog: 'Full release.', status: 'approved', active: true }
    ],
    iconName: 'image',
    trust: {
      verified: true,
      score: 96,
      scannedAt: '2026-04-25T11:00:00Z',
      audits: [
        { check: 'Official Publisher Scan', status: 'pass', detail: 'Signed by verified Figma domain.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-design'] }
  },
  {
    id: 'sentry-mcp',
    name: 'Sentry MCP',
    description: 'Fetch error logs, summarize issue trends, and query performance profiles directly from Sentry.',
    version: '2.0.4',
    license: 'MIT',
    publisher: { name: 'Jordan Blake', email: 'jordan@blake.com', organization: 'Sentry' },
    tech: { endpoint: 'http://localhost:9000/sentry', gatewayUrl: 'http://gateway.internal/sentry', authType: 'bearer', transport: 'http', protocolVersion: '1.1.0' },
    capabilities: { tools: true, resources: true, prompts: false },
    tags: ['monitoring', 'errors', 'sentry', 'devops'],
    ownerName: 'Jordan Blake',
    status: 'approved',
    registeredAt: '2026-03-12T08:30:00Z',
    updatedAt: '2026-03-12T08:30:00Z',
    rating: 4.6,
    reviewsCount: 95,
    health: { uptimePct: 92.1, p95LatencyMs: 1450, errorRatePct: 8.5, status: 'unhealthy' },
    weeklyCalls: [400, 420, 410, 390, 430, 450, 470, 460, 440, 350, 200, 80],
    weeklyErrors: [30, 35, 38, 32, 40, 42, 45, 48, 50, 60, 55, 62],
    tools: [
      { name: 'sentry_list_issues', description: 'Fetches crash alerts from target project.', params: { project: 'string' }, invocations30d: 1540 }
    ],
    resources: [
      { name: 'Sentry Crash metadata trace structure', uriPattern: 'sentry://logs/stacktrace-schema.json', mimeType: 'application/json' }
    ],
    prompts: [],
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '2.0.4', date: '2026-03-12T08:30:00Z', changelog: 'Support latency filters.', status: 'approved', active: true }
    ],
    iconName: 'activity',
    trust: {
      verified: true,
      score: 93,
      scannedAt: '2026-03-12T08:30:00Z',
      audits: [
        { check: 'Log Sanitizer', status: 'pass', detail: 'Filters PII in stack traces.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['user-ops'] }
  },
  {
    id: 'notion-mcp',
    name: 'Notion MCP',
    description: 'Access Notion databases, update pages, list blocks, and append items to tables.',
    version: '1.0.1',
    license: 'Apache-2.0',
    publisher: { name: 'Marcus Trent', email: 'marcus@trent.com' },
    tech: { endpoint: 'http://localhost:3030/notion', gatewayUrl: 'http://gateway.internal/notion', authType: 'bearer', transport: 'stdio', protocolVersion: '1.0.0' },
    capabilities: { tools: true, resources: true, prompts: false },
    tags: ['notion', 'notes', 'docs', 'productivity'],
    ownerName: 'Marcus Trent',
    status: 'approved',
    registeredAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-02-15T09:00:00Z',
    rating: 3.8,
    reviewsCount: 32,
    health: { uptimePct: 99.1, p95LatencyMs: 145, errorRatePct: 0.12, status: 'healthy' },
    weeklyCalls: [110, 120, 115, 130, 140, 135, 142, 150, 148, 155, 160, 165],
    weeklyErrors: [1, 2, 1, 0, 1, 2, 1, 2, 1, 2, 0, 1],
    tools: [
      { name: 'get_notion_page', description: 'Retrieve structured content from a page ID.', params: { id: 'string' }, invocations30d: 310 }
    ],
    resources: [],
    prompts: [],
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.0.1', date: '2026-02-15T09:00:00Z', changelog: 'Support markdown parser.', status: 'approved', active: true }
    ],
    iconName: 'book-open',
    trust: {
      verified: true,
      score: 91,
      scannedAt: '2026-02-15T09:00:00Z',
      audits: [
        { check: 'Markdown Parser Audit', status: 'pass', detail: 'Prevents code injection inside codeblocks.' }
      ]
    },
    visibility: { global: true, workspaceIds: [] }
  },
  {
    id: 'docker-mcp',
    name: 'Docker MCP',
    description: 'Allows reading container configurations, inspecting image trees, restarting clusters, and reading logs.',
    version: '1.0.5',
    license: 'MIT',
    publisher: { name: 'Alex Vance', email: 'alex@vance.com' },
    tech: { endpoint: 'stdio://docker', gatewayUrl: 'stdio://localhost:2375', authType: 'none', transport: 'stdio', protocolVersion: '1.1.0' },
    capabilities: { tools: true, resources: true, prompts: false },
    tags: ['docker', 'containers', 'ops', 'devops'],
    ownerName: 'Alex Vance',
    status: 'approved',
    registeredAt: '2026-04-12T10:00:00Z',
    updatedAt: '2026-04-12T10:00:00Z',
    rating: 4.4,
    reviewsCount: 42,
    health: { uptimePct: 99.6, p95LatencyMs: 85, errorRatePct: 0.1, status: 'healthy' },
    weeklyCalls: [300, 310, 320, 330, 315, 340, 335, 350, 360, 370, 380, 390],
    weeklyErrors: [2, 1, 3, 2, 4, 3, 2, 4, 1, 2, 3, 1],
    tools: [
      { name: 'list_docker_containers', description: 'Lists active and stopped containers in sandbox.', params: {}, invocations30d: 1400 }
    ],
    resources: [],
    prompts: [],
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.0.5', date: '2026-04-12T10:00:00Z', changelog: 'Container socket security mapping.', status: 'approved', active: true }
    ],
    iconName: 'package',
    trust: {
      verified: true,
      score: 89,
      scannedAt: '2026-04-12T10:00:00Z',
      audits: [
        { check: 'Socket Access Scan', status: 'pass', detail: 'Runs inside custom sandbox profile.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['user-ops'] }
  },
  {
    id: 'memory-mcp',
    name: 'Memory MCP',
    description: 'Dynamic graph knowledge store based on semantic recall, tracking conversation context and entities.',
    version: '1.0.0',
    license: 'MIT',
    publisher: { name: 'Priya Nair', email: 'priya@nair.com' },
    tech: { endpoint: 'http://localhost:8989/memory', gatewayUrl: 'http://gateway.internal/memory', authType: 'none', transport: 'sse', protocolVersion: '1.1.0' },
    capabilities: { tools: true, resources: false, prompts: false },
    tags: ['memory', 'knowledge-graph', 'semantic', 'context'],
    ownerName: 'Priya Nair',
    status: 'approved',
    registeredAt: '2026-06-01T12:00:00Z',
    updatedAt: '2026-06-01T12:00:00Z',
    rating: 4.8,
    reviewsCount: 110,
    health: { uptimePct: 99.9, p95LatencyMs: 15, errorRatePct: 0.00, status: 'healthy' },
    weeklyCalls: [800, 850, 900, 950, 920, 980, 1010, 1050, 1100, 1150, 1200, 1250],
    weeklyErrors: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    tools: [
      { name: 'remember_entity', description: 'Store a dynamic metadata tag to context.', params: { key: 'string', val: 'string' }, invocations30d: 4120 }
    ],
    resources: [],
    prompts: [],
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.0.0', date: '2026-06-01T12:00:00Z', changelog: 'Initial setup of dynamic schema indices.', status: 'approved', active: true }
    ],
    iconName: 'brain',
    trust: {
      verified: true,
      score: 97,
      scannedAt: '2026-06-01T12:00:00Z',
      audits: [
        { check: 'Graph DB validation', status: 'pass', detail: 'Deterministic cycles check successful.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-data'] }
  }
];

// Seed one pending version change on Alex's GitHub MCP server
mcpServers[0].versions.unshift({
  version: '1.5.0',
  date: '2026-07-12T10:00:00Z',
  changelog: 'Staged update: Adding repository delete tools and advanced query filters.',
  status: 'pending',
  active: false,
  payload: {
    version: '1.5.0',
    description: 'Integrates with GitHub API to manage repositories, create issues, view pull requests, and commit files. Includes advanced deletion tools.',
    tools: [
      { name: 'git_clone', description: 'Clones a remote repository to a local path.', params: { repo: 'string', dest: 'string' }, invocations30d: 480 },
      { name: 'git_commit', description: 'Commits staged files with a descriptive message.', params: { msg: 'string' }, invocations30d: 1250 },
      { name: 'create_pull_request', description: 'Creates a new pull request against target branch.', params: { title: 'string', body: 'string' }, invocations30d: 210 },
      { name: 'delete_repository', description: 'Delete repository with permission check.', params: { owner: 'string', name: 'string' }, invocations30d: 0 }
    ]
  }
});

// ----------------------------------------------------
// 4 A2A Agents
// ----------------------------------------------------
export const a2aAgents: A2AAgent[] = [
  {
    id: 'invoice-reconciler',
    name: 'Invoice Reconciler',
    description: 'Autonomous financial agent that analyzes invoice sheets, correlates transaction rows in Stripe, and generates PDF reports.',
    version: '1.2.0',
    license: 'Proprietary',
    publisher: { name: 'Alex Vance', email: 'alex@vance.com' },
    tech: { endpoint: 'http://localhost:5000/agent/invoice', gatewayUrl: 'http://gateway.internal/agent-reconciler', authType: 'bearer', transport: 'http', protocolVersion: '1.0.0' },
    autonomy: 'High',
    capabilityToggles: {
      reasoning: true,
      memory: true,
      collaboration: true,
      streaming: false,
      multimodal: false,
      logging: true
    },
    skillRefs: [
      { skillId: 'prompt-injection-filter', version: '1.0.0' }
    ],
    tags: ['agents', 'billing', 'reconciliation', 'finance'],
    ownerName: 'Alex Vance',
    status: 'approved',
    registeredAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-15T11:00:00Z',
    lastUsedAt: '2026-07-06T12:00:00Z',
    rating: 4.6,
    reviewsCount: 38,
    successRatePct: 94.5,
    avgResponseMs: 1420,
    totalCalls30d: 4120,
    weeklyCalls: [300, 310, 320, 315, 340, 335, 350, 360, 370, 380, 390, 412],
    weeklyErrors: [4, 5, 4, 3, 2, 3, 4, 5, 2, 3, 1, 2],
    weeklySuccessRate: [93.5, 94.2, 94.0, 94.5, 94.8, 94.6, 95.0, 94.8, 95.2, 95.5, 96.0, 96.2],
    health: { status: 'healthy', uptimePct: 94.5, p95LatencyMs: 1420, errorRatePct: 1.2 },
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.2.0', date: '2026-06-15T11:00:00Z', changelog: 'Support stripe api hooks.', status: 'approved', active: true }
    ],
    iconName: 'cpu',
    trust: {
      verified: true,
      score: 94,
      scannedAt: '2026-06-15T11:00:00Z',
      audits: [
        { check: 'Sandbox Run Scan', status: 'pass', detail: 'Financial records access is strictly compartmentalized.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-data'] }
  },
  {
    id: 'meeting-scheduler',
    name: 'Meeting Scheduler',
    description: 'Polite coordination agent that parses event requests, cross-references calendar lists, and invites members.',
    version: '1.0.0',
    license: 'MIT',
    publisher: { name: 'Priya Nair', email: 'priya@nair.com' },
    tech: { endpoint: 'http://localhost:5001/agent/meeting', gatewayUrl: 'http://gateway.internal/agent-scheduler', authType: 'none', transport: 'sse', protocolVersion: '1.0.0' },
    autonomy: 'Low',
    capabilityToggles: {
      reasoning: false,
      memory: true,
      collaboration: true,
      streaming: true,
      multimodal: false,
      logging: false
    },
    skillRefs: [],
    tags: ['agents', 'coordination', 'calendar', 'productivity'],
    ownerName: 'Priya Nair',
    status: 'approved',
    registeredAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-05-15T09:00:00Z',
    rating: 4.1,
    reviewsCount: 12,
    successRatePct: 98.2,
    avgResponseMs: 420,
    totalCalls30d: 980,
    weeklyCalls: [50, 60, 55, 65, 70, 75, 80, 85, 90, 88, 92, 95],
    weeklyErrors: [0, 1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0],
    weeklySuccessRate: [98.5, 98.0, 98.2, 98.5, 98.8, 98.6, 99.0, 98.7, 99.2, 99.0, 99.2, 99.5],
    health: { status: 'healthy', uptimePct: 98.2, p95LatencyMs: 420, errorRatePct: 0.1 },
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.0.0', date: '2026-05-15T09:00:00Z', changelog: 'Initial setup.', status: 'approved', active: true }
    ],
    iconName: 'calendar',
    trust: {
      verified: true,
      score: 92,
      scannedAt: '2026-05-15T09:00:00Z',
      audits: [
        { check: 'Calendar Sync Validation', status: 'pass', detail: 'OAuth credentials token bounds are safe.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-design'] }
  },
  {
    id: 'research-analyst',
    name: 'Research Analyst',
    description: 'Browses web pages, extracts structured summaries, generates markdown documents, and alerts teams of updates.',
    version: '2.0.0',
    license: 'MIT',
    publisher: { name: 'Marcus Trent', email: 'marcus@trent.com' },
    tech: { endpoint: 'http://localhost:5002/agent/research', gatewayUrl: 'http://gateway.internal/agent-analyst', authType: 'none', transport: 'http', protocolVersion: '1.1.0' },
    autonomy: 'Mid',
    capabilityToggles: {
      reasoning: true,
      memory: true,
      collaboration: false,
      streaming: true,
      multimodal: true,
      logging: true
    },
    skillRefs: [],
    tags: ['agents', 'search', 'research', 'scraper'],
    ownerName: 'Marcus Trent',
    status: 'approved',
    registeredAt: '2026-04-12T12:00:00Z',
    updatedAt: '2026-04-12T12:00:00Z',
    rating: 4.4,
    reviewsCount: 54,
    successRatePct: 89.1,
    avgResponseMs: 3100,
    totalCalls30d: 1400,
    weeklyCalls: [80, 90, 85, 95, 100, 110, 105, 120, 115, 125, 130, 140],
    weeklyErrors: [5, 4, 6, 5, 8, 7, 6, 8, 9, 8, 10, 7],
    weeklySuccessRate: [88.5, 89.0, 88.8, 89.2, 89.5, 89.2, 89.6, 89.4, 89.8, 89.6, 90.0, 90.2],
    health: { status: 'healthy', uptimePct: 89.1, p95LatencyMs: 3100, errorRatePct: 0.8 },
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '2.0.0', date: '2026-04-12T12:00:00Z', changelog: 'Support multimodal layouts.', status: 'approved', active: true }
    ],
    iconName: 'search',
    trust: {
      verified: true,
      score: 88,
      scannedAt: '2026-04-12T12:00:00Z',
      audits: [
        { check: 'Scraper safety validation', status: 'pass', detail: 'Adheres to standard robots.txt restrictions.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-design'] }
  },
  {
    id: 'security-bot',
    name: 'Security Shield Bot',
    description: 'Monitors incoming query traffic, blocks injection patterns, and logs active request headers.',
    version: '1.0.0',
    license: 'Proprietary',
    publisher: { name: 'Alex Vance', email: 'alex@vance.com' },
    tech: { endpoint: 'http://localhost:5003/agent/security', gatewayUrl: 'http://gateway.internal/agent-security', authType: 'api-key', transport: 'http', protocolVersion: '1.1.0' },
    autonomy: 'High',
    capabilityToggles: {
      reasoning: true,
      memory: false,
      collaboration: true,
      streaming: false,
      multimodal: false,
      logging: true
    },
    skillRefs: [
      { skillId: 'prompt-injection-filter', version: '1.0.0' }
    ],
    tags: ['agents', 'security', 'guardrail'],
    ownerName: 'Alex Vance',
    status: 'approved',
    registeredAt: '2026-07-05T10:00:00Z',
    updatedAt: '2026-07-05T10:00:00Z',
    rating: 5.0,
    reviewsCount: 2,
    successRatePct: 99.5,
    avgResponseMs: 120,
    totalCalls30d: 6500,
    weeklyCalls: [400, 450, 480, 500, 520, 530, 550, 580, 600, 610, 630, 650],
    weeklyErrors: [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    weeklySuccessRate: [99.9, 99.9, 99.9, 99.8, 99.9, 99.9, 99.9, 99.9, 99.9, 99.9, 99.9, 99.9],
    health: { status: 'healthy', uptimePct: 99.5, p95LatencyMs: 120, errorRatePct: 0.0 },
    auditRecords: [],
    healthChecks: [],
    versions: [
      { version: '1.0.0', date: '2026-07-05T10:00:00Z', changelog: 'Initial setup of shield agent.', status: 'approved', active: true }
    ],
    iconName: 'shield',
    trust: {
      verified: true,
      score: 98,
      scannedAt: '2026-07-05T10:00:00Z',
      audits: [
        { check: 'Sandbox Policy Audit', status: 'pass', detail: 'Integrity constraints active.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['user-guild-sec'] }
  }
];

// ----------------------------------------------------
// 4 Skill Entities (Category-based)
// Categories options: Security, Data Extraction, Database, System Operations, etc.
// ----------------------------------------------------
export const skills: SkillEntity[] = [
  {
    id: 'prompt-injection-filter',
    name: 'Prompt Injection Filter',
    category: 'Security',
    description: 'Inspects user prompt structures using optimized regex heuristics to trap system jailbreaks.',
    longDescription: 'A robust utility designed to shield LLM backends from direct instruction manipulation. It executes multi-pass regex matching and token inspection prior to context rendering.',
    whenToUse: [
      'Prior to feeding user-provided strings into LLM system prompts.',
      'Inside gateway message routing channels.'
    ],
    exampleSnippet: '```python\nfilter = InjectionFilter()\nif filter.scan(user_input):\n    raise ValueError("Jailbreak Detected")\n```',
    inputs: [{ name: 'inputString', type: 'string', description: 'The user-supplied prompt text to analyze.' }],
    outputs: [{ name: 'riskScore', type: 'float', description: 'Normalized danger index between 0.0 and 1.0.' }],
    frontmatter: {
      roles: ['developer', 'security_engineer'],
      network: false
    },
    identity: {
      slug: 'prompt-injection-filter',
      skillId: 'prompt-injection-filter',
      ownerName: 'Alex Vance',
      workspaceId: 'user-guild-sec',
      createdAt: '2026-05-01T08:00:00Z',
      updatedAt: '2026-05-01T08:00:00Z'
    },
    contentHash: 'SHA-256: 4f18db0d38b5ef194a2b97c413b1f5e2777174e2d31f0b0938b5ef194a2b97c4',
    requirements: {
      tools: ['regex-parser'],
      env: [],
      network: false
    },
    sourceUrl: 'https://github.com/vcs-masters/injection-filter',
    stars: 84,
    downloads: 12400,
    downloadsDaily: [150, 160, 140, 170, 180, 165, 190, 205, 195, 210, 225, 240],
    files: [
      { name: 'SKILL.md', kind: 'markdown', sizeKb: 2.4, createdAt: '2026-05-01T08:00:00Z', updatedAt: '2026-05-01T08:00:00Z', content: '# Prompt Injection Filter Skill\n\nProvide regex heuristics filters to secure system prompt templates.' },
      { name: 'main.py', kind: 'script', sizeKb: 8.5, createdAt: '2026-05-01T08:00:00Z', updatedAt: '2026-05-01T08:00:00Z', content: 'class InjectionFilter:\n    def scan(self, text):\n        return False' }
    ],
    versions: [
      { version: '1.0.0', date: '2026-05-01T08:00:00Z', changelog: 'Initial setup of regex list.', status: 'approved', active: true }
    ],
    scan: {
      riskScore: 0.12,
      findings: []
    },
    comments: [
      { author: 'Marcus Trent', date: '2026-06-20T14:30:00Z', text: 'Extremely fast. Regex overhead is practically zero.', initials: 'MT' }
    ],
    rating: 4.8,
    reviewsCount: 18,
    publisherEmail: 'alex@vance.com',
    trust: {
      verified: true,
      score: 95,
      scannedAt: '2026-05-01T08:00:00Z',
      audits: [
        { check: 'Static Analyzer', status: 'pass', detail: 'Heuristics verified safely.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['user-guild-sec'] },
    status: 'approved',
    registeredAt: '2026-05-01T08:00:00Z',
    updatedAt: '2026-05-01T08:00:00Z',
    iconName: 'wrench'
  },
  {
    id: 'pdf-extraction',
    name: 'PDF Layout Extractor',
    category: 'Data Extraction',
    description: 'Parses complex structured tabular details from PDF logs using bounding-box segmentations.',
    longDescription: 'Extract schema boundaries from binary PDF streams using custom coordinate mappings. Converts visual grid coordinates directly into tables.',
    whenToUse: [
      'To ingest invoice PDF layouts.',
      'To build index caches.'
    ],
    exampleSnippet: '```typescript\nconst data = extractPdf(stream);\n```',
    inputs: [{ name: 'pdfStream', type: 'binary', description: 'Target PDF stream buffer.' }],
    outputs: [{ name: 'tables', type: 'array', description: 'Extracted grid arrays.' }],
    frontmatter: { roles: ['developer'], network: false },
    identity: { slug: 'pdf-extraction', skillId: 'pdf-extraction', ownerName: 'Priya Nair', createdAt: '2026-04-12T10:00:00Z', updatedAt: '2026-04-12T10:00:00Z' },
    contentHash: 'SHA-256: aa823ef194a2b97c413b1f5e2777174e2d31f0b0938b5ef194a2b97c4129b8c',
    requirements: { tools: [], env: [], network: false },
    sourceUrl: 'https://github.com/supabase/pdf-extract',
    stars: 32,
    downloads: 4200,
    downloadsDaily: [40, 45, 42, 50, 52, 48, 55, 60, 58, 62, 65, 70],
    files: [
      { name: 'SKILL.md', kind: 'markdown', sizeKb: 1.8, createdAt: '2026-04-12T10:00:00Z', updatedAt: '2026-04-12T10:00:00Z', content: '# PDF Extractor' }
    ],
    versions: [
      { version: '1.0.0', date: '2026-04-12T10:00:00Z', changelog: 'Release version.', status: 'approved', active: true }
    ],
    scan: { riskScore: 0.22, findings: [] },
    comments: [],
    rating: 4.2,
    reviewsCount: 6,
    publisherEmail: 'priya@nair.com',
    trust: {
      verified: true,
      score: 88,
      scannedAt: '2026-04-12T10:00:00Z',
      audits: [
        { check: 'Boundary Buffer Verification', status: 'pass', detail: 'Buffers boundary bounds checked.' }
      ]
    },
    visibility: { global: true, workspaceIds: ['shared-data', 'shared-design'] },
    status: 'approved',
    registeredAt: '2026-04-12T10:00:00Z',
    updatedAt: '2026-04-12T10:00:00Z',
    iconName: 'wrench'
  },
  {
    id: 'connection-pooler',
    name: 'Database Pool Manager',
    category: 'Database',
    description: 'Thread-safe postgres connection pool controller matching standard cluster metrics limits.',
    longDescription: 'Manages DB connections dynamically. Recycles inactive connections and keeps pool size inside secure boundaries.',
    whenToUse: ['For SSE multi-client routing architectures.'],
    exampleSnippet: '```python\nwith pool.acquire() as conn:\n    pass\n```',
    inputs: [{ name: 'minConnections', type: 'int', description: 'Minimum active instances.' }],
    outputs: [{ name: 'connection', type: 'object', description: 'Acquired socket reference.' }],
    frontmatter: { roles: ['developer'], network: false },
    identity: { slug: 'connection-pooler', skillId: 'connection-pooler', ownerName: 'Priya Nair', createdAt: '2026-05-18T10:00:00Z', updatedAt: '2026-05-18T10:00:00Z' },
    contentHash: 'SHA-256: bb4897c413b1f5e2777174e2d31f0b0938b5ef194a2b97c4129b8c5a4b3d2e1c',
    requirements: { tools: [], env: [], network: false },
    sourceUrl: 'https://github.com/supabase/pooler',
    stars: 12,
    downloads: 1800,
    downloadsDaily: [10, 12, 11, 15, 14, 13, 16, 18, 17, 19, 20, 22],
    files: [
      { name: 'SKILL.md', kind: 'markdown', sizeKb: 1.5, createdAt: '2026-05-18T10:00:00Z', updatedAt: '2026-05-18T10:00:00Z', content: '# DB Connection Pooler' }
    ],
    versions: [
      { version: '1.0.0', date: '2026-05-18T10:00:00Z', changelog: 'Initial setup.', status: 'approved', active: true }
    ],
    scan: { riskScore: 0.15, findings: [] },
    comments: [],
    rating: 4.0,
    reviewsCount: 3,
    publisherEmail: 'priya@nair.com',
    trust: { verified: true, score: 92, scannedAt: '2026-05-18T10:00:00Z', audits: [] },
    visibility: { global: true, workspaceIds: ['shared-data'] },
    status: 'approved',
    registeredAt: '2026-05-18T10:00:00Z',
    updatedAt: '2026-05-18T10:00:00Z',
    iconName: 'wrench'
  },
  {
    id: 'unsafe-command-runner',
    name: 'Unsafe Execution Skill',
    category: 'System Operations',
    description: 'Allows launching arbitrary shell commands and evaluating user scripts at runtime.',
    longDescription: 'Executes system commands directly on the host using eval and subprocess modules. Extremely dangerous if input is not sanitized.',
    whenToUse: ['For developer environments only.'],
    exampleSnippet: '```python\nrun_shell("rm -rf /tmp/cache")\n```',
    inputs: [{ name: 'command', type: 'string', description: 'Command line execution string.' }],
    outputs: [{ name: 'stdout', type: 'string', description: 'Console output capture.' }],
    frontmatter: { roles: ['super_admin'], network: true },
    identity: { slug: 'unsafe-command-runner', skillId: 'unsafe-command-runner', ownerName: 'Marcus Trent', createdAt: '2026-06-25T08:00:00Z', updatedAt: '2026-06-25T08:00:00Z' },
    contentHash: 'SHA-256: cc551f5e2777174e2d31f0b0938b5ef194a2b97c4129b8c5a4b3d2e1c9e8d7f6',
    requirements: { tools: ['bash'], env: ['PATH'], network: true },
    sourceUrl: 'https://github.com/marcus/unsafe-cmd',
    stars: 2,
    downloads: 140,
    downloadsDaily: [1, 2, 1, 1, 3, 2, 1, 2, 1, 2, 0, 1],
    files: [
      { name: 'SKILL.md', kind: 'markdown', sizeKb: 1.2, createdAt: '2026-06-25T08:00:00Z', updatedAt: '2026-06-25T08:00:00Z', content: '# Unsafe Script Runner' },
      { name: 'runner.py', kind: 'script', sizeKb: 3.4, createdAt: '2026-06-25T08:00:00Z', updatedAt: '2026-06-25T08:00:00Z', content: 'import os, subprocess, sys\ndef run_cmd(cmd):\n    # Unsafe evaluation\n    eval(cmd)\n    subprocess.run(cmd, shell=True)\n    os.system(cmd)' }
    ],
    versions: [
      { version: '1.0.0', date: '2026-06-25T08:00:00Z', changelog: 'Initial setup of commands runner.', status: 'approved', active: true }
    ],
    scan: {
      riskScore: 0.85, // score > 0.70 flags findings
      findings: [
        { rule: 'exec calls', severity: 'High', detail: 'Contains `eval` execution call in runner.py:L3' },
        { rule: 'shell/cmd files', severity: 'High', detail: 'Launches subprocess commands with `shell=True` and `os.system` in runner.py:L4-5' },
        { rule: 'credential patterns', severity: 'Low', detail: 'Checks default env for path attributes' }
      ]
    },
    comments: [
      { author: 'Jordan Blake', date: '2026-06-28T09:00:00Z', text: 'This represents a critical vulnerability if exposed. Keep disabled.', initials: 'JB' }
    ],
    rating: 2.1,
    reviewsCount: 14,
    publisherEmail: 'marcus@trent.com',
    trust: {
      verified: false,
      score: 55,
      scannedAt: '2026-06-25T08:00:00Z',
      audits: [
        { check: 'Security Scan', status: 'fail', detail: 'Found multiple critical code execute patterns.' }
      ]
    },
    visibility: { global: false, workspaceIds: [] },
    status: 'approved',
    registeredAt: '2026-06-25T08:00:00Z',
    updatedAt: '2026-06-25T08:00:00Z',
    iconName: 'wrench'
  }
];

// Seed a large audit check history log (>10-row audit list) on Unsafe Execution Skill
skills[3].comments = [
  ...skills[3].comments,
  { author: 'security-scan@registry.org', date: '2026-06-25T08:05:00Z', text: 'Scan failure: found subprocess.run with shell=True', initials: 'SS' },
  { author: 'system-agent@registry.org', date: '2026-06-25T08:10:00Z', text: 'Audit entry: flagged evaluate rules', initials: 'SA' },
  { author: 'jordan@blake.com', date: '2026-06-25T09:00:00Z', text: 'Marked as degraded in registry rules', initials: 'JB' },
  { author: 'alex@vance.com', date: '2026-06-25T10:00:00Z', text: 'Pending resolution: owner needs to rewrite script', initials: 'AV' },
  { author: 'marcus@trent.com', date: '2026-06-25T11:00:00Z', text: 'I need this tool to run clean setup diagnostics.', initials: 'MT' },
  { author: 'jordan@blake.com', date: '2026-06-25T12:00:00Z', text: 'Rejected direct override access.', initials: 'JB' },
  { author: 'system-monitor@registry.org', date: '2026-06-25T13:00:00Z', text: 'Log scanned for execution loops.', initials: 'SM' },
  { author: 'security-scan@registry.org', date: '2026-06-26T08:00:00Z', text: 'Scheduled automated scanner re-run.', initials: 'SS' },
  { author: 'system-agent@registry.org', date: '2026-06-26T09:00:00Z', text: 'No changes detected in source contents.', initials: 'SA' },
  { author: 'alex@vance.com', date: '2026-06-27T10:00:00Z', text: 'Will review alternative connection abstractions.', initials: 'AV' }
];

// ----------------------------------------------------
// 3 Prompt Entities (Flag-gated, prompts flag-disabled but built)
// ----------------------------------------------------
export const prompts: PromptEntity[] = [
  {
    id: 'explain-pr',
    name: 'PR Explainer Prompt',
    description: 'Generates a markdown summary detailing changes in code diff outputs.',
    content: 'Explain the modifications in this diff: {{diff_content}}',
    source: 'Dev Checklists',
    author: 'Alex Vance',
    argCount: 1,
    args: [{ name: 'diff_content', description: 'Raw git diff output.', required: true }],
    tags: ['git', 'code-review', 'explainer'],
    rating: 4.8,
    reviewsCount: 38,
    versions: [
      { version: '1.0.0', date: '2026-05-15T09:00:00Z', changelog: 'Initial setup.', status: 'approved', active: true, contentSnapshot: 'Explain the modifications in this diff: {{diff_content}}' }
    ],
    comments: [],
    identity: { slug: 'explain-pr', ownerName: 'Alex Vance', createdAt: '2026-05-15T09:00:00Z', updatedAt: '2026-05-15T09:00:00Z' },
    trust: { verified: true, score: 94, scannedAt: '2026-05-15T09:00:00Z', audits: [] },
    visibility: { global: true, workspaceIds: ['shared-design'] },
    status: 'approved',
    version: '1.0.0',
    registeredAt: '2026-05-15T09:00:00Z',
    updatedAt: '2026-05-15T09:00:00Z',
    iconName: 'scroll'
  },
  {
    id: 'write-sql-query',
    name: 'Natural Language SQL Builder',
    description: 'Translates natural language questions into PostgreSQL select statements.',
    content: 'Given the schema: {{schema}} - write query for: {{request}}',
    source: 'Database Library',
    author: 'Priya Nair',
    argCount: 2,
    args: [
      { name: 'schema', description: 'Table schema dump.', required: true },
      { name: 'request', description: 'Plain text query request.', required: true }
    ],
    tags: ['sql', 'database', 'postgres'],
    rating: 4.6,
    reviewsCount: 12,
    versions: [
      { version: '1.0.0', date: '2026-04-10T12:00:00Z', changelog: 'Release version.', status: 'approved', active: true, contentSnapshot: 'Given the schema: {{schema}} - write query for: {{request}}' }
    ],
    comments: [],
    identity: { slug: 'write-sql-query', ownerName: 'Priya Nair', createdAt: '2026-04-10T12:00:00Z', updatedAt: '2026-04-10T12:00:00Z' },
    trust: { verified: true, score: 90, scannedAt: '2026-04-10T12:00:00Z', audits: [] },
    visibility: { global: true, workspaceIds: ['shared-data'] },
    status: 'approved',
    version: '1.0.0',
    registeredAt: '2026-04-10T12:00:00Z',
    updatedAt: '2026-04-10T12:00:00Z',
    iconName: 'scroll'
  },
  {
    id: 'generate-changelog',
    name: 'Git Commit to Changelog Template',
    description: 'Generates user-facing changelogs from git commit history.',
    content: 'Generate changelogs from commits: {{commits}}',
    source: 'Release coordination checklist',
    author: 'Marcus Trent',
    argCount: 1,
    args: [{ name: 'commits', description: 'Commit logs.', required: true }],
    tags: ['git', 'release', 'utility'],
    rating: 4.5,
    reviewsCount: 38,
    versions: [
      { version: '1.0.0', date: '2026-06-01T10:00:00Z', changelog: 'Initial setup.', status: 'approved', active: true, contentSnapshot: 'Generate changelogs from commits: {{commits}}' }
    ],
    comments: [],
    identity: { slug: 'generate-changelog', ownerName: 'Marcus Trent', createdAt: '2026-06-01T10:00:00Z', updatedAt: '2026-06-01T10:00:00Z' },
    trust: { verified: true, score: 92, scannedAt: '2026-06-01T10:00:00Z', audits: [] },
    visibility: { global: true, workspaceIds: [] },
    status: 'approved',
    version: '1.0.0',
    registeredAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
    iconName: 'scroll'
  }
];

// ----------------------------------------------------
// DeletionRequest Queue
// Seed one pending deletion request
// ----------------------------------------------------
export const deletionRequests: DeletionRequest[] = [
  {
    id: 'del-req-1',
    assetKind: 'server',
    assetId: 'stripe-mcp',
    requestedBy: 'Alex Vance',
    requestedAt: '2026-07-12T14:00:00Z',
    reason: 'Stripe Sandbox endpoint deactivated. Replacing with updated billing API.',
    status: 'pending'
  }
];

// Mark stripe-mcp as deletionRequested in seed
mcpServers[4].deletionRequested = true;

// ----------------------------------------------------
// Change History Logs
// ----------------------------------------------------
export const initialChangeHistory: ChangeRecord[] = [
  {
    id: 'chg-1',
    timestamp: '2026-07-11T12:00:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'enable',
    targetKind: 'server',
    targetId: 'github-mcp',
    targetName: 'GitHub MCP',
    summary: 'Enabled GitHub MCP server gateway.',
    snapshot: {}
  },
  {
    id: 'chg-2',
    timestamp: '2026-07-10T14:30:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'visibility',
    targetKind: 'skill',
    targetId: 'prompt-injection-filter',
    targetName: 'Prompt Injection Filter',
    summary: 'Visibility updated to global public.',
    snapshot: { global: true, workspaceIds: ['user-guild-sec'] }
  }
];

// ----------------------------------------------------
// Platform Activities
// ----------------------------------------------------
export const platformActivity = [
  { text: 'GitHub MCP server approved by Jordan Blake', timeAgo: '2h ago', route: '/servers/github-mcp' },
  { text: 'Invoice Reconciler released version 1.2.0', timeAgo: '5h ago', route: '/agents/invoice-reconciler' },
  { text: 'Prompt Injection Filter visibility updated', timeAgo: '1d ago', route: '/skills/prompt-injection-filter' },
  { text: 'Postgres MCP database gateway scanned & approved', timeAgo: '2d ago', route: '/servers/postgres-mcp' },
  { text: 'PDF Layout Extractor version 1.0.0 released', timeAgo: '3d ago', route: '/skills/pdf-extraction' },
  { text: 'Unsafe Execution Skill flagged for evaluation rules', timeAgo: '4d ago', route: '/skills/unsafe-command-runner' },
  { text: 'Meeting Scheduler agent approved by Admin', timeAgo: '5d ago', route: '/agents/meeting-scheduler' },
  { text: 'Docker MCP updated to version 1.0.5', timeAgo: '1w ago', route: '/servers/docker-mcp' },
  { text: 'Figma MCP approved and connected to Design Systems', timeAgo: '1w ago', route: '/servers/figma-mcp' },
  { text: 'Security Shield Bot registered successfully', timeAgo: '2w ago', route: '/agents/security-bot' }
];

// ====================================================
// §25 — FIXTURES DATA ENRICHMENT
// Populate audit records, health checks, change history
// ====================================================

// -- Postgres MCP: audit records & health checks ----
mcpServers[1].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'Bearer token rotated', updatedBy: 'jordan@blake.com', remark: 'Token rotation on schedule. No anomalies found.', editedAt: '2026-06-25T12:00:00Z' },
  { healthStatus: 'Healthy', whatChanged: 'Connection pool limit raised to 200', updatedBy: 'priya@nair.com', remark: 'Increased to handle peak data pipeline loads.', editedAt: '2026-06-10T09:00:00Z' }
];
mcpServers[1].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 38 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 42 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 40 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 44 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 39 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 41 },
  { timestamp: '2026-07-06T16:30:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 43 },
  { timestamp: '2026-07-06T16:25:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 37 },
];

// -- Slack MCP: audit records & health checks -------
mcpServers[2].auditRecords = [
  { healthStatus: 'Unhealthy', whatChanged: 'OAuth2 token scope narrowed', updatedBy: 'jordan@blake.com', remark: 'Reducing scope to channels:read only until latency resolves.', editedAt: '2026-07-04T12:00:00Z' },
  { healthStatus: 'Degraded', whatChanged: 'Rate limit threshold hit', updatedBy: 'system-monitor@registry.org', remark: 'Auto-detected: 12 errors in last 60 min.', editedAt: '2026-07-03T10:00:00Z' }
];
mcpServers[2].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 392 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 380 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 415 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 210 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 198 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 441 },
  { timestamp: '2026-07-06T16:30:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 460 },
  { timestamp: '2026-07-06T16:25:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 225 },
];

// -- Filesystem MCP: health checks ------------------
mcpServers[3].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 9 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 11 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 10 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 8 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 12 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 10 },
];

// -- Figma MCP: audit records & health checks -------
mcpServers[5].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'OAuth token refreshed post design-system workspace migration', updatedBy: 'priya@nair.com', remark: 'Migrated token scope to design-variables:read.', editedAt: '2026-04-25T11:00:00Z' }
];
mcpServers[5].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 295 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 310 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 302 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 318 },
];

// -- Sentry MCP: audit records & health checks ------
mcpServers[6].auditRecords = [
  { healthStatus: 'Unhealthy', whatChanged: 'p95 latency threshold breached (>1400ms)', updatedBy: 'system-monitor@registry.org', remark: 'Automated alert: sustained high latency over 72h.', editedAt: '2026-07-05T10:00:00Z' },
  { healthStatus: 'Degraded', whatChanged: 'Error rate spike to 8.5%', updatedBy: 'jordan@blake.com', remark: 'Sentry project DSN may be rate-limited. Investigating.', editedAt: '2026-07-03T14:00:00Z' },
  { healthStatus: 'Healthy', whatChanged: 'Latency filters enabled on version 2.0.4', updatedBy: 'jordan@blake.com', remark: 'Applied per release notes.', editedAt: '2026-03-12T08:30:00Z' }
];
mcpServers[6].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 1520 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 1450 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 1610 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 1390 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 1480 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 820 },
  { timestamp: '2026-07-06T16:30:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 790 },
  { timestamp: '2026-07-06T16:25:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 1550 },
];

// -- Notion MCP: audit records & health checks ------
mcpServers[7].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'Markdown parser dependency updated', updatedBy: 'marcus@trent.com', remark: 'Resolved CVE in marked@4.0.0', editedAt: '2026-02-15T09:00:00Z' }
];
mcpServers[7].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 138 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 145 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 142 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 151 },
];

// -- Docker MCP: audit records & health checks ------
mcpServers[8].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'Socket access sandbox profile locked to project directory', updatedBy: 'jordan@blake.com', remark: 'Prevents container breakout.', editedAt: '2026-04-12T10:00:00Z' }
];
mcpServers[8].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 82 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 88 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 79 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 91 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 85 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 87 },
];

// -- Memory MCP: audit records & health checks ------
mcpServers[9].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'Graph cycle check algorithm updated', updatedBy: 'priya@nair.com', remark: 'Prevents infinite recall loops on cyclic entity graphs.', editedAt: '2026-06-01T12:00:00Z' }
];
mcpServers[9].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 14 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 15 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 13 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 16 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 14 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 15 },
];

// -- Stripe MCP: health checks ----------------------
mcpServers[4].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 842 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 820 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'unhealthy', performedBy: 'system-monitor@registry.org', responseMs: 910 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 340 },
];

// -- Invoice Reconciler: audit records & health checks
a2aAgents[0].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'Stripe API hook integration verified', updatedBy: 'jordan@blake.com', remark: 'Invoice correlation logic passed integration tests.', editedAt: '2026-06-15T11:00:00Z' },
  { healthStatus: 'Healthy', whatChanged: 'Added PDF report generation output', updatedBy: 'alex@vance.com', remark: 'Reports now export to workspace shared folder.', editedAt: '2026-06-10T09:00:00Z' }
];
a2aAgents[0].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 1380 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 1420 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 1350 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 1480 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 1395 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 1440 },
];

// -- Meeting Scheduler: audit records & health checks
a2aAgents[1].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'OAuth credential token bounds validated', updatedBy: 'jordan@blake.com', remark: 'Calendar API access limited to read+create.', editedAt: '2026-05-15T09:00:00Z' }
];
a2aAgents[1].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 405 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 418 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 412 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 422 },
];

// -- Research Analyst: audit records & health checks -
a2aAgents[2].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'Scraper robots.txt adherence validated', updatedBy: 'jordan@blake.com', remark: 'Complies with target site crawl policies.', editedAt: '2026-04-12T12:00:00Z' },
  { healthStatus: 'Healthy', whatChanged: 'Multimodal layout support added', updatedBy: 'marcus@trent.com', remark: 'Now parses image and table nodes from HTML documents.', editedAt: '2026-04-12T12:00:00Z' }
];
a2aAgents[2].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 2980 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 3100 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 3240 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 2850 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 3150 },
];

// -- Security Shield Bot: audit records & health checks
a2aAgents[3].auditRecords = [
  { healthStatus: 'Approved', whatChanged: 'Integrity constraints applied on version 1.0.0', updatedBy: 'jordan@blake.com', remark: 'Guard rail checks verified in sandbox policy.', editedAt: '2026-07-05T10:00:00Z' },
  { healthStatus: 'Healthy', whatChanged: 'API key rotation completed', updatedBy: 'alex@vance.com', remark: 'New key scoped to traffic-inspector group only.', editedAt: '2026-07-06T09:00:00Z' }
];
a2aAgents[3].healthChecks = [
  { timestamp: '2026-07-06T17:00:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 118 },
  { timestamp: '2026-07-06T16:55:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 122 },
  { timestamp: '2026-07-06T16:50:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 115 },
  { timestamp: '2026-07-06T16:45:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 119 },
  { timestamp: '2026-07-06T16:40:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 121 },
  { timestamp: '2026-07-06T16:35:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 116 },
  { timestamp: '2026-07-06T16:30:00Z', status: 'healthy', performedBy: 'system-monitor@registry.org', responseMs: 124 },
];

// -- Rich change history (extend initialChangeHistory) -
initialChangeHistory.push(
  {
    id: 'chg-3',
    timestamp: '2026-07-09T11:00:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'approve',
    targetKind: 'agent',
    targetId: 'invoice-reconciler',
    targetName: 'Invoice Reconciler',
    summary: 'Approved Invoice Reconciler agent v1.2.0.',
    snapshot: { status: 'approved' }
  },
  {
    id: 'chg-4',
    timestamp: '2026-07-08T16:30:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'disable',
    targetKind: 'server',
    targetId: 'sentry-mcp',
    targetName: 'Sentry MCP',
    summary: 'Temporarily disabled Sentry MCP due to sustained latency spike.',
    snapshot: { status: 'approved' }
  },
  {
    id: 'chg-5',
    timestamp: '2026-07-07T10:00:00Z',
    actor: 'Alex Vance',
    actorRole: 'end_user',
    action: 'register',
    targetKind: 'server',
    targetId: 'stripe-mcp',
    targetName: 'Stripe MCP',
    summary: 'Registered Stripe MCP sandbox gateway for approval.',
    snapshot: {}
  },
  {
    id: 'chg-6',
    timestamp: '2026-07-06T09:00:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'approve',
    targetKind: 'skill',
    targetId: 'unsafe-command-runner',
    targetName: 'Unsafe Execution Skill',
    summary: 'Approved for restricted developer-only workspaces despite scan findings.',
    snapshot: { status: 'approved' }
  },
  {
    id: 'chg-7',
    timestamp: '2026-07-05T14:00:00Z',
    actor: 'Alex Vance',
    actorRole: 'end_user',
    action: 'register',
    targetKind: 'agent',
    targetId: 'security-bot',
    targetName: 'Security Shield Bot',
    summary: 'Registered Security Shield Bot agent v1.0.0.',
    snapshot: {}
  },
  {
    id: 'chg-8',
    timestamp: '2026-07-04T11:30:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'visibility',
    targetKind: 'server',
    targetId: 'postgres-mcp',
    targetName: 'Postgres MCP',
    summary: 'Added Postgres MCP to Data Platform workspace.',
    snapshot: { global: true, workspaceIds: ['shared-data'] }
  },
  {
    id: 'chg-9',
    timestamp: '2026-07-03T08:00:00Z',
    actor: 'Priya Nair',
    actorRole: 'end_user',
    action: 'register',
    targetKind: 'skill',
    targetId: 'connection-pooler',
    targetName: 'Database Pool Manager',
    summary: 'Registered Database Pool Manager skill v1.0.0.',
    snapshot: {}
  },
  {
    id: 'chg-10',
    timestamp: '2026-07-01T15:00:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'enable',
    targetKind: 'agent',
    targetId: 'meeting-scheduler',
    targetName: 'Meeting Scheduler',
    summary: 'Re-enabled Meeting Scheduler after calendar API token refresh.',
    snapshot: { status: 'approved' }
  },
  {
    id: 'chg-11',
    timestamp: '2026-06-30T13:00:00Z',
    actor: 'Marcus Trent',
    actorRole: 'end_user',
    action: 'register',
    targetKind: 'prompt',
    targetId: 'generate-changelog',
    targetName: 'Git Commit to Changelog Template',
    summary: 'Registered Generate Changelog prompt v1.0.0.',
    snapshot: {}
  },
  {
    id: 'chg-12',
    timestamp: '2026-06-28T10:00:00Z',
    actor: 'Jordan Blake',
    actorRole: 'super_admin',
    action: 'reject',
    targetKind: 'skill',
    targetId: 'unsafe-command-runner',
    targetName: 'Unsafe Execution Skill',
    summary: 'Rejected initial submission due to critical security scan findings.',
    snapshot: { status: 'pending' }
  }
);

