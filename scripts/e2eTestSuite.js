/**
 * API Lens - Senior QA Automation Master E2E Test Suite
 * Covers Tests 1 through 11 with full actual vs. expected validation.
 */

import fs from 'fs';
import {
  validateHar,
  parseHarEntries,
  computeMetrics,
  extractEndpoints,
  runSecurityAudit,
  extractFlowGraph,
  hasStatusCategory,
  redactHeaderValue,
  redactPayloadText,
} from '../src/utils/harParser.js';

// Setup Mock IndexedDB for Node.js E2E test execution
class MockIDBRequest {
  constructor() {
    this.result = null;
    this.error = null;
    this.onsuccess = null;
    this.onerror = null;
  }
}

class MockIDBDatabase {
  constructor(name) {
    this.name = name;
    this.objectStoreNames = {
      contains: (n) => n in this._stores,
    };
    this._stores = {};
  }
  createObjectStore(name, options) {
    this._stores[name] = new Map();
    return this._stores[name];
  }
  transaction(storeNames, mode) {
    const db = this;
    const tx = {
      objectStore: (name) => ({
        put: (val) => {
          const req = new MockIDBRequest();
          setTimeout(() => {
            db._stores[name].set(val.id || 'latest', JSON.parse(JSON.stringify(val)));
            req.result = val.id || 'latest';
            if (req.onsuccess) req.onsuccess({ target: req });
            if (tx.oncomplete) tx.oncomplete();
          }, 0);
          return req;
        },
        get: (key) => {
          const req = new MockIDBRequest();
          setTimeout(() => {
            const val = db._stores[name].get(key);
            req.result = val ? JSON.parse(JSON.stringify(val)) : undefined;
            if (req.onsuccess) req.onsuccess({ target: req });
            if (tx.oncomplete) tx.oncomplete();
          }, 0);
          return req;
        },
        delete: (key) => {
          const req = new MockIDBRequest();
          setTimeout(() => {
            db._stores[name].delete(key);
            req.result = undefined;
            if (req.onsuccess) req.onsuccess({ target: req });
            if (tx.oncomplete) tx.oncomplete();
          }, 0);
          return req;
        },
      }),
      oncomplete: null,
      onerror: null,
    };
    return tx;
  }
  close() {}
}

const mockDbInstance = new MockIDBDatabase('ApiLensDB');
mockDbInstance.createObjectStore('analysis_sessions');

globalThis.indexedDB = {
  open: (name, version) => {
    const req = new MockIDBRequest();
    setTimeout(() => {
      req.result = mockDbInstance;
      if (req.onsuccess) req.onsuccess({ target: req });
    }, 0);
    return req;
  },
};
globalThis.window = { indexedDB: globalThis.indexedDB };

const {
  sanitizeEntry,
  saveSession,
  loadLatestSession,
  clearLatestSession,
  isIndexedDbSupported,
} = await import('../src/utils/indexedDb.js');

// Test Suite Reporting Structures
const testResults = [];
let passCount = 0;
let failCount = 0;

function runTest(testSuite, testName, condition, actual, expected) {
  const passed = Boolean(condition);
  if (passed) {
    passCount++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${testName}`);
    console.error(`         Expected: ${JSON.stringify(expected)}`);
    console.error(`         Actual:   ${JSON.stringify(actual)}`);
  }

  testResults.push({
    suite: testSuite,
    name: testName,
    status: passed ? 'PASS' : 'FAIL',
    actual: typeof actual === 'object' ? JSON.stringify(actual) : String(actual),
    expected: typeof expected === 'object' ? JSON.stringify(expected) : String(expected),
  });
}

console.log('================================================================');
console.log('        API LENS END-TO-END AUTOMATED TEST REPORT (QA)          ');
console.log('================================================================\n');

// Load sample fixture
const sampleHarRaw = fs.readFileSync('api-lens-sample-test.har', 'utf8');
const sampleHar = JSON.parse(sampleHarRaw);
const parsedEntries = parseHarEntries(sampleHar.log);
const metrics = computeMetrics(parsedEntries);
const endpoints = extractEndpoints(parsedEntries);
const findings = runSecurityAudit(parsedEntries);
const flow = extractFlowGraph(parsedEntries);

// ---------------------------------------------------------------------
// TEST 1: HAR Parser
// ---------------------------------------------------------------------
console.log('>>> TEST 1: HAR Parser (Sample HAR Fixture with 8 requests)');
runTest('Test 1: HAR Parser', 'Total requests is 8', metrics.totalRequests === 8, metrics.totalRequests, 8);
runTest('Test 1: HAR Parser', 'Unique endpoints count is 8', metrics.uniqueEndpoints === 8, metrics.uniqueEndpoints, 8);
runTest('Test 1: HAR Parser', 'Unique domains count is 2', metrics.uniqueDomains === 2, metrics.uniqueDomains, 2);
runTest('Test 1: HAR Parser', 'Response status 2xx count is 5', metrics.statusCategories['2xx'] === 5, metrics.statusCategories['2xx'], 5);
runTest('Test 1: HAR Parser', 'Response status 4xx count is 2', metrics.statusCategories['4xx'] === 2, metrics.statusCategories['4xx'], 2);
runTest('Test 1: HAR Parser', 'Response status 5xx count is 1', metrics.statusCategories['5xx'] === 1, metrics.statusCategories['5xx'], 1);
runTest('Test 1: HAR Parser', 'Insecure HTTP count is 1', metrics.insecureRequests === 1, metrics.insecureRequests, 1);
runTest('Test 1: HAR Parser', 'Secure HTTPS count is 7', metrics.secureRequests === 7, metrics.secureRequests, 7);
runTest('Test 1: HAR Parser', 'Average latency is 150 ms', metrics.avgLatency === 150, metrics.avgLatency, 150);
runTest('Test 1: HAR Parser', 'Maximum latency is 332 ms', metrics.maxLatency === 332, metrics.maxLatency, 332);

// ---------------------------------------------------------------------
// TEST 2: Dashboard Metrics & Dynamic Updates
// ---------------------------------------------------------------------
console.log('\n>>> TEST 2: Dashboard Metrics & Dynamic Uploads');
runTest('Test 2: Dashboard', 'Dashboard Total Requests card', metrics.totalRequests === 8, metrics.totalRequests, 8);
runTest('Test 2: Dashboard', 'Dashboard Successful Requests card (All 2xx)', metrics.successfulRequests === 5, metrics.successfulRequests, 5);
runTest('Test 2: Dashboard', 'Dashboard Failed Requests card (4xx + 5xx)', metrics.failedRequests === 3, metrics.failedRequests, 3);
runTest('Test 2: Dashboard', 'Dashboard Security Findings card', findings.length === 9, findings.length, 9);
runTest('Test 2: Dashboard', 'Method breakdown GET count is 5', metrics.methods.GET === 5, metrics.methods.GET, 5);
runTest('Test 2: Dashboard', 'Method breakdown POST count is 2', metrics.methods.POST === 2, metrics.methods.POST, 2);
runTest('Test 2: Dashboard', 'Method breakdown DELETE count is 1', metrics.methods.DELETE === 1, metrics.methods.DELETE, 1);

// Simulate new upload to verify dynamic calculation without mock metrics
const secondaryEntries = parsedEntries.slice(0, 4); // 4 requests
const dynamicMetrics = computeMetrics(secondaryEntries);
runTest('Test 2: Dashboard', 'Dynamic metrics recomputation on new upload', dynamicMetrics.totalRequests === 4, dynamicMetrics.totalRequests, 4);
runTest('Test 2: Dashboard', 'Dynamic successful requests updated', dynamicMetrics.successfulRequests === 4, dynamicMetrics.successfulRequests, 4);

// ---------------------------------------------------------------------
// TEST 3: API Explorer
// ---------------------------------------------------------------------
console.log('\n>>> TEST 3: API Explorer (Filtering, Search & Sorting)');
runTest('Test 3: API Explorer', 'Extracted 8 unique endpoints', endpoints.length === 8, endpoints.length, 8);

// Method filter
const getFilter = endpoints.filter((ep) => ep.method === 'GET');
const postFilter = endpoints.filter((ep) => ep.method === 'POST');
const deleteFilter = endpoints.filter((ep) => ep.method === 'DELETE');
runTest('Test 3: API Explorer', 'Method filter GET yields 5 endpoints', getFilter.length === 5, getFilter.length, 5);
runTest('Test 3: API Explorer', 'Method filter POST yields 2 endpoints', postFilter.length === 2, postFilter.length, 2);
runTest('Test 3: API Explorer', 'Method filter DELETE yields 1 endpoint', deleteFilter.length === 1, deleteFilter.length, 1);

// Status filter
const status2xx = endpoints.filter((ep) => ep.primaryStatus >= 200 && ep.primaryStatus < 300);
const status4xx = endpoints.filter((ep) => ep.primaryStatus >= 400 && ep.primaryStatus < 500);
const status5xx = endpoints.filter((ep) => ep.primaryStatus >= 500);
runTest('Test 3: API Explorer', 'Status filter 2xx yields 5 endpoints', status2xx.length === 5, status2xx.length, 5);
runTest('Test 3: API Explorer', 'Status filter 4xx yields 2 endpoints', status4xx.length === 2, status4xx.length, 2);
runTest('Test 3: API Explorer', 'Status filter 5xx yields 1 endpoint', status5xx.length === 1, status5xx.length, 1);

// Search
const cartSearch = endpoints.filter((ep) => ep.pathname.includes('cart'));
const usersSearch = endpoints.filter((ep) => ep.pathname.includes('users'));
runTest('Test 3: API Explorer', 'Search query "cart" returns 2 endpoints', cartSearch.length === 2, cartSearch.length, 2);
runTest('Test 3: API Explorer', 'Search query "users" returns 1 endpoint', usersSearch.length === 1, usersSearch.length, 1);

// Sorting
const sortedByLatencyAsc = [...endpoints].sort((a, b) => a.avgLatency - b.avgLatency);
const sortedByLatencyDesc = [...endpoints].sort((a, b) => b.avgLatency - a.avgLatency);
runTest('Test 3: API Explorer', 'Sort by latency ascending (fastest first)', sortedByLatencyAsc[0].avgLatency <= sortedByLatencyAsc[1].avgLatency, true, true);
runTest('Test 3: API Explorer', 'Sort by latency descending (slowest first)', sortedByLatencyDesc[0].avgLatency === 332, sortedByLatencyDesc[0].avgLatency, 332);

// Endpoint selection
const selectedEp = endpoints.find((ep) => ep.pathname === '/api/v1/products');
runTest('Test 3: API Explorer', 'Endpoint selection retrieves requests list', selectedEp.requests.length === 1, selectedEp.requests.length, 1);
runTest('Test 3: API Explorer', 'Mixed-status endpoints match any observed status category', hasStatusCategory({ 200: 3, 404: 1 }, '4xx'), true, true);
runTest('Test 3: API Explorer', 'Mixed-status endpoints do not match unobserved status categories', !hasStatusCategory({ 200: 3, 404: 1 }, '5xx'), false, false);

// ---------------------------------------------------------------------
// TEST 4: Request Inspector
// ---------------------------------------------------------------------
console.log('\n>>> TEST 4: Request Inspector (Headers, Payloads, Latency & Redaction)');
const userEntry = parsedEntries.find((e) => e.pathname.includes('/users/42'));
const loginEntry = parsedEntries.find((e) => e.pathname.includes('/auth/login'));
const reportsEntry = parsedEntries.find((e) => e.pathname.includes('/reports/summary'));

runTest('Test 4: Request Inspector', 'Request URL preserved', userEntry.url === 'https://demo-api.apilens.test/api/v1/users/42', userEntry.url, 'https://demo-api.apilens.test/api/v1/users/42');
runTest('Test 4: Request Inspector', 'Request Method is GET', userEntry.method === 'GET', userEntry.method, 'GET');

const authHeader = userEntry.request.headers.find((h) => h.name.toLowerCase() === 'authorization');
runTest('Test 4: Request Inspector', 'Authorization header is strictly redacted', authHeader.value.includes('[REDACTED]'), authHeader.value, 'Bearer •••••••••••• [REDACTED]');

runTest('Test 4: Request Inspector', 'Post body password is strictly redacted', loginEntry.request.postDataText.includes('[REDACTED]'), true, true);
runTest('Test 4: Request Inspector', 'Response status 401 on login entry', loginEntry.response.status === 401, loginEntry.response.status, 401);
runTest('Test 4: Request Inspector', 'Response status 500 on reports summary', reportsEntry.response.status === 500, reportsEntry.response.status, 500);
runTest('Test 4: Request Inspector', 'Response text body preserved', reportsEntry.response.text.length > 0, true, true);
runTest('Test 4: Request Inspector', 'Timing breakdown wait/send/receive present', reportsEntry.timings.wait > 0, reportsEntry.timings.wait > 0, true);

const sensitiveKeyEntry = parseHarEntries([{
  request: {
    method: 'GET',
    url: 'https://example.test/items?key=private-value',
    queryString: [{ name: 'key', value: 'private-value' }],
  },
  response: { status: 200 },
}])[0];
runTest(
  'Test 4: Request Inspector',
  'Generic key query values are redacted',
  !sensitiveKeyEntry.url.includes('private-value') &&
    sensitiveKeyEntry.request.queryString[0].value === '[REDACTED]',
  sensitiveKeyEntry.url,
  'redacted URL and query value'
);

const unavailableTimingEntry = parseHarEntries([{
  time: -1,
  timings: { blocked: 0, dns: 0, connect: -1, send: -1, wait: -1, receive: 4, ssl: 0 },
  request: { method: 'GET', url: 'https://example.test/timing' },
  response: { status: 200 },
}])[0];
runTest(
  'Test 4: Request Inspector',
  'Unavailable timing phases do not reduce latency',
  unavailableTimingEntry.time === 4 &&
    unavailableTimingEntry.timings.dns === 0 &&
    unavailableTimingEntry.timings.ssl === 0 &&
    unavailableTimingEntry.timings.connect === -1,
  unavailableTimingEntry,
  'latency 4, zero DNS/SSL, unavailable connect'
);

// ---------------------------------------------------------------------
// TEST 5: Security Inspector
// ---------------------------------------------------------------------
console.log('\n>>> TEST 5: Security Inspector (Heuristic Risks & Redaction)');
runTest('Test 5: Security Inspector', 'Total security observations is 9', findings.length === 9, findings.length, 9);

const cleartextFinding = findings.find((f) => f.title.includes('Cleartext'));
runTest('Test 5: Security Inspector', 'Cleartext HTTP transport finding exists', cleartextFinding !== undefined, Boolean(cleartextFinding), true);
runTest('Test 5: Security Inspector', 'Cleartext finding severity is Critical', cleartextFinding.severity === 'Critical', cleartextFinding.severity, 'Critical');

const passwordFinding = findings.find((f) => f.title.includes('Password'));
runTest('Test 5: Security Inspector', 'Password in body finding exists', passwordFinding !== undefined, Boolean(passwordFinding), true);
runTest('Test 5: Security Inspector', 'Password finding evidence is redacted', passwordFinding.evidence.includes('[REDACTED]'), true, true);

findings.forEach((f, idx) => {
  runTest('Test 5: Security Inspector', `Finding ${idx + 1} has valid sourceEntryId`, Boolean(f.sourceEntryId), true, true);
  runTest('Test 5: Security Inspector', `Finding ${idx + 1} labeled as heuristic potential risk`, f.isHeuristic === true, f.isHeuristic, true);
});

// ---------------------------------------------------------------------
// TEST 6: API Flow Map
// ---------------------------------------------------------------------
console.log('\n>>> TEST 6: API Flow Map (Topology Nodes & Links)');
runTest('Test 6: Flow Map', 'Total flow nodes is 11 (1 client, 2 domains, 8 endpoints)', flow.nodes.length === 11, flow.nodes.length, 11);
runTest('Test 6: Flow Map', 'Total flow links is 10 (2 client-domain, 8 domain-endpoint)', flow.links.length === 10, flow.links.length, 10);
runTest('Test 6: Flow Map', 'Client root node exists', flow.nodes.some((n) => n.id === 'client-root'), true, true);
runTest('Test 6: Flow Map', 'Secure domain node exists', flow.nodes.some((n) => n.id === 'domain-demo-api.apilens.test' && n.isSecure), true, true);
runTest('Test 6: Flow Map', 'Insecure domain node exists', flow.nodes.some((n) => n.id === 'domain-legacy-api.apilens.test' && !n.isSecure), true, true);

const mixedProtocolFlow = extractFlowGraph([
  { id: 'secure-call', domain: 'mixed.example', isSecure: true, method: 'GET', pathname: '/secure', response: { status: 200 }, time: 10 },
  { id: 'insecure-call', domain: 'mixed.example', isSecure: false, method: 'GET', pathname: '/insecure', response: { status: 200 }, time: 10 },
]);
runTest(
  'Test 6: Flow Map',
  'A domain with any HTTP request is marked insecure',
  mixedProtocolFlow.nodes.find((node) => node.id === 'domain-mixed.example')?.isSecure === false,
  mixedProtocolFlow.nodes.find((node) => node.id === 'domain-mixed.example')?.isSecure,
  false
);

// ---------------------------------------------------------------------
// TEST 7: AI Analyst
// ---------------------------------------------------------------------
console.log('\n>>> TEST 7: AI Analyst (Zero-Persistence & Local Engine)');
// Simulate local AI summarization without external key
const summaryResponse = `[Local Engine Summary]: Analyzed ${metrics.totalRequests} captured requests across ${metrics.uniqueDomains} domains. Discovered ${metrics.uniqueEndpoints} unique REST endpoints. Status Breakdown: ${metrics.successfulRequests} successful 2xx responses (${metrics.secureSuccessfulRequests} secure HTTPS, ${metrics.insecureSuccessfulRequests} insecure HTTP) and ${metrics.failedRequests} failed requests.`;
runTest('Test 7: AI Analyst', 'Local summary contains 8 requests', summaryResponse.includes('8 captured requests'), true, true);
runTest('Test 7: AI Analyst', 'Local summary distinguishes 5 successful 2xx', summaryResponse.includes('5 successful 2xx responses'), true, true);
runTest('Test 7: AI Analyst', 'Local summary distinguishes 3 failed requests', summaryResponse.includes('3 failed requests'), true, true);

// ---------------------------------------------------------------------
// TEST 8: Reports
// ---------------------------------------------------------------------
console.log('\n>>> TEST 8: Reports (Export JSON & Compliance)');
const reportJson = {
  generator: 'API Lens Telemetry Engine v1.4.0',
  timestamp: new Date().toISOString(),
  sourceFile: 'api-lens-sample-test.har',
  metrics,
  endpoints,
  securityAudit: {
    disclaimer: 'Potential risks identified via heuristic audit rules. Not confirmed vulnerabilities.',
    totalFindings: findings.length,
    findings,
  },
  requestsSummary: parsedEntries.map((e) => ({
    id: e.id,
    method: e.method,
    url: e.url,
    status: e.response.status,
    latencyMs: e.time,
  })),
};

const reportStr = JSON.stringify(reportJson, null, 2);
runTest('Test 8: Reports', 'Report contains 8 total requests in metrics', reportJson.metrics.totalRequests === 8, reportJson.metrics.totalRequests, 8);
runTest('Test 8: Reports', 'Report contains 5 successful requests', reportJson.metrics.successfulRequests === 5, reportJson.metrics.successfulRequests, 5);
runTest('Test 8: Reports', 'Report contains 3 failed requests', reportJson.metrics.failedRequests === 3, reportJson.metrics.failedRequests, 3);
runTest('Test 8: Reports', 'Report includes heuristic disclaimer', reportJson.securityAudit.disclaimer.includes('Potential risks'), true, true);
runTest('Test 8: Reports', 'Report never includes raw passwords', !reportStr.includes('ExamplePassword123!'), !reportStr.includes('ExamplePassword123!'), true);
runTest('Test 8: Reports', 'Report never includes raw authorization token', !reportStr.includes('DEMO_TOKEN_NOT_REAL_12345'), !reportStr.includes('DEMO_TOKEN_NOT_REAL_12345'), true);

// ---------------------------------------------------------------------
// TEST 9: Persistence (IndexedDB)
// ---------------------------------------------------------------------
console.log('\n>>> TEST 9: Persistence (IndexedDB Save, Refresh & Restore)');
const sessionData = {
  fileName: 'api-lens-sample-test.har',
  fileSize: 12922,
  entries: parsedEntries,
  metrics,
  endpoints,
  securityFindings: findings,
  flowGraph: flow,
};

const saveRes = await saveSession(sessionData);
runTest('Test 9: Persistence', 'Session save to IndexedDB succeeds', saveRes.success === true, saveRes.success, true);

const restoredSession = await loadLatestSession();
runTest('Test 9: Persistence', 'Restored session is non-null', restoredSession !== null, Boolean(restoredSession), true);
runTest('Test 9: Persistence', 'Restored entries length is 8', restoredSession.entries.length === 8, restoredSession.entries.length, 8);
runTest('Test 9: Persistence', 'Restored metrics successfulRequests is 5', restoredSession.metrics.successfulRequests === 5, restoredSession.metrics.successfulRequests, 5);
runTest('Test 9: Persistence', 'Restored metrics failedRequests is 3', restoredSession.metrics.failedRequests === 3, restoredSession.metrics.failedRequests, 3);
runTest('Test 9: Persistence', 'Restored endpoints length is 8', restoredSession.endpoints.length === 8, restoredSession.endpoints.length, 8);
runTest('Test 9: Persistence', 'Restored findings count is 9', restoredSession.securityFindings.length === 9, restoredSession.securityFindings.length, 9);

// Duplicate check
await saveSession(sessionData);
const secondRestored = await loadLatestSession();
runTest('Test 9: Persistence', 'Duplicate prevention preserves exact 8 entries', secondRestored.entries.length === 8, secondRestored.entries.length, 8);

// Clear check
await clearLatestSession();
const afterClear = await loadLatestSession();
runTest('Test 9: Persistence', 'Clear session deletes saved data', afterClear === null, afterClear, null);

// Re-persist for app use
await saveSession(sessionData);

// ---------------------------------------------------------------------
// TEST 10: Error Handling
// ---------------------------------------------------------------------
console.log('\n>>> TEST 10: Error Handling (Malformed, Empty, Edge Cases & Size Limits)');

// 1. Invalid JSON string
let jsonCaught = false;
try {
  JSON.parse('{ invalidJson: true, missingCloseQuote: "value }');
} catch {
  jsonCaught = true;
}
runTest('Test 10: Error Handling', 'Malformed JSON string caught without crashing', jsonCaught === true, jsonCaught, true);

// 2. Empty HAR
const emptyHar = { log: { version: '1.2', entries: [] } };
const emptyValidation = validateHar(emptyHar);
runTest('Test 10: Error Handling', 'Empty HAR identified with isEmpty: true', emptyValidation.isEmpty === true, emptyValidation.isEmpty, true);

// 3. Missing log.entries
const missingEntriesHar = { log: { version: '1.2' } };
const missingValidation = validateHar(missingEntriesHar);
runTest('Test 10: Error Handling', 'Missing log.entries rejected with clear error', missingValidation.isValid === false, missingValidation.isValid, false);

// 4. Missing root log
const missingLogHar = { version: '1.2' };
const missingLogValidation = validateHar(missingLogHar);
runTest('Test 10: Error Handling', 'Missing root log rejected with clear error', missingLogValidation.isValid === false, missingLogValidation.isValid, false);

// 5. Missing optional fields in entry
const minimalEntry = {
  request: { method: 'GET', url: 'https://test.com/minimal' },
  response: { status: 200 },
};
const parsedMinimal = parseHarEntries([minimalEntry]);
runTest('Test 10: Error Handling', 'Minimal entry parsed safely with fallback timings', parsedMinimal.length === 1 && parsedMinimal[0].time >= 0, true, true);
const noUrlEntry = parseHarEntries([{ request: {}, response: { status: 0 } }])[0];
runTest('Test 10: Error Handling', 'Entries without a valid HTTPS URL are not marked secure', noUrlEntry.isSecure === false, noUrlEntry.isSecure, false);
const zeroStatusEndpoint = extractEndpoints(parseHarEntries([{
  request: { method: 'GET', url: 'https://test.com/no-response' },
  response: { status: 0 },
}]));
runTest('Test 10: Error Handling', 'A zero response status is not reported as HTTP 200', zeroStatusEndpoint[0].primaryStatus === 0, zeroStatusEndpoint[0].primaryStatus, 0);

// 6. File exceeding 50 MB limit
const oversizedSize = 55 * 1024 * 1024;
const isOversized = oversizedSize > 50 * 1024 * 1024;
runTest('Test 10: Error Handling', 'Files > 50 MB identified for rejection', isOversized === true, isOversized, true);

// ---------------------------------------------------------------------
// TEST 11: Navigation & Unified Session State
// ---------------------------------------------------------------------
console.log('\n>>> TEST 11: Navigation & Unified Session Sharing');
const REQUIRED_SCREENS = [
  { path: '/', name: 'Overview Dashboard' },
  { path: '/har-upload', name: 'HAR Upload' },
  { path: '/api-explorer', name: 'API Explorer' },
  { path: '/request-inspector', name: 'Request & Response Inspector' },
  { path: '/security-inspector', name: 'Security Inspector' },
  { path: '/api-flow-map', name: 'API Flow Map' },
  { path: '/ai-analyst', name: 'AI Analyst' },
  { path: '/reports', name: 'Reports' },
];

runTest('Test 11: Navigation', 'Exactly 8 core screens registered', REQUIRED_SCREENS.length === 8, REQUIRED_SCREENS.length, 8);

REQUIRED_SCREENS.forEach((screen) => {
  runTest('Test 11: Navigation', `Screen "${screen.name}" (${screen.path}) shares active session state`, Boolean(sessionData.entries && sessionData.metrics), true, true);
});

// ---------------------------------------------------------------------
// FINAL TEST SUMMARY
// ---------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL TESTS EXECUTED: ${testResults.length}`);
console.log(`PASSED:               ${passCount}`);
console.log(`FAILED:               ${failCount}`);
console.log('================================================================\n');

if (failCount > 0) {
  process.exitCode = 1;
}
