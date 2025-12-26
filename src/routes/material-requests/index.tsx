import { useState, useCallback } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { QueryErrorFallback } from "@/components/query-error-fallback";
import {
  MaterialRequestFiltersComponent,
  MaterialRequestTable,
} from "@/features/material-requests";
import { ExportButton } from "@/features/export-feature";
import { useMaterialRequests } from "@/features/material-requests/hooks";
import { QUERY_KEYS } from "@/features/material-requests/constants";
import { useAuth } from "@/features/auth";
import type {
  MaterialRequestFilters,
  PaginationParams,
  SortingParams,
} from "@/features/material-requests/types";
import { DEFAULT_PAGE_SIZE, DEFAULT_SORTING } from "@/features/material-requests/types";
import { useDebounce } from "@/hooks";
import { Plus } from "lucide-react";

// URL search params schema
const searchParamsSchema = z.object({
  page: z.coerce.number().min(0).optional().default(0),
  pageSize: z.coerce.number().min(5).max(100).optional().default(DEFAULT_PAGE_SIZE),
  status: z.enum(["all", "pending", "approved", "rejected", "fulfilled"]).optional().default("all"),
  priority: z.enum(["all", "low", "medium", "high", "urgent"]).optional().default("all"),
  search: z.string().optional().default(""),
  sortColumn: z.string().optional().default(DEFAULT_SORTING.column),
  sortDirection: z.enum(["asc", "desc"]).optional().default(DEFAULT_SORTING.direction),
});

type SearchParams = z.infer<typeof searchParamsSchema>;

export const Route = createFileRoute("/material-requests/")({
  component: MaterialRequestsPage,
  validateSearch: searchParamsSchema,
});

function MaterialRequestsPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  // Local state for instant UI updates (before debounce)
  const [searchInput, setSearchInput] = useState(searchParams.search);

  // Debounce search input for API calls
  const debouncedSearch = useDebounce(searchInput, 300);

  // Derive state from URL params
  const filters: MaterialRequestFilters = {
    status: searchParams.status,
    priority: searchParams.priority,
    search: debouncedSearch,
  };

  const pagination: PaginationParams = {
    pageIndex: searchParams.page,
    pageSize: searchParams.pageSize,
  };

  const sorting: SortingParams = {
    column: searchParams.sortColumn,
    direction: searchParams.sortDirection,
  };

  // Update URL params helper
  const updateSearchParams = useCallback(
    (updates: Partial<SearchParams>) => {
      navigate({
        search: (prev) => ({
          ...prev,
          ...updates,
        }),
        replace: true,
      });
    },
    [navigate]
  );

  // Handlers
  const handleFiltersChange = useCallback(
    (newFilters: MaterialRequestFilters) => {
      // Update search input state immediately for responsive UI
      if (newFilters.search !== undefined) {
        setSearchInput(newFilters.search);
      }

      // Update URL params (reset to page 0 when filters change)
      updateSearchParams({
        status: newFilters.status ?? "all",
        priority: newFilters.priority ?? "all",
        search: newFilters.search ?? "",
        page: 0, // Reset to first page when filters change
      });
    },
    [updateSearchParams]
  );

  const handlePaginationChange = useCallback(
    (newPagination: PaginationParams) => {
      updateSearchParams({
        page: newPagination.pageIndex,
        pageSize: newPagination.pageSize,
      });
    },
    [updateSearchParams]
  );

  const handleSortingChange = useCallback(
    (newSorting: SortingParams) => {
      updateSearchParams({
        sortColumn: newSorting.column,
        sortDirection: newSorting.direction,
        page: 0, // Reset to first page when sorting changes
      });
    },
    [updateSearchParams]
  );

  // Fetch data with server-side pagination
  // Only fetch when profile is available (ensures RLS has proper context)
  const {
    data: response,
    isLoading,
    error,
    isFetching,
  } = useMaterialRequests({
    filters,
    pagination,
    sorting,
    enabled: !!profile,
  });

  const handleRetry = () => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.materialRequests,
    });
  };

  // Use search input for filters UI (immediate feedback)
  const displayFilters: MaterialRequestFilters = {
    ...filters,
    search: searchInput,
  };

  return (
    <AppLayout>
      <div className="flex min-h-0 flex-1 flex-col gap-4 sm:gap-6">
        <PageHeader
          title="Material Requests"
          description="Manage and track material requests for your projects"
          actions={
            <div className="flex gap-2">
              <ExportButton
                totalCount={response?.pagination?.totalCount ?? 0}
                disabled={isLoading}
              />
              <Button asChild size="sm" className="h-9 sm:h-10">
                <Link to="/material-requests/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  <span className="hidden sm:inline">New Request</span>
                  <span className="sm:hidden">New</span>
                </Link>
              </Button>
            </div>
          }
        />

        <MaterialRequestFiltersComponent
          filters={displayFilters}
          onFiltersChange={handleFiltersChange}
        />

        {error && (
          <QueryErrorFallback
            error={error}
            entityName="material requests"
            onRetry={handleRetry}
            showRetry={true}
          />
        )}

        <MaterialRequestTable
          data={response?.data ?? []}
          isLoading={isLoading}
          isFetching={isFetching}
          pagination={response?.pagination ?? null}
          sorting={sorting}
          onPaginationChange={handlePaginationChange}
          onSortingChange={handleSortingChange}
        />
      </div>
    </AppLayout>
  );
}
