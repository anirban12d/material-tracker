import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialRequestUpdate, MaterialRequest } from "@/lib/supabase";
import { QUERY_KEYS } from "../constants";
import {
  parsePostgrestError,
  AppError,
  ErrorCode,
  handleMutationError,
} from "@/lib/errors";

interface UpdateMaterialRequestParams {
  id: string;
  data: MaterialRequestUpdate;
}

async function updateMaterialRequest({
  id,
  data,
}: UpdateMaterialRequestParams): Promise<MaterialRequest> {
  // Check network connectivity
  if (!navigator.onLine) {
    throw new AppError({
      code: ErrorCode.NETWORK_OFFLINE,
      message: "No internet connection",
      userMessage:
        "You appear to be offline. Your changes could not be saved.",
      recoverable: true,
    });
  }

  const updateData = { ...data, updated_at: new Date().toISOString() };

  const { data: result, error } = await supabase
    .from("material_requests")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw parsePostgrestError(error, "update");
  }

  return result as MaterialRequest;
}

interface UseUpdateMaterialRequestOptions {
  onSuccess?: (data: MaterialRequest) => void;
  onError?: (error: AppError, variables: UpdateMaterialRequestParams) => void;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

export function useUpdateMaterialRequest(
  options: UseUpdateMaterialRequestOptions = {}
) {
  const { showErrorToast = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMaterialRequest,

    // Optimistic update
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.materialRequests,
      });

      // Snapshot previous values
      const previousRequests = queryClient.getQueryData<MaterialRequest[]>(
        QUERY_KEYS.materialRequests
      );

      // Optimistically update the cache
      queryClient.setQueriesData<MaterialRequest[]>(
        { queryKey: QUERY_KEYS.materialRequests },
        (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((request) =>
            request.id === id ? { ...request, ...data } : request
          );
        }
      );

      // Also update single request cache if it exists
      const previousRequest = queryClient.getQueryData<MaterialRequest>(
        QUERY_KEYS.materialRequest(id)
      );

      if (previousRequest) {
        queryClient.setQueryData<MaterialRequest>(
          QUERY_KEYS.materialRequest(id),
          { ...previousRequest, ...data }
        );
      }

      // Return context with previous values for rollback
      return { previousRequests, previousRequest };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      // Rollback optimistic updates
      if (context?.previousRequests) {
        queryClient.setQueryData(
          QUERY_KEYS.materialRequests,
          context.previousRequests
        );
      }
      if (context?.previousRequest) {
        queryClient.setQueryData(
          QUERY_KEYS.materialRequest(variables.id),
          context.previousRequest
        );
      }

      // Parse and handle the error
      const appError =
        error instanceof AppError
          ? error
          : new AppError({
              code: ErrorCode.DB_UPDATE_FAILED,
              message: error.message,
              originalError: error,
            });

      if (showErrorToast) {
        handleMutationError(appError, "update", "material request", {
          showToast: true,
          log: true,
        });
      }

      options.onError?.(appError, variables);
    },

    // Always refetch after mutation
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.materialRequests,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.materialRequest(variables.id),
      });
    },

    onSuccess: (data) => {
      options.onSuccess?.(data);
    },
  });
}
