import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/app-layout";
import { PageHeader } from "@/components/layout/page-header";
import { MaterialRequestForm } from "@/features/material-requests";

// Auth protection is handled by AppLayout via the auth context
export const Route = createFileRoute("/material-requests/new")({
  component: NewMaterialRequestPage,
});

function NewMaterialRequestPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <PageHeader
          title="New Material Request"
          description="Create a new material request for your project"
        />
        <MaterialRequestForm mode="create" />
      </div>
    </AppLayout>
  );
}
