import { useEffect } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { LoginForm, useAuth } from "@/features/auth";
import { Spinner } from "@/components/loaders";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      router.navigate({ to: "/material-requests" });
    }
  }, [isLoading, user, router]);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background to-muted">
        <Spinner size="lg" />
      </div>
    );
  }

  // Don't render login form if user is already logged in
  if (user) {
    return null;
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-auto bg-gradient-to-br from-background to-muted p-4">
      <LoginForm />
    </div>
  );
}
