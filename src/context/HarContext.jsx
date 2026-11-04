import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  validateHar,
  parseHarEntries,
  computeMetrics,
  extractEndpoints,
  runSecurityAudit,
  extractFlowGraph,
} from '../utils/harParser';
import {
  saveSession,
  loadLatestSession,
  clearLatestSession,
  isIndexedDbSupported,
} from '../utils/indexedDb';
import { SAMPLE_HAR_DATA } from '../data/sampleHar';
import { sanitizeHarData } from '../utils/redaction.js';

const HarContext = createContext(null);

const DEFAULT_METRICS = {
  totalRequests: 0,
  successfulRequests: 0,
  total2xxRequests: 0,
  secureRequests: 0,
  secureSuccessfulRequests: 0,
  insecureRequests: 0,
  insecureSuccessfulRequests: 0,
  clientErrors: 0,
  serverErrors: 0,
  failedRequests: 0,
  httpEndpoints: 0,
  uniqueEndpoints: 0,
  uniqueDomains: 0,
  avgLatency: 0,
  maxLatency: 0,
  methods: {},
  statusCodes: {},
  statusCategories: {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
    other: 0,
  },
  domains: {},
};

export function HarProvider({ children }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start loading while checking IndexedDB
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [harLog, setHarLog] = useState(null);
  const [entries, setEntries] = useState([]);
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [endpoints, setEndpoints] = useState([]);
  const [securityFindings, setSecurityFindings] = useState([]);
  const [flowGraph, setFlowGraph] = useState({ nodes: [], links: [] });
  const [error, setError] = useState(null);
  const [warning, setWarning] = useState(null);

  // Persistence State
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  /**
   * On application startup or browser refresh:
   * Automatically restore the most recent saved session from IndexedDB.
   */
  useEffect(() => {
    let isMounted = true;

    async function restoreSavedSession() {
      if (!isIndexedDbSupported()) {
        if (isMounted) {
          setIsLoading(false);
          setStorageError('IndexedDB is not supported in this browser. Persistence disabled.');
        }
        return;
      }

      try {
        const saved = await loadLatestSession();
        if (isMounted) {
          if (saved && Array.isArray(saved.entries) && saved.entries.length > 0) {
            setFileName(saved.fileName || 'restored_session.har');
            setFileSize(saved.fileSize || 0);
            setEntries(saved.entries);
            setMetrics(saved.metrics || DEFAULT_METRICS);
            setEndpoints(saved.endpoints || []);
            setSecurityFindings(saved.securityFindings || []);
            setFlowGraph(saved.flowGraph || { nodes: [], links: [] });
            setIsLoaded(true);
            setSaveStatus('saved');
            setLastSavedAt(saved.savedAt || new Date().toISOString());
            setStorageError(null);
          } else {
            setSaveStatus('idle');
          }
        }
      } catch (err) {
        console.warn('[HarContext] Error restoring session:', err);
        if (isMounted) {
          setStorageError(`Failed to restore session from IndexedDB: ${err.message}`);
          setSaveStatus('error');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    restoreSavedSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Process parsed HAR JSON and update state + persist to IndexedDB
   * Replaces the active session only after successful parsing.
   */
  const processHarJson = async (parsedJson, name, size) => {
    setError(null);
    setWarning(null);

    const validation = validateHar(parsedJson);
    if (!validation.isValid) {
      setError(validation.error);
      setIsLoading(false);
      return false;
    }

    if (validation.isEmpty) {
      setWarning(validation.warning);
      setIsLoading(false);
      return false;
    }

    try {
      const parsedEntries = parseHarEntries(parsedJson.log);
      const computedMetrics = computeMetrics(parsedEntries);
      const extractedEndpoints = extractEndpoints(parsedEntries);
      const findings = runSecurityAudit(parsedEntries);
      const graph = extractFlowGraph(parsedEntries);

      // 1. Update in-memory state
      setFileName(name);
      setFileSize(size);
      setHarLog(sanitizeHarData(parsedJson.log));
      setEntries(parsedEntries);
      setMetrics(computedMetrics);
      setEndpoints(extractedEndpoints);
      setSecurityFindings(findings);
      setFlowGraph(graph);
      setIsLoaded(true);
      setIsLoading(false);

      // 2. Persist to local IndexedDB
      setSaveStatus('saving');
      const sessionPayload = {
        fileName: name,
        fileSize: size,
        entries: parsedEntries,
        metrics: computedMetrics,
        endpoints: extractedEndpoints,
        securityFindings: findings,
        flowGraph: graph,
      };

      const result = await saveSession(sessionPayload);
      if (result.success) {
        setSaveStatus('saved');
        setLastSavedAt(result.savedAt);
        setStorageError(null);
      } else {
        setSaveStatus('error');
        setStorageError(result.error || 'Failed to save analysis session to IndexedDB.');
      }

      return true;
    } catch (err) {
      setError('Failed to extract HAR records. Check the HAR structure and try again.');
      setIsLoading(false);
      return false;
    }
  };

  /**
   * Handle real file upload using browser FileReader
   * Preserves previous valid session if reading or parsing fails.
   */
  const uploadFile = (file) => {
    return new Promise((resolve) => {
      if (!file) {
        setError('No file was provided.');
        resolve(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setWarning(null);

      // Verify file size limit (50 MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File exceeds maximum allowable size of 50 MB.');
        setIsLoading(false);
        resolve(false);
        return;
      }

      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target?.result;
          if (!content || typeof content !== 'string') {
            throw new Error('File content is empty or unreadable.');
          }

          const parsed = JSON.parse(content);
          const success = await processHarJson(parsed, file.name, file.size);
          resolve(success);
        } catch (err) {
          setError(`Invalid JSON structure: ${err.message}. Please upload a valid .har file.`);
          setIsLoading(false);
          resolve(false);
        }
      };

      reader.onerror = () => {
        setError('Browser failed to read the file. Please check file permissions and try again.');
        setIsLoading(false);
        resolve(false);
      };

      reader.readAsText(file);
    });
  };

  /**
   * Load the verified synthetic test HAR fixture directly and persist it
   */
  const loadSampleData = () => {
    setIsLoading(true);
    setTimeout(async () => {
      await processHarJson(
        SAMPLE_HAR_DATA,
        'api-lens-sample-test.har',
        12922
      );
    }, 200);
  };

  /**
   * Request Clear Analysis (triggers confirmation dialog)
   */
  const requestClearAnalysis = useCallback(() => {
    setShowClearModal(true);
  }, []);

  /**
   * Cancel Clear Analysis
   */
  const cancelClearAnalysis = useCallback(() => {
    setShowClearModal(false);
  }, []);

  /**
   * Confirm Clear Analysis (deletes from IndexedDB and clears memory)
   */
  const confirmClearAnalysis = useCallback(async () => {
    try {
      await clearLatestSession();
    } catch (err) {
      console.warn('[HarContext] Error clearing IndexedDB session:', err);
    }

    setIsLoaded(false);
    setIsLoading(false);
    setFileName('');
    setFileSize(0);
    setHarLog(null);
    setEntries([]);
    setMetrics(DEFAULT_METRICS);
    setEndpoints([]);
    setSecurityFindings([]);
    setFlowGraph({ nodes: [], links: [] });
    setError(null);
    setWarning(null);
    setSaveStatus('idle');
    setLastSavedAt(null);
    setStorageError(null);
    setShowClearModal(false);
  }, []);

  /**
   * clearData alias to request confirmation dialog
   */
  const clearData = requestClearAnalysis;

  /**
   * Export sanitized JSON report
   */
  const exportJsonReport = () => {
    if (!isLoaded || entries.length === 0) {
      alert('No analyzed HAR data available to export.');
      return;
    }

    const report = {
      generator: 'API Lens Telemetry Engine v1.4.0',
      timestamp: new Date().toISOString(),
      sourceFile: fileName,
      persistedLocally: saveStatus === 'saved',
      metrics,
      endpoints: endpoints.map((ep) => ({
        method: ep.method,
        pathname: ep.pathname,
        domain: ep.domain,
        protocol: ep.protocol,
        callCount: ep.callCount,
        avgLatency: ep.avgLatency,
        primaryStatus: ep.primaryStatus,
      })),
      securityAudit: {
        disclaimer:
          'Potential risks identified via heuristic audit rules. Not confirmed vulnerabilities.',
        totalFindings: securityFindings.length,
        findings: securityFindings,
      },
      requestsSummary: entries.map((e) => ({
        id: e.id,
        method: e.method,
        url: e.url,
        status: e.response.status,
        statusText: e.response.statusText,
        latencyMs: e.time,
        isSecure: e.isSecure,
      })),
    };

    const safeReport = sanitizeHarData(report);
    const blob = new Blob([JSON.stringify(safeReport, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api_lens_report_${fileName.replace('.har', '') || 'capture'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <HarContext.Provider
      value={{
        isLoaded,
        isLoading,
        fileName,
        fileSize,
        harLog,
        entries,
        metrics,
        endpoints,
        securityFindings,
        flowGraph,
        error,
        warning,
        saveStatus,
        lastSavedAt,
        storageError,
        showClearModal,
        uploadFile,
        loadSampleData,
        clearData,
        requestClearAnalysis,
        cancelClearAnalysis,
        confirmClearAnalysis,
        exportJsonReport,
      }}
    >
      {children}
    </HarContext.Provider>
  );
}

export function useHar() {
  const context = useContext(HarContext);
  if (!context) {
    throw new Error('useHar must be used within a HarProvider');
  }
  return context;
}
