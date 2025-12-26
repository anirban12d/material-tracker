import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { MaterialRequest, MaterialRequestStatus } from "@/lib/supabase";
import { QUERY_KEYS } from "../constants";
import {
  parsePostgrestError,
  AppError,
  ErrorCode,
  handleMutationError,
} from "@/lib/errors";

interface UpdateStatusParams {
  id: string;
  status: MaterialRequestStatus;
}

async function updateStatus({
  id,
  status,
}: UpdateStatusParams): Promise<MaterialRequest> {
  // Check network connectivity
  if (!navigator.onLine) {
    throw new AppError({
      code: ErrorCode.NETWORK_OFFLINE,
      message: "No internet connection",
      userMessage: "You appear to be offline. Status could not be updated.",
      recoverable: true,
    });
  }

  const updateData = {
    status,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("material_requests")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw parsePostgrestError(error, "update");
  }

  return data as MaterialRequest;
}

interface UseUpdateStatusOptions {
  onSuccess?: (data: MaterialRequest) => void;
  onError?: (error: AppError) => void;
  /** Whether to show toast on error (default: true) */
  showErrorToast?: boolean;
}

export function useUpdateStatus(options: UseUpdateStatusOptions = {}) {
  const { showErrorToast = true } = options;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStatus,

    // Optimistic update for status changes
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.materialRequests,
      });

      // Get all query caches that match material-requests
      const queries = queryClient.getQueriesData<MaterialRequest[]>({
        queryKey: QUERY_KEYS.materialRequests,
      });

      // Store previous values for each query
      const previousData = new Map(queries);

      // Update all matching queries optimistically
      queries.forEach(([queryKey]) => {
        queryClient.setQueryData<MaterialRequest[]>(queryKey, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((request) =>
            request.id === id ? { ...request, status } : request
          );
        });
      });

      return { previousData };
    },

    // Rollback on error
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        context.previousData.forEach((data, queryKey) => {
          queryClient.setQueryData(queryKey, data);
        });
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
        handleMutationError(appError, "update", "status", {
          showToast: true,
          log: true,
        });
      }

      options.onError?.(appError);
    },

    // Always refetch
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.materialRequests,
      });
    },

    onSuccess: (data) => {
      options.onSuccess?.(data);
    },
  });
}
