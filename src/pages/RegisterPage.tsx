import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { usePageSearch } from '@/context/SearchContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FEATURES } from '@/config/features';
import {
  CheckCircle2, AlertCircle, AlertTriangle, Info,
  Upload, Terminal, Bot, Scroll, FileText, ChevronRight, Check, Loader2, Bold, Italic, List, ListOrdered, Quote, Code, Link as LinkIcon
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  usePageSearch('Register assets...');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerItem, currentUser, workspaces } = useRegistry();

  const kind = searchParams.get('kind') as 'server' | 'agent' | 'prompt' | 'skill' | null;

  // Global wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Initial visibility states
  const [initialGlobal, setInitialGlobal] = useState(false);
  const [initialWorkspaceIds, setInitialWorkspaceIds] = useState<string[]>([]);

  // ----------------------------------------------------
  // Form values (MCP / Agent / Prompt / Skill)
  // ----------------------------------------------------
  // Basic info (Shared)
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [description, setDescription] = useState('');
  const [license, setLicense] = useState('MIT');

  // Publisher details (Shared)
  const [pubName, setPubName] = useState(currentUser?.name || '');
  const [pubEmail, setPubEmail] = useState('');
  const [org, setOrg] = useState('');
  const [website, setWebsite] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportUrl, setSupportUrl] = useState('');

  // Technical configuration (Shared)
  const [endpoint, setEndpoint] = useState('');
  const [authType, setAuthType] = useState('None');
  const [transport, setTransport] = useState<'stdio' | 'sse' | 'http'>('stdio');
  const [protocolVersion, setProtocolVersion] = useState('1.1.0');
  const [docUrl, setDocUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  // Capabilities (MCP)
  const [mcpTools, setMcpTools] = useState(true);
  const [mcpResources, setMcpResources] = useState(false);
  const [mcpPrompts, setMcpPrompts] = useState(false);

  // Capabilities (Agent)
  const [autonomyLevel, setAutonomyLevel] = useState<'Low' | 'Mid' | 'High'>('Low');
  const [agentReasoning, setAgentReasoning] = useState(true);
  const [agentMemory, setAgentMemory] = useState(true);
  const [agentCollaboration, setAgentCollaboration] = useState(false);
  const [agentStreaming, setAgentStreaming] = useState(true);
  const [agentMultimodal, setAgentMultimodal] = useState(false);
  const [agentLogging, setAgentLogging] = useState(true);

  // Prompt details
  const [promptSource, setPromptSource] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [promptTags, setPromptTags] = useState('');

  // Skill fields
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [changelogHtml, setChangelogHtml] = useState('');
  const [skillMetadata, setSkillMetadata] = useState<{
    name: string;
    version: string;
    tags: string[];
    roles: string[];
    network: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [pipelineStepIndex, setPipelineStepIndex] = useState(-1);
  const [pipelineStatus, setPipelineStatus] = useState<'running' | 'paused' | 'success' | 'failed'>('running');

  const editorRef = useRef<HTMLDivElement>(null);

  // Prefill publisher name when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setPubName(currentUser.name);
    }
  }, [currentUser]);

  // Reset steps when kind changes
  useEffect(() => {
    setCurrentStep(0);
    setIsSuccess(false);
    setInitialGlobal(false);
    setInitialWorkspaceIds([]);
  }, [kind]);

  // Sync toolbar active state for contentEditable changelog editor
  const [editorActiveStates, setEditorActiveStates] = useState({
    bold: false,
    italic: false,
  });

  const checkEditorState = () => {
    setEditorActiveStates({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
    });
  };

  const handleCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      setChangelogHtml(editorRef.current.innerHTML);
    }
    checkEditorState();
  };

  // ----------------------------------------------------
  // File Uploader validations (Skill)
  // ----------------------------------------------------
  const handleFileUpload = (file: File) => {
    setUploadError(null);
    const validExtensions = ['.md', '.zip'];
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(extension)) {
      setUploadError('Invalid file type. Only .md or .zip files are allowed.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5 MB limit.');
      return;
    }

    setUploadedFile(file);
    // Mock parsing file metadata
    const parsedName = file.name.replace(/\.[^/.]+$/, "").split('-v')[0].replace(/[-_]/g, ' ');
    const formattedName = parsedName.charAt(0).toUpperCase() + parsedName.slice(1);
    
    let parsedVersion = '1.0.0';
    const versionMatch = file.name.match(/-v(\d+\.\d+\.\d+)/);
    if (versionMatch) {
      parsedVersion = versionMatch[1];
    }

    setSkillMetadata({
      name: formattedName,
      version: parsedVersion,
      tags: ['imported', extension.replace('.', '')],
      roles: ['developer', 'integrator'],
      network: 'Declared: No declared network access'
    });
  };

  // ----------------------------------------------------
  // Steppers validation gates
  // ----------------------------------------------------
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  const validateStep = (): boolean | string => {
    if (kind === 'server') {
      if (currentStep === 0) {
        if (!name.trim()) return 'Name is required.';
        if (!version.trim()) return 'Version is required.';
        if (!license.trim()) return 'License is required.';
      }
      if (currentStep === 1) {
        if (!pubName.trim()) return 'Publisher name is required.';
        if (!pubEmail.trim()) return 'Publisher email is required.';
        if (!emailRegex.test(pubEmail)) return 'Please enter a valid publisher email.';
        if (supportEmail && !emailRegex.test(supportEmail)) return 'Please enter a valid support email.';
      }
      if (currentStep === 2) {
        if (!endpoint.trim()) return 'Endpoint URL is required.';
        if (!protocolVersion.trim()) return 'Protocol version is required.';
      }
    } else if (kind === 'agent') {
      if (currentStep === 0) {
        if (!name.trim()) return 'Name is required.';
        if (!version.trim()) return 'Version is required.';
        if (!license.trim()) return 'License is required.';
      }
      if (currentStep === 1) {
        if (!pubName.trim()) return 'Publisher name is required.';
        if (!pubEmail.trim()) return 'Publisher email is required.';
        if (!emailRegex.test(pubEmail)) return 'Please enter a valid publisher email.';
        if (supportEmail && !emailRegex.test(supportEmail)) return 'Please enter a valid support email.';
      }
      if (currentStep === 2) {
        if (!endpoint.trim()) return 'Endpoint URL is required.';
        if (!protocolVersion.trim()) return 'Protocol version is required.';
      }
    } else if (kind === 'prompt') {
      if (currentStep === 0) {
        if (!name.trim()) return 'Title is required.';
        if (!promptContent.trim()) return 'Prompt contents are required.';
        if (promptSource.length > 255) return 'Source length exceeds the 255 character limit.';
      }
      if (currentStep === 1) {
        // Step 2 is Lint check: fails block Continue
        const lint = runPromptLint();
        if (lint.some(l => l.status === 'fail')) {
          return 'Fails in security checks must be resolved before submitting.';
        }
      }
    } else if (kind === 'skill') {
      if (currentStep === 0) {
        if (!uploadedFile) return 'Please upload a SKILL.md or .zip bundle first.';
      }
      if (currentStep === 1) {
        if (pipelineStatus !== 'success') {
          return 'Pipeline scan must pass successfully before continuing.';
        }
      }
    }
    return true;
  };

  const handleContinue = () => {
    const val = validateStep();
    if (typeof val === 'string') {
      toast.error(val);
      return;
    }
    
    // Custom flow navigation
    if (kind === 'skill' && currentStep === 0) {
      setCurrentStep(1);
      // Run automatic pipeline scanning
      startPipelineScan();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // ----------------------------------------------------
  // Prompt lint checks
  // ----------------------------------------------------
  const runPromptLint = () => {
    const checks: { label: string; status: 'pass' | 'warn' | 'fail'; detail: string }[] = [];
    
    // 1. Required fields
    if (name.trim() && promptContent.trim()) {
      checks.push({ label: 'Required fields present', status: 'pass', detail: 'Title and content fields contain data.' });
    } else {
      checks.push({ label: 'Required fields present', status: 'fail', detail: 'Title or content details are missing.' });
    }

    // 2. Source length
    if (promptSource.length <= 255) {
      checks.push({ label: 'Source length threshold', status: 'pass', detail: `Under limit limit (${promptSource.length}/255).` });
    } else {
      checks.push({ label: 'Source length threshold', status: 'fail', detail: `Length exceeds 255 limit (${promptSource.length}/255).` });
    }

    // 3. Output format specified
    const formatRegex = /(format|json|xml|markdown|csv|output as|output format)/i;
    if (formatRegex.test(promptContent)) {
      checks.push({ label: 'Output format instruction', status: 'pass', detail: 'Specific output format/schema instructions detected.' });
    } else {
      checks.push({ label: 'Output format instruction', status: 'warn', detail: 'No explicit output formatting rules specified (JSON/Markdown etc).' });
    }

    // 4. Refusal path / guardrail
    const guardrailRegex = /(instead|if not|fail|error|refuse|sorry|unable to|invalid)/i;
    if (guardrailRegex.test(promptContent)) {
      checks.push({ label: 'Refusal path guardrails', status: 'pass', detail: 'Safety fallback logic or error state handles detected.' });
    } else {
      checks.push({ label: 'Refusal path guardrails', status: 'warn', detail: 'No fallback refusal handling or guardrail logic defined.' });
    }

    // 5. Secrets detection
    const secretsRegex = /(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|api[_-]?key|Bearer\s+eyJ)/i;
    if (secretsRegex.test(promptContent)) {
      checks.push({ label: 'Secrets scanning', status: 'fail', detail: 'Potential api credentials, AWS keys or Bearer tokens detected.' });
    } else {
      checks.push({ label: 'Secrets scanning', status: 'pass', detail: 'No api keys or cloud access tokens detected.' });
    }

    // 6. PII check
    const piiRegex = /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b\d{3}-\d{2}-\d{4}\b|\b\+?\d{1,3}?[-.\s]?(?:\d{1,4}?[-.\s]?){1,4}\d{1,4}\b)/i;
    if (piiRegex.test(promptContent)) {
      checks.push({ label: 'PII scanner', status: 'warn', detail: 'Email formats or phone patterns detected in prompt contents.' });
    } else {
      checks.push({ label: 'PII scanner', status: 'pass', detail: 'No emails, phone numbers or social ID formats found.' });
    }

    return checks;
  };

  // ----------------------------------------------------
  // Skill pipeline simulation (Step 2)
  // ----------------------------------------------------
  const pipelineStages = [
    { label: 'Frontmatter parsed', detail: 'YAML safe-load: name, version, tags present' },
    { label: 'ZIP contents enumerated', detail: 'All extensions allowed · no binaries · no path traversal' },
    { label: 'Security scan (8 rules)', detail: 'exec calls · shell/cmd files · file writes · undeclared network · env access · obfuscation · credential patterns · excessive size' },
    { label: 'Risk score computed', detail: '0.18 — below flag threshold 0.70 = clean' },
    { label: 'Embeddings generated', detail: 'BAAI/bge-small-en-v1.5 · 384 dimensions' },
    { label: 'Content hash computed', detail: 'SHA-256 · deterministic' },
    { label: 'Files uploaded to S3', detail: 'skills/{slug}/{version}/ objects' },
    { label: 'Indexed and searchable', detail: 'In-memory NumPy index updated' }
  ];

  const startPipelineScan = () => {
    setPipelineStatus('running');
    setPipelineStepIndex(-1);

    const isDuplicate = uploadedFile?.name.includes('prompt-injection-filter-v1.2.0.md');

    let current = 0;
    const interval = setInterval(() => {
      setPipelineStepIndex(current);
      if (current === 5 && isDuplicate) {
        // Halt at duplicate hash detection
        setPipelineStatus('failed');
        clearInterval(interval);
        return;
      }

      if (current === pipelineStages.length - 1) {
        setPipelineStatus('success');
        clearInterval(interval);
      } else {
        current++;
      }
    }, 500);
  };

  // ----------------------------------------------------
  // Final Registration Submit Handler
  // ----------------------------------------------------
  const handleSubmit = () => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);
    
    let itemDetails: any = {
      id,
      name: kind === 'prompt' ? name : (kind === 'skill' ? (skillMetadata?.name || name) : name),
      version: kind === 'skill' ? (skillMetadata?.version || version) : version,
      description: kind === 'skill' ? 'Custom uploaded skill' : description,
      status: 'pending',
    };

    if (kind === 'server') {
      itemDetails = {
        ...itemDetails,
        transport,
        endpoint,
        tools: mcpTools ? [{ name: 'mcp_tool', description: 'Automatically generated capability.', params: {} }] : [],
        resources: mcpResources ? [{ name: 'mcp_resource', uri: 'custom://resource' }] : [],
        prompts: mcpPrompts ? [{ name: 'mcp_prompt', description: 'mcp template', args: [] }] : [],
        capabilities: { tools: mcpTools, resources: mcpResources, prompts: mcpPrompts },
        tags: ['custom', 'mcp'],
        trust: {
          verified: false,
          score: 85,
          scannedAt: new Date().toISOString(),
          audits: [{ check: 'Manual registration', status: 'pass', detail: 'Initial static registration.' }]
        }
      };
    } else if (kind === 'agent') {
      itemDetails = {
        ...itemDetails,
        endpoint,
        capabilities: {
          autonomyLevel,
          reasoning: agentReasoning,
          memory: agentMemory,
          collaboration: agentCollaboration,
          streaming: agentStreaming,
          multimodal: agentMultimodal,
          logging: agentLogging
        },
        tags: ['custom', 'agent'],
        trust: {
          verified: false,
          score: 80,
          scannedAt: new Date().toISOString(),
          audits: [{ check: 'Manual registration', status: 'pass', detail: 'Initial agent config validation.' }]
        }
      };
    } else if (kind === 'prompt') {
      itemDetails = {
        ...itemDetails,
        source: promptSource,
        content: promptContent,
        tags: promptTags.split(',').map(t => t.trim()).filter(Boolean),
        argCount: 0,
        trust: {
          verified: false,
          score: 90,
          scannedAt: new Date().toISOString(),
          audits: runPromptLint()
        }
      };
    } else if (kind === 'skill') {
      itemDetails = {
        ...itemDetails,
        name: skillMetadata?.name || 'Custom Skill',
        version: skillMetadata?.version || '1.0.0',
        changelog: changelogHtml,
        category: 'Imported',
        tags: skillMetadata?.tags || ['imported'],
        trust: {
          verified: false,
          score: 92,
          scannedAt: new Date().toISOString(),
          audits: [
            { check: 'Duplicate Check', status: 'pass', detail: 'No duplicates found' },
            { check: 'Static analysis check', status: 'pass', detail: 'Code structure valid' }
          ]
        }
      };
    }

    const finalDetails = {
      ...itemDetails,
      visibility: {
        global: initialGlobal,
        workspaceIds: initialWorkspaceIds
      }
    };

    registerItem(kind!, finalDetails);
    setIsSuccess(true);
    toast.success('Submitted for approval — a super admin will review it');
  };

  const renderInitialVisibilityBlock = () => {
    if (!currentUser) return null;
    const userTeams = workspaces.filter(w => w.kind === 'team' && w.members.includes(currentUser.name));

    return (
      <div className="p-4 border border-border rounded-xl space-y-3 bg-muted/5">
        <div className="border-b border-border/40 pb-1.5 mb-2">
          <span className="font-bold text-foreground">Initial Visibility Settings</span>
          <span className="text-[10px] text-muted-foreground block mt-0.5">Configure initial visibility to apply immediately when approved.</span>
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-lg border bg-background">
          <div className="flex flex-col select-none">
            <span className="text-[11px] font-semibold text-foreground">Global Catalog Listing</span>
            <span className="text-[10px] text-muted-foreground">List this asset globally in the catalog.</span>
          </div>
          <input
            type="checkbox"
            checked={initialGlobal}
            onChange={e => setInitialGlobal(e.target.checked)}
            className="size-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        {userTeams.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-[11px] text-muted-foreground font-semibold select-none">Share to Workspace(s)</label>
            <div className="max-h-28 overflow-y-auto border border-border rounded-lg p-2 space-y-1 bg-background">
              {userTeams.map(ws => (
                <label key={ws.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:bg-accent/40 p-0.5 rounded">
                  <input
                    type="checkbox"
                    checked={initialWorkspaceIds.includes(ws.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setInitialWorkspaceIds([...initialWorkspaceIds, ws.id]);
                      } else {
                        setInitialWorkspaceIds(initialWorkspaceIds.filter(id => id !== ws.id));
                      }
                    }}
                    className="size-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <div className="flex flex-col select-none">
                    <span className="font-semibold text-[11px] leading-tight">{ws.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // Render Step Steppers configuration
  // ----------------------------------------------------
  const renderSteppersHeader = (stepsCount: number) => {
    return (
      <div className="flex items-center gap-2 border-b border-border pb-4 mb-6 select-none">
        {Array.from({ length: stepsCount }).map((_, idx) => {
          const isActive = idx === currentStep;
          const isCompleted = idx < currentStep;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="size-4 text-muted-foreground/30" />}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`size-5 rounded-full flex items-center justify-center font-mono text-[10px] ${
                  isCompleted ? 'bg-emerald-500 text-white' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border border-border'
                }`}>
                  {isCompleted ? <Check className="size-3" /> : idx + 1}
                </span>
                <span className={isActive ? 'text-foreground' : 'text-muted-foreground'}>
                  {getStepTitle(idx)}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const getStepTitle = (idx: number): string => {
    if (kind === 'server' || kind === 'agent') {
      const titles = ['Basic Info', 'Publisher Details', 'Technical Config', 'Capabilities', 'Review & Submit'];
      return titles[idx] || '';
    }
    if (kind === 'prompt') {
      return ['Details', 'Pre-publish Review', 'Review & Submit'][idx] || '';
    }
    if (kind === 'skill') {
      return ['Upload', 'Validate & Scan', 'Review & Submit'][idx] || '';
    }
    return '';
  };

  // ----------------------------------------------------
  // Success Screen
  // ----------------------------------------------------
  if (isSuccess) {
    const personalWsId = currentUser?.role === 'super_admin' ? 'jordans-workspace' : 'alexs-workspace';
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-12 select-none">
        <Card className="p-8 bg-card border-border rounded-2xl shadow-xl text-center space-y-6">
          <div className="size-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">Registration Submitted</h2>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Submitted for approval — a super admin will review it. You can check the approval status in your workspace.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => navigate(`/workspaces/${personalWsId}`)}
              className="h-10 px-5 rounded-lg border border-border bg-background hover:bg-accent/60 text-xs font-semibold cursor-pointer"
            >
              View workspace
            </button>
            <button
              onClick={() => {
                setName('');
                setVersion('1.0.0');
                setDescription('');
                setEndpoint('');
                setUploadedFile(null);
                setSkillMetadata(null);
                setChangelogHtml('');
                setSearchParams({});
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-5 h-10 rounded-lg transition-colors cursor-pointer"
            >
              Register another
            </button>
          </div>
        </Card>
      </div>
    );
  }

  // ----------------------------------------------------
  // No kind preset: LIGHTWEIGHT KIND PICKER
  // ----------------------------------------------------
  if (!kind) {
    const assetOptions = [
      { id: 'server', label: 'MCP Server', desc: 'Standard Model Context Protocol context gateway (stdio/sse/http)', icon: Terminal, active: true },
      { id: 'agent', label: 'A2A Agent', desc: 'Autonomous execution agent with custom gateway endpoints', icon: Bot, active: true },
      { id: 'prompt', label: 'Prompt Template', desc: 'Reusable argument templates prompt block text', icon: Scroll, active: FEATURES.prompts },
      { id: 'skill', label: 'Skill (Instruction)', desc: 'Governed LLM system prompts instruction sets', icon: FileText, active: true }
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center select-none mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Register Asset</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Choose the type of asset you want to register in the registry directory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assetOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                disabled={!opt.active}
                onClick={() => setSearchParams({ kind: opt.id })}
                className={`p-6 text-left border rounded-2xl bg-card hover:bg-primary/5 hover:border-primary cursor-pointer select-none transition-all duration-300 transform hover:-translate-y-0.5 group ${
                  !opt.active ? 'opacity-40 cursor-not-allowed border-dashed border-border' : 'border-border'
                }`}
              >
                <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <div className="font-bold text-foreground text-[14px] flex items-center gap-1.5">
                  {opt.label}
                  {!opt.active && (
                    <span className="text-[9px] bg-muted border border-border text-muted-foreground px-1.5 py-0.5 rounded-md font-mono select-none">Disabled</span>
                  )}
                </div>
                <div className="text-[11.5px] leading-relaxed text-muted-foreground mt-2">{opt.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // FLOWS: RENDERING
  // ----------------------------------------------------
  return (
    <div className="max-w-4xl mx-auto space-y-6 select-text">
      {/* Stepper progress indicator */}
      {renderSteppersHeader(kind === 'server' || kind === 'agent' ? 5 : 3)}

      {/* stepper forms */}
      <Card className="p-8 bg-card border-border rounded-xl shadow-none">
        {/* ==================================================== */}
        {/* MCP & AGENT COMMON STEPS */}
        {/* ==================================================== */}
        {(kind === 'server' || kind === 'agent') && (
          <>
            {currentStep === 0 && (
              <div className="space-y-4 text-xs font-semibold">
                <h3 className="text-sm font-bold text-foreground mb-4">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-foreground">Name *</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Brave Search MCP" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground">Version *</label>
                    <Input value={version} onChange={e => setVersion(e.target.value)} className="h-9 text-xs font-mono" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-foreground">Description</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Enter details about this asset..." className="min-h-[100px] text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-foreground">License *</label>
                  <Select value={license} onValueChange={val => val && setLicense(val)}>
                    <SelectTrigger className="h-9 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'Proprietary'].map(lic => (
                        <SelectItem key={lic} value={lic} className="text-xs cursor-pointer">{lic}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4 text-xs font-semibold">
                <h3 className="text-sm font-bold text-foreground mb-4">Publisher Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-foreground">Publisher Name *</label>
                    <Input value={pubName} disabled onChange={e => setPubName(e.target.value)} className="h-9 text-xs bg-muted" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground">Publisher Email *</label>
                    <Input value={pubEmail} onChange={e => setPubEmail(e.target.value)} placeholder="e.g. contact@domain.com" className="h-9 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-foreground">Organization (Optional)</label>
                    <Input value={org} onChange={e => setOrg(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground">Website (Optional)</label>
                    <Input value={website} onChange={e => setWebsite(e.target.value)} className="h-9 text-xs" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-foreground">Support Email (Optional)</label>
                    <Input value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground">Support URL (Optional)</label>
                    <Input value={supportUrl} onChange={e => setSupportUrl(e.target.value)} className="h-9 text-xs" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 text-xs font-semibold">
                <h3 className="text-sm font-bold text-foreground mb-4">Technical Configuration</h3>
                <div className="space-y-1.5">
                  <label className="text-foreground">Endpoint URL *</label>
                  <Input value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="e.g. npx -y @modelcontextprotocol/server" className="h-9 text-xs font-mono" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-foreground">Authentication Type *</label>
                    <Select value={authType} onValueChange={val => val && setAuthType(val)}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {['None', 'API key', 'OAuth 2.0', 'Bearer token'].map(a => (
                          <SelectItem key={a} value={a} className="text-xs cursor-pointer">{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground">Transport Type *</label>
                    <Select value={transport as any} onValueChange={(val: any) => setTransport(val)}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        {['stdio', 'sse', 'http'].map(t => (
                          <SelectItem key={t} value={t} className="text-xs cursor-pointer">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground">Protocol Version *</label>
                    <Input value={protocolVersion} onChange={e => setProtocolVersion(e.target.value)} className="h-9 text-xs font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-foreground">Documentation URL (Optional)</label>
                    <Input value={docUrl} onChange={e => setDocUrl(e.target.value)} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-foreground">Source Code URL (Optional)</label>
                    <Input value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className="h-9 text-xs" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 text-xs font-semibold">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Capabilities & Features</h3>
                  <span className="text-[11px] text-muted-foreground mt-1 block">Capabilities can only be set during registration.</span>
                </div>

                {kind === 'server' ? (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                      <div>
                        <div className="text-xs font-bold text-foreground">Expose Tools</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Allows the server to declare client-executable tool schemas</div>
                      </div>
                      <input type="checkbox" checked={mcpTools} onChange={e => setMcpTools(e.target.checked)} className="size-4 cursor-pointer" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                      <div>
                        <div className="text-xs font-bold text-foreground">Expose Resources</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Allows clients to read contextual server file streams or tables</div>
                      </div>
                      <input type="checkbox" checked={mcpResources} onChange={e => setMcpResources(e.target.checked)} className="size-4 cursor-pointer" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                      <div>
                        <div className="text-xs font-bold text-foreground">Expose Prompts</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Provides predefined system template workflows to LLM contexts</div>
                      </div>
                      <input type="checkbox" checked={mcpPrompts} onChange={e => setMcpPrompts(e.target.checked)} className="size-4 cursor-pointer" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-foreground">Autonomy Level *</label>
                      <Select value={autonomyLevel} onValueChange={val => setAutonomyLevel(val as any)}>
                        <SelectTrigger className="h-9 text-xs bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border">
                          {['Low', 'Mid', 'High'].map(lv => (
                            <SelectItem key={lv} value={lv} className="text-xs cursor-pointer">{lv} Autonomy</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {[
                        { id: 'reasoning', label: 'Reasoning Capability', state: agentReasoning, set: setAgentReasoning },
                        { id: 'memory', label: 'Long-term Memory Access', state: agentMemory, set: setAgentMemory },
                        { id: 'collaboration', label: 'Multi-Agent Collaboration', state: agentCollaboration, set: setAgentCollaboration },
                        { id: 'streaming', label: 'Real-time Output Streaming', state: agentStreaming, set: setAgentStreaming },
                        { id: 'multimodal', label: 'Multimodal Input Parsing', state: agentMultimodal, set: setAgentMultimodal },
                        { id: 'logging', label: 'Auditable Execution Logging', state: agentLogging, set: setAgentLogging }
                      ].map(cap => (
                        <div key={cap.id} className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                          <span className="text-[11px] font-bold text-foreground">{cap.label}</span>
                          <input type="checkbox" checked={cap.state} onChange={e => cap.set(e.target.checked)} className="size-4 cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6 text-xs select-none">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Review & Submit</h3>
                  <span className="text-[11px] text-muted-foreground mt-1 block">A super admin will review this registration before it publishes.</span>
                </div>

                <div className="space-y-4">
                  {/* Group 1: Basic Info */}
                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">1. Basic Info</span>
                      <button onClick={() => setCurrentStep(0)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    <div>Name: <span className="font-semibold text-foreground">{name}</span></div>
                    <div>Version: <span className="font-mono text-foreground">{version}</span></div>
                    <div>License: <span className="font-semibold text-foreground">{license}</span></div>
                  </div>

                  {/* Group 2: Publisher */}
                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">2. Publisher details</span>
                      <button onClick={() => setCurrentStep(1)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    <div>Publisher: <span className="font-semibold text-foreground">{pubName}</span> ({pubEmail})</div>
                  </div>

                  {/* Group 3: Config */}
                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">3. Technical config</span>
                      <button onClick={() => setCurrentStep(2)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    <div>Endpoint URL: <span className="font-mono text-foreground">{endpoint}</span></div>
                    <div>Auth Type: <span className="font-semibold text-foreground">{authType}</span></div>
                    <div>Transport: <span className="font-semibold text-foreground">{transport}</span></div>
                  </div>

                  {/* Group 4: Capabilities */}
                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">4. Capabilities</span>
                      <button onClick={() => setCurrentStep(3)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    {kind === 'server' ? (
                      <div className="flex gap-4">
                        <div>Tools: <span className="font-semibold text-foreground">{mcpTools ? 'Yes' : 'No'}</span></div>
                        <div>Resources: <span className="font-semibold text-foreground">{mcpResources ? 'Yes' : 'No'}</span></div>
                        <div>Prompts: <span className="font-semibold text-foreground">{mcpPrompts ? 'Yes' : 'No'}</span></div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div>Autonomy: <span className="font-bold text-primary">{autonomyLevel}</span></div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {agentReasoning && <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">Reasoning</span>}
                          {agentMemory && <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">Memory</span>}
                          {agentCollaboration && <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">Collaboration</span>}
                          {agentStreaming && <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">Streaming</span>}
                          {agentMultimodal && <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">Multimodal</span>}
                          {agentLogging && <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">Logging</span>}
                        </div>
                      </div>
                    )}
                  </div>
                  {renderInitialVisibilityBlock()}
                </div>

                <div className="p-3 bg-amber-500/5 text-amber-600 dark:text-amber-400 border border-amber-500/10 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 select-none">
                  <Info className="size-4 shrink-0 mt-0.5" />
                  <span>Submitted for approval — a super admin will review it. Live publishing is restricted.</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* PROMPT FLOW */}
        {/* ==================================================== */}
        {kind === 'prompt' && (
          <>
            {currentStep === 0 && (
              <div className="space-y-4 text-xs font-semibold">
                <h3 className="text-sm font-bold text-foreground mb-4">Prompt Template Details</h3>
                <div className="space-y-1.5">
                  <label className="text-foreground">Title *</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. SQL Query Generator" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5 relative">
                  <div className="flex items-center justify-between">
                    <label className="text-foreground">Source URL / Origin</label>
                    <span className={`text-[10px] font-mono ${promptSource.length > 255 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>{promptSource.length}/255</span>
                  </div>
                  <Input value={promptSource} onChange={e => setPromptSource(e.target.value)} placeholder="e.g. github.com/my-prompts/sql-query" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-foreground">Description</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Overview of the prompt logic and expected outputs..." className="min-h-[80px] text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-foreground">Prompt Contents (System instruction block) *</label>
                  <Textarea value={promptContent} onChange={e => setPromptContent(e.target.value)} placeholder="You are an expert SQL engineer..." className="min-h-[240px] text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-foreground">Tags (comma-separated)</label>
                  <Input value={promptTags} onChange={e => setPromptTags(e.target.value)} placeholder="sql, generation, developer" className="h-9 text-xs" />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6 text-xs font-semibold select-none">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Pre-publish Review Check</h3>
                  <span className="text-[11px] text-muted-foreground mt-1 block">Validating instruction blocks for secrets, formatting errors, or PII formats.</span>
                </div>

                <div className="space-y-3">
                  {runPromptLint().map((lint, idx) => {
                    const isFail = lint.status === 'fail';
                    const isWarn = lint.status === 'warn';
                    const Icon = isFail ? AlertCircle : (isWarn ? AlertTriangle : CheckCircle2);
                    const colorClass = isFail ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : (isWarn ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20');
                    return (
                      <div key={idx} className={`p-4 border rounded-xl flex items-start gap-3 ${colorClass}`}>
                        <Icon className="size-4.5 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">{lint.label}</div>
                          <div className="text-[10px] mt-0.5 font-normal leading-relaxed opacity-90">{lint.detail}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 text-xs select-none">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Review & Submit</h3>
                  <span className="text-[11px] text-muted-foreground mt-1 block">Review your template before sending it to the super admin queue.</span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">1. Details</span>
                      <button onClick={() => setCurrentStep(0)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    <div>Title: <span className="font-semibold text-foreground">{name}</span></div>
                    <div>Source: <span className="font-mono text-foreground">{promptSource || 'N/A'}</span></div>
                    <div className="pt-2">
                      <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Content Snippet</div>
                      <pre className="p-3 bg-muted rounded border border-border/60 font-mono text-[10px] leading-normal whitespace-pre-wrap max-h-32 overflow-y-auto">{promptContent}</pre>
                    </div>
                  </div>

                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">2. Safety checks result</span>
                      <button onClick={() => setCurrentStep(1)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="size-4" />
                      <span>Ready for queue submission</span>
                    </div>
                  </div>
                  {renderInitialVisibilityBlock()}
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* SKILL FLOW */}
        {/* ==================================================== */}
        {kind === 'skill' && (
          <>
            {currentStep === 0 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground select-none">Upload Skill Instruct File</h3>
                  <span className="text-[11px] text-muted-foreground mt-1 block select-none">
                    Select or drag SKILL.md. Demo version already seeded: name file <code className="bg-muted px-1 rounded text-red-500 font-semibold">prompt-injection-filter-v1.2.0.md</code> to trigger duplicate warning.
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Dominant slot: Upload Card */}
                  <div className="lg:col-span-2 space-y-4">
                    <div
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault();
                        if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]);
                      }}
                      className="p-8 border-2 border-dashed border-border hover:border-primary rounded-2xl text-center space-y-4 bg-muted/10 cursor-pointer select-none transition-colors"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.md,.zip';
                        input.onchange = e => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleFileUpload(file);
                        };
                        input.click();
                      }}
                    >
                      <Upload className="size-10 text-muted-foreground/80 mx-auto" />
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-foreground">Drag & drop file here or click to browse</div>
                        <div className="text-[10px] text-muted-foreground">Accepts SKILL.md or .zip bundle up to 5 MB</div>
                      </div>
                    </div>

                    {uploadError && (
                      <div className="p-3 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center gap-2 select-none">
                        <AlertCircle className="size-4" />
                        <span>{uploadError}</span>
                      </div>
                    )}

                    {uploadedFile && (
                      <div className="p-4 border border-border rounded-xl space-y-4">
                        <div className="flex items-center justify-between select-none">
                          <div className="flex items-center gap-2">
                            <FileText className="size-5 text-primary" />
                            <div className="text-xs font-bold text-foreground">{uploadedFile.name}</div>
                          </div>
                          <button onClick={() => setUploadedFile(null)} className="text-red-500 hover:text-red-600 text-xs font-semibold cursor-pointer">Remove</button>
                        </div>

                        {/* Changelog custom toolbar editor */}
                        <div className="space-y-2 select-text">
                          <label className="text-xs font-bold text-foreground select-none">Changelog Notes *</label>
                          <div className="border border-border rounded-lg overflow-hidden bg-background">
                            {/* Editor Toolbar */}
                            <div className="bg-muted/40 border-b border-border p-1.5 flex items-center gap-1 select-none">
                              <button type="button" onClick={() => handleCommand('bold')} className={`p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer ${editorActiveStates.bold ? 'bg-primary/10 text-primary' : ''}`} title="Bold"><Bold className="size-3.5" /></button>
                              <button type="button" onClick={() => handleCommand('italic')} className={`p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer ${editorActiveStates.italic ? 'bg-primary/10 text-primary' : ''}`} title="Italic"><Italic className="size-3.5" /></button>
                              <div className="h-4 w-px bg-border/80 mx-1" />
                              <button type="button" onClick={() => handleCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Bullet List"><List className="size-3.5" /></button>
                              <button type="button" onClick={() => handleCommand('insertOrderedList')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Numbered List"><ListOrdered className="size-3.5" /></button>
                              <button type="button" onClick={() => handleCommand('formatBlock', 'blockquote')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Quote"><Quote className="size-3.5" /></button>
                              <button type="button" onClick={() => handleCommand('formatBlock', 'pre')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Code Block"><Code className="size-3.5" /></button>
                              <div className="h-4 w-px bg-border/80 mx-1" />
                              <button type="button" onClick={() => {
                                const url = prompt('Enter link URL:');
                                if (url) handleCommand('createLink', url);
                              }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Add Link"><LinkIcon className="size-3.5" /></button>
                            </div>
                            
                            {/* contentEditable region */}
                            <div
                              ref={editorRef}
                              contentEditable
                              className="p-4 min-h-[160px] text-xs focus:outline-none leading-relaxed prose prose-sm max-w-none"
                              onInput={e => setChangelogHtml((e.target as HTMLDivElement).innerHTML)}
                              onKeyUp={checkEditorState}
                              onMouseUp={checkEditorState}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sidebar supporting cards */}
                  <div className="space-y-4 select-none">
                    {/* Metadata card */}
                    <div className="p-4 border border-border bg-muted/10 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-foreground">Detected Metadata</div>
                      {skillMetadata ? (
                        <div className="space-y-1.5 text-[11px]">
                          <div>Name: <span className="font-semibold text-foreground">{skillMetadata.name}</span></div>
                          <div>Version: <span className="font-mono text-foreground">{skillMetadata.version}</span></div>
                          <div>Network: <span className="font-semibold text-foreground">{skillMetadata.network}</span></div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground leading-normal">
                          Please upload a valid file to auto-parse name and details.
                        </div>
                      )}
                    </div>

                    {/* What we check card */}
                    <div className="p-4 border border-border bg-muted/10 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-foreground">What we check</div>
                      <ul className="space-y-1.5 text-[10.5px] text-muted-foreground list-disc list-inside">
                        <li>YAML frontmatter parsing</li>
                        <li>File size / archive validation</li>
                        <li>MAGIC byte validation</li>
                        <li>Vulnerability regex signature</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground select-none">Scanning & Verification Pipeline</h3>
                  <span className="text-[11px] text-muted-foreground mt-1 block select-none">Running automatic governance scan validations.</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Dominant slot: Pipeline Progress */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="p-5 border border-border rounded-xl space-y-3 bg-muted/5">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40 select-none">
                        <span className="text-xs font-bold text-foreground flex items-center gap-2">
                          {pipelineStatus === 'running' && <Loader2 className="size-4 text-primary animate-spin" />}
                          {pipelineStatus === 'success' && <Check className="size-4 text-emerald-500 font-bold" />}
                          {pipelineStatus === 'failed' && <AlertCircle className="size-4 text-red-500" />}
                          <span>Scan status: <span className="capitalize">{pipelineStatus}</span></span>
                        </span>
                        {pipelineStatus === 'failed' && (
                          <button onClick={startPipelineScan} className="text-primary hover:underline text-xs font-semibold cursor-pointer">Retry</button>
                        )}
                      </div>

                      {/* Pipeline step rows */}
                      <div className="space-y-3">
                        {pipelineStages.map((stage, idx) => {
                          const isHalted = pipelineStatus === 'failed' && idx === 5;
                          const isCurrent = idx === pipelineStepIndex && pipelineStatus === 'running';
                          const isDone = idx < pipelineStepIndex || pipelineStatus === 'success';

                          let icon = <span className="size-4 rounded-full border border-border bg-background block" />;
                          let colorClass = 'text-muted-foreground';

                          if (isHalted) {
                            icon = <AlertTriangle className="size-4.5 text-amber-500" />;
                            colorClass = 'text-amber-600 dark:text-amber-400 border border-amber-500/20 bg-amber-500/5 p-3 rounded-lg';
                          } else if (isDone) {
                            icon = <Check className="size-4 text-emerald-500 font-bold" />;
                            colorClass = 'text-foreground';
                          } else if (isCurrent) {
                            icon = <Loader2 className="size-4 text-primary animate-spin" />;
                            colorClass = 'text-foreground font-semibold';
                          }

                          return (
                            <div key={idx} className={`flex items-start gap-3 p-2.5 transition-all ${colorClass}`}>
                              <div className="shrink-0 mt-0.5">{icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold">{stage.label}</div>
                                {isHalted ? (
                                  <div className="text-[10px] mt-1 font-semibold leading-relaxed">
                                    This exact version is already registered — bump the version and re-upload.
                                  </div>
                                ) : (
                                  <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{stage.detail}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar supporting cards (carried over) */}
                  <div className="space-y-4 select-none">
                    <div className="p-4 border border-border bg-muted/10 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-foreground">Detected Metadata</div>
                      {skillMetadata && (
                        <div className="space-y-1.5 text-[11px]">
                          <div>Name: <span className="font-semibold text-foreground">{skillMetadata.name}</span></div>
                          <div>Version: <span className="font-mono text-foreground">{skillMetadata.version}</span></div>
                          <div>Network: <span className="font-semibold text-foreground">{skillMetadata.network}</span></div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 border border-border bg-muted/10 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-foreground">What we check</div>
                      <ul className="space-y-1.5 text-[10.5px] text-muted-foreground list-disc list-inside">
                        <li>YAML frontmatter parsing</li>
                        <li>File size / archive validation</li>
                        <li>MAGIC byte validation</li>
                        <li>Vulnerability regex signature</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 text-xs select-none">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Review & Submit</h3>
                  <span className="text-[11px] text-muted-foreground mt-1 block">Review your custom skill settings before submitting.</span>
                </div>

                <div className="space-y-4">
                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">1. Metadata & Source</span>
                      <button onClick={() => setCurrentStep(0)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    <div>Name: <span className="font-semibold text-foreground">{skillMetadata?.name}</span></div>
                    <div>Version: <span className="font-mono text-foreground">{skillMetadata?.version}</span></div>
                    <div>File name: <span className="font-semibold text-foreground">{uploadedFile?.name}</span></div>
                    {changelogHtml && (
                      <div className="pt-2">
                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Changelog</div>
                        <div className="p-3 bg-muted rounded border border-border/60 text-[10.5px] leading-relaxed max-h-32 overflow-y-auto" dangerouslySetInnerHTML={{ __html: changelogHtml }} />
                      </div>
                    )}
                  </div>

                  <div className="p-4 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between border-b border-border/40 pb-1.5 mb-2">
                      <span className="font-bold text-foreground">2. Scanning outcome</span>
                      <button onClick={() => setCurrentStep(1)} className="text-primary hover:underline font-semibold cursor-pointer">Edit</button>
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                      <CheckCircle2 className="size-4" />
                      <span>8/8 stages passed successfully</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">Risk score: 0.18 · Hash: SHA-256 (Deterministic verified)</div>
                  </div>
                  {renderInitialVisibilityBlock()}
                </div>
              </div>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* FOOTER CONTROLS */}
        {/* ==================================================== */}
        <div className="border-t border-border/80 pt-6 mt-8 flex items-center justify-between select-none">
          <button
            onClick={() => {
              if (currentStep === 0) {
                setSearchParams({});
              } else {
                setCurrentStep(prev => prev - 1);
              }
            }}
            className="h-9 px-4 rounded-lg border border-border bg-background hover:bg-accent/60 text-xs font-semibold cursor-pointer transition-colors"
          >
            Back
          </button>

          <button
            onClick={() => {
              const isLastStep = kind === 'server' || kind === 'agent' ? currentStep === 4 : currentStep === 2;
              if (isLastStep) {
                handleSubmit();
              } else {
                handleContinue();
              }
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold px-5 h-9 rounded-lg transition-colors cursor-pointer"
          >
            {kind === 'server' || kind === 'agent' ? (currentStep === 4 ? 'Submit Registration' : 'Continue') : (currentStep === 2 ? 'Submit Registration' : 'Continue')}
          </button>
        </div>
      </Card>
    </div>
  );
};
