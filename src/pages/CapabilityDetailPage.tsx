import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useRegistry } from '@/data/RegistryContext';
import {
  EnableToggle, EmptyState, CopyBlock, HealthDot
} from '@/components/registry/Kit';
import { SmartTable } from '@/components/registry/Primitives';
import { 
  ArrowLeft, Globe, Link2, Wrench, MessageSquare, ExternalLink
} from 'lucide-react';

interface CapabilityDetailPageProps {
  kind: 'tool' | 'resource' | 'prompt';
}

export const CapabilityDetailPage: React.FC<CapabilityDetailPageProps> = ({ kind }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mcpServers, toggleCapabilityItem, can, getHealthDisplay } = useRegistry();
  const [activeTab, setActiveTab] = useState<'overview' | 'connection' | 'registry'>('overview');

  // Parse parentServerId and item name from path id
  const [parentServerId, name] = (id || '').split('__');
  const server = mcpServers.find(s => s.id === parentServerId);

  // Find the specific capability item
  const item = (() => {
    if (!server) return null;
    if (kind === 'tool') return server.tools?.find((t: any) => t.name === name);
    if (kind === 'resource') return server.resources?.find((r: any) => r.name === name);
    if (kind === 'prompt') return server.prompts?.find((p: any) => p.name === name);
    return null;
  })();

  if (!server || !item) {
    return (
      <div className="p-6">
        <EmptyState 
          description={`The requested capability detail record (${kind}: ${name}) could not be resolved in any active parent workspace.`} 
        />
        <button onClick={() => navigate('/catalog')} className="mt-4 flex items-center gap-2 text-xs font-bold text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </button>
      </div>
    );
  }

  const isItemDisabled = !!(item as any).disabled;
  const capitalizedKind = kind.charAt(0).toUpperCase() + kind.slice(1);

  return (
    <div className="p-6 space-y-6 select-none max-w-6xl mx-auto">
      
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between text-xs text-gray-400 select-none">
        <div className="flex items-center gap-1.5 font-medium">
          <Link to="/catalog" className="hover:text-primary transition-colors">Catalog</Link>
          <span>/</span>
          <Link to={`/catalog?mode=capabilities&facet=${kind}s`} className="hover:text-primary transition-colors font-semibold">{capitalizedKind}s</Link>
          <span>/</span>
          <span className="text-gray-700 font-bold font-mono-custom">{name}</span>
        </div>
        <Link 
          to={`/servers/${server.id}`} 
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-bold"
        >
          Open parent server <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/5 rounded-lg flex items-center justify-center shrink-0 border border-primary/15 text-primary">
            {kind === 'tool' && <Wrench className="w-6 h-6" />}
            {kind === 'resource' && <Link2 className="w-6 h-6" />}
            {kind === 'prompt' && <MessageSquare className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-gray-800 font-mono-custom">{name}</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border bg-gray-50 border-gray-200 text-gray-500">
                {kind}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Belongs to <span className="font-semibold text-gray-700">{server.name}</span> · Published by {server.publisher?.name || 'Community'}
            </p>
          </div>
        </div>

        {/* Global toggler inside Detail Panel */}
        <div className="shrink-0 flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-lg p-3 self-start md:self-center">
          <div className="text-right">
            <span className="block text-[9px] uppercase font-bold text-gray-400">Capability Toggle</span>
            <span className={`text-[10px] font-bold ${isItemDisabled ? 'text-gray-400' : 'text-emerald-600'}`}>
              {isItemDisabled ? 'Disabled globally' : 'Active / Enabled'}
            </span>
          </div>
          <EnableToggle 
            checked={!isItemDisabled} 
            onChange={() => toggleCapabilityItem(server.id, (kind + 's') as any, name)}
            disabled={!can('toggle-capability', server)}
          />
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-4 border-b border-gray-250 select-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === 'overview'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('connection')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === 'connection'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          Connection & Publisher
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider transition-all relative ${
            activeTab === 'registry'
              ? 'text-primary border-b-2 border-primary'
              : 'text-gray-400 hover:text-gray-700'
          }`}
        >
          Registry & Compliance
        </button>
      </div>

      {/* Content panes */}
      <div className="min-h-[300px]">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 columns: Schemas & parameters */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-5 space-y-4 shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Description</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {(item as any).description || 'No description has been published for this capability.'}
                </p>
              </div>

              {kind === 'tool' && (item as any).params && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Input Parameter Schema</h3>
                  <CopyBlock code={JSON.stringify((item as any).params, null, 2)} language="json" />
                </div>
              )}

              {kind === 'resource' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Resource Pattern URI</h3>
                    <span className="font-mono text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-700 select-all block">
                      {(item as any).uriPattern || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Expected MIME Type</h3>
                    <span className="font-mono text-xs bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-750 block">
                      {(item as any).mimeType || 'application/json'}
                    </span>
                  </div>
                </div>
              )}

              {kind === 'prompt' && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Template Arguments</h3>
                  {(item as any).args && (item as any).args.length > 0 ? (
                    <div className="border border-gray-150 rounded overflow-hidden bg-white max-w-lg">
                      <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-150">
                          <tr className="text-[10px] font-bold text-gray-400 uppercase">
                            <th className="px-3 py-1.5">Name</th>
                            <th className="px-3 py-1.5">Type</th>
                            <th className="px-3 py-1.5">Required</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-[11px]">
                          {(item as any).args.map((arg: any) => (
                            <tr key={arg.name}>
                              <td className="px-3 py-1.5 font-mono text-gray-700">{arg.name}</td>
                              <td className="px-3 py-1.5 text-gray-500">{arg.type || 'string'}</td>
                              <td className="px-3 py-1.5 font-semibold text-gray-700">{arg.required ? 'Yes' : 'No'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-450 italic p-3 border border-dashed rounded bg-gray-50">
                      No argument options defined. Prompt can be invoked immediately without setup parameters.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column: Quick Specs list */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">Capability Specs</h3>
                <dl className="space-y-3.5 text-xs">
                  <div>
                    <dt className="text-gray-400 font-semibold mb-0.5">Assigned Name</dt>
                    <dd className="font-mono text-gray-700 font-bold select-all bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded inline-block">{name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-0.5">Parent Entity ID</dt>
                    <dd className="font-mono text-gray-700 select-all">{server.id}</dd>
                  </div>
                  {kind === 'tool' && (
                    <div>
                      <dt className="text-gray-400 font-semibold mb-0.5">Historical Usage (30d)</dt>
                      <dd className="font-semibold text-gray-850 font-mono-custom text-sm">{(item as any).invocations30d || 140} calls</dd>
                    </div>
                  )}
                  {kind === 'prompt' && (
                    <div>
                      <dt className="text-gray-400 font-semibold mb-0.5">Total Arguments</dt>
                      <dd className="font-bold text-gray-850 font-mono-custom">{(item as any).argCount || (item as any).args?.length || 0}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'connection' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Connection Information */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">Technical Connection Spec</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="border border-gray-100 rounded p-3 bg-gray-50/30">
                  <dt className="text-gray-400 font-semibold mb-1">Gateway Gateway URL</dt>
                  <dd className="font-mono font-bold text-gray-700 select-all truncate">{server.tech?.gatewayUrl || 'http://gateway.internal'}</dd>
                </div>
                <div className="border border-gray-100 rounded p-3 bg-gray-50/30">
                  <dt className="text-gray-400 font-semibold mb-1">Endpoint Endpoint URL</dt>
                  <dd className="font-mono font-bold text-gray-700 select-all truncate">{server.tech?.endpoint || 'http://localhost'}</dd>
                </div>
                <div className="border border-gray-100 rounded p-3 bg-gray-50/30">
                  <dt className="text-gray-400 font-semibold mb-1">Auth Type</dt>
                  <dd className="font-semibold text-gray-700 uppercase">{server.tech?.authType || 'none'}</dd>
                </div>
                <div className="border border-gray-100 rounded p-3 bg-gray-50/30">
                  <dt className="text-gray-400 font-semibold mb-1">Protocol Version</dt>
                  <dd className="font-mono text-gray-600">{server.tech?.protocolVersion || '1.0.0'}</dd>
                </div>
              </dl>
            </div>

            {/* Publisher Information */}
            <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">Publisher Detail</h3>
              <dl className="space-y-3.5 text-xs">
                <div>
                  <dt className="text-gray-400 font-semibold">Publisher Name</dt>
                  <dd className="font-bold text-gray-800">{server.publisher?.name || 'Community'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-semibold">Organization</dt>
                  <dd className="font-semibold text-gray-650">{server.publisher?.organization || 'Individual Contributor'}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-semibold">Contact Email</dt>
                  <dd className="text-primary font-medium hover:underline select-all">{server.publisher?.email || 'support@mcp.org'}</dd>
                </div>
              </dl>
            </div>

          </div>
        )}

        {activeTab === 'registry' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 columns: Compliance scan list */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-md p-5 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2 flex items-center justify-between">
                <span>Security Compliance Scans</span>
                <span className="text-[10px] text-gray-450 normal-case font-medium">Last audited: {server.trust?.scannedAt ? new Date(server.trust.scannedAt).toLocaleDateString() : 'Today'}</span>
              </h3>
              
              {server.trust?.audits && server.trust.audits.length > 0 ? (
                <SmartTable 
                  data={server.trust.audits.map((a: any, idx: number) => ({ ...a, id: idx }))}
                  columns={[
                    { key: 'check', header: 'Compliance rule', render: (row: any) => <span className="font-semibold text-gray-700">{row.check || row.rule}</span> },
                    { key: 'severity', header: 'Severity', render: (row: any) => <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-gray-50 text-gray-500 border-gray-200">{row.severity || 'Medium'}</span> },
                    { key: 'status', header: 'Status', render: (row: any) => <span className="text-emerald-700 font-bold uppercase">{row.status || 'Pass'}</span> },
                    { key: 'detail', header: 'Detail', render: (row: any) => <span className="text-gray-400">{row.detail}</span> }
                  ]}
                />
              ) : (
                <EmptyState description="No compliance audits exist for this parent asset." />
              )}
            </div>

            {/* Right column: Governance status */}
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-md p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider border-b pb-2">Governance Metadata</h3>
                <dl className="space-y-3.5 text-xs">
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Approved Status</dt>
                    <dd>
                      <span className={`inline-block font-semibold px-2 py-0.5 rounded-full border text-[11px] badge-status-${server.status}`}>
                        {server.status.toUpperCase()}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-1">Parent Server Health</dt>
                    <dd className="flex items-center gap-1.5">
                      <HealthDot status={getHealthDisplay(server)} showLabel />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-400 font-semibold mb-0.5">Global Visibility</dt>
                    <dd className="font-semibold text-gray-700 flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      {server.visibility?.global ? 'Visible to everyone' : 'Restricted visibility'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
