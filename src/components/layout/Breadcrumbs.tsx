import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { useDetailTab } from '@/context/DetailTabContext';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const { mcpServers, a2aAgents, skills, workspaces } = useRegistry();
  const detailTabContext = useDetailTab();
  const activeTab = detailTabContext?.activeTab;

  const pathSegments = location.pathname.split('/').filter(Boolean);

  const fmtTab = (tab: string) =>
    tab.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const getBreadcrumbs = () => {
    const items = [{ label: 'Home', path: '/' }];

    if (pathSegments.length === 0) return items;

    const [seg0, seg1, seg2] = pathSegments;

    if (seg0 === 'servers') {
      items.push({ label: 'MCP Servers', path: '/servers' });
      if (seg1 === 'workspaces') {
        items.push({ label: 'Workspaces', path: '/servers/workspaces' });
        if (seg2) {
          const ws = workspaces.find((w) => w.id === seg2);
          items.push({ label: ws?.name ?? seg2, path: `/servers/workspaces/${seg2}` });
        }
      } else if (seg1 === 'register') {
        items.push({ label: 'Register server', path: '/servers/register' });
      } else if (seg1) {
        const server = mcpServers.find((s) => s.id === seg1);
        items.push({ label: server?.name ?? seg1, path: `/servers/${seg1}` });
        if (activeTab) items.push({ label: fmtTab(activeTab), path: '' });
      } else {
        items.push({ label: 'Explore', path: '/servers' });
      }

    } else if (seg0 === 'agents') {
      items.push({ label: 'A2A Agents', path: '/agents' });
      if (seg1 === 'workspaces') {
        items.push({ label: 'Workspaces', path: '/agents/workspaces' });
        if (seg2) {
          const ws = workspaces.find((w) => w.id === seg2);
          items.push({ label: ws?.name ?? seg2, path: `/agents/workspaces/${seg2}` });
        }
      } else if (seg1 === 'register') {
        items.push({ label: 'Register agent', path: '/agents/register' });
      } else if (seg1) {
        const agent = a2aAgents.find((a) => a.id === seg1);
        items.push({ label: agent?.name ?? seg1, path: `/agents/${seg1}` });
        if (activeTab) items.push({ label: fmtTab(activeTab), path: '' });
      } else {
        items.push({ label: 'Explore', path: '/agents' });
      }

    } else if (seg0 === 'browse' && seg1) {
      items.push({ label: 'Browse', path: '' });
      const formattedEntity = seg1.charAt(0).toUpperCase() + seg1.slice(1);
      items.push({ label: formattedEntity, path: `/browse/${seg1}` });

    } else if (seg0 === 'skills') {
      items.push({ label: 'SkillHub', path: '/skills' });
      if (!seg1 || seg1 === 'explore') {
        items.push({ label: 'Explore', path: '/skills' });
      } else if (seg1 === 'starred') {
        items.push({ label: 'Starred', path: '/skills/starred' });
      } else if (seg1 === 'register') {
        items.push({ label: 'Register skill', path: '/skills/register' });
      } else if (seg1 === 'workspaces') {
        items.push({ label: 'Workspaces', path: '/skills/workspaces' });
        if (seg2) {
          const ws = workspaces.find((w) => w.id === seg2);
          items.push({ label: ws?.name ?? seg2, path: `/skills/workspaces/${seg2}` });
        }
      } else {
        const skill = skills.find((s) => s.id === seg1);
        items.push({ label: skill?.name ?? seg1, path: `/skills/${seg1}` });
        if (activeTab) items.push({ label: fmtTab(activeTab), path: '' });
      }

    } else if (seg0 === 'prompts') {
      items.push({ label: 'Prompt Store', path: '/prompts' });
      if (!seg1) {
        items.push({ label: 'Explore', path: '/prompts' });
      } else if (seg1 === 'starred') {
        items.push({ label: 'Starred', path: '/prompts/starred' });
      } else if (seg1 === 'register') {
        items.push({ label: 'Register prompt', path: '/prompts/register' });
      }
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="h-11 px-8 flex items-center border-b border-border bg-card">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {isLast || !item.path ? (
                    <BreadcrumbPage className="text-foreground font-medium select-none text-[13.5px]">
                      {item.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      render={<Link to={item.path} />}
                      className="text-muted-foreground hover:text-foreground transition-colors duration-150 text-[13.5px]"
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
