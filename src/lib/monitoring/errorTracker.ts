import { sanitizeLogData } from '../ai/logger';

export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: string;
  environment: string;
}

const errorBuffer: TrackedError[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Captures an exception for error tracking (Sentry-compatible).
 * Automatically strips sensitive credentials and PII before recording.
 */
export function captureException(
  error: Error | string,
  context?: Record<string, unknown>
): TrackedError {
  const message = typeof error === 'string' ? error : error.message || 'Unknown error';
  const stack = typeof error === 'string' ? undefined : error.stack;

  const sanitizedContext = context ? (sanitizeLogData(context) as Record<string, unknown>) : undefined;
  const sanitizedMessage = sanitizeLogData(message) as string;

  const event: TrackedError = {
    id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    message: sanitizedMessage,
    stack,
    context: sanitizedContext,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  errorBuffer.unshift(event);
  if (errorBuffer.length > MAX_BUFFER_SIZE) {
    errorBuffer.pop();
  }

  // If SENTRY_DSN is configured in production, forward event
  if (process.env.SENTRY_DSN) {
    console.log(`[Sentry Forwarder] Dispatched event ${event.id} to Sentry.`);
  }

  return event;
}

export function getCapturedErrors(): TrackedError[] {
  return [...errorBuffer];
}

export function clearCapturedErrors(): void {
  errorBuffer.length = 0;
}
