/**
 * Error Parsers - Convert various error types into AppError
 */

import type { AuthError, PostgrestError } from "@supabase/supabase-js";
import { AppError, ErrorCode, ErrorSeverity } from "./types";

/**
 * Parse Supabase Auth errors into AppError
 */
export function parseAuthError(error: AuthError): AppError {
  const errorMap: Record<string, ErrorCode> = {
    invalid_credentials: ErrorCode.AUTH_INVALID_CREDENTIALS,
    "Invalid login credentials": ErrorCode.AUTH_INVALID_CREDENTIALS,
    user_not_found: ErrorCode.AUTH_USER_NOT_FOUND,
    "User not found": ErrorCode.AUTH_USER_NOT_FOUND,
    email_not_confirmed: ErrorCode.AUTH_EMAIL_NOT_CONFIRMED,
    "Email not confirmed": ErrorCode.AUTH_EMAIL_NOT_CONFIRMED,
    user_already_exists: ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
    "User already registered": ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
    weak_password: ErrorCode.AUTH_WEAK_PASSWORD,
    session_expired: ErrorCode.AUTH_SESSION_EXPIRED,
    "JWT expired": ErrorCode.AUTH_SESSION_EXPIRED,
    "Refresh Token Not Found": ErrorCode.AUTH_SESSION_EXPIRED,
    unauthorized: ErrorCode.AUTH_UNAUTHORIZED,
  };

  // Try to match by error name or message
  let code = ErrorCode.AUTH_INVALID_CREDENTIALS;
  const errorKey = error.name || error.message || "";

  for (const [key, value] of Object.entries(errorMap)) {
    if (errorKey.toLowerCase().includes(key.toLowerCase())) {
      code = value;
      break;
    }
  }

  // Handle specific Supabase auth error codes
  if (error.message?.includes("Email rate limit exceeded")) {
    return new AppError({
      code: ErrorCode.AUTH_INVALID_CREDENTIALS,
      message: error.message,
      userMessage: "Too many attempts. Please wait a few minutes and try again.",
      originalError: error,
      severity: ErrorSeverity.MEDIUM,
    });
  }

  if (error.message?.includes("Password should be")) {
    return new AppError({
      code: ErrorCode.AUTH_WEAK_PASSWORD,
      message: error.message,
      userMessage: error.message,
      originalError: error,
    });
  }

  return new AppError({
    code,
    message: error.message,
    originalError: error,
    context: {
      authErrorName: error.name,
      status: error.status,
    },
  });
}

/**
 * Parse Supabase Postgrest (database) errors into AppError
 */
export function parsePostgrestError(
  error: PostgrestError,
  operation: "insert" | "update" | "delete" | "fetch" = "fetch"
): AppError {
  const operationCodeMap: Record<string, ErrorCode> = {
    insert: ErrorCode.DB_INSERT_FAILED,
    update: ErrorCode.DB_UPDATE_FAILED,
    delete: ErrorCode.DB_DELETE_FAILED,
    fetch: ErrorCode.DB_FETCH_FAILED,
  };

  let code = operationCodeMap[operation] || ErrorCode.DB_FETCH_FAILED;
  let userMessage: string | undefined;

  // Handle specific PostgreSQL/Postgrest error codes
  switch (error.code) {
    case "PGRST116":
      // No rows returned
      code = ErrorCode.DB_NOT_FOUND;
      userMessage = "The requested item was not found.";
      break;
    case "23505":
      // Unique violation
      code = ErrorCode.DB_CONSTRAINT_VIOLATION;
      userMessage = "This item already exists.";
      break;
    case "23503":
      // Foreign key violation
      code = ErrorCode.DB_CONSTRAINT_VIOLATION;
      userMessage = "Cannot complete this operation due to related data.";
      break;
    case "42501":
      // Permission denied
      code = ErrorCode.DB_PERMISSION_DENIED;
      userMessage = "You don't have permission to perform this action.";
      break;
    case "42P01":
      // Undefined table
      code = ErrorCode.DB_FETCH_FAILED;
      userMessage = "A database error occurred. Please contact support.";
      break;
    case "PGRST301":
      // JWT expired
      code = ErrorCode.AUTH_SESSION_EXPIRED;
      userMessage = "Your session has expired. Please log in again.";
      break;
  }

  // Handle RLS (Row Level Security) errors
  if (error.message?.includes("row-level security")) {
    code = ErrorCode.DB_PERMISSION_DENIED;
    userMessage = "You don't have permission to access this data.";
  }

  return new AppError({
    code,
    message: error.message,
    userMessage,
    originalError: error,
    context: {
      postgrestCode: error.code,
      details: error.details,
      hint: error.hint,
    },
  });
}

/**
 * Parse network/fetch errors into AppError
 */
export function parseNetworkError(error: Error): AppError {
  const message = error.message.toLowerCase();

  if (!navigator.onLine || message.includes("offline")) {
    return new AppError({
      code: ErrorCode.NETWORK_OFFLINE,
      message: error.message,
      originalError: error,
      recoverable: true,
    });
  }

  if (message.includes("timeout") || message.includes("timed out")) {
    return new AppError({
      code: ErrorCode.NETWORK_TIMEOUT,
      message: error.message,
      originalError: error,
      recoverable: true,
    });
  }

  if (
    message.includes("fetch") ||
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("failed to fetch")
  ) {
    return new AppError({
      code: ErrorCode.NETWORK_CONNECTION_FAILED,
      message: error.message,
      originalError: error,
      recoverable: true,
    });
  }

  return new AppError({
    code: ErrorCode.NETWORK_CONNECTION_FAILED,
    message: error.message,
    originalError: error,
    recoverable: true,
  });
}

/**
 * Universal error parser - converts any error to AppError
 */
export function parseError(
  error: unknown,
  options?: {
    operation?: "insert" | "update" | "delete" | "fetch";
    context?: Record<string, unknown>;
  }
): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error;
  }

  // Supabase Auth error
  if (isSupabaseAuthError(error)) {
    return parseAuthError(error);
  }

  // Supabase Postgrest error
  if (isPostgrestError(error)) {
    return parsePostgrestError(error, options?.operation);
  }

  // Standard Error object
  if (error instanceof Error) {
    // Check if it's a network error
    if (isNetworkLikeError(error)) {
      return parseNetworkError(error);
    }

    return new AppError({
      code: ErrorCode.UNEXPECTED_ERROR,
      message: error.message,
      originalError: error,
      context: options?.context,
    });
  }

  // String error
  if (typeof error === "string") {
    return new AppError({
      code: ErrorCode.UNEXPECTED_ERROR,
      message: error,
      context: options?.context,
    });
  }

  // Unknown error type
  return new AppError({
    code: ErrorCode.UNKNOWN_ERROR,
    message: "An unknown error occurred",
    originalError: error,
    context: options?.context,
  });
}

// Type guards
function isSupabaseAuthError(error: unknown): error is AuthError {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  // Check for Supabase AuthError structure
  const err = error as Record<string, unknown>;
  return (
    "message" in err &&
    typeof err.message === "string" &&
    "status" in err &&
    ("name" in err || "__isAuthError" in err)
  );
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "details" in error
  );
}

function isNetworkLikeError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("connection") ||
    message.includes("timeout") ||
    message.includes("offline") ||
    error.name === "TypeError" && message.includes("failed to fetch")
  );
}
