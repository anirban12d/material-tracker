import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialRequestForm } from "@/features/material-requests";
import { useMaterialRequest } from "@/features/material-requests/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Auth protection is handled by AppLayout via the auth context
export const Route = createFileRoute("/material-requests/$id/edit")({
  component: EditMaterialRequestPage,
});

function EditMaterialRequestPage() {
  const { id } = Route.useParams();
  const { data: materialRequest, isLoading, error } = useMaterialRequest(id);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="mx-auto w-full max-w-2xl space-y-4 rounded-lg border p-6">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !materialRequest) {
    return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message ?? "Material request not found"}
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="Edit Material Request"
          description={`Editing: ${materialRequest.material_name}`}
        />
        <MaterialRequestForm mode="edit" initialData={materialRequest} />
      </div>
    </AppLayout>
  );
}
