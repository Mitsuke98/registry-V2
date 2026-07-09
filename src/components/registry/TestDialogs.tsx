import React, { useState } from 'react';
import { useRegistry } from '@/data/RegistryContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Play, Check, Loader2 } from 'lucide-react';

interface EnableToggleProps {
  itemKey: string;
  capabilityKind: string;
  capabilityName: string;
}

export const EnableToggle: React.FC<EnableToggleProps> = ({
  itemKey,
  capabilityKind,
  capabilityName
}) => {
  const { enabledCapabilities, toggleCapability } = useRegistry();
  const key = `${itemKey}:${capabilityKind}:${capabilityName}`;
  const isEnabled = enabledCapabilities[key] ?? true;

  const handleToggle = () => {
    toggleCapability(itemKey, capabilityKind, capabilityName);
    const nextState = !isEnabled;
    toast.success(
      `${capabilityKind.charAt(0).toUpperCase() + capabilityKind.slice(1)} "${capabilityName}" is now ${
        nextState ? 'enabled' : 'disabled'
      }`
    );
  };

  return (
    <button
      onClick={handleToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        isEnabled ? 'bg-primary' : 'bg-muted-foreground/30'
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-4 transform rounded-full bg-background shadow-sm ring-0 transition duration-200 ease-in-out ${
          isEnabled ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
};

interface TestButtonProps {
  name: string;
  kind: string; // 'tool' | 'resource' | 'prompt' | 'skill'
}

export const TestButton: React.FC<TestButtonProps> = ({ name, kind }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [runSuccess, setRunSuccess] = useState(false);
  const [payload, setPayload] = useState('{\n  "arguments": {}\n}');

  const handleRun = () => {
    setLoading(true);
    setRunSuccess(false);
    setTimeout(() => {
      setLoading(false);
      setRunSuccess(true);
      toast.success(`Mock execution of ${kind} "${name}" completed successfully!`);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) { setRunSuccess(false); } }}>
      <DialogTrigger render={
        <button className="h-7 px-2.5 rounded border border-border bg-background hover:bg-accent text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer">
          <Play className="size-3 text-primary shrink-0" />
          <span>Test</span>
        </button>
      } />
      <DialogContent className="sm:max-w-[480px] p-6 bg-card border border-border rounded-xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-base font-bold text-foreground">Test {kind}: {name}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Execute a mock request in a simulated sandbox environment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Request Parameters (JSON)</label>
            <textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-border bg-muted/40 p-3 font-mono text-[12.5px] leading-relaxed text-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {runSuccess && (
            <div className="space-y-2 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Response Preview</label>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="size-3" />
                  <span>SUCCESS (200 OK)</span>
                </span>
              </div>
              <pre className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.02] p-3 font-mono text-[12px] leading-relaxed text-emerald-700 dark:text-emerald-400 select-all overflow-x-auto max-h-[160px]">
                {JSON.stringify(
                  {
                    status: 'success',
                    data: {
                      message: `Mock response from ${kind} "${name}"`,
                      timestamp: new Date().toISOString(),
                      result: 'Operation executed successfully.'
                    }
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-9 px-4 text-xs font-semibold rounded-lg"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRun}
            disabled={loading}
            className="h-9 px-4 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/95 flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="size-3.5 fill-current" />
                <span>Run Test</span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
