import { z } from "zod";
import type {
  MaterialRequestStatus,
  MaterialRequestPriority,
} from "@/lib/supabase";

// Zod schema for form validation
export const materialRequestSchema = z.object({
  material_name: z
    .string()
    .min(1, "Material name is required")
    .max(200, "Material name must be less than 200 characters"),
  quantity: z
    .number()
    .positive("Quantity must be a positive number")
    .max(1000000, "Quantity is too large"),
  unit: z.enum(
    ["kg", "m", "pieces", "liters", "tons", "cubic_meters", "square_meters"],
    "Please select a valid unit"
  ),
  priority: z.enum(
    ["low", "medium", "high", "urgent"],
    "Please select a priority level"
  ),
  project_id: z.string().uuid().nullable().optional(),
  notes: z
    .string()
    .max(1000, "Notes must be less than 1000 characters")
    .optional(),
});

export type MaterialRequestFormData = z.infer<typeof materialRequestSchema>;

// Filter types for the list page
export interface MaterialRequestFilters {
  status?: MaterialRequestStatus | "all";
  priority?: MaterialRequestPriority | "all";
  search?: string;
}

// Pagination parameters for API requests
export interface PaginationParams {
  pageIndex: number;
  pageSize: number;
}

// Sorting parameters for API requests
export interface SortingParams {
  column: string;
  direction: "asc" | "desc";
}

// Pagination metadata in API response
export interface PaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Generic paginated response type
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Combined query params for material requests
export interface MaterialRequestQueryParams {
  filters?: MaterialRequestFilters;
  pagination?: PaginationParams;
  sorting?: SortingParams;
}

// API error type
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

// Default values
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SORTING: SortingParams = {
  column: "requested_at",
  direction: "desc",
};
