import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  UploadCloud,
  Sliders,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Info,
  Lock,
  KeyRound,
  FileSearch,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { useHar } from '../context/HarContext';

export default function SecurityInspector() {
  const navigate = useNavigate();
  const { isLoaded, securityFindings, metrics } = useHar();
  const [activeCategory, setActiveCategory] = useState('all');

  const severityCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    securityFindings.forEach((f) => {
      if (counts[f.severity] !== undefined) {
        counts[f.severity] += 1;
      }
    });
    return counts;
  }, [securityFindings]);

  const filteredFindings = useMemo(() => {
    if (!securityFindings) return [];
    if (activeCategory === 'all') return securityFindings;
    if (activeCategory === 'disclosure') {
      const disclosureCategories = [
        'PII & Privacy',
        'Debug & Error Leakage',
        'Security Headers & Banners',
        'Cookie Security',
      ];
      return securityFindings.filter((finding) =>
        disclosureCategories.includes(finding.category)
      );
    }
    return securityFindings.filter(
      (f) => f.category.toLowerCase().includes(activeCategory) || f.severity.toLowerCase() === activeCategory
    );
  }, [securityFindings, activeCategory]);

  return (
    <PageContainer maxWidth="max-w-[1720px]">
      <div className="flex flex-col gap-6">
        {/* Top Action & Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#DCE5FF] shadow-subtle">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
                Security Inspector
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                Heuristic Audit Engine
              </span>
              <span className="font-mono text-xs bg-surface-container text-secondary px-2 py-0.5 rounded">
                {isLoaded ? `${securityFindings.length} Observations Analyzed` : '0 Findings Analyzed'}
              </span>
            </div>
            <p className="text-sm text-secondary max-w-2xl mt-1">
              Identify potential security risks, sensitive credential leaks, and transport posture anomalies in captured traffic.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              icon={Sliders}
              onClick={() => alert('Audit Rules: Heuristic checks include Insecure Transport (HTTP vs HTTPS), Auth Credential Leakage, Token Masking, Server Debug Exposure, and Failed Auth Probes.')}
            >
              Audit Rules
            </Button>
            <Button
              variant="primary"
              icon={UploadCloud}
              onClick={() => navigate('/har-upload')}
            >
              {isLoaded ? 'Change HAR' : 'Upload HAR File'}
            </Button>
          </div>
        </div>

        {/* 4-Column Severity KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Critical P0 */}
          <div className="bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:shadow-subtle-hover transition-all">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold text-navy-text flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                Critical
              </span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider font-semibold">P0</span>
            </div>
            <div className="my-2">
              <span className="font-mono text-3xl font-bold text-error">
                {isLoaded ? severityCounts.Critical : '--'}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Immediate action recommended <span className="font-mono">({isLoaded ? severityCounts.Critical : 0})</span>
            </p>
          </div>

          {/* High P1 */}
          <div className="bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:shadow-subtle-hover transition-all">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold text-navy-text flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                High
              </span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider font-semibold">P1</span>
            </div>
            <div className="my-2">
              <span className="font-mono text-3xl font-bold text-amber-600">
                {isLoaded ? severityCounts.High : '--'}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Potential risk / exposure <span className="font-mono">({isLoaded ? severityCounts.High : 0})</span>
            </p>
          </div>

          {/* Medium P2 */}
          <div className="bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:shadow-subtle-hover transition-all">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold text-navy-text flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                Medium
              </span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider font-semibold">P2</span>
            </div>
            <div className="my-2">
              <span className="font-mono text-3xl font-bold text-primary-container">
                {isLoaded ? severityCounts.Medium : '--'}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Security posture drift <span className="font-mono">({isLoaded ? severityCounts.Medium : 0})</span>
            </p>
          </div>

          {/* Low / Info P3 */}
          <div className="bg-white p-5 rounded-xl border border-[#DCE5FF] shadow-subtle hover:shadow-subtle-hover transition-all">
            <div className="flex items-center justify-between pb-2">
              <span className="text-sm font-semibold text-navy-text flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                Low / Info
              </span>
              <span className="font-mono text-xs text-outline uppercase tracking-wider font-semibold">P3</span>
            </div>
            <div className="my-2">
              <span className="font-mono text-3xl font-bold text-secondary">
                {isLoaded ? severityCounts.Low : '--'}
              </span>
            </div>
            <p className="text-xs text-secondary">
              Informational hygiene <span className="font-mono">({isLoaded ? severityCounts.Low : 0})</span>
            </p>
          </div>
        </div>

        {/* Security Audit Categories & Findings Container */}
        <div className="bg-white rounded-xl border border-[#DCE5FF] shadow-subtle overflow-hidden flex flex-col">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 px-4 pt-2 bg-surface-container-low border-b border-[#DCE5FF] overflow-x-auto">
            {[
              { id: 'all', label: `All Findings (${isLoaded ? securityFindings.length : 0})` },
              { id: 'transport', label: 'Insecure Transport' },
              { id: 'auth', label: 'Authentication & Tokens' },
              { id: 'disclosure', label: 'Information Leaks' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`relative px-4 py-2.5 rounded-t-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === tab.id
                    ? 'bg-white text-primary-container shadow-sm border-t border-x border-[#DCE5FF]'
                    : 'text-secondary hover:text-navy-text'
                }`}
              >
                <span>{tab.label}</span>
                {activeCategory === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container" />
                )}
              </button>
            ))}
          </div>

          {/* Findings List or Empty State */}
          {isLoaded && filteredFindings.length > 0 ? (
            <div className="divide-y divide-[#F2F4FD] p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>
                  <strong>Heuristic Classification Notice:</strong> Observations represent potential security risks identified via passive traffic inspection. Verify within your team's application context.
                </span>
                <span className="font-mono font-bold text-[10px] bg-white px-2 py-0.5 rounded border border-amber-200">
                  Client-side Ruleset
                </span>
              </div>

              {filteredFindings.map((finding) => (
                <div
                  key={finding.id}
                  className="p-5 rounded-xl border border-[#DCE5FF] bg-surface-container-low/30 hover:border-[#BAC9F5] transition-all flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          finding.severity === 'Critical'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : finding.severity === 'High'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {finding.severity} ({finding.code})
                      </span>
                      <h3 className="font-semibold text-navy-text text-sm">
                        {finding.title}
                      </h3>
                    </div>
                    <span className="font-mono text-xs text-secondary bg-surface-container px-2 py-0.5 rounded">
                      {finding.owasp}
                    </span>
                  </div>

                  <p className="text-xs text-secondary leading-relaxed">
                    {finding.description}
                  </p>

                  <div className="p-3 rounded-lg bg-surface-container border border-[#DCE5FF]/60 font-mono text-[11px] text-navy-text">
                    <div className="text-secondary mb-1">Affected Endpoint: <strong>{finding.endpoint}</strong></div>
                    <div className="text-secondary truncate">Evidence: <span className="text-navy-text">{finding.evidence}</span></div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900">
                    <strong className="block mb-0.5 text-emerald-800">Recommended Remediation:</strong>
                    {finding.recommendation}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 px-4">
              <EmptyState
                icon={ShieldAlert}
                title={isLoaded ? 'No findings in this category' : 'No security findings recorded'}
                description={isLoaded ? 'All analyzed requests passed rules in this category.' : 'Upload a HAR file to automatically run client-side heuristic security audits for exposed JWTs, API keys, CORS misconfigurations, and cleartext HTTP endpoints.'}
                actionLabel={isLoaded ? 'Show All Findings' : 'Upload HAR File'}
                actionIcon={isLoaded ? CheckCircle2 : UploadCloud}
                onAction={isLoaded ? () => setActiveCategory('all') : () => navigate('/har-upload')}
              />
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
