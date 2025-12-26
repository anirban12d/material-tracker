/**
 * Error Handling Module
 *
 * Production-ready error handling utilities for the application.
 *
 * Usage:
 *
 * ```typescript
 * import {
 *   AppError,
 *   ErrorCode,
 *   handleError,
 *   handleMutationError,
 *   parseError,
 *   logError,
 * } from "@/lib/errors";
 *
 * // In mutation error handlers
 * onError: (error) => {
 *   handleMutationError(error, "create", "material request");
 * }
 *
 * // In query error handlers
 * if (error) {
 *   handleQueryError(error, "material requests");
 * }
 *
 * // Manual error handling
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const appError = handleError(error, { showToast: true });
 *   if (appError.code === ErrorCode.AUTH_SESSION_EXPIRED) {
 *     redirectToLogin();
 *   }
 * }
 * ```
 */

// Types and classes
export {
  AppError,
  ErrorCode,
  ErrorSeverity,
  isAppError,
  isNetworkError,
  isAuthError,
  type AppErrorOptions,
} from "./types";

// Error parsers
export {
  parseError,
  parseAuthError,
  parsePostgrestError,
  parseNetworkError,
} from "./parsers";

// Error handlers
export {
  handleError,
  handleMutationError,
  handleQueryError,
  handleAuthError,
  withErrorHandling,
  createMutationErrorHandler,
  createQueryErrorHandler,
  getErrorMessage,
} from "./handlers";

// Error logging
export {
  logError,
  getRecentErrors,
  clearErrorLog,
  createScopedLogger,
} from "./logger";
