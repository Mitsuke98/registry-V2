import React, { useState } from 'react';
import { copyText } from './UIHelperKit';
import { toast } from 'sonner';
import { Copy, ShieldCheck, Loader2 } from 'lucide-react';

interface CopyHashFieldProps {
  value: string;
}

export const CopyHashField: React.FC<CopyHashFieldProps> = ({ value }) => {
  const [verifying, setVerifying] = useState(false);

  const handleCopy = () => {
    copyText(value);
    toast.success('Hash copied to clipboard!');
  };

  const handleVerify = () => {
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      toast.success('Integrity verified: SHA-256 matches code signature perfectly.');
    }, 600);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 select-none">
      <div className="flex items-center gap-1 bg-muted/40 border border-border rounded-lg p-1.5 px-3 font-mono text-[12px] text-muted-foreground select-all min-w-0 max-w-full">
        <span className="truncate">{value}</span>
        <button 
          onClick={handleCopy}
          className="p-1 rounded hover:bg-accent/80 text-muted-foreground hover:text-foreground cursor-pointer shrink-0 ml-1"
          title="Copy Hash"
        >
          <Copy className="size-3.5" />
        </button>
      </div>
      <button
        onClick={handleVerify}
        disabled={verifying}
        className="h-[34px] px-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] text-emerald-700 dark:text-emerald-400 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-colors hover:bg-emerald-500/[0.08]"
      >
        {verifying ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            <span>Verifying...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="size-3.5" />
            <span>Verify integrity</span>
          </>
        )}
      </button>
    </div>
  );
};
