import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { STATUS_OPTIONS, PRIORITY_OPTIONS } from "../../constants";
import type { MaterialRequestFilters } from "../../types";

interface MaterialRequestFiltersProps {
  filters: MaterialRequestFilters;
  onFiltersChange: (filters: MaterialRequestFilters) => void;
}

export function MaterialRequestFiltersComponent({
  filters,
  onFiltersChange,
}: MaterialRequestFiltersProps) {
  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value as MaterialRequestFilters["status"],
    });
  };

  const handlePriorityChange = (value: string) => {
    onFiltersChange({
      ...filters,
      priority: value as MaterialRequestFilters["priority"],
    });
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: "all",
      priority: "all",
      search: "",
    });
  };

  const hasActiveFilters =
    (filters.status && filters.status !== "all") ||
    (filters.priority && filters.priority !== "all") ||
    filters.search;

  return (
    <div className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials..."
            value={filters.search ?? ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 pl-9 sm:h-10"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 sm:gap-3">
          <Select
            value={filters.status ?? "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="h-9 w-full min-w-[120px] sm:h-10 sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority ?? "all"}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="h-9 w-full min-w-[120px] sm:h-10 sm:w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {PRIORITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-9 px-2 sm:h-10 sm:px-3"
            >
              <X className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
