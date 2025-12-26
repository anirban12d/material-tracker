import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
          <p className="text-muted-foreground">
            Sorry, we couldn't find the page you're looking for.
          </p>
        </div>
        <Button asChild>
          <Link to="/">
            <Home className="mr-2 h-4 w-4" />
            Go back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
