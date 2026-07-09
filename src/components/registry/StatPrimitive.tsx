import React from 'react';
import { TrendArrow } from './UIHelperKit';

interface StatProps {
  value: string | number;
  label: string;
  trend?: number;
  trendUnit?: string;
  isWorsening?: boolean;
  caption?: string;
}

export const StatCard: React.FC<StatProps> = ({ value, label, trend, trendUnit, isWorsening, caption }) => {
  return (
    <div className="p-5 rounded-xl border border-border bg-card shadow-sm select-none">
      <div className="text-[26px] font-bold text-foreground font-sans tracking-tight tabular-nums leading-none mb-2">
        {value}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-muted-foreground font-medium">{label}</span>
        {trend !== undefined && (
          <TrendArrow value={trend} unit={trendUnit} isWorsening={isWorsening} />
        )}
      </div>
      {caption && (
        <div className="text-[10px] text-muted-foreground mt-1.5 border-t border-border/50 pt-1.5 font-mono truncate" title={caption}>
          {caption}
        </div>
      )}
    </div>
  );
};

export const StatRow: React.FC<{ stats: StatProps[] }> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <StatCard key={idx} {...stat} />
      ))}
    </div>
  );
};
