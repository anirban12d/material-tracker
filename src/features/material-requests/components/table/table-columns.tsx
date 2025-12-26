import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/common";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { MaterialRequestWithRelations } from "@/lib/supabase";
import type { SortingParams } from "../../types";
import { UNIT_OPTIONS } from "../../constants";
import { format } from "date-fns";
import { StatusUpdateDropdown } from "../common/status-update-dropdown";
import { TableActionsMenu } from "./table-actions-menu";

interface CreateColumnsOptions {
  onDeleteClick: (id: string, materialName: string) => void;
  sorting: SortingParams;
  onSortClick: (columnId: string) => void;
}

function SortableHeader({
  columnId,
  label,
  sorting,
  onSortClick,
}: {
  columnId: string;
  label: string;
  sorting: SortingParams;
  onSortClick: (columnId: string) => void;
}) {
  const isActive = sorting.column === columnId;
  const SortIcon = isActive
    ? sorting.direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <Button
      variant="ghost"
      onClick={() => onSortClick(columnId)}
      className="-ml-4 h-8 text-xs font-medium sm:text-sm"
    >
      {label}
      <SortIcon
        className={`ml-1 h-3 w-3 sm:ml-2 sm:h-4 sm:w-4 ${
          isActive ? "text-foreground" : "text-muted-foreground"
        }`}
      />
    </Button>
  );
}

export function createColumns({
  onDeleteClick,
  sorting,
  onSortClick,
}: CreateColumnsOptions): ColumnDef<MaterialRequestWithRelations>[] {
  return [
    {
      accessorKey: "material_name",
      header: () => (
        <SortableHeader
          columnId="material_name"
          label="Material Name"
          sorting={sorting}
          onSortClick={onSortClick}
        />
      ),
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate font-medium sm:max-w-none">
          {row.getValue("material_name")}
        </div>
      ),
    },
    {
      accessorKey: "quantity",
      header: () => (
        <SortableHeader
          columnId="quantity"
          label="Quantity"
          sorting={sorting}
          onSortClick={onSortClick}
        />
      ),
      cell: ({ row }) => {
        const quantity = row.getValue("quantity") as number;
        return (
          <span className="whitespace-nowrap text-sm">
            {quantity.toLocaleString()}
          </span>
        );
      },
    },
    {
      accessorKey: "unit",
      header: () => (
        <span className="text-xs font-medium sm:text-sm">Unit</span>
      ),
      cell: ({ row }) => {
        const unit = row.getValue("unit") as string;
        const unitLabel =
          UNIT_OPTIONS.find((u) => u.value === unit)?.label ?? unit;
        return (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {unitLabel.split(" ")[0]}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => (
        <SortableHeader
          columnId="status"
          label="Status"
          sorting={sorting}
          onSortClick={onSortClick}
        />
      ),
      cell: ({ row }) => (
        <StatusUpdateDropdown
          requestId={row.original.id}
          currentStatus={row.original.status}
        />
      ),
    },
    {
      accessorKey: "priority",
      header: () => (
        <SortableHeader
          columnId="priority"
          label="Priority"
          sorting={sorting}
          onSortClick={onSortClick}
        />
      ),
      cell: ({ row }) => <PriorityBadge priority={row.getValue("priority")} />,
    },
    {
      id: "requested_by",
      accessorFn: (row) =>
        row.requester?.full_name ?? row.requester?.email ?? "Unknown",
      header: () => (
        <span className="text-xs font-medium sm:text-sm">Requested By</span>
      ),
      cell: ({ row }) => {
        const requester = row.original.requester;
        const displayName =
          requester?.full_name ?? requester?.email ?? "Unknown";
        return <span className="whitespace-nowrap text-sm">{displayName}</span>;
      },
    },
    {
      accessorKey: "requested_at",
      header: () => (
        <SortableHeader
          columnId="requested_at"
          label="Date"
          sorting={sorting}
          onSortClick={onSortClick}
        />
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("requested_at"));
        return (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {format(date, "MMM d, yyyy")}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <TableActionsMenu
          requestId={row.original.id}
          materialName={row.original.material_name}
          onDeleteClick={onDeleteClick}
        />
      ),
    },
  ];
}
