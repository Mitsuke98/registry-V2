import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Columns, Eye } from 'lucide-react';

interface CompareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  v1Name: string;
  v2Name: string;
  v1Content: string;
  v2Content: string;
}

interface DiffLine {
  type: 'addition' | 'removal' | 'unchanged';
  value: string;
}

// Custom line-by-line diffing algorithm
function diffLines(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const result: DiffLine[] = [];

  let i = 0, j = 0;
  while (i < lines1.length || j < lines2.length) {
    if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
      result.push({ type: 'unchanged', value: lines1[i] });
      i++;
      j++;
    } else if (j < lines2.length && (i >= lines1.length || !lines1.slice(i).includes(lines2[j]))) {
      result.push({ type: 'addition', value: lines2[j] });
      j++;
    } else {
      result.push({ type: 'removal', value: lines1[i] });
      i++;
    }
  }
  return result;
}

export const CompareDialog: React.FC<CompareDialogProps> = ({
  open,
  onOpenChange,
  v1Name,
  v2Name,
  v1Content,
  v2Content
}) => {
  const [viewMode, setViewMode] = useState<'inline' | 'split'>('split');

  const diffResult = useMemo(() => {
    return diffLines(v1Content, v2Content);
  }, [v1Content, v2Content]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] w-full max-h-[85vh] flex flex-col p-6 bg-card border border-border rounded-xl">
        <DialogHeader className="mb-2 select-none">
          <DialogTitle className="text-base font-bold text-foreground">
            Compare Versions: {v1Name} vs {v2Name}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Showing changes between older version {v1Name} (left/removed) and newer version {v2Name} (right/added).
          </DialogDescription>
        </DialogHeader>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-3 select-none">
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-muted/60 border border-border/30">
            <button
              onClick={() => setViewMode('split')}
              className={`text-xs font-semibold py-1.5 px-3 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Columns className="size-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('inline')}
              className={`text-xs font-semibold py-1.5 px-3 rounded-md transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                viewMode === 'inline'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Eye className="size-3.5" />
              <span>Inline</span>
            </button>
          </div>
        </div>

        {/* Diff Content Viewport */}
        <div className="flex-1 overflow-auto border border-border/80 rounded-lg bg-muted/20 font-mono text-[12px] leading-relaxed max-h-[50vh]">
          {viewMode === 'inline' ? (
            <div className="divide-y divide-border/20 p-2 whitespace-pre min-w-full">
              {diffResult.map((line, idx) => {
                let bgStyle = '';
                let prefix = ' ';
                if (line.type === 'addition') {
                  bgStyle = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded';
                  prefix = '+';
                } else if (line.type === 'removal') {
                  bgStyle = 'bg-red-500/10 text-red-700 dark:text-red-400 line-through px-2 py-0.5 rounded';
                  prefix = '-';
                } else {
                  bgStyle = 'text-muted-foreground px-2 py-0.5';
                }

                return (
                  <div key={idx} className={`flex ${bgStyle} select-all`}>
                    <span className="w-5 shrink-0 opacity-40 select-none">{prefix}</span>
                    <span>{line.value || ' '}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-border/60 min-w-[700px] h-full">
              {/* Left Column (Version 1 / Removed) */}
              <div className="p-2 overflow-x-auto whitespace-pre">
                <div className="text-[10px] font-bold text-muted-foreground uppercase border-b border-border/40 pb-1 mb-2 select-none">
                  {v1Name} (Original)
                </div>
                <div className="divide-y divide-border/10">
                  {diffResult.map((line, idx) => {
                    if (line.type === 'addition') {
                      return <div key={`left-${idx}`} className="h-5 bg-muted/30 opacity-20" />;
                    }
                    const isRemoval = line.type === 'removal';
                    return (
                      <div
                        key={`left-${idx}`}
                        className={`flex h-5 ${
                          isRemoval ? 'bg-red-500/10 text-red-700 dark:text-red-400 font-semibold px-1 rounded' : 'text-muted-foreground px-1'
                        } select-all`}
                      >
                        <span className="w-6 shrink-0 opacity-30 select-none text-right pr-2">
                          {isRemoval ? '-' : ' '}
                        </span>
                        <span className="truncate">{line.value || ' '}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column (Version 2 / Added) */}
              <div className="p-2 overflow-x-auto whitespace-pre">
                <div className="text-[10px] font-bold text-muted-foreground uppercase border-b border-border/40 pb-1 mb-2 select-none">
                  {v2Name} (Updated)
                </div>
                <div className="divide-y divide-border/10">
                  {diffResult.map((line, idx) => {
                    if (line.type === 'removal') {
                      return <div key={`right-${idx}`} className="h-5 bg-muted/30 opacity-20" />;
                    }
                    const isAddition = line.type === 'addition';
                    return (
                      <div
                        key={`right-${idx}`}
                        className={`flex h-5 ${
                          isAddition ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-1 rounded' : 'text-muted-foreground px-1'
                        } select-all`}
                      >
                        <span className="w-6 shrink-0 opacity-30 select-none text-right pr-2">
                          {isAddition ? '+' : ' '}
                        </span>
                        <span className="truncate">{line.value || ' '}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end pt-4 mt-2 select-none">
          <Button
            onClick={() => onOpenChange(false)}
            className="h-9 px-5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95"
          >
            Close Diff
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
