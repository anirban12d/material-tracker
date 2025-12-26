import { Component, type ErrorInfo, type ReactNode } from "react";
import { IconAlertTriangle, IconRefresh, IconHome } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { logError, createScopedLogger } from "@/lib/errors";

const logger = createScopedLogger("ErrorBoundary");

interface Props {
  children: ReactNode;
  /** Custom fallback component */
  fallback?: ReactNode;
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show detailed error info in development */
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Global Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log the error
    logError(error, {
      component: "ErrorBoundary",
      componentStack: errorInfo.componentStack,
    });

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    logger.error(error, {
      action: "componentDidCatch",
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = "/";
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;
      const showDetails = this.props.showDetails ?? isDev;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-lg w-full space-y-6">
            <Alert variant="destructive" className="border-destructive/50">
              <IconAlertTriangle className="h-5 w-5" />
              <AlertTitle className="text-lg font-semibold">
                Something went wrong
              </AlertTitle>
              <AlertDescription className="mt-2">
                We're sorry, but something unexpected happened. Please try
                refreshing the page or go back to the home page.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReload}
                className="flex-1"
                variant="default"
              >
                <IconRefresh className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
              <Button
                onClick={this.handleGoHome}
                className="flex-1"
                variant="outline"
              >
                <IconHome className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </div>

            <Button
              onClick={this.handleReset}
              variant="ghost"
              className="w-full text-muted-foreground"
            >
              Try Again
            </Button>

            {showDetails && this.state.error && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Technical Details (for developers)
                </summary>
                <div className="mt-3 space-y-3">
                  <div className="rounded-md bg-muted p-4 overflow-auto">
                    <p className="text-sm font-mono text-destructive">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                  </div>
                  {this.state.error.stack && (
                    <div className="rounded-md bg-muted p-4 overflow-auto max-h-48">
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="rounded-md bg-muted p-4 overflow-auto max-h-48">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">
                        Component Stack:
                      </p>
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component to wrap a component with an error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || "Component";

  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}
