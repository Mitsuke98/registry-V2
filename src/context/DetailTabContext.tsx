import React, { createContext, useContext, useState } from 'react';

interface DetailTabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const DetailTabContext = createContext<DetailTabContextType | undefined>(undefined);

export const DetailTabProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState('');
  return (
    <DetailTabContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </DetailTabContext.Provider>
  );
};

export const useDetailTab = () => {
  const context = useContext(DetailTabContext);
  return context; // Can be undefined on non-detail pages
};
