import React, { useState, useRef, useEffect } from 'react';
import { 
  Server, Cpu, Terminal, Wrench, ShieldCheck, Star, Bookmark, Globe, Users, Lock, 
  Copy, Check, ArrowUpRight, ArrowDownRight, Play, 
  HelpCircle, RefreshCw, Bold, Italic, List, ListOrdered, Quote, Code, Link2
} from 'lucide-react';
import { toast } from 'sonner';

// ----------------------------------------------------
// Stable Hash-Assigned Hue
// ----------------------------------------------------
export function getHashHue(str: string): string {
  const hues = ['blue', 'cyan', 'teal', 'green', 'yellow', 'orange', 'red', 'pink', 'purple', 'gray'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % hues.length;
  return hues[index];
}

// ----------------------------------------------------
// CatPill Component
// ----------------------------------------------------
interface CatPillProps {
  text: string;
  hue?: string;
  className?: string;
}

export const CatPill: React.FC<CatPillProps> = ({ text, hue, className = '' }) => {
  const activeHue = hue || getHashHue(text);
  
  // Resolve css variables defined in index.css
  const styles: Record<string, { bg: string; fg: string }> = {
    blue: { bg: 'var(--cat-blue-bg)', fg: 'var(--cat-blue-fg)' },
    cyan: { bg: 'var(--cat-cyan-bg)', fg: 'var(--cat-cyan-fg)' },
    teal: { bg: 'var(--cat-teal-bg)', fg: 'var(--cat-teal-fg)' },
    green: { bg: 'var(--cat-green-bg)', fg: 'var(--cat-green-fg)' },
    yellow: { bg: 'var(--cat-yellow-bg)', fg: 'var(--cat-yellow-fg)' },
    orange: { bg: 'var(--cat-orange-bg)', fg: 'var(--cat-orange-fg)' },
    red: { bg: 'var(--cat-red-bg)', fg: 'var(--cat-red-fg)' },
    pink: { bg: 'var(--cat-pink-bg)', fg: 'var(--cat-pink-fg)' },
    purple: { bg: 'var(--cat-purple-bg)', fg: 'var(--cat-purple-fg)' },
    gray: { bg: 'var(--cat-gray-bg)', fg: 'var(--cat-gray-fg)' },
  };

  const { bg, fg } = styles[activeHue] || styles.gray;

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border border-transparent select-none ${className}`}
      style={{ backgroundColor: bg, color: fg, borderColor: 'rgba(0,0,0,0.04)' }}
    >
      {text}
    </span>
  );
};

// ----------------------------------------------------
// EntityIcon
// Kind coding (fixed): servers = blue · agents = purple · skills = teal · prompts = orange
// ----------------------------------------------------
interface EntityIconProps {
  kind: 'server' | 'agent' | 'skill' | 'prompt';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const EntityIcon: React.FC<EntityIconProps> = ({ kind, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-[14px]',
    md: 'w-10 h-10 text-[18px]',
    lg: 'w-14 h-14 text-[24px]',
  };

  const kindConfig = {
    server: { hue: 'blue', icon: Server },
    agent: { hue: 'purple', icon: Cpu },
    skill: { hue: 'teal', icon: Wrench },
    prompt: { hue: 'orange', icon: Terminal },
  };

  const { hue, icon: IconComponent } = kindConfig[kind] || kindConfig.server;
  const styles: Record<string, { bg: string; fg: string }> = {
    blue: { bg: 'var(--cat-blue-bg)', fg: 'var(--cat-blue-fg)' },
    purple: { bg: 'var(--cat-purple-bg)', fg: 'var(--cat-purple-fg)' },
    teal: { bg: 'var(--cat-teal-bg)', fg: 'var(--cat-teal-fg)' },
    orange: { bg: 'var(--cat-orange-bg)', fg: 'var(--cat-orange-fg)' },
  };
  const colors = styles[hue];

  return (
    <div 
      className={`flex items-center justify-center rounded-lg border border-transparent shrink-0 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: colors.bg, color: colors.fg, borderColor: 'rgba(0,0,0,0.06)' }}
    >
      <IconComponent className="w-5 h-5 stroke-[2]" />
    </div>
  );
};

// ----------------------------------------------------
// StatusBadge
// ----------------------------------------------------
interface StatusBadgeProps {
  status: 'approved' | 'pending' | 'rejected' | 'in_review';
  disabled?: boolean;
  deletionRequested?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, disabled, deletionRequested }) => {
  if (disabled) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border border-gray-300 bg-gray-100 text-gray-600">
        Disabled
      </span>
    );
  }

  if (deletionRequested) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border border-red-300 bg-red-100 text-red-700">
        Deletion Requested
      </span>
    );
  }

  const labelMap = {
    approved: 'Approved',
    pending: 'Pending',
    rejected: 'Rejected',
    in_review: 'In Review',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full border badge-status-${status}`}>
      {labelMap[status]}
    </span>
  );
};

// ----------------------------------------------------
// HealthDot
// ----------------------------------------------------
interface HealthDotProps {
  status: string;
  showLabel?: boolean;
}

export const HealthDot: React.FC<HealthDotProps> = ({ status, showLabel = false }) => {
  const s = status ? status.toLowerCase() : 'unknown';
  const config: Record<string, { dot: string; text: string; label: string }> = {
    healthy: { dot: 'bg-emerald-500', text: 'text-emerald-700', label: 'Healthy' },
    unhealthy: { dot: 'bg-red-500', text: 'text-red-700', label: 'Unhealthy' },
    degraded: { dot: 'bg-red-500', text: 'text-red-700', label: 'Unhealthy' },
    down: { dot: 'bg-red-500', text: 'text-red-700', label: 'Unhealthy' },
    unknown: { dot: 'bg-gray-400', text: 'text-gray-500', label: 'Unknown' },
  };

  const item = config[s] || config.unknown;

  return (
    <span className="inline-flex items-center gap-1.5 select-none">
      <span className={`relative flex h-2 w-2`}>
        {item.label === 'Healthy' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${item.dot}`}></span>
      </span>
      {showLabel && <span className={`text-xs font-semibold ${item.text}`}>{item.label}</span>}
    </span>
  );
};

// ----------------------------------------------------
// RatingStars & RatePopover
// ----------------------------------------------------
interface RatingStarsProps {
  rating: number;
  reviewsCount?: number;
  size?: 'sm' | 'md';
}

export const RatingStars: React.FC<RatingStarsProps> = ({ rating, reviewsCount }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />);
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(
        <div key={i} className="relative inline-block w-3.5 h-3.5 overflow-hidden text-gray-300">
          <Star className="absolute top-0 left-0 w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <div className="absolute top-0 right-0 w-1.75 h-3.5 bg-white border-l border-transparent"></div>
        </div>
      );
    } else {
      stars.push(<Star key={i} className="w-3.5 h-3.5 text-gray-300 fill-transparent" />);
    }
  }

  return (
    <span className="inline-flex items-center gap-1 select-none">
      <span className="flex items-center gap-0.5">{stars}</span>
      <span className="text-xs font-medium text-gray-600 font-mono-custom">{rating.toFixed(1)}</span>
      {reviewsCount !== undefined && (
        <span className="text-[11px] text-gray-400 font-normal">({reviewsCount})</span>
      )}
    </span>
  );
};

interface RatePopoverProps {
  itemId: string;
  currentRating?: number;
  onRate: (rating: number) => void;
}

export const RatePopover: React.FC<RatePopoverProps> = ({ currentRating = 0, onRate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleSelect = (r: number) => {
    onRate(r);
    setIsOpen(false);
    toast.success(`You rated this item: ${r} Stars`);
  };

  return (
    <div className="relative inline-block">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary cursor-pointer select-none"
      >
        <Star className="w-3.5 h-3.5 fill-transparent text-gray-500" />
        {currentRating > 0 ? `Rated ★ ${currentRating}` : 'Rate'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-md p-3 shadow-floating z-50">
            <h4 className="text-[12px] font-semibold text-gray-700 mb-2">Submit Rating</h4>
            <div className="flex items-center gap-1.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => handleSelect(star)}
                  className="p-0.5 focus:outline-none hover:scale-115 transition-transform"
                >
                  <Star 
                    className={`w-5 h-5 ${
                      star <= (hoverRating !== null ? hoverRating : currentRating) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-gray-300 fill-transparent'
                    }`} 
                  />
                </button>
              ))}
            </div>
            {currentRating > 0 && (
              <p className="text-[11px] text-gray-500 font-mono-custom">Your rating: ★ {currentRating}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ----------------------------------------------------
// BookmarkToggle
// ----------------------------------------------------
interface BookmarkToggleProps {
  isBookmarked: boolean;
  onToggle: () => void;
}

export const BookmarkToggle: React.FC<BookmarkToggleProps> = ({ isBookmarked, onToggle }) => {
  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer select-none transition-colors"
      title={isBookmarked ? "Remove Bookmark" : "Bookmark"}
    >
      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-400 text-yellow-500' : 'fill-transparent'}`} />
    </button>
  );
};

// ----------------------------------------------------
// VisibilityBadge
// ----------------------------------------------------
interface VisibilityBadgeProps {
  global: boolean;
  workspaceIds: string[];
}

export const VisibilityBadge: React.FC<VisibilityBadgeProps> = ({ global, workspaceIds }) => {
  if (global) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100 select-none">
        <Globe className="w-3 h-3" />
        Public
      </span>
    );
  }
  
  if (workspaceIds.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-100 select-none" title={`Visible in ${workspaceIds.length} Workspaces`}>
        <Users className="w-3 h-3" />
        Workspace ({workspaceIds.length})
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 border border-gray-200 select-none">
      <Lock className="w-3 h-3" />
      Private
    </span>
  );
};

// ----------------------------------------------------
// Clipboard Copy Helper
// clipboard API + textarea fallback
// ----------------------------------------------------
export function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(() => toast.success('Copied to clipboard!'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    toast.success('Copied to clipboard!');
  } catch (err) {
    toast.error('Failed to copy code.');
  }
  document.body.removeChild(textArea);
}

// ----------------------------------------------------
// CopyBlock
// ----------------------------------------------------
interface CopyBlockProps {
  code: string;
  language?: string;
}

export const CopyBlock: React.FC<CopyBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    copyText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group rounded-md border border-gray-200 bg-gray-900 text-gray-100 overflow-hidden font-mono-custom">
      {language && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800 text-gray-400 text-[11px] select-none uppercase tracking-wider font-semibold border-b border-gray-800">
          <span>{language}</span>
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] hover:text-gray-200 focus:outline-none cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="p-3.5 overflow-x-auto text-[12px] leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
      {!language && (
        <button 
          onClick={handleCopy}
          className="absolute right-2 top-2 p-1 bg-gray-800 border border-gray-700 rounded text-gray-400 hover:text-gray-200 focus:outline-none cursor-pointer"
          title="Copy Code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------
// CopyHashField
// Mono hash + copy + Verify integrity -> mock check -> emerald toast
// ----------------------------------------------------
interface CopyHashFieldProps {
  hash: string;
}

export const CopyHashField: React.FC<CopyHashFieldProps> = ({ hash }) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      toast.success('Integrity scan completed. SHA-256 hash verified successfully!');
    }, 1500);
  };

  return (
    <div className="flex items-center gap-1.5 max-w-full">
      <div className="flex items-center gap-2 border border-gray-200 rounded px-2.5 py-1 bg-gray-55 max-w-full overflow-hidden select-none font-mono-custom text-gray-700">
        <span className="truncate max-w-[200px] md:max-w-xs">{hash}</span>
        <button 
          onClick={() => copyText(hash)}
          className="text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer shrink-0"
          title="Copy Hash"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
      <button
        onClick={handleVerify}
        disabled={isVerifying}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 select-none cursor-pointer integrity-button font-sans"
      >
        {isVerifying ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Scanning...
          </>
        ) : (
          <>
            <ShieldCheck className="w-3.5 h-3.5" />
            Verify integrity
          </>
        )}
      </button>
    </div>
  );
};

// ----------------------------------------------------
// SegmentedStatPill
// ----------------------------------------------------
interface SegmentedStatPillProps {
  items: { icon?: any; text: string }[];
  className?: string;
}

export const SegmentedStatPill: React.FC<SegmentedStatPillProps> = ({ items, className = '' }) => {
  return (
    <span className={`inline-flex items-center border border-gray-200 rounded bg-white overflow-hidden text-gray-600 divide-x divide-gray-200 shadow-sm ${className}`}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        return (
          <span key={idx} className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium font-mono-custom select-none">
            {Icon && <Icon className="w-3 h-3 text-gray-400" />}
            {item.text}
          </span>
        );
      })}
    </span>
  );
};

// ----------------------------------------------------
// EmptyState
// ----------------------------------------------------
interface EmptyStateProps {
  title?: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: any;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "No assets found", 
  description, 
  actionText, 
  onAction,
  icon: Icon = HelpCircle
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
      <div className="p-3 bg-gray-100 text-gray-400 rounded-full mb-3 shrink-0">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <p className="text-xs text-gray-500 mt-1 max-w-sm">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary cursor-pointer select-none"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------
// TrendArrow
// ----------------------------------------------------
interface TrendArrowProps {
  value: number;
  className?: string;
}

export const TrendArrow: React.FC<TrendArrowProps> = ({ value, className = '' }) => {
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold font-mono-custom leading-none select-none ${isPositive ? 'text-emerald-600' : 'text-rose-600'} ${className}`}>
      {isPositive ? (
        <>
          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" />
          +{value.toFixed(1)}%
        </>
      ) : (
        <>
          <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
          {value.toFixed(1)}%
        </>
      )}
    </span>
  );
};

// ----------------------------------------------------
// EnableToggle (Custom Switch)
// ----------------------------------------------------
interface EnableToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const EnableToggle: React.FC<EnableToggleProps> = ({ checked, onChange, label, disabled = false }) => {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    const nextState = !checked;
    onChange(nextState);
  };

  return (
    <div className="inline-flex items-center gap-2 select-none">
      <button
        onClick={handleToggle}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${
          checked ? 'bg-primary' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
            checked ? 'translate-x-4.5' : 'translate-x-0.5'
          }`}
        />
      </button>
      {label && <span className="text-xs font-medium text-gray-700">{label}</span>}
    </div>
  );
};

// ----------------------------------------------------
// TestButton
// ----------------------------------------------------
interface TestButtonProps {
  name: string;
  kind?: string;
  disabled?: boolean;
}

export const TestButton: React.FC<TestButtonProps> = ({ name, kind = 'asset', disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startTest = () => {
    setIsRunning(true);
    setLogs(['[SYSTEM] Initializing test session...', `[SYSTEM] Target: ${name} (${kind})`]);

    const steps = [
      '[SECURITY] Scanning credentials safety... OK',
      '[PROTOCOL] Handshake verification... OK',
      '[COMPLIANCE] Analyzing transport compatibility... OK',
      '[PING] Resolving gateway endpoint... latency 42ms',
      '[INTEGRATION] Executing default health checks... OK',
      '[SUCCESS] All tests executed successfully!'
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
        toast.success(`Test for "${name}" passed!`);
      }
    }, 600);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          setIsOpen(true);
          setLogs([]);
        }}
        disabled={disabled}
        className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <Play className="w-3.5 h-3.5 text-gray-500 fill-current" />
        Test
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md bg-white rounded-lg shadow-floating border border-gray-200 overflow-hidden flex flex-col z-50">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-800">Test {name}</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-655 focus:outline-none font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 flex-1">
              <p className="text-xs text-gray-500 mb-3">
                Run sandbox integrity and response validation tests against the declared schema and transport parameters.
              </p>
              
              <div 
                ref={scrollRef}
                className="h-44 bg-gray-900 text-gray-100 rounded p-3 font-mono text-[11px] overflow-y-auto leading-relaxed border border-gray-800 shadow-inner"
              >
                {logs.length === 0 ? (
                  <span className="text-gray-500">Press "Run Test Suite" to begin simulation.</span>
                ) : (
                  logs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={
                        log.startsWith('[SUCCESS]') ? 'text-emerald-400 font-semibold' : 
                        log.startsWith('[SYSTEM]') ? 'text-blue-400' :
                        log.startsWith('[SECURITY]') ? 'text-purple-400' :
                        log.startsWith('[PING]') ? 'text-yellow-400' : 'text-gray-300'
                      }
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={startTest}
                disabled={isRunning}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 focus:outline-none cursor-pointer font-sans"
              >
                {isRunning ? 'Running Test...' : 'Run Test Suite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ----------------------------------------------------
// ChangelogEditor
// Custom rich-text editor using contentEditable and document.execCommand
// ----------------------------------------------------
interface ChangelogEditorProps {
  value: string;
  onChange: (val: string) => void;
}

export const ChangelogEditor: React.FC<ChangelogEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, []);

  const handleCommand = (cmd: string, val: string = '') => {
    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white flex flex-col focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 px-2.5 py-1.5 bg-gray-50 border-b border-gray-200 select-none">
        <button
          type="button"
          onClick={() => handleCommand('bold')}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 focus:outline-none cursor-pointer"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('italic')}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 focus:outline-none cursor-pointer"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('insertUnorderedList')}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 focus:outline-none cursor-pointer"
          title="Bulleted List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('insertOrderedList')}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 focus:outline-none cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'blockquote')}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 focus:outline-none cursor-pointer"
          title="Quote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', 'pre')}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 focus:outline-none cursor-pointer"
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = prompt('Enter link URL:');
            if (url) handleCommand('createLink', url);
          }}
          className="p-1 rounded hover:bg-gray-200 text-gray-600 focus:outline-none cursor-pointer"
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* contentEditable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[140px] p-3 text-xs focus:outline-none leading-relaxed bg-white prose max-w-none overflow-y-auto"
        style={{ fontSize: '13px' }}
        data-placeholder="Describe what changed in this version..."
      />
    </div>
  );
};
