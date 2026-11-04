const REDACTED_VALUE = '[REDACTED]';

const SENSITIVE_FIELD_PATTERN =
  /authorization|proxy.?authorization|cookie|token|secret|signature|jwt|bearer|oauth|password|passwd|(?:access|client|private|api).?key|credential|session|email|e.?mail|phone|mobile|ssn|social.?security|passport|birth|dob|address|username|(?:user|customer|account|employee|member|person|national).?id|(?:first|last|full|display|given|family).?name|^(?:name|key)$/i;

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g;
const PHONE_PATTERN = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;

export function isSensitiveFieldName(name) {
  return SENSITIVE_FIELD_PATTERN.test(String(name || '').replace(/[^a-z0-9]/gi, ''));
}

function redactString(value) {
  return String(value)
    .replace(/https?:\/\/[^\s"'<>]+/gi, (url) => redactUrl(url))
    .replace(EMAIL_PATTERN, REDACTED_VALUE)
    .replace(SSN_PATTERN, REDACTED_VALUE)
    .replace(PHONE_PATTERN, REDACTED_VALUE)
    .replace(
      /(["']?)([a-z0-9_.-]+)\1(\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^&,\s;}]+)/gi,
      (match, quote, name, separator) =>
        isSensitiveFieldName(name) ? `${quote}${name}${quote}${separator}"${REDACTED_VALUE}"` : match
    )
    .replace(
      /\b(authorization|proxy-authorization|cookie|set-cookie|x-[\w-]*(?:api[-_]?key|token|secret))\s*:\s*[^\r\n,;]+/gi,
      (match, name) => `${name}: ${REDACTED_VALUE}`
    );
}

export function redactUrl(value) {
  if (typeof value !== 'string' || value.length === 0) return value;

  try {
    const url = new URL(value);
    if (url.username) url.username = REDACTED_VALUE;
    if (url.password) url.password = REDACTED_VALUE;
    for (const name of new Set(Array.from(url.searchParams.keys()))) {
      if (isSensitiveFieldName(name)) {
        url.searchParams.set(name, REDACTED_VALUE);
      }
    }

    if (url.hash) {
      const fragment = url.hash.slice(1);
      const params = new URLSearchParams(fragment);
      for (const name of new Set(Array.from(params.keys()))) {
        if (isSensitiveFieldName(name)) params.set(name, REDACTED_VALUE);
      }
      if (params.size > 0) url.hash = params.toString();
    }

    return redactStringWithoutUrl(url.toString());
  } catch {
    const [withoutFragment, fragment = ''] = value.split('#', 2);
    const queryIndex = withoutFragment.indexOf('?');
    let safeUrl = withoutFragment;
    if (queryIndex !== -1) {
      const base = withoutFragment.slice(0, queryIndex);
      const params = new URLSearchParams(withoutFragment.slice(queryIndex + 1));
      for (const name of new Set(Array.from(params.keys()))) {
        if (isSensitiveFieldName(name)) params.set(name, REDACTED_VALUE);
      }
      safeUrl = `${base}?${params.toString()}`;
    }
    if (fragment) {
      const params = new URLSearchParams(fragment);
      for (const name of new Set(Array.from(params.keys()))) {
        if (isSensitiveFieldName(name)) params.set(name, REDACTED_VALUE);
      }
      safeUrl += `#${params.toString()}`;
    }
    return redactStringWithoutUrl(safeUrl);
  }
}

function redactStringWithoutUrl(value) {
  return String(value)
    .replace(EMAIL_PATTERN, REDACTED_VALUE)
    .replace(SSN_PATTERN, REDACTED_VALUE)
    .replace(PHONE_PATTERN, REDACTED_VALUE);
}

export function redactHeaderValue(name, value) {
  if (value === undefined || value === null || value === '') return value;
  return isSensitiveFieldName(name) ? REDACTED_VALUE : redactString(String(value));
}

function redactObject(value) {
  if (Array.isArray(value)) return value.map((item) => redactObject(item));
  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? redactString(value) : value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveFieldName(key) ? REDACTED_VALUE : redactObject(item),
    ])
  );
}

export function redactPayloadText(text) {
  if (typeof text !== 'string' || text.length === 0) return text;

  try {
    return JSON.stringify(redactObject(JSON.parse(text)), null, 2);
  } catch {
    const formLike = text.includes('=') && /(?:^|&)[^=&]+=[^&]*/.test(text);
    if (formLike) {
      const params = new URLSearchParams(text);
      for (const name of new Set(Array.from(params.keys()))) {
        if (isSensitiveFieldName(name)) params.set(name, REDACTED_VALUE);
      }
      return redactString(params.toString());
    }
    return redactString(text);
  }
}

function sanitizeNamedValues(items, kind) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const sanitized = sanitizeHarData(item);
    if ('name' in item) sanitized.name = item.name;
    if (kind === 'headers') {
      sanitized.value = redactHeaderValue(item.name, item.value);
    } else if (kind === 'cookies') {
      sanitized.value = REDACTED_VALUE;
    } else if (kind === 'params' && isSensitiveFieldName(item.name)) {
      sanitized.value = REDACTED_VALUE;
    } else if (kind === 'params' && typeof item.value === 'string') {
      sanitized.value = redactString(item.value);
    }
    return sanitized;
  });
}

export function sanitizeHarData(value, fieldName = '') {
  if (typeof value === 'string') {
    if (isSensitiveFieldName(fieldName)) return REDACTED_VALUE;
    if (/^(?:url|href)$/i.test(fieldName)) return redactUrl(value);
    if (/^(?:text|postDataText)$/i.test(fieldName)) return redactPayloadText(value);
    return redactString(value);
  }
  if (Array.isArray(value)) {
    if (fieldName === 'headers') return sanitizeNamedValues(value, 'headers');
    if (fieldName === 'cookies') return sanitizeNamedValues(value, 'cookies');
    if (fieldName === 'queryString' || fieldName === 'params') {
      return sanitizeNamedValues(value, 'params');
    }
    return value.map((item) => sanitizeHarData(item));
  }
  if (!value || typeof value !== 'object') return value;

  if (fieldName === 'securityMetadata') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, Boolean(item)])
    );
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveFieldName(key) ? REDACTED_VALUE : sanitizeHarData(item, key),
    ])
  );
}

export function sanitizeHarEntry(entry) {
  if (!entry || typeof entry !== 'object') return entry;

  const safe = sanitizeHarData(entry);
  const request = entry.request || {};
  const response = entry.response || {};
  const postData = request.postData || {};

  safe.url = redactUrl(entry.url || request.url || '');
  safe.request = {
    ...safe.request,
    url: redactUrl(request.url || entry.url || ''),
    headers: sanitizeNamedValues(request.headers, 'headers'),
    cookies: sanitizeNamedValues(request.cookies, 'cookies'),
    queryString: sanitizeNamedValues(request.queryString, 'params'),
    postData: request.postData
      ? {
          ...sanitizeHarData(postData),
          params: sanitizeNamedValues(postData.params, 'params'),
          text: redactPayloadText(postData.text || ''),
        }
      : undefined,
    postDataText: redactPayloadText(request.postDataText || postData.text || ''),
  };
  safe.response = {
    ...safe.response,
    headers: sanitizeNamedValues(response.headers, 'headers'),
    cookies: sanitizeNamedValues(response.cookies, 'cookies'),
    text: redactPayloadText(response.text || response.content?.text || ''),
    content: response.content
      ? {
          ...sanitizeHarData(response.content),
          text: redactPayloadText(response.content.text || ''),
        }
      : undefined,
  };

  return safe;
}

export function buildAiRequestPayload(question, metrics, findings) {
  const findingsBySeverity = (findings || []).reduce((counts, finding) => {
    const severity = finding.severity || 'Unknown';
    counts[severity] = (counts[severity] || 0) + 1;
    return counts;
  }, {});

  const context = {
    totalRequests: metrics.totalRequests,
    uniqueEndpoints: metrics.uniqueEndpoints,
    uniqueDomains: metrics.uniqueDomains,
    statusCategories: metrics.statusCategories,
    averageLatencyMs: metrics.avgLatency,
    maximumLatencyMs: metrics.maxLatency,
    findingsBySeverity,
  };

  return {
    contents: [
      {
        parts: [
          {
            text: `You are API Lens AI assistant. User question: "${redactPayloadText(question)}".\n\nRedacted aggregate telemetry: ${JSON.stringify(context)}.\nProvide a concise engineering suggestion. Do not treat observations as verified findings.`,
          },
        ],
      },
    ],
  };
}
