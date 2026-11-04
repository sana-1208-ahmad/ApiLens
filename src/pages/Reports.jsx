import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  Download,
  FileCheck,
  Shield,
  Activity,
  Sparkles,
  Lock,
  Layers,
  ArrowRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import KpiCard from '../components/common/KpiCard';
import EmptyState from '../components/common/EmptyState';
import Card from '../components/common/Card';
import { useHar } from '../context/HarContext';

export default function Reports() {
  const navigate = useNavigate();
  const {
    isLoaded,
    entries,
    metrics,
    endpoints,
    securityFindings,
    fileName,
    exportJsonReport,
  } = useHar();

  const [reportGenerated, setReportGenerated] = useState(false);

  const handleGenerateReport = () => {
    if (!isLoaded) {
      alert('Please upload a HAR capture before generating a report.');
      return;
    }
    setReportGenerated(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const healthScore = useMemoHealthScore(metrics, isLoaded);

  function useMemoHealthScore(m, loaded) {
    if (!loaded || m.totalRequests === 0) return '--';
    const nonServerErrors = m.totalRequests - m.serverErrors;
    const score = Math.round((nonServerErrors / m.totalRequests) * 100);
    return `${score}%`;
  }

  return (
    <PageContainer maxWidth="max-w-[1720px]">
      <div className="flex flex-col gap-6">
        {/* Top Header & Export Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#DCE5FF] shadow-subtle">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
                Reports
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-secondary font-mono text-xs font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${isLoaded ? 'bg-emerald-500' : 'bg-outline'}`}></span>
                {isLoaded ? `Analysis Engine Active • ${entries.length} Calls` : 'Analysis Engine Idle'}
              </span>
              <span className="font-mono text-xs text-outline bg-surface-container px-2 py-0.5 rounded">
                v1.4 Spec
              </span>
            </div>
            <p className="text-sm text-secondary mt-1">
              Review and export executive, architectural, and security insights compiled from captured API traffic.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="primary"
              icon={Sparkles}
              onClick={handleGenerateReport}
            >
              {reportGenerated ? 'Refresh Report' : 'Compile Full Report'}
            </Button>

            <Button
              variant="secondary"
              icon={Download}
              onClick={exportJsonReport}
              disabled={!isLoaded}
            >
              Export JSON
            </Button>

            <Button
              variant="secondary"
              icon={Printer}
              onClick={handlePrint}
              disabled={!isLoaded}
            >
              Print / Save PDF
            </Button>
          </div>
        </div>

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Executive Health Score"
            value={healthScore}
            subtitle={isLoaded ? `${metrics.serverErrors} server error recorded` : 'Requires telemetry ingestion'}
            icon={Activity}
            variant="default"
          />
          <KpiCard
            title="Endpoint Coverage"
            value={isLoaded ? metrics.uniqueEndpoints : '--'}
            subtitle={isLoaded ? `Discovered across ${metrics.uniqueDomains} domains` : '0 endpoints documented'}
            icon={Layers}
            variant="default"
          />
          <KpiCard
            title="Risk Posture"
            value={isLoaded ? securityFindings.length : '--'}
            subtitle={isLoaded ? `${metrics.httpEndpoints} cleartext HTTP risk` : 'OWASP audit pending'}
            icon={Shield}
            variant={isLoaded && securityFindings.length > 0 ? 'error' : 'default'}
          />
          <KpiCard
            title="Compliance Readiness"
            value={isLoaded ? 'Reviewed' : '--'}
            subtitle={isLoaded ? 'OWASP API 2023 Ruleset' : 'SOC2 / HIPAA / ISO checks'}
            icon={FileCheck}
            variant="default"
          />
        </div>

        {/* Report Modules & Compiled Report View */}
        <div className="bg-white rounded-xl border border-[#DCE5FF] shadow-subtle overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#F2F4FD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-navy-text text-base">
                {isLoaded ? `Audit Report: ${fileName}` : 'Report Modules & Templates'}
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                {isLoaded ? `Generated from ${entries.length} requests client-side without cloud storage` : 'Pre-configured reporting modules generated from parsed HAR traffic captures'}
              </p>
            </div>
            <span className="font-mono text-xs text-secondary bg-surface-container px-2.5 py-1 rounded-full">
              {isLoaded ? '4 Modules Compiled' : '4 Templates Ready'}
            </span>
          </div>

          {/* If Loaded and Report Generated (or simply loaded): Render compiled report sections */}
          {isLoaded ? (
            <div className="p-6 space-y-6">
              {/* Executive Summary Section */}
              <div className="p-5 rounded-xl border border-[#DCE5FF] bg-surface-container-low/30">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-navy-text text-base flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary-container" />
                    Executive Architecture & Ingress Summary
                  </h4>
                  <span className="font-mono text-xs text-secondary bg-white px-2.5 py-1 rounded border border-[#DCE5FF]">
                    Distribution: {metrics.statusCategories['2xx']} (2xx) • {metrics.statusCategories['4xx']} (4xx) • {metrics.statusCategories['5xx']} (5xx)
                  </span>
                </div>
                <p className="text-xs text-secondary leading-relaxed mb-4">
                  Traffic analysis identified {metrics.totalRequests} API calls targeting {metrics.uniqueDomains} unique domains ({Object.keys(metrics.domains).join(', ')}). A total of {metrics.uniqueEndpoints} unique REST endpoints were discovered and profiled across {metrics.secureRequests} secure HTTPS routes and {metrics.insecureRequests} cleartext HTTP route.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-white rounded-lg border border-[#DCE5FF]">
                    <span className="text-secondary text-[10px] block uppercase font-semibold">Successful (All 2xx)</span>
                    <strong className="text-emerald-700 text-sm block mt-0.5">{metrics.successfulRequests} calls</strong>
                    <span className="text-[10px] text-secondary">{metrics.secureSuccessfulRequests} HTTPS • {metrics.insecureSuccessfulRequests} HTTP</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#DCE5FF]">
                    <span className="text-secondary text-[10px] block uppercase font-semibold">Failed (4xx + 5xx)</span>
                    <strong className="text-rose-700 text-sm block mt-0.5">{metrics.failedRequests} calls</strong>
                    <span className="text-[10px] text-secondary">{metrics.clientErrors} 4xx • {metrics.serverErrors} 5xx</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#DCE5FF]">
                    <span className="text-secondary text-[10px] block uppercase font-semibold">Transport Security</span>
                    <strong className="text-primary-container text-sm block mt-0.5">{metrics.secureRequests} HTTPS / {metrics.insecureRequests} HTTP</strong>
                    <span className="text-[10px] text-secondary">{metrics.insecureRequests === 0 ? '100% Encrypted' : '1 Insecure Route'}</span>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-[#DCE5FF]">
                    <span className="text-secondary text-[10px] block uppercase font-semibold">Response Latency</span>
                    <strong className="text-navy-text text-sm block mt-0.5">Avg: {metrics.avgLatency} ms</strong>
                    <span className="text-[10px] text-secondary">Peak: {metrics.maxLatency} ms</span>
                  </div>
                </div>
              </div>

              {/* OWASP Security Audit Section */}
              <div className="p-5 rounded-xl border border-[#DCE5FF] bg-surface-container-low/30">
                <h4 className="font-bold text-navy-text text-base mb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary-container" />
                  OWASP API Security Findings ({securityFindings.length})
                </h4>
                <p className="text-xs text-secondary leading-relaxed mb-4">
                  Heuristic rules checked traffic for sensitive header exposure, cleartext protocols, and unhandled server stack traces. Observations are classified as potential risks, not confirmed vulnerabilities.
                </p>

                <div className="space-y-2">
                  {securityFindings.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-lg bg-white border border-[#DCE5FF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span
                          className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded mr-2 ${
                            f.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : f.severity === 'High'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {f.severity}
                        </span>
                        <strong className="text-navy-text">{f.title}</strong>
                        <span className="text-secondary ml-2 font-mono text-[11px]">
                          ({f.endpoint})
                        </span>
                      </div>
                      <span className="text-outline font-mono text-[11px] shrink-0">
                        {f.owasp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Endpoints Inventory Section */}
              <div className="p-5 rounded-xl border border-[#DCE5FF] bg-surface-container-low/30">
                <h4 className="font-bold text-navy-text text-base mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-container" />
                  Catalog of Discovered Routes ({endpoints.length})
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-secondary border-b border-[#DCE5FF]">
                        <th className="py-2">Method</th>
                        <th className="py-2">Path</th>
                        <th className="py-2">Domain</th>
                        <th className="py-2">Protocol</th>
                        <th className="py-2">Avg Latency</th>
                        <th className="py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2F4FD]">
                      {endpoints.map((ep) => (
                        <tr key={ep.key}>
                          <td className="py-2 font-bold">{ep.method}</td>
                          <td className="py-2 font-semibold text-navy-text">{ep.pathname}</td>
                          <td className="py-2 text-secondary">{ep.domain}</td>
                          <td className="py-2">
                            <span className={ep.isSecure ? 'text-emerald-700' : 'text-rose-700 font-bold'}>
                              {ep.protocol.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2">{ep.avgLatency} ms</td>
                          <td className="py-2">{ep.primaryStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 4 Report Types Grid (Empty preview) */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-[#F2F4FD]">
                {[
                  {
                    title: 'Executive Architecture Summary',
                    desc: 'High-level breakdown of all discovered microservices, endpoints, protocols, and ingress points.',
                    icon: Layers,
                  },
                  {
                    title: 'OWASP Security & Risk Audit',
                    desc: 'Detailed vulnerability registry covering BOLA, token exposure, sensitive query parameters, and header hygiene.',
                    icon: Shield,
                  },
                  {
                    title: 'Performance & Latency Profile',
                    desc: 'P50, P90, and P99 latency percentiles, payload size distributions, and slow endpoint identification.',
                    icon: Activity,
                  },
                  {
                    title: 'API Schema & Contract Drift',
                    desc: 'Inferred JSON schemas, query parameter types, response data structures, and contract change detection.',
                    icon: FileText,
                  },
                ].map((mod, i) => {
                  const Icon = mod.icon;
                  return (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-[#DCE5FF] bg-surface-container-low/40 flex items-start gap-3.5"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container shrink-0">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-navy-text text-sm mb-1">
                          {mod.title}
                        </h4>
                        <p className="text-xs text-secondary leading-relaxed">
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Empty State */}
              <div className="py-16 px-4">
                <EmptyState
                  icon={FileText}
                  title="No reports generated yet"
                  description="Upload network traffic to compile complete architectural, latency, and security reports ready for PDF or JSON export."
                  actionLabel="Upload HAR File"
                  actionIcon={UploadCloud}
                  onAction={() => navigate('/har-upload')}
                  secondaryActionLabel="Report Specifications"
                  onSecondaryAction={() => alert('API Lens reports are generated purely client-side without storing proprietary server telemetry.')}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
