import { Badge } from "@/components/ui/badge";
import type { MaterialRequestStatus } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  MaterialRequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800",
  },
  approved: {
    label: "Approved",
    className:
      "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800",
  },
  rejected: {
    label: "Rejected",
    className:
      "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 dark:bg-red-950 dark:text-red-400 dark:border-red-800",
  },
  fulfilled: {
    label: "Fulfilled",
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800",
  },
};

interface StatusBadgeProps {
  status: MaterialRequestStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "border px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
