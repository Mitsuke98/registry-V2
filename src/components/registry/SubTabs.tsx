import React from 'react';

interface SubTabItem {
  key: string;
  label: string;
}

interface SubTabsProps {
  tabs: SubTabItem[];
  activeTab: string;
  onChange: (key: string) => void;
}

export const SubTabs: React.FC<SubTabsProps> = ({
  tabs,
  activeTab,
  onChange
}) => {
  return (
    <div className="inline-flex items-center p-1 rounded-lg bg-muted/60 border border-border/30 select-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`text-xs font-semibold py-1.5 px-3.5 rounded-md transition-all cursor-pointer ${
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
