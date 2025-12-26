import type {
  MaterialRequestStatus,
  MaterialRequestPriority,
  MaterialUnit,
} from "@/lib/supabase";

// Export format options
export type ExportFormat = "csv" | "excel";

// Export filter options
export interface ExportFilters {
  status?: MaterialRequestStatus | "all";
  priority?: MaterialRequestPriority | "all";
  unit?: MaterialUnit | "all";
  dateFrom?: Date | null;
  dateTo?: Date | null;
}

// Export configuration
export interface ExportConfig {
  format: ExportFormat;
  filters: ExportFilters;
  limit: number;
  sortColumn: string;
  sortDirection: "asc" | "desc";
}

// Default export config
export const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: "csv",
  filters: {
    status: "all",
    priority: "all",
    unit: "all",
    dateFrom: null,
    dateTo: null,
  },
  limit: 100,
  sortColumn: "requested_at",
  sortDirection: "desc",
};

// Export state for tracking progress
export interface ExportState {
  isExporting: boolean;
  progress: number;
  error: string | null;
}
