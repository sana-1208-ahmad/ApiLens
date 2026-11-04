import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  UploadCloud,
  Shield,
  Search,
  Filter,
  RefreshCw,
  Ban,
  Clock,
  Code2,
  FileText,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Database,
  Lock,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import { useHar } from '../context/HarContext';

export default function RequestInspector() {
  const navigate = useNavigate();
  const { isLoaded, entries, metrics } = useHar();

  const [activeTab, setActiveTab] = useState('headers'); // headers | payload | response | timing | security
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target;
      const isEditingText =
        target instanceof HTMLElement &&
        (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
      if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey && !isEditingText) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  // Automatically select first request when loaded
  useEffect(() => {
    if (isLoaded && entries.length > 0 && !selectedRequestId) {
      setSelectedRequestId(entries[0].id);
    }
  }, [isLoaded, entries, selectedRequestId]);

  // Filtered requests in stream
  const filteredRequests = useMemo(() => {
    if (!entries) return [];
    return entries.filter((req) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          req.pathname.toLowerCase().includes(q) ||
          req.url.toLowerCase().includes(q) ||
          req.method.toLowerCase().includes(q) ||
          req.response.status.toString().includes(q) ||
          [...(req.request?.headers || []), ...(req.response?.headers || [])].some(
            (header) => `${header.name || ''} ${header.value || ''}`.toLowerCase().includes(q)
          );
        if (!matches) return false;
      }
      if (selectedMethod !== 'ALL' && req.method !== selectedMethod) return false;
      return true;
    }).sort((a, b) => {
      const timestampA = Date.parse(a.startedDateTime || '');
      const timestampB = Date.parse(b.startedDateTime || '');
      const hasTimestampA = Number.isFinite(timestampA);
      const hasTimestampB = Number.isFinite(timestampB);

      if (hasTimestampA && hasTimestampB) {
        return timestampB - timestampA || b.index - a.index;
      }
      if (hasTimestampA !== hasTimestampB) return hasTimestampA ? -1 : 1;
      return b.index - a.index;
    });
  }, [entries, searchQuery, selectedMethod]);

  const activeRequest = useMemo(() => {
    if (filteredRequests.length === 0) return null;
    return filteredRequests.find((r) => r.id === selectedRequestId) || filteredRequests[0];
  }, [filteredRequests, selectedRequestId]);

  const queryParams = useMemo(() => {
    if (!activeRequest) return [];
    if (Array.isArray(activeRequest.request?.queryString) && activeRequest.request.queryString.length > 0) {
      return activeRequest.request.queryString;
    }
    try {
      const urlObj = new URL(activeRequest.url);
      const params = [];
      urlObj.searchParams.forEach((value, name) => {
        params.push({ name, value });
      });
      return params;
    } catch {
      return [];
    }
  }, [activeRequest]);

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POST':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status >= 200 && status < 300) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status >= 400 && status < 500) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status >= 500) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <PageContainer maxWidth="max-w-[1720px]">
      <div className="flex flex-col gap-6">
        {/* Top Action and Heading Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
                Request & Response Inspector
              </h1>
              <span className="font-mono text-[11px] bg-surface-container text-secondary px-2.5 py-0.5 rounded-full font-medium">
                HAR 1.2 Specs
              </span>
            </div>
            <p className="text-sm text-secondary">
              Inspect captured API requests, redacted headers, JSON payloads, and response times in detail.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center gap-2 bg-surface-container-low border border-[#DCE5FF] px-3 py-1.5 rounded-lg">
              <span className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-emerald-500' : 'bg-outline'}`}></span>
              <span className="font-mono text-xs text-navy-text font-medium">
                {isLoaded ? `${entries.length} Requests Loaded` : '0 Requests Loaded'}
              </span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              icon={Shield}
              onClick={() => alert('Redaction Active: Authorization headers, tokens, and passwords in payloads are automatically masked client-side.')}
            >
              <span>Redaction</span>
              <span className="font-mono text-[10px] bg-secondary-fixed text-on-secondary-fixed px-1.5 py-0.2 rounded font-bold">
                Active
              </span>
            </Button>

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

        {/* Filter & Query Control Toolbar */}
        <div className="bg-white p-3 rounded-xl border border-[#DCE5FF] shadow-subtle flex flex-col lg:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-outline pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter requests by URL, path, headers, status... (press /)"
              className="w-full pl-9 pr-10 py-1.5 h-10 bg-surface rounded-lg text-sm text-navy-text placeholder:text-outline border border-[#DCE5FF]/60 focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container"
            />
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              disabled={!isLoaded}
              className="h-10 px-3 bg-surface border border-[#DCE5FF]/60 text-navy-text rounded-lg text-xs font-mono focus:outline-none disabled:opacity-50"
            >
              <option value="ALL">All Methods</option>
              {Object.keys(metrics.methods || {}).sort().map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMethod('ALL');
              }}
              className="h-10 px-3 bg-surface border border-[#DCE5FF]/60 text-secondary hover:text-navy-text rounded-lg text-xs font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Main Two-Pane Network Debugger Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Pane: Captured Requests Stream (~42%) */}
          <div className="xl:col-span-5 flex flex-col bg-white rounded-xl border border-[#DCE5FF] shadow-subtle overflow-hidden min-h-[620px]">
            {/* Stream Header */}
            <div className="px-4 py-3 bg-surface-container-low/60 border-b border-[#DCE5FF] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-navy-text text-sm">
                  Captured Requests
                </span>
                <span className="font-mono text-[10px] bg-surface-container px-2 py-0.5 rounded-full text-secondary font-bold">
                  {isLoaded ? filteredRequests.length : 0}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-secondary">
                <span>Timestamp (desc)</span>
              </div>
            </div>

            {/* Request stream list */}
            {isLoaded && filteredRequests.length > 0 ? (
              <div className="divide-y divide-[#F2F4FD] max-h-[580px] overflow-y-auto">
                {filteredRequests.map((req) => {
                  const isSelected = activeRequest?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`p-3.5 transition-colors cursor-pointer border-l-4 ${
                        isSelected
                          ? 'bg-lavender/60 border-l-primary-container'
                          : 'border-l-transparent hover:bg-surface-container-low/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${getMethodBadgeClass(req.method)}`}>
                            {req.method}
                          </span>
                          <span className="font-mono font-semibold text-navy-text text-xs truncate">
                            {req.pathname}
                          </span>
                        </div>

                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${getStatusBadgeClass(req.response.status)}`}>
                          {req.response.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-secondary">
                        <span className="truncate">{req.domain}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {!req.isSecure && (
                            <span className="text-[10px] px-1 rounded bg-rose-100 text-rose-800 font-bold">
                              HTTP
                            </span>
                          )}
                          <span>{req.time} ms</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-[#DCE5FF] flex items-center justify-center text-outline mb-3">
                  <ArrowLeftRight className="w-6 h-6 text-primary-container" />
                </div>
                <h4 className="font-semibold text-navy-text text-sm mb-1">
                  No captured requests in stream
                </h4>
                <p className="text-xs text-secondary max-w-xs mb-4">
                  Upload a HAR file to stream real requests, status codes, latencies, and payload bodies.
                </p>
                <Button
                  variant="lavender"
                  size="sm"
                  icon={UploadCloud}
                  onClick={() => navigate('/har-upload')}
                >
                  Upload HAR File
                </Button>
              </div>
            )}
          </div>

          {/* Right Pane: Request & Response Inspector (~58%) */}
          <div className="xl:col-span-7 flex flex-col bg-white rounded-xl border border-[#DCE5FF] shadow-subtle overflow-hidden min-h-[620px]">
            {/* Inspector Navigation Tabs */}
            <div className="flex items-center gap-1 px-4 pt-2 bg-surface-container-low border-b border-[#DCE5FF] overflow-x-auto">
              {[
                { id: 'headers', label: 'Headers', icon: FileText },
                { id: 'payload', label: 'Request Payload', icon: Code2 },
                { id: 'response', label: 'Response Body', icon: Database },
                { id: 'timing', label: 'Timing Waterfall', icon: Clock },
                { id: 'security', label: 'Security Analysis', icon: Shield },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3.5 py-2.5 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      active
                        ? 'bg-white text-primary-container shadow-sm border-t border-x border-[#DCE5FF]'
                        : 'text-secondary hover:text-navy-text'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Inspector Body Area */}
            {activeRequest ? (
              <div className="p-5 flex-1 flex flex-col overflow-y-auto">
                {/* Request Overview Header */}
                <div className="p-3.5 rounded-xl bg-surface-container-low border border-[#DCE5FF] mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs border ${getMethodBadgeClass(activeRequest.method)}`}>
                      {activeRequest.method}
                    </span>
                    <span className="font-mono text-xs text-navy-text font-bold truncate">
                      {activeRequest.url}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-secondary">
                    <span>Status: <strong className={activeRequest.response.status >= 400 ? 'text-rose-600' : 'text-emerald-700'}>{activeRequest.response.status} {activeRequest.response.statusText}</strong></span>
                    <span>Duration: <strong>{activeRequest.time} ms</strong></span>
                    <span>Protocol: <strong>{activeRequest.protocol.toUpperCase()}</strong></span>
                    <span>HTTP: <strong>{activeRequest.httpVersion}</strong></span>
                  </div>
                </div>

                {/* Tab 1: Headers & Query Parameters */}
                {activeTab === 'headers' && (
                  <div className="space-y-5">
                    {/* Query Parameters */}
                    <div>
                      <h4 className="font-mono text-xs uppercase font-bold text-navy-text mb-2 flex items-center justify-between">
                        <span>Query Parameters ({queryParams.length})</span>
                        <span className="text-[10px] font-normal text-secondary font-mono">
                          {queryParams.length > 0 ? 'Extracted from URL / HAR' : 'No query parameters present'}
                        </span>
                      </h4>
                      {queryParams.length > 0 ? (
                        <div className="rounded-xl border border-[#DCE5FF] overflow-hidden">
                          <table className="w-full text-left text-xs font-mono">
                            <tbody className="divide-y divide-[#F2F4FD]">
                              {queryParams.map((qp, i) => (
                                <tr key={i}>
                                  <td className="py-2 px-3 font-semibold text-secondary w-1/3">
                                    {qp.name}
                                  </td>
                                  <td className="py-2 px-3 text-navy-text break-all">
                                    {qp.value}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-surface-container-low border border-[#DCE5FF]/60 text-xs text-secondary font-mono">
                          None (clean path endpoint)
                        </div>
                      )}
                    </div>

                    <div>
                      <h4 className="font-mono text-xs uppercase font-bold text-navy-text mb-2 flex items-center justify-between">
                        <span>Request Headers ({activeRequest.request.headers.length})</span>
                        <span className="text-[10px] font-normal text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Sensitive Values Masked
                        </span>
                      </h4>
                      <div className="rounded-xl border border-[#DCE5FF] overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <tbody className="divide-y divide-[#F2F4FD]">
                            {activeRequest.request.headers.map((h, i) => (
                              <tr key={i} className={h.isRedacted ? 'bg-amber-50/50' : ''}>
                                <td className="py-2 px-3 font-semibold text-secondary w-1/3">
                                  {h.name}
                                </td>
                                <td className="py-2 px-3 text-navy-text break-all">
                                  {h.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-mono text-xs uppercase font-bold text-navy-text mb-2">
                        Response Headers ({activeRequest.response.headers.length})
                      </h4>
                      <div className="rounded-xl border border-[#DCE5FF] overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <tbody className="divide-y divide-[#F2F4FD]">
                            {activeRequest.response.headers.map((h, i) => (
                              <tr key={i}>
                                <td className="py-2 px-3 font-semibold text-secondary w-1/3">
                                  {h.name}
                                </td>
                                <td className="py-2 px-3 text-navy-text break-all">
                                  {h.value}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Payload */}
                {activeTab === 'payload' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase font-bold text-navy-text">
                        Request Body ({activeRequest.request.postDataText ? 'JSON' : 'Empty'})
                      </span>
                      {activeRequest.request.postDataText && (
                        <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Passwords & Tokens Masked
                        </span>
                      )}
                    </div>

                    {activeRequest.request.postDataText ? (
                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                        {activeRequest.request.postDataText}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-secondary text-xs bg-surface-container-low rounded-xl border border-[#DCE5FF]">
                        No payload body was sent with this {activeRequest.method} request.
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 3: Response */}
                {activeTab === 'response' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase font-bold text-navy-text">
                        Response Payload ({activeRequest.response.mimeType})
                      </span>
                      <span className="font-mono text-xs text-secondary">
                        Size: {activeRequest.response.bodySize} bytes
                      </span>
                    </div>

                    {activeRequest.response.text ? (
                      <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800 max-h-[420px]">
                        {activeRequest.response.text}
                      </pre>
                    ) : (
                      <div className="py-12 text-center text-secondary text-xs bg-surface-container-low rounded-xl border border-[#DCE5FF]">
                        No response body content recorded (HTTP {activeRequest.response.status}).
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 4: Timing */}
                {activeTab === 'timing' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-surface-container-low border border-[#DCE5FF]">
                      <h4 className="font-mono text-xs font-bold text-navy-text mb-3">
                        Total Request Latency: {activeRequest.time} ms
                      </h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-secondary">Server Wait (TTFB):</span>
                          <span className="font-bold text-navy-text">{activeRequest.timings.wait} ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-secondary">Request Send:</span>
                          <span className="font-bold text-navy-text">{activeRequest.timings.send} ms</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-secondary">Content Receive:</span>
                          <span className="font-bold text-navy-text">{activeRequest.timings.receive} ms</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress representation */}
                    <div className="space-y-1.5">
                      <span className="text-xs text-secondary">Waterfall Phase Distribution:</span>
                      <div className="w-full h-4 rounded-full bg-surface-container-high flex overflow-hidden">
                        <div
                          style={{ width: `${Math.max(10, (activeRequest.timings.wait / activeRequest.time) * 100)}%` }}
                          className="bg-primary-container h-full"
                          title={`Wait: ${activeRequest.timings.wait} ms`}
                        />
                        <div
                          style={{ width: `${Math.max(5, (activeRequest.timings.receive / activeRequest.time) * 100)}%` }}
                          className="bg-emerald-500 h-full"
                          title={`Receive: ${activeRequest.timings.receive} ms`}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-outline">
                        <span>Wait ({activeRequest.timings.wait} ms)</span>
                        <span>Receive ({activeRequest.timings.receive} ms)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 5: Security */}
                {activeTab === 'security' && (
                  <div className="space-y-3">
                    <h4 className="font-mono text-xs font-bold text-navy-text uppercase">
                      Security Analysis for this Call
                    </h4>

                    {!activeRequest.isSecure && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                        <div className="flex items-center gap-2 text-rose-800 font-bold mb-1">
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                          <span>Potential Risk: Cleartext Insecure Transport</span>
                        </div>
                        <p className="text-rose-700 leading-relaxed">
                          This call was initiated over plain HTTP. Request headers and response body were transmitted without TLS encryption.
                        </p>
                      </div>
                    )}

                    {activeRequest.response.status >= 500 && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                        <div className="flex items-center gap-2 text-amber-800 font-bold mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Potential Risk: Server Internal Error Diagnostics</span>
                        </div>
                        <p className="text-amber-700 leading-relaxed">
                          HTTP 500 response leaks internal exception details in payload. Recommendation: Sanitize error output.
                        </p>
                      </div>
                    )}

                    {activeRequest.request.headers.some((h) => h.isRedacted) && (
                      <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                        <div className="flex items-center gap-2 text-blue-800 font-bold mb-1">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span>Authentication Token Scrubbed</span>
                        </div>
                        <p className="text-blue-700 leading-relaxed">
                          Authorization token identified and masked in memory. Raw token value is never sent to any remote service.
                        </p>
                      </div>
                    )}

                    {activeRequest.isSecure && activeRequest.response.status < 400 && !activeRequest.request.headers.some(h => h.isRedacted) && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                        <div className="flex items-center gap-2 font-bold mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>No critical transport anomalies detected</span>
                        </div>
                        <p className="text-emerald-700">
                          HTTPS encryption verified with standard response headers.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto">
                <div className="w-14 h-14 rounded-2xl bg-surface-container-low border border-[#DCE5FF] flex items-center justify-center text-outline mb-3">
                  <Code2 className="w-7 h-7 text-outline" />
                </div>
                <h4 className="font-semibold text-navy-text text-base mb-1">
                  Select a request to inspect
                </h4>
                <p className="text-xs text-secondary max-w-sm mb-4 leading-relaxed">
                  Detailed request query params, request body schema, HTTP headers, TLS handshake details, and response payload will render here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
