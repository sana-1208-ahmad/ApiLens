import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FolderOpen,
  Download,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Activity,
  Network,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  PieChart,
  FileText,
  GitFork,
  Table,
  Filter,
  FileDown,
  FileCheck,
  RotateCcw,
  AlertOctagon,
  Database,
  Trash2,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import KpiCard from '../components/common/KpiCard';
import Card from '../components/common/Card';
import { useHar } from '../context/HarContext';

export default function Overview() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const {
    isLoaded,
    isLoading,
    fileName,
    fileSize,
    entries,
    metrics,
    securityFindings,
    uploadFile,
    loadSampleData,
    clearData,
    exportJsonReport,
  } = useHar();

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const success = await uploadFile(e.target.files[0]);
      if (success) {
        navigate('/');
      }
    }
  };

  const handleDownloadSampleHAR = (e) => {
    e.preventDefault();
    loadSampleData();
  };

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'POST':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PUT':
      case 'PATCH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status >= 200 && status < 300) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (status >= 300 && status < 400) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (status >= 400 && status < 500) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (status >= 500) return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        {/* 1. Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
                API Overview
              </h1>
              {isLoaded ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Traffic: {entries.length} Requests
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                  Awaiting Data
                </span>
              )}
            </div>
            <p className="text-sm text-secondary max-w-2xl leading-relaxed">
              Real-time visibility and security insights extracted from HTTP Archive (HAR) traffic captures.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isLoaded ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Trash2}
                  onClick={clearData}
                >
                  Clear Analysis
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={FileDown}
                  onClick={exportJsonReport}
                >
                  Export Report
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={UploadCloud}
                  onClick={() => navigate('/har-upload')}
                >
                  Change HAR
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  icon={BookOpen}
                  onClick={() => alert('API Lens Guides: How to export HAR from Chrome DevTools, Firefox, and Charles Proxy.')}
                >
                  Documentation
                </Button>
                <Button
                  variant="primary"
                  icon={UploadCloud}
                  onClick={() => navigate('/har-upload')}
                >
                  Upload HAR File
                </Button>
              </>
            )}
          </div>
        </header>

        {/* 2. Onboarding Dropzone or Loaded Dataset Card */}
        {isLoaded ? (
          <section className="relative overflow-hidden rounded-2xl bg-white border border-[#DCE5FF] p-6 lg:p-7 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-[#DCE5FF] flex items-center justify-center text-primary-container shrink-0">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base lg:text-lg font-bold text-navy-text">
                    {fileName}
                  </h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-container text-secondary font-semibold">
                    {(fileSize / 1024).toFixed(1)} KB
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-semibold">
                    <Database className="w-3 h-3 text-emerald-600" />
                    Persisted in IndexedDB
                  </span>
                </div>
                <p className="text-xs text-secondary mt-1">
                  Client-side parsed HAR capture • {metrics.uniqueDomains} unique domains • {metrics.uniqueEndpoints} unique endpoints • Auto-restores across browser refreshes
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="lavender"
                size="sm"
                icon={Network}
                onClick={() => navigate('/api-explorer')}
              >
                Inspect {metrics.uniqueEndpoints} Endpoints
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={UploadCloud}
                onClick={() => navigate('/har-upload')}
              >
                Upload New
              </Button>
            </div>
          </section>
        ) : (
          <section className="relative overflow-hidden rounded-2xl bg-surface-container-low border border-[#DCE5FF] p-6 lg:p-10 shadow-subtle">
            {/* Subtle Ambient Glows */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col items-center text-center max-w-2xl mx-auto py-2">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-card border border-[#DCE5FF]/80 flex items-center justify-center text-primary-container mb-5">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h2 className="text-xl lg:text-2xl font-semibold text-navy-text tracking-tight mb-2">
                Start by analyzing your first HAR capture
              </h2>

              <p className="text-sm text-secondary leading-relaxed mb-6">
                Drag and drop your <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface-container text-navy-text font-semibold">.har</span> file here or click to browse. API Lens parses endpoints, verifies runtime contracts, and surfaces OWASP API vulnerabilities client-side without storing payload data.
              </p>

              <input
                type="file"
                ref={fileInputRef}
                accept=".har,.json"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                <Button
                  variant="primary"
                  size="lg"
                  icon={FolderOpen}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Parsing HAR...' : 'Select .har File'}
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  icon={Download}
                  onClick={handleDownloadSampleHAR}
                  disabled={isLoading}
                >
                  Load Sample HAR (api-lens-sample-test.har)
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-secondary font-mono text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary-container" />
                  Chrome, Firefox, Safari, Charles, Postman (HAR 1.2+)
                </span>
                <span className="text-outline-variant">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-primary-container" />
                  Local client-side parsing available
                </span>
                <span className="text-outline-variant">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
                  Zero telemetry persistence
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 3. KPI Metrics Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Requests"
            value={isLoaded ? metrics.totalRequests : '--'}
            subtitle={isLoaded ? `${metrics.secureRequests} Secure HTTPS • ${metrics.insecureRequests} Insecure HTTP` : 'Awaiting HAR data'}
            icon={Activity}
            variant="default"
          />
          <KpiCard
            title="Successful Requests"
            value={isLoaded ? metrics.successfulRequests : '--'}
            subtitle={isLoaded ? `${metrics.secureSuccessfulRequests} Secure HTTPS • ${metrics.insecureSuccessfulRequests} Insecure HTTP` : '0 routes discovered'}
            icon={CheckCircle2}
            variant="success"
          />
          <KpiCard
            title="Failed Requests"
            value={isLoaded ? metrics.failedRequests : '--'}
            subtitle={isLoaded ? `${metrics.clientErrors} Client (4xx) • ${metrics.serverErrors} Server (5xx)` : '4xx / 5xx error rate: --'}
            icon={AlertTriangle}
            variant={isLoaded && (metrics.clientErrors > 0 || metrics.serverErrors > 0) ? 'error' : 'warning'}
          />
          <KpiCard
            title="Security Findings"
            value={isLoaded ? securityFindings.length : '--'}
            subtitle={isLoaded ? `${metrics.insecureRequests} Insecure HTTP • ${securityFindings.length - metrics.insecureRequests} Potential Risks` : 'Audit pending first upload'}
            icon={ShieldCheck}
            variant={isLoaded && securityFindings.length > 0 ? 'error' : 'default'}
          />
        </section>

        {/* 4. Visual Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart Tile 1: Methods */}
          <Card
            title="Requests by HTTP Method"
            subtitle="Method breakdown across captured routes"
            badge={isLoaded ? `${metrics.totalRequests} calls` : 'Awaiting data'}
          >
            {isLoaded ? (
              <div className="h-60 rounded-xl bg-surface-container-low border border-[#DCE5FF] p-6 flex flex-col justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.entries(metrics.methods).map(([method, count]) => (
                    <div
                      key={method}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-2 ${getMethodBadgeClass(
                        method
                      )}`}
                    >
                      <span>{method}</span>
                      <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[11px] shadow-xs">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Relative visual bar */}
                <div className="flex flex-col gap-2 my-auto">
                  <div className="w-full h-3 rounded-full bg-surface-container-highest flex overflow-hidden">
                    <div
                      style={{ width: `${(metrics.methods.GET || 0) / metrics.totalRequests * 100}%` }}
                      className="bg-primary-container h-full"
                      title={`GET: ${metrics.methods.GET || 0}`}
                    />
                    <div
                      style={{ width: `${(metrics.methods.POST || 0) / metrics.totalRequests * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title={`POST: ${metrics.methods.POST || 0}`}
                    />
                    <div
                      style={{ width: `${(metrics.methods.DELETE || 0) / metrics.totalRequests * 100}%` }}
                      className="bg-rose-500 h-full"
                      title={`DELETE: ${metrics.methods.DELETE || 0}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-secondary">
                    <span>GET: {metrics.methods.GET || 0} ({metrics.totalRequests ? Math.round(((metrics.methods.GET || 0) / metrics.totalRequests) * 100) : 0}%)</span>
                    <span>POST: {metrics.methods.POST || 0} ({metrics.totalRequests ? Math.round(((metrics.methods.POST || 0) / metrics.totalRequests) * 100) : 0}%)</span>
                    <span>DELETE: {metrics.methods.DELETE || 0} ({metrics.totalRequests ? Math.round(((metrics.methods.DELETE || 0) / metrics.totalRequests) * 100) : 0}%)</span>
                  </div>
                </div>

                <p className="text-xs text-secondary leading-snug">
                  All HTTP verbs parsed client-side with full method payload inspection available in Explorer.
                </p>
              </div>
            ) : (
              <div className="h-60 rounded-xl bg-surface-container-low border border-dashed border-[#DCE5FF] flex flex-col items-center justify-center p-6 text-center">
                <div className="flex items-center gap-2 mb-3 opacity-60">
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => (
                    <span
                      key={m}
                      className="px-2 py-0.5 rounded bg-white border border-[#DCE5FF] text-secondary font-mono text-[11px] font-semibold"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                <div className="w-48 h-2 rounded-full bg-surface-container-highest overflow-hidden mb-3">
                  <div className="w-12 h-full bg-outline-variant" />
                </div>
                <p className="font-semibold text-navy-text text-sm mb-1">
                  No HTTP methods detected
                </p>
                <p className="text-xs text-secondary max-w-sm">
                  Distribution by GET, POST, PUT, PATCH, and DELETE will display automatically after parsing.
                </p>
              </div>
            )}
          </Card>

          {/* Chart Tile 2: Status Breakdown */}
          <Card
            title="Response Status Distribution"
            subtitle="HTTP outcome status telemetry"
            badge={isLoaded ? 'Parsed Telemetry' : 'Awaiting data'}
          >
            {isLoaded ? (
              <div className="h-60 rounded-xl bg-surface-container-low border border-[#DCE5FF] p-6 flex flex-col justify-between">
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-center">
                    <span className="text-[10px] font-mono text-emerald-800 font-semibold uppercase">2xx Success</span>
                    <p className="font-mono text-lg font-bold text-emerald-700">{metrics.total2xxRequests}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-center">
                    <span className="text-[10px] font-mono text-amber-800 font-semibold uppercase">4xx Client</span>
                    <p className="font-mono text-lg font-bold text-amber-700">{metrics.clientErrors}</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-center">
                    <span className="text-[10px] font-mono text-rose-800 font-semibold uppercase">5xx Server</span>
                    <p className="font-mono text-lg font-bold text-rose-700">{metrics.serverErrors}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 my-2">
                  {Object.entries(metrics.statusCodes).map(([code, count]) => (
                    <span
                      key={code}
                      className={`font-mono text-xs px-2 py-0.5 rounded border font-semibold ${getStatusBadgeClass(
                        Number(code)
                      )}`}
                    >
                      {code}: {count}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-secondary pt-2 border-t border-[#DCE5FF]">
                  <span>Average Response Time: <strong className="text-navy-text font-mono">{metrics.avgLatency} ms</strong></span>
                  <span>Max Latency: <strong className="text-navy-text font-mono">{metrics.maxLatency} ms</strong></span>
                </div>
              </div>
            ) : (
              <div className="h-60 rounded-xl bg-surface-container-low border border-dashed border-[#DCE5FF] flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-20 h-20 mb-3 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container-highest"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="text-outline-variant"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray="25, 100"
                      strokeLinecap="round"
                      strokeWidth="3"
                    />
                  </svg>
                  <PieChart className="w-6 h-6 text-outline absolute" />
                </div>
                <p className="font-semibold text-navy-text text-sm mb-1">
                  No status codes recorded
                </p>
                <p className="text-xs text-secondary max-w-sm">
                  2xx Success, 3xx Redirect, 4xx Client, and 5xx Server error breakdowns will appear here.
                </p>
              </div>
            )}
          </Card>
        </section>

        {/* 5. Quick Functional Workflows */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-navy-text text-base">
              Post-Upload Capabilities
            </h3>
            <span className="font-mono text-xs text-secondary">
              {isLoaded ? 'Ready with active HAR session' : 'Available immediately once HAR is loaded'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Capability 1 */}
            <div
              onClick={() => navigate('/api-explorer')}
              className="group bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:border-[#BAC9F5] hover:shadow-subtle-hover transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-surface-container group-hover:bg-primary-container group-hover:text-white text-navy-text flex items-center justify-center transition-colors mb-3">
                  <Network className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-navy-text text-sm mb-1">
                  Explore Endpoints
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {isLoaded ? `Catalog of ${metrics.uniqueEndpoints} discovered endpoints and schemas.` : 'Inspect discovered API inventory, paths, and payload schemas.'}
                </p>
              </div>

              <div className="mt-4 flex items-center text-primary-container font-semibold text-xs gap-1">
                <span>Open Explorer ({metrics.uniqueEndpoints || 0})</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Capability 2 */}
            <div
              onClick={() => navigate('/security-inspector')}
              className="group bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:border-[#BAC9F5] hover:shadow-subtle-hover transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-surface-container group-hover:bg-primary-container group-hover:text-white text-navy-text flex items-center justify-center transition-colors mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-navy-text text-sm mb-1">
                  Inspect Security
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {isLoaded ? `${securityFindings.length} heuristic potential risk observations.` : 'Run automated OWASP Top 10 API & header exposure audits.'}
                </p>
              </div>

              <div className="mt-4 flex items-center text-primary-container font-semibold text-xs gap-1">
                <span>View Findings ({securityFindings.length || 0})</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Capability 3 */}
            <div
              onClick={() => navigate('/api-flow-map')}
              className="group bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:border-[#BAC9F5] hover:shadow-subtle-hover transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-surface-container group-hover:bg-primary-container group-hover:text-white text-navy-text flex items-center justify-center transition-colors mb-3">
                  <GitFork className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-navy-text text-sm mb-1">
                  View API Flow
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {isLoaded ? `Topology connecting ${metrics.uniqueDomains} domains and services.` : 'Visualize call sequence waterfalls, dependencies, and latency.'}
                </p>
              </div>

              <div className="mt-4 flex items-center text-primary-container font-semibold text-xs gap-1">
                <span>View Graph</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Capability 4 */}
            <div
              onClick={() => navigate('/reports')}
              className="group bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:border-[#BAC9F5] hover:shadow-subtle-hover transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-9 h-9 rounded-lg bg-surface-container group-hover:bg-primary-container group-hover:text-white text-navy-text flex items-center justify-center transition-colors mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-navy-text text-sm mb-1">
                  Generate Report
                </h4>
                <p className="text-xs text-secondary leading-relaxed">
                  {isLoaded ? 'Executive and security audit ready for export.' : 'Export compliance and audit summaries for engineering leads.'}
                </p>
              </div>

              <div className="mt-4 flex items-center text-primary-container font-semibold text-xs gap-1">
                <span>View Reports</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </section>

        {/* 6. Recent Activity Table */}
        <section className="bg-white rounded-xl border border-[#DCE5FF] shadow-subtle overflow-hidden flex flex-col">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2F4FD]">
            <div>
              <h3 className="font-semibold text-navy-text text-base">
                Recent API Activity
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                {isLoaded ? `Audit trail of all ${entries.length} captured network calls` : 'Audit trail of captured requests, response times, and anomaly flags'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                icon={FileDown}
                onClick={exportJsonReport}
                disabled={!isLoaded}
              >
                Export JSON
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-container-low text-secondary font-mono uppercase tracking-wider border-b border-[#DCE5FF]">
                  <th className="py-2.5 px-4 font-semibold" scope="col">Method</th>
                  <th className="py-2.5 px-4 font-semibold" scope="col">Path / Endpoint</th>
                  <th className="py-2.5 px-4 font-semibold" scope="col">Host Domain</th>
                  <th className="py-2.5 px-4 font-semibold" scope="col">Status</th>
                  <th className="py-2.5 px-4 font-semibold" scope="col">Latency</th>
                  <th className="py-2.5 px-4 font-semibold" scope="col">Flags</th>
                  <th className="py-2.5 px-4 font-semibold text-right" scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoaded && entries.length > 0 ? (
                  entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-[#F2F4FD] hover:bg-surface-container-low/50 transition-colors cursor-pointer"
                      onClick={() => navigate('/request-inspector')}
                    >
                      <td className="py-3 px-4 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] border ${getMethodBadgeClass(entry.method)}`}>
                          {entry.method}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-navy-text font-semibold">
                        {entry.pathname}
                      </td>
                      <td className="py-3 px-4 font-mono text-secondary text-[11px]">
                        {entry.domain}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-mono text-[11px] border font-semibold ${getStatusBadgeClass(entry.response.status)}`}>
                          {entry.response.status} {entry.response.statusText}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-navy-text">
                        {entry.time} ms
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!entry.isSecure && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold border border-rose-200">
                              HTTP (Insecure)
                            </span>
                          )}
                          {entry.response.status >= 500 && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                              500 Stack Leak
                            </span>
                          )}
                          {entry.request.headers.some((h) => h.isRedacted) && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                              Auth Redacted
                            </span>
                          )}
                          {entry.isSecure && entry.response.status === 200 && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                              Verified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-primary-container font-semibold hover:underline text-xs inline-flex items-center gap-1">
                          Inspect <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-16 px-4" colSpan={7}>
                      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-[#DCE5FF] flex items-center justify-center text-secondary mb-3 shadow-sm">
                          <Table className="w-6 h-6 text-outline" />
                        </div>
                        <h4 className="font-semibold text-navy-text text-base mb-1">
                          No API activity yet
                        </h4>
                        <p className="text-xs text-secondary mb-5 leading-relaxed">
                          Upload a HAR file to begin monitoring traffic, inspecting headers, and auditing security posture in real time.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          icon={UploadCloud}
                          onClick={() => navigate('/har-upload')}
                        >
                          Upload HAR File
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
