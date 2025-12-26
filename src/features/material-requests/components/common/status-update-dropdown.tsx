import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/common";
import { StatusBadge } from "@/components/common";
import { ChevronDown } from "lucide-react";
import type { MaterialRequestStatus } from "@/lib/supabase";
import { STATUS_OPTIONS, STATUS_TRANSITIONS } from "../../constants";
import { useUpdateStatus } from "../../hooks";
import { toast } from "sonner";

interface StatusUpdateDropdownProps {
  requestId: string;
  currentStatus: MaterialRequestStatus;
}

export function StatusUpdateDropdown({
  requestId,
  currentStatus,
}: StatusUpdateDropdownProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    targetStatus: MaterialRequestStatus | null;
  }>({
    open: false,
    targetStatus: null,
  });

  const updateStatus = useUpdateStatus({
    onSuccess: () => {
      toast.success("Status updated successfully");
      setConfirmDialog({ open: false, targetStatus: null });
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
      setConfirmDialog({ open: false, targetStatus: null });
    },
  });

  const availableTransitions = STATUS_TRANSITIONS[currentStatus];
  const hasTransitions = availableTransitions.length > 0;

  const handleStatusClick = (status: MaterialRequestStatus) => {
    setConfirmDialog({ open: true, targetStatus: status });
  };

  const handleConfirm = () => {
    if (confirmDialog.targetStatus) {
      updateStatus.mutate({
        id: requestId,
        status: confirmDialog.targetStatus,
      });
    }
  };

  const targetStatusLabel =
    STATUS_OPTIONS.find((s) => s.value === confirmDialog.targetStatus)?.label ??
    "";

  if (!hasTransitions) {
    return <StatusBadge status={currentStatus} />;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-0 hover:bg-transparent"
          >
            <StatusBadge status={currentStatus} />
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {availableTransitions.map((status) => {
            const option = STATUS_OPTIONS.find((s) => s.value === status);
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => handleStatusClick(status)}
                disabled={updateStatus.isPending}
              >
                {option?.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
        title="Update Status"
        description={`Are you sure you want to change the status to "${targetStatusLabel}"?`}
        confirmLabel="Update Status"
        onConfirm={handleConfirm}
        isLoading={updateStatus.isPending}
      />
    </>
  );
}
