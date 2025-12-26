/**
 * Error Logger - Centralized error logging and reporting
 *
 * In production, this can be extended to send errors to services like:
 * - Sentry
 * - LogRocket
 * - Datadog
 * - Custom error tracking endpoint
 */

import { AppError, ErrorSeverity, isAppError } from "./types";
import { parseError } from "./parsers";

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

interface ErrorLogEntry {
  timestamp: string;
  error: ReturnType<AppError["toJSON"]>;
  context: LogContext;
  url: string;
  userAgent: string;
}

// In-memory error log for development (last 100 errors)
const errorLog: ErrorLogEntry[] = [];
const MAX_LOG_SIZE = 100;

/**
 * Log an error with context
 */
export function logError(
  error: unknown,
  context: LogContext = {}
): AppError {
  const appError = isAppError(error) ? error : parseError(error);

  const logEntry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    error: appError.toJSON(),
    context,
    url: typeof window !== "undefined" ? window.location.href : "",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
  };

  // Add to in-memory log
  errorLog.unshift(logEntry);
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog.pop();
  }

  // Console logging based on severity
  const logMethod = getLogMethod(appError.severity);
  logMethod(
    `[${appError.code}] ${appError.message}`,
    {
      userMessage: appError.userMessage,
      context: { ...appError.context, ...context },
      originalError: appError.originalError,
    }
  );

  // In production, send to error tracking service
  if (import.meta.env.PROD) {
    sendToErrorService(logEntry);
  }

  return appError;
}

/**
 * Get the appropriate console method based on severity
 */
function getLogMethod(severity: ErrorSeverity): typeof console.error {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.HIGH:
      return console.error;
    case ErrorSeverity.MEDIUM:
      return console.warn;
    case ErrorSeverity.LOW:
    default:
      return console.info;
  }
}

/**
 * Send error to external error tracking service
 * This is a placeholder for production error tracking
 */
async function sendToErrorService(entry: ErrorLogEntry): Promise<void> {
  // Placeholder for production error tracking
  // Example implementations:

  // Sentry:
  // Sentry.captureException(entry.error.originalError, {
  //   extra: entry.context,
  //   tags: { code: entry.error.code, severity: entry.error.severity },
  // });

  // Custom endpoint:
  // try {
  //   await fetch('/api/errors', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(entry),
  //   });
  // } catch {
  //   // Silently fail - don't create error loops
  // }

  // For now, just log in production as well
  console.error("[Error Tracking]", entry);
}

/**
 * Get recent errors (for debugging/admin purposes)
 */
export function getRecentErrors(): readonly ErrorLogEntry[] {
  return errorLog;
}

/**
 * Clear error log
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}

/**
 * Create a scoped logger for a specific component/module
 */
export function createScopedLogger(component: string) {
  return {
    error: (error: unknown, context: Omit<LogContext, "component"> = {}) =>
      logError(error, { ...context, component }),

    warn: (message: string, context: Omit<LogContext, "component"> = {}) =>
      console.warn(`[${component}]`, message, context),

    info: (message: string, context: Omit<LogContext, "component"> = {}) =>
      console.info(`[${component}]`, message, context),

    debug: (message: string, context: Omit<LogContext, "component"> = {}) => {
      if (import.meta.env.DEV) {
        console.debug(`[${component}]`, message, context);
      }
    },
  };
}
