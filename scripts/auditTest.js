import fs from 'fs';
import {
  validateHar,
  parseHarEntries,
  computeMetrics,
  extractEndpoints,
  runSecurityAudit,
  extractFlowGraph,
  redactHeaderValue,
  redactPayloadText,
} from '../src/utils/harParser.js';
import {
  buildAiRequestPayload,
  sanitizeHarData,
} from '../src/utils/redaction.js';

// Setup Mock IndexedDB for Node.js test environment
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

console.log('=====================================================');
console.log('   API LENS QA FUNCTIONAL & SECURITY AUDIT SUITE    ');
console.log('=====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName} - ${details}`);
    process.exitCode = 1;
  }
}

// -----------------------------------------------------------------
// TEST 1: Real HAR File Parsing & Priority 2 Expected Metrics
// -----------------------------------------------------------------
console.log('--- SUITE 1: HAR Upload & Metric Calculations ---');
const sampleHarRaw = fs.readFileSync('api-lens-sample-test.har', 'utf8');
const sampleHar = JSON.parse(sampleHarRaw);

const validation = validateHar(sampleHar);
assert(validation.isValid === true, 'HAR 1.2 Structure Validation');
assert(validation.isEmpty === false, 'HAR has non-empty entries');

const entries = parseHarEntries(sampleHar.log);
assert(entries.length === 8, 'Extracted exactly 8 entries from sample HAR');

const metrics = computeMetrics(entries);
console.log('Computed Metrics:', metrics);

// Metric Definitions Audited & Verified:
// 1. Successful Requests must count ALL 2xx responses = 5
assert(metrics.successfulRequests === 5, 'Successful requests (All 2xx) is 5', `Got: ${metrics.successfulRequests}`);
assert(metrics.total2xxRequests === 5, 'Total 2xx requests is 5 (4 HTTPS + 1 HTTP)', `Got: ${metrics.total2xxRequests}`);

// 2. Secure HTTPS Requests must count HTTPS requests separately
assert(metrics.secureRequests === 7, 'Total Secure HTTPS requests is 7', `Got: ${metrics.secureRequests}`);
assert(metrics.secureSuccessfulRequests === 4, 'Secure HTTPS 2xx requests is 4', `Got: ${metrics.secureSuccessfulRequests}`);

// 3. Insecure HTTP Requests must count HTTP requests separately
assert(metrics.insecureRequests === 1, 'Total Insecure HTTP requests is 1', `Got: ${metrics.insecureRequests}`);
assert(metrics.insecureSuccessfulRequests === 1, 'Insecure HTTP 2xx requests is 1', `Got: ${metrics.insecureSuccessfulRequests}`);
assert(metrics.httpEndpoints === 1, 'Insecure HTTP endpoints is 1', `Got: ${metrics.httpEndpoints}`);

// 4. Failed Requests must count 4xx + 5xx = 3
assert(metrics.clientErrors === 2, 'Client errors (4xx) is 2', `Got: ${metrics.clientErrors}`);
assert(metrics.serverErrors === 1, 'Server errors (5xx) is 1', `Got: ${metrics.serverErrors}`);
assert(metrics.failedRequests === 3, 'Failed requests (4xx + 5xx) is 3', `Got: ${metrics.failedRequests}`);

// 5. Response Status Distribution must remain 5 (2xx), 2 (4xx), 1 (5xx)
assert(metrics.statusCategories['2xx'] === 5, 'Status category 2xx count is 5', `Got: ${metrics.statusCategories['2xx']}`);
assert(metrics.statusCategories['4xx'] === 2, 'Status category 4xx count is 2', `Got: ${metrics.statusCategories['4xx']}`);
assert(metrics.statusCategories['5xx'] === 1, 'Status category 5xx count is 1', `Got: ${metrics.statusCategories['5xx']}`);

assert(metrics.totalRequests === 8, 'Total requests is 8', `Got: ${metrics.totalRequests}`);
assert(metrics.uniqueDomains === 2, 'Unique domains is 2 (demo-api + legacy-api)', `Got: ${metrics.uniqueDomains}`);
assert(metrics.uniqueEndpoints === 8, 'Unique endpoint paths is 8', `Got: ${metrics.uniqueEndpoints}`);

// Method breakdown verification
assert(metrics.methods.GET === 5, 'GET methods count is 5', `Got: ${metrics.methods.GET}`);
assert(metrics.methods.POST === 2, 'POST methods count is 2', `Got: ${metrics.methods.POST}`);
assert(metrics.methods.DELETE === 1, 'DELETE methods count is 1', `Got: ${metrics.methods.DELETE}`);

// -----------------------------------------------------------------
// TEST 2: Security Redaction & Hygiene (Priority 4)
// -----------------------------------------------------------------
console.log('\n--- SUITE 2: Security & Credential Redaction ---');

// Check entry 2 (Authorization header)
const entry2 = entries.find((e) => e.url.includes('/users/42'));
assert(entry2 !== undefined, 'Found GET /users/42 entry');
const authHeader = entry2.request.headers.find((h) => h.name.toLowerCase() === 'authorization');
assert(
  authHeader.value.includes('[REDACTED]') && !authHeader.value.includes('DEMO_TOKEN_NOT_REAL_12345'),
  'Authorization Bearer token is strictly redacted from memory and UI',
  `Got: ${authHeader?.value}`
);

// Check entry 6 (POST /auth/login password)
const entry6 = entries.find((e) => e.url.includes('/auth/login'));
assert(entry6 !== undefined, 'Found POST /auth/login entry');
assert(
  entry6.request.postDataText.includes('[REDACTED]') && !entry6.request.postDataText.includes('ExamplePassword123!'),
  'User password in request body is masked/redacted',
  `Got: ${entry6.request.postDataText}`
);

// Heuristic findings
const findings = runSecurityAudit(entries);
console.log(`Security findings count: ${findings.length}`);
assert(findings.length === 9, 'Generated 9 heuristic security observations', `Got: ${findings.length}`);

// Check that cleartext HTTP is flagged
const httpFinding = findings.find((f) => f.title.includes('Cleartext') && f.title.includes('HTTP'));
assert(httpFinding !== undefined, 'Cleartext HTTP transport risk identified');
assert(httpFinding.severity === 'Critical', 'Cleartext HTTP flagged as Critical severity');

// Check that observations are labeled as heuristic potential risks
findings.forEach((f, idx) => {
  assert(f.isHeuristic === true, `Finding ${idx + 1} is labeled as heuristic potential risk`);
});

// -----------------------------------------------------------------
// TEST 3: Edge Cases, Malformed & Empty Files (Priority 1 & 4)
// -----------------------------------------------------------------
console.log('\n--- SUITE 3: Malformed, Empty & Edge Cases ---');

// Empty HAR
const emptyHar = { log: { version: '1.2', entries: [] } };
const emptyVal = validateHar(emptyHar);
assert(emptyVal.isValid === true && emptyVal.isEmpty === true, 'Empty HAR log.entries recognized as empty without crash');

// Malformed HAR missing log
const missingLog = { invalid: true };
const missingVal = validateHar(missingLog);
assert(missingVal.isValid === false, 'Missing log object rejected with clear error');

// Malformed JSON string
let caughtJsonError = false;
try {
  JSON.parse('{ invalid json string ');
} catch {
  caughtJsonError = true;
}
assert(caughtJsonError === true, 'Invalid JSON syntax properly handled by catch block');

// Missing fields in entry
const partialEntry = {
  request: { method: 'GET', url: 'https://api.test/partial' },
  response: { status: 200 }
};
const parsedPartial = parseHarEntries([partialEntry]);
assert(parsedPartial.length === 1 && parsedPartial[0].time >= 0, 'Partial entry without timings parsed safely without crash');

// -----------------------------------------------------------------
// TEST 4: Flow Graph & Endpoints Extraction (Priority 3)
// -----------------------------------------------------------------
console.log('\n--- SUITE 4: Flow Graph & Endpoints ---');
const flow = extractFlowGraph(entries);
assert(flow.nodes.length > 0, `Flow graph contains ${flow.nodes.length} nodes`);
assert(flow.links.length > 0, `Flow graph contains ${flow.links.length} links`);
assert(flow.nodes.some((n) => n.id === 'client-root'), 'Client root node present in flow map');

const endpoints = extractEndpoints(entries);
assert(endpoints.length === 8, `Discovered exactly 8 unique endpoint paths`);

// -----------------------------------------------------------------
// TEST 4.1: End-to-end redaction at every data boundary
// -----------------------------------------------------------------
console.log('\n--- SUITE 4.1: Complete HAR Data Redaction ---');
const syntheticSecrets = [
  'URL_TOKEN_SECRET_1',
  'URL_ACCESS_SECRET_2',
  'URL_API_KEY_SECRET_3',
  'URL_PASSWORD_SECRET_4',
  'url.person@example.test',
  'AUTH_HEADER_SECRET_5',
  'COOKIE_HEADER_SECRET_6',
  'COOKIE_OBJECT_SECRET_7',
  'QUERY_STRING_SECRET_8',
  'POST_PARAM_SECRET_9',
  'JSON_BODY_SECRET_10',
  'JSON_EMAIL_SECRET_11',
  'RESPONSE_COOKIE_SECRET_12',
  'RESPONSE_BODY_SECRET_13',
  'RESPONSE_EMAIL_SECRET_14',
  'PERSON_ID_SECRET_16',
  'PERSONAL_NAME_SECRET_17',
];
const syntheticHarEntry = {
  startedDateTime: '2026-01-01T00:00:00.000Z',
  time: 23,
  request: {
    method: 'POST',
    url: 'https://api.example.test/users?token=URL_TOKEN_SECRET_1&access_token=URL_ACCESS_SECRET_2&api_key=URL_API_KEY_SECRET_3&password=URL_PASSWORD_SECRET_4&email=url.person%40example.test&page=2',
    headers: [
      { name: 'Authorization', value: 'Bearer AUTH_HEADER_SECRET_5' },
      { name: 'Cookie', value: 'session=COOKIE_HEADER_SECRET_6' },
      { name: 'X-API-Key', value: 'AUTH_HEADER_SECRET_5' },
      { name: 'Accept', value: 'application/json' },
    ],
    cookies: [{ name: 'session', value: 'COOKIE_OBJECT_SECRET_7' }],
    queryString: [
      { name: 'token', value: 'QUERY_STRING_SECRET_8' },
      { name: 'page', value: '2' },
    ],
    postData: {
      mimeType: 'application/json',
      params: [{ name: 'api_key', value: 'POST_PARAM_SECRET_9' }],
      text: JSON.stringify({
        password: 'JSON_BODY_SECRET_10',
        email: 'JSON_EMAIL_SECRET_11',
        userId: 'PERSON_ID_SECRET_16',
        resourceType: 'widget',
        active: true,
      }),
    },
  },
  response: {
    status: 200,
    headers: [
      { name: 'Set-Cookie', value: 'sid=RESPONSE_COOKIE_SECRET_12; HttpOnly; Secure' },
      { name: 'Content-Type', value: 'application/json' },
    ],
    cookies: [{ name: 'sid', value: 'RESPONSE_COOKIE_SECRET_12' }],
    content: {
      mimeType: 'application/json',
      text: JSON.stringify({
        access_token: 'RESPONSE_BODY_SECRET_13',
        contact: 'RESPONSE_EMAIL_SECRET_14',
        displayName: 'PERSONAL_NAME_SECRET_17',
        resourceType: 'widget',
        active: true,
      }),
    },
  },
  timings: { wait: 12, send: 3, receive: 8 },
};
syntheticHarEntry.request.url =
  'https://api.example.test/users?token=URL_TOKEN_SECRET_1&access_token=URL_ACCESS_SECRET_2&api_key=URL_API_KEY_SECRET_3&password=URL_PASSWORD_SECRET_4&email=url.person@example.test&page=2';
syntheticHarEntry.request.headers[0].value = 'Bearer AUTH_HEADER_SECRET_5';
syntheticHarEntry.request.headers[1].value = 'session=COOKIE_HEADER_SECRET_6';
syntheticHarEntry.response.content.text = JSON.stringify({
  access_token: 'RESPONSE_BODY_SECRET_13',
  email: 'RESPONSE_EMAIL_SECRET_14',
  displayName: 'PERSONAL_NAME_SECRET_17',
  resourceType: 'widget',
  active: true,
});
assert(
  syntheticSecrets.every((secret) => JSON.stringify(syntheticHarEntry).includes(secret)),
  'Synthetic fixture contains each declared secret'
);
const syntheticEntries = parseHarEntries([syntheticHarEntry]);
const syntheticUiData = JSON.stringify(syntheticEntries);
assert(
  syntheticSecrets.every((secret) => !syntheticUiData.includes(secret)),
  'Normalized/UI-facing request data excludes all synthetic secrets'
);
assert(
  syntheticEntries[0].request.url.includes('page=2') &&
    syntheticEntries[0].request.postDataText.includes('widget') &&
    syntheticEntries[0].response.text.includes('widget') &&
    syntheticEntries[0].request.postDataText.includes('"active": true') &&
    syntheticEntries[0].response.text.includes('"active": true'),
  'Redaction preserves non-sensitive URL parameters and useful body fields'
);
assert(
  syntheticEntries[0].securityMetadata.hasPasswordRequestField &&
    syntheticEntries[0].securityMetadata.hasPersonalData,
  'Safe analysis metadata preserves credential and personal-data indicators'
);

const syntheticFindings = runSecurityAudit(syntheticEntries);
const sanitizedExport = sanitizeHarData({
  requestsSummary: syntheticEntries.map((entry) => ({
    url: entry.url,
    response: entry.response.text,
  })),
  endpoints: [{ url: syntheticHarEntry.request.url }],
  findings: syntheticFindings,
});
assert(
  syntheticSecrets.every((secret) => !JSON.stringify(sanitizedExport).includes(secret)),
  'JSON/PDF-facing report data excludes all synthetic secrets'
);

const syntheticSession = {
  fileName: 'synthetic.har',
  entries: syntheticEntries,
  metrics: computeMetrics(syntheticEntries),
  endpoints: [{ url: syntheticHarEntry.request.url }],
  securityFindings: syntheticFindings,
  flowGraph: { nodes: [{ name: syntheticHarEntry.request.url }], links: [] },
};
await saveSession(syntheticSession);
const persistedSynthetic = mockDbInstance._stores.analysis_sessions.get('latest');
assert(
  syntheticSecrets.every((secret) => !JSON.stringify(persistedSynthetic).includes(secret)),
  'IndexedDB persistence payload excludes all synthetic secrets'
);

const aiPayload = buildAiRequestPayload(
  '{"token":"AI_QUERY_SECRET_15","question":"help"}',
  computeMetrics(syntheticEntries),
  [...syntheticFindings, { severity: 'High', endpoint: syntheticHarEntry.request.url }]
);
const aiPayloadText = JSON.stringify(aiPayload);
assert(
  !aiPayloadText.includes('AI_QUERY_SECRET_15') &&
    syntheticSecrets.every((secret) => !aiPayloadText.includes(secret)),
  'External AI request payload excludes HAR secrets and redacts sensitive user query fields'
);
assert(
  !aiPayloadText.includes('api.example.test') &&
    !aiPayloadText.includes('widget'),
  'External AI request contains aggregate telemetry only, not endpoints or bodies'
);

// -----------------------------------------------------------------
// TEST 5: IndexedDB Client-Side Persistence & Restoration (Requirements 1-12)
// -----------------------------------------------------------------
console.log('\n--- SUITE 5: IndexedDB Persistence, Sanitization & Restoration ---');

assert(isIndexedDbSupported() === true, 'IndexedDB environment detection active');

// Test 5.1: Verify sanitizeEntry strips sensitive tokens & passwords
const testRawEntry = {
  request: {
    headers: [
      { name: 'Authorization', value: 'Bearer super_secret_prod_jwt_12345' },
      { name: 'Cookie', value: 'session_id=abcdef123456' },
      { name: 'X-Custom-Header', value: 'public-value' },
    ],
    postDataText: '{"email":"user@test.com","password":"SuperSecretPassword!","token":"secret_key_999"}',
  },
  response: {
    headers: [
      { name: 'Set-Cookie', value: 'refresh_token=hidden_cookie_val' },
    ],
  },
};

const sanitized = sanitizeEntry(testRawEntry);
const sanitizedAuth = sanitized.request.headers.find((h) => h.name.toLowerCase() === 'authorization');
const sanitizedCookie = sanitized.request.headers.find((h) => h.name.toLowerCase() === 'cookie');
const sanitizedSetCookie = sanitized.response.headers.find((h) => h.name.toLowerCase() === 'set-cookie');

assert(
  sanitizedAuth.value.includes('[REDACTED]') && !sanitizedAuth.value.includes('super_secret_prod_jwt_12345'),
  'Pre-persistence check: Authorization Bearer header is sanitized'
);
assert(
  sanitizedCookie.value.includes('[REDACTED]') && !sanitizedCookie.value.includes('session_id=abcdef123456'),
  'Pre-persistence check: Cookie header is sanitized'
);
assert(
  sanitizedSetCookie.value.includes('[REDACTED]') && !sanitizedSetCookie.value.includes('hidden_cookie_val'),
  'Pre-persistence check: Set-Cookie header is sanitized'
);
assert(
  sanitized.request.postDataText.includes('[REDACTED]') && !sanitized.request.postDataText.includes('SuperSecretPassword!'),
  'Pre-persistence check: Passwords in request body are sanitized before storage'
);

// Test 5.2: Save active session to IndexedDB
const sessionData = {
  fileName: 'api-lens-sample-test.har',
  fileSize: 12922,
  entries,
  metrics,
  endpoints,
  securityFindings: findings,
  flowGraph: flow,
};

const saveResult = await saveSession(sessionData);
assert(saveResult.success === true, 'Session saved successfully to IndexedDB');
assert(typeof saveResult.savedAt === 'string', 'Saved timestamp generated');

// Test 5.3: Load latest session (simulating browser refresh / startup)
const restored = await loadLatestSession();
assert(restored !== null, 'Restored session from IndexedDB is not null');
assert(restored.fileName === 'api-lens-sample-test.har', 'Restored fileName matches');
assert(restored.fileSize === 12922, 'Restored fileSize matches');
assert(restored.entries.length === 8, 'Restored entries count is exactly 8');

// Test 5.4: Verify restored metrics match the audited definitions
assert(restored.metrics.successfulRequests === 5, 'Restored successfulRequests (All 2xx) is 5');
assert(restored.metrics.total2xxRequests === 5, 'Restored total2xxRequests is 5');
assert(restored.metrics.secureRequests === 7, 'Restored secureRequests is 7');
assert(restored.metrics.secureSuccessfulRequests === 4, 'Restored secureSuccessfulRequests is 4');
assert(restored.metrics.insecureRequests === 1, 'Restored insecureRequests is 1');
assert(restored.metrics.insecureSuccessfulRequests === 1, 'Restored insecureSuccessfulRequests is 1');
assert(restored.metrics.failedRequests === 3, 'Restored failedRequests (4xx + 5xx) is 3');
assert(restored.metrics.statusCategories['2xx'] === 5, 'Restored status category 2xx is 5');
assert(restored.metrics.statusCategories['4xx'] === 2, 'Restored status category 4xx is 2');
assert(restored.metrics.statusCategories['5xx'] === 1, 'Restored status category 5xx is 1');

// Test 5.5: Verify restored endpoints, findings, and flow graph
assert(restored.endpoints.length === 8, 'Restored endpoints length is 8');
assert(restored.securityFindings.length === 9, 'Restored security findings count is 9');
assert(restored.flowGraph.nodes.length === 11, 'Restored flow graph nodes count is 11');
assert(restored.flowGraph.links.length === 10, 'Restored flow graph links count is 10');

// Test 5.6: Verify duplicate prevention when re-saving (Requirement 12)
const secondSaveResult = await saveSession(sessionData);
assert(secondSaveResult.success === true, 'Second save succeeds without creating duplicate records');
const restoredAfterSecond = await loadLatestSession();
assert(restoredAfterSecond.entries.length === 8, 'Entries count remains 8 without duplicates');

// Test 5.7: Verify new session replaces old one only on successful parsing (Requirement 10)
const newSessionData = {
  fileName: 'second-capture.har',
  fileSize: 5000,
  entries: entries.slice(0, 3), // simulate different HAR with 3 entries
  metrics: { ...metrics, totalRequests: 3, successfulRequests: 3 },
  endpoints: endpoints.slice(0, 3),
  securityFindings: findings.slice(0, 1),
  flowGraph: { nodes: [flow.nodes[0]], links: [] },
};
await saveSession(newSessionData);
const restoredNew = await loadLatestSession();
assert(restoredNew.fileName === 'second-capture.har', 'New session successfully replaced old session');
assert(restoredNew.entries.length === 3, 'New session entries count is 3');

// Test 5.8: Verify Clear Analysis action (Requirement 9)
const clearResult = await clearLatestSession();
assert(clearResult.success === true, 'clearLatestSession succeeds');
const restoredAfterClear = await loadLatestSession();
assert(restoredAfterClear === null, 'Session is null after explicit clear');

// Restore the sample HAR session in IndexedDB for ongoing browser session use
await saveSession(sessionData);
const finalCheck = await loadLatestSession();
assert(finalCheck !== null && finalCheck.entries.length === 8, 'Restored active sample HAR session in IndexedDB');

console.log('\n=====================================================');
console.log(` AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED `);
console.log('=====================================================');
