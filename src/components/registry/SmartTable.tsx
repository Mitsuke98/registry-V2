import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface SmartTableColumn<T = any> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface SmartTableFilter<T = any> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  getFilterValue: (row: T) => string;
}

interface SmartTableProps<T = any> {
  columns: SmartTableColumn<T>[];
  rows: T[];
  renderRow?: (row: T, index: number, columns: SmartTableColumn<T>[]) => React.ReactNode;
  filters?: SmartTableFilter<T>[];
  searchPlaceholder?: string;
  searchKeys?: string[]; // dot-notation or simple keys
  className?: string;
  externalToolbar?: boolean;
}

export function SmartTable<T = any>({
  columns,
  rows,
  renderRow,
  filters = [],
  searchPlaceholder = 'Search...',
  searchKeys = [],
  className = '',
  externalToolbar = false
}: SmartTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Helper to extract nested value
  const getNestedValue = (obj: any, keyPath: string): string => {
    if (!obj) return '';
    const parts = keyPath.split('.');
    let current = obj;
    for (const part of parts) {
      if (current[part] === undefined || current[part] === null) {
        return '';
      }
      current = current[part];
    }
    return String(current);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // 1. Search Query Check
      if (searchQuery.trim() !== '' && searchKeys.length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = searchKeys.some(key => {
          const val = getNestedValue(row, key);
          return val.toLowerCase().includes(query);
        });
        if (!matchesSearch) return false;
      }

      // 2. Filter Selects Check
      for (const filter of filters) {
        const selectedValue = activeFilters[filter.key];
        if (selectedValue && selectedValue !== 'all') {
          const rowValue = filter.getFilterValue(row);
          if (rowValue !== selectedValue) return false;
        }
      }

      return true;
    });
  }, [rows, searchQuery, searchKeys, filters, activeFilters]);

  // Reset page when filters/search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  // Pagination bounds
  const totalRowsCount = rows.length;
  const showChrome = externalToolbar ? filteredRows.length > 10 : totalRowsCount > 10;
  const itemsPerPage = 10;

  const paginatedRows = useMemo(() => {
    if (!showChrome) return filteredRows;
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRows, showChrome, currentPage]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;

  const handleFilterChange = (filterKey: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredRows.length);

  return (
    <div className={`space-y-4 ${className}`}>
      {showChrome && !externalToolbar && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-lg border border-border"
            />
          </div>
          {filters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {filters.map(filter => (
                <select
                  key={filter.key}
                  value={activeFilters[filter.key] || 'all'}
                  onChange={e => handleFilterChange(filter.key, e.target.value)}
                  className="h-9 px-3 rounded-lg border border-border bg-background text-xs font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 hover:bg-accent/40"
                >
                  <option value="all">All {filter.label}s</option>
                  {filter.options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          )}
        </div>
      )}

      {paginatedRows.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl select-none">
          No records found.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40 select-none">
              <TableRow className="border-b border-border h-10 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {columns.map(col => (
                  <TableHead key={col.key} className={`font-semibold text-foreground py-2 ${col.className || ''}`}>
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((row, rIdx) => {
                if (renderRow) {
                  return renderRow(row, rIdx, columns);
                }
                return (
                  <TableRow key={rIdx} className="border-b border-border/60 last:border-b-0 h-11 text-[13px]">
                    {columns.map(col => {
                      const rendered = col.render ? col.render(row, rIdx) : getNestedValue(row, col.key);
                      return (
                        <TableCell key={col.key} className={`py-2 text-muted-foreground ${col.className || ''}`}>
                          {rendered}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {showChrome && filteredRows.length > 0 && (
        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground select-none">
          <div>
            Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-foreground">{endIndex}</span> of{' '}
            <span className="font-semibold text-foreground">{filteredRows.length}</span> entries
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-[12px] px-2 min-w-[60px] text-center font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-accent disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
