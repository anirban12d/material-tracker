import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialRequest } from "@/lib/supabase";
import { QUERY_KEYS } from "../constants";
import {
  parsePostgrestError,
  AppError,
  ErrorCode,
  handleMutationError,
} from "@/lib/errors";

async function deleteMaterialRequest(id: string): Promise<void> {
  // Check network connectivity
  if (!navigator.onLine) {
    throw new AppError({
      code: ErrorCode.NETWORK_OFFLINE,
      message: "No internet connection",
      userMessage: "You appear to be offline. The item could not be deleted.",
      recoverable: true,
    });
  }

  const { error } = await supabase
    .from("material_requests")
    .delete()
    .eq("id", id);

  if (error) {
    throw parsePostgrestError(error, "delete");
  }
}

interface UseDeleteMaterialRequestOptions {
  onSuccess?: () => void;
  onError?: (error: AppError) => void;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

export function useDeleteMaterialRequest(
  options: UseDeleteMaterialRequestOptions = {}
) {
  const { showErrorToast = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMaterialRequest,

    // Optimistic update
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.materialRequests,
      });

      // Snapshot previous values
      const previousRequests = queryClient.getQueryData<MaterialRequest[]>(
        QUERY_KEYS.materialRequests
      );

      // Optimistically remove the item from cache
      queryClient.setQueriesData<MaterialRequest[]>(
        { queryKey: QUERY_KEYS.materialRequests },
        (old) => old?.filter((request) => request.id !== id)
      );

      // Return context for rollback
      return { previousRequests };
    },

    // Rollback on error
    onError: (error, _id, context) => {
      // Rollback optimistic updates
      if (context?.previousRequests) {
        queryClient.setQueryData(
          QUERY_KEYS.materialRequests,
          context.previousRequests
        );
      }

      // Parse and handle the error
      const appError =
        error instanceof AppError
          ? error
          : new AppError({
              code: ErrorCode.DB_DELETE_FAILED,
              message: error.message,
              originalError: error,
            });

      if (showErrorToast) {
        handleMutationError(appError, "delete", "material request", {
          showToast: true,
          log: true,
        });
      }

      options.onError?.(appError);
    },

    // Always refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.materialRequests,
      });
    },

    onSuccess: () => {
      options.onSuccess?.();
    },
  });
}
