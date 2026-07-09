export type Status = 'approved' | 'pending' | 'rejected';
export type HealthStatus = 'healthy' | 'degraded' | 'down';
export type EntityKind = 'skill' | 'server' | 'agent' | 'prompt';

export interface Trust {
  verified: boolean;
  score: number;              // 0–100 → grade: ≥85 A/B, 70–84 C, <70 D/F
  scannedAt: string;
  audits: { check: string; status: 'pass' | 'warn' | 'fail'; detail: string }[];
}

export interface McpServer {
  id: string;
  name: string;
  description: string;
  publisher: string;
  version: string;
  transport: 'stdio' | 'sse' | 'http';
  rating: number;            // 0–5, one decimal
  reviewsCount: number;
  status: Status;
  ownerName: string;
  registeredAt: string;      // ISO date
  updatedAt: string;
  lastUsedAt?: string;       // drives "Recently used"
  health: { uptimePct: number; p95LatencyMs: number; errorRatePct: number; status: HealthStatus };
  weeklyCalls: number[];     // 12 data points for charts
  weeklyErrors: number[];
  tools: { name: string; description: string; params: any; invocations30d: number }[];
  resources: { name: string; uri: string; mimeType: string }[];
  prompts: { name: string; description: string; args: { name: string; description: string; required?: boolean }[] }[];
  skillIds: string[];
  tags: string[];
  iconName?: string;
  trust: Trust;
  capabilities?: any;
}

export interface A2AAgent {
  id: string;
  name: string;
  description: string;
  publisher: string;
  version: string;
  endpoint: string;
  rating: number;
  reviewsCount: number;
  status: Status;
  ownerName: string;
  registeredAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  successRatePct: number;
  avgResponseMs: number;
  totalCalls30d: number;
  weeklyCalls: number[];       // 12 points
  weeklyErrors: number[];
  weeklySuccessRate: number[]; // 12 points
  skillIds: string[];
  tags: string[];
  iconName?: string;
  trust: Trust;
  capabilities?: any;
}

export interface SkillEntity {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  whenToUse: string[];
  exampleSnippet: string;
  inputs: { name: string; type: string; description: string }[];
  outputs: { name: string; type: string; description: string }[];
  versions: { version: string; date: string; notes: string }[];
  files: { name: string; kind: 'markdown' | 'script' | 'config' | 'data'; sizeKb: number; updatedAt: string }[];
  sourceUrl: string;
  version: string;
  stars: number;
  downloads: number;
  status: Status;
  ownerName: string;
  registeredAt: string;
  iconName: string;
  parentId?: string;
  parentType?: 'mcp' | 'agent';
  trust: Trust;
}

export interface PromptEntity {
  id: string;
  name: string;
  description: string;
  source: string;
  author: string;
  createdAt: string;
  lastUsedAt: string;
  tags: string[];
  content: string;
  rating: number;
  reviewsCount: number;
  argCount: number;
  status: Status;
  ownerName: string;
  iconName: string;
  trust: Trust;
}

export interface WorkspaceItem {
  kind: 'server' | 'agent' | 'skill' | 'prompt';
  id: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  kind: 'personal' | 'team';
  ownerName: string;
  ownerIsCurrentUser: boolean;
  members: string[];          // display names
  items: WorkspaceItem[];
  createdAt: string;
}

export interface TransferRequest {
  id: string;
  itemKind: 'server' | 'agent' | 'skill' | 'prompt';
  itemId: string;
  fromWorkspaceId: string;
  toWorkspaceId: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'declined';
}

export interface PlatformActivityEntry {
  iconKind: 'approval' | 'version' | 'transfer';
  text: string;
  timeAgo: string;
  route: string;
}

