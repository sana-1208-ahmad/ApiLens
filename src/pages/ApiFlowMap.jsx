import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitFork,
  UploadCloud,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layers,
  ChevronDown,
  Globe,
  Share2,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Monitor,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import { useHar } from '../context/HarContext';

export default function ApiFlowMap() {
  const navigate = useNavigate();
  const { isLoaded, flowGraph, entries, metrics } = useHar();

  const [layoutMode, setLayoutMode] = useState('Group by Domain');
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (!flowGraph?.nodes) return [];
    if (!searchQuery.trim()) return flowGraph.nodes;
    const q = searchQuery.toLowerCase();
    return flowGraph.nodes.filter((n) => n.name.toLowerCase().includes(q));
  }, [flowGraph, searchQuery]);

  const graphLayout = {
    grid: layoutMode === 'Group by Domain'
      ? 'lg:grid-cols-12'
      : layoutMode === 'Radial Hierarchy'
      ? 'lg:grid-cols-6'
      : 'lg:grid-cols-1',
    client: layoutMode === 'Group by Domain' ? 'lg:col-span-3' : 'lg:col-span-6',
    domains: layoutMode === 'Group by Domain' ? 'lg:col-span-4' : 'lg:col-span-3',
    endpoints: layoutMode === 'Group by Domain'
      ? 'lg:col-span-5'
      : layoutMode === 'Radial Hierarchy'
      ? 'lg:col-span-3'
      : 'lg:col-span-1',
  };

  return (
    <PageContainer maxWidth="max-w-[1720px]">
      <div className="flex flex-col gap-6">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
                API Flow Map
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-mono text-xs">
                <span className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-emerald-500' : 'bg-outline'}`}></span>
                {isLoaded ? 'Topology Engine Active' : 'Graph Engine Idle'}
              </span>
            </div>
            <p className="text-sm text-secondary">
              Visualize relationships, call sequences, and dependency flow derived strictly from captured API requests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-[#DCE5FF] text-secondary text-xs font-mono">
              <GitFork className="w-3.5 h-3.5 text-outline" />
              <span className="font-semibold text-navy-text">
                {isLoaded ? flowGraph.nodes.length : 0} Nodes
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-semibold text-navy-text">
                {isLoaded ? flowGraph.links.length : 0} Links
              </span>
            </div>

            {/* Layout Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                icon={Layers}
                onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              >
                <span>{layoutMode}</span>
                <ChevronDown className="w-3.5 h-3.5 text-outline" />
              </Button>

              {showLayoutMenu && (
                <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white border border-[#DCE5FF] shadow-xl z-30 p-1 flex flex-col">
                  {['Group by Domain', 'Radial Hierarchy', 'Force-Directed Waterfall'].map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setLayoutMode(mode);
                        setShowLayoutMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        layoutMode === mode
                          ? 'bg-lavender text-primary-container font-semibold'
                          : 'text-secondary hover:bg-surface-container-low hover:text-navy-text'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={UploadCloud}
              onClick={() => navigate('/har-upload')}
            >
              {isLoaded ? 'Change HAR' : 'Upload HAR File'}
            </Button>
          </div>
        </div>

        {/* Filter & Graph Canvas Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-[#DCE5FF] shadow-subtle">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter graph nodes or domains..."
              className="w-full pl-9 pr-10 py-1.5 h-9 bg-surface rounded-lg text-xs text-navy-text placeholder:text-outline border border-[#DCE5FF]/60 focus:outline-none focus:ring-2 focus:ring-primary-container/20"
            />
          </div>

          {/* Graph Zoom & View Controls */}
          <div className="flex items-center gap-1 self-end sm:self-center">
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.5, z + 0.1))}
              title="Zoom In"
              className="p-2 rounded-lg bg-surface-container-low text-secondary hover:text-navy-text hover:bg-surface-container transition-colors border border-[#DCE5FF]/40"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.1))}
              title="Zoom Out"
              className="p-2 rounded-lg bg-surface-container-low text-secondary hover:text-navy-text hover:bg-surface-container transition-colors border border-[#DCE5FF]/40"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setSelectedNode(null);
              }}
              title="Reset View"
              className="p-2 rounded-lg bg-surface-container-low text-secondary hover:text-navy-text hover:bg-surface-container transition-colors border border-[#DCE5FF]/40"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visual Graph Canvas Area */}
        <div className="relative min-h-[600px] rounded-2xl bg-surface-container-low border border-[#DCE5FF] shadow-subtle overflow-hidden flex flex-col p-6">
          {/* Subtle Canvas Dot Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: 'radial-gradient(#C3C5D8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {isLoaded ? (
            <div
              className="relative z-10 flex-1 flex flex-col justify-between transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
            >
              {/* Graph Architecture Map */}
              <div className={`grid grid-cols-1 ${graphLayout.grid} gap-6 items-start py-6`}>
                {/* Level 1: Client Node */}
                <div className={`${graphLayout.client} flex flex-col items-center justify-center p-4`}>
                  <div
                    onClick={() =>
                      setSelectedNode({
                        name: 'Browser Client Ingress',
                        type: 'Client Ingress',
                        details: `Dispatched all ${metrics.totalRequests} captured HTTP archive requests across ${metrics.uniqueDomains} domains.`,
                      })
                    }
                    className="w-full max-w-xs p-4 rounded-2xl bg-white border-2 border-primary-container shadow-md hover:shadow-lg transition-all cursor-pointer text-center group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary-container mx-auto flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                      <Monitor className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-navy-text text-sm">Browser Client</h3>
                    <p className="text-[11px] font-mono text-secondary mt-0.5">
                      {metrics.totalRequests} Outgoing Requests
                    </p>
                  </div>
                </div>

                {/* Level 2: Domains & Service Gateways */}
                <div className={`${graphLayout.domains} flex flex-col gap-4`}>
                  <span className="font-mono text-[10px] uppercase font-bold text-outline tracking-wider text-center block">
                    Host Domains ({metrics.uniqueDomains})
                  </span>

                  {Object.entries(metrics.domains).map(([domain, count]) => {
                    const domainNode = flowGraph.nodes.find((node) => node.id === `domain-${domain}`);
                    const isSecure = domainNode?.isSecure ?? true;
                    return (
                      <div
                        key={domain}
                        onClick={() =>
                          setSelectedNode({
                            name: domain,
                            type: 'Service Gateway',
                            details: `Receives ${count} calls from Browser Client. Protocol: ${isSecure ? 'HTTPS' : 'Cleartext HTTP'}.`,
                          })
                        }
                        className={`p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all cursor-pointer ${
                          !isSecure ? 'border-rose-300 ring-2 ring-rose-100' : 'border-[#DCE5FF]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-xs text-navy-text flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-primary-container" />
                            {domain}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              isSecure
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isSecure ? 'HTTPS' : 'HTTP (Insecure)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-secondary font-mono">
                          {count} calls routed
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Level 3: Discovered Endpoints Breakdown */}
                <div className={`${graphLayout.endpoints} flex flex-col gap-2 max-h-[460px] overflow-y-auto pr-2`}>
                  <span className="font-mono text-[10px] uppercase font-bold text-outline tracking-wider text-center block">
                    Target Endpoints ({entries.length})
                  </span>

                  {filteredNodes
                    .filter((n) => n.type === 'endpoint')
                    .map((node) => {
                      const isErr = node.status >= 400;
                      return (
                        <div
                          key={node.id}
                          onClick={() =>
                            setSelectedNode({
                              name: node.name,
                              type: 'Discovered Endpoint',
                              details: `Path: ${node.pathname}. Primary response: HTTP ${node.status}. Latency: ${node.latency} ms. Host: ${node.domain}.`,
                            })
                          }
                          className="p-2.5 rounded-lg bg-white border border-[#DCE5FF] hover:border-[#BAC9F5] transition-all cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                node.method === 'GET'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : node.method === 'POST'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {node.method}
                            </span>
                            <span className="font-mono text-navy-text truncate">
                              {node.pathname}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            <span
                              className={
                                isErr
                                  ? 'text-rose-600 font-bold'
                                  : 'text-emerald-700 font-bold'
                              }
                            >
                              {node.status}
                            </span>
                            <span className="text-secondary">{node.latency}ms</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Node Inspector Drawer */}
              {selectedNode && (
                <div className="mt-4 p-4 rounded-xl bg-white border border-primary-container shadow-lg flex items-center justify-between">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-primary-container">
                      Node Inspector: {selectedNode.type}
                    </span>
                    <h4 className="font-bold text-navy-text text-sm">{selectedNode.name}</h4>
                    <p className="text-xs text-secondary mt-0.5">{selectedNode.details}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setSelectedNode(null)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 max-w-md mx-auto my-auto flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-white border border-[#DCE5FF] shadow-card flex items-center justify-center text-primary-container mb-4">
                <GitFork className="w-8 h-8 text-primary-container" />
              </div>

              <h3 className="text-xl font-semibold text-navy-text tracking-tight mb-2">
                API Graph Ready
              </h3>
              <p className="text-sm text-secondary leading-relaxed mb-6">
                Upload HAR traffic to visualize service connections, dependency flow, microservice calls, and 3rd-party domain interactions.
              </p>

              <Button
                variant="primary"
                size="lg"
                icon={UploadCloud}
                onClick={() => navigate('/har-upload')}
              >
                Upload HAR File
              </Button>
            </div>
          )}

          {/* Graph Legend */}
          <div className="mt-auto pt-4 flex items-center justify-between text-xs border-t border-[#DCE5FF]/60">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-mono text-[10px] text-outline uppercase font-semibold">Legend:</span>
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                <span>Client Ingress</span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Secure HTTPS Host</span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Cleartext HTTP Host</span>
              </div>
            </div>

            <span className="font-mono text-[11px] text-secondary">
              Zoom: {Math.round(zoomLevel * 100)}%
            </span>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
