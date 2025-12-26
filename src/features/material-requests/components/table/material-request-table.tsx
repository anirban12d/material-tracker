import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmationDialog } from "@/components/common";
import type { MaterialRequestWithRelations } from "@/lib/supabase";
import type { PaginationMeta, SortingParams } from "../../types";
import { useDeleteMaterialRequest } from "../../hooks";
import { toast } from "sonner";
import { createColumns } from "./table-columns";
import { TableSkeleton } from "./table-skeleton";
import { TablePagination } from "./table-pagination";
import { Loader2 } from "lucide-react";

interface MaterialRequestTableProps {
  data: MaterialRequestWithRelations[];
  isLoading: boolean;
  isFetching?: boolean;
  pagination: PaginationMeta | null;
  sorting: SortingParams;
  onPaginationChange: (pagination: { pageIndex: number; pageSize: number }) => void;
  onSortingChange: (sorting: SortingParams) => void;
}

export function MaterialRequestTable({
  data,
  isLoading,
  isFetching = false,
  pagination,
  sorting,
  onPaginationChange,
  onSortingChange,
}: MaterialRequestTableProps) {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    requestId: string | null;
    materialName: string;
  }>({
    open: false,
    requestId: null,
    materialName: "",
  });

  const deleteMutation = useDeleteMaterialRequest({
    onSuccess: () => {
      toast.success("Material request deleted successfully");
      setDeleteDialog({ open: false, requestId: null, materialName: "" });
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  const handleDeleteClick = (id: string, materialName: string) => {
    setDeleteDialog({
      open: true,
      requestId: id,
      materialName,
    });
  };

  const handleSortClick = (columnId: string) => {
    // Toggle sort direction if same column, otherwise default to desc
    const newDirection =
      sorting.column === columnId
        ? sorting.direction === "asc"
          ? "desc"
          : "asc"
        : "desc";

    onSortingChange({
      column: columnId,
      direction: newDirection,
    });
  };

  const columns = useMemo(
    () =>
      createColumns({
        onDeleteClick: handleDeleteClick,
        sorting,
        onSortClick: handleSortClick,
      }),
    [sorting]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Server-side pagination - don't use client-side pagination model
    manualPagination: true,
    manualSorting: true,
  });

  const handleDelete = () => {
    if (deleteDialog.requestId) {
      deleteMutation.mutate(deleteDialog.requestId);
    }
  };

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
        {/* Loading overlay for fetching (not initial load) */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50">
            <div className="flex items-center gap-2 rounded-md bg-background px-3 py-2 shadow-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-10 whitespace-nowrap bg-muted px-3 sm:h-12 sm:px-4"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-3 py-2 sm:px-4 sm:py-3"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No material requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalCount > 0 && (
          <TablePagination
            pageIndex={pagination.currentPage}
            pageSize={pagination.pageSize}
            totalCount={pagination.totalCount}
            onPreviousPage={() =>
              onPaginationChange({
                pageIndex: pagination.currentPage - 1,
                pageSize: pagination.pageSize,
              })
            }
            onNextPage={() =>
              onPaginationChange({
                pageIndex: pagination.currentPage + 1,
                pageSize: pagination.pageSize,
              })
            }
            canPreviousPage={pagination.hasPreviousPage}
            canNextPage={pagination.hasNextPage}
          />
        )}
      </div>

      <ConfirmationDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}
        title="Delete Material Request"
        description={`Are you sure you want to delete "${deleteDialog.materialName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        variant="destructive"
      />
    </>
  );
}
