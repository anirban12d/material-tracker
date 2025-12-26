import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { MaterialRequestWithRelations } from "@/lib/supabase";
import type { ExportConfig, ExportFilters } from "../types";
import { exportToCSV, exportToExcel } from "../utils/export-utils";
import { format } from "date-fns";
import { parsePostgrestError, AppError, ErrorCode } from "@/lib/errors";

interface UseExportDataOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface ExportResult {
  exportData: (config: ExportConfig) => Promise<void>;
  isExporting: boolean;
  error: Error | null;
}

async function fetchExportData(
  filters: ExportFilters,
  limit: number,
  sortColumn: string,
  sortDirection: "asc" | "desc"
): Promise<MaterialRequestWithRelations[]> {
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

  // Build query
  let query = supabase
    .from("material_requests")
    .select("*")
    .order(sortColumn, { ascending: sortDirection === "asc" })
    .limit(limit);

  // Apply status filter
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Apply priority filter
  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  // Apply unit filter
  if (filters.unit && filters.unit !== "all") {
    query = query.eq("unit", filters.unit);
  }

  // Apply date range filter
  if (filters.dateFrom) {
    query = query.gte(
      "requested_at",
      filters.dateFrom.toISOString()
    );
  }

  if (filters.dateTo) {
    // Add one day to include the entire end date
    const endDate = new Date(filters.dateTo);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt("requested_at", endDate.toISOString());
  }

  const { data: materialRequests, error } = await query;

  if (error) {
    throw parsePostgrestError(error, "fetch");
  }

  if (!materialRequests || materialRequests.length === 0) {
    return [];
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

  if (profilesError) {
    console.warn("Failed to fetch profiles:", profilesError.message);
  }

  // Create a map of profiles by ID
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  // Combine material requests with their requester profiles
  return materialRequests.map((request) => ({
    ...request,
    requester: profileMap.get(request.requested_by) ?? undefined,
  }));
}

export function useExportData(options: UseExportDataOptions = {}): ExportResult {
  const { onSuccess, onError } = options;
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportData = async (config: ExportConfig) => {
    setIsExporting(true);
    setError(null);

    try {
      const data = await fetchExportData(
        config.filters,
        config.limit,
        config.sortColumn,
        config.sortDirection
      );

      if (data.length === 0) {
        throw new Error("No data to export with the selected filters");
      }

      const filename = `material-requests-${format(new Date(), "yyyy-MM-dd-HHmm")}`;

      if (config.format === "csv") {
        exportToCSV(data, filename);
      } else {
        exportToExcel(data, filename);
      }

      onSuccess?.();
    } catch (err) {
      const exportError = err instanceof Error ? err : new Error("Export failed");
      setError(exportError);
      onError?.(exportError);
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
    error,
  };
}

// Hook to get total count for export limit validation
export async function fetchTotalCount(
  filters: ExportFilters
): Promise<number> {
  let query = supabase
    .from("material_requests")
    .select("*", { count: "exact", head: true });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    query = query.eq("priority", filters.priority);
  }

  if (filters.unit && filters.unit !== "all") {
    query = query.eq("unit", filters.unit);
  }

  if (filters.dateFrom) {
    query = query.gte("requested_at", filters.dateFrom.toISOString());
  }

  if (filters.dateTo) {
    const endDate = new Date(filters.dateTo);
    endDate.setDate(endDate.getDate() + 1);
    query = query.lt("requested_at", endDate.toISOString());
  }

  const { count, error } = await query;

  if (error) {
    console.error("Failed to fetch count:", error);
    return 0;
  }

  return count ?? 0;
}
