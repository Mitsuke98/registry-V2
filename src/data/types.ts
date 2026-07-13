export type Status = 'approved' | 'pending' | 'rejected' | 'in_review';
export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown';
export type EntityKind = 'server' | 'agent' | 'skill' | 'prompt';

export interface User {
  id: string;
  name: string;
  email: string;
  initials: string;
  role: 'end_user' | 'super_admin';
  active: boolean;
  createdAt: string;
}

export interface Trust {
  verified: boolean;
  score: number; // 0-100 -> grade A/B (>=80), C (70-79), D/F (<70)
  scannedAt: string;
  audits: { check: string; status: 'pass' | 'warn' | 'fail'; detail: string }[];
}

export interface VersionPayload {
  // Can hold changes staged for approval
  [key: string]: any;
}

export interface AssetVersion {
  version: string;
  date: string;
  changelog: string; // rich text
  status: 'pending' | 'approved' | 'rejected';
  active: boolean;
  payload?: VersionPayload;
  contentSnapshot?: string; // used for prompts
}

export interface McpServer {
  id: string;
  name: string;
  description: string;
  version: string;
  license: string;
  publisher: {
    name: string;
    email: string;
    organization?: string;
    website?: string;
    supportEmail?: string;
    supportUrl?: string;
  };
  tech: {
    endpoint: string;
    gatewayUrl: string;
    authType: 'none' | 'api-key' | 'oauth2' | 'bearer' | string;
    transport: 'stdio' | 'sse' | 'http';
    protocolVersion: string;
    docsUrl?: string;
    sourceUrl?: string;
    apiKeyHeaderName?: string;
    apiKeyFormat?: string;
    oauthAuthUrl?: string;
    oauthTokenUrl?: string;
    oauthScopes?: string;
    bearerTokenEndpoint?: string;
    bearerRefreshTokenUrl?: string;
  };
  capabilities: {
    tools: boolean;
    resources: boolean;
    prompts: boolean;
  };
  tags: string[];
  ownerName: string;
  status: Status;
  registeredAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  rating: number;
  reviewsCount: number;
  health: {
    uptimePct: number;
    p95LatencyMs: number;
    errorRatePct: number;
    status: HealthStatus;
  };
  weeklyCalls: number[];
  weeklyErrors: number[];
  tools: {
    name: string;
    description: string;
    params: any;
    invocations30d: number;
    similar?: string[];
    disabled?: boolean;
  }[];
  resources: {
    name: string;
    uriPattern: string;
    mimeType: string;
    disabled?: boolean;
  }[];
  prompts: {
    name: string;
    description: string;
    argCount: number;
    disabled?: boolean;
  }[];
  auditRecords: {
    healthStatus: string;
    whatChanged: string;
    updatedBy: string; // email
    remark: string;
    editedAt: string;
  }[];
  healthChecks: {
    timestamp: string;
    status: string;
    performedBy: string; // email
    responseMs: number;
  }[];
  versions: AssetVersion[];
  iconName?: string;
  trust: Trust;
  visibility: {
    global: boolean;
    workspaceIds: string[];
  };
  deletionRequested?: boolean;
  disabled?: boolean;
}

export interface A2AAgent {
  id: string;
  name: string;
  description: string;
  version: string;
  license: string;
  publisher: {
    name: string;
    email: string;
    organization?: string;
    website?: string;
    supportEmail?: string;
    supportUrl?: string;
  };
  tech: {
    endpoint: string;
    gatewayUrl: string;
    authType: 'none' | 'api-key' | 'oauth2' | 'bearer' | string;
    transport: 'stdio' | 'sse' | 'http';
    protocolVersion: string;
    docsUrl?: string;
    sourceUrl?: string;
    apiKeyHeaderName?: string;
    apiKeyFormat?: string;
    oauthAuthUrl?: string;
    oauthTokenUrl?: string;
    oauthScopes?: string;
    bearerTokenEndpoint?: string;
    bearerRefreshTokenUrl?: string;
  };
  autonomy: 'Low' | 'Mid' | 'High';
  capabilityToggles: {
    reasoning: boolean;
    memory: boolean;
    collaboration: boolean;
    streaming: boolean;
    multimodal: boolean;
    logging: boolean;
  };
  skillRefs: {
    skillId: string;
    version: string;
  }[];
  tags: string[];
  ownerName: string;
  status: Status;
  registeredAt: string;
  updatedAt: string;
  lastUsedAt?: string;
  rating: number;
  reviewsCount: number;
  successRatePct: number;
  avgResponseMs: number;
  totalCalls30d: number;
  weeklyCalls: number[];
  weeklyErrors: number[];
  weeklySuccessRate: number[];
  auditRecords: {
    healthStatus: string;
    whatChanged: string;
    updatedBy: string; // email
    remark: string;
    editedAt: string;
  }[];
  health?: {
    status: HealthStatus;
    uptimePct?: number;
    p95LatencyMs?: number;
    errorRatePct?: number;
  };
  healthChecks: {
    timestamp: string;
    status: string;
    performedBy: string; // email
    responseMs: number;
  }[];
  versions: AssetVersion[];
  iconName?: string;
  trust: Trust;
  visibility: {
    global: boolean;
    workspaceIds: string[];
  };
  deletionRequested?: boolean;
  disabled?: boolean;
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
  frontmatter: {
    roles: string[];
    network: boolean;
    entities?: string[];
    bodyRules?: string[];
  };
  identity: {
    slug: string;
    skillId: string;
    ownerName: string;
    workspaceId?: string;
    createdAt: string;
    updatedAt: string;
  };
  contentHash: string;
  requirements: {
    tools: string[];
    env: string[];
    network: boolean;
  };
  sourceUrl: string;
  stars: number;
  downloads: number;
  downloadsDaily: number[]; // 12 values for charts
  files: {
    name: string;
    kind: string;
    sizeKb: number;
    createdAt: string;
    updatedAt: string;
    content?: string;
  }[];
  versions: AssetVersion[];
  scan: {
    riskScore: number;
    findings: { rule: string; severity: 'High' | 'Medium' | 'Low'; detail: string }[];
  };
  comments: {
    author: string;
    date: string;
    text: string;
    initials: string;
  }[];
  rating: number;
  reviewsCount: number;
  publisherEmail: string;
  trust: Trust;
  visibility: {
    global: boolean;
    workspaceIds: string[];
  };
  deletionRequested?: boolean;
  disabled?: boolean;
  status: Status;
  registeredAt: string;
  updatedAt: string;
  iconName?: string;
}

export interface PromptEntity {
  id: string;
  name: string;
  description: string;
  content: string;
  source: string; // source <= 255 chars
  author: string;
  argCount: number;
  args: { name: string; description: string; required?: boolean }[];
  tags: string[];
  rating: number;
  reviewsCount: number;
  versions: AssetVersion[];
  comments: {
    author: string;
    date: string;
    text: string;
    initials: string;
  }[];
  identity: {
    slug: string;
    ownerName: string;
    createdAt: string;
    updatedAt: string;
  };
  trust: Trust;
  visibility: {
    global: boolean;
    workspaceIds: string[];
  };
  deletionRequested?: boolean;
  disabled?: boolean;
  status: Status;
  version: string;
  registeredAt: string;
  updatedAt: string;
  iconName?: string;
}

export interface DeletionRequest {
  id: string;
  assetKind: 'server' | 'agent' | 'skill' | 'prompt';
  assetId: string;
  requestedBy: string;
  requestedAt: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  kind: 'user' | 'shared';
  ownerName: string;
  members: string[];
  createdAt: string;
}

export interface ChangeRecord {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: 'end_user' | 'super_admin';
  action: 
    | 'edit' 
    | 'delete' 
    | 'disable' 
    | 'enable' 
    | 'approve'
    | 'reject'
    | 'register'
    | 'workspace-create' 
    | 'workspace-edit' 
    | 'workspace-delete'
    | 'member-add'
    | 'member-remove'
    | 'visibility'
    | 'user-create'
    | 'user-edit'
    | 'user-status';
  targetKind: string;
  targetId: string;
  targetName: string;
  summary: string;
  snapshot: any;
}
