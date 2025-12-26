import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { ExportDialog } from "./export-dialog";

interface ExportButtonProps {
  totalCount: number;
  disabled?: boolean;
}

export function ExportButton({ totalCount, disabled }: ExportButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 sm:h-10"
        disabled={disabled || totalCount === 0}
        onClick={() => setDialogOpen(true)}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>

      <ExportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        totalAvailable={totalCount}
      />
    </>
  );
}
