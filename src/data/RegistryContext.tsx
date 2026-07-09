import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { McpServer, A2AAgent, SkillEntity, PromptEntity, Workspace, TransferRequest } from './types';
import {
  mcpServers as initialMcpServers,
  a2aAgents as initialA2aAgents,
  skills as initialSkills,
  prompts as initialPrompts,
  workspaces as initialWorkspaces,
  transferRequests as initialTransferRequests,
  preseededBookmarks
} from './fixtures';

export interface UserSession {
  name: string;
  initials: string;
  role: 'end_user' | 'super_admin';
}

interface RegistryContextType {
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  mcpServers: McpServer[];
  a2aAgents: A2AAgent[];
  skills: SkillEntity[];
  prompts: PromptEntity[];
  workspaces: Workspace[];
  transferRequests: TransferRequest[];
  bookmarks: Record<string, string[]>;
  userRatings: Record<string, number>;
  toggleBookmark: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  rateItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, value: number) => void;
  requestTransfer: (itemId: string, itemKind: 'server' | 'agent' | 'skill' | 'prompt', fromWorkspaceId: string, toWorkspaceId: string) => void;
  resolveTransfer: (requestId: string, status: 'approved' | 'declined') => void;
  registerItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', details: any) => void;
  approveItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  declineItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  getUsedBy: (skillId: string) => { servers: McpServer[]; agents: A2AAgent[] };
  getApprovals: () => { waitingOnYou: TransferRequest[]; yourSubmissions: any[]; registrationQueue: any[] };
  getAttentionItems: () => any[];
  getPerformanceRanking: () => any[];
  getPlatformStatus: () => { healthy: boolean; message: string };
  toggleServerHealth: (id: string) => void;
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

export const RegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [servers, setServers] = useState<McpServer[]>(initialMcpServers);
  const [agents, setAgents] = useState<A2AAgent[]>(initialA2aAgents);
  const [skillsList, setSkillsList] = useState<SkillEntity[]>(initialSkills);
  const [promptsList, setPromptsList] = useState<PromptEntity[]>(initialPrompts);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>(initialTransferRequests);
  const [bookmarks, setBookmarks] = useState<Record<string, string[]>>({
    server: preseededBookmarks.server,
    agent: preseededBookmarks.agent,
    skill: preseededBookmarks.skill,
    prompt: preseededBookmarks.prompt
  });
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});

  // Derive ownedByUser and ownerIsCurrentUser dynamically based on currentUser
  const derivedServers = servers.map(s => ({
    ...s,
    ownedByUser: currentUser ? s.ownerName === currentUser.name : false
  }));

  const derivedAgents = agents.map(a => ({
    ...a,
    ownedByUser: currentUser ? a.ownerName === currentUser.name : false
  }));

  const derivedSkills = skillsList.map(sk => ({
    ...sk,
    ownedByUser: currentUser ? sk.ownerName === currentUser.name : false
  }));

  const derivedPrompts = promptsList.map(p => ({
    ...p,
    ownedByUser: currentUser ? p.ownerName === currentUser.name : false
  }));

  const derivedWorkspaces = workspaces.map(ws => ({
    ...ws,
    ownerIsCurrentUser: currentUser ? ws.ownerName === currentUser.name : false
  }));

  const toggleBookmark = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    setBookmarks(prev => {
      const list = prev[kind] || [];
      const updated = list.includes(id) ? list.filter(item => item !== id) : [...list, id];
      return { ...prev, [kind]: updated };
    });
  };

  const rateItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, value: number) => {
    setUserRatings(prev => ({
      ...prev,
      [`${kind}:${id}`]: value
    }));
  };

  const requestTransfer = (itemId: string, itemKind: 'server' | 'agent' | 'skill' | 'prompt', fromWorkspaceId: string, toWorkspaceId: string) => {
    if (!currentUser) return;
    const newReq: TransferRequest = {
      id: `req-${Date.now()}`,
      itemId,
      itemKind,
      fromWorkspaceId,
      toWorkspaceId,
      requestedBy: currentUser.name,
      requestedAt: new Date().toISOString(),
      status: 'pending'
    };
    setTransferRequests(prev => [...prev, newReq]);
  };

  const resolveTransfer = (requestId: string, status: 'approved' | 'declined') => {
    setTransferRequests(prev => prev.map(req => req.id === requestId ? { ...req, status } : req));
    const req = transferRequests.find(r => r.id === requestId);
    if (status === 'approved' && req) {
      setWorkspaces(prev => prev.map(ws => {
        if (ws.id === req.toWorkspaceId) {
          const alreadyExists = ws.items.some(item => item.id === req.itemId && item.kind === req.itemKind);
          if (!alreadyExists) {
            return {
              ...ws,
              items: [...ws.items, { kind: req.itemKind, id: req.itemId }]
            };
          }
        }
        return ws;
      }));
    }
  };

  const approveItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    if (kind === 'server') {
      setServers(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    } else if (kind === 'agent') {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'approved' } : a));
    } else if (kind === 'skill') {
      setSkillsList(prev => prev.map(sk => sk.id === id ? { ...sk, status: 'approved' } : sk));
    } else if (kind === 'prompt') {
      setPromptsList(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    }
  };

  const declineItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    if (kind === 'server') {
      setServers(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
    } else if (kind === 'agent') {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
    } else if (kind === 'skill') {
      setSkillsList(prev => prev.map(sk => sk.id === id ? { ...sk, status: 'rejected' } : sk));
    } else if (kind === 'prompt') {
      setPromptsList(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    }
  };

  const registerItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', details: any) => {
    if (!currentUser) return;
    const id = details.id || `${kind}-${Date.now()}`;
    const isoDate = new Date().toISOString();

    const trustBlock = details.trust || {
      verified: details.verified ?? false,
      score: details.score ?? 90,
      scannedAt: isoDate,
      audits: details.audits ?? [
        { check: 'Static analysis check', status: 'pass' as const, detail: 'Clean code & interface matches.' }
      ]
    };

    if (kind === 'server') {
      const newServer: McpServer = {
        id,
        name: details.name,
        description: details.description || '',
        publisher: currentUser.name,
        version: details.version || '1.0.0',
        transport: details.transport || 'stdio',
        rating: 0.0,
        reviewsCount: 0,
        status: 'pending',
        ownerName: currentUser.name,
        registeredAt: isoDate,
        updatedAt: isoDate,
        health: { uptimePct: 100, p95LatencyMs: 200, errorRatePct: 0.0, status: 'healthy' },
        weeklyCalls: Array(12).fill(0),
        weeklyErrors: Array(12).fill(0),
        tools: details.tools || [],
        resources: details.resources || [],
        prompts: details.prompts || [],
        skillIds: [],
        tags: details.tags || [],
        trust: trustBlock
      };
      setServers(prev => [...prev, newServer]);
    } else if (kind === 'agent') {
      const newAgent: A2AAgent = {
        id,
        name: details.name,
        description: details.description || '',
        publisher: currentUser.name,
        version: details.version || '1.0.0',
        endpoint: details.endpoint || '',
        rating: 0.0,
        reviewsCount: 0,
        status: 'pending',
        ownerName: currentUser.name,
        registeredAt: isoDate,
        updatedAt: isoDate,
        successRatePct: 100,
        avgResponseMs: 1200,
        totalCalls30d: 0,
        weeklyCalls: Array(12).fill(0),
        weeklyErrors: Array(12).fill(0),
        weeklySuccessRate: Array(12).fill(100),
        skillIds: details.skills || [],
        tags: details.tags || [],
        trust: trustBlock
      };
      setAgents(prev => [...prev, newAgent]);
    } else if (kind === 'skill') {
      const newSkill: SkillEntity = {
        id,
        name: details.name,
        category: details.category || 'General',
        description: details.description || '',
        longDescription: details.longDescription || details.description || '',
        whenToUse: details.whenToUse || [],
        exampleSnippet: details.exampleSnippet || '',
        inputs: details.inputs || [],
        outputs: details.outputs || [],
        versions: [{ version: details.version || '1.0.0', date: isoDate, notes: details.changelog || 'Initial registration.' }],
        files: details.files || [{ name: 'SKILL.md', kind: 'markdown', sizeKb: 1.2, updatedAt: isoDate }],
        sourceUrl: details.sourceUrl || '',
        version: details.version || '1.0.0',
        stars: 0,
        downloads: 0,
        status: 'pending',
        ownerName: currentUser.name,
        registeredAt: isoDate,
        iconName: details.iconName || 'shield',
        trust: trustBlock
      };
      setSkillsList(prev => [...prev, newSkill]);
    } else if (kind === 'prompt') {
      const newPrompt: PromptEntity = {
        id,
        name: details.name,
        description: details.description || '',
        source: details.source || '',
        author: currentUser.name,
        createdAt: isoDate,
        lastUsedAt: isoDate,
        tags: details.tags || [],
        content: details.content || '',
        rating: 0,
        reviewsCount: 0,
        argCount: details.argCount || 0,
        status: 'pending',
        ownerName: currentUser.name,
        iconName: details.iconName || 'scroll',
        trust: trustBlock
      };
      setPromptsList(prev => [...prev, newPrompt]);
    }

    // Append to personal workspace
    const targetWsId = currentUser.role === 'super_admin' ? 'jordans-workspace' : 'alexs-workspace';
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id === targetWsId) {
        return {
          ...ws,
          items: [...ws.items, { kind, id }]
        };
      }
      return ws;
    }));
  };

  const getUsedBy = (skillId: string) => {
    return {
      servers: derivedServers.filter(s => s.skillIds?.includes(skillId)),
      agents: derivedAgents.filter(a => a.skillIds?.includes(skillId))
    };
  };

  const getApprovals = () => {
    const waitingOnYou = transferRequests.filter(req => {
      if (req.status !== 'pending') return false;
      const targetWs = derivedWorkspaces.find(w => w.id === req.toWorkspaceId);
      return targetWs ? targetWs.ownerIsCurrentUser : false;
    });

    const yourSubmissions: any[] = [];
    derivedServers.forEach(s => {
      if (s.ownedByUser && s.status !== 'approved') {
        yourSubmissions.push({ kind: 'server', id: s.id, name: s.name, registeredAt: s.registeredAt, status: s.status });
      }
    });
    derivedAgents.forEach(a => {
      if (a.ownedByUser && a.status !== 'approved') {
        yourSubmissions.push({ kind: 'agent', id: a.id, name: a.name, registeredAt: a.registeredAt, status: a.status });
      }
    });
    derivedSkills.forEach(sk => {
      if (sk.ownedByUser && sk.status !== 'approved') {
        yourSubmissions.push({ kind: 'skill', id: sk.id, name: sk.name, registeredAt: sk.registeredAt, status: sk.status });
      }
    });
    derivedPrompts.forEach(p => {
      if (p.ownedByUser && p.status !== 'approved') {
        yourSubmissions.push({ kind: 'prompt', id: p.id, name: p.name, registeredAt: p.createdAt, status: p.status });
      }
    });

    const registrationQueue: any[] = [];
    if (currentUser?.role === 'super_admin') {
      derivedServers.forEach(s => {
        if (s.status === 'pending') {
          registrationQueue.push({ kind: 'server', id: s.id, name: s.name, publisher: s.publisher, registeredAt: s.registeredAt, status: s.status, description: s.description });
        }
      });
      derivedAgents.forEach(a => {
        if (a.status === 'pending') {
          registrationQueue.push({ kind: 'agent', id: a.id, name: a.name, publisher: a.publisher, registeredAt: a.registeredAt, status: a.status, description: a.description });
        }
      });
      derivedSkills.forEach(sk => {
        if (sk.status === 'pending') {
          registrationQueue.push({ kind: 'skill', id: sk.id, name: sk.name, publisher: sk.ownerName, registeredAt: sk.registeredAt, status: sk.status, description: sk.description });
        }
      });
      derivedPrompts.forEach(p => {
        if (p.status === 'pending') {
          registrationQueue.push({ kind: 'prompt', id: p.id, name: p.name, publisher: p.author, registeredAt: p.createdAt, status: p.status, description: p.description });
        }
      });
    }

    return { waitingOnYou, yourSubmissions, registrationQueue };
  };

  const getAttentionItems = () => {
    const items: any[] = [];

    derivedServers.forEach(s => {
      if (s.health.status !== 'healthy') {
        items.push({
          kind: 'server',
          id: s.id,
          name: s.name,
          type: 'issue',
          detail: `Health degraded: Uptime ${s.health.uptimePct}%, Error rate ${s.health.errorRatePct}%`,
          timestamp: s.lastUsedAt || s.registeredAt
        });
      }
    });

    derivedAgents.forEach(a => {
      if (a.successRatePct < 90) {
        items.push({
          kind: 'agent',
          id: a.id,
          name: a.name,
          type: 'issue',
          detail: `Success rate degraded: Success ${a.successRatePct}%, Response latency ${a.avgResponseMs}ms`,
          timestamp: a.lastUsedAt || a.registeredAt
        });
      }
    });

    derivedSkills.forEach(sk => {
      if (sk.trust.score < 70) {
        items.push({
          kind: 'skill',
          id: sk.id,
          name: sk.name,
          type: 'issue',
          detail: `Scan alert: score ${sk.trust.score}/100`,
          timestamp: sk.trust.scannedAt
        });
      }
    });

    const { waitingOnYou } = getApprovals();
    waitingOnYou.forEach(req => {
      items.push({
        kind: req.itemKind,
        id: req.itemId,
        name: `Transfer Request: ${req.itemId}`,
        type: 'action',
        detail: `Requested by ${req.requestedBy} from workspace`,
        timestamp: req.requestedAt,
        requestId: req.id
      });
    });

    const nowTime = new Date('2026-07-08T16:59:08+05:30').getTime();
    derivedServers.forEach(s => {
      const diff = nowTime - new Date(s.updatedAt).getTime();
      if (diff > 0 && diff < 14 * 24 * 60 * 60 * 1000) {
        items.push({
          kind: 'server',
          id: s.id,
          name: s.name,
          type: 'updated',
          detail: `Updated to v${s.version}`,
          timestamp: s.updatedAt
        });
      }
    });

    derivedAgents.forEach(a => {
      const diff = nowTime - new Date(a.updatedAt).getTime();
      if (diff > 0 && diff < 14 * 24 * 60 * 60 * 1000) {
        items.push({
          kind: 'agent',
          id: a.id,
          name: a.name,
          type: 'updated',
          detail: `Updated to v${a.version}`,
          timestamp: a.updatedAt
        });
      }
    });

    return items;
  };

  const getPerformanceRanking = () => {
    const list: any[] = [];
    derivedServers.forEach(s => {
      const calls30d = s.weeklyCalls.reduce((a, b) => a + b, 0);
      const errors30d = s.weeklyErrors.reduce((a, b) => a + b, 0);
      list.push({
        kind: 'server',
        id: s.id,
        name: s.name,
        calls: calls30d,
        errors: errors30d,
        successRate: calls30d > 0 ? ((calls30d - errors30d) / calls30d) * 100 : 100,
        trend: s.health.status === 'healthy' ? 'up' : 'down'
      });
    });

    derivedAgents.forEach(a => {
      const calls30d = a.weeklyCalls.reduce((a, b) => a + b, 0);
      const errors30d = a.weeklyErrors.reduce((a, b) => a + b, 0);
      list.push({
        kind: 'agent',
        id: a.id,
        name: a.name,
        calls: calls30d,
        errors: errors30d,
        successRate: a.successRatePct,
        trend: a.successRatePct >= 90 ? 'up' : 'down'
      });
    });

    return list;
  };

  const getPlatformStatus = () => {
    const unhealthyCount = derivedServers.filter(s => s.health.status !== 'healthy').length +
      derivedAgents.filter(a => a.successRatePct < 85).length;
    const pendingTransfers = transferRequests.filter(r => r.status === 'pending').length;

    if (unhealthyCount > 0) {
      return {
        healthy: false,
        message: `${unhealthyCount} system issues detected · ${pendingTransfers} transfers pending`
      };
    }
    return {
      healthy: true,
      message: `All systems healthy · ${pendingTransfers} approvals pending`
    };
  };

  const toggleServerHealth = (id: string) => {
    setServers(prev => prev.map(s => {
      if (s.id === id) {
        const nextStatus = s.health.status === 'healthy' ? 'down' : 'healthy';
        return {
          ...s,
          health: {
            ...s.health,
            status: nextStatus,
            uptimePct: nextStatus === 'healthy' ? 99.9 : 0
          }
        };
      }
      return s;
    }));
  };

  return (
    <RegistryContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        mcpServers: derivedServers,
        a2aAgents: derivedAgents,
        skills: derivedSkills,
        prompts: derivedPrompts,
        workspaces: derivedWorkspaces,
        transferRequests,
        bookmarks,
        userRatings,
        toggleBookmark,
        rateItem,
        requestTransfer,
        resolveTransfer,
        registerItem,
        approveItem,
        declineItem,
        getUsedBy,
        getApprovals,
        getAttentionItems,
        getPerformanceRanking,
        getPlatformStatus,
        toggleServerHealth
      }}
    >
      {children}
    </RegistryContext.Provider>
  );
};

export const useRegistry = () => {
  const context = useContext(RegistryContext);
  if (!context) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
};
