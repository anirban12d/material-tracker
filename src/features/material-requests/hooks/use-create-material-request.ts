import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialRequestInsert, MaterialRequest } from "@/lib/supabase";
import { QUERY_KEYS } from "../constants";
import {
  parsePostgrestError,
  AppError,
  ErrorCode,
  handleMutationError,
} from "@/lib/errors";

async function createMaterialRequest(
  data: MaterialRequestInsert
): Promise<MaterialRequest> {
  // Check network connectivity
  if (!navigator.onLine) {
    throw new AppError({
      code: ErrorCode.NETWORK_OFFLINE,
      message: "No internet connection",
      userMessage:
        "You appear to be offline. Please check your connection and try again.",
      recoverable: true,
    });
  }

  const { data: result, error } = await supabase
    .from("material_requests")
    .insert(data)
    .select()
    .single();

  if (error) {
    throw parsePostgrestError(error, "insert");
  }

  return result as MaterialRequest;
}

interface UseCreateMaterialRequestOptions {
  onSuccess?: (data: MaterialRequest) => void;
  onError?: (error: AppError) => void;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

export function useCreateMaterialRequest(
  options: UseCreateMaterialRequestOptions = {}
) {
  const { showErrorToast = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMaterialRequest,
    onSuccess: (data) => {
      // Invalidate and refetch material requests list
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.materialRequests,
      });
      options.onSuccess?.(data);
    },
    onError: (error: Error) => {
      const appError =
        error instanceof AppError
          ? error
          : new AppError({
              code: ErrorCode.DB_INSERT_FAILED,
              message: error.message,
              originalError: error,
            });

      if (showErrorToast) {
        handleMutationError(appError, "create", "material request", {
          showToast: true,
          log: true,
        });
      }

      options.onError?.(appError);
    },
  });
}
