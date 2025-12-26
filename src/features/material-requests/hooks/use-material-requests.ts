import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { MaterialRequestWithRelations } from "@/lib/supabase";
import { QUERY_KEYS } from "../constants";
import type {
  MaterialRequestFilters,
  PaginationParams,
  SortingParams,
  PaginatedResponse,
  PaginationMeta,
} from "../types";
import { DEFAULT_PAGE_SIZE, DEFAULT_SORTING } from "../types";
import { parsePostgrestError, AppError, ErrorCode } from "@/lib/errors";

interface UseMaterialRequestsOptions {
  filters?: MaterialRequestFilters;
  pagination?: PaginationParams;
  sorting?: SortingParams;
  enabled?: boolean;
}

async function fetchMaterialRequests(
  filters?: MaterialRequestFilters,
  pagination?: PaginationParams,
  sorting?: SortingParams
): Promise<PaginatedResponse<MaterialRequestWithRelations>> {
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

  const pageIndex = pagination?.pageIndex ?? 0;
  const pageSize = pagination?.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortColumn = sorting?.column ?? DEFAULT_SORTING.column;
  const sortDirection = sorting?.direction ?? DEFAULT_SORTING.direction;

  // Calculate range for pagination
  const from = pageIndex * pageSize;
  const to = from + pageSize - 1;

  // Build query
  let query = supabase
    .from("material_requests")
    .select("*", { count: "exact" })
    .order(sortColumn, { ascending: sortDirection === "asc" })
    .range(from, to);

  // Apply status filter
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Apply priority filter
  if (filters?.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  // Apply search filter
  if (filters?.search && filters.search.trim()) {
    query = query.ilike("material_name", `%${filters.search.trim()}%`);
  }

  const { data: materialRequests, error, count } = await query;

  if (error) {
    throw parsePostgrestError(error, "fetch");
  }

  const totalCount = count ?? 0;

  if (!materialRequests || materialRequests.length === 0) {
    const paginationMeta: PaginationMeta = {
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      currentPage: pageIndex,
      pageSize,
      hasNextPage: false,
      hasPreviousPage: pageIndex > 0,
    };
    return { data: [], pagination: paginationMeta };
  }

  // Get unique requester IDs
  const requesterIds = [
    ...new Set(materialRequests.map((r) => r.requested_by)),
  ];

  // Fetch profiles for all requesters
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", requesterIds);

  // Don't fail the whole query if profiles fail - just log and continue
  if (profilesError) {
    console.warn("Failed to fetch profiles:", profilesError.message);
  }

  // Create a map of profiles by ID
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Combine material requests with their requester profiles
  const data = materialRequests.map((request) => ({
    ...request,
    requester: profileMap.get(request.requested_by) ?? undefined,
  }));

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / pageSize);
  const paginationMeta: PaginationMeta = {
    totalCount,
    totalPages,
    currentPage: pageIndex,
    pageSize,
    hasNextPage: pageIndex < totalPages - 1,
    hasPreviousPage: pageIndex > 0,
  };

  return { data, pagination: paginationMeta };
}

export function useMaterialRequests(options: UseMaterialRequestsOptions = {}) {
  const { filters, pagination, sorting, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEYS.materialRequestsList(filters, pagination, sorting),
    queryFn: () => fetchMaterialRequests(filters, pagination, sorting),
    enabled,
    staleTime: 30000, // 30 seconds
    placeholderData: (previousData) => previousData, // Keep previous data while loading
    retry: (failureCount, error) => {
      // Don't retry on auth or permission errors
      if (error instanceof AppError) {
        if (
          error.code === ErrorCode.AUTH_SESSION_EXPIRED ||
          error.code === ErrorCode.DB_PERMISSION_DENIED ||
          error.code === ErrorCode.AUTH_UNAUTHORIZED
        ) {
          return false;
        }
      }
      // Retry network errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Prefetch next page for smoother navigation
  useEffect(() => {
    if (query.data?.pagination.hasNextPage && pagination) {
      const nextPageParams: PaginationParams = {
        pageIndex: pagination.pageIndex + 1,
        pageSize: pagination.pageSize,
      };

      queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.materialRequestsList(
          filters,
          nextPageParams,
          sorting
        ),
        queryFn: () =>
          fetchMaterialRequests(filters, nextPageParams, sorting),
        staleTime: 30000,
      });
    }
  }, [
    query.data?.pagination.hasNextPage,
    pagination,
    filters,
    sorting,
    queryClient,
  ]);

  return query;
}

// Single material request hook
async function fetchMaterialRequest(
  id: string
): Promise<MaterialRequestWithRelations> {
  // Check network connectivity
  if (!navigator.onLine) {
    throw new AppError({
      code: ErrorCode.NETWORK_OFFLINE,
      message: "No internet connection",
      recoverable: true,
    });
  }

  const { data: request, error } = await supabase
    .from("material_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw parsePostgrestError(error, "fetch");
  }

  // Fetch the requester's profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", request.requested_by)
    .single();

  return {
    ...request,
    requester: profile ?? undefined,
  };
}

export function useMaterialRequest(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.materialRequest(id),
    queryFn: () => fetchMaterialRequest(id),
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry on not found or permission errors
      if (error instanceof AppError) {
        if (
          error.code === ErrorCode.DB_NOT_FOUND ||
          error.code === ErrorCode.DB_PERMISSION_DENIED ||
          error.code === ErrorCode.AUTH_SESSION_EXPIRED
        ) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}
