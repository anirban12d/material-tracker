/**
 * Error Handlers - Common error handling utilities
 */

import { toast } from "sonner";
import { AppError, ErrorCode, isAppError, isAuthError } from "./types";
import { parseError } from "./parsers";
import { logError } from "./logger";

interface HandleErrorOptions {
  /** Show toast notification to user */
  showToast?: boolean;
  /** Custom toast title */
  toastTitle?: string;
  /** Log the error */
  log?: boolean;
  /** Additional context for logging */
  context?: Record<string, unknown>;
  /** Callback when error is an auth error requiring re-login */
  onAuthError?: () => void;
  /** Callback for retry action */
  onRetry?: () => void;
}

/**
 * Main error handler - processes errors and shows appropriate feedback
 */
export function handleError(
  error: unknown,
  options: HandleErrorOptions = {}
): AppError {
  const {
    showToast = true,
    toastTitle,
    log = true,
    context,
    onAuthError,
    onRetry,
  } = options;

  // Parse to AppError
  const appError = isAppError(error) ? error : parseError(error, { context });

  // Log the error
  if (log) {
    logError(appError, context);
  }

  // Handle auth errors that require re-login
  if (isAuthError(appError) && appError.code === ErrorCode.AUTH_SESSION_EXPIRED) {
    onAuthError?.();
    if (showToast) {
      toast.error(toastTitle || "Session Expired", {
        description: appError.userMessage,
        action: {
          label: "Log In",
          onClick: () => {
            window.location.href = "/login";
          },
        },
      });
    }
    return appError;
  }

  // Show toast notification
  if (showToast) {
    const toastOptions: Parameters<typeof toast.error>[1] = {
      description: appError.userMessage,
    };

    // Add retry action for recoverable errors
    if (appError.recoverable && onRetry) {
      toastOptions.action = {
        label: "Retry",
        onClick: onRetry,
      };
    }

    toast.error(toastTitle || "Error", toastOptions);
  }

  return appError;
}

/**
 * Handle mutation errors (create, update, delete)
 */
export function handleMutationError(
  error: unknown,
  operation: "create" | "update" | "delete",
  entityName: string,
  options?: Omit<HandleErrorOptions, "toastTitle">
): AppError {
  const operationPast = {
    create: "creating",
    update: "updating",
    delete: "deleting",
  };

  return handleError(error, {
    ...options,
    toastTitle: `Error ${operationPast[operation]} ${entityName}`,
    context: {
      ...options?.context,
      operation,
      entityName,
    },
  });
}

/**
 * Handle query/fetch errors
 */
export function handleQueryError(
  error: unknown,
  entityName: string,
  options?: Omit<HandleErrorOptions, "toastTitle">
): AppError {
  return handleError(error, {
    ...options,
    toastTitle: `Error loading ${entityName}`,
    context: {
      ...options?.context,
      operation: "fetch",
      entityName,
    },
  });
}

/**
 * Handle authentication errors
 */
export function handleAuthError(
  error: unknown,
  action: "login" | "signup" | "logout" | "password-reset",
  options?: Omit<HandleErrorOptions, "toastTitle">
): AppError {
  const actionTitles = {
    login: "Login Failed",
    signup: "Signup Failed",
    logout: "Logout Failed",
    "password-reset": "Password Reset Failed",
  };

  return handleError(error, {
    ...options,
    toastTitle: actionTitles[action],
    context: {
      ...options?.context,
      authAction: action,
    },
  });
}

/**
 * Create an async error wrapper for try-catch patterns
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options?: HandleErrorOptions & {
    fallback?: T;
  }
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    handleError(error, options);
    if (options?.fallback !== undefined) {
      return options.fallback;
    }
    throw error;
  }
}

/**
 * Create a mutation error handler for React Query
 */
export function createMutationErrorHandler(
  operation: "create" | "update" | "delete",
  entityName: string
) {
  return (error: Error) => {
    handleMutationError(error, operation, entityName);
  };
}

/**
 * Create a query error handler for React Query
 */
export function createQueryErrorHandler(entityName: string) {
  return (error: Error) => {
    handleQueryError(error, entityName);
  };
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.userMessage;
  }

  const appError = parseError(error);
  return appError.userMessage;
}
