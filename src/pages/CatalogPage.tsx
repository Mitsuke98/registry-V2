import React, { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { StatCard, FilterBar, CardShell, SmartTable } from '@/components/registry/Primitives';
import {
  CatPill, HealthDot,
  RatingStars, BookmarkToggle, EmptyState, EnableToggle
} from '@/components/registry/Kit';
import { FEATURES } from '@/config/features';
import { Wrench, Link2, MessageSquare } from 'lucide-react';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    mcpServers, a2aAgents, skills, prompts,
    bookmarks, toggleBookmark, getUsedBy, toggleCapabilityItem, can, getHealthDisplay
  } = useRegistry();

  // 1. URL Query String State Sync
  const mode = searchParams.get('mode') || 'assets'; // 'assets' | 'capabilities'
  const facet = searchParams.get('facet') || 'all'; // all, servers, agents, skills, prompts, tools, resources
  const categoryFilter = searchParams.get('category') || '';
  const searchFilter = searchParams.get('q') || '';
  const showBookmarked = searchParams.get('bookmarked') === 'true';
  const sortBy = searchParams.get('sort') || 'rating';
  const isGridView = searchParams.get('view') !== 'list';
  const selectedTags = useMemo(() => {
    const val = searchParams.get('tags');
    return val ? val.split(',') : [];
  }, [searchParams]);

  // Approved, enabled, globally visible catalog elements
  const activeServers = mcpServers.filter(s => s.status === 'approved' && !s.disabled && s.visibility?.global);
  const activeAgents = a2aAgents.filter(a => a.status === 'approved' && !a.disabled && a.visibility?.global);
  const activeSkills = skills.filter(s => s.status === 'approved' && !s.disabled && s.visibility?.global);
  const activePrompts = FEATURES.prompts ? prompts.filter(p => p.status === 'approved' && !p.disabled && p.visibility?.global) : [];

  // Helper to persist query parameters in url. setSearchParams's functional
  // updater closes over the searchParams snapshot from the render that
  // created the click handler — calling this twice in a row in one handler
  // means the second call doesn't see the first call's change and its
  // {replace:true} navigation clobbers it. Always batch multi-key updates
  // through updateQueryParams (plural) instead of chaining single calls.
  const updateQueryParam = (key: string, value: string | null) => {
    updateQueryParams({ [key]: value });
  };

  const updateQueryParams = (updates: Record<string, string | null>) => {
    setSearchParams(prev => {
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '' || value === 'all') {
          prev.delete(key);
        } else {
          prev.set(key, value);
        }
      }
      return prev;
    }, { replace: true });
  };

  // Scroll Position Memory
  useEffect(() => {
    const scrollPos = sessionStorage.getItem('catalogScrollTop');
    if (scrollPos) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(scrollPos, 10));
        const container = document.getElementById('main-scroll-container') || document.querySelector('.flex-1.overflow-y-auto');
        if (container) {
          container.scrollTop = parseInt(scrollPos, 10);
        }
      }, 120);
    }

    const handleScroll = () => {
      const container = document.getElementById('main-scroll-container') || document.querySelector('.flex-1.overflow-y-auto');
      const top = container ? container.scrollTop : window.scrollY;
      sessionStorage.setItem('catalogScrollTop', String(top));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const container = document.getElementById('main-scroll-container') || document.querySelector('.flex-1.overflow-y-auto');
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Collect category chips for Skills facet
  const skillCategories = useMemo(() => Array.from(new Set(activeSkills.map(s => s.category))), [activeSkills]);

  // Collect all unique tags for tag cloud
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    activeServers.forEach(s => s.tags?.forEach((t: string) => tagsSet.add(t)));
    activeAgents.forEach(a => a.tags?.forEach((t: string) => tagsSet.add(t)));
    activePrompts.forEach(p => p.tags?.forEach((t: string) => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [activeServers, activeAgents, activePrompts]);

  const toggleTag = (tag: string) => {
    const current = [...selectedTags];
    const idx = current.indexOf(tag);
    if (idx > -1) {
      current.splice(idx, 1);
    } else {
      current.push(tag);
    }
    updateQueryParam('tags', current.length > 0 ? current.join(',') : null);
  };

  // Collect Unified Capability Items
  const allTools = useMemo(() => {
    const list: any[] = [];
    activeServers.forEach(server => {
      if (server.tools) {
        server.tools.forEach((tool: any) => {
          list.push({
            ...tool,
            id: `${server.id}-${tool.name}`,
            parentServerId: server.id,
            parentServerName: server.name,
            kind: 'tool'
          });
        });
      }
    });
    return list;
  }, [activeServers]);

  const allResources = useMemo(() => {
    const list: any[] = [];
    activeServers.forEach(server => {
      if (server.resources) {
        server.resources.forEach((res: any) => {
          list.push({
            ...res,
            id: `${server.id}-${res.name}`,
            parentServerId: server.id,
            parentServerName: server.name,
            kind: 'resource'
          });
        });
      }
    });
    return list;
  }, [activeServers]);

  const allPrompts = useMemo(() => {
    const list: any[] = [];
    activeServers.forEach(server => {
      if (server.prompts) {
        server.prompts.forEach((pr: any) => {
          list.push({
            ...pr,
            id: `${server.id}-${pr.name}`,
            parentServerId: server.id,
            parentServerName: server.name,
            kind: 'prompt'
          });
        });
      }
    });
    return list;
  }, [activeServers]);

  // 2. Adaptive KPI Cards
  const getKPIs = () => {
    if (mode === 'capabilities') {
      return [
        { label: 'Total Tools', value: allTools.length },
        { label: 'Total Resources', value: allResources.length },
        { label: 'Total Prompts', value: allPrompts.length },
        { label: 'Capability Gate', value: 'Active' }
      ];
    }

    if (facet === 'servers') {
      const avgUptime = activeServers.reduce((acc, s) => acc + (s.health?.uptimePct || 99), 0) / (activeServers.length || 1);
      const calls = activeServers.reduce((acc, s) => acc + (s.weeklyCalls?.reduce((sum, c) => sum + c, 0) || 0), 0);
      return [
        { label: 'Available Servers', value: activeServers.length },
        { label: 'Avg Uptime', value: `${avgUptime.toFixed(2)}%` },
        { label: 'Calls (30d)', value: `${(calls / 1000).toFixed(1)}k` },
        { label: 'Last Added', value: 'Today' }
      ];
    }
    if (facet === 'agents') {
      const avgSuccess = activeAgents.reduce((acc, a) => acc + (a.successRatePct || 95), 0) / (activeAgents.length || 1);
      const calls = activeAgents.reduce((acc, a) => acc + (a.weeklyCalls?.reduce((sum, c) => sum + c, 0) || 0), 0);
      return [
        { label: 'Available Agents', value: activeAgents.length },
        { label: 'Avg Success', value: `${avgSuccess.toFixed(1)}%` },
        { label: 'Calls (30d)', value: `${(calls / 1000).toFixed(1)}k` },
        { label: 'Last Added', value: 'June' }
      ];
    }
    if (facet === 'skills') {
      const totalDownloads = activeSkills.reduce((acc, s) => acc + (s.downloads || 0), 0);
      const categoriesCount = new Set(activeSkills.map(s => s.category)).size;
      return [
        { label: 'Available Skills', value: activeSkills.length },
        { label: 'Categories', value: categoriesCount },
        { label: 'Downloads (30d)', value: `${(totalDownloads / 1000).toFixed(1)}k` },
        { label: 'Last Added', value: 'July' }
      ];
    }
    if (facet === 'prompts') {
      const sourcesCount = new Set(activePrompts.map(p => p.source)).size;
      return [
        { label: 'Available Prompts', value: activePrompts.length },
        { label: 'Unique Sources', value: sourcesCount },
        { label: 'Last Used', value: 'Today' },
        { label: 'Staged Status', value: 'Healthy' }
      ];
    }
    // Default 'all'
    const totalAssets = activeServers.length + activeAgents.length + activeSkills.length + activePrompts.length;
    const avgScore = [...activeServers, ...activeAgents, ...activeSkills].reduce((sum, a) => sum + (a.trust?.score || 90), 0) / (totalAssets || 1);
    return [
      { label: 'Total Verified Assets', value: totalAssets },
      { label: 'Avg Trust Score', value: `${avgScore.toFixed(0)}/100` },
      { label: 'Governance Grade', value: 'A' },
      { label: 'Active Workspaces', value: '4' }
    ];
  };

  // Bookmark counts matching current selections
  const getBookmarksCount = () => {
    let list: string[] = [];
    if (facet === 'all' || facet === 'servers') list.push(...bookmarks.server.filter(id => activeServers.some(s => s.id === id)));
    if (facet === 'all' || facet === 'agents') list.push(...bookmarks.agent.filter(id => activeAgents.some(a => a.id === id)));
    if (facet === 'all' || facet === 'skills') list.push(...bookmarks.skill.filter(id => activeSkills.some(s => s.id === id)));
    if (FEATURES.prompts && (facet === 'all' || facet === 'prompts')) list.push(...bookmarks.prompt.filter(id => activePrompts.some(p => p.id === id)));
    return list.length;
  };

  // 3. Filtered Items for standard assets view
  const filteredItems = useMemo(() => {
    let items: any[] = [];
    const q = searchFilter.toLowerCase().trim();

    if (facet === 'all' || facet === 'servers') {
      let list = [...activeServers];
      if (showBookmarked) list = list.filter(s => bookmarks.server.includes(s.id));
      if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
      if (selectedTags.length > 0) {
        list = list.filter(s => selectedTags.every(t => s.tags?.includes(t)));
      }
      items.push(...list.map(s => ({ ...s, kind: 'server' as const })));
    }

    if (facet === 'all' || facet === 'agents') {
      let list = [...activeAgents];
      if (showBookmarked) list = list.filter(a => bookmarks.agent.includes(a.id));
      if (q) list = list.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
      if (selectedTags.length > 0) {
        list = list.filter(a => selectedTags.every(t => a.tags?.includes(t)));
      }
      items.push(...list.map(a => ({ ...a, kind: 'agent' as const })));
    }

    if (facet === 'all' || facet === 'skills') {
      let list = [...activeSkills];
      if (showBookmarked) list = list.filter(s => bookmarks.skill.includes(s.id));
      if (categoryFilter) list = list.filter(s => s.category === categoryFilter);
      if (q) list = list.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
      if (selectedTags.length > 0) {
        list = [];
      }
      items.push(...list.map(s => ({ ...s, kind: 'skill' as const })));
    }

    if (FEATURES.prompts && (facet === 'all' || facet === 'prompts')) {
      let list = [...activePrompts];
      if (showBookmarked) list = list.filter(p => bookmarks.prompt.includes(p.id));
      if (q) list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      if (selectedTags.length > 0) {
        list = list.filter(p => selectedTags.every(t => p.tags?.includes(t)));
      }
      items.push(...list.map(p => ({ ...p, kind: 'prompt' as const })));
    }

    // Sort items
    items.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'downloads') {
        const downloadsA = a.kind === 'skill' ? a.downloads : (a.totalCalls30d || 0);
        const downloadsB = b.kind === 'skill' ? b.downloads : (b.totalCalls30d || 0);
        return downloadsB - downloadsA;
      }
      return a.name.localeCompare(b.name);
    });

    return items;
  }, [facet, categoryFilter, searchFilter, showBookmarked, sortBy, activeServers, activeAgents, activeSkills, activePrompts, bookmarks, selectedTags]);

  const tableColumns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row: any) => (
        <div className="flex items-center gap-2.5">
          <CatPill text={row.kind} />
          <span className="font-semibold text-gray-800">{row.name}</span>
        </div>
      )
    },
    {
      key: 'publisher',
      header: 'Publisher / Author',
      render: (row: any) => <span>{row.publisher?.name || row.publisher || row.author || 'Community'}</span>
    },
    {
      key: 'grade',
      header: 'Health',
      render: (row: any) => <HealthDot status={getHealthDisplay(row)} showLabel />
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (row: any) => <RatingStars rating={row.rating ?? 0} reviewsCount={row.reviewsCount ?? 0} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row: any) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <BookmarkToggle 
            isBookmarked={bookmarks[row.kind]?.includes(row.id) || false} 
            onToggle={() => toggleBookmark(row.kind, row.id)} 
          />
        </div>
      )
    }
  ];

  const currentFacet = mode === 'capabilities' 
    ? (['tools', 'resources', 'prompts'].includes(facet) ? facet : 'tools') 
    : facet;

  return (
    <div className="p-6 space-y-6 select-none">
      
      {/* Header and Assets vs Capabilities toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-150 pb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Agent Nexus Catalog</h1>
          <p className="text-xs text-gray-500 mt-0.5">governed repository of verified agents, MCP servers, and capabilities.</p>
        </div>
        <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 self-start sm:self-center">
          <button
            onClick={() => updateQueryParams({ mode: 'assets', facet: 'all' })}
            className={`px-4 py-1.5 text-xs font-bold rounded-md select-none cursor-pointer transition-all ${
              mode === 'assets'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Assets
          </button>
          <button
            onClick={() => updateQueryParams({ mode: 'capabilities', facet: 'tools' })}
            className={`px-4 py-1.5 text-xs font-bold rounded-md select-none cursor-pointer transition-all ${
              mode === 'capabilities'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Capabilities
          </button>
        </div>
      </div>

      {/* Catalog Tabs Strip */}
      <div className="flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center gap-6">
          {mode === 'assets' ? (
            (['all', 'servers', 'agents', 'skills', 'prompts'] as const).map((tab) => {
              const isPrompt = tab === 'prompts';
              const disabled = isPrompt && !FEATURES.prompts;
              const isSelected = currentFacet === tab;
              
              return (
                <button
                  key={tab}
                  disabled={disabled}
                  onClick={() => updateQueryParams({ facet: tab, category: null })}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer focus:outline-none ${
                    disabled
                      ? 'opacity-35 cursor-not-allowed'
                      : isSelected
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab === 'all' ? 'All Assets' : tab}
                  {isPrompt && !FEATURES.prompts && (
                    <span className="ml-1 text-[9px] bg-gray-100 border text-gray-400 px-1 rounded-sm select-none font-bold">Disabled</span>
                  )}
                </button>
              );
            })
          ) : (
            (['tools', 'resources', 'prompts'] as const).map((tab) => {
              const isSelected = currentFacet === tab;
              
              return (
                <button
                  key={tab}
                  onClick={() => updateQueryParams({ facet: tab, category: null })}
                  className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all relative cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* KPI Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {getKPIs().map((kpi, idx) => (
          <StatCard key={idx} label={kpi.label} value={kpi.value} />
        ))}
      </div>

      {/* FilterBar Controls */}
      <FilterBar 
        categoryChips={mode === 'assets' && currentFacet === 'skills' ? skillCategories : []}
        selectedCategory={categoryFilter}
        onSelectCategory={cat => updateQueryParam('category', cat)}
        tags={mode === 'assets' ? allTags : []}
        selectedTags={selectedTags}
        onToggleTag={toggleTag}
        sortByOptions={[
          { label: 'Top Rated', value: 'rating' },
          { label: 'Downloads / Calls', value: 'downloads' },
          { label: 'Alphabetical', value: 'name' }
        ]}
        selectedSortBy={sortBy}
        onSortByChange={sort => updateQueryParam('sort', sort)}
        isGridView={isGridView}
        onViewChange={grid => updateQueryParam('view', grid ? 'grid' : 'list')}
        bookmarkCount={mode === 'assets' ? getBookmarksCount() : 0}
        filterBookmarked={mode === 'assets' && showBookmarked}
        onToggleBookmarkFilter={mode === 'assets' ? (active => updateQueryParam('bookmarked', active ? 'true' : 'false')) : undefined}
        searchVal={searchFilter}
        onSearchChange={val => updateQueryParam('q', val)}
      />

      {/* Main View Area */}
      {mode === 'capabilities' ? (
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm overflow-x-auto">
          {currentFacet === 'tools' && (
            <SmartTable 
              data={allTools.filter(t => {
                const q = searchFilter.toLowerCase().trim();
                return !q || t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
              })}
              columns={[
                {
                  key: 'name',
                  header: 'Tool Name',
                  sortable: true,
                  render: (row: any) => (
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-primary animate-pulse-subtle" />
                      <Link to={`/tools/${row.parentServerId}__${row.name}`} className="font-semibold text-primary hover:underline">
                        {row.name}
                      </Link>
                    </div>
                  )
                },
                {
                  key: 'server',
                  header: 'Parent Server',
                  render: (row: any) => (
                    <Link to={`/servers/${row.parentServerId}`} className="font-semibold text-gray-550 hover:underline">
                      {row.parentServerName}
                    </Link>
                  )
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row: any) => <span className="text-gray-500">{row.description}</span>
                },
                {
                  key: 'invocations',
                  header: 'Invocations (30d)',
                  sortable: true,
                  render: (row: any) => <span className="font-mono text-gray-600 font-bold">{row.invocations30d ?? 140}</span>
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (row: any) => {
                    const isItemDisabled = !!row.disabled;
                    return (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <span className={`text-[10px] font-bold ${isItemDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
                          {isItemDisabled ? 'Off' : 'On'}
                        </span>
                        <EnableToggle 
                          checked={!isItemDisabled} 
                          onChange={() => toggleCapabilityItem(row.parentServerId, 'tools', row.name)}
                          disabled={!can('toggle-capability', mcpServers.find(s => s.id === row.parentServerId))}
                        />
                      </div>
                    );
                  }
                }
              ]}
            />
          )}

          {currentFacet === 'resources' && (
            <SmartTable 
              data={allResources.filter(r => {
                const q = searchFilter.toLowerCase().trim();
                return !q || r.name.toLowerCase().includes(q) || (r.uriPattern || '').toLowerCase().includes(q);
              })}
              columns={[
                {
                  key: 'name',
                  header: 'Resource Name',
                  sortable: true,
                  render: (row: any) => (
                    <div className="flex items-center gap-2">
                      <Link2 className="w-3.5 h-3.5 text-primary" />
                      <Link to={`/resources/${row.parentServerId}__${row.name}`} className="font-semibold text-primary hover:underline">
                        {row.name}
                      </Link>
                    </div>
                  )
                },
                {
                  key: 'server',
                  header: 'Parent Server',
                  render: (row: any) => (
                    <Link to={`/servers/${row.parentServerId}`} className="font-semibold text-gray-550 hover:underline">
                      {row.parentServerName}
                    </Link>
                  )
                },
                {
                  key: 'uriPattern',
                  header: 'URI Pattern',
                  render: (row: any) => <span className="font-mono text-gray-500 select-all">{row.uriPattern}</span>
                },
                {
                  key: 'mimeType',
                  header: 'MIME Type',
                  render: (row: any) => <span className="font-mono text-gray-450">{row.mimeType}</span>
                }
              ]}
            />
          )}

          {currentFacet === 'prompts' && (
            <SmartTable 
              data={allPrompts.filter(p => {
                const q = searchFilter.toLowerCase().trim();
                return !q || p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
              })}
              columns={[
                {
                  key: 'name',
                  header: 'Prompt Name',
                  sortable: true,
                  render: (row: any) => (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <Link to={`/capability-prompts/${row.parentServerId}__${row.name}`} className="font-semibold text-primary hover:underline">
                        {row.name}
                      </Link>
                    </div>
                  )
                },
                {
                  key: 'server',
                  header: 'Parent Server',
                  render: (row: any) => (
                    <Link to={`/servers/${row.parentServerId}`} className="font-semibold text-gray-550 hover:underline">
                      {row.parentServerName}
                    </Link>
                  )
                },
                {
                  key: 'description',
                  header: 'Description',
                  render: (row: any) => <span className="text-gray-500">{row.description}</span>
                },
                {
                  key: 'arguments',
                  header: 'Arguments',
                  render: (row: any) => <span className="font-mono text-gray-700 font-bold">{row.argCount ?? (row.args?.length ?? 0)}</span>
                }
              ]}
            />
          )}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState 
          description="No registered assets match the selected filters or search parameters in this category." 
        />
      ) : isGridView ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const isBookmarked = bookmarks[item.kind]?.includes(item.id) || false;
            
            // Build kind-appropriate stats cards display
            let pills: React.ReactNode[] = [];
            let footerText = `Registered ${new Date(item.registeredAt).toLocaleDateString()}`;

            if (item.kind === 'server') {
              pills = [
                <CatPill key="r" text={`★ ${item.rating.toFixed(1)}`} hue="yellow" />,
                <CatPill key="v" text={`v${item.version}`} hue="gray" />,
                <CatPill key="t" text={(item.tech?.transport || item.transport || 'http').toUpperCase()} hue="blue" />,
                <CatPill key="l" text={`${item.tools?.length || 0} tools`} hue="teal" />
              ];
            } else if (item.kind === 'agent') {
              pills = [
                <CatPill key="r" text={`★ ${item.rating.toFixed(1)}`} hue="yellow" />,
                <CatPill key="v" text={`v${item.version}`} hue="gray" />,
                <CatPill key="a" text={`${item.autonomy} autonomy`} hue="purple" />
              ];
            } else if (item.kind === 'skill') {
              pills = [
                <CatPill key="r" text={`★ ${item.rating.toFixed(1)}`} hue="yellow" />,
                <CatPill key="d" text={`${((item.downloads || 0)/1000).toFixed(1)}k dls`} hue="blue" />,
                <CatPill key="c" text={item.category} hue="teal" />
              ];
              const usages = getUsedBy(item.id);
              footerText = `Used by ${usages.servers.length} servers · ${usages.agents.length} agents`;
            } else if (item.kind === 'prompt') {
              pills = [
                <CatPill key="r" text={`★ ${item.rating.toFixed(1)}`} hue="yellow" />,
                <CatPill key="s" text={item.source} hue="orange" />
              ];
            }

            return (
              <CardShell 
                key={`${item.kind}-${item.id}`}
                kind={item.kind}
                name={item.name}
                subline={item.publisher?.name || item.publisher || item.author || 'Community'}
                description={item.description}
                pills={pills}
                footerText={footerText}
                topRightSlot={
                  <div className="flex items-center gap-1.5">
                    <HealthDot status={getHealthDisplay(item)} />
                    <BookmarkToggle
                      isBookmarked={isBookmarked}
                      onToggle={() => toggleBookmark(item.kind, item.id)}
                    />
                  </div>
                }
                onClick={() => navigate(`/${item.kind}s/${item.id}`)}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
          <SmartTable 
            data={filteredItems} 
            columns={tableColumns} 
            externalToolbar={true} 
            onRowClick={(row) => navigate(`/${row.kind}s/${row.id}`)}
          />
        </div>
      )}

    </div>
  );
};
