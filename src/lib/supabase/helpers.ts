/**
 * Supabase Helper Functions with Error Handling
 *
 * Wraps Supabase operations with proper error parsing and handling.
 */

import type { PostgrestError, PostgrestSingleResponse } from "@supabase/supabase-js";
import { AppError, ErrorCode, parsePostgrestError } from "@/lib/errors";

type SupabaseResult<T> =
  | { data: T; error: null }
  | { data: null; error: PostgrestError };

/**
 * Executes a Supabase query and throws an AppError on failure
 *
 * @example
 * const users = await executeQuery(
 *   supabase.from('users').select('*'),
 *   'fetch'
 * );
 */
export async function executeQuery<T>(
  query: PromiseLike<SupabaseResult<T>>,
  operation: "insert" | "update" | "delete" | "fetch" = "fetch"
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    throw parsePostgrestError(error, operation);
  }

  return data as T;
}

/**
 * Executes a Supabase query expecting a single result
 * Throws if not found
 */
export async function executeQuerySingle<T>(
  query: PromiseLike<PostgrestSingleResponse<T>>,
  operation: "insert" | "update" | "delete" | "fetch" = "fetch"
): Promise<T> {
  const { data, error } = await query;

  if (error) {
    throw parsePostgrestError(error, operation);
  }

  if (!data) {
    throw new AppError({
      code: ErrorCode.DB_NOT_FOUND,
      message: "Record not found",
      userMessage: "The requested item was not found.",
    });
  }

  return data;
}

/**
 * Safe version that returns null instead of throwing on not found
 */
export async function executeQueryOptional<T>(
  query: PromiseLike<PostgrestSingleResponse<T>>,
  operation: "insert" | "update" | "delete" | "fetch" = "fetch"
): Promise<T | null> {
  const { data, error } = await query;

  if (error) {
    // PGRST116 means no rows returned - treat as null, not error
    if (error.code === "PGRST116") {
      return null;
    }
    throw parsePostgrestError(error, operation);
  }

  return data;
}

/**
 * Executes an insert and returns the inserted row
 */
export async function executeInsert<T>(
  query: PromiseLike<PostgrestSingleResponse<T>>
): Promise<T> {
  return executeQuerySingle(query, "insert");
}

/**
 * Executes an update and returns the updated row
 */
export async function executeUpdate<T>(
  query: PromiseLike<PostgrestSingleResponse<T>>
): Promise<T> {
  return executeQuerySingle(query, "update");
}

/**
 * Executes a delete operation
 * Returns true on success, throws on error
 */
export async function executeDelete(
  query: PromiseLike<SupabaseResult<unknown>>
): Promise<boolean> {
  const { error } = await query;

  if (error) {
    throw parsePostgrestError(error, "delete");
  }

  return true;
}

/**
 * Check if we're online before making a request
 * Throws a network error if offline
 */
export function assertOnline(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new AppError({
      code: ErrorCode.NETWORK_OFFLINE,
      message: "No network connection",
      userMessage: "You appear to be offline. Please check your internet connection.",
      recoverable: true,
    });
  }
}

/**
 * Wrap a Supabase operation with network check
 */
export async function withNetworkCheck<T>(
  operation: () => Promise<T>
): Promise<T> {
  assertOnline();
  return operation();
}

/**
 * Result type for operations that may fail
 * Useful for form submissions where you want to handle errors inline
 */
export type SafeResult<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: AppError };

/**
 * Execute a query and return a safe result (never throws)
 *
 * @example
 * const result = await safeExecute(
 *   supabase.from('users').select('*')
 * );
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.log(result.error.userMessage);
 * }
 */
export async function safeExecute<T>(
  query: PromiseLike<SupabaseResult<T>>,
  operation: "insert" | "update" | "delete" | "fetch" = "fetch"
): Promise<SafeResult<T>> {
  try {
    const data = await executeQuery(query, operation);
    return { success: true, data, error: null };
  } catch (error) {
    if (error instanceof AppError) {
      return { success: false, data: null, error };
    }
    return {
      success: false,
      data: null,
      error: new AppError({
        code: ErrorCode.UNEXPECTED_ERROR,
        message: error instanceof Error ? error.message : "Unknown error",
        originalError: error,
      }),
    };
  }
}
