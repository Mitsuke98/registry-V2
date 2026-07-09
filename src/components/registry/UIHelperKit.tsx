import React, { useState } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { BadgeCheck, Star, Shield, Bot, Scroll, Activity, AlertTriangle, Bookmark } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

// Copy block helper to clipboard
export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.error(e);
    }
    document.body.removeChild(textarea);
  }
};

// EntityIcon helper
export const EntityIcon: React.FC<{ name?: string; kind?: string; className?: string }> = ({ kind, className = "size-5" }) => {
  const tintClass = "p-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0";
  if (kind === 'server') {
    return <div className={tintClass}><Activity className={className} /></div>;
  }
  if (kind === 'agent') {
    return <div className={tintClass}><Bot className={className} /></div>;
  }
  if (kind === 'skill') {
    return <div className={tintClass}><Shield className={className} /></div>;
  }
  return <div className={tintClass}><Scroll className={className} /></div>;
};

// VerifiedBadge helper
export const VerifiedBadge: React.FC = () => {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
      <BadgeCheck className="size-3.5 fill-emerald-700 text-white" />
      <span>Verified</span>
    </span>
  );
};

// ScanGrade helper
export const ScanGrade: React.FC<{ score: number }> = ({ score }) => {
  let colorClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let dotColor = "bg-emerald-500";
  let grade = "A";

  if (score >= 85) {
    grade = score >= 95 ? "A" : "B";
    colorClass = "bg-emerald-50 text-emerald-700 border border-emerald-200";
    dotColor = "bg-emerald-500";
  } else if (score >= 70) {
    grade = "C";
    colorClass = "bg-amber-50 text-amber-700 border border-amber-200";
    dotColor = "bg-amber-500";
  } else {
    grade = score >= 50 ? "D" : "F";
    colorClass = "bg-red-50 text-red-700 border border-red-200";
    dotColor = "bg-red-500";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${colorClass}`}>
      <span className={`size-1.5 rounded-full ${dotColor}`} />
      <span>Score {score} ({grade})</span>
    </span>
  );
};

// StatusBadge helper
export const StatusBadge: React.FC<{ status: 'approved' | 'pending' | 'rejected' | 'in_review' | string }> = ({ status }) => {
  let styleClass = "badge-status-approved";
  let labelText = status;
  if (status === 'pending') {
    styleClass = "badge-status-pending";
  } else if (status === 'rejected') {
    styleClass = "badge-status-rejected";
  } else if (status === 'in_review') {
    styleClass = "badge-status-in_review";
    labelText = "in review";
  }

  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wider ${styleClass}`}>
      {labelText}
    </span>
  );
};

// RatingStars display-only component
export const RatingStars: React.FC<{ rating: number; reviewsCount: number }> = ({ rating, reviewsCount }) => {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-foreground select-none">
      <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
      <span className="font-semibold tabular-nums">{rating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewsCount})</span>
    </span>
  );
};

// RatePopover hover-preview picker
export const RatePopover: React.FC<{ kind: 'server' | 'agent' | 'skill' | 'prompt'; id: string }> = ({ kind, id }) => {
  const { rateItem, userRatings } = useRegistry();
  const [hovered, setHovered] = useState<number | null>(null);
  const currentRating = userRatings[`${kind}:${id}`] || 0;

  const handleRate = (value: number) => {
    rateItem(kind, id, value);
    toast.success(`You rated this ${kind} ${value} stars!`);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="h-9 px-3 rounded-lg border border-border bg-background hover:bg-accent/60 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer">
          <Star className={`size-3.5 ${currentRating > 0 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
          <span>{currentRating > 0 ? `Rated ${currentRating} ★` : 'Rate'}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3 bg-popover border border-border shadow-md rounded-lg text-popover-foreground">
        <div className="text-xs font-semibold mb-2 select-none">Submit your rating</div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => handleRate(star)}
              className="p-1 cursor-pointer focus:outline-none"
            >
              <Star
                className={`size-6 transition-all ${
                  star <= (hovered ?? currentRating)
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/45'
                }`}
              />
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// BookmarkToggle component
export const BookmarkToggle: React.FC<{ kind: 'server' | 'agent' | 'skill' | 'prompt'; id: string }> = ({ kind, id }) => {
  const { bookmarks, toggleBookmark } = useRegistry();
  const isBookmarked = bookmarks[kind]?.includes(id) ?? false;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(kind, id);
    if (isBookmarked) {
      toast.success('Removed from bookmarks');
    } else {
      toast.success('Saved to bookmarks');
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={`p-2 rounded-lg border border-border hover:bg-accent/60 cursor-pointer ${
        isBookmarked ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-background text-muted-foreground hover:text-foreground'
      }`}
    >
      <Bookmark className={`size-4 ${isBookmarked ? 'fill-current text-primary' : ''}`} />
    </button>
  );
};

// CopyBlock component
export const CopyBlock: React.FC<{ code: string }> = ({ code }) => {
  const handleCopy = () => {
    copyText(code);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="relative group rounded-lg border border-border bg-muted/30 p-4 font-mono text-[13px] leading-relaxed text-foreground select-all overflow-x-auto max-w-full">
      <pre>{code}</pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 bg-background border border-border text-[11px] font-semibold px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 hover:bg-accent/60 cursor-pointer transition-opacity select-none"
      >
        Copy
      </button>
    </div>
  );
};

// EmptyState component
export const EmptyState: React.FC<{ message: string; actionLabel?: string; onAction?: () => void }> = ({ message, actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-border rounded-xl text-center select-none">
      <AlertTriangle className="size-8 text-muted-foreground/60 mb-3" />
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-4 h-9 rounded-lg transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// TrendArrow component
export const TrendArrow: React.FC<{ value: number; unit?: string; isWorsening?: boolean }> = ({ value, unit = "%", isWorsening = false }) => {
  const isUp = value >= 0;
  const displayVal = Math.abs(value).toFixed(1);
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${isWorsening ? 'text-destructive' : 'text-emerald-700'}`}>
      <span>{isUp ? '↑' : '↓'}</span>
      <span>{displayVal}{unit}</span>
    </span>
  );
};

// SegmentedStatPill component
export const SegmentedStatPill: React.FC<{ left: string; right: string }> = ({ left, right }) => {
  return (
    <span className="inline-flex items-center border border-border rounded-full text-xs font-medium bg-muted/40 select-none overflow-hidden h-6 tabular-nums">
      <span className="px-2.5 py-0.5 border-r border-border">{left}</span>
      <span className="px-2.5 py-0.5 text-muted-foreground">{right}</span>
    </span>
  );
};
