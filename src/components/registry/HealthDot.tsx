import React from 'react';

interface HealthDotProps {
  health: 'healthy' | 'degraded' | 'down';
}

export const HealthDot: React.FC<HealthDotProps> = ({ health }) => {
  const styles = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
  };

  const labels = {
    healthy: 'Healthy',
    degraded: 'Degraded',
    down: 'Down',
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground select-none">
      <span className={`size-2 rounded-full ${styles[health]}`} />
      <span className="text-[13px]">{labels[health]}</span>
    </span>
  );
};
