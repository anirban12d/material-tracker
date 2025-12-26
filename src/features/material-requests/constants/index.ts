import type {
  MaterialRequestStatus,
  MaterialRequestPriority,
  MaterialUnit,
} from "@/lib/supabase";
import type {
  MaterialRequestFilters,
  PaginationParams,
  SortingParams,
} from "../types";

export const STATUS_OPTIONS: {
  value: MaterialRequestStatus;
  label: string;
  color: string;
}[] = [
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "approved", label: "Approved", color: "bg-blue-100 text-blue-800" },
  { value: "rejected", label: "Rejected", color: "bg-red-100 text-red-800" },
  {
    value: "fulfilled",
    label: "Fulfilled",
    color: "bg-green-100 text-green-800",
  },
];

export const PRIORITY_OPTIONS: {
  value: MaterialRequestPriority;
  label: string;
  color: string;
}[] = [
  { value: "low", label: "Low", color: "bg-gray-100 text-gray-800" },
  { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-800" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800" },
];

export const UNIT_OPTIONS: { value: MaterialUnit; label: string }[] = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "m", label: "Meters (m)" },
  { value: "pieces", label: "Pieces" },
  { value: "liters", label: "Liters (L)" },
  { value: "tons", label: "Tons" },
  { value: "cubic_meters", label: "Cubic Meters (m³)" },
  { value: "square_meters", label: "Square Meters (m²)" },
];

// Status transition rules: defines valid next states for each status
export const STATUS_TRANSITIONS: Record<
  MaterialRequestStatus,
  MaterialRequestStatus[]
> = {
  pending: ["approved", "rejected"],
  approved: ["fulfilled", "rejected"],
  rejected: ["pending"],
  fulfilled: [],
};

// Query keys for React Query cache management
export const QUERY_KEYS = {
  // Base key for all material requests queries
  materialRequests: ["material-requests"] as const,

  // Key for paginated list with filters, pagination, and sorting
  materialRequestsList: (
    filters?: MaterialRequestFilters,
    pagination?: PaginationParams,
    sorting?: SortingParams
  ) => ["material-requests", "list", { filters, pagination, sorting }] as const,

  // Key for single material request
  materialRequest: (id: string) => ["material-requests", "detail", id] as const,

  // Other keys
  projects: ["projects"] as const,
  profile: ["profile"] as const,
} as const;
