import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Grid, List } from 'lucide-react';

interface FilterBarProps {
  // Bookmarked toggle
  bookmarkedOnly: boolean;
  onBookmarkedChange: (val: boolean) => void;
  bookmarksCount: number;

  // Category chip (Skills facet only)
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;

  // Sorting
  sortBy: string;
  onSortByChange: (val: string) => void;
  sortOptions: { label: string; value: string }[];

  // Grid/List toggle layout view
  viewLayout: 'grid' | 'list';
  onViewLayoutChange: (val: 'grid' | 'list') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  bookmarkedOnly,
  onBookmarkedChange,
  bookmarksCount,
  categories,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortByChange,
  sortOptions,
  viewLayout,
  onViewLayoutChange
}) => {
  return (
    <div className="space-y-4 border-b border-border pb-4 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Bookmark chip */}
          <button
            onClick={() => onBookmarkedChange(!bookmarkedOnly)}
            className={`h-8 px-3 rounded-full border text-xs font-semibold cursor-pointer transition-all duration-150 ${
              bookmarkedOnly
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground hover:text-foreground border-border'
            }`}
          >
            Bookmarked ({bookmarksCount})
          </button>

          {/* Sort by Select */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort by</span>
            <Select value={sortBy} onValueChange={(val) => val && onSortByChange(val)}>
              <SelectTrigger className="h-8 w-36 text-xs bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {sortOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-1 border border-border rounded-lg p-0.5 bg-muted/40 h-8">
          <button
            onClick={() => onViewLayoutChange('grid')}
            className={`p-1 rounded cursor-pointer h-7 w-7 flex items-center justify-center transition-colors ${
              viewLayout === 'grid' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Grid className="size-4" />
          </button>
          <button
            onClick={() => onViewLayoutChange('list')}
            className={`p-1 rounded cursor-pointer h-7 w-7 flex items-center justify-center transition-colors ${
              viewLayout === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      {/* Skill categories chips row */}
      {categories && onCategoryChange && categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-t border-border/40 pt-3">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(isSelected ? '' : cat)}
                className={`h-8 px-3.5 rounded-full border text-xs font-semibold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
