// zeroto1.academy — Structured Logger with strict secret redaction
// Ensures zero credentials, tokens, or PII leak into stdout/logs

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[-_]?key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
  /bearer/i,
  /credential/i,
  /credit[-_]?card/i,
  /phone/i,
  /ssn/i,
];

const SECRET_VALUE_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/g, // OpenAI style
  /anthropic-[a-zA-Z0-9_-]{20,}/g,
  /AIza[0-9A-Za-z-_]{35}/g, // Google API key
  /ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, // JWTs
  /\b(?:\d[ -]*?){13,16}\b/g, // Credit card numbers
  /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, // Emails (PII)
];

export function sanitizeLogData(input: unknown): unknown {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    let sanitized = input;
    for (const pattern of SECRET_VALUE_PATTERNS) {
      sanitized = sanitized.replace(pattern, '[REDACTED_SENSITIVE]');
    }
    return sanitized;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeLogData(item));
  }

  if (typeof input === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
      if (isSensitiveKey) {
        cleaned[key] = '[REDACTED_CREDENTIAL]';
      } else {
        cleaned[key] = sanitizeLogData(value);
      }
    }
    return cleaned;
  }

  return input;
}

export interface StructuredLogPayload {
  level: 'info' | 'warn' | 'error' | 'debug';
  event: string;
  taskType?: string;
  provider?: string;
  latencyMs?: number;
  costUsd?: number;
  cached?: boolean;
  metadata?: Record<string, unknown>;
  error?: string;
}

export function logAiEvent(payload: StructuredLogPayload): void {
  const sanitized = sanitizeLogData({
    timestamp: new Date().toISOString(),
    service: 'zeroto1-ai-middleware',
    ...payload,
  });

  const jsonStr = JSON.stringify(sanitized);

  if (payload.level === 'error') {
    console.error(jsonStr);
  } else if (payload.level === 'warn') {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}
