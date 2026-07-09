import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { FEATURES } from '@/config/features';
import {
  Home,
  Layers,
  CheckSquare,
  Search,
  Bell,
  Asterisk,
  PanelLeft,
  ChevronRight,
  Shield,
  Bot,
  Activity,
  Scroll,
  FolderOpen
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';

// Copy block helper to clipboard
export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.error(e);
    }
    document.body.removeChild(textarea);
  }
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, mcpServers, a2aAgents, skills, prompts, getApprovals, setCurrentUser } = useRegistry();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcut for Command Palette
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { waitingOnYou, registrationQueue } = getApprovals();
  const pendingCount = waitingOnYou.length + (currentUser?.role === 'super_admin' ? registrationQueue.length : 0);

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Catalog', path: '/catalog', icon: Layers },
    { label: 'Workspaces', path: '/workspaces', icon: FolderOpen },
    { label: 'Approvals', path: '/approvals', icon: CheckSquare, badge: pendingCount > 0 ? pendingCount : undefined },
  ];

  // Helper to resolve route details or prompts dialog
  const handleCommandSelect = (item: any) => {
    setCommandPaletteOpen(false);
    if (item.action) {
      item.action();
    } else if (item.route) {
      navigate(item.route);
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    navigate('/');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans antialiased text-foreground">
      {/* Collapsible Sidebar */}
      <aside
        className={`h-full flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 select-none transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-[260px]'
        }`}
      >
        {/* Logo row */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-sidebar-border relative">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              <Asterisk className="size-5 stroke-[2.5]" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-[16px] font-bold tracking-tight text-foreground">Registry</span>
            )}
          </div>

          {/* Sidebar LeftPanel Toggle Button */}
          {!sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1 rounded hover:bg-sidebar-accent/60 text-muted-foreground hover:text-foreground cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            >
              <PanelLeft className="size-4" />
            </button>
          ) : (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="absolute inset-0 w-full h-full flex items-center justify-center opacity-0 hover:opacity-100 bg-sidebar/90 text-foreground cursor-pointer"
            >
              <PanelLeft className="size-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-3 py-4 space-y-1 ${sidebarCollapsed ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {navItems.map((item) => {
            const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.label}
                to={item.path}
                className={`flex items-center gap-3 h-10 px-3 rounded-lg transition-all duration-150 relative ${
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
                }`}
              >
                <Icon className="size-5 shrink-0" />
                {!sidebarCollapsed && <span className="text-[13.5px]">{item.label}</span>}
                {!sidebarCollapsed && item.badge !== undefined && (
                  <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full tabular-nums">
                    {item.badge}
                  </span>
                )}
                {sidebarCollapsed && (
                  <div className="absolute left-14 bg-popover text-popover-foreground text-xs px-2.5 py-1.5 rounded border shadow-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Profile info */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-sidebar-accent/60 text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary border-none bg-transparent">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary text-[11px] font-bold">
                  {currentUser?.initials}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-foreground leading-none truncate">
                    {currentUser?.name}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5 border border-primary/20 px-1 rounded inline-block bg-primary/5 capitalize scale-90 origin-left">
                    {currentUser?.role === 'super_admin' ? 'Super Admin' : 'End User'}
                  </div>
                </div>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-popover border border-border shadow-lg p-1">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-2 py-1.5 text-xs text-muted-foreground">My Account</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/workspaces')} className="cursor-pointer text-xs">
                My Workspaces
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/my-registry')} className="cursor-pointer text-xs">
                My Registry
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer text-xs font-semibold">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="h-14 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          {/* Unified search button trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center justify-between w-64 h-9 px-3 rounded-lg border border-border bg-background hover:bg-accent/60 text-muted-foreground hover:text-foreground text-[13px] transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="flex items-center gap-2">
              <Search className="size-4" />
              <span>Search registry…</span>
            </span>
            <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border/80">⌘K</kbd>
          </button>

          {/* Action slots */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/approvals')}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent/40 rounded-lg relative cursor-pointer focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Bell className="size-4" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 bg-amber-500 rounded-full" />
              )}
            </button>

            <button
              onClick={() => navigate('/register')}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-4 h-9 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Register
            </button>
          </div>
        </header>

        {/* Breadcrumb row */}
        <div className="h-10 border-b border-border bg-muted/20 flex items-center px-6 shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground select-none">
            <span className="hover:text-foreground cursor-pointer" onClick={() => navigate('/')}>Home</span>
            {location.pathname !== '/' && (
              <>
                <ChevronRight className="size-3.5" />
                <span className="text-foreground capitalize font-medium">
                  {location.pathname.split('/').filter(Boolean).join(' / ')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto px-16 py-6">
          {children}
        </main>
      </div>

      {/* Command Palette dialog */}
      <Dialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
        <DialogContent className="p-0 overflow-hidden max-w-lg bg-popover border border-border rounded-lg shadow-xl">
          <Command className="rounded-lg border-0 bg-transparent">
            <CommandInput placeholder="Search registry or type a command..." />
            <CommandList className="max-h-[300px] overflow-y-auto p-2">
              <CommandEmpty>No results found.</CommandEmpty>

              <CommandGroup heading="Results">
                {/* Servers fuzzy search */}
                {mcpServers.filter(s => s.status === 'approved' && !s.disabled).map(s => (
                  <CommandItem
                    key={s.id}
                    onSelect={() => handleCommandSelect({ route: `/servers/${s.id}` })}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/60 cursor-pointer text-xs text-foreground"
                  >
                    <Activity className="size-3.5 text-primary shrink-0" />
                    <span className="font-semibold">{s.name}</span>
                    <span className="text-muted-foreground truncate">{s.description}</span>
                  </CommandItem>
                ))}

                {/* Agents fuzzy search */}
                {a2aAgents.filter(a => a.status === 'approved' && !a.disabled).map(a => (
                  <CommandItem
                    key={a.id}
                    onSelect={() => handleCommandSelect({ route: `/agents/${a.id}` })}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/60 cursor-pointer text-xs text-foreground"
                  >
                    <Bot className="size-3.5 text-primary shrink-0" />
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-muted-foreground truncate">{a.description}</span>
                  </CommandItem>
                ))}

                {/* Skills fuzzy search */}
                {skills.filter(sk => sk.status === 'approved' && !sk.disabled).map(sk => (
                  <CommandItem
                    key={sk.id}
                    onSelect={() => handleCommandSelect({ route: `/skills/${sk.id}` })}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/60 cursor-pointer text-xs text-foreground"
                  >
                    <Shield className="size-3.5 text-primary shrink-0" />
                    <span className="font-semibold">{sk.name}</span>
                    <span className="text-muted-foreground truncate">{sk.description}</span>
                  </CommandItem>
                ))}

                {/* Prompts fuzzy search */}
                {FEATURES.prompts && prompts.filter(p => p.status === 'approved' && !p.disabled).map(p => (
                  <CommandItem
                    key={p.id}
                    onSelect={() => handleCommandSelect({ route: `/prompts/${p.id}` })}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-accent/60 cursor-pointer text-xs text-foreground"
                  >
                    <Scroll className="size-3.5 text-primary shrink-0" />
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-muted-foreground truncate">{p.description}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Pages">
                <CommandItem onSelect={() => handleCommandSelect({ route: '/' })} className="cursor-pointer text-xs">Home</CommandItem>
                <CommandItem onSelect={() => handleCommandSelect({ route: '/catalog' })} className="cursor-pointer text-xs">Catalog</CommandItem>
                <CommandItem onSelect={() => handleCommandSelect({ route: '/workspaces' })} className="cursor-pointer text-xs">Workspaces</CommandItem>
                <CommandItem onSelect={() => handleCommandSelect({ route: '/approvals' })} className="cursor-pointer text-xs">Approvals</CommandItem>
                <CommandItem onSelect={() => handleCommandSelect({ route: '/my-registry' })} className="cursor-pointer text-xs">My Registry</CommandItem>
              </CommandGroup>

              <CommandGroup heading="Actions">
                <CommandItem onSelect={() => handleCommandSelect({ route: '/register' })} className="cursor-pointer text-xs flex items-center justify-between">
                  <span>Register an asset</span>
                  <span className="text-[10px] text-muted-foreground">wizard</span>
                </CommandItem>
                <CommandItem onSelect={() => handleCommandSelect({ action: () => setSidebarCollapsed(!sidebarCollapsed) })} className="cursor-pointer text-xs flex items-center justify-between">
                  <span>Toggle Sidebar collapse</span>
                  <kbd className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border/80">Ctrl+\</kbd>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
};
