import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Network,
  Search,
  Filter,
  ChevronDown,
  UploadCloud,
  Globe,
  Clock,
  Layers,
  ArrowUpDown,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useHar } from '../context/HarContext';
import { hasStatusCategory } from '../utils/harParser';

export default function ApiExplorer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, endpoints, entries, metrics } = useHar();

  const [activeTab, setActiveTab] = useState('endpoints'); // endpoints | domains | recent
  const [searchQuery, setSearchQuery] = useState(() => location.state?.searchQuery || '');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [sortBy, setSortBy] = useState('path'); // 'path' | 'method' | 'status' | 'latency'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'

  useEffect(() => {
    setSearchQuery(location.state?.searchQuery || '');
  }, [location.key, location.state]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filtered & Sorted Endpoints
  const filteredEndpoints = useMemo(() => {
    if (!endpoints) return [];
    const list = endpoints.filter((ep) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          ep.pathname.toLowerCase().includes(q) ||
          ep.domain.toLowerCase().includes(q) ||
          ep.method.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedMethod !== 'ALL' && ep.method !== selectedMethod) return false;
      if (selectedDomain !== 'ALL' && ep.domain !== selectedDomain) return false;
      if (selectedStatus !== 'ALL') {
        if (!hasStatusCategory(ep.statusCodes, selectedStatus)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'path') cmp = a.pathname.localeCompare(b.pathname);
      else if (sortBy === 'method') cmp = a.method.localeCompare(b.method);
      else if (sortBy === 'status') cmp = a.primaryStatus - b.primaryStatus;
      else if (sortBy === 'latency') cmp = a.avgLatency - b.avgLatency;
      return sortOrder === 'desc' ? -cmp : cmp;
    });
  }, [endpoints, searchQuery, selectedMethod, selectedStatus, selectedDomain, sortBy, sortOrder]);

  // Unique domains summary
  const domainSummary = useMemo(() => {
    if (!entries) return [];
    const map = new Map();
    entries.forEach((e) => {
      if (!map.has(e.domain)) {
        map.set(e.domain, {
          domain: e.domain,
          calls: 0,
          isSecure: e.isSecure,
          protocol: e.protocol,
          errors: 0,
          endpoints: new Set(),
        });
      }
      const d = map.get(e.domain);
      d.calls += 1;
      d.endpoints.add(e.pathname);
      if (e.response.status >= 400) d.errors += 1;
    });
    return Array.from(map.values()).map((d) => ({
      ...d,
      uniqueEndpointsCount: d.endpoints.size,
    }));
  }, [entries]);

  const getMethodBadge = (method) => {
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

  const getStatusBadge = (status) => {
    if (status >= 200 && status < 300) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status >= 400 && status < 500) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status >= 500) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <PageContainer maxWidth="max-w-[1720px]">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
              API Explorer
            </h1>
            <p className="text-sm text-secondary">
              Explore and analyze discovered API endpoints from captured traffic.
            </p>
          </div>

          {/* Telemetry Metric Tile */}
          <div className="bg-white shadow-subtle border border-[#DCE5FF] rounded-xl px-4 py-3 flex items-center gap-3.5 min-w-[260px] self-start md:self-auto">
            <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0">
              <Network className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-navy-text">
                  {isLoaded ? metrics.uniqueEndpoints : '0'}
                </span>
                <span className="font-mono text-[10px] text-outline uppercase tracking-wider font-semibold">
                  Discovered
                </span>
              </div>
              <span className="text-xs text-secondary">
                {isLoaded ? `From ${metrics.totalRequests} captured requests` : 'Endpoints (after HAR upload)'}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Control Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-[#DCE5FF] shadow-subtle">
          {/* Search Input */}
          <div className="relative lg:col-span-4 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints, paths, patterns..."
              className="w-full pl-9 pr-4 py-1.5 h-10 bg-surface rounded-lg text-sm text-navy-text placeholder:text-outline border border-[#DCE5FF]/60 focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="lg:col-span-2">
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              disabled={!isLoaded}
              className="w-full h-10 px-3 bg-surface border border-[#DCE5FF]/60 text-navy-text rounded-lg text-xs font-mono focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="ALL">All Methods</option>
              {Object.entries(metrics.methods || {})
                .sort(([methodA], [methodB]) => methodA.localeCompare(methodB))
                .map(([method, count]) => (
                  <option key={method} value={method}>{method} ({count})</option>
                ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={!isLoaded}
              className="w-full h-10 px-3 bg-surface border border-[#DCE5FF]/60 text-navy-text rounded-lg text-xs font-mono focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="ALL">All Status Codes</option>
              <option value="2xx">2xx Success ({metrics.total2xxRequests || 0})</option>
              <option value="4xx">4xx Client Errors ({metrics.clientErrors || 0})</option>
              <option value="5xx">5xx Server Errors ({metrics.serverErrors || 0})</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              disabled={!isLoaded}
              className="w-full h-10 px-3 bg-surface border border-[#DCE5FF]/60 text-navy-text rounded-lg text-xs font-mono focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="ALL">All Domains</option>
              {Object.keys(metrics.domains || {}).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Action */}
          <div className="lg:col-span-2 flex justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedMethod('ALL');
                setSelectedStatus('ALL');
                setSelectedDomain('ALL');
                setSortBy('path');
                setSortOrder('asc');
              }}
              className="w-full h-10 px-3 bg-surface border border-[#DCE5FF]/60 text-secondary hover:text-navy-text rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Main Explorer Card */}
        <div className="bg-white rounded-xl border border-[#DCE5FF] shadow-subtle flex flex-col overflow-hidden">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 px-4 pt-2 bg-surface-container-low border-b border-[#DCE5FF]">
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`relative px-4 py-2.5 rounded-t-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'endpoints'
                  ? 'bg-white text-primary-container shadow-sm border-t border-x border-[#DCE5FF]'
                  : 'text-secondary hover:text-navy-text'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Endpoints</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
                {isLoaded ? filteredEndpoints.length : 0}
              </span>
              {activeTab === 'endpoints' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('domains')}
              className={`relative px-4 py-2.5 rounded-t-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'domains'
                  ? 'bg-white text-primary-container shadow-sm border-t border-x border-[#DCE5FF]'
                  : 'text-secondary hover:text-navy-text'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Domains</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container text-secondary">
                {isLoaded ? domainSummary.length : 0}
              </span>
              {activeTab === 'domains' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('recent')}
              className={`relative px-4 py-2.5 rounded-t-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'recent'
                  ? 'bg-white text-primary-container shadow-sm border-t border-x border-[#DCE5FF]'
                  : 'text-secondary hover:text-navy-text'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Recent Requests</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-surface-container text-secondary">
                {isLoaded ? entries.length : 0}
              </span>
              {activeTab === 'recent' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container" />
              )}
            </button>
          </div>

          {/* Tab 1: Endpoints List */}
          {activeTab === 'endpoints' && (
            <>
              <div className="grid grid-cols-12 px-5 py-3 bg-surface-container-low/50 text-secondary font-mono text-[11px] uppercase tracking-wider border-b border-[#DCE5FF] select-none">
                <button
                  onClick={() => toggleSort('method')}
                  className="col-span-2 text-left font-semibold flex items-center gap-1 hover:text-navy-text"
                  title="Sort by HTTP Method"
                >
                  <span>Method</span>
                  {sortBy === 'method' && <ArrowUpDown className="w-3 h-3 text-primary-container" />}
                </button>
                <button
                  onClick={() => toggleSort('path')}
                  className="col-span-4 text-left font-semibold flex items-center gap-1 hover:text-navy-text"
                  title="Sort by Endpoint Path"
                >
                  <span>Endpoint Path</span>
                  {sortBy === 'path' && <ArrowUpDown className="w-3 h-3 text-primary-container" />}
                </button>
                <div className="col-span-2 font-semibold">Host / Domain</div>
                <button
                  onClick={() => toggleSort('latency')}
                  className="col-span-2 text-left font-semibold flex items-center gap-1 hover:text-navy-text"
                  title="Sort by Average Latency"
                >
                  <span>Status & Latency</span>
                  {sortBy === 'latency' && <ArrowUpDown className="w-3 h-3 text-primary-container" />}
                </button>
                <div className="col-span-2 text-right font-semibold">Inspect</div>
              </div>

              {isLoaded && filteredEndpoints.length > 0 ? (
                <div className="divide-y divide-[#F2F4FD]">
                  {filteredEndpoints.map((ep) => (
                    <div
                      key={ep.key}
                      onClick={() => navigate('/request-inspector')}
                      className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-surface-container-low/50 transition-colors cursor-pointer text-xs"
                    >
                      <div className="col-span-2">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${getMethodBadge(ep.method)}`}>
                          {ep.method}
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center gap-2">
                        <span className="font-mono font-semibold text-navy-text">
                          {ep.pathname}
                        </span>
                        {!ep.isSecure && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-mono font-bold flex items-center gap-1 border border-rose-200">
                            <ShieldAlert className="w-3 h-3" /> HTTP
                          </span>
                        )}
                      </div>
                      <div className="col-span-2 font-mono text-secondary text-[11px]">
                        {ep.domain}
                      </div>
                      <div className="col-span-2 flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${getStatusBadge(ep.primaryStatus)}`}>
                          {ep.primaryStatus}
                        </span>
                        <span className="font-mono text-secondary text-[11px]">
                          {ep.avgLatency} ms
                        </span>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="text-primary-container font-semibold hover:underline text-xs inline-flex items-center gap-1">
                          View Details <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 px-4">
                  <EmptyState
                    icon={Network}
                    title={isLoaded ? 'No endpoints match current filters' : 'No API endpoints discovered yet'}
                    description={isLoaded ? 'Try clearing your search query or adjusting the method/status filter dropdowns.' : 'Upload a HAR file to automatically parse, catalog, and document your API attack surface and endpoints.'}
                    actionLabel={isLoaded ? 'Clear Filters' : 'Upload HAR File'}
                    actionIcon={isLoaded ? Filter : UploadCloud}
                    onAction={isLoaded ? () => { setSearchQuery(''); setSelectedMethod('ALL'); setSelectedStatus('ALL'); setSelectedDomain('ALL'); } : () => navigate('/har-upload')}
                  />
                </div>
              )}
            </>
          )}

          {/* Tab 2: Domains List */}
          {activeTab === 'domains' && (
            <div className="p-5">
              {isLoaded && domainSummary.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {domainSummary.map((d) => (
                    <div
                      key={d.domain}
                      className="p-5 rounded-xl border border-[#DCE5FF] bg-surface-container-low/30 hover:border-[#BAC9F5] transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-bold text-navy-text text-sm flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary-container" />
                            {d.domain}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                              d.isSecure
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {d.isSecure ? 'HTTPS (Secure)' : 'HTTP (Cleartext Insecure)'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary mb-3">
                          Host service handling {d.calls} recorded API calls across {d.uniqueEndpointsCount} unique paths.
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#DCE5FF] flex items-center justify-between text-xs font-mono text-secondary">
                        <span>Total Calls: <strong>{d.calls}</strong></span>
                        <span>Error Rate: <strong className={d.errors > 0 ? 'text-rose-600' : 'text-emerald-600'}>{d.errors} failed</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-secondary text-sm">
                  Upload a HAR file to discover connected domains and microservice hosts.
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Recent Requests */}
          {activeTab === 'recent' && (
            <div className="divide-y divide-[#F2F4FD]">
              {isLoaded && entries.length > 0 ? (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => navigate('/request-inspector')}
                    className="p-4 hover:bg-surface-container-low/50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${getMethodBadge(entry.method)}`}>
                        {entry.method}
                      </span>
                      <span className="font-mono font-semibold text-navy-text">
                        {entry.pathname}
                      </span>
                      <span className="font-mono text-secondary text-[11px]">
                        ({entry.domain})
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold border ${getStatusBadge(entry.response.status)}`}>
                        {entry.response.status} {entry.response.statusText}
                      </span>
                      <span className="font-mono text-navy-text text-xs">
                        {entry.time} ms
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-primary-container" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-secondary text-sm">
                  No requests recorded.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
