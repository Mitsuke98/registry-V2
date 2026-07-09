import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SearchContextType {
  query: string;
  setQuery: (q: string) => void;
  placeholder: string;
  setPlaceholder: (p: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [query, setQuery] = useState('');
  const [placeholder, setPlaceholder] = useState('Search your registry...');
  const location = useLocation();

  // Reset search query on any route transition
  useEffect(() => {
    setQuery('');
  }, [location.pathname]);

  return (
    <SearchContext.Provider value={{ query, setQuery, placeholder, setPlaceholder }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export const usePageSearch = (placeholderText: string) => {
  const { setPlaceholder } = useSearch();
  useEffect(() => {
    setPlaceholder(placeholderText);
  }, [placeholderText, setPlaceholder]);
};
