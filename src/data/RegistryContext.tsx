import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { 
  User, McpServer, A2AAgent, SkillEntity, PromptEntity, Workspace, DeletionRequest, ChangeRecord, Status, AssetVersion 
} from './types';
import { 
  users as initialUsers, 
  mcpServers as initialMcpServers, 
  a2aAgents as initialA2aAgents, 
  skills as initialSkills, 
  prompts as initialPrompts, 
  workspaces as initialWorkspaces, 
  deletionRequests as initialDeletionRequests, 
  initialChangeHistory, 
  preseededBookmarks 
} from './fixtures';
import { toast } from 'sonner';

export type Action = 
  | 'register' 
  | 'edit' 
  | 'delete' 
  | 'toggle-disabled' 
  | 'approve' 
  | 'crud-workspace' 
  | 'manage-members' 
  | 'revert' 
  | 'set-visibility' 
  | 'publish-version' 
  | 'request-delete'
  | 'manage-users'
  | 'toggle-capability'
  | 'run-health-check';

interface RegistryContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  usersList: User[];
  mcpServers: McpServer[];
  a2aAgents: A2AAgent[];
  skills: SkillEntity[];
  prompts: PromptEntity[];
  workspaces: Workspace[];
  bookmarks: Record<string, string[]>;
  userRatings: Record<string, number>;
  deletionRequests: DeletionRequest[];
  changeHistory: ChangeRecord[];
  
  // Basic Actions
  toggleBookmark: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  rateItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, value: number) => void;
  addComment: (kind: 'skill' | 'prompt', id: string, text: string) => void;

  // Mutators
  registerItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', details: any) => void;
  updateItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, details: any) => void;
  setItemDisabled: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, disabled: boolean) => void;
  toggleCapabilityItem: (assetId: string, itemType: 'tools' | 'resources' | 'prompts', itemName: string) => void;
  setItemVisibility: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, visibility: { global: boolean; workspaceIds: string[] }) => void;
  
  // Versioning
  publishNewVersion: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, versionStr: string, changelog: string, payload: any) => void;
  approveVersion: (kind: 'server' | 'agent' | 'skill' | 'prompt', assetId: string, versionStr: string) => void;
  rejectVersion: (kind: 'server' | 'agent' | 'skill' | 'prompt', assetId: string, versionStr: string) => void;

  // Deletions
  requestDeletion: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, reason: string) => void;
  cancelDeletionRequest: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  approveDeletionRequest: (requestId: string) => void;
  rejectDeletionRequest: (requestId: string) => void;
  deleteItemDirect: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;

  // Approvals Queue
  approveItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  rejectItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  markInReview: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;

  // Workspace CRUD
  createWorkspace: (ws: Omit<Workspace, 'id' | 'createdAt'>) => void;
  updateWorkspace: (id: string, ws: Partial<Omit<Workspace, 'id' | 'createdAt'>>) => void;
  deleteWorkspace: (id: string) => void;
  addWorkspaceMember: (wsId: string, memberName: string) => void;
  removeWorkspaceMember: (wsId: string, memberName: string) => void;

  // User Management
  createUser: (user: Omit<User, 'id' | 'createdAt' | 'active'>) => void;
  updateUser: (id: string, details: Partial<Omit<User, 'id' | 'role' | 'createdAt'>>) => void;
  setUserStatus: (id: string, active: boolean) => void;

  // Revert Engine
  can: (action: Action, subject?: any) => boolean;
  revertChange: (id: string) => void;
  getUsedBy: (skillId: string) => { servers: McpServer[]; agents: A2AAgent[] };
  getApprovals: () => { yourSubmissions: any[]; registrationQueue: any[] };
  getAttentionItems: () => any[];
  getPerformanceRanking: () => any[];
  getPlatformStatus: () => { healthy: boolean; message: string };
  getHealthDisplay: (asset: any) => 'Healthy' | 'Unhealthy' | 'Unknown';
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

export const RegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>(initialUsers);
  const [mcpServers, setMcpServers] = useState<McpServer[]>(initialMcpServers);
  const [a2aAgents, setA2aAgents] = useState<A2AAgent[]>(initialA2aAgents);
  const [skills, setSkills] = useState<SkillEntity[]>(initialSkills);
  const [prompts, setPrompts] = useState<PromptEntity[]>(initialPrompts);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>(initialDeletionRequests);
  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>(initialChangeHistory);
  
  const [bookmarks, setBookmarks] = useState<Record<string, string[]>>({
    server: preseededBookmarks.server,
    agent: preseededBookmarks.agent,
    skill: preseededBookmarks.skill,
    prompt: preseededBookmarks.prompt
  });
  
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  // ----------------------------------------------------
  // can() Role Gating Logic
  // ----------------------------------------------------
  const can = (action: Action, subject?: any): boolean => {
    if (!currentUser) return false;
    const { role, name } = currentUser;

    if (action === 'register') {
      return role === 'end_user';
    }

    if (action === 'edit' || action === 'toggle-disabled' || action === 'set-visibility' || action === 'publish-version' || action === 'request-delete' || action === 'toggle-capability' || action === 'run-health-check') {
      if (!subject) return false;
      const ownerName = subject.ownerName || subject.identity?.ownerName || subject.author;
      if (action === 'request-delete') {
        // Request Deletion is OWNER-ONLY (Super admins delete directly)
        return ownerName === name;
      }
      // Others are owner OR SA
      return role === 'super_admin' || ownerName === name;
    }

    if (action === 'delete') {
      // Direct deletion is SA only
      return role === 'super_admin';
    }

    if (action === 'approve') {
      // Approve registrations, versions, deletions
      return role === 'super_admin';
    }

    if (action === 'crud-workspace' || action === 'manage-members' || action === 'manage-users') {
      return role === 'super_admin';
    }

    if (action === 'revert') {
      // SAs can revert all changes; users can revert their own logged actions
      if (!subject) return false;
      return role === 'super_admin' || subject.actor === name;
    }

    return true; // Default browse/bookmark/rate/comment is open
  };

  // Helper to log changes to the cap-20 history
  const logChange = (
    action: ChangeRecord['action'],
    targetKind: string,
    targetId: string,
    targetName: string,
    summary: string,
    snapshot: any
  ) => {
    if (!currentUser) return;
    const record: ChangeRecord = {
      id: `chg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      actor: currentUser.name,
      actorRole: currentUser.role,
      action,
      targetKind,
      targetId,
      targetName,
      summary,
      snapshot
    };
    setChangeHistory(prev => [record, ...prev].slice(0, 20));
  };

  // ----------------------------------------------------
  // Basic Actions
  // ----------------------------------------------------
  const toggleBookmark = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    setBookmarks(prev => {
      const list = prev[kind] || [];
      const isBookmarked = list.includes(id);
      const nextList = isBookmarked ? list.filter(item => item !== id) : [...list, id];
      return { ...prev, [kind]: nextList };
    });
    toast.success('Bookmark updated.');
  };

  const rateItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, value: number) => {
    setUserRatings(prev => ({ ...prev, [`${kind}:${id}`]: value }));
    // Update the average rating on the asset
    const updateRating = (list: any[]) =>
      list.map(item => {
        if (item.id === id) {
          const originalSum = item.rating * item.reviewsCount;
          const userPrevRating = userRatings[`${kind}:${id}`] || 0;
          let newReviewsCount = item.reviewsCount;
          let newRating = item.rating;
          
          if (userPrevRating > 0) {
            // Recalculate average replacement
            newRating = (originalSum - userPrevRating + value) / item.reviewsCount;
          } else {
            newReviewsCount += 1;
            newRating = (originalSum + value) / newReviewsCount;
          }
          return { ...item, rating: Number(newRating.toFixed(1)), reviewsCount: newReviewsCount };
        }
        return item;
      });

    if (kind === 'server') setMcpServers(prev => updateRating(prev));
    else if (kind === 'agent') setA2aAgents(prev => updateRating(prev));
    else if (kind === 'skill') setSkills(prev => updateRating(prev));
    else if (kind === 'prompt') setPrompts(prev => updateRating(prev));
  };

  const addComment = (kind: 'skill' | 'prompt', id: string, text: string) => {
    if (!currentUser) return;
    const comment = {
      author: currentUser.name,
      date: new Date().toISOString(),
      text,
      initials: currentUser.initials
    };

    if (kind === 'skill') {
      setSkills(prev => prev.map(s => s.id === id ? { ...s, comments: [...(s.comments || []), comment] } : s));
    } else {
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, comments: [...(p.comments || []), comment] } : p));
    }
    toast.success('Comment added.');
  };

  // ----------------------------------------------------
  // Mutators
  // ----------------------------------------------------
  const registerItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', details: any) => {
    if (!currentUser) return;
    const commonFields = {
      id: details.id || `asset-${Date.now()}`,
      status: 'pending' as Status,
      ownerName: currentUser.name,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rating: 0,
      reviewsCount: 0,
      trust: {
        verified: false,
        score: details.scanScore || 85,
        scannedAt: new Date().toISOString(),
        audits: [
          { check: 'Sandbox Validation', status: 'pass' as 'pass' | 'warn' | 'fail', detail: 'Basic sandbox check successful.' }
        ]
      },
      visibility: details.visibility || { global: false, workspaceIds: [] }
    };

    if (kind === 'server') {
      const server: McpServer = {
        ...commonFields,
        name: details.name,
        description: details.description,
        version: details.version || '1.0.0',
        license: details.license || 'MIT',
        publisher: details.publisher || { name: currentUser.name, email: currentUser.email },
        tech: details.tech || { endpoint: '', gatewayUrl: '', authType: 'none', transport: 'stdio', protocolVersion: '1.0.0' },
        capabilities: details.capabilities || { tools: true, resources: false, prompts: false },
        tags: details.tags || [],
        health: { uptimePct: 100, p95LatencyMs: 0, errorRatePct: 0, status: 'healthy' },
        weeklyCalls: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        weeklyErrors: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        tools: details.tools || [],
        resources: details.resources || [],
        prompts: details.prompts || [],
        auditRecords: [],
        healthChecks: [],
        versions: [{ version: details.version || '1.0.0', date: new Date().toISOString(), changelog: 'Initial registration.', status: 'pending', active: true }]
      };
      setMcpServers(prev => [...prev, server]);
    } else if (kind === 'agent') {
      const agent: A2AAgent = {
        ...commonFields,
        name: details.name,
        description: details.description,
        version: details.version || '1.0.0',
        license: details.license || 'MIT',
        publisher: details.publisher || { name: currentUser.name, email: currentUser.email },
        tech: details.tech || { endpoint: '', gatewayUrl: '', authType: 'none', transport: 'stdio', protocolVersion: '1.0.0' },
        autonomy: details.autonomy || 'Low',
        capabilityToggles: details.capabilityToggles || { reasoning: false, memory: false, collaboration: false, streaming: false, multimodal: false, logging: false },
        skillRefs: details.skillRefs || [],
        tags: details.tags || [],
        successRatePct: 100,
        avgResponseMs: 0,
        totalCalls30d: 0,
        weeklyCalls: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        weeklyErrors: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        weeklySuccessRate: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        auditRecords: [],
        healthChecks: [],
        versions: [{ version: details.version || '1.0.0', date: new Date().toISOString(), changelog: 'Initial registration.', status: 'pending', active: true }]
      };
      setA2aAgents(prev => [...prev, agent]);
    } else if (kind === 'skill') {
      const skill: SkillEntity = {
        ...commonFields,
        name: details.name,
        category: details.category || 'Security',
        description: details.description,
        longDescription: details.longDescription || details.description,
        whenToUse: details.whenToUse || [],
        exampleSnippet: details.exampleSnippet || '',
        inputs: details.inputs || [],
        outputs: details.outputs || [],
        frontmatter: details.frontmatter || { roles: ['developer'], network: false },
        identity: {
          slug: details.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          skillId: commonFields.id,
          ownerName: currentUser.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        contentHash: details.contentHash || 'SHA-256: 4f18db0d38b5ef194a2b97c413b1f5e2777174e2d31f0b0938b5ef194a2',
        requirements: details.requirements || { tools: [], env: [], network: false },
        sourceUrl: details.sourceUrl || '',
        stars: 0,
        downloads: 0,
        downloadsDaily: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        files: details.files || [],
        versions: [{ version: details.version || '1.0.0', date: new Date().toISOString(), changelog: details.changelog || 'Initial upload.', status: 'pending', active: true }],
        scan: details.scan || { riskScore: 0.1, findings: [] },
        comments: [],
        publisherEmail: currentUser.email
      };
      setSkills(prev => [...prev, skill]);
    } else if (kind === 'prompt') {
      const prompt: PromptEntity = {
        ...commonFields,
        name: details.name,
        description: details.description,
        content: details.content || '',
        source: details.source || '',
        author: currentUser.name,
        argCount: details.args?.length || 0,
        args: details.args || [],
        tags: details.tags || [],
        versions: [{ version: details.version || '1.0.0', date: new Date().toISOString(), changelog: 'Initial setup.', status: 'pending', active: true, contentSnapshot: details.content || '' }],
        comments: [],
        identity: {
          slug: details.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          ownerName: currentUser.name,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        version: details.version || '1.0.0'
      };
      setPrompts(prev => [...prev, prompt]);
    }

    toast.success('Submitted registration request to Super Admin.');
  };

  const updateItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, details: any) => {
    // Shared edit dialog mutator
    const logSnapshot = (prev: any) => {
      logChange('edit', kind, id, prev.name, 'Updated configuration fields.', { ...prev });
    };

    if (kind === 'server') {
      setMcpServers(prev => prev.map(s => {
        if (s.id === id) {
          logSnapshot(s);
          return { ...s, ...details, updatedAt: new Date().toISOString() };
        }
        return s;
      }));
    } else if (kind === 'agent') {
      setA2aAgents(prev => prev.map(a => {
        if (a.id === id) {
          logSnapshot(a);
          return { ...a, ...details, updatedAt: new Date().toISOString() };
        }
        return a;
      }));
    } else if (kind === 'skill') {
      setSkills(prev => prev.map(s => {
        if (s.id === id) {
          logSnapshot(s);
          return { ...s, ...details, updatedAt: new Date().toISOString() };
        }
        return s;
      }));
    } else if (kind === 'prompt') {
      setPrompts(prev => prev.map(p => {
        if (p.id === id) {
          logSnapshot(p);
          return { ...p, ...details, updatedAt: new Date().toISOString() };
        }
        return p;
      }));
    }
    toast.success('Configuration updated.');
  };

  const setItemDisabled = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, disabled: boolean) => {
    const action = disabled ? 'disable' : 'enable';
    const logSnapshot = (prev: any) => {
      logChange(action, kind, id, prev.name, `${disabled ? 'Disabled' : 'Enabled'} asset gateway access.`, { ...prev });
    };

    const updateMap = (list: any[]) =>
      list.map(item => {
        if (item.id === id) {
          logSnapshot(item);
          return { ...item, disabled };
        }
        return item;
      });

    if (kind === 'server') setMcpServers(prev => updateMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => updateMap(prev));
    else if (kind === 'skill') setSkills(prev => updateMap(prev));
    else if (kind === 'prompt') setPrompts(prev => updateMap(prev));

    toast.success(`Asset ${disabled ? 'disabled' : 'enabled'}.`);
  };

  const toggleCapabilityItem = (assetId: string, itemType: 'tools' | 'resources' | 'prompts', itemName: string) => {
    const server = mcpServers.find(s => s.id === assetId);
    if (!server) return;

    if (!can('toggle-capability', server)) {
      toast.error("Unauthorized to toggle capabilities.");
      return;
    }

    const items = server[itemType] as any[];
    const itemIndex = items.findIndex(item => item.name === itemName);
    if (itemIndex === -1) return;

    const currentItem = items[itemIndex];
    const prevDisabled = !!currentItem.disabled;
    const nextDisabled = !prevDisabled;

    const snapshot = JSON.parse(JSON.stringify(server));

    const updatedItems = items.map(item => 
      item.name === itemName ? { ...item, disabled: nextDisabled } : item
    );

    setMcpServers(prev => prev.map(s => {
      if (s.id === assetId) {
        return {
          ...s,
          [itemType]: updatedItems,
          updatedAt: new Date().toISOString()
        };
      }
      return s;
    }));

    const timeLimit = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const existingIdx = changeHistory.findIndex(r => 
      r.targetId === assetId && 
      r.actor === currentUser?.name &&
      r.action === 'edit' &&
      r.timestamp >= timeLimit &&
      r.summary.startsWith('Capability toggles')
    );

    if (existingIdx !== -1) {
      setChangeHistory(prev => prev.map((r, idx) => {
        if (idx === existingIdx) {
          const currentSummary = r.summary;
          const updatedSummary = currentSummary + ` | ${itemName} (${prevDisabled ? 'Off → On' : 'On → Off'})`;
          return {
            ...r,
            summary: updatedSummary,
            timestamp: new Date().toISOString()
          };
        }
        return r;
      }));
    } else {
      logChange(
        'edit',
        'server',
        assetId,
        server.name,
        `Capability toggles: ${itemName} (${prevDisabled ? 'Off → On' : 'On → Off'})`,
        snapshot
      );
    }

    toast.success(`Item "${itemName}" is now ${nextDisabled ? 'Off' : 'On'}.`, {
      action: {
        label: 'Undo',
        onClick: () => {
          toggleCapabilityItem(assetId, itemType, itemName);
        }
      }
    });
  };

  const setItemVisibility = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, visibility: { global: boolean; workspaceIds: string[] }) => {
    const logSnapshot = (prev: any) => {
      logChange('visibility', kind, id, prev.name, `Updated visibility state to ${visibility.global ? 'Public' : 'Workspace scope'}.`, { ...prev });
    };

    const updateMap = (list: any[]) =>
      list.map(item => {
        if (item.id === id) {
          logSnapshot(item);
          return { ...item, visibility };
        }
        return item;
      });

    if (kind === 'server') setMcpServers(prev => updateMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => updateMap(prev));
    else if (kind === 'skill') setSkills(prev => updateMap(prev));
    else if (kind === 'prompt') setPrompts(prev => updateMap(prev));

    toast.success('Visibility controls updated.');
  };

  // ----------------------------------------------------
  // Versioning
  // ----------------------------------------------------
  const publishNewVersion = (
    kind: 'server' | 'agent' | 'skill' | 'prompt',
    id: string,
    versionStr: string,
    changelog: string,
    payload: any
  ) => {
    const newVersion: AssetVersion = {
      version: versionStr,
      date: new Date().toISOString(),
      changelog,
      status: 'pending',
      active: false,
      payload
    };

    const updateMap = (list: any[]) =>
      list.map(item => {
        if (item.id === id) {
          // Verify if exact pending version exists, avoid duplicates
          const filterVersions = item.versions.filter((v: any) => v.version !== versionStr);
          return { ...item, versions: [newVersion, ...filterVersions] };
        }
        return item;
      });

    if (kind === 'server') setMcpServers(prev => updateMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => updateMap(prev));
    else if (kind === 'skill') setSkills(prev => updateMap(prev));
    else if (kind === 'prompt') setPrompts(prev => updateMap(prev));

    toast.success(`Published new version v${versionStr} proposal. Awaiting SA approval.`);
  };

  const approveVersion = (kind: 'server' | 'agent' | 'skill' | 'prompt', assetId: string, versionStr: string) => {
    const updateMap = (list: any[]) =>
      list.map(item => {
        if (item.id === assetId) {
          let mergedFields = {};
          const nextVersions = item.versions.map((v: any) => {
            if (v.version === versionStr) {
              mergedFields = v.payload || {};
              return { ...v, status: 'approved', active: true };
            }
            if (v.active) {
              return { ...v, active: false };
            }
            return v;
          });
          
          return {
            ...item,
            ...mergedFields,
            version: versionStr,
            versions: nextVersions,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });

    if (kind === 'server') setMcpServers(prev => updateMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => updateMap(prev));
    else if (kind === 'skill') setSkills(prev => updateMap(prev));
    else if (kind === 'prompt') setPrompts(prev => updateMap(prev));

    toast.success(`Staged Version v${versionStr} approved and live.`);
  };

  const rejectVersion = (kind: 'server' | 'agent' | 'skill' | 'prompt', assetId: string, versionStr: string) => {
    const updateMap = (list: any[]) =>
      list.map(item => {
        if (item.id === assetId) {
          const nextVersions = item.versions.map((v: any) => {
            if (v.version === versionStr) {
              return { ...v, status: 'rejected' };
            }
            return v;
          });
          return { ...item, versions: nextVersions };
        }
        return item;
      });

    if (kind === 'server') setMcpServers(prev => updateMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => updateMap(prev));
    else if (kind === 'skill') setSkills(prev => updateMap(prev));
    else if (kind === 'prompt') setPrompts(prev => updateMap(prev));

    toast.success(`Staged Version v${versionStr} request declined.`);
  };

  // ----------------------------------------------------
  // Deletions
  // ----------------------------------------------------
  const requestDeletion = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, reason: string) => {
    if (!currentUser) return;
    const req: DeletionRequest = {
      id: `del-${Date.now()}`,
      assetKind: kind,
      assetId: id,
      requestedBy: currentUser.name,
      requestedAt: new Date().toISOString(),
      reason,
      status: 'pending'
    };

    setDeletionRequests(prev => [...prev, req]);

    // Badge asset
    const setBadge = (list: any[]) => list.map(item => item.id === id ? { ...item, deletionRequested: true } : item);
    if (kind === 'server') setMcpServers(prev => setBadge(prev));
    else if (kind === 'agent') setA2aAgents(prev => setBadge(prev));
    else if (kind === 'skill') setSkills(prev => setBadge(prev));
    else if (kind === 'prompt') setPrompts(prev => setBadge(prev));

    toast.success('Deletion request submitted to Super Admin.');
  };

  const cancelDeletionRequest = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    setDeletionRequests(prev => prev.filter(r => !(r.assetId === id && r.assetKind === kind)));
    
    // Clear badge
    const clearBadge = (list: any[]) => list.map(item => item.id === id ? { ...item, deletionRequested: false } : item);
    if (kind === 'server') setMcpServers(prev => clearBadge(prev));
    else if (kind === 'agent') setA2aAgents(prev => clearBadge(prev));
    else if (kind === 'skill') setSkills(prev => clearBadge(prev));
    else if (kind === 'prompt') setPrompts(prev => clearBadge(prev));

    toast.success('Deletion request cancelled.');
  };

  const approveDeletionRequest = (requestId: string) => {
    const req = deletionRequests.find(r => r.id === requestId);
    if (!req) return;

    // Delete item directly
    deleteItemDirect(req.assetKind, req.assetId);

    // Update request status
    setDeletionRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
    toast.success('Asset deleted successfully.');
  };

  const rejectDeletionRequest = (requestId: string) => {
    const req = deletionRequests.find(r => r.id === requestId);
    if (!req) return;

    // Clear badge
    const clearBadge = (list: any[]) => list.map(item => item.id === req.assetId ? { ...item, deletionRequested: false } : item);
    if (req.assetKind === 'server') setMcpServers(prev => clearBadge(prev));
    else if (req.assetKind === 'agent') setA2aAgents(prev => clearBadge(prev));
    else if (req.assetKind === 'skill') setSkills(prev => clearBadge(prev));
    else if (req.assetKind === 'prompt') setPrompts(prev => clearBadge(prev));

    // Update request status
    setDeletionRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
    toast.success('Deletion request rejected.');
  };

  const deleteItemDirect = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    let deletedItem: any = null;

    if (kind === 'server') {
      const target = mcpServers.find(s => s.id === id);
      if (target) {
        deletedItem = { ...target };
        setMcpServers(prev => prev.filter(s => s.id !== id));
      }
    } else if (kind === 'agent') {
      const target = a2aAgents.find(a => a.id === id);
      if (target) {
        deletedItem = { ...target };
        setA2aAgents(prev => prev.filter(a => a.id !== id));
      }
    } else if (kind === 'skill') {
      const target = skills.find(s => s.id === id);
      if (target) {
        deletedItem = { ...target };
        setSkills(prev => prev.filter(s => s.id !== id));
      }
    } else if (kind === 'prompt') {
      const target = prompts.find(p => p.id === id);
      if (target) {
        deletedItem = { ...target };
        setPrompts(prev => prev.filter(p => p.id !== id));
      }
    }

    if (deletedItem) {
      logChange('delete', kind, id, deletedItem.name, `Deleted ${kind} asset gateway.`, deletedItem);
      
      // Clean visible workspaces visibility settings
      setWorkspaces(prev =>
        prev.map(ws => {
          // Personal/Shared mappings logic
          return ws;
        })
      );
    }
  };

  // ----------------------------------------------------
  // Approvals Queue
  // ----------------------------------------------------
  const approveItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    const approveMap = (list: any[]) =>
      list.map(item => item.id === id ? { ...item, status: 'approved' as Status } : item);

    if (kind === 'server') setMcpServers(prev => approveMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => approveMap(prev));
    else if (kind === 'skill') setSkills(prev => approveMap(prev));
    else if (kind === 'prompt') setPrompts(prev => approveMap(prev));

    toast.success('Asset registration approved.');
  };

  const rejectItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    const rejectMap = (list: any[]) =>
      list.map(item => item.id === id ? { ...item, status: 'rejected' as Status } : item);

    if (kind === 'server') setMcpServers(prev => rejectMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => rejectMap(prev));
    else if (kind === 'skill') setSkills(prev => rejectMap(prev));
    else if (kind === 'prompt') setPrompts(prev => rejectMap(prev));

    toast.success('Asset registration rejected.');
  };

  const markInReview = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    const reviewMap = (list: any[]) =>
      list.map(item => item.id === id ? { ...item, status: 'in_review' as Status } : item);

    if (kind === 'server') setMcpServers(prev => reviewMap(prev));
    else if (kind === 'agent') setA2aAgents(prev => reviewMap(prev));
    else if (kind === 'skill') setSkills(prev => reviewMap(prev));
    else if (kind === 'prompt') setPrompts(prev => reviewMap(prev));

    toast.success('Asset status updated to In Review.');
  };

  // ----------------------------------------------------
  // Workspace CRUD (SA-only)
  // ----------------------------------------------------
  const createWorkspace = (ws: Omit<Workspace, 'id' | 'createdAt'>) => {
    const id = `ws-${Date.now()}`;
    const newWs: Workspace = {
      ...ws,
      id,
      createdAt: new Date().toISOString()
    };
    setWorkspaces(prev => [...prev, newWs]);
    logChange('workspace-create', 'workspace', id, ws.name, `Created workspace ${ws.name}.`, id);
    toast.success('Workspace created.');
  };

  const updateWorkspace = (id: string, wsDetails: Partial<Omit<Workspace, 'id' | 'createdAt'>>) => {
    setWorkspaces(prev =>
      prev.map(ws => {
        if (ws.id === id) {
          logChange('workspace-edit', 'workspace', id, ws.name, `Updated workspace configuration.`, { ...ws });
          return { ...ws, ...wsDetails };
        }
        return ws;
      })
    );
    toast.success('Workspace settings updated.');
  };

  const deleteWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;

    // Delete workspace
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    logChange('workspace-delete', 'workspace', id, ws.name, `Deleted workspace ${ws.name}.`, ws);

    // Clean workspace IDs on assets visibility lists
    const cleanVisibility = (list: any[]) =>
      list.map(item => {
        if (item.visibility?.workspaceIds.includes(id)) {
          const nextWsIds = item.visibility.workspaceIds.filter((wId: string) => wId !== id);
          return { ...item, visibility: { ...item.visibility, workspaceIds: nextWsIds } };
        }
        return item;
      });

    setMcpServers(prev => cleanVisibility(prev));
    setA2aAgents(prev => cleanVisibility(prev));
    setSkills(prev => cleanVisibility(prev));
    setPrompts(prev => cleanVisibility(prev));

    toast.success('Workspace deleted.');
  };

  const addWorkspaceMember = (wsId: string, memberName: string) => {
    setWorkspaces(prev =>
      prev.map(ws => {
        if (ws.id === wsId && !ws.members.includes(memberName)) {
          logChange('member-add', 'workspace', wsId, ws.name, `Added member ${memberName} to workspace.`, { ...ws });
          return { ...ws, members: [...ws.members, memberName] };
        }
        return ws;
      })
    );
    toast.success(`Added ${memberName} to workspace.`);
  };

  const removeWorkspaceMember = (wsId: string, memberName: string) => {
    setWorkspaces(prev =>
      prev.map(ws => {
        if (ws.id === wsId) {
          logChange('member-remove', 'workspace', wsId, ws.name, `Removed member ${memberName} from workspace.`, { ...ws });
          return { ...ws, members: ws.members.filter(m => m !== memberName) };
        }
        return ws;
      })
    );
    toast.success(`Removed ${memberName} from workspace.`);
  };

  // ----------------------------------------------------
  // User Management (SA-only)
  // ----------------------------------------------------
  const createUser = (details: Omit<User, 'id' | 'createdAt' | 'active'>) => {
    const id = `user-${Date.now()}`;
    const newUser: User = {
      ...details,
      id,
      active: true,
      createdAt: new Date().toISOString()
    };
    setUsersList(prev => [...prev, newUser]);
    logChange('user-create', 'user', id, details.name, `Created user account for ${details.name}.`, id);
    toast.success(`User ${details.name} created successfully.`);
  };

  const updateUser = (id: string, details: Partial<Omit<User, 'id' | 'role' | 'createdAt'>>) => {
    setUsersList(prev =>
      prev.map(u => {
        if (u.id === id) {
          logChange('user-edit', 'user', id, u.name, `Updated user profile details.`, { ...u });
          return { ...u, ...details };
        }
        return u;
      })
    );
    toast.success('User profile updated.');
  };

  const setUserStatus = (id: string, active: boolean) => {
    setUsersList(prev =>
      prev.map(u => {
        if (u.id === id) {
          logChange('user-status', 'user', id, u.name, `Changed user status to ${active ? 'Active' : 'Deactivated'}.`, { ...u });
          return { ...u, active };
        }
        return u;
      })
    );
    toast.success(`User status updated to ${active ? 'Active' : 'Deactivated'}.`);
  };

  // ----------------------------------------------------
  // Helper Selectors
  // ----------------------------------------------------
  const getUsedBy = (skillId: string) => {
    const servers = mcpServers.filter(s => s.tags?.includes(skillId) || s.description?.toLowerCase().includes(skillId));
    const agents = a2aAgents.filter(a => a.skillRefs?.some(ref => ref.skillId === skillId));
    return { servers, agents };
  };

  const getApprovals = () => {
    const yourSubmissions: any[] = [];
    const registrationQueue: any[] = [];

    const processList = (list: any[], kind: 'server' | 'agent' | 'skill' | 'prompt') => {
      list.forEach(item => {
        if (item.status === 'pending' || item.status === 'in_review') {
          const regObj = {
            id: item.id,
            name: item.name,
            kind,
            type: 'registration',
            status: item.status,
            date: item.registeredAt || new Date().toISOString(),
            ownerName: item.ownerName,
            description: item.description,
            details: item
          };
          registrationQueue.push(regObj);
          if (currentUser && item.ownerName === currentUser.name) {
            yourSubmissions.push(regObj);
          }
        }

        if (item.versions) {
          item.versions.forEach((v: any) => {
            if (v.status === 'pending') {
              const verObj = {
                id: `${item.id}-ver-${v.version}`,
                assetId: item.id,
                name: item.name,
                kind,
                type: 'version',
                status: 'pending',
                date: v.date,
                ownerName: item.ownerName,
                description: `Version bump to v${v.version}`,
                versionStr: v.version,
                changelog: v.changelog,
                payload: v.payload,
                details: item
              };
              registrationQueue.push(verObj);
              if (currentUser && item.ownerName === currentUser.name) {
                yourSubmissions.push(verObj);
              }
            }
          });
        }
      });
    };

    processList(mcpServers, 'server');
    processList(a2aAgents, 'agent');
    processList(skills, 'skill');
    processList(prompts, 'prompt');

    deletionRequests.forEach(req => {
      if (req.status === 'pending') {
        const asset = [...mcpServers, ...a2aAgents, ...skills, ...prompts].find(i => i.id === req.assetId);
        const delObj = {
          id: req.id,
          assetId: req.assetId,
          name: asset?.name || req.assetId,
          kind: req.assetKind,
          type: 'deletion',
          status: 'pending',
          date: req.requestedAt,
          ownerName: (asset ? ((asset as any).ownerName || (asset as any).identity?.ownerName || (asset as any).author) : null) || req.requestedBy,
          description: `Deletion Request: ${req.reason || 'No reason provided.'}`,
          reason: req.reason,
          details: asset
        };
        registrationQueue.push(delObj);
        if (currentUser && req.requestedBy === currentUser.name) {
          yourSubmissions.push(delObj);
        }
      }
    });

    return { yourSubmissions, registrationQueue };
  };

  const getAttentionItems = () => {
    const items: any[] = [];
    mcpServers.forEach(s => {
      if (s.health?.status === 'unhealthy') {
        if (!currentUser || currentUser.role === 'super_admin' || s.ownerName === currentUser.name) {
          items.push({
            id: `health-${s.id}`,
            type: 'health',
            title: `${s.name} is unhealthy`,
            description: `Uptime: ${s.health.uptimePct}%, latency: ${s.health.p95LatencyMs}ms`,
            severity: 'high',
            route: `/servers/${s.id}`
          });
        }
      }
    });

    skills.forEach(s => {
      if (s.scan?.riskScore > 0.7) {
        if (!currentUser || currentUser.role === 'super_admin' || (s.identity?.ownerName || 'Community') === currentUser.name) {
          items.push({
            id: `risk-${s.id}`,
            type: 'risk',
            title: `${s.name} high risk score`,
            description: `Score: ${s.scan.riskScore}. Found ${s.scan.findings?.length} security warnings.`,
            severity: 'high',
            route: `/skills/${s.id}`
          });
        }
      }
    });

    if (currentUser?.role === 'super_admin') {
      const { registrationQueue } = getApprovals();
      if (registrationQueue.length > 0) {
        items.push({
          id: 'pending-queue-alert',
          type: 'approval',
          title: `${registrationQueue.length} approvals pending`,
          description: 'Awaiting registration or deletion audit approvals.',
          severity: 'medium',
          route: '/approvals'
        });
      }
    }
    return items;
  };

  const getPerformanceRanking = () => {
    const list: any[] = [];
    mcpServers.forEach(s => {
      list.push({ id: s.id, name: s.name, kind: 'server', calls: s.weeklyCalls ? s.weeklyCalls.reduce((a,b)=>a+b,0) : 1500, score: s.trust.score });
    });
    a2aAgents.forEach(a => {
      list.push({ id: a.id, name: a.name, kind: 'agent', calls: a.weeklyCalls ? a.weeklyCalls.reduce((a,b)=>a+b,0) : 800, score: a.trust.score });
    });
    skills.forEach(s => {
      list.push({ id: s.id, name: s.name, kind: 'skill', calls: s.downloads || 400, score: s.trust.score });
    });
    return list.sort((a, b) => b.calls - a.calls);
  };

  // Unified 3-state status helper for all asset kinds. Servers/agents report
  // live `health.status`; skills/prompts have no health field so their status
  // is derived from the scan/trust findings instead — same Healthy/Unhealthy/
  // Unknown vocabulary either way, computed through this single function.
  const getHealthDisplay = (asset: any): 'Healthy' | 'Unhealthy' | 'Unknown' => {
    if (!asset) return 'Unknown';

    if (asset.health && asset.health.status) {
      const status = asset.health.status.toLowerCase();
      if (status === 'healthy') return 'Healthy';
      if (status === 'degraded' || status === 'down' || status === 'unhealthy') return 'Unhealthy';
      return 'Unknown';
    }

    if (asset.scan) {
      if (asset.scan.riskScore >= 0.70 || (asset.scan.findings && asset.scan.findings.length > 0)) {
        return 'Unhealthy';
      }
      return 'Healthy';
    }

    if (asset.trust) {
      if (asset.trust.score < 70) return 'Unhealthy';
      if (asset.trust.audits && asset.trust.audits.some((a: any) => a.status === 'fail')) {
        return 'Unhealthy';
      }
      return 'Healthy';
    }

    return 'Unknown';
  };

  const getPlatformStatus = () => {
    const unhealthyCount = mcpServers.filter(s => getHealthDisplay(s) === 'Unhealthy').length +
                           a2aAgents.filter(a => a.successRatePct < 85).length +
                           skills.filter(sk => getHealthDisplay(sk) === 'Unhealthy').length;
    const pendingCount = getApprovals().registrationQueue.length;
    if (unhealthyCount > 0) {
      return { healthy: false, message: `${unhealthyCount} items need attention · ${pendingCount} approvals pending` };
    }
    return { healthy: true, message: `All systems healthy · ${pendingCount} approvals pending` };
  };

  // ----------------------------------------------------
  // Undo Snapshot Revert Mechanism
  // ----------------------------------------------------
  const revertChange = (recordId: string) => {
    const record = changeHistory.find(r => r.id === recordId);
    if (!record) return;

    const { action, targetKind, targetId, snapshot } = record;

    if (action === 'delete') {
      // Revert delete by inserting asset back
      if (targetKind === 'server') setMcpServers(prev => [...prev, snapshot]);
      else if (targetKind === 'agent') setA2aAgents(prev => [...prev, snapshot]);
      else if (targetKind === 'skill') setSkills(prev => [...prev, snapshot]);
      else if (targetKind === 'prompt') setPrompts(prev => [...prev, snapshot]);
    } else if (action === 'edit' || action === 'visibility' || action === 'disable' || action === 'enable') {
      // Revert modification by applying previous snapshot fields
      const restoreItem = (list: any[]) => list.map(item => item.id === targetId ? { ...snapshot } : item);
      
      if (targetKind === 'server') setMcpServers(prev => restoreItem(prev));
      else if (targetKind === 'agent') setA2aAgents(prev => restoreItem(prev));
      else if (targetKind === 'skill') setSkills(prev => restoreItem(prev));
      else if (targetKind === 'prompt') setPrompts(prev => restoreItem(prev));
    } else if (action === 'workspace-create') {
      // Delete created workspace
      setWorkspaces(prev => prev.filter(w => w.id !== targetId));
    } else if (action === 'workspace-delete') {
      // Put workspace back
      setWorkspaces(prev => [...prev, snapshot]);
    } else if (action === 'workspace-edit' || action === 'member-add' || action === 'member-remove') {
      // Put workspace configuration back
      setWorkspaces(prev => prev.map(w => w.id === targetId ? { ...snapshot } : w));
    } else if (action === 'user-create') {
      // Delete created user
      setUsersList(prev => prev.filter(u => u.id !== targetId));
    } else if (action === 'user-edit' || action === 'user-status') {
      // Restore user details
      setUsersList(prev => prev.map(u => u.id === targetId ? { ...snapshot } : u));
    }

    // Remove record from history log
    setChangeHistory(prev => prev.filter(r => r.id !== recordId));
    toast.success(`Reverted change: ${record.summary}`);
  };

  return (
    <RegistryContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        usersList,
        mcpServers,
        a2aAgents,
        skills,
        prompts,
        workspaces,
        bookmarks,
        userRatings,
        deletionRequests,
        changeHistory,

        toggleBookmark,
        rateItem,
        addComment,

        registerItem,
        updateItem,
        setItemDisabled,
        setItemVisibility,

        publishNewVersion,
        approveVersion,
        rejectVersion,

        requestDeletion,
        cancelDeletionRequest,
        approveDeletionRequest,
        rejectDeletionRequest,
        deleteItemDirect,

        approveItem,
        rejectItem,
        markInReview,

        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        addWorkspaceMember,
        removeWorkspaceMember,

        createUser,
        updateUser,
        setUserStatus,

        can,
        revertChange,
        getUsedBy,
        getApprovals,
        getAttentionItems,
        getPerformanceRanking,
        getPlatformStatus,
        getHealthDisplay,
        toggleCapabilityItem
      }}
    >
      {children}
    </RegistryContext.Provider>
  );
};

export const useRegistry = () => {
  const context = useContext(RegistryContext);
  if (context === undefined) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
};
