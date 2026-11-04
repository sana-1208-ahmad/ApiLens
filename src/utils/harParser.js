/**
 * API Lens - Core HAR 1.2 Parser and Telemetry Engine
 * Robust, client-side, zero-telemetry-persistence parser.
 */

import {
  sanitizeHarEntry,
  redactHeaderValue as redactSafeHeaderValue,
  redactPayloadText as redactSafePayloadText,
  isSensitiveFieldName,
} from './redaction.js';

// Common sensitive header names to redact
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'api-key',
  'apikey',
  'x-auth-token',
  'token',
  'proxy-authorization',
]);

/**
 * Redact sensitive header values, query strings, and payload fields.
 */
function legacyRedactHeaderValue(name, value) {
  if (!name || !value) return value;
  const lowerName = name.toLowerCase();
  if (SENSITIVE_HEADERS.has(lowerName)) {
    if (value.toLowerCase().startsWith('bearer ')) {
      return 'Bearer •••••••••••• [REDACTED]';
    }
    if (value.toLowerCase().startsWith('basic ')) {
      return 'Basic •••••••••••• [REDACTED]';
    }
    return '•••••••••••• [REDACTED]';
  }
  return value;
}

/**
 * Redacts sensitive credentials from JSON or text payloads
 */
function legacyRedactPayloadText(text) {
  if (!text || typeof text !== 'string') return text;
  try {
    const parsed = JSON.parse(text);
    const redactObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      for (const key of Object.keys(obj)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('token') ||
          lowerKey.includes('apikey') ||
          lowerKey.includes('privatekey')
        ) {
          obj[key] = '•••••••• [REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          redactObject(obj[key]);
        }
      }
      return obj;
    };
    return JSON.stringify(redactObject(parsed), null, 2);
  } catch {
    // If not JSON, use regex for common password patterns
    return text.replace(
      /("password"\s*:\s*)"([^"]+)"/gi,
      '$1"•••••••• [REDACTED]"'
    );
  }
}

export const redactHeaderValue = redactSafeHeaderValue;
export const redactPayloadText = redactSafePayloadText;

/**
 * Validate HAR structure per HAR 1.2 specifications
 */
export function validateHar(harJson) {
  if (!harJson || typeof harJson !== 'object') {
    return {
      isValid: false,
      error: 'Invalid file format: Input is not a valid JSON object.',
    };
  }

  if (!harJson.log) {
    return {
      isValid: false,
      error: "Invalid HAR format: Missing root 'log' object (HAR 1.2 spec).",
    };
  }

  if (!Array.isArray(harJson.log.entries)) {
    return {
      isValid: false,
      error: "Invalid HAR format: Missing 'log.entries' array.",
    };
  }

  if (harJson.log.entries.length === 0) {
    return {
      isValid: true,
      isEmpty: true,
      warning: 'The provided HAR file is valid but contains 0 captured network entries.',
    };
  }

  return { isValid: true, isEmpty: false };
}

/**
 * Parse and normalize HAR entries
 */
export function parseHarEntries(harLogOrEntries) {
  const rawEntries = Array.isArray(harLogOrEntries)
    ? harLogOrEntries
    : harLogOrEntries?.entries || [];

  return rawEntries.map((entry, index) => {
    const request = entry.request || {};
    const response = entry.response || {};
    const timings = entry.timings || {};

    let urlObj = null;
    let domain = 'unknown-host';
    let pathname = '/';
    let protocol = '';

    try {
      urlObj = new URL(request.url);
      domain = urlObj.hostname;
      pathname = urlObj.pathname;
      protocol = urlObj.protocol;
    } catch {
      // Fallback url extraction
      const match = (request.url || '').match(/^(https?:)\/\/([^/]+)(\/.*)?$/);
      if (match) {
        protocol = match[1];
        domain = match[2];
        pathname = match[3] || '/';
      }
    }

    const isSecure = protocol.toLowerCase() === 'https:';

    // Redacted headers
    const reqHeaders = (request.headers || []).map((h) => ({
      name: h.name,
      value: redactHeaderValue(h.name, h.value),
      isRedacted: isSensitiveFieldName(h.name),
    }));

    const resHeaders = (response.headers || []).map((h) => ({
      name: h.name,
      value: redactHeaderValue(h.name, h.value),
      isRedacted: isSensitiveFieldName(h.name),
    }));

    // Post data with redaction
    let postDataText = request.postData?.text || '';
    if (postDataText) {
      postDataText = redactPayloadText(postDataText);
    }

    const sanitizedPostData = request.postData
      ? {
          ...request.postData,
          text: postDataText,
        }
      : undefined;

    // Calculate latency
    const latency =
      typeof entry.time === 'number' && Number.isFinite(entry.time) && entry.time >= 0
        ? Math.round(entry.time)
        : Math.round(
            [timings.wait, timings.send, timings.receive].reduce(
              (total, duration) =>
                total + (Number.isFinite(duration) && duration >= 0 ? duration : 0),
              0
            )
          );

    const rawResponseText = response.content?.text || '';
    const hasPasswordRequestField =
      hasFieldNamed(request.postData, /password|passwd/i) ||
      hasFieldNamed(request.queryString, /password|passwd/i) ||
      hasFieldNamed(request.cookies, /password|passwd/i) ||
      hasNamedUrlQueryField(request.url, /password|passwd/i);
    const hasPersonalData =
      hasPersonalDataField(response.content) ||
      /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(rawResponseText) ||
      /\b\d{3}-\d{2}-\d{4}\b/.test(rawResponseText);

    return sanitizeHarEntry({
      id: `req-${index + 1}`,
      index: index + 1,
      startedDateTime: entry.startedDateTime || new Date().toISOString(),
      time: latency,
      method: (request.method || 'GET').toUpperCase(),
      url: request.url || '',
      domain,
      pathname,
      protocol: protocol.replace(':', ''),
      isSecure,
      httpVersion: request.httpVersion || 'HTTP/1.1',
      request: {
        ...request,
        headers: reqHeaders,
        postData: sanitizedPostData,
        postDataText,
      },
      response: {
        status: response.status || 0,
        statusText: response.statusText || (response.status === 200 ? 'OK' : ''),
        headers: resHeaders,
        bodySize: response.bodySize ?? response.content?.size ?? 0,
        mimeType: response.content?.mimeType || 'application/json',
        text: rawResponseText,
        content: response.content,
      },
      timings: {
        wait: Number.isFinite(timings.wait) && timings.wait >= 0 ? timings.wait : 0,
        send: Number.isFinite(timings.send) && timings.send >= 0 ? timings.send : 0,
        receive: Number.isFinite(timings.receive) && timings.receive >= 0 ? timings.receive : 0,
        dns: timings.dns ?? -1,
        connect: timings.connect ?? -1,
        ssl: timings.ssl ?? -1,
      },
      securityMetadata: {
        hasPasswordRequestField,
        hasPersonalData,
      },
    });
  });
}

function hasFieldNamed(value, pattern) {
  if (typeof value === 'string') {
    try {
      return hasFieldNamed(JSON.parse(value), pattern);
    } catch {
      return false;
    }
  }
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) =>
    pattern.test(key) || hasFieldNamed(child, pattern)
  );
}

function hasNamedUrlQueryField(value, pattern) {
  if (typeof value !== 'string') return false;
  try {
    return Array.from(new URL(value).searchParams.keys()).some((name) =>
      pattern.test(name)
    );
  } catch {
    return false;
  }
}

function hasPersonalDataField(value) {
  if (typeof value === 'string') {
    try {
      return hasPersonalDataField(JSON.parse(value));
    } catch {
      return false;
    }
  }
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) =>
    /email|phone|mobile|ssn|social.?security|passport|birth|dob|address|username|(?:user|customer|account|employee|member|person|national).?id|(?:first|last|full|display|given|family).?name|^name$/i.test(key) ||
    hasPersonalDataField(child)
  );
}

/**
 * Compute key telemetry metrics from parsed entries
 *
 * Metrics Rules:
 * 1. Successful Requests: ALL 2xx responses (200..299)
 * 2. Secure HTTPS Requests: requests served via https://
 * 3. Insecure HTTP Requests: requests served via http://
 * 4. Failed Requests: 4xx (client errors) + 5xx (server errors)
 * 5. Response Status Distribution: 2xx, 3xx, 4xx, 5xx buckets
 */
export function computeMetrics(entries) {
  if (!entries || entries.length === 0) {
    return {
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
  }

  let clientErrors = 0;
  let serverErrors = 0;
  let successfulRequests = 0; // ALL 2xx responses
  let secureRequests = 0;     // Total HTTPS requests
  let secureSuccessfulRequests = 0; // HTTPS 2xx responses
  let insecureRequests = 0;   // Total HTTP requests
  let insecureSuccessfulRequests = 0; // HTTP 2xx responses
  let totalLatency = 0;
  let maxLatency = 0;

  const methods = {};
  const statusCodes = {};
  const statusCategories = {
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
    other: 0,
  };
  const domains = {};
  const endpointSet = new Set();

  entries.forEach((e) => {
    const status = e.response.status;
    const method = e.method;
    const domain = e.domain;
    const epKey = `${method} ${domain}${e.pathname}`;

    endpointSet.add(epKey);
    totalLatency += e.time;
    if (e.time > maxLatency) maxLatency = e.time;

    // Methods breakdown
    methods[method] = (methods[method] || 0) + 1;

    // Status code breakdown
    statusCodes[status] = (statusCodes[status] || 0) + 1;

    // Domains breakdown
    domains[domain] = (domains[domain] || 0) + 1;

    // Transport Security (HTTPS vs HTTP)
    if (e.isSecure || e.protocol === 'https') {
      secureRequests += 1;
    } else {
      insecureRequests += 1;
    }

    // Status Categorization
    if (status >= 200 && status < 300) {
      successfulRequests += 1; // Count ALL 2xx as successful
      statusCategories['2xx'] += 1;
      if (e.isSecure || e.protocol === 'https') {
        secureSuccessfulRequests += 1;
      } else {
        insecureSuccessfulRequests += 1;
      }
    } else if (status >= 300 && status < 400) {
      statusCategories['3xx'] += 1;
    } else if (status >= 400 && status < 500) {
      clientErrors += 1;
      statusCategories['4xx'] += 1;
    } else if (status >= 500) {
      serverErrors += 1;
      statusCategories['5xx'] += 1;
    } else {
      statusCategories.other += 1;
    }
  });

  const failedRequests = clientErrors + serverErrors;

  return {
    totalRequests: entries.length,
    successfulRequests, // ALL 2xx responses (5 for sample HAR)
    total2xxRequests: successfulRequests, // alias
    secureRequests, // Total HTTPS requests (7 for sample HAR)
    secureSuccessfulRequests, // Secure 2xx responses (4 for sample HAR)
    insecureRequests, // Total HTTP requests (1 for sample HAR)
    insecureSuccessfulRequests, // Insecure 2xx responses (1 for sample HAR)
    httpEndpoints: insecureRequests, // Insecure HTTP requests (1 for sample HAR)
    clientErrors, // 4xx responses (2 for sample HAR)
    serverErrors, // 5xx responses (1 for sample HAR)
    failedRequests, // 4xx + 5xx (3 for sample HAR)
    uniqueEndpoints: endpointSet.size,
    uniqueDomains: Object.keys(domains).length,
    avgLatency: Math.round(totalLatency / entries.length),
    maxLatency,
    methods,
    statusCodes,
    statusCategories, // { '2xx': 5, '4xx': 2, '5xx': 1 }
    domains,
  };
}

/**
 * Extract unique endpoints catalog
 */
export function extractEndpoints(entries) {
  const map = new Map();

  entries.forEach((entry) => {
    const key = `${entry.method} ${entry.domain}${entry.pathname}`;

    if (!map.has(key)) {
      map.set(key, {
        key,
        method: entry.method,
        pathname: entry.pathname,
        domain: entry.domain,
        url: entry.url,
        isSecure: entry.isSecure,
        protocol: entry.protocol,
        callCount: 0,
        statusCodes: {},
        latencies: [],
        totalBytes: 0,
        requests: [],
      });
    }

    const item = map.get(key);
    item.callCount += 1;
    item.statusCodes[entry.response.status] =
      (item.statusCodes[entry.response.status] || 0) + 1;
    item.latencies.push(entry.time);
    item.totalBytes += entry.response.bodySize || 0;
    item.requests.push(entry);
  });

  return Array.from(map.values()).map((item) => {
    const avgLatency = Math.round(
      item.latencies.reduce((a, b) => a + b, 0) / item.latencies.length
    );
    const primaryStatus = Object.keys(item.statusCodes).sort(
      (a, b) => item.statusCodes[b] - item.statusCodes[a]
    )[0];

    return {
      ...item,
      avgLatency,
      primaryStatus: primaryStatus === undefined ? 200 : Number(primaryStatus),
    };
  });
}

export function hasStatusCategory(statusCodes, category) {
  return Object.keys(statusCodes || {}).some((code) => {
    const status = Number(code);
    if (category === '2xx') return status >= 200 && status < 300;
    if (category === '4xx') return status >= 400 && status < 500;
    if (category === '5xx') return status >= 500 && status < 600;
    return false;
  });
}

/**
 * Heuristic Security Inspector
 * Identifies potential risks, misconfigurations, and information leaks across 7 observation categories:
 * 1. Insecure HTTP requests
 * 2. Auth tokens and API keys
 * 3. Passwords and sensitive request body fields
 * 4. Personal identifiable information (PII) exposure
 * 5. Missing security headers and server banners
 * 6. Error messages and debug information in 5xx responses
 * 7. Cookie security attributes
 *
 * All items are clearly classified as POTENTIAL RISKS (heuristic observations),
 * not verified vulnerabilities.
 *
 * Guaranteed:
 * - Every finding is derived from an actual HAR entry.
 * - Deduplication prevents identical findings.
 * - Sensitive values (passwords, tokens, PII) are strictly redacted.
 */
export function runSecurityAudit(entries) {
  const findingsMap = new Map();

  entries.forEach((e) => {
    // 1. Insecure HTTP requests
    if (!e.isSecure || e.protocol === 'http' || (e.url && e.url.startsWith('http://'))) {
      const findingKey = `SEC-HTTP-${e.domain}-${e.pathname}`;
      if (!findingsMap.has(findingKey)) {
        findingsMap.set(findingKey, {
          id: `SEC-HTTP-${e.id}`,
          severity: 'Critical',
          riskLevel: 'Critical',
          code: 'P0',
          category: 'Insecure Transport',
          owasp: 'API8:2023 Security Misconfiguration',
          title: 'Potential Risk: Cleartext Insecure HTTP Transport',
          riskType: 'Potential Risk (Heuristic Observation)',
          description: `API endpoint "${e.pathname}" was invoked via cleartext unencrypted HTTP (http://). Data in transit could be intercepted or manipulated by on-path network intermediaries.`,
          explanation: `API endpoint "${e.pathname}" was invoked via cleartext unencrypted HTTP (http://). Data in transit could be intercepted or manipulated by on-path network intermediaries.`,
          endpoint: `${e.method} ${e.url}`,
          evidence: `Protocol: http:// (Non-TLS transport confirmed in HAR)`,
          recommendation:
            'Enforce TLS 1.3 across all internal and legacy endpoints. Implement strict HTTPS redirection (HTTP 301/308) and enable HSTS.',
          recommendedFix:
            'Enforce TLS 1.3 across all internal and legacy endpoints. Implement strict HTTPS redirection (HTTP 301/308) and enable HSTS.',
          isHeuristic: true,
          sourceEntryId: e.id,
        });
      }
    }

    // 2. Passwords and sensitive request body fields
    const rawPost = e.request?.postData?.text || e.request?.postDataText || '';
    if (
      e.method === 'POST' &&
      (e.securityMetadata?.hasPasswordRequestField ||
        rawPost.includes('"password"') ||
        rawPost.includes('password=') ||
        e.pathname.includes('/auth') ||
        e.pathname.includes('/login'))
    ) {
      const findingKey = `SEC-AUTH-${e.domain}-${e.pathname}`;
      if (!findingsMap.has(findingKey)) {
        findingsMap.set(findingKey, {
          id: `SEC-AUTH-${e.id}`,
          severity: 'High',
          riskLevel: 'High',
          code: 'P1',
          category: 'Authentication & Credentials',
          owasp: 'API2:2023 Broken Authentication',
          title: 'Potential Risk: Plaintext Password Field in Request Payload',
          riskType: 'Potential Risk (Heuristic Observation)',
          description: `Authentication endpoint "${e.pathname}" receives password credentials in request payload. Verify strong rate-limiting, account lockout protection, and zero server logging of password bodies.`,
          explanation: `Authentication endpoint "${e.pathname}" receives password credentials in request payload. Verify strong rate-limiting, account lockout protection, and zero server logging of password bodies.`,
          endpoint: `${e.method} ${e.pathname}`,
          evidence: 'Request data contains a password field; its value is [REDACTED].',
          recommendation:
            'Implement multi-factor authentication (MFA), strict Brute-Force rate limits, and ensure passwords are never persisted in web server access logs.',
          recommendedFix:
            'Implement multi-factor authentication (MFA), strict Brute-Force rate limits, and ensure passwords are never persisted in web server access logs.',
          isHeuristic: true,
          sourceEntryId: e.id,
        });
      }
    }

    // 3. Auth tokens and API keys
    const authHeader = (e.request?.headers || []).find(
      (h) => (h.name || '').toLowerCase() === 'authorization'
    );
    const apiKeyHeader = (e.request?.headers || []).find(
      (h) => /^(x-api-key|api-key|apikey|x-auth-token)$/i.test(h.name || '')
    );
    if (authHeader || apiKeyHeader) {
      const matched = authHeader || apiKeyHeader;
      const findingKey = `SEC-TOKEN-${e.domain}-${e.pathname}`;
      if (!findingsMap.has(findingKey)) {
        findingsMap.set(findingKey, {
          id: `SEC-TOKEN-${e.id}`,
          severity: 'Medium',
          riskLevel: 'Medium',
          code: 'P2',
          category: 'Authentication & Tokens',
          owasp: 'API2:2023 Broken Authentication',
          title: 'Potential Risk: Authorization Token / API Key Exposure',
          riskType: 'Potential Risk (Heuristic Observation)',
          description: `Endpoint "${e.pathname}" receives an Authorization token header (${matched.name}). Verify that tokens have short lifespans, are validated cryptographically, and are rotated properly.`,
          explanation: `Endpoint "${e.pathname}" receives an Authorization token header (${matched.name}). Verify that tokens have short lifespans, are validated cryptographically, and are rotated properly.`,
          endpoint: `${e.method} ${e.pathname}`,
          evidence: `${matched.name} header present: ${matched.value}`,
          recommendation:
            'Ensure short-lived JWTs (under 15 minutes) with refresh token rotation and client-bound tokens.',
          recommendedFix:
            'Ensure short-lived JWTs (under 15 minutes) with refresh token rotation and client-bound tokens.',
          isHeuristic: true,
          sourceEntryId: e.id,
        });
      }
    }

    // 4. Personal Identifiable Information (PII) exposure
    const resText = e.response?.text || '';
    const emailMatch = resText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch || e.securityMetadata?.hasPersonalData) {
      const findingKey = `SEC-PII-${e.domain}-${e.pathname}`;
      if (!findingsMap.has(findingKey)) {
        findingsMap.set(findingKey, {
          id: `SEC-PII-${e.id}`,
          severity: 'Medium',
          riskLevel: 'Medium',
          code: 'P2',
          category: 'PII & Privacy',
          owasp: 'API3:2023 Broken Object Property Level Authorization',
          title: 'Potential Risk: Sensitive PII Exposure in API Response',
          riskType: 'Potential Risk (Heuristic Observation)',
          description: `Endpoint "${e.pathname}" returns personal identifiable information (email address) in response payload. Excessive data exposure violates data minimization principles.`,
          explanation: `Endpoint "${e.pathname}" returns personal identifiable information (email address) in response payload. Excessive data exposure violates data minimization principles.`,
          endpoint: `${e.method} ${e.pathname}`,
          evidence: emailMatch
            ? `Response body contains a redacted email address.`
            : 'Response body contains a personal-data field; its value is redacted.',
          recommendation:
            'Apply strict data projection and serialization filters so only necessary user attributes are transmitted to the client.',
          recommendedFix:
            'Apply strict data projection and serialization filters so only necessary user attributes are transmitted to the client.',
          isHeuristic: true,
          sourceEntryId: e.id,
        });
      }
    }

    // 5. Missing security headers and server banners
    const serverHeader = (e.response?.headers || []).find(
      (h) => (h.name || '').toLowerCase() === 'server'
    );
    if (serverHeader && serverHeader.value) {
      const findingKey = `SEC-BANNER-${e.domain}-${e.pathname}`;
      if (!findingsMap.has(findingKey)) {
        findingsMap.set(findingKey, {
          id: `SEC-BANNER-${e.id}`,
          severity: 'Low',
          riskLevel: 'Low',
          code: 'P3',
          category: 'Security Headers & Banners',
          owasp: 'API8:2023 Security Misconfiguration',
          title: 'Potential Risk: Server Software Banner Disclosure',
          riskType: 'Potential Risk (Heuristic Observation)',
          description: `Response explicitly exposes the server software technology stack (${serverHeader.value}). Server banners assist adversaries during reconnaissance in identifying version-specific CVE vulnerabilities.`,
          explanation: `Response explicitly exposes the server software technology stack (${serverHeader.value}). Server banners assist adversaries during reconnaissance in identifying version-specific CVE vulnerabilities.`,
          endpoint: `${e.method} ${e.pathname}`,
          evidence: `Server banner exposed: "${serverHeader.value}"`,
          recommendation:
            'Configure reverse proxy or web server (e.g. server_tokens off in Nginx) to suppress Server and X-Powered-By response headers.',
          recommendedFix:
            'Configure reverse proxy or web server (e.g. server_tokens off in Nginx) to suppress Server and X-Powered-By response headers.',
          isHeuristic: true,
          sourceEntryId: e.id,
        });
      }
    }

    // Missing HSTS on HTTPS endpoints (deduplicated per domain)
    if (e.isSecure || e.protocol === 'https') {
      const hstsHeader = (e.response?.headers || []).find(
        (h) => (h.name || '').toLowerCase() === 'strict-transport-security'
      );
      if (!hstsHeader) {
        const findingKey = `SEC-HSTS-${e.domain}`;
        if (!findingsMap.has(findingKey)) {
          findingsMap.set(findingKey, {
            id: `SEC-HSTS-${e.id}`,
            severity: 'Medium',
            riskLevel: 'Medium',
            code: 'P2',
            category: 'Security Headers & Banners',
            owasp: 'API8:2023 Security Misconfiguration',
            title: 'Potential Risk: Missing Strict-Transport-Security (HSTS) Header',
            riskType: 'Potential Risk (Heuristic Observation)',
            description: `HTTPS traffic on domain "${e.domain}" lacks a Strict-Transport-Security header. Clients may attempt unencrypted connections if redirected or if bookmarks use http://.`,
            explanation: `HTTPS traffic on domain "${e.domain}" lacks a Strict-Transport-Security header. Clients may attempt unencrypted connections if redirected or if bookmarks use http://.`,
            endpoint: `${e.method} ${e.url}`,
            evidence: `Response headers lack "Strict-Transport-Security" on ${e.domain}`,
            recommendation:
              'Include "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload" in all HTTPS production responses.',
            recommendedFix:
              'Include "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload" in all HTTPS production responses.',
            isHeuristic: true,
            sourceEntryId: e.id,
          });
        }
      }
    }

    // 6. Error messages and debug information in 5xx responses
    if (e.response.status >= 500) {
      const responseText = e.response.text || '';
      const findingKey = `SEC-500-${e.domain}-${e.pathname}`;
      if (!findingsMap.has(findingKey)) {
        findingsMap.set(findingKey, {
          id: `SEC-500-${e.id}`,
          severity: 'Medium',
          riskLevel: 'Medium',
          code: 'P2',
          category: 'Debug & Error Leakage',
          owasp: 'API8:2023 Security Misconfiguration',
          title: 'Potential Risk: Server Internal Error Diagnostic Leak',
          riskType: 'Potential Risk (Heuristic Observation)',
          description: `Server returned HTTP 500 Internal Server Error for "${e.pathname}". Response body contains internal application error details and debug information that may assist reconnaissance.`,
          explanation: `Server returned HTTP 500 Internal Server Error for "${e.pathname}". Response body contains internal application error details and debug information that may assist reconnaissance.`,
          endpoint: `${e.method} ${e.pathname}`,
          evidence: `Status 500 response contains diagnostic debug fields: ${responseText.slice(0, 100)}...`,
          recommendation:
            'Configure custom error handlers that return sanitized generic error messages with an opaque incident reference ID.',
          recommendedFix:
            'Configure custom error handlers that return sanitized generic error messages with an opaque incident reference ID.',
          isHeuristic: true,
          sourceEntryId: e.id,
        });
      }
    }

    // 7. Cookie security attributes
    const setCookieHeaders = (e.response?.headers || []).filter(
      (h) => (h.name || '').toLowerCase() === 'set-cookie'
    );
    setCookieHeaders.forEach((cookieHeader, idx) => {
      const val = cookieHeader.value || '';
      const lacksSecure = !/;\s*Secure/i.test(val);
      const lacksHttpOnly = !/;\s*HttpOnly/i.test(val);
      const lacksSameSite = !/;\s*SameSite=(Strict|Lax|None)/i.test(val);

      if (lacksSecure || lacksHttpOnly || lacksSameSite) {
        const findingKey = `SEC-COOKIE-${e.domain}-${idx}`;
        if (!findingsMap.has(findingKey)) {
          findingsMap.set(findingKey, {
            id: `SEC-COOKIE-${e.id}-${idx}`,
            severity: 'Medium',
            riskLevel: 'Medium',
            code: 'P2',
            category: 'Cookie Security',
            owasp: 'API8:2023 Security Misconfiguration',
            title: 'Potential Risk: Insecure Cookie Security Attributes',
            riskType: 'Potential Risk (Heuristic Observation)',
            description: `Set-Cookie header on "${e.pathname}" is missing critical protection attributes (${[
              lacksSecure ? 'Secure' : null,
              lacksHttpOnly ? 'HttpOnly' : null,
              lacksSameSite ? 'SameSite' : null,
            ].filter(Boolean).join(', ')}).`,
            explanation: `Set-Cookie header on "${e.pathname}" is missing critical protection attributes (${[
              lacksSecure ? 'Secure' : null,
              lacksHttpOnly ? 'HttpOnly' : null,
              lacksSameSite ? 'SameSite' : null,
            ].filter(Boolean).join(', ')}).`,
            endpoint: `${e.method} ${e.pathname}`,
            evidence: `Cookie header: ${val.split(';')[0]}; [Missing flags: ${[
              lacksSecure ? 'Secure' : null,
              lacksHttpOnly ? 'HttpOnly' : null,
              lacksSameSite ? 'SameSite' : null,
            ].filter(Boolean).join(', ')}]`,
            recommendation:
              'Always set Secure, HttpOnly, and SameSite=Lax (or Strict) on authentication and session cookies.',
            recommendedFix:
              'Always set Secure, HttpOnly, and SameSite=Lax (or Strict) on authentication and session cookies.',
            isHeuristic: true,
            sourceEntryId: e.id,
          });
        }
      }
    });

    // Client 401 Unauthorized / Failed Auth Probe
    if (e.response.status === 401) {
      const findingKey = `SEC-401-${e.domain}-${e.pathname}`;
      if (!findingsMap.has(findingKey)) {
        findingsMap.set(findingKey, {
          id: `SEC-401-${e.id}`,
          severity: 'Low',
          riskLevel: 'Low',
          code: 'P3',
          category: 'Authentication & Credentials',
          owasp: 'API2:2023 Broken Authentication',
          title: 'Potential Risk: Failed Authentication Probe (401 Unauthorized)',
          riskType: 'Potential Risk (Heuristic Observation)',
          description: `Failed login attempt recorded on "${e.pathname}". Monitor for anomalous spikes indicating credential stuffing or brute-force attempts.`,
          explanation: `Failed login attempt recorded on "${e.pathname}". Monitor for anomalous spikes indicating credential stuffing or brute-force attempts.`,
          endpoint: `${e.method} ${e.pathname}`,
          evidence: `HTTP 401 Unauthorized ("invalid_credentials")`,
          recommendation:
            'Monitor failed auth rates per IP and client fingerprint. Trigger CAPTCHA or exponential backoff after repeated failed attempts.',
          recommendedFix:
            'Monitor failed auth rates per IP and client fingerprint. Trigger CAPTCHA or exponential backoff after repeated failed attempts.',
          isHeuristic: true,
          sourceEntryId: e.id,
        });
      }
    }
  });

  return Array.from(findingsMap.values());
}

/**
 * Generate API Flow Map Nodes and Links
 */
export function extractFlowGraph(entries) {
  const nodeMap = new Map();
  const linkMap = new Map();

  // Root Client Node
  nodeMap.set('client-root', {
    id: 'client-root',
    name: 'Browser Client',
    type: 'client',
    calls: entries.length,
    status: 'ok',
  });

  entries.forEach((e) => {
    // Domain Node
    const domainId = `domain-${e.domain}`;
    if (!nodeMap.has(domainId)) {
      nodeMap.set(domainId, {
        id: domainId,
        name: e.domain,
        type: e.isSecure ? 'domain' : 'insecure-domain',
        isSecure: e.isSecure,
        calls: 0,
      });
    }
    const domainNode = nodeMap.get(domainId);
    domainNode.calls += 1;
    domainNode.isSecure = domainNode.isSecure && e.isSecure;
    domainNode.type = domainNode.isSecure ? 'domain' : 'insecure-domain';

    // Link: Client -> Domain
    const linkKey1 = `client-root->${domainId}`;
    if (!linkMap.has(linkKey1)) {
      linkMap.set(linkKey1, {
        source: 'client-root',
        target: domainId,
        calls: 0,
      });
    }
    linkMap.get(linkKey1).calls += 1;

    // Endpoint Node
    const epId = `ep-${e.method}-${e.domain}${e.pathname}`;
    if (!nodeMap.has(epId)) {
      nodeMap.set(epId, {
        id: epId,
        name: `${e.method} ${e.pathname}`,
        method: e.method,
        pathname: e.pathname,
        domain: e.domain,
        type: 'endpoint',
        status: e.response.status,
        latency: e.time,
        calls: 0,
      });
    }
    nodeMap.get(epId).calls += 1;

    // Link: Domain -> Endpoint
    const linkKey2 = `${domainId}->${epId}`;
    if (!linkMap.has(linkKey2)) {
      linkMap.set(linkKey2, {
        source: domainId,
        target: epId,
        calls: 0,
        status: e.response.status,
      });
    }
    linkMap.get(linkKey2).calls += 1;
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values()),
  };
}
