/**
 * Error Types and Classes for Production-Ready Error Handling
 */

// Error codes for categorization
export enum ErrorCode {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_SESSION_EXPIRED = "AUTH_SESSION_EXPIRED",
  AUTH_USER_NOT_FOUND = "AUTH_USER_NOT_FOUND",
  AUTH_EMAIL_NOT_CONFIRMED = "AUTH_EMAIL_NOT_CONFIRMED",
  AUTH_EMAIL_ALREADY_EXISTS = "AUTH_EMAIL_ALREADY_EXISTS",
  AUTH_WEAK_PASSWORD = "AUTH_WEAK_PASSWORD",
  AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED",

  // Network errors
  NETWORK_OFFLINE = "NETWORK_OFFLINE",
  NETWORK_TIMEOUT = "NETWORK_TIMEOUT",
  NETWORK_CONNECTION_FAILED = "NETWORK_CONNECTION_FAILED",

  // Database/CRUD errors
  DB_INSERT_FAILED = "DB_INSERT_FAILED",
  DB_UPDATE_FAILED = "DB_UPDATE_FAILED",
  DB_DELETE_FAILED = "DB_DELETE_FAILED",
  DB_FETCH_FAILED = "DB_FETCH_FAILED",
  DB_NOT_FOUND = "DB_NOT_FOUND",
  DB_CONSTRAINT_VIOLATION = "DB_CONSTRAINT_VIOLATION",
  DB_PERMISSION_DENIED = "DB_PERMISSION_DENIED",

  // Validation errors
  VALIDATION_FAILED = "VALIDATION_FAILED",
  VALIDATION_REQUIRED_FIELD = "VALIDATION_REQUIRED_FIELD",
  VALIDATION_INVALID_FORMAT = "VALIDATION_INVALID_FORMAT",

  // Generic errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  UNEXPECTED_ERROR = "UNEXPECTED_ERROR",
  OPERATION_CANCELLED = "OPERATION_CANCELLED",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Base app error interface
export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  userMessage?: string;
  originalError?: unknown;
  context?: Record<string, unknown>;
  severity?: ErrorSeverity;
  recoverable?: boolean;
}

/**
 * Custom Application Error Class
 * Provides structured error handling with user-friendly messages
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly originalError?: unknown;
  public readonly context?: Record<string, unknown>;
  public readonly severity: ErrorSeverity;
  public readonly recoverable: boolean;
  public readonly timestamp: Date;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = "AppError";
    this.code = options.code;
    this.userMessage = options.userMessage || this.getDefaultUserMessage(options.code);
    this.originalError = options.originalError;
    this.context = options.context;
    this.severity = options.severity || this.getDefaultSeverity(options.code);
    this.recoverable = options.recoverable ?? this.isRecoverableByDefault(options.code);
    this.timestamp = new Date();

    // Maintains proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  private getDefaultUserMessage(code: ErrorCode): string {
    const messages: Record<ErrorCode, string> = {
      // Auth errors
      [ErrorCode.AUTH_INVALID_CREDENTIALS]: "Invalid email or password. Please try again.",
      [ErrorCode.AUTH_SESSION_EXPIRED]: "Your session has expired. Please log in again.",
      [ErrorCode.AUTH_USER_NOT_FOUND]: "No account found with this email address.",
      [ErrorCode.AUTH_EMAIL_NOT_CONFIRMED]: "Please verify your email address before logging in.",
      [ErrorCode.AUTH_EMAIL_ALREADY_EXISTS]: "An account with this email already exists.",
      [ErrorCode.AUTH_WEAK_PASSWORD]: "Password is too weak. Please use a stronger password.",
      [ErrorCode.AUTH_UNAUTHORIZED]: "You don't have permission to perform this action.",

      // Network errors
      [ErrorCode.NETWORK_OFFLINE]: "You appear to be offline. Please check your internet connection.",
      [ErrorCode.NETWORK_TIMEOUT]: "The request timed out. Please try again.",
      [ErrorCode.NETWORK_CONNECTION_FAILED]: "Unable to connect to the server. Please try again later.",

      // Database errors
      [ErrorCode.DB_INSERT_FAILED]: "Failed to save the data. Please try again.",
      [ErrorCode.DB_UPDATE_FAILED]: "Failed to update the data. Please try again.",
      [ErrorCode.DB_DELETE_FAILED]: "Failed to delete the item. Please try again.",
      [ErrorCode.DB_FETCH_FAILED]: "Failed to load the data. Please refresh the page.",
      [ErrorCode.DB_NOT_FOUND]: "The requested item was not found.",
      [ErrorCode.DB_CONSTRAINT_VIOLATION]: "This operation violates data constraints.",
      [ErrorCode.DB_PERMISSION_DENIED]: "You don't have permission to access this data.",

      // Validation errors
      [ErrorCode.VALIDATION_FAILED]: "Please check your input and try again.",
      [ErrorCode.VALIDATION_REQUIRED_FIELD]: "Please fill in all required fields.",
      [ErrorCode.VALIDATION_INVALID_FORMAT]: "Please check the format of your input.",

      // Generic errors
      [ErrorCode.UNKNOWN_ERROR]: "An unexpected error occurred. Please try again.",
      [ErrorCode.UNEXPECTED_ERROR]: "Something went wrong. Please try again later.",
      [ErrorCode.OPERATION_CANCELLED]: "The operation was cancelled.",
    };

    return messages[code] || messages[ErrorCode.UNKNOWN_ERROR];
  }

  private getDefaultSeverity(code: ErrorCode): ErrorSeverity {
    if (code.startsWith("AUTH_")) return ErrorSeverity.HIGH;
    if (code.startsWith("NETWORK_")) return ErrorSeverity.MEDIUM;
    if (code.startsWith("DB_")) return ErrorSeverity.HIGH;
    if (code.startsWith("VALIDATION_")) return ErrorSeverity.LOW;
    return ErrorSeverity.MEDIUM;
  }

  private isRecoverableByDefault(code: ErrorCode): boolean {
    const nonRecoverable = [
      ErrorCode.AUTH_UNAUTHORIZED,
      ErrorCode.DB_PERMISSION_DENIED,
    ];
    return !nonRecoverable.includes(code);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      severity: this.severity,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
    };
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.code.startsWith("NETWORK_");
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("network") ||
      message.includes("fetch") ||
      message.includes("connection") ||
      message.includes("offline")
    );
  }
  return false;
}

/**
 * Type guard to check if error is an auth error
 */
export function isAuthError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.code.startsWith("AUTH_");
  }
  return false;
}
