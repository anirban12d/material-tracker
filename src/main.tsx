import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./router";
import { ErrorBoundary } from "@/components/error-boundary";
import { NetworkProvider } from "@/hooks/use-network-status";
import { AppError, ErrorCode, logError } from "@/lib/errors";
import "./styles.css";

// Configure QueryClient with production-ready defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on auth or permission errors
        if (error instanceof AppError) {
          if (
            error.code === ErrorCode.AUTH_SESSION_EXPIRED ||
            error.code === ErrorCode.DB_PERMISSION_DENIED ||
            error.code === ErrorCode.AUTH_UNAUTHORIZED ||
            error.code === ErrorCode.DB_NOT_FOUND
          ) {
            return false;
          }
        }
        // Retry other errors up to 2 times
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: false, // Don't retry mutations by default
      onError: (error) => {
        // Log all mutation errors centrally
        logError(error, { component: "QueryClient", action: "mutation" });
      },
    },
  },
});

// Global error handler for unhandled errors
const handleGlobalError = (error: Error, errorInfo: React.ErrorInfo) => {
  logError(error, {
    component: "ErrorBoundary",
    action: "uncaughtError",
    componentStack: errorInfo.componentStack,
  });
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary onError={handleGlobalError}>
      <NetworkProvider showToasts={true}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
      </NetworkProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
