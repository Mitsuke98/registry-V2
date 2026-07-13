import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  PanelLeft, Search, Bell, Sparkles, Plus, ChevronRight, ChevronLeft, ArrowUpDown, 
  LogOut, CornerDownRight, BookMarked, Home, Compass, Briefcase, Layers, 
  CheckCircle2, Settings, Users, RefreshCw, LayoutDashboard
} from 'lucide-react';
import { useRegistry } from '@/data/RegistryContext';
import { EntityIcon } from './Kit';
import { toast } from 'sonner';

// ----------------------------------------------------
// RoleShell - Collapsible Sidebar & Layout
// ----------------------------------------------------
interface SidebarItem {
  label: string;
  path: string;
  icon: any;
}

interface RoleShellProps {
  children: React.ReactNode;
}

export const RoleShell: React.FC<RoleShellProps> = ({ children }) => {
  const { currentUser, setCurrentUser, getApprovals } = useRegistry();
  const [collapsed, setCollapsed] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Title synchronizer — declared before any early return so hook order
  // stays stable across the logged-out -> logged-in transition.
  useEffect(() => {
    if (!currentUser) return;
    const titleMap: Record<string, string> = {
      '/home': 'Home | Agent Nexus',
      '/dashboard': 'Dashboard | Agent Nexus',
      '/catalog': 'Catalog | Agent Nexus',
      '/workspaces': 'Workspaces | Agent Nexus',
      '/my-registry': 'My Registry | Agent Nexus',
      '/approvals': 'Approvals Console | Agent Nexus',
      '/assets': 'Assets Directory | Agent Nexus',
      '/users': 'Users Directory | Agent Nexus',
      '/register': 'Register Asset | Agent Nexus',
    };
    const matched = Object.keys(titleMap).find(key => location.pathname === key || (key !== '/' && location.pathname.startsWith(key)));
    document.title = matched ? titleMap[matched] : 'Agent Nexus';
  }, [location.pathname, currentUser]);

  if (!currentUser) return <>{children}</>;

  const isUser = currentUser.role === 'end_user';

  // Navigation Items per Persona
  const navItems: SidebarItem[] = isUser
    ? [
        { label: 'Home', path: '/home', icon: Home },
        { label: 'Catalog', path: '/catalog', icon: Compass },
        { label: 'My Registry', path: '/my-registry', icon: Layers },
        { label: 'Workspaces', path: '/workspaces', icon: Briefcase },
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: Layers },
        { label: 'Approvals', path: '/approvals', icon: CheckCircle2 },
        { label: 'All assets', path: '/assets', icon: Settings },
        { label: 'Workspaces', path: '/workspaces', icon: Briefcase },
        { label: 'Users', path: '/users', icon: Users },
        { label: 'Catalog', path: '/catalog', icon: Compass },
      ];

  const handleSignOut = () => {
    setCurrentUser(null);
    navigate('/');
    toast.success('Signed out successfully.');
  };

  // Resolve pending queue counts for badges
  const { registrationQueue, yourSubmissions } = getApprovals();
  const pendingCount = isUser 
    ? yourSubmissions.filter(s => s.status === 'pending' || s.status === 'in_review').length
    : registrationQueue.length;

  // Breadcrumbs calculation
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, idx) => {
    const url = '/' + pathParts.slice(0, idx + 1).join('/');
    // Clean display name (e.g. capitalize and replace hyphens)
    const displayName = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
    return { label: displayName, url, isLast: idx === pathParts.length - 1 };
  });

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 font-sans select-none">
      {/* Sidebar */}
      <aside 
        className={`flex flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        } shrink-0 relative z-30`}
      >
        {/* Header Section */}
        <div 
          className="flex items-center justify-between border-b border-gray-200 px-4 py-3 h-14"
          onMouseEnter={() => setIsHeaderHovered(true)}
          onMouseLeave={() => setIsHeaderHovered(false)}
        >
          <div 
            onClick={() => navigate(isUser ? '/home' : '/dashboard')}
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer"
          >
            {/* Logo Mark */}
            <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-primary-foreground font-black text-xs shrink-0 select-none">
              AN
            </div>
            {!collapsed && (
              <span className="font-bold text-sm tracking-tight text-gray-800 select-none">Agent Nexus</span>
            )}
          </div>
          
          {/* Collapse Button */}
          {(!collapsed || isHeaderHovered) && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer focus:outline-none"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2.5 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-xs font-semibold select-none group relative transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0`} />
                {!collapsed && <span>{item.label}</span>}
                
                {/* Collapsed Tooltip */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded opacity-0 pointer-events-none group-hover:opacity-100 group-focus:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-md">
                    {item.label}
                  </div>
                )}

                {/* Submissions Pending Badge */}
                {!collapsed && item.label === 'Submissions' && pendingCount > 0 && (
                  <span className="ml-auto bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
                {!collapsed && item.label === 'Approvals' && pendingCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Workspace Info at Bottom */}
        {!collapsed && (
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {currentUser.role === 'super_admin' ? 'Console Active' : 'Creator Space'}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 border-b border-gray-200 bg-white h-14 shrink-0">
          
          {/* Search Trigger / Palette */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 text-xs text-gray-400 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md max-w-xs w-full text-left cursor-pointer focus:outline-none"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search registry…</span>
            <kbd className="ml-auto font-mono text-[9px] bg-white border border-gray-200 px-1 py-0.5 rounded shadow-sm">
              ⌘K
            </kbd>
          </button>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            
            {/* Register button for End Users only */}
            {isUser && (
              <button 
                onClick={() => navigate('/register')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary cursor-pointer select-none font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                Register
              </button>
            )}

            {/* Notification Bell */}
            <button 
              onClick={() => navigate(isUser ? '/my-registry' : '/approvals')}
              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-655 relative cursor-pointer focus:outline-none"
            >
              <Bell className="w-4.5 h-4.5" />
              {pendingCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full"></span>
              )}
            </button>

            {/* User Avatar Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-xs select-none cursor-pointer focus:outline-none border border-transparent hover:border-gray-200"
              >
                {currentUser.initials}
              </button>

              {isProfileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                  <div className="absolute right-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-md py-1.5 shadow-floating z-50 select-none">
                    <div className="px-3.5 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-800 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-gray-400 truncate">{currentUser.email}</p>
                      <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 px-1 rounded">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                    </div>

                    <button 
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/my-registry');
                      }}
                      className="flex items-center gap-2 w-full px-3.5 py-2 text-left text-xs text-gray-700 hover:bg-gray-50 font-semibold cursor-pointer focus:outline-none"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-gray-400" />
                      My Registry
                    </button>
                    
                    <div className="border-t border-gray-100 my-1"></div>
                    
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 font-semibold cursor-pointer focus:outline-none"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Breadcrumb Strip */}
        <div className="flex items-center px-6 py-2 bg-white border-b border-gray-200/60 text-xs shrink-0 select-none">
          <Link to="/" className="text-gray-400 hover:text-gray-600 font-medium">Agent Nexus</Link>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 mx-1 shrink-0" />
              {crumb.isLast ? (
                <span className="text-gray-800 font-semibold truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <Link to={crumb.url} className="text-gray-400 hover:text-gray-600 font-medium truncate max-w-[150px]">
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} />
    </div>
  );
};

// ----------------------------------------------------
// CardShell - Card components
// ----------------------------------------------------
interface CardShellProps {
  variant?: 'entity' | 'tile';
  kind?: 'server' | 'agent' | 'skill' | 'prompt';
  name: string;
  subline?: string;
  description?: string;
  pills?: React.ReactNode[];
  footerText?: string;
  count?: number;
  onClick?: () => void;
  topRightSlot?: React.ReactNode;
}

export const CardShell: React.FC<CardShellProps> = ({
  variant = 'entity',
  kind = 'server',
  name,
  subline,
  description,
  pills = [],
  footerText,
  count,
  onClick,
  topRightSlot
}) => {
  if (variant === 'tile') {
    return (
      <div 
        onClick={onClick}
        className="flex items-center gap-3.5 p-4 bg-white border border-gray-200 rounded-md hover:bg-gray-50/50 cursor-pointer select-none transition-colors"
      >
        <EntityIcon kind={kind} size="sm" />
        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-gray-800 truncate">{name}</h4>
          {count !== undefined && (
            <p className="text-[11px] text-gray-400 font-mono-custom mt-0.5">{count} registered</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="flex flex-col h-full bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors select-none group relative overflow-hidden"
    >
      <div className="p-4 flex-1 flex flex-col">
        {/* Header Block */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <EntityIcon kind={kind} size="md" />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">
                {name}
              </h3>
              {subline && (
                <p className="text-[11px] text-gray-400 truncate mt-0.5 font-mono-custom">{subline}</p>
              )}
            </div>
          </div>
          
          {/* Top-Right Action/Icon Slot */}
          {topRightSlot && (
            <div className="shrink-0" onClick={e => e.stopPropagation()}>
              {topRightSlot}
            </div>
          )}
        </div>

        {/* Description Body */}
        {description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {/* Pill list */}
        {pills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto pt-2">
            {pills}
          </div>
        )}
      </div>

      {/* Flush Footer */}
      {footerText && (
        <div className="mt-auto px-4 py-2 border-t border-gray-150 bg-gray-50 flex items-center justify-between text-[11px] text-gray-400 select-none">
          <span>{footerText}</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// SmartTable - Table component (the only table)
// ----------------------------------------------------
interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface SmartTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchField?: keyof T;
  filterFields?: { key: string; label: string; options: { label: string; value: string }[] }[];
  filtersState?: Record<string, string>;
  onFiltersChange?: (filters: Record<string, string>) => void;
  externalToolbar?: boolean;
  onRowClick?: (row: T) => void;
  renderExpanded?: (row: T) => React.ReactNode;
}

export function SmartTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchField,
  filterFields = [],
  filtersState,
  onFiltersChange,
  externalToolbar = false,
  onRowClick,
  renderExpanded
}: SmartTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRowId, setExpandedRowId] = useState<string | number | null>(null);

  const activeFilters = filtersState || localFilters;
  const setActiveFilters = onFiltersChange || setLocalFilters;

  // Handle local sorting
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Filter & Search data
  const filteredData = React.useMemo(() => {
    return data.filter(row => {
      // 1. Search filter
      if (searchTerm && searchField) {
        const val = String(row[searchField] || '').toLowerCase();
        if (!val.includes(searchTerm.toLowerCase())) return false;
      }
      
      // 2. Toolbar filters
      for (const field of filterFields) {
        const selectedVal = activeFilters[field.key];
        if (selectedVal && selectedVal !== 'all') {
          // Resolve dotted path if applicable
          const rowVal = field.key.split('.').reduce((acc, part) => acc?.[part], row as any);
          if (String(rowVal) !== selectedVal) return false;
        }
      }

      return true;
    });
  }, [data, searchTerm, searchField, filterFields, activeFilters]);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    const sorted = [...filteredData];
    sorted.sort((a: any, b: any) => {
      // Resolve path
      const valA = sortKey.split('.').reduce((acc, part) => acc?.[part], a);
      const valB = sortKey.split('.').reduce((acc, part) => acc?.[part], b);

      if (valA === undefined || valB === undefined) return 0;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc' 
        ? String(valA).localeCompare(String(valB)) 
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [filteredData, sortKey, sortOrder]);

  // Pagination bounds
  const totalCount = sortedData.length;
  const itemsPerPage = 10;
  const paginated = totalCount > itemsPerPage;
  const paginatedData = React.useMemo(() => {
    if (!paginated) return sortedData;
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, paginated]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="flex flex-col h-full bg-white select-none">
      
      {/* Table Toolbar */}
      {!externalToolbar && (totalCount > itemsPerPage || searchTerm || Object.values(activeFilters).some(v => v && v !== 'all')) && (
        <div className="flex flex-wrap items-center gap-3.5 pb-4 border-b border-gray-150 bg-white">
          {searchField && (
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-gray-250 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {/* Select dropdown filters */}
          {filterFields.map((field) => (
            <select
              key={field.key}
              value={activeFilters[field.key] || ''}
              onChange={e => {
                setActiveFilters({ ...activeFilters, [field.key]: e.target.value });
                setCurrentPage(1);
              }}
              className="px-2.5 py-1.5 text-xs border border-gray-250 rounded bg-white font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="all">All {field.label}s</option>
              {field.options.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}

          {/* Clear Filters indicator */}
          {(searchTerm || Object.values(activeFilters).some(v => v && v !== 'all')) && (
            <button
              onClick={() => {
                setSearchTerm('');
                const resetFilters = { ...activeFilters };
                Object.keys(resetFilters).forEach(k => resetFilters[k] = 'all');
                setActiveFilters(resetFilters);
                setCurrentPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer focus:outline-none"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              {renderExpanded && <th className="w-10 px-4 py-2.5"></th>}
              {columns.map((col) => (
                <th 
                  key={col.key as string}
                  onClick={() => col.sortable && handleSort(col.key as string)}
                  className={`px-4 py-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider select-none ${
                    col.sortable ? 'cursor-pointer hover:bg-gray-100/80' : ''
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <ArrowUpDown className={`w-3 h-3 text-gray-300 ${sortKey === col.key ? 'text-gray-600' : ''}`} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderExpanded ? 1 : 0)} className="px-4 py-8 text-center text-xs text-gray-400 font-medium">
                  No records match current selections.
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const isExpanded = expandedRowId === row.id;
                return (
                  <React.Fragment key={row.id}>
                    <tr 
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest('button') || 
                          target.closest('input') || 
                          target.closest('select') || 
                          target.closest('a') || 
                          target.closest('label')
                        ) {
                          return;
                        }
                        if (renderExpanded) {
                          setExpandedRowId(isExpanded ? null : row.id);
                        } else {
                          onRowClick?.(row);
                        }
                      }}
                      className={`text-xs hover:bg-gray-50/40 transition-colors ${
                        renderExpanded || onRowClick ? 'cursor-pointer' : ''
                      } ${isExpanded ? 'bg-gray-55' : ''}`}
                    >
                      {renderExpanded && (
                        <td className="w-10 px-4 py-2.5 text-gray-400 align-middle">
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-gray-700' : ''}`} />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key as string} className="px-4 py-2.5 text-gray-700 align-middle">
                          {col.render ? col.render(row) : String((row as any)[col.key] || '—')}
                        </td>
                      ))}
                    </tr>
                    {renderExpanded && isExpanded && (
                      <tr className="bg-gray-50/30">
                        <td colSpan={columns.length + 1} className="px-8 py-4 border-t border-gray-100 bg-gray-50/20">
                          {renderExpanded(row)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {paginated && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-150 pt-4 bg-white mt-auto select-none">
          <span className="text-xs text-gray-500 font-mono-custom">
            Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1 px-2.5 text-xs rounded border border-gray-250 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer focus:outline-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-semibold text-gray-700 px-2 font-mono-custom">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1 px-2.5 text-xs rounded border border-gray-250 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer focus:outline-none"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// StatCard / StatRow
// ----------------------------------------------------
interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: number;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  active = false,
  onClick,
  className = ''
}) => {
  const isClickable = !!onClick;
  
  return (
    <div
      onClick={onClick}
      className={`p-4 bg-white rounded-md border text-gray-800 flex flex-col select-none transition-all ${
        active 
          ? 'border-primary ring-1 ring-primary' 
          : 'border-gray-200 hover:border-gray-300'
      } ${isClickable ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono-custom leading-tight tracking-tight">{value}</span>
        {trend !== undefined && (
          <span className="text-[11px] font-bold">
            {trend >= 0 ? (
              <span className="text-emerald-600">▲ +{trend}%</span>
            ) : (
              <span className="text-rose-600">▼ {trend}%</span>
            )}
          </span>
        )}
      </div>
      {subtext && <span className="text-[11px] text-gray-400 mt-1 truncate">{subtext}</span>}
    </div>
  );
};

// ----------------------------------------------------
// FilterBar - Chip collection selector & grid/list toggle
// ----------------------------------------------------
interface FilterBarProps {
  categoryChips?: string[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  tags?: string[];
  selectedTags?: string[];
  onToggleTag?: (tag: string) => void;
  sortByOptions: { label: string; value: string }[];
  selectedSortBy: string;
  onSortByChange: (val: string) => void;
  isGridView: boolean;
  onViewChange: (grid: boolean) => void;
  bookmarkCount?: number;
  filterBookmarked?: boolean;
  onToggleBookmarkFilter?: (active: boolean) => void;
  searchVal?: string;
  onSearchChange?: (val: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  categoryChips = [],
  selectedCategory,
  onSelectCategory,
  tags = [],
  selectedTags = [],
  onToggleTag,
  sortByOptions,
  selectedSortBy,
  onSortByChange,
  isGridView,
  onViewChange,
  bookmarkCount = 0,
  filterBookmarked = false,
  onToggleBookmarkFilter,
  searchVal,
  onSearchChange
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-white border border-gray-200 rounded-md select-none sticky top-0 z-20">
      
      {/* Category Selection Chips */}
      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        
        {/* Bookmarked toggle filter */}
        {onToggleBookmarkFilter && (bookmarkCount > 0 || filterBookmarked) && (
          <button
            onClick={() => onToggleBookmarkFilter(!filterBookmarked)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border select-none cursor-pointer transition-all ${
              filterBookmarked
                ? 'bg-yellow-50 text-yellow-700 border-yellow-300 ring-1 ring-yellow-300'
                : 'bg-white text-gray-600 border-gray-255 hover:bg-gray-50'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Bookmarked ({bookmarkCount})
          </button>
        )}

        {categoryChips.map((chip) => {
          const isSelected = selectedCategory === chip;
          return (
            <button
              key={chip}
              onClick={() => onSelectCategory?.(isSelected ? '' : chip)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border select-none cursor-pointer transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'bg-white text-gray-600 border-gray-255 hover:bg-gray-50'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Sorting & Layout Toggles */}
      <div className="flex items-center gap-3.5 shrink-0 ml-auto">
        {onSearchChange && (
          <div className="relative w-40">
            <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
            <input 
              type="text"
              value={searchVal || ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Filter list..."
              className="w-full pl-6 pr-2 py-1 text-[11px] rounded border border-gray-255 bg-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
          <span>Sort by</span>
          <select
            value={selectedSortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="px-2 py-1 border border-gray-255 rounded bg-white font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            {sortByOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Grid/List View Toggle */}
        <div className="flex border border-gray-200 rounded overflow-hidden shadow-sm shrink-0">
          <button
            onClick={() => onViewChange(true)}
            className={`p-1 px-2.5 text-xs font-semibold select-none cursor-pointer focus:outline-none ${
              isGridView ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => onViewChange(false)}
            className={`p-1 px-2.5 text-xs font-semibold select-none cursor-pointer focus:outline-none ${
              !isGridView ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Tags section */}
      {tags && tags.length > 0 && (
        <div className="w-full flex flex-wrap items-center gap-1.5 pt-2 mt-1 border-t border-gray-100">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Tags:</span>
          {tags.map(tag => {
            const isSelected = selectedTags?.includes(tag) || false;
            return (
              <button
                key={tag}
                onClick={() => onToggleTag?.(tag)}
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md border select-none cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-300'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};

// ----------------------------------------------------
// Wizard - Multistep dialog form with validations
// ----------------------------------------------------
interface Step {
  id: string;
  label: string;
  render: (errors: Record<string, string>, blurHandler: (e: any) => void) => React.ReactNode;
  validate?: () => Record<string, string>;
}

interface WizardProps {
  steps: Step[];
  onSubmit: (formData: any) => Promise<void>;
  onClose: () => void;
  draftKey: string;
  initialData: any;
}

export const Wizard: React.FC<WizardProps> = ({
  steps,
  onSubmit,
  onClose,
  draftKey,
  initialData
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [formData, setFormData] = useState<any>(() => {
    const saved = sessionStorage.getItem(draftKey);
    return saved ? JSON.parse(saved) : initialData;
  });
  const [showDraftNotice, setShowDraftNotice] = useState(() => {
    return !!sessionStorage.getItem(draftKey);
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);


  // Sync session state for draft persistence
  useEffect(() => {
    sessionStorage.setItem(draftKey, JSON.stringify(formData));
  }, [formData, draftKey]);

  const activeStep = steps[currentStepIdx];

  const handleBlur = (e: any) => {
    const { name, value, required } = e.target;
    const nextErrors = { ...errors };
    if (required && !value.trim()) {
      nextErrors[name] = `${name.charAt(0).toUpperCase() + name.slice(1)} is required.`;
    } else {
      delete nextErrors[name];
    }
    setErrors(nextErrors);
  };

  const handleContinue = () => {
    // Run step level validation
    if (activeStep.validate) {
      const stepErrors = activeStep.validate();
      if (Object.keys(stepErrors).length > 0) {
        setErrors(stepErrors);
        toast.error("Please fill in required fields.");
        return;
      }
    }
    setErrors({});
    if (currentStepIdx < steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const discardDraft = () => {
    sessionStorage.removeItem(draftKey);
    setFormData(initialData);
    setShowDraftNotice(false);
    toast.info("Draft discarded.");
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    setPipelineLogs([]);

    const pipelineActions = [
      'Frontmatter parsed: YAML checks verified',
      'Integrity scanner: SHA-256 computed',
      'Dependency resolver: checking permissions posture',
      'Static analysis: verifying executable safety filters',
      'Security grading: code sandbox scan score 95',
      'Publishing transaction queue initialized'
    ];

    let step = 0;
    const interval = setInterval(() => {
      if (step < pipelineActions.length) {
        setPipelineLogs(prev => [...prev, pipelineActions[step]]);
        step++;
      } else {
        clearInterval(interval);
        submitData();
      }
    }, 400);

    const submitData = async () => {
      try {
        await onSubmit(formData);
        sessionStorage.removeItem(draftKey);
        setIsSubmitting(false);
      } catch (err) {
        setIsSubmitting(false);
        toast.error("Submit failed.");
      }
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white text-gray-800 select-none">
      
      {/* Viewport Pinned Header */}
      <header className="flex items-center justify-between px-6 border-b border-gray-200 h-14 shrink-0 bg-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-gray-800">Register Asset Gateway</h2>
        </div>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 focus:outline-none font-bold cursor-pointer"
        >
          ✕
        </button>
      </header>

      {/* Stepper Dot Indicators */}
      <div className="bg-gray-50 border-b border-gray-150 px-6 py-3 flex items-center gap-4 select-none shrink-0 overflow-x-auto">
        {steps.map((st, idx) => (
          <div key={st.id} className="flex items-center gap-2 shrink-0">
            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold border ${
              idx === currentStepIdx 
                ? 'bg-primary text-white border-primary' 
                : idx < currentStepIdx 
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-white text-gray-400 border-gray-300'
            }`}>
              {idx < currentStepIdx ? '✓' : idx + 1}
            </span>
            <span className={`text-xs font-semibold ${
              idx === currentStepIdx ? 'text-gray-800' : 'text-gray-400'
            }`}>
              {st.label}
            </span>
            {idx < steps.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* Draft Restoration Toast Notice */}
      {showDraftNotice && (
        <div className="bg-amber-50 border-b border-amber-250 px-6 py-2 flex items-center justify-between text-xs text-amber-800 select-none shrink-0">
          <span className="font-medium">Draft restored from your previous session.</span>
          <button 
            onClick={discardDraft}
            className="px-2 py-0.5 rounded border border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold cursor-pointer focus:outline-none"
          >
            Discard Draft
          </button>
        </div>
      )}

      {/* Form Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24">
        <div className="max-w-2xl mx-auto">
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-4" />
              <h3 className="text-sm font-bold text-gray-800 mb-2">Simulating Security Scanner Scan Pipeline</h3>
              <div className="w-full max-w-sm bg-gray-900 text-emerald-400 rounded p-4 font-mono text-[11px] text-left leading-relaxed">
                {pipelineLogs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-1">
                    <span className="text-gray-500">✓</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            activeStep.render(errors, handleBlur)
          )}
        </div>
      </div>

      {/* Pinned Viewport Bottom Footer */}
      {!isSubmitting && (
        <footer className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 px-6 flex items-center justify-between select-none z-45">
          <button
            onClick={handleBack}
            disabled={currentStepIdx === 0}
            className="px-3.5 py-1.5 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed select-none cursor-pointer focus:outline-none font-sans"
          >
            Back
          </button>
          
          <button
            onClick={handleContinue}
            className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-95 select-none cursor-pointer focus:outline-none font-sans"
          >
            {currentStepIdx === steps.length - 1 ? 'Submit Registry Request' : 'Continue'}
          </button>
        </footer>
      )}
    </div>
  );
};

// ----------------------------------------------------
// CommandPalette
// ⌘K trigger palette logic
// ----------------------------------------------------
interface CommandPaletteProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, setOpen }) => {
  const { mcpServers, a2aAgents, skills, prompts, currentUser } = useRegistry();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, setOpen]);

  if (!open) return null;

  // Filters visibility rules
  const isApproved = (item: any) => item.status === 'approved' && !item.disabled;
  const isOwner = (item: any) => item.ownerName === currentUser?.name;

  const visibleServers = mcpServers.filter(s => isApproved(s) || isOwner(s));
  const visibleAgents = a2aAgents.filter(a => isApproved(a) || isOwner(a));
  const visibleSkills = skills.filter(sk => isApproved(sk) || isOwner(sk));
  const visiblePrompts = prompts.filter(p => isApproved(p) || isOwner(p));

  // Filter items matching query
  const query = search.toLowerCase().trim();
  const filteredAssets = [
    ...visibleServers.map(s => ({ id: s.id, name: s.name, kind: 'server' as const, desc: s.description, path: `/servers/${s.id}` })),
    ...visibleAgents.map(a => ({ id: a.id, name: a.name, kind: 'agent' as const, desc: a.description, path: `/agents/${a.id}` })),
    ...visibleSkills.map(s => ({ id: s.id, name: s.name, kind: 'skill' as const, desc: s.description, path: `/skills/${s.id}` })),
    ...visiblePrompts.map(p => ({ id: p.id, name: p.name, kind: 'prompt' as const, desc: p.description, path: `/prompts/${p.id}` })),
  ].filter(item => {
    return item.name.toLowerCase().includes(query) || item.id.toLowerCase().includes(query);
  });

  const pageItems = [
    { label: 'Catalog Directory', path: '/catalog', role: 'both' },
    { label: 'Workspace Dashboard', path: '/workspaces', role: 'both' },
    { label: 'Creator Submissions Portal', path: '/submissions', role: 'end_user' },
    { label: 'Platform Home Space', path: '/home', role: 'end_user' },
    { label: 'Executive Admin Dashboard', path: '/dashboard', role: 'super_admin' },
    { label: 'Approvals Console Queue', path: '/approvals', role: 'super_admin' },
    { label: 'Global Assets Manager', path: '/assets', role: 'super_admin' },
    { label: 'User Governance Console', path: '/users', role: 'super_admin' },
  ].filter(p => {
    if (p.role !== 'both' && p.role !== currentUser?.role) return false;
    return p.label.toLowerCase().includes(query);
  });

  const actions = [
    { label: 'Register a new MCP Server', action: () => navigate('/register?kind=server'), role: 'end_user' },
    { label: 'Register a new A2A Agent', action: () => navigate('/register?kind=agent'), role: 'end_user' },
    { label: 'Register a new Skill Code', action: () => navigate('/register?kind=skill'), role: 'end_user' },
    { label: 'Register a new Prompt Template', action: () => navigate('/register?kind=prompt'), role: 'end_user' },
  ].filter(act => {
    if (act.role !== currentUser?.role) return false;
    return act.label.toLowerCase().includes(query);
  });

  const selectItem = (path: string) => {
    navigate(path);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 p-4 pt-16 select-none">
      <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
      <div className="w-full max-w-lg bg-white rounded-lg shadow-floating border border-gray-250 overflow-hidden flex flex-col z-50">
        
        {/* Search Bar Input */}
        <div className="flex items-center gap-2.5 px-3.5 py-3 border-b border-gray-200">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command or search assets..."
            className="w-full text-xs text-gray-800 bg-white focus:outline-none border-none placeholder-gray-400"
            autoFocus
          />
          <span className="text-[10px] text-gray-400 font-mono">ESC to close</span>
        </div>

        {/* Results Container */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          
          {/* Assets Section */}
          {filteredAssets.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1 tracking-wider">Asset Catalog</h4>
              <div className="space-y-0.5">
                {filteredAssets.map(item => (
                  <button
                    key={item.id}
                    onClick={() => selectItem(item.path)}
                    className="flex items-center gap-2.5 w-full text-left p-2 rounded hover:bg-gray-50 text-xs text-gray-700 cursor-pointer focus:outline-none select-none"
                  >
                    <EntityIcon kind={item.kind} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Page Directory Sections */}
          {pageItems.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1 tracking-wider">Navigation shortcuts</h4>
              <div className="space-y-0.5">
                {pageItems.map(p => (
                  <button
                    key={p.path}
                    onClick={() => selectItem(p.path)}
                    className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none select-none"
                  >
                    <span>{p.label}</span>
                    <CornerDownRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions Portal */}
          {actions.length > 0 && (
            <div>
              <h4 className="text-[10px] font-bold text-gray-400 uppercase px-2 py-1 tracking-wider">Registry Actions</h4>
              <div className="space-y-0.5">
                {actions.map(act => (
                  <button
                    key={act.label}
                    onClick={() => { act.action(); setOpen(false); }}
                    className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-gray-50 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none select-none"
                  >
                    <span>{act.label}</span>
                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredAssets.length === 0 && pageItems.length === 0 && actions.length === 0 && (
            <p className="text-center py-6 text-xs text-gray-400 font-medium">
              No matching assets or operations found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// CompareDialog - Side-by-side versions comparison
// ----------------------------------------------------
interface CompareDialogProps {
  assetName: string;
  verA: string;
  verB: string;
  onClose: () => void;
}

export const CompareDialog: React.FC<CompareDialogProps> = ({ assetName, verA, verB, onClose }) => {
  const [isInline, setIsInline] = useState(false);

  // Seed mock lines
  const linesA = [
    '# YAML Frontmatter Metadata',
    'name: "Connection Optimizer"',
    'version: "1.0.0"',
    'network: false',
    'roles:',
    '  - "developer"',
    '  - "analyst"',
    '---',
    '# Handler Logic',
    'def connect_db(url):',
    '    if not url.startswith("postgresql://"):',
    '        raise ValueError("SSL Connection Required")',
    '    return open_pool(url, min_connections=2)',
  ];

  const linesB = [
    '# YAML Frontmatter Metadata',
    'name: "Connection Optimizer"',
    'version: "1.2.0"',
    'network: true',
    'roles:',
    '  - "developer"',
    '  - "analyst"',
    '  - "super_admin"',
    '---',
    '# Handler Logic',
    'def connect_db(url, max_conns=10):',
    '    if not url.startswith("postgresql://"):',
    '        raise ValueError("SSL Connection Required")',
    '    # Security audit key added',
    '    check_tls_compliance(url)',
    '    return open_pool(url, min_connections=2, max_connections=max_conns)',
  ];

  // Simple diff generator
  const getDiffResult = () => {
    // Generate split list
    const diff: { type: 'normal' | 'add' | 'remove'; lineA?: string; lineB?: string }[] = [];
    let i = 0, j = 0;
    while (i < linesA.length || j < linesB.length) {
      const a = linesA[i];
      const b = linesB[j];

      if (a === b) {
        diff.push({ type: 'normal', lineA: a, lineB: b });
        i++; j++;
      } else if (a && (!b || a.length !== b.length)) {
        // If mismatched, simulate removal of A and addition of B
        diff.push({ type: 'remove', lineA: a });
        diff.push({ type: 'add', lineB: b });
        i++; j++;
      } else {
        i++; j++;
      }
    }
    return diff;
  };

  const diffItems = getDiffResult();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-floating border border-gray-250 overflow-hidden flex flex-col h-[500px] z-50">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800">Compare Versions ({assetName})</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 border rounded text-gray-600 font-mono-custom">
              {verA} ↔ {verB}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-655 focus:outline-none font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* View mode toggle bar */}
        <div className="px-4 py-2 border-b border-gray-150 bg-white flex justify-between items-center shrink-0">
          <span className="text-xs text-gray-500 font-semibold">Change Comparison Console</span>
          <div className="flex border border-gray-200 rounded overflow-hidden">
            <button
              onClick={() => setIsInline(false)}
              className={`px-3 py-1 text-xs font-semibold select-none cursor-pointer focus:outline-none ${
                !isInline ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Split View
            </button>
            <button
              onClick={() => setIsInline(true)}
              className={`px-3 py-1 text-xs font-semibold select-none cursor-pointer focus:outline-none ${
                isInline ? 'bg-primary text-primary-foreground' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              Inline View
            </button>
          </div>
        </div>

        {/* Code Diff Display Container */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 font-mono text-[11px] leading-relaxed">
          {isInline ? (
            // Inline view logic
            <div className="border border-gray-200 rounded bg-white overflow-hidden divide-y divide-gray-100">
              {diffItems.map((item, idx) => {
                if (item.type === 'normal') {
                  return (
                    <div key={idx} className="flex px-3 py-0.5 text-gray-700 bg-white">
                      <span className="w-8 select-none text-gray-300 font-mono-custom text-right pr-2"></span>
                      <pre className="whitespace-pre-wrap">{item.lineA}</pre>
                    </div>
                  );
                } else if (item.type === 'remove') {
                  return (
                    <div key={idx} className="flex px-3 py-0.5 text-red-700 bg-red-50/50">
                      <span className="w-8 select-none text-red-300 font-mono-custom text-right pr-2">-</span>
                      <pre className="whitespace-pre-wrap">{item.lineA}</pre>
                    </div>
                  );
                } else {
                  return (
                    <div key={idx} className="flex px-3 py-0.5 text-emerald-700 bg-emerald-50/50">
                      <span className="w-8 select-none text-emerald-300 font-mono-custom text-right pr-2">+</span>
                      <pre className="whitespace-pre-wrap">{item.lineB}</pre>
                    </div>
                  );
                }
              })}
            </div>
          ) : (
            // Split view logic
            <div className="grid grid-cols-2 gap-4 h-full border border-gray-200 rounded bg-white divide-x divide-gray-200">
              
              {/* Left Pane (Version A) */}
              <div className="overflow-x-auto p-2 bg-white">
                <h5 className="text-[10px] font-bold text-gray-400 mb-2 border-b pb-1">VERSION {verA} (Original)</h5>
                <div className="space-y-0.5">
                  {linesA.map((line, idx) => {
                    const isRemoved = linesB[idx] !== line;
                    return (
                      <div key={idx} className={`px-2 py-0.5 rounded ${isRemoved ? 'bg-red-50/40 text-red-700 font-semibold' : 'text-gray-700'}`}>
                        <pre className="whitespace-pre">{line}</pre>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Pane (Version B) */}
              <div className="overflow-x-auto p-2 bg-white">
                <h5 className="text-[10px] font-bold text-gray-400 mb-2 border-b pb-1">VERSION {verB} (Staged Bump)</h5>
                <div className="space-y-0.5">
                  {linesB.map((line, idx) => {
                    const isAdded = linesA[idx] !== line;
                    return (
                      <div key={idx} className={`px-2 py-0.5 rounded ${isAdded ? 'bg-emerald-50/40 text-emerald-700 font-semibold' : 'text-gray-700'}`}>
                        <pre className="whitespace-pre">{line}</pre>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 shrink-0 select-none">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer"
          >
            Close console
          </button>
        </div>
      </div>
    </div>
  );
};
