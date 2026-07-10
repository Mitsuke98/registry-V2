import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { McpServer, A2AAgent, SkillEntity, PromptEntity, Workspace } from './types';
import {
  mcpServers as initialMcpServers,
  a2aAgents as initialA2aAgents,
  skills as initialSkills,
  prompts as initialPrompts,
  workspaces as initialWorkspaces,
  preseededBookmarks
} from './fixtures';

import { toast } from 'sonner';

export type Role = 'end_user' | 'super_admin';

export interface UserSession {
  name: string;
  initials: string;
  role: Role;
}

export type Action = 'register' | 'edit' | 'delete' | 'toggle-disabled'
            | 'approve' | 'crud-workspace' | 'manage-members' | 'revert' | 'set-visibility';

export interface ChangeRecord {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: Role;
  action: 'edit' | 'delete' | 'disable' | 'enable'
        | 'workspace-create' | 'workspace-edit' | 'workspace-delete'
        | 'member-add' | 'member-remove' | 'visibility';
  targetKind: string;
  targetId: string;
  targetName: string;
  summary: string;
  snapshot: any;
}

interface RegistryContextType {
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  mcpServers: McpServer[];
  a2aAgents: A2AAgent[];
  skills: SkillEntity[];
  prompts: PromptEntity[];
  workspaces: Workspace[];
  bookmarks: Record<string, string[]>;
  userRatings: Record<string, number>;
  toggleBookmark: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  rateItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, value: number) => void;
  registerItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', details: any) => void;
  approveItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  declineItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  rejectItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  markInReview: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  updateItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, details: any) => void;
  setItemDisabled: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, disabled: boolean) => void;
  setItemVisibility: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, visibility: { global: boolean; workspaceIds: string[] }) => void;
  getUsedBy: (skillId: string) => { servers: McpServer[]; agents: A2AAgent[] };
  getApprovals: () => { yourSubmissions: any[]; registrationQueue: any[] };
  getAttentionItems: () => any[];
  getPerformanceRanking: () => any[];
  getPlatformStatus: () => { healthy: boolean; message: string };
  toggleServerHealth: (id: string) => void;
  enabledCapabilities: Record<string, boolean>;
  toggleCapability: (itemKey: string, capabilityKind: string, capabilityName: string) => void;
  skillComments: Record<string, { author: string; date: string; text: string; initials: string }[]>;
  promptComments: Record<string, { author: string; date: string; text: string; initials: string }[]>;
  addComment: (kind: 'skill' | 'prompt', id: string, text: string) => void;
  deleteItem: (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => void;
  can: (action: Action, subject?: any) => boolean;
  changeHistory: ChangeRecord[];
  revertChange: (id: string) => void;
  createWorkspace: (ws: Omit<Workspace, 'id' | 'createdAt' | 'ownerIsCurrentUser'>) => void;
  updateWorkspace: (id: string, ws: Partial<Omit<Workspace, 'id' | 'createdAt' | 'ownerIsCurrentUser'>>) => void;
  deleteWorkspace: (id: string) => void;
}

const RegistryContext = createContext<RegistryContextType | undefined>(undefined);

export const RegistryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const { migratedServers, migratedAgents, migratedSkills, migratedPrompts } = React.useMemo(() => {
    const workspaceMappings: Record<string, string[]> = {
      'chart-builder': ['design-systems-team'],
      'meeting-summarizer': ['design-systems-team'],
      'postgres-mcp': ['data-platform-team'],
      'anomaly-detection': ['data-platform-team'],
      'sentiment-analyzer': ['data-platform-team'],
      'schema-migrator': ['data-platform-team'],
      'sql-query-guard': ['data-platform-team'],
      'prompt-injection-filter': ['security-guild'],
      'dependency-vulnerability-scanner': ['security-guild'],
      'docker-sanity-check': ['security-guild']
    };

    const migrateItem = (item: any) => {
      if (item.id === 'stripe-mcp') {
        return {
          ...item,
          ownerName: 'Alex Vance',
          status: 'approved',
          visibility: {
            global: false,
            workspaceIds: []
          }
        };
      }
      const wsIds = workspaceMappings[item.id] || [];
      const isGlobal = item.id === 'stripe-mcp' ? false : (wsIds.length === 0 || item.id === 'postgres-mcp' || item.id === 'prompt-injection-filter');
      return {
        ...item,
        visibility: {
          global: isGlobal,
          workspaceIds: wsIds
        }
      };
    };

    return {
      migratedServers: initialMcpServers.map(migrateItem),
      migratedAgents: initialA2aAgents.map(migrateItem),
      migratedSkills: initialSkills.map(migrateItem),
      migratedPrompts: initialPrompts.map(migrateItem)
    };
  }, []);

  const [servers, setServers] = useState<McpServer[]>(migratedServers);
  const [agents, setAgents] = useState<A2AAgent[]>(migratedAgents);
  const [skillsList, setSkillsList] = useState<SkillEntity[]>(migratedSkills);
  const [promptsList, setPromptsList] = useState<PromptEntity[]>(migratedPrompts);
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() =>
    initialWorkspaces.map(({ items, ...rest }: any) => rest)
  );
  const [bookmarks, setBookmarks] = useState<Record<string, string[]>>({
    server: preseededBookmarks.server,
    agent: preseededBookmarks.agent,
    skill: preseededBookmarks.skill,
    prompt: preseededBookmarks.prompt
  });
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [enabledCapabilities, setEnabledCapabilities] = useState<Record<string, boolean>>({});
  const [skillComments, setSkillComments] = useState<Record<string, { author: string; date: string; text: string; initials: string }[]>>({});
  const [promptComments, setPromptComments] = useState<Record<string, { author: string; date: string; text: string; initials: string }[]>>({});

  const toggleCapability = (itemKey: string, capabilityKind: string, capabilityName: string) => {
    const key = `${itemKey}:${capabilityKind}:${capabilityName}`;
    setEnabledCapabilities(prev => ({
      ...prev,
      [key]: !(prev[key] ?? true)
    }));
  };

  const addComment = (kind: 'skill' | 'prompt', id: string, text: string) => {
    if (!currentUser) return;
    const newComment = {
      author: currentUser.name,
      date: new Date().toISOString(),
      text,
      initials: currentUser.initials || currentUser.name.split(' ').map(n => n[0]).join('')
    };
    if (kind === 'skill') {
      setSkillComments(prev => ({
        ...prev,
        [id]: [...(prev[id] || []), newComment]
      }));
    } else {
      setPromptComments(prev => ({
        ...prev,
        [id]: [...(prev[id] || []), newComment]
      }));
    }
  };

  const [changeHistory, setChangeHistory] = useState<ChangeRecord[]>([]);

  const can = (action: Action, subject?: any): boolean => {
    if (!currentUser) return false;
    const { role, name } = currentUser;

    if (action === 'register') {
      return role === 'end_user';
    }

    if (action === 'edit' || action === 'delete' || action === 'toggle-disabled' || action === 'set-visibility') {
      if (!subject) return false;
      return role === 'super_admin' || subject.ownerName === name;
    }

    if (action === 'approve') {
      return role === 'super_admin';
    }

    if (action === 'crud-workspace' || action === 'manage-members') {
      if (subject) {
        if (subject.kind === 'personal') return false;
      }
      return role === 'super_admin';
    }

    if (action === 'revert') {
      if (!subject) return false;
      return role === 'super_admin' || subject.actor === name;
    }

    return false;
  };

  const pushChange = (
    action: ChangeRecord['action'],
    targetKind: string,
    targetId: string,
    targetName: string,
    summary: string,
    snapshot: any
  ): string => {
    if (!currentUser) return '';
    const id = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record: ChangeRecord = {
      id,
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
    return id;
  };

  const getRawItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    if (kind === 'server') return servers.find(s => s.id === id);
    if (kind === 'agent') return agents.find(a => a.id === id);
    if (kind === 'skill') return skillsList.find(s => s.id === id);
    return promptsList.find(p => p.id === id);
  };

  const createWorkspace = (wsDetails: Omit<Workspace, 'id' | 'createdAt' | 'ownerIsCurrentUser'>) => {
    if (!can('crud-workspace')) {
      toast.error('Permission denied to create workspace.');
      return;
    }
    const id = `ws-${Date.now()}`;
    const newWs: Workspace = {
      ...wsDetails,
      id,
      createdAt: new Date().toISOString(),
      ownerIsCurrentUser: true
    };
    setWorkspaces(prev => [...prev, newWs]);

    const changeId = pushChange(
      'workspace-create',
      'workspace',
      id,
      wsDetails.name,
      `Created workspace ${wsDetails.name}`,
      { id }
    );

    toast.success(`Created workspace "${wsDetails.name}"`, {
      action: {
        label: 'Undo',
        onClick: () => revertChange(changeId)
      }
    });
  };

  const updateWorkspace = (id: string, wsDetails: Partial<Omit<Workspace, 'id' | 'createdAt' | 'ownerIsCurrentUser'>>) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    if (!can('crud-workspace', ws) && !can('manage-members', ws)) {
      toast.error('Permission denied to modify workspace.');
      return;
    }

    const membersChanged = wsDetails.members !== undefined && JSON.stringify(ws.members) !== JSON.stringify(wsDetails.members);
    let actionKind: ChangeRecord['action'] = 'workspace-edit';
    let summary = `Edited workspace ${ws.name}`;

    if (membersChanged) {
      if ((wsDetails.members?.length ?? 0) > ws.members.length) {
        actionKind = 'member-add';
        summary = `Added member to workspace ${ws.name}`;
      } else {
        actionKind = 'member-remove';
        summary = `Removed member from workspace ${ws.name}`;
      }
    }

    const changeId = pushChange(
      actionKind,
      'workspace',
      id,
      ws.name,
      summary,
      JSON.parse(JSON.stringify(ws))
    );

    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...wsDetails } : w));

    toast.success(`Updated workspace "${ws.name}"`, {
      action: {
        label: 'Undo',
        onClick: () => revertChange(changeId)
      }
    });
  };

  const deleteWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    if (!can('crud-workspace', ws)) {
      toast.error('Permission denied to delete workspace.');
      return;
    }

    const changeId = pushChange(
      'workspace-delete',
      'workspace',
      id,
      ws.name,
      `Deleted workspace ${ws.name}`,
      JSON.parse(JSON.stringify(ws))
    );

    setWorkspaces(prev => prev.filter(w => w.id !== id));

    setServers(prev => prev.map(s => {
      const globalVal = s.visibility?.global ?? false;
      const workspaceIdsVal = s.visibility?.workspaceIds?.filter(wId => wId !== id) ?? [];
      return {
        ...s,
        visibility: {
          global: globalVal,
          workspaceIds: workspaceIdsVal
        }
      };
    }));
    setAgents(prev => prev.map(a => {
      const globalVal = a.visibility?.global ?? false;
      const workspaceIdsVal = a.visibility?.workspaceIds?.filter(wId => wId !== id) ?? [];
      return {
        ...a,
        visibility: {
          global: globalVal,
          workspaceIds: workspaceIdsVal
        }
      };
    }));
    setSkillsList(prev => prev.map(sk => {
      const globalVal = sk.visibility?.global ?? false;
      const workspaceIdsVal = sk.visibility?.workspaceIds?.filter(wId => wId !== id) ?? [];
      return {
        ...sk,
        visibility: {
          global: globalVal,
          workspaceIds: workspaceIdsVal
        }
      };
    }));
    setPromptsList(prev => prev.map(p => {
      const globalVal = p.visibility?.global ?? false;
      const workspaceIdsVal = p.visibility?.workspaceIds?.filter(wId => wId !== id) ?? [];
      return {
        ...p,
        visibility: {
          global: globalVal,
          workspaceIds: workspaceIdsVal
        }
      };
    }));

    toast.success(`Deleted workspace "${ws.name}"`, {
      action: {
        label: 'Undo',
        onClick: () => revertChange(changeId)
      }
    });
  };

  const revertChange = (changeId: string) => {
    const change = changeHistory.find(c => c.id === changeId);
    if (!change) {
      toast.error('Change record not found.');
      return;
    }

    if (!can('revert', change)) {
      toast.error('Permission denied to revert this change.');
      return;
    }

    let revertAction: ChangeRecord['action'];
    let revertSummary = `Reverted: ${change.summary}`;
    let priorStateSnapshot: any = null;

    if (change.action === 'workspace-create') {
      revertAction = 'workspace-delete';
      const ws = workspaces.find(w => w.id === change.targetId);
      priorStateSnapshot = ws ? JSON.parse(JSON.stringify(ws)) : null;
      setWorkspaces(prev => prev.filter(w => w.id !== change.targetId));
    }
    else if (change.action === 'workspace-delete') {
      revertAction = 'workspace-create';
      priorStateSnapshot = { id: change.targetId };
      const restoredWs = change.snapshot;
      setWorkspaces(prev => [...prev, restoredWs]);
    }
    else if (change.action === 'workspace-edit' || change.action === 'member-add' || change.action === 'member-remove') {
      revertAction = change.action;
      const ws = workspaces.find(w => w.id === change.targetId);
      priorStateSnapshot = ws ? JSON.parse(JSON.stringify(ws)) : null;
      setWorkspaces(prev => prev.map(w => w.id === change.targetId ? { ...w, ...change.snapshot } : w));
    }
    else if (change.action === 'delete') {
      revertAction = 'delete';
      priorStateSnapshot = {
        item: change.snapshot.item,
        bookmarks: bookmarks[change.targetKind] || []
      };

      const restoredItem = change.snapshot.item;
      if (change.targetKind === 'server') {
        setServers(prev => {
          if (prev.some(s => s.id === change.targetId)) return prev;
          return [...prev, restoredItem];
        });
      } else if (change.targetKind === 'agent') {
        setAgents(prev => {
          if (prev.some(a => a.id === change.targetId)) return prev;
          return [...prev, restoredItem];
        });
      } else if (change.targetKind === 'skill') {
        setSkillsList(prev => {
          if (prev.some(s => s.id === change.targetId)) return prev;
          return [...prev, restoredItem];
        });
      } else if (change.targetKind === 'prompt') {
        setPromptsList(prev => {
          if (prev.some(p => p.id === change.targetId)) return prev;
          return [...prev, restoredItem];
        });
      }

      if (change.snapshot.bookmarks.includes(change.targetId)) {
        setBookmarks(prev => {
          const list = prev[change.targetKind] || [];
          if (list.includes(change.targetId)) return prev;
          return {
            ...prev,
            [change.targetKind]: [...list, change.targetId]
          };
        });
      }
    }
    else if (change.action === 'visibility') {
      revertAction = 'visibility';
      const item = getRawItem(change.targetKind as any, change.targetId);
      priorStateSnapshot = item ? JSON.parse(JSON.stringify(item.visibility || { global: true, workspaceIds: [] })) : null;

      const setVisibilityOnList = (listSetter: any) => {
        listSetter((prev: any) => prev.map((it: any) => it.id === change.targetId ? { ...it, visibility: change.snapshot } : it));
      };

      if (change.targetKind === 'server') setVisibilityOnList(setServers);
      else if (change.targetKind === 'agent') setVisibilityOnList(setAgents);
      else if (change.targetKind === 'skill') setVisibilityOnList(setSkillsList);
      else if (change.targetKind === 'prompt') setVisibilityOnList(setPromptsList);
    }
    else if (change.action === 'edit') {
      revertAction = 'edit';
      const currentItem = getRawItem(change.targetKind as any, change.targetId);
      priorStateSnapshot = currentItem ? JSON.parse(JSON.stringify(currentItem)) : null;

      if (change.targetKind === 'server') {
        setServers(prev => prev.map(s => s.id === change.targetId ? { ...s, ...change.snapshot } : s));
      } else if (change.targetKind === 'agent') {
        setAgents(prev => prev.map(a => a.id === change.targetId ? { ...a, ...change.snapshot } : a));
      } else if (change.targetKind === 'skill') {
        setSkillsList(prev => prev.map(sk => sk.id === change.targetId ? { ...sk, ...change.snapshot } : sk));
      } else if (change.targetKind === 'prompt') {
        setPromptsList(prev => prev.map(p => p.id === change.targetId ? { ...p, ...change.snapshot } : p));
      }
    }
    else if (change.action === 'disable' || change.action === 'enable') {
      revertAction = change.action === 'disable' ? 'enable' : 'disable';
      priorStateSnapshot = { priorDisabled: change.action === 'disable' };

      const disabled = change.snapshot.priorDisabled;
      if (change.targetKind === 'server') {
        setServers(prev => prev.map(s => s.id === change.targetId ? { ...s, disabled } : s));
      } else if (change.targetKind === 'agent') {
        setAgents(prev => prev.map(a => a.id === change.targetId ? { ...a, disabled } : a));
      } else if (change.targetKind === 'skill') {
        setSkillsList(prev => prev.map(sk => sk.id === change.targetId ? { ...sk, disabled } : sk));
      } else if (change.targetKind === 'prompt') {
        setPromptsList(prev => prev.map(p => p.id === change.targetId ? { ...p, disabled } : p));
      }
    } else {
      return;
    }

    if (currentUser) {
      const newChangeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newRecord: ChangeRecord = {
        id: newChangeId,
        timestamp: new Date().toISOString(),
        actor: currentUser.name,
        actorRole: currentUser.role,
        action: revertAction,
        targetKind: change.targetKind,
        targetId: change.targetId,
        targetName: change.targetName,
        summary: revertSummary,
        snapshot: priorStateSnapshot
      };
      setChangeHistory(prev => [newRecord, ...prev].slice(0, 20));
      
      toast.success(`Reverted: ${change.summary}`, {
        action: {
          label: 'Undo',
          onClick: () => revertChange(newChangeId)
        }
      });
    }
  };

  const deleteItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    const item = getRawItem(kind, id);
    if (!item) return;
    if (!can('delete', item)) {
      toast.error('Permission denied to delete this asset.');
      return;
    }

    const wsMemberships = item.visibility?.workspaceIds || [];

    const snapshot = {
      item: JSON.parse(JSON.stringify(item)),
      bookmarks: bookmarks[kind] || [],
      workspaces: wsMemberships
    };

    const changeId = pushChange(
      'delete',
      kind,
      id,
      item.name,
      `Deleted ${item.name}`,
      snapshot
    );

    if (kind === 'server') {
      setServers(prev => prev.filter(s => s.id !== id));
    } else if (kind === 'agent') {
      setAgents(prev => prev.filter(a => a.id !== id));
    } else if (kind === 'skill') {
      setSkillsList(prev => prev.filter(s => s.id !== id));
    } else if (kind === 'prompt') {
      setPromptsList(prev => prev.filter(p => p.id !== id));
    }

    setBookmarks(prev => {
      const list = prev[kind] || [];
      return {
        ...prev,
        [kind]: list.filter(item => item !== id)
      };
    });

    toast.success(`Deleted asset "${item.name}"`, {
      action: {
        label: 'Undo',
        onClick: () => revertChange(changeId)
      }
    });
  };

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



  const approveItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    if (!can('approve')) {
      toast.error('Permission denied to approve.');
      return;
    }
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
    if (!can('approve')) {
      toast.error('Permission denied to decline.');
      return;
    }
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

  const rejectItem = declineItem;

  const markInReview = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string) => {
    if (!can('approve')) {
      toast.error('Permission denied.');
      return;
    }
    if (kind === 'server') {
      setServers(prev => prev.map(s => s.id === id ? { ...s, status: 'in_review' } : s));
    } else if (kind === 'agent') {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'in_review' } : a));
    } else if (kind === 'skill') {
      setSkillsList(prev => prev.map(sk => sk.id === id ? { ...sk, status: 'in_review' } : sk));
    } else if (kind === 'prompt') {
      setPromptsList(prev => prev.map(p => p.id === id ? { ...p, status: 'in_review' } : p));
    }
  };

  const setItemDisabled = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, disabled: boolean) => {
    const item = getRawItem(kind, id);
    if (!item) return;
    if (!can('toggle-disabled', item)) {
      toast.error('Permission denied to change asset status.');
      return;
    }

    const changeId = pushChange(
      disabled ? 'disable' : 'enable',
      kind,
      id,
      item.name,
      `${disabled ? 'Disabled' : 'Enabled'} ${item.name}`,
      { priorDisabled: !disabled }
    );

    if (kind === 'server') {
      setServers(prev => prev.map(s => s.id === id ? { ...s, disabled } : s));
    } else if (kind === 'agent') {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, disabled } : a));
    } else if (kind === 'skill') {
      setSkillsList(prev => prev.map(sk => sk.id === id ? { ...sk, disabled } : sk));
    } else if (kind === 'prompt') {
      setPromptsList(prev => prev.map(p => p.id === id ? { ...p, disabled } : p));
    }

    if (disabled) {
      toast.error(`"${item.name}" disabled — hidden from the catalog.`, {
        action: {
          label: 'Undo',
          onClick: () => revertChange(changeId)
        }
      });
    } else {
      toast.success(`"${item.name}" enabled — restored to the catalog.`, {
        action: {
          label: 'Undo',
          onClick: () => revertChange(changeId)
        }
      });
    }
  };

  const setItemVisibility = (
    kind: 'server' | 'agent' | 'skill' | 'prompt',
    id: string,
    visibility: { global: boolean; workspaceIds: string[] }
  ) => {
    const item = getRawItem(kind, id);
    if (!item) return;
    if (!can('set-visibility', item)) {
      toast.error('Permission denied to change visibility.');
      return;
    }

    const changeId = pushChange(
      'visibility',
      kind,
      id,
      item.name,
      `Changed visibility of ${item.name}`,
      JSON.parse(JSON.stringify(item.visibility || { global: true, workspaceIds: [] }))
    );

    const updateVisibility = (prev: any[]) =>
      prev.map(it => (it.id === id ? { ...it, visibility } : it));

    if (kind === 'server') {
      setServers(prev => updateVisibility(prev));
    } else if (kind === 'agent') {
      setAgents(prev => updateVisibility(prev));
    } else if (kind === 'skill') {
      setSkillsList(prev => updateVisibility(prev));
    } else if (kind === 'prompt') {
      setPromptsList(prev => updateVisibility(prev));
    }

    toast.success(`Updated visibility settings for "${item.name}"`, {
      action: {
        label: 'Undo',
        onClick: () => revertChange(changeId)
      }
    });
  };

  const updateItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', id: string, details: any) => {
    const item = getRawItem(kind, id);
    if (!item) return;
    if (!can('edit', item)) {
      toast.error('Permission denied.');
      return;
    }

    const changeId = pushChange(
      'edit',
      kind,
      id,
      item.name,
      `Edited ${item.name} specifications`,
      JSON.parse(JSON.stringify(item))
    );

    if (kind === 'server') {
      setServers(prev => prev.map(s => s.id === id ? { ...s, ...details } : s));
    } else if (kind === 'agent') {
      setAgents(prev => prev.map(a => a.id === id ? { ...a, ...details } : a));
    } else if (kind === 'skill') {
      setSkillsList(prev => prev.map(sk => sk.id === id ? { ...sk, ...details } : sk));
    } else if (kind === 'prompt') {
      setPromptsList(prev => prev.map(p => p.id === id ? { ...p, ...details } : p));
    }

    toast.success(`Saved changes for "${item.name}"`, {
      action: {
        label: 'Undo',
        onClick: () => revertChange(changeId)
      }
    });
  };

  const registerItem = (kind: 'server' | 'agent' | 'skill' | 'prompt', details: any) => {
    if (!can('register')) {
      toast.error('Super admins cannot register assets');
      return;
    }
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

    const initialVis = details.visibility || { global: false, workspaceIds: [] };

    if (kind === 'server') {
      const newServer: McpServer = {
        id,
        name: details.name,
        description: details.description || '',
        publisher: currentUser!.name,
        version: details.version || '1.0.0',
        transport: details.transport || 'stdio',
        rating: 0.0,
        reviewsCount: 0,
        status: 'pending',
        ownerName: currentUser!.name,
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
        trust: trustBlock,
        visibility: initialVis
      };
      setServers(prev => [...prev, newServer]);
    } else if (kind === 'agent') {
      const newAgent: A2AAgent = {
        id,
        name: details.name,
        description: details.description || '',
        publisher: currentUser!.name,
        version: details.version || '1.0.0',
        endpoint: details.endpoint || '',
        rating: 0.0,
        reviewsCount: 0,
        status: 'pending',
        ownerName: currentUser!.name,
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
        trust: trustBlock,
        visibility: initialVis
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
        ownerName: currentUser!.name,
        registeredAt: isoDate,
        iconName: details.iconName || 'shield',
        trust: trustBlock,
        visibility: initialVis
      };
      setSkillsList(prev => [...prev, newSkill]);
    } else if (kind === 'prompt') {
      const newPrompt: PromptEntity = {
        id,
        name: details.name,
        description: details.description || '',
        source: details.source || '',
        author: currentUser!.name,
        createdAt: isoDate,
        lastUsedAt: isoDate,
        tags: details.tags || [],
        content: details.content || '',
        rating: 0,
        reviewsCount: 0,
        argCount: details.argCount || 0,
        status: 'pending',
        ownerName: currentUser!.name,
        iconName: details.iconName || 'scroll',
        trust: trustBlock,
        version: details.version || '1.0.0',
        versions: details.versions || [{ version: details.version || '1.0.0', date: isoDate, notes: 'Initial registration.', content: details.content || '' }],
        visibility: initialVis
      };
      setPromptsList(prev => [...prev, newPrompt]);
    }
  };

  const getUsedBy = (skillId: string) => {
    return {
      servers: derivedServers.filter(s => s.skillIds?.includes(skillId)),
      agents: derivedAgents.filter(a => a.skillIds?.includes(skillId))
    };
  };

  const getApprovals = () => {
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

    return { yourSubmissions, registrationQueue };
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
    const { registrationQueue } = getApprovals();
    const pendingApprovals = registrationQueue.length;

    if (unhealthyCount > 0) {
      return {
        healthy: false,
        message: `${unhealthyCount} system issues detected · ${pendingApprovals} approvals pending`
      };
    }
    return {
      healthy: true,
      message: `All systems healthy · ${pendingApprovals} approvals pending`
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
        bookmarks,
        userRatings,
        toggleBookmark,
        rateItem,
        registerItem,
        approveItem,
        declineItem,
        rejectItem,
        markInReview,
        updateItem,
        setItemDisabled,
        setItemVisibility,
        getUsedBy,
        getApprovals,
        getAttentionItems,
        getPerformanceRanking,
        getPlatformStatus,
        toggleServerHealth,
        enabledCapabilities,
        toggleCapability,
        skillComments,
        promptComments,
        addComment,
        deleteItem,
        can,
        changeHistory,
        revertChange,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace
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
