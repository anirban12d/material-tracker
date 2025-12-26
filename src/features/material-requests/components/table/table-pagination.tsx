import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canPreviousPage?: boolean;
  canNextPage?: boolean;
}

export function TablePagination({
  pageIndex,
  pageSize,
  totalCount,
  onPreviousPage,
  onNextPage,
  canPreviousPage,
  canNextPage,
}: TablePaginationProps) {
  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / pageSize);

  // Use provided values or calculate from state
  const hasPreviousPage = canPreviousPage ?? pageIndex > 0;
  const hasNextPage = canNextPage ?? pageIndex < totalPages - 1;

  const startItem = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const endItem = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <div className="flex flex-shrink-0 flex-col gap-3 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-xs text-muted-foreground sm:text-sm">
        Showing{" "}
        <span className="font-medium text-foreground">{startItem}</span> to{" "}
        <span className="font-medium text-foreground">{endItem}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span>{" "}
        results
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreviousPage}
          disabled={!hasPreviousPage}
          className="h-8 px-2 sm:px-3"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="ml-1 hidden sm:inline">Previous</span>
        </Button>
        <span className="text-xs text-muted-foreground sm:text-sm">
          Page {pageIndex + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNextPage}
          disabled={!hasNextPage}
          className="h-8 px-2 sm:px-3"
        >
          <span className="mr-1 hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
