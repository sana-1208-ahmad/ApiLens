import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FolderOpen,
  HelpCircle,
  FileCode,
  Shield,
  Zap,
  Lock,
  ExternalLink,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Trash2,
  Database,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useHar } from '../context/HarContext';
import { SAMPLE_HAR_DATA } from '../data/sampleHar';

export default function HarUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const {
    isLoaded,
    isLoading,
    fileName,
    fileSize,
    entries,
    metrics,
    error,
    warning,
    uploadFile,
    loadSampleData,
    clearData,
  } = useHar();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([JSON.stringify(SAMPLE_HAR_DATA, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-lens-sample-test.har';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-[#DCE5FF] flex items-center justify-center text-primary-container shadow-sm shrink-0">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
                Upload HAR File
              </h1>
              <p className="text-sm text-secondary mt-1">
                Import your captured network traffic to analyze API endpoints, requests, responses, and potential security risks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-semibold ${
                isLoaded
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${isLoaded ? 'text-emerald-600' : 'text-slate-500'}`} />
              {isLoaded ? 'Saved locally' : 'Not saved'}
            </span>
            {isLoaded && (
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={clearData}
              >
                Clear Analysis
              </Button>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-navy-text font-mono text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              IndexedDB Engine Active
            </span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">HAR Ingestion Error</h4>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Warning Alert Banner */}
        {warning && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Notice</h4>
              <p className="mt-0.5 leading-relaxed">{warning}</p>
            </div>
          </div>
        )}

        {/* Top Grid: 65% Dropzone + 35% Guidance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-[#DCE5FF] p-6 lg:p-8 shadow-subtle flex flex-col justify-between relative overflow-hidden group">
              {/* Interactive Dropzone Canvas */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center py-12 px-6 rounded-xl border-2 border-dashed transition-all cursor-pointer ${
                  dragActive
                    ? 'border-primary-container bg-primary/5 scale-[0.99]'
                    : 'border-[#BAC9F5] bg-surface-container-low/40 hover:bg-surface-container-low hover:border-primary-container'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".har,.json"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary-container flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-10 h-10" />
                </div>

                <h3 className="text-lg lg:text-xl font-semibold text-navy-text text-center">
                  Drag & Drop your HAR file here
                </h3>
                <p className="text-sm text-secondary mt-1 mb-5 text-center">
                  or click to browse files from your workspace
                </p>

                <Button
                  variant="primary"
                  size="md"
                  icon={FolderOpen}
                  className="pointer-events-none"
                  disabled={isLoading}
                >
                  {isLoading ? 'Reading & Parsing File...' : 'Choose File'}
                </Button>

                <span className="font-mono text-xs text-outline mt-4">
                  Supported format: <strong className="text-navy-text">.har</strong> (Max size: 50 MB)
                </span>
              </div>

              {/* Status card after successful parsing */}
              {isLoaded && (
                <div className="mt-5 p-5 rounded-xl bg-surface-container-low border border-[#DCE5FF] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-text">{fileName}</p>
                      <p className="text-xs text-secondary font-mono mt-0.5">
                        {(fileSize / 1024).toFixed(1)} KB • {entries.length} requests parsed • HAR 1.2 Validated • Saved in IndexedDB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={ArrowRight}
                      onClick={() => navigate('/')}
                    >
                      View Dashboard
                    </Button>
                  </div>
                </div>
              )}

              {/* Verified Metrics Breakdown Banner if loaded */}
              {isLoaded && (
                <div className="mt-4 p-4 rounded-xl bg-blue-50/60 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-navy-text uppercase tracking-wider font-mono">
                      Parsed Ingestion Summary
                    </h4>
                    <span className="text-[11px] font-mono text-secondary">
                      {metrics.statusCategories['2xx']} (2xx) • {metrics.statusCategories['4xx']} (4xx) • {metrics.statusCategories['5xx']} (5xx)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] text-secondary uppercase font-mono font-semibold">Total Requests</span>
                      <p className="font-mono text-base font-bold text-navy-text my-0.5">{metrics.totalRequests}</p>
                      <span className="text-[10px] text-secondary font-mono">All captured calls</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] text-secondary uppercase font-mono font-semibold">Successful (2xx)</span>
                      <p className="font-mono text-base font-bold text-emerald-600 my-0.5">{metrics.successfulRequests}</p>
                      <span className="text-[10px] text-secondary font-mono">{metrics.secureSuccessfulRequests} HTTPS • {metrics.insecureSuccessfulRequests} HTTP</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] text-secondary uppercase font-mono font-semibold">Failed (4xx+5xx)</span>
                      <p className="font-mono text-base font-bold text-rose-600 my-0.5">{metrics.failedRequests}</p>
                      <span className="text-[10px] text-secondary font-mono">{metrics.clientErrors} 4xx • {metrics.serverErrors} 5xx</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-blue-100 flex flex-col justify-between">
                      <span className="text-[10px] text-secondary uppercase font-mono font-semibold">Secure HTTPS</span>
                      <p className="font-mono text-base font-bold text-primary-container my-0.5">{metrics.secureRequests}</p>
                      <span className="text-[10px] text-secondary font-mono">TLS Encrypted</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-blue-100 col-span-2 sm:col-span-1 flex flex-col justify-between">
                      <span className="text-[10px] text-secondary uppercase font-mono font-semibold">Insecure HTTP</span>
                      <p className="font-mono text-base font-bold text-amber-600 my-0.5">{metrics.insecureRequests}</p>
                      <span className="text-[10px] text-secondary font-mono">Cleartext Transport</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Guarantee Pill Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-[#F2F4FD]">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/70 border border-[#DCE5FF]/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary-container flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-text text-xs leading-tight">
                      Local Processing
                    </p>
                    <p className="text-[11px] text-secondary truncate mt-0.5">
                      Data stays on device
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/70 border border-[#DCE5FF]/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary-container flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-text text-xs leading-tight">
                      Privacy First
                    </p>
                    <p className="text-[11px] text-secondary truncate mt-0.5">
                      Zero remote storage
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/70 border border-[#DCE5FF]/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary-container flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-text text-xs leading-tight">
                      Secure Sandbox
                    </p>
                    <p className="text-[11px] text-secondary truncate mt-0.5">
                      Runs in browser memory
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Sample Load & Download Actions */}
            <div className="p-4 rounded-xl bg-lavender/60 border border-[#DCE5FF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-primary-container shrink-0" />
                <div>
                  <span className="text-xs text-navy-text font-bold block">
                    Synthetic Test Fixture: api-lens-sample-test.har
                  </span>
                  <span className="text-[11px] text-secondary">
                    8 requests (200, 201, 204, 401, 404, 500) with HTTP & Auth scenarios.
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={loadSampleData}
                  disabled={isLoading}
                >
                  Load Sample HAR
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  onClick={handleDownloadSample}
                >
                  Download .har
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Context & Guidelines (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Card: What is a HAR file? */}
            <Card title="What is a HAR file?">
              <p className="text-xs text-secondary leading-relaxed">
                A HAR (HTTP Archive) records complete browser interaction data, documenting headers, cookies, payloads, and response codes.
              </p>
              <div className="bg-surface-container-low p-3 rounded-lg mt-3 border border-[#DCE5FF]/60">
                <p className="font-mono text-[11px] text-navy-text leading-relaxed">
                  Chrome DevTools → Network tab → Right Click → "Save all as HAR with content"
                </p>
              </div>
              <a
                href="#help-export"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Instructions: In Chrome or Edge, open DevTools (F12) > Network > click the Export HAR icon (down arrow) or right-click any request > Save all as HAR with content.');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-container hover:text-primary mt-3 group"
              >
                <span>Learn how to capture a HAR file</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </Card>

            {/* Card: Supported File Format */}
            <Card title="Supported Format" badge=".har">
              <ul className="space-y-2 text-xs text-secondary">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>HAR specification v1.2 & v1.3</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>JSON schema validated</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Client-side PII token masking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Maximum payload up to 50 MB</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Ingestion History Table */}
        <section className="bg-white rounded-xl border border-[#DCE5FF] shadow-subtle overflow-hidden flex flex-col">
          <div className="p-5 flex items-center justify-between border-b border-[#F2F4FD]">
            <div>
              <h3 className="font-semibold text-navy-text text-base">
                Recent Ingested Archives
              </h3>
              <p className="text-xs text-secondary mt-0.5">
                Session history of parsed HAR files in this browser
              </p>
            </div>
            <span className="font-mono text-xs text-secondary bg-surface-container px-2.5 py-1 rounded-full">
              {isLoaded ? '1 Archive Active' : '0 Archives Loaded'}
            </span>
          </div>

          {isLoaded ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low text-secondary font-mono uppercase tracking-wider border-b border-[#DCE5FF]">
                    <th className="py-2.5 px-4 font-semibold">File Name</th>
                    <th className="py-2.5 px-4 font-semibold">Size</th>
                    <th className="py-2.5 px-4 font-semibold">Requests</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[#F2F4FD]">
                    <td className="py-3 px-4 font-mono font-semibold text-navy-text">
                      {fileName}
                    </td>
                    <td className="py-3 px-4 font-mono text-secondary">
                      {(fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 font-mono text-navy-text">
                      {entries.length} calls
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                        Parsed & Ready
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate('/api-explorer')}
                        className="text-primary-container font-semibold hover:underline"
                      >
                        Explore →
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-xl bg-surface-container-low border border-[#DCE5FF] flex items-center justify-center text-outline mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-navy-text text-sm mb-1">
                No previous uploads in this workspace
              </h4>
              <p className="text-xs text-secondary max-w-sm">
                Any HAR files you select will be parsed in-memory during this browser session.
              </p>
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
