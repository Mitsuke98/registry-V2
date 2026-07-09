import React from 'react';
import {
  Shield,
  Bot,
  LineChart,
  Database,
  FileText,
  Globe,
  Wrench,
  MessageSquare,
  Scroll,
  Blocks,
  HelpCircle
} from 'lucide-react';

export const iconMap: Record<string, React.ComponentType<any>> = {
  shield: Shield,
  bot: Bot,
  chart: LineChart,
  database: Database,
  'file-text': FileText,
  globe: Globe,
  wrench: Wrench,
  'message-square': MessageSquare,
  scroll: Scroll,
  blocks: Blocks,
};

interface EntityIconProps {
  name: string;
  size?: number;
  className?: string;
}

export const EntityIcon: React.FC<EntityIconProps> = ({ name, size = 18, className = '' }) => {
  const IconComponent = iconMap[name.toLowerCase()] || HelpCircle;
  return (
    <div className={`size-9 rounded-md border border-border bg-muted flex items-center justify-center shrink-0 select-none ${className}`}>
      <IconComponent className="text-foreground" style={{ width: size, height: size }} />
    </div>
  );
};
