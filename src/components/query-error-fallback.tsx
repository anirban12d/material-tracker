import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getErrorMessage, isNetworkError, isAuthError } from "@/lib/errors";

interface QueryErrorFallbackProps {
  error: Error;
  /** Custom title for the error */
  title?: string;
  /** Entity name for better error messages (e.g., "material requests") */
  entityName?: string;
  /** Reset function from React Query or custom retry */
  onRetry?: () => void;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom class name */
  className?: string;
  /** Variant: inline (smaller) or full (larger with more details) */
  variant?: "inline" | "full";
}

/**
 * Error Fallback Component for React Query Errors
 *
 * Use this component to display errors from data fetching operations.
 * It provides user-friendly messages and retry functionality.
 */
export function QueryErrorFallback({
  error,
  title,
  entityName,
  onRetry,
  showRetry = true,
  className,
  variant = "full",
}: QueryErrorFallbackProps) {
  const isNetwork = isNetworkError(error);
  const isAuth = isAuthError(error);

  // Determine the title
  let displayTitle = title;
  if (!displayTitle) {
    if (isNetwork) {
      displayTitle = "Connection Error";
    } else if (isAuth) {
      displayTitle = "Authentication Error";
    } else {
      displayTitle = entityName
        ? `Failed to load ${entityName}`
        : "Error Loading Data";
    }
  }

  // Get user-friendly message
  const message = getErrorMessage(error);

  // Determine appropriate action text
  const actionText = isNetwork ? "Try Again" : "Retry";

  if (variant === "inline") {
    return (
      <div className={`flex items-center gap-3 text-sm ${className || ""}`}>
        <IconAlertCircle className="h-4 w-4 text-destructive shrink-0" />
        <span className="text-destructive">{message}</span>
        {showRetry && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-7 px-2 text-xs"
          >
            <IconRefresh className="h-3 w-3 mr-1" />
            {actionText}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Alert variant="destructive" className={className}>
      <IconAlertCircle className="h-4 w-4" />
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{message}</p>
        {isNetwork && (
          <p className="mt-2 text-xs opacity-80">
            Please check your internet connection and try again.
          </p>
        )}
        {isAuth && (
          <p className="mt-2 text-xs opacity-80">
            You may need to log in again to continue.
          </p>
        )}
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-3"
          >
            <IconRefresh className="h-4 w-4 mr-2" />
            {actionText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Empty State Component for when data is successfully loaded but empty
 */
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title = "No data found",
  description = "There's nothing here yet.",
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className || ""}`}
    >
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
