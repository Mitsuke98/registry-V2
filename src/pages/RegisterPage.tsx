import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import { 
  ChangelogEditor 
} from '@/components/registry/Kit';
import { 
  FileText, ChevronRight, Check, AlertTriangle, 
  AlertCircle, Sparkles, Server, Bot, Loader, Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { FEATURES } from '@/config/features';

export const RegisterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { registerItem, currentUser, workspaces } = useRegistry();

  const kind = searchParams.get('kind') as 'server' | 'agent' | 'prompt' | 'skill' | null;

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  // Visibility states
  const [initialGlobal, setInitialGlobal] = useState(true);
  const [initialWorkspaceIds, setInitialWorkspaceIds] = useState<string[]>([]);

  // ----------------------------------------------------
  // Form Values State
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
  const [authType, setAuthType] = useState('none');
  const [apiKeyHeaderName, setApiKeyHeaderName] = useState('X-API-Key');
  const [apiKeyFormat, setApiKeyFormat] = useState('');
  const [oauthAuthUrl, setOauthAuthUrl] = useState('');
  const [oauthTokenUrl, setOauthTokenUrl] = useState('');
  const [oauthScopes, setOauthScopes] = useState('');
  const [bearerTokenEndpoint, setBearerTokenEndpoint] = useState('');
  const [bearerRefreshTokenUrl, setBearerRefreshTokenUrl] = useState('');

  const handleAuthTypeChange = (val: string) => {
    setAuthType(val);
    setApiKeyHeaderName('X-API-Key');
    setApiKeyFormat('');
    setOauthAuthUrl('');
    setOauthTokenUrl('');
    setOauthScopes('');
    setBearerTokenEndpoint('');
    setBearerRefreshTokenUrl('');
    toast.info('Authentication fields cleared on auth type change.');
  };
  const [transport, setTransport] = useState<'stdio' | 'sse' | 'http'>('stdio');
  const [protocolVersion, setProtocolVersion] = useState('1.0.0');
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
  const agentStreaming = true;
  const agentMultimodal = false;
  const [agentLogging, setAgentLogging] = useState(true);

  // Prompt details
  const [promptSource, setPromptSource] = useState('');
  const [promptContent, setPromptContent] = useState('');
  const [promptTags, setPromptTags] = useState('');

  // Skill fields
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [changelogHtml, setChangelogHtml] = useState('<p>Initial release description.</p>');
  const [skillMetadata, setSkillMetadata] = useState<{
    name: string;
    version: string;
    tags: string[];
    roles: string[];
    network: boolean;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Pipeline simulation state
  const [pipelineStepIndex, setPipelineStepIndex] = useState(-1);
  const [pipelineStatus, setPipelineStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [pipelineLogs, setPipelineLogs] = useState<string[]>([]);

  useEffect(() => {
    if (currentUser) {
      setPubName(currentUser.name);
      setPubEmail(currentUser.email);
    }
  }, [currentUser]);

  // Reset step on kind changes
  useEffect(() => {
    setCurrentStep(0);
    setIsSuccess(false);
    setPipelineStatus('idle');
    setPipelineLogs([]);
    setPipelineStepIndex(-1);
    setUploadedFile(null);
    setSkillMetadata(null);
  }, [kind]);

  // ----------------------------------------------------
  // Skill File Upload validator
  // ----------------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.name.toLowerCase() !== 'skill.md') {
      setUploadError('File must be named SKILL.md');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds the 5MB security scanned threshold.');
      return;
    }

    const canonicalFile = new File([file], 'SKILL.md', { type: file.type });
    setUploadedFile(canonicalFile);

    // Derived metadata
    setSkillMetadata({
      name: 'Imported Skill',
      version: '1.0.0',
      tags: ['imported', 'md'],
      roles: ['developer'],
      network: false
    });
  };

  // ----------------------------------------------------
  // Prompt Linter Scanner
  // ----------------------------------------------------
  const runPromptLint = () => {
    const checks: { label: string; status: 'pass' | 'warn' | 'fail'; detail: string }[] = [];

    // 1. Required fields
    if (name.trim() && promptContent.trim()) {
      checks.push({ label: 'Basic Fields check', status: 'pass', detail: 'Title and content payload are configured.' });
    } else {
      checks.push({ label: 'Basic Fields check', status: 'fail', detail: 'Title or content templates are missing.' });
    }

    // 2. Source length
    if (promptSource.length <= 255) {
      checks.push({ label: 'Source character threshold', status: 'pass', detail: `Under limit limit (${promptSource.length}/255).` });
    } else {
      checks.push({ label: 'Source character threshold', status: 'fail', detail: `Length exceeds 255 limit (${promptSource.length}/255).` });
    }

    // 3. Output format keyword warning
    const formatKeys = /(format|json|xml|markdown|csv|output as|output format)/i;
    if (formatKeys.test(promptContent)) {
      checks.push({ label: 'Format instructions match', status: 'pass', detail: 'Explicit formatting instructions captured.' });
    } else {
      checks.push({ label: 'Format instructions match', status: 'warn', detail: 'No explicit formatting instructions defined.' });
    }

    // 4. Refusal guardrails warning
    const guardrailKeys = /(instead|if not|fail|error|refuse|sorry|unable to|invalid)/i;
    if (guardrailKeys.test(promptContent)) {
      checks.push({ label: 'Autonomous failure guardrails', status: 'pass', detail: 'Validation refusal keywords detected.' });
    } else {
      checks.push({ label: 'Autonomous failure guardrails', status: 'warn', detail: 'No failure mitigation paths or refusal blocks defined.' });
    }

    // 5. Hardcoded API secrets scan (CRITICAL FAIL)
    const secretKeys = /(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|api[_-]?key|Bearer\s+eyJ)/i;
    if (secretKeys.test(promptContent)) {
      checks.push({ label: 'Credentials & API leak scan', status: 'fail', detail: 'Hardcoded API secrets or bearer tokens caught.' });
    } else {
      checks.push({ label: 'Credentials & API leak scan', status: 'pass', detail: 'Zero hardcoded developer keys detected.' });
    }

    // 6. PII validation
    const piiKeys = /(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b|\b\d{3}-\d{2}-\d{4}\b)/i;
    if (piiKeys.test(promptContent)) {
      checks.push({ label: 'PII pattern matches', status: 'warn', detail: 'Potential phone/email addresses matches caught.' });
    } else {
      checks.push({ label: 'PII pattern matches', status: 'pass', detail: 'No PII contact signatures found.' });
    }

    return checks;
  };

  const lintResults = runPromptLint();
  const lintFailed = lintResults.some(r => r.status === 'fail');

  // ----------------------------------------------------
  // Skill Validation Pipeline Terminal simulation
  // ----------------------------------------------------
  const pipelineStages = [
    'YAML safe-load: Parsing frontmatter parameters...',
    'Metadata parsed: Validating keys, unknown fields, and reserved names...',
    'Static vulnerability scanner: Searching for subprocess executions, exec, eval...',
    'Trust clearance analyzer: Scoring risk checks...',
    'Embeddings compilation: Indexing semantic vectors database maps...',
    'Hash check: Generating deterministic SHA-256 signature...',
    'Storage publish: Pushing files payload to bucket...'
  ];

  const startPipelineScan = () => {
    setPipelineStatus('running');
    setPipelineStepIndex(0);
    setPipelineLogs(['[INIT] Beginning static analysis validation pipeline check...']);

    let current = 0;
    const interval = setInterval(() => {
      if (current < pipelineStages.length) {
        setPipelineLogs(prev => [...prev, `[RUNNING] ${pipelineStages[current]}`]);
        setPipelineStepIndex(current);
        
        // Simulating duplicate check failure on specific input file name
        if (current === 5 && uploadedFile?.name.includes('prompt-injection-filter-v1.2.0.md')) {
          setPipelineLogs(prev => [
            ...prev,
            '[CRITICAL] Duplicate code hash detected! SHA-256 matches an existing skill.',
            '[FAILED] Pipeline aborted.'
          ]);
          setPipelineStatus('failed');
          clearInterval(interval);
          return;
        }

        current++;
      } else {
        setPipelineLogs(prev => [...prev, '[SUCCESS] All rules passed. Sandbox level verified.', '[DONE] Pipeline completed.']);
        setPipelineStatus('success');
        clearInterval(interval);
      }
    }, 600);
  };

  // ----------------------------------------------------
  // Steps navigation & Validation Gates
  // ----------------------------------------------------
  const handleContinue = () => {
    // Validate current step fields
    if (kind === 'server' || kind === 'agent') {
      if (currentStep === 0) {
        if (!name.trim()) return toast.error('Name is required.');
        if (!version.trim()) return toast.error('Version is required.');
      }
      if (currentStep === 1) {
        if (!pubEmail.trim()) return toast.error('Publisher email contact is required.');
      }
      if (currentStep === 2) {
        if (!endpoint.trim()) return toast.error('Endpoint URL command is required.');
      }
    } else if (kind === 'prompt') {
      if (currentStep === 0) {
        if (!name.trim()) return toast.error('Name is required.');
        if (!promptContent.trim()) return toast.error('Prompt content template is required.');
      }
      if (currentStep === 1 && lintFailed) {
        return toast.error('Resolve critical credentials leak before submitting.');
      }
    } else if (kind === 'skill') {
      if (currentStep === 0 && !uploadedFile) {
        return toast.error('Please upload a SKILL.md or ZIP file.');
      }
      if (currentStep === 1 && pipelineStatus !== 'success') {
        return toast.error('Wait or retry scanner pipeline checks.');
      }
    }

    if (kind === 'skill' && currentStep === 0) {
      setCurrentStep(1);
      startPipelineScan();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  // ----------------------------------------------------
  // Final Registration Submit Execution
  // ----------------------------------------------------
  const handleSubmitRegistration = () => {
    const idSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(100 + Math.random() * 900);
    
    let baseAsset: any = {
      id: idSlug,
      name: kind === 'skill' ? (skillMetadata?.name || name) : name,
      version: kind === 'skill' ? (skillMetadata?.version || version) : version,
      description: kind === 'skill' ? 'Uploaded runtime action skill' : description,
      status: 'pending',
      ownerName: currentUser?.name || 'Unknown Owner',
      license,
      registeredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      weeklyCalls: [0, 0, 0, 0],
      weeklyErrors: [0, 0, 0, 0],
      trust: {
        verified: false,
        score: kind === 'skill' ? 95 : 85,
        scannedAt: new Date().toISOString(),
        audits: []
      },
      visibility: {
        global: initialGlobal,
        workspaceIds: initialWorkspaceIds
      }
    };

    if (kind === 'server') {
      baseAsset = {
        ...baseAsset,
        transport,
        endpoint,
        publisher: {
          name: pubName,
          email: pubEmail,
          org,
          website,
          supportEmail,
          supportUrl
        },
        tech: {
          endpoint,
          gatewayUrl: `https://api.modelcontextprotocol.io/v1/sse/${idSlug}`,
          authType,
          transport,
          protocolVersion,
          docsUrl: docUrl,
          sourceUrl,
          apiKeyHeaderName,
          apiKeyFormat,
          authorizationUrl: oauthAuthUrl,
          tokenUrl: oauthTokenUrl,
          scopes: oauthScopes,
          tokenEndpoint: bearerTokenEndpoint,
          refreshUrl: bearerRefreshTokenUrl
        },
        tools: mcpTools ? [{ name: 'query_database', description: 'Query sandbox catalog schemas.', paramCount: 2 }] : [],
        resources: mcpResources ? [{ name: 'server_logs', uriPattern: 'logs://stdout', mimeType: 'text/plain' }] : [],
        prompts: mcpPrompts ? [{ name: 'setup_instructions', description: 'Install template block', argCount: 0 }] : [],
        capabilities: { tools: mcpTools, resources: mcpResources, prompts: mcpPrompts },
        auditRecords: [],
        healthChecks: []
      };
    } else if (kind === 'agent') {
      baseAsset = {
        ...baseAsset,
        autonomy: autonomyLevel,
        publisher: {
          name: pubName,
          email: pubEmail
        },
        tech: {
          endpoint,
          authType,
          protocolVersion,
          apiKeyHeaderName,
          apiKeyFormat,
          authorizationUrl: oauthAuthUrl,
          tokenUrl: oauthTokenUrl,
          scopes: oauthScopes,
          tokenEndpoint: bearerTokenEndpoint,
          refreshUrl: bearerRefreshTokenUrl
        },
        skillRefs: [],
        capabilityToggles: {
          reasoning: agentReasoning,
          memory: agentMemory,
          collaboration: agentCollaboration,
          streaming: agentStreaming,
          multimodal: agentMultimodal,
          logging: agentLogging
        },
        auditRecords: [],
        healthChecks: []
      };
    } else if (kind === 'skill') {
      baseAsset = {
        ...baseAsset,
        category: 'Scanned Import',
        changelog: changelogHtml,
        stars: 0,
        downloads: 0,
        hashSignature: 'SHA-256: 4f18db0d38b5ef194a2b97c413b1f5e2777174e2d31f0b0938b',
        runtime: {
          requirements: ['mcp-sdk>=1.0.0'],
          sandbox: { network: skillMetadata?.network || false }
        },
        files: [
          { path: 'SKILL.md', size: '1.2KB', content: `# Skill: ${skillMetadata?.name}\n\nThis is a scanned autocompiled skill layout.` }
        ],
        comments: [],
        auditLogs: []
      };
    } else if (kind === 'prompt') {
      baseAsset = {
        ...baseAsset,
        source: promptSource,
        rawPrompt: promptContent,
        args: promptTags.split(',').map(t => ({ name: t.trim(), required: true, description: `Variable placeholder ${t}` })).filter(a => a.name !== ''),
        comments: [],
        auditLogs: []
      };
    }

    registerItem(kind!, baseAsset);
    setIsSuccess(true);
    toast.success('Registration request submitted successfully.');
  };

  // ----------------------------------------------------
  // Initial Visibility Block UI Helper
  // ----------------------------------------------------
  const renderVisibilitySection = () => {
    if (!currentUser) return null;
    const sharedWorkspaces = workspaces.filter(w => w.members.includes(currentUser.name));

    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4 space-y-4">
        <div>
          <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">Initial Visibility share</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Control where this asset will list automatically once approved.</p>
        </div>

        <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-md">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-700">Public Global Listing</span>
            <span className="text-[10px] text-gray-400">Available to all directory users once approved</span>
          </div>
          <input 
            type="checkbox" 
            checked={initialGlobal} 
            onChange={e => setInitialGlobal(e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
        </div>

        {sharedWorkspaces.length > 0 && (
          <div className="space-y-1.5">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider select-none">Share to Workspaces</span>
            <div className="max-h-28 overflow-y-auto border border-gray-200 bg-white rounded-md p-2 space-y-1">
              {sharedWorkspaces.map(ws => (
                <label key={ws.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer text-xs">
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
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="font-semibold text-gray-700">{ws.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ----------------------------------------------------
  // Steppers navigation indicator header
  // ----------------------------------------------------
  const renderSteppersHeader = (total: number) => {
    return (
      <div className="flex items-center gap-2 select-none border-b border-gray-200 pb-4 mb-6 overflow-x-auto">
        {Array.from({ length: total }).map((_, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
              <div className="flex items-center gap-1.5 text-xs font-semibold shrink-0">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] ${
                  isDone 
                    ? 'bg-emerald-500 text-white' 
                    : isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gray-100 text-gray-400 border'
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                </span>
                <span className={isActive ? 'text-gray-800' : 'text-gray-400'}>
                  {kind === 'server' || kind === 'agent'
                    ? ['Basic info', 'Publisher details', 'Technical configs', 'Capabilities', 'Review submit'][idx]
                    : ['Asset payload', 'Scanner scans', 'Review submit'][idx]}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // ----------------------------------------------------
  // Kind Selection Grid (Landing)
  // ----------------------------------------------------
  if (!kind) {
    const assets = [
      { id: 'server', name: 'MCP Server', desc: 'Context gateway connector supporting standard protocol routes', icon: Server, enabled: true },
      { id: 'agent', name: 'A2A Agent', desc: 'Autonomous execution agent with custom webhook endpoints', icon: Bot, enabled: true },
      { id: 'skill', name: 'Skill (Instruction)', desc: 'Governed LLM system prompts instruction sets', icon: FileText, enabled: true },
      { id: 'prompt', name: 'Prompt Template', desc: 'Reusable argument templates prompt block text', icon: Sparkles, enabled: FEATURES.prompts }
    ];

    return (
      <div className="max-w-2xl mx-auto space-y-6 select-none pt-8">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">Register Registry Asset</h1>
          <p className="text-xs text-gray-500 mt-1">Select the asset class you want to submit for governance approval.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {assets.map(a => {
            const Icon = a.icon;
            return (
              <button
                key={a.id}
                disabled={!a.enabled}
                onClick={() => setSearchParams({ kind: a.id })}
                className={`p-5 text-left border bg-white rounded-md hover:border-primary hover:bg-gray-50 cursor-pointer select-none transition-all group ${
                  a.enabled ? 'border-gray-200' : 'opacity-40 cursor-not-allowed border-dashed'
                }`}
              >
                <div className="w-10 h-10 rounded bg-gray-100 text-gray-500 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  {a.name}
                  {!a.enabled && <span className="text-[9px] font-mono border px-1 rounded bg-gray-50 text-gray-400">Gated</span>}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{a.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Success state render
  // ----------------------------------------------------
  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4 select-none">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shrink-0">
          <Check className="w-6 h-6" />
        </div>
        <h2 className="text-sm font-bold text-gray-800">Registration Submitted</h2>
        <p className="text-xs text-gray-500 leading-relaxed">
          Your asset has been successfully submitted to the approvals pipeline queue. A platform administrator has been notified.
        </p>
        <div className="flex gap-2.5 justify-center pt-2">
          <button 
            onClick={() => navigate('/catalog')}
            className="px-3.5 py-1.5 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 cursor-pointer focus:outline-none"
          >
            Back to Catalog
          </button>
          <button 
            onClick={() => setSearchParams({})}
            className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
          >
            Register Another
          </button>
        </div>
      </div>
    );
  }

  const stepsCount = kind === 'server' || kind === 'agent' ? 5 : 3;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {renderSteppersHeader(stepsCount)}

      <div className="bg-white border border-gray-200 rounded-md p-6">
        
        {/* ==================================================== */}
        {/* SERVERS & AGENTS STEP MULTIPLEX */}
        {/* ==================================================== */}
        {(kind === 'server' || kind === 'agent') && (
          <>
            {currentStep === 0 && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-gray-800 pb-2 border-b">Basic Metadata</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Asset Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Postgres Connection Gateway" className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Initial Version *</label>
                    <input type="text" value={version} onChange={e => setVersion(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary font-mono-custom" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Description</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Explain how client LLMs should utilize this integration..." className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">License Policy *</label>
                  <select value={license} onChange={e => setLicense(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded bg-white font-semibold text-gray-700 cursor-pointer focus:outline-none">
                    <option value="MIT">MIT License</option>
                    <option value="Apache-2.0">Apache 2.0</option>
                    <option value="Proprietary">Proprietary Closed-Source</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4 text-xs font-semibold">
                <h3 className="text-sm font-bold text-gray-800 pb-2 border-b">Publisher contact info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-750">Publisher Name *</label>
                    <input type="text" value={pubName} disabled className="w-full px-2.5 py-1.5 border border-gray-200 rounded bg-gray-50 text-gray-400 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-750">Publisher Email *</label>
                    <input type="email" value={pubEmail} onChange={e => setPubEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-755">Organization</label>
                    <input type="text" value={org} onChange={e => setOrg(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-755">Website</label>
                    <input type="text" value={website} onChange={e => setWebsite(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-255 rounded focus:outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-gray-755">Support Email</label>
                    <input type="text" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-gray-755">Support URL</label>
                    <input type="text" value={supportUrl} onChange={e => setSupportUrl(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none" />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-gray-800 pb-2 border-b">Technical Configuration</h3>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Endpoint Connection string / command *</label>
                  <input type="text" value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="e.g. npx -y @modelcontextprotocol/server-postgres" className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary font-mono-custom" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Auth posture type</label>
                    <select value={authType} onChange={e => handleAuthTypeChange(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded bg-white text-gray-700 cursor-pointer focus:outline-none">
                      <option value="none">No authentication</option>
                      <option value="api-key">API key</option>
                      <option value="oauth2">OAuth 2.0</option>
                      <option value="bearer">Bearer token</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Transport type</label>
                    <select value={transport} onChange={e => setTransport(e.target.value as any)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded bg-white text-gray-700 cursor-pointer focus:outline-none">
                      <option value="stdio">stdio pipe</option>
                      <option value="sse">sse endpoint</option>
                      <option value="http">http jsonrpc</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Protocol version</label>
                    <input type="text" value={protocolVersion} onChange={e => setProtocolVersion(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none font-mono-custom" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Documentation link</label>
                    <input type="text" value={docUrl} onChange={e => setDocUrl(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Source repository URL</label>
                    <input type="text" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none" />
                  </div>
                </div>

                {/* Conditional Auth Fields */}
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                  {authType === 'none' && (
                    <p className="text-[11px] text-gray-400 italic">No authentication configured.</p>
                  )}
                  
                  {authType === 'api-key' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">API key header name</label>
                        <input 
                          type="text" 
                          value={apiKeyHeaderName} 
                          onChange={e => setApiKeyHeaderName(e.target.value)} 
                          className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none font-mono-custom" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Key format (optional regex)</label>
                        <input 
                          type="text" 
                          value={apiKeyFormat} 
                          onChange={e => setApiKeyFormat(e.target.value)} 
                          placeholder="e.g. ^[A-Za-z0-9]{32}$" 
                          className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none font-mono-custom" 
                        />
                      </div>
                    </div>
                  )}

                  {authType === 'oauth2' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-700">Authorization URL *</label>
                          <input 
                            type="text" 
                            value={oauthAuthUrl} 
                            onChange={e => setOauthAuthUrl(e.target.value)} 
                            placeholder="https://example.com/oauth/authorize" 
                            className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none font-mono-custom" 
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-gray-700">Token URL *</label>
                          <input 
                            type="text" 
                            value={oauthTokenUrl} 
                            onChange={e => setOauthTokenUrl(e.target.value)} 
                            placeholder="https://example.com/oauth/token" 
                            className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none font-mono-custom" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Scopes (comma-separated)</label>
                        <input 
                          type="text" 
                          value={oauthScopes} 
                          onChange={e => setOauthScopes(e.target.value)} 
                          placeholder="read, write, admin" 
                          className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none" 
                        />
                      </div>
                    </div>
                  )}

                  {authType === 'bearer' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Token endpoint *</label>
                        <input 
                          type="text" 
                          value={bearerTokenEndpoint} 
                          onChange={e => setBearerTokenEndpoint(e.target.value)} 
                          placeholder="https://example.com/api/token" 
                          className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none font-mono-custom" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-gray-700">Refresh URL (optional)</label>
                        <input 
                          type="text" 
                          value={bearerRefreshTokenUrl} 
                          onChange={e => setBearerRefreshTokenUrl(e.target.value)} 
                          placeholder="https://example.com/api/refresh" 
                          className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none font-mono-custom" 
                        />
                      </div>
                    </div>
                  )}

                  {authType !== 'none' && (
                    <span className="block text-[10px] text-gray-400 mt-1 italic">Fields cleared on auth type change</span>
                  )}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6 text-xs select-none">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Capabilities Toggles</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Capabilities are fixed at registration. These are read-only thereafter.</p>
                </div>

                {kind === 'server' ? (
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-700 block">Expose Tools Capability</span>
                        <span className="text-[10px] text-gray-450">Exposes custom tool parameters models to clients</span>
                      </div>
                      <input type="checkbox" checked={mcpTools} onChange={e => setMcpTools(e.target.checked)} className="rounded text-primary cursor-pointer size-4" />
                    </label>
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-700 block">Expose Resources Capability</span>
                        <span className="text-[10px] text-gray-455">Permits reading raw text document stream models</span>
                      </div>
                      <input type="checkbox" checked={mcpResources} onChange={e => setMcpResources(e.target.checked)} className="rounded text-primary cursor-pointer size-4" />
                    </label>
                    <label className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                      <div className="space-y-0.5">
                        <span className="font-bold text-gray-700 block">Expose Prompts Template Capability</span>
                        <span className="text-[10px] text-gray-455">Preloads system workflow prompts</span>
                      </div>
                      <input type="checkbox" checked={mcpPrompts} onChange={e => setMcpPrompts(e.target.checked)} className="rounded text-primary cursor-pointer size-4" />
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="font-semibold text-gray-700">Autonomy tier</label>
                      <select value={autonomyLevel} onChange={e => setAutonomyLevel(e.target.value as any)} className="w-full px-2.5 py-1.5 border border-gray-250 rounded bg-white text-gray-700 font-semibold cursor-pointer">
                        <option value="Low">Low (Requires approvals on all tool execution actions)</option>
                        <option value="Mid">Mid (Requires approvals only on state-mutating actions)</option>
                        <option value="High">High (Autonomous agent loop without human in the loop)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: 'Reasoning capabilities', state: agentReasoning, set: setAgentReasoning },
                        { label: 'Short-term execution memory', state: agentMemory, set: setAgentMemory },
                        { label: 'Cross-agent collaboration', state: agentCollaboration, set: setAgentCollaboration },
                        { label: 'Autosave audit logs', state: agentLogging, set: setAgentLogging }
                      ].map((toggle, idx) => (
                        <label key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-55 cursor-pointer">
                          <span className="font-bold text-gray-700">{toggle.label}</span>
                          <input type="checkbox" checked={toggle.state} onChange={e => toggle.set(e.target.checked)} className="rounded text-primary cursor-pointer size-4" />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Review & Submit Registration</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Confirm details and specify workspaces access limits before publishing.</p>
                </div>

                <div className="border border-gray-150 rounded bg-gray-50 p-4 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Class:</span>
                    <span className="font-bold text-gray-700 uppercase">{kind}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="font-bold text-gray-700">{name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Endpoint:</span>
                    <span className="font-mono text-gray-600 truncate max-w-sm">{endpoint}</span>
                  </div>
                </div>

                {renderVisibilitySection()}
              </div>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* PROMPTS STEP MULTIPLEX */}
        {/* ==================================================== */}
        {kind === 'prompt' && (
          <>
            {currentStep === 0 && (
              <div className="space-y-4 text-xs">
                <h3 className="text-sm font-bold text-gray-800 pb-2 border-b">Template Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Template Title *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Code Review Prompt" className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-gray-700">Source url/attribution (Max 255 chars)</label>
                    <input type="text" value={promptSource} onChange={e => setPromptSource(e.target.value)} placeholder="e.g. github.com/prompts/library" className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Template instruction text *</label>
                  <textarea value={promptContent} onChange={e => setPromptContent(e.target.value)} rows={6} placeholder="Write the LLM prompt block template. Use {{variables}} notation for inputs..." className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none focus:ring-1 focus:ring-primary font-mono-custom" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-gray-700">Variables declared (comma separated)</label>
                  <input type="text" value={promptTags} onChange={e => setPromptTags(e.target.value)} placeholder="e.g. language, code_snippet" className="w-full px-2.5 py-1.5 border border-gray-250 rounded focus:outline-none" />
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Pre-publish static security checks</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Prompt contents are parsed for credentials leak and safe formatting patterns.</p>
                </div>

                <div className="border border-gray-200 bg-white rounded overflow-hidden divide-y divide-gray-150">
                  {lintResults.map((check, idx) => (
                    <div key={idx} className="p-3.5 flex items-start justify-between gap-4 text-xs select-none">
                      <div className="min-w-0">
                        <span className="font-bold text-gray-700 block">{check.label}</span>
                        <span className="text-gray-400 mt-0.5 block">{check.detail}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        check.status === 'pass' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : check.status === 'warn' 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {lintFailed && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-rose-700 text-xs font-semibold leading-relaxed flex gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Submission blocked: A critical secrets leak check failed. Remove credentials keywords or API keys before proceeding.</span>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Review & Submit</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Define share rules before submitting to the approval catalog pipeline.</p>
                </div>

                {renderVisibilitySection()}
              </div>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* SKILLS STEP MULTIPLEX */}
        {/* ==================================================== */}
        {kind === 'skill' && (
          <>
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Upload SKILL.md file</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Upload a SKILL.md document containing your skill specifications and body rules.</p>
                </div>

                <div className="border-2 border-dashed border-gray-200 rounded-md p-8 text-center bg-gray-50 select-none relative">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".md"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <span className="text-xs font-bold text-gray-700 block">Click or Drag SKILL.md file here</span>
                  <span className="text-[10px] text-gray-400 mt-1 block">Drop your SKILL.md file here or click to browse (max 5 MB)</span>
                </div>

                {uploadError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs font-semibold text-rose-700 flex gap-2 select-none">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadedFile && (
                  <div className="p-3 bg-white border border-gray-200 rounded flex items-center justify-between text-xs select-none">
                    <div>
                      <span className="font-bold text-gray-700 block truncate max-w-sm">{uploadedFile.name}</span>
                      <span className="text-gray-400 text-[10px]">{(uploadedFile.size/1024).toFixed(1)} KB · Scanned Type Verified</span>
                    </div>
                    <button onClick={() => setUploadedFile(null)} className="text-rose-600 font-bold cursor-pointer">Remove</button>
                  </div>
                )}
              </div>
            )}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Scanners pipeline logs</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Simulated terminal execution scans the file code check rules.</p>
                </div>

                {/* Pipeline terminal console */}
                <div className="bg-gray-900 border border-gray-800 text-gray-100 font-mono text-[11px] p-4 rounded-md h-52 overflow-y-auto space-y-1.5 shadow-inner select-text">
                  {pipelineLogs.map((log, lIdx) => {
                    const isSuccess = log.includes('[SUCCESS]') || log.includes('[DONE]');
                    const isFail = log.includes('[CRITICAL]') || log.includes('[FAILED]');
                    return (
                      <div key={lIdx} className={isSuccess ? 'text-emerald-400 font-semibold' : isFail ? 'text-rose-400 font-semibold' : 'text-gray-300'}>
                        {log}
                      </div>
                    );
                  })}
                  {pipelineStatus === 'running' && (
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      <span>Scanner in progress... (Step {pipelineStepIndex + 1} of {pipelineStages.length})</span>
                    </div>
                  )}
                </div>

                {pipelineStatus === 'failed' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-rose-700 text-xs font-semibold leading-relaxed flex gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>Simulation rule failed: Duplicate code hash detected. Submission is blocked for duplicate md files.</span>
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-800">Review & Submit</h3>
                  <p className="text-xs text-gray-505 mt-0.5">Write release logs and configure share rules.</p>
                </div>

                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Version Changelog logs</span>
                  <ChangelogEditor value={changelogHtml} onChange={setChangelogHtml} />
                </div>

                {renderVisibilitySection()}
              </div>
            )}
          </>
        )}

        {/* ==================================================== */}
        {/* FOOTER WIZARD CONTROLS */}
        {/* ==================================================== */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-5 mt-6 select-none">
          <button
            onClick={() => {
              if (currentStep === 0) {
                setSearchParams({});
              } else {
                setCurrentStep(prev => prev - 1);
              }
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded border border-gray-200 bg-white text-gray-705 hover:bg-gray-50 cursor-pointer focus:outline-none"
          >
            {currentStep === 0 ? 'Cancel' : 'Previous'}
          </button>

          {currentStep === stepsCount - 1 ? (
            <button
              onClick={handleSubmitRegistration}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
            >
              Submit Registration
            </button>
          ) : (
            <button
              onClick={handleContinue}
              className="px-4 py-1.5 text-xs font-semibold rounded bg-primary text-primary-foreground hover:opacity-90 cursor-pointer focus:outline-none"
            >
              Continue
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
