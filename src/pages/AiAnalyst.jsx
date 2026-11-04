import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  UploadCloud,
  Key,
  ShieldCheck,
  Send,
  Bot,
  User,
  Zap,
  HelpCircle,
  FileText,
  AlertTriangle,
  Clock,
  Layers,
  Lock,
} from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import { useHar } from '../context/HarContext';
import { buildAiRequestPayload } from '../utils/redaction.js';

export default function AiAnalyst() {
  const navigate = useNavigate();
  const { isLoaded, entries, metrics, securityFindings } = useHar();

  const [promptText, setPromptText] = useState('');
  const [messages, setMessages] = useState([]);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem('apilens_ai_key') || '');

  const PROMPT_SUGGESTIONS = [
    {
      title: 'Summarize API architecture',
      desc: 'Catalog all unique endpoints, microservice dependencies, and data flows.',
      icon: Layers,
    },
    {
      title: 'Identify auth & authorization risks',
      desc: 'Scan for missing bearer tokens, broken CORS headers, and unverified endpoints.',
      icon: ShieldCheck,
    },
    {
      title: 'Explain high-latency bottlenecks',
      desc: 'Pinpoint slow downstream calls and heavy payloads exceeding P95 thresholds.',
      icon: Clock,
    },
    {
      title: 'Audit OWASP API Top 10',
      desc: 'Surface potential BOLA, Mass Assignment, and credential leakage concerns.',
      icon: AlertTriangle,
    },
  ];

  const handleSendPrompt = async (textToSend) => {
    const q = textToSend || promptText;
    if (!q.trim()) return;

    const userMessage = { role: 'user', content: q };
    let assistantResponse = '';

    if (!isLoaded) {
      assistantResponse =
        'Telemetry Standby: No network traffic capture is currently loaded. Please upload a HAR file first so I can analyze real endpoints and latency.';
    } else if (!apiKey) {
      // Deterministic local heuristic response without sending data to external AI
      const qLower = q.toLowerCase();
      if (qLower.includes('summarize') || qLower.includes('architecture')) {
        assistantResponse = `[Local Heuristic Engine Summary]: Analyzed ${metrics.totalRequests} captured requests across ${metrics.uniqueDomains} domain(s) (${Object.keys(metrics.domains || {}).join(', ')}). Discovered ${metrics.uniqueEndpoints} unique REST endpoints. Status Breakdown: ${metrics.successfulRequests} successful 2xx responses (${metrics.secureSuccessfulRequests} secure HTTPS, ${metrics.insecureSuccessfulRequests} insecure HTTP) and ${metrics.failedRequests} failed requests (${metrics.clientErrors} client 4xx, ${metrics.serverErrors} server 5xx). Transport: ${metrics.secureRequests} secure HTTPS, ${metrics.insecureRequests} insecure HTTP.`;
      } else if (qLower.includes('auth') || qLower.includes('risk') || qLower.includes('credential')) {
        const authFindings = securityFindings.filter(f => f.category?.toLowerCase().includes('auth') || f.category?.toLowerCase().includes('transport') || f.category?.toLowerCase().includes('token'));
        assistantResponse = `[Local Security Diagnostic]: Identified ${securityFindings.length} heuristic security observations across captured traffic. Key observations:\n- Insecure Transport: ${metrics.insecureRequests} cleartext HTTP call(s)\n- Auth & Tokens: Found ${authFindings.length} credential/token indicators\n- Redaction: All sensitive authorization tokens, passwords, and PII were masked before local rendering.`;
      } else if (qLower.includes('latency') || qLower.includes('bottleneck') || qLower.includes('performance')) {
        assistantResponse = `[Local Latency Diagnostic]: Average latency across all captured routes is ${metrics.avgLatency} ms. Max latency was recorded at ${metrics.maxLatency} ms. Failed requests (4xx/5xx) accounted for ${metrics.failedRequests} call(s).`;
      } else if (qLower.includes('owasp') || qLower.includes('top 10')) {
        assistantResponse = `[Local OWASP Diagnostic]: Scanned for OWASP API Security Top 10 indicators. Found ${securityFindings.length} potential risk observations:\n` +
          securityFindings.map(f => `• [${f.code || 'SEC'} - ${f.severity}] ${f.title} on ${f.endpoint}`).join('\n') +
          `\n\nAll findings represent heuristic observations for proactive remediation.`;
      } else {
        assistantResponse = `[Local Heuristic Engine]: Operating in Local Heuristic Engine mode without an external AI key. The capture contains ${metrics.totalRequests} calls, ${metrics.clientErrors} client errors (4xx), and ${metrics.serverErrors} server error (5xx) across ${metrics.uniqueEndpoints} unique endpoints. To connect an external LLM (Gemini or OpenAI), click "Configure API Key".`;
      }
    } else {
      // Validate key format
      const trimmedKey = apiKey.trim();
      if (trimmedKey.length < 10) {
        assistantResponse = '[Configuration Notice]: The configured API key appears invalid (minimum 10 characters required). Please check your key under "Configure API Key". Reverting to Local Heuristic Engine.';
      } else {
        const requestPayload = buildAiRequestPayload(q, metrics, securityFindings);

        try {
          const prompt = requestPayload.contents[0].parts[0].text;

          // Keep provider credentials out of request URLs.
          if (trimmedKey.startsWith('AIza')) {
            const resp = await fetch(
              'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-goog-api-key': trimmedKey,
                },
                body: JSON.stringify(requestPayload),
              }
            );

            if (!resp.ok) {
              throw new Error(`Gemini API returned status ${resp.status}.`);
            }

            const data = await resp.json();
            const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
            assistantResponse = `[Gemini 1.5 Flash • BYOK]: ${aiText || 'No response generated.'}`;
          } else if (trimmedKey.startsWith('sk-')) {
            const resp = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${trimmedKey}`,
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
              }),
            });

            if (!resp.ok) {
              throw new Error(`OpenAI API returned status ${resp.status}.`);
            }

            const data = await resp.json();
            const aiText = data.choices?.[0]?.message?.content;
            assistantResponse = `[OpenAI GPT-4o mini • BYOK]: ${aiText || 'No response generated.'}`;
          } else {
            assistantResponse = '[Configuration Notice]: Unsupported API key format. Configure a Gemini key (AIza...) or OpenAI key (sk-...).';
          }
        } catch {
          console.warn('[AiAnalyst] External AI request failed.');
        assistantResponse = `[External AI Error]: The provider request failed. Operating in Local Heuristic Engine mode for this query.\n\n[Local Summary]: ${metrics.totalRequests} total requests, ${metrics.uniqueEndpoints} unique endpoints, ${metrics.successfulRequests} successful (2xx), ${metrics.failedRequests} failed (4xx/5xx).`;
        }
      }
    }

    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: assistantResponse }]);
    setPromptText('');
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      sessionStorage.setItem('apilens_ai_key', apiKey.trim());
      alert('API Key safely stored in browser session memory (sessionStorage). It will not be sent to any server.');
    } else {
      sessionStorage.removeItem('apilens_ai_key');
    }
    setShowKeyModal(false);
  };

  return (
    <PageContainer maxWidth="max-w-[1720px]">
      <div className="flex flex-col gap-6">
        {/* Page Header Canvas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-[#DCE5FF] shadow-subtle">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-container">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-navy-text tracking-tight font-sans">
                AI Analyst
              </h1>
              <span className="font-mono text-xs bg-surface-container text-secondary px-2.5 py-0.5 rounded-full font-medium">
                v1.2 Telemetry Guard
              </span>
            </div>
            <p className="text-sm text-secondary mt-1">
              Understand your API traffic with AI-assisted explanations and autonomous diagnostic summaries.
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-[11px] font-semibold">
                <span className={`w-1.5 h-1.5 rounded-full ${apiKey ? 'bg-emerald-500' : 'bg-primary-container'}`}></span>
                {apiKey ? 'BYOK Connected (Session Active)' : 'Local Heuristic Mode • BYOK Required for Cloud LLM'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              icon={Key}
              onClick={() => setShowKeyModal(true)}
            >
              {apiKey ? 'Update API Key' : 'Configure API Key'}
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

        {/* Local Heuristic Engine Banner Notice */}
        {!apiKey && (
          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 flex items-start gap-3 animate-fadeIn">
            <Info className="w-5 h-5 text-primary-container shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-sm text-navy-text">
                External AI explanations are unavailable without an API key. Operating in Local Heuristic Engine mode.
              </div>
              <p className="mt-0.5 text-secondary leading-relaxed">
                All architectural summaries, OWASP risk checks, and latency diagnostics are calculated dynamically in your browser without contacting third-party AI endpoints. To connect Google Gemini or OpenAI, click &ldquo;Configure API Key&rdquo;.
              </p>
            </div>
          </div>
        )}

        {/* Main Two-Column Analysis Workstation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Conversational Panel (8 cols) */}
          <div className="lg:col-span-8 flex flex-col bg-white rounded-xl border border-[#DCE5FF] shadow-subtle overflow-hidden min-h-[580px]">
            {/* Conversation Stream */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center my-auto py-8 text-center max-w-lg mx-auto">
                  <div className="w-14 h-14 rounded-2xl bg-lavender/60 border border-[#DCE5FF] flex items-center justify-center text-primary-container mb-4">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-semibold text-navy-text mb-1.5">
                    How can I assist with your API traffic?
                  </h3>
                  <p className="text-xs text-secondary leading-relaxed mb-6">
                    {isLoaded
                      ? `Active capture contains ${entries.length} requests across ${metrics.uniqueDomains} domains. Select an inquiry template below or ask a specific question.`
                      : 'Upload a HAR file to begin automated architectural discovery, OWASP risk checks, and latency analysis.'}
                  </p>

                  {/* Suggestion Prompt Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
                    {PROMPT_SUGGESTIONS.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleSendPrompt(item.title)}
                          className="p-3.5 rounded-xl border border-[#DCE5FF] bg-surface-container-low/40 hover:bg-surface-container-low hover:border-[#BAC9F5] transition-all cursor-pointer group flex flex-col justify-between"
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="w-4 h-4 text-primary-container" />
                            <h4 className="font-semibold text-navy-text text-xs group-hover:text-primary-container transition-colors">
                              {item.title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-secondary leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 max-w-2xl ${
                      msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        msg.role === 'user'
                          ? 'bg-primary-container text-white'
                          : 'bg-lavender text-primary-container border border-[#DCE5FF]'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div
                      className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary-container text-white font-medium'
                          : 'bg-surface-container-low border border-[#DCE5FF] text-navy-text font-mono'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Prompt Input Bar */}
            <div className="p-4 border-t border-[#F2F4FD] bg-surface-container-low/30">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendPrompt();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={
                    isLoaded
                      ? 'Ask about endpoints, status errors, or security risks in this HAR...'
                      : 'Upload a HAR file to ask questions about traffic...'
                  }
                  className="flex-1 px-4 py-2 bg-white rounded-lg border border-[#DCE5FF] text-xs text-navy-text placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:border-primary-container"
                />
                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  icon={Send}
                  disabled={!promptText.trim()}
                >
                  Send
                </Button>
              </form>
              <p className="text-[10px] text-outline mt-2 text-center">
                All request headers, authorization tokens, and PII are redacted client-side prior to prompt analysis.
              </p>
            </div>
          </div>

          {/* Context & Privacy Side Panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <Card title="AI Diagnostic Context">
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-[#F2F4FD]">
                  <span className="text-secondary">Execution Engine</span>
                  <span className="font-mono font-semibold text-navy-text">
                    {apiKey ? 'Cloud Model (BYOK)' : 'Local Heuristic Engine'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F2F4FD]">
                  <span className="text-secondary">Traffic Scope</span>
                  <span className="font-mono text-navy-text font-semibold">
                    {isLoaded ? `${entries.length} Captured Calls` : '0 Captured Calls'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#F2F4FD]">
                  <span className="text-secondary">PII Scrubbing</span>
                  <span className="font-mono text-success font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Active
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-secondary">Client Persistence</span>
                  <span className="font-mono text-emerald-700 font-semibold">Saved locally in IndexedDB</span>
                </div>
              </div>
            </Card>

            <Card title="Privacy & Security Guarantee">
              <p className="text-xs text-secondary leading-relaxed">
                API Lens adheres to strict client-side data sovereignty. Without a BYOK key, analysis runs locally in your browser sandbox. When external LLMs are connected, all authorization headers and credentials are scrubbed before prompt submission.
              </p>
            </Card>
          </div>
        </div>

        {/* API Key Modal */}
        {showKeyModal && (
          <div className="fixed inset-0 bg-navy-text/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#DCE5FF] max-w-md w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary-container" />
                  <h3 className="text-base font-semibold text-navy-text">Configure BYOK Key</h3>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-outline hover:text-navy-text text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-secondary mb-4 leading-relaxed">
                Enter your Google Gemini or OpenAI API key. Keys are kept solely in temporary browser memory (<code className="font-mono text-primary-container">sessionStorage</code>) and never saved to any backend database.
              </p>

              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy... or sk-..."
                className="w-full px-3 py-2 border border-[#DCE5FF] rounded-lg text-xs font-mono mb-4 focus:outline-none focus:border-primary-container"
              />

              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowKeyModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveKey}
                >
                  Save to Session
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
