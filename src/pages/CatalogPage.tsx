import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useSearch, usePageSearch } from '@/context/SearchContext';
import { CardShell } from '@/components/registry/CardShell';
import { FilterBar } from '@/components/registry/FilterBar';
import { DataTable } from '@/components/registry/DataTable';
import { StatRow } from '@/components/registry/StatPrimitive';
import { EntityIcon, ScanGrade, VerifiedBadge, RatingStars, BookmarkToggle } from '@/components/registry/UIHelperKit';
import { FEATURES } from '@/config/features';
import { Badge } from '@/components/ui/badge';

export const CatalogPage: React.FC = () => {
  usePageSearch('Search catalog...');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mcpServers, a2aAgents, skills, prompts, bookmarks } = useRegistry();
  const { query } = useSearch();

  // Facet extraction
  const facet = searchParams.get('facet') || 'all';
  const bookmarkedFilter = searchParams.get('view') === 'bookmarked';
  const [sortBy, setSortBy] = useState('rating');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Sync facet to searchParams
  const setFacet = (newFacet: string) => {
    setSearchParams(prev => {
      if (newFacet === 'all') prev.delete('facet');
      else prev.set('facet', newFacet);
      return prev;
    });
  };

  const handleBookmarkedChange = (val: boolean) => {
    setSearchParams(prev => {
      if (val) prev.set('view', 'bookmarked');
      else prev.delete('view');
      return prev;
    });
  };

  // KPI calculations based on current facet
  const getKPIs = () => {
    if (facet === 'servers') {
      const active = mcpServers.filter(s => s.status === 'approved');
      const avgUptime = active.reduce((acc, s) => acc + s.health.uptimePct, 0) / (active.length || 1);
      const calls = active.reduce((acc, s) => acc + s.weeklyCalls.reduce((sum, c) => sum + c, 0), 0);
      return [
        { value: active.length, label: 'Available Servers' },
        { value: `${avgUptime.toFixed(2)}%`, label: 'Avg Uptime' },
        { value: `${(calls / 1000).toFixed(1)}k`, label: 'Calls (30d)' },
        { value: 'June', label: 'Last Added' }
      ];
    }
    if (facet === 'agents') {
      const active = a2aAgents.filter(a => a.status === 'approved');
      const avgSuccess = active.reduce((acc, a) => acc + a.successRatePct, 0) / (active.length || 1);
      const calls = active.reduce((acc, a) => acc + a.weeklyCalls.reduce((sum, c) => sum + c, 0), 0);
      return [
        { value: active.length, label: 'Available Agents' },
        { value: `${avgSuccess.toFixed(1)}%`, label: 'Avg Success' },
        { value: `${(calls / 1000).toFixed(1)}k`, label: 'Calls (30d)' },
        { value: 'July', label: 'Last Added' }
      ];
    }
    if (facet === 'skills') {
      const active = skills.filter(s => s.status === 'approved');
      const totalDownloads = active.reduce((acc, s) => acc + s.downloads, 0);
      const categoriesCount = new Set(active.map(s => s.category)).size;
      return [
        { value: active.length, label: 'Available Skills' },
        { value: categoriesCount, label: 'Categories' },
        { value: `${(totalDownloads / 1000).toFixed(1)}k`, label: 'Downloads' },
        { value: 'July', label: 'Last Added' }
      ];
    }
    if (facet === 'prompts') {
      const active = prompts.filter(p => p.status === 'approved');
      const sourcesCount = new Set(active.map(p => p.source)).size;
      return [
        { value: active.length, label: 'Available Prompts' },
        { value: sourcesCount, label: 'Unique Sources' },
        { value: 'Today', label: 'Last Used' },
        { value: '—', label: '' }
      ];
    }
    // Default 'all'
    const activeAssets = mcpServers.filter(s => s.status === 'approved').length +
      a2aAgents.filter(a => a.status === 'approved').length +
      skills.filter(s => s.status === 'approved').length +
      (FEATURES.prompts ? prompts.filter(p => p.status === 'approved').length : 0);
    return [
      { value: activeAssets, label: 'Total Assets' },
      { value: '88%', label: 'Verified %' },
      { value: '4.7', label: 'Avg Rating' },
      { value: '14', label: 'Added this month' }
    ];
  };

  // Approved only lists
  const approvedServers = mcpServers.filter(s => s.status === 'approved' && !s.disabled);
  const approvedAgents = a2aAgents.filter(a => a.status === 'approved' && !a.disabled);
  const approvedSkills = skills.filter(s => s.status === 'approved' && !s.disabled);
  const approvedPrompts = FEATURES.prompts ? prompts.filter(p => p.status === 'approved' && !p.disabled) : [];

  // Bookmark count for current facet
  const getBookmarksCount = () => {
    if (facet === 'servers') return bookmarks.server.length;
    if (facet === 'agents') return bookmarks.agent.length;
    if (facet === 'skills') return bookmarks.skill.length;
    if (facet === 'prompts') return bookmarks.prompt.length;
    return bookmarks.server.length + bookmarks.agent.length + bookmarks.skill.length + (FEATURES.prompts ? bookmarks.prompt.length : 0);
  };

  // Skills unique categories
  const skillCategories = Array.from(new Set(approvedSkills.map(sk => sk.category)));

  // Filtered lists matching search term + bookmark filter + category filter
  const getFilteredItems = () => {
    let list: any[] = [];
    const term = query.toLowerCase();

    if (facet === 'all' || facet === 'servers') {
      let filtered = approvedServers.filter(s => s.name.toLowerCase().includes(term) || s.description.toLowerCase().includes(term));
      if (bookmarkedFilter) filtered = filtered.filter(s => bookmarks.server.includes(s.id));
      list.push(...filtered.map(s => ({ ...s, kind: 'server' as const })));
    }

    if (facet === 'all' || facet === 'agents') {
      let filtered = approvedAgents.filter(a => a.name.toLowerCase().includes(term) || a.description.toLowerCase().includes(term));
      if (bookmarkedFilter) filtered = filtered.filter(a => bookmarks.agent.includes(a.id));
      list.push(...filtered.map(a => ({ ...a, kind: 'agent' as const })));
    }

    if (facet === 'all' || facet === 'skills') {
      let filtered = approvedSkills.filter(sk => sk.name.toLowerCase().includes(term) || sk.description.toLowerCase().includes(term));
      if (bookmarkedFilter) filtered = filtered.filter(sk => bookmarks.skill.includes(sk.id));
      if (selectedCategory) filtered = filtered.filter(sk => sk.category === selectedCategory);
      list.push(...filtered.map(sk => ({ ...sk, kind: 'skill' as const })));
    }

    if (FEATURES.prompts && (facet === 'all' || facet === 'prompts')) {
      let filtered = approvedPrompts.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
      if (bookmarkedFilter) filtered = filtered.filter(p => bookmarks.prompt.includes(p.id));
      list.push(...filtered.map(p => ({ ...p, kind: 'prompt' as const })));
    }

    // Sort list
    return list.sort((a, b) => {
      if (sortBy === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sortBy === 'stars') return (b.stars ?? 0) - (a.stars ?? 0);
      return b.name.localeCompare(a.name);
    });
  };

  const filteredItems = getFilteredItems();

  const handleItemClick = (item: any) => {
    navigate(`/${item.kind}s/${item.id}`);
  };

  // Columns definition for DataTable list view
  const columns = [
    {
      header: 'Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-2 font-medium">
          <EntityIcon kind={row.kind} className="size-4" />
          <span>{row.name}</span>
          <Badge variant="outline" className="text-[9.5px] uppercase font-mono py-0 px-1 rounded-sm select-none">
            {row.kind}
          </Badge>
        </div>
      )
    },
    {
      header: 'Publisher / Author',
      accessor: (row: any) => <span>{row.publisher || row.author || 'Community'}</span>
    },
    {
      header: 'Trust / Verification',
      accessor: (row: any) => (
        <div className="flex items-center gap-2 select-none">
          {row.trust.verified && <VerifiedBadge />}
          <ScanGrade score={row.trust.score} />
        </div>
      )
    },
    {
      header: 'Rating',
      accessor: (row: any) => <RatingStars rating={row.rating ?? 0} reviewsCount={row.reviewsCount ?? 0} />
    },
    {
      header: 'Action',
      accessor: (row: any) => (
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          <BookmarkToggle kind={row.kind} id={row.id} />
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Facet tabs strip */}
      <div className="flex items-center justify-between border-b border-border select-none">
        <div className="flex items-center gap-6">
          {(['all', 'servers', 'agents', 'skills', 'prompts'] as const).map((tab) => {
            const isPrompt = tab === 'prompts';
            const disabled = isPrompt && !FEATURES.prompts;
            const isSelected = facet === tab;
            return (
              <button
                key={tab}
                disabled={disabled}
                onClick={() => setFacet(tab)}
                className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                  disabled
                    ? 'opacity-40 cursor-not-allowed'
                    : isSelected
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="capitalize">{tab === 'all' ? 'All Assets' : tab}</span>
                {isPrompt && !FEATURES.prompts && (
                  <span className="ml-1 text-[9px] bg-muted border border-border text-muted-foreground px-1 py-0.5 rounded-sm font-mono font-bold select-none">Gated</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Adaptive Stat Row */}
      <StatRow stats={getKPIs()} />

      {/* FilterBar row */}
      <FilterBar
        bookmarkedOnly={bookmarkedFilter}
        onBookmarkedChange={handleBookmarkedChange}
        bookmarksCount={getBookmarksCount()}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOptions={[
          { label: 'Rating', value: 'rating' },
          { label: 'Name', value: 'name' },
          ...(facet === 'skills' ? [{ label: 'Stars', value: 'stars' }] : [])
        ]}
        viewLayout={viewLayout}
        onViewLayoutChange={setViewLayout}
        categories={facet === 'skills' ? skillCategories : undefined}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Filtered items grid or list render */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
          No assets match the selected filters.
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isVerified = item.trust.verified;
            return (
              <div key={`${item.kind}-${item.id}`} onClick={() => handleItemClick(item)} className="cursor-pointer">
                <CardShell
                  variant="entity"
                  icon={<EntityIcon kind={item.kind} />}
                  title={item.name}
                  subTitle={`by ${item.publisher || item.author || 'Community'}`}
                  description={item.description}
                  actionSlot={<BookmarkToggle kind={item.kind} id={item.id} />}
                  metaPills={[
                    isVerified && <VerifiedBadge key="v" />,
                    <ScanGrade key="g" score={item.trust.score} />
                  ].filter(Boolean) as React.ReactNode[]}
                  footer={
                    <div className="flex items-center justify-between w-full font-mono text-[11px]">
                      <RatingStars rating={item.rating ?? 0} reviewsCount={item.reviewsCount ?? 0} />
                      <span className="uppercase text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">{item.kind}</span>
                    </div>
                  }
                />
              </div>
            );
          })}
        </div>
      ) : (
        <DataTable columns={columns} data={filteredItems} onRowClick={handleItemClick} />
      )}
    </div>
  );
};
