import { Badge } from "@/components/ui/badge";
import type { MaterialRequestPriority } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const priorityConfig: Record<
  MaterialRequestPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className:
      "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700",
  },
  medium: {
    label: "Medium",
    className:
      "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50 dark:bg-sky-950 dark:text-sky-400 dark:border-sky-800",
  },
  high: {
    label: "High",
    className:
      "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800",
  },
  urgent: {
    label: "Urgent",
    className:
      "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800",
  },
};

interface PriorityBadgeProps {
  priority: MaterialRequestPriority;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];

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
