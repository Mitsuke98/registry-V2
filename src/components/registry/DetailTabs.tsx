import React from 'react';

interface DetailTabItem {
  key: string;
  label: string;
}

interface DetailTabsProps {
  tabs: DetailTabItem[];
  activeTab: string;
  onChange: (key: string) => void;
  rightAction?: React.ReactNode;
}

export const DetailTabs: React.FC<DetailTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  rightAction
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border/80 w-full mb-6 gap-3">
      <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1 min-w-0">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`py-2 px-1 text-[13.5px] font-semibold border-b-2 bg-transparent rounded-none shadow-none translate-y-[1px] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {rightAction && (
        <div className="flex items-center shrink-0 pb-2 md:pb-0 select-none">
          {rightAction}
        </div>
      )}
    </div>
  );
};
