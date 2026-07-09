import React from 'react';
import { Card } from '@/components/ui/card';

export interface StatusPillConfig {
  label: string;
  value: string;
  variant: 'health' | 'approval' | 'neutral';
}

interface StatusPillCardProps {
  pills: StatusPillConfig[];
}

export const StatusPillCard: React.FC<StatusPillCardProps> = ({ pills }) => {
  const getBadgeStyles = (variant: 'health' | 'approval' | 'neutral', value: string) => {
    const val = value.toLowerCase();
    if (variant === 'health') {
      if (val === 'healthy' || val === 'up') {
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      }
      if (val === 'degraded' || val === 'warn') {
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      }
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }

    if (variant === 'approval') {
      if (val === 'approved') {
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      }
      if (val === 'pending') {
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      }
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
    }

    // neutral
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Card className="bg-card border-border rounded-xl shadow-none p-4 select-none">
      <div className="flex flex-wrap items-center justify-around gap-y-4 md:gap-y-0 divide-y md:divide-y-0 md:divide-x divide-border/60">
        {pills.map((pill, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col items-center justify-center flex-1 min-w-[120px] px-4 ${
              idx > 0 ? 'pt-3 md:pt-0' : ''
            }`}
          >
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
              {pill.label}
            </span>
            <span className={`text-[12.5px] px-3 py-1 rounded-full font-semibold border capitalize leading-none ${getBadgeStyles(pill.variant, pill.value)}`}>
              {pill.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
};
