import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, FileSpreadsheet, FileText, Download, RotateCcw } from "lucide-react";
import type { ExportConfig, ExportFilters, ExportFormat } from "../types";
import { DEFAULT_EXPORT_CONFIG } from "../types";
import { useExportData, fetchTotalCount } from "../hooks";
import { toast } from "sonner";

// Options for dropdowns
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "fulfilled", label: "Fulfilled" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const UNIT_OPTIONS = [
  { value: "all", label: "All Units" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "m", label: "Meters (m)" },
  { value: "pieces", label: "Pieces" },
  { value: "liters", label: "Liters (L)" },
  { value: "tons", label: "Tons" },
  { value: "cubic_meters", label: "Cubic Meters (m³)" },
  { value: "square_meters", label: "Square Meters (m²)" },
];

const SORT_OPTIONS = [
  { value: "requested_at", label: "Date Requested" },
  { value: "material_name", label: "Material Name" },
  { value: "quantity", label: "Quantity" },
  { value: "priority", label: "Priority" },
  { value: "status", label: "Status" },
];

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totalAvailable: number;
}

export function ExportDialog({
  open,
  onOpenChange,
  totalAvailable: initialTotal,
}: ExportDialogProps) {
  const [config, setConfig] = useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);
  const [filteredCount, setFilteredCount] = useState(initialTotal);
  const [isLoadingCount, setIsLoadingCount] = useState(false);

  // Separate state for the input field to allow free typing
  const [limitInput, setLimitInput] = useState<string>("");
  const [limitError, setLimitError] = useState<string | null>(null);

  const { exportData, isExporting } = useExportData({
    onSuccess: () => {
      toast.success("Export completed successfully");
      onOpenChange(false);
      // Reset config after successful export
      setConfig(DEFAULT_EXPORT_CONFIG);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to export data");
    },
  });

  // Update filtered count when filters change
  useEffect(() => {
    const updateCount = async () => {
      setIsLoadingCount(true);
      try {
        const count = await fetchTotalCount(config.filters);
        setFilteredCount(count);
      } catch (error) {
        console.error("Failed to fetch count:", error);
      } finally {
        setIsLoadingCount(false);
      }
    };

    if (open) {
      updateCount();
    }
  }, [config.filters, open]);

  // Reset config when dialog opens
  useEffect(() => {
    if (open) {
      const initialLimit = Math.min(100, initialTotal);
      setConfig({ ...DEFAULT_EXPORT_CONFIG, limit: initialLimit });
      setLimitInput(String(initialLimit));
      setLimitError(null);
      setFilteredCount(initialTotal);
    }
  }, [open, initialTotal]);

  // Sync limitInput when filteredCount changes and current limit exceeds it
  useEffect(() => {
    if (config.limit > filteredCount && filteredCount > 0) {
      setLimitInput(String(filteredCount));
      setConfig((prev) => ({ ...prev, limit: filteredCount }));
    }
  }, [filteredCount, config.limit]);

  // Validate and update limit from input
  const validateAndSetLimit = (value: string) => {
    setLimitInput(value);
    setLimitError(null);

    if (value === "") {
      setLimitError("Please enter a number");
      return;
    }

    const numValue = parseInt(value, 10);

    if (isNaN(numValue)) {
      setLimitError("Please enter a valid number");
      return;
    }

    if (numValue < 1) {
      setLimitError("Minimum is 1 item");
      return;
    }

    if (numValue > filteredCount) {
      setLimitError(`Maximum is ${filteredCount} items`);
      return;
    }

    setConfig((prev) => ({ ...prev, limit: numValue }));
  };

  // Handle blur - apply constraints if needed
  const handleLimitBlur = () => {
    if (limitInput === "" || limitError) {
      // Reset to a valid value
      const validLimit = Math.min(config.limit || 1, filteredCount);
      setLimitInput(String(validLimit));
      setConfig((prev) => ({ ...prev, limit: validLimit }));
      setLimitError(null);
    }
  };

  const updateFilters = (updates: Partial<ExportFilters>) => {
    setConfig((prev) => ({
      ...prev,
      filters: { ...prev.filters, ...updates },
    }));
  };

  const handleExport = () => {
    if (limitError) {
      toast.error(limitError);
      return;
    }
    if (config.limit <= 0 || config.limit > filteredCount) {
      toast.error("Please enter a valid number of items");
      return;
    }
    exportData(config);
  };

  const isExportDisabled =
    isExporting || filteredCount === 0 || !!limitError || config.limit <= 0;

  const handleReset = () => {
    const defaultLimit = Math.min(100, filteredCount);
    setConfig({ ...DEFAULT_EXPORT_CONFIG, limit: defaultLimit });
    setLimitInput(String(defaultLimit));
    setLimitError(null);
  };

  // Check if any settings differ from defaults
  const hasChanges =
    config.format !== DEFAULT_EXPORT_CONFIG.format ||
    config.filters.status !== DEFAULT_EXPORT_CONFIG.filters.status ||
    config.filters.priority !== DEFAULT_EXPORT_CONFIG.filters.priority ||
    config.filters.unit !== DEFAULT_EXPORT_CONFIG.filters.unit ||
    config.filters.dateFrom !== DEFAULT_EXPORT_CONFIG.filters.dateFrom ||
    config.filters.dateTo !== DEFAULT_EXPORT_CONFIG.filters.dateTo ||
    config.sortColumn !== DEFAULT_EXPORT_CONFIG.sortColumn ||
    config.sortDirection !== DEFAULT_EXPORT_CONFIG.sortDirection ||
    config.limit !== Math.min(100, filteredCount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Material Requests
          </DialogTitle>
          <DialogDescription>
            Configure your export options. Available items:{" "}
            {isLoadingCount ? (
              <Loader2 className="inline h-3 w-3 animate-spin" />
            ) : (
              <span className="font-medium text-foreground">{filteredCount}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Export Format */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export Format</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={config.format === "csv" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setConfig((prev) => ({ ...prev, format: "csv" as ExportFormat }))}
              >
                <FileText className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                type="button"
                variant={config.format === "excel" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setConfig((prev) => ({ ...prev, format: "excel" as ExportFormat }))}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>

          {/* Number of Items */}
          <div className="space-y-2">
            <Label htmlFor="limit" className="text-sm font-medium">
              Number of Items
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="limit"
                type="number"
                min={1}
                max={filteredCount}
                value={limitInput}
                onChange={(e) => validateAndSetLimit(e.target.value)}
                onBlur={handleLimitBlur}
                className={`flex-1 ${limitError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                of {filteredCount}
              </span>
            </div>
            {limitError ? (
              <p className="text-xs text-destructive">{limitError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter any number from 1 to {filteredCount}
              </p>
            )}
          </div>

          {/* Filters Section */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <Label className="text-sm font-medium">Filters</Label>

            {/* Status Filter */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={config.filters.status ?? "all"}
                  onValueChange={(value) =>
                    updateFilters({ status: value as ExportFilters["status"] })
                  }
                >
                  <SelectTrigger id="status" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-xs text-muted-foreground">
                  Priority
                </Label>
                <Select
                  value={config.filters.priority ?? "all"}
                  onValueChange={(value) =>
                    updateFilters({ priority: value as ExportFilters["priority"] })
                  }
                >
                  <SelectTrigger id="priority" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Unit Filter */}
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs text-muted-foreground">
                Unit
              </Label>
              <Select
                value={config.filters.unit ?? "all"}
                onValueChange={(value) =>
                  updateFilters({ unit: value as ExportFilters["unit"] })
                }
              >
                <SelectTrigger id="unit" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="dateFrom" className="text-xs text-muted-foreground">
                  From Date
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  className="h-9"
                  value={
                    config.filters.dateFrom
                      ? config.filters.dateFrom.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateFilters({
                      dateFrom: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dateTo" className="text-xs text-muted-foreground">
                  To Date
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  className="h-9"
                  value={
                    config.filters.dateTo
                      ? config.filters.dateTo.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    updateFilters({
                      dateTo: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sortColumn" className="text-sm font-medium">
                Sort By
              </Label>
              <Select
                value={config.sortColumn}
                onValueChange={(value) =>
                  setConfig((prev) => ({ ...prev, sortColumn: value }))
                }
              >
                <SelectTrigger id="sortColumn" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sortDirection" className="text-sm font-medium">
                Order
              </Label>
              <Select
                value={config.sortDirection}
                onValueChange={(value) =>
                  setConfig((prev) => ({
                    ...prev,
                    sortDirection: value as "asc" | "desc",
                  }))
                }
              >
                <SelectTrigger id="sortDirection" className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Newest First</SelectItem>
                  <SelectItem value="asc">Oldest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={isExporting || !hasChanges}
            className="w-full sm:w-auto"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset to Default
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              disabled={isExportDisabled}
              className="flex-1 sm:flex-none"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export {config.limit} {config.limit === 1 ? "Item" : "Items"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
