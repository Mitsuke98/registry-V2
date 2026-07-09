import React from 'react';
import { EntityIcon } from './iconMap';

interface DetailHeaderProps {
  iconName: string;
  name: string;
  badgeCluster: React.ReactNode;
  description: string;
  metaLine: React.ReactNode;
  tags: string[];
  actionSlot?: React.ReactNode;
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({
  iconName,
  name,
  badgeCluster,
  description,
  metaLine,
  tags,
  actionSlot
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-6 border-b border-border">
      <div className="flex items-start gap-4">
        <EntityIcon 
          name={iconName} 
          size={24} 
          className="size-[44px] rounded-lg border border-border bg-muted flex items-center justify-center shrink-0" 
        />
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground leading-tight">{name}</h1>
            <div className="flex flex-wrap items-center gap-1.5">
              {badgeCluster}
            </div>
          </div>
          <p className="text-[14px] text-muted-foreground max-w-2xl leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted-foreground pt-1 select-none font-mono">
            {metaLine}
          </div>
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map(tag => (
                <span 
                  key={tag} 
                  className="text-[11px] font-medium bg-muted text-muted-foreground px-2 py-0.5 rounded border border-border/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {actionSlot && (
        <div className="flex items-center gap-2 shrink-0 select-none md:self-start self-end">
          {actionSlot}
        </div>
      )}
    </div>
  );
};
