import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  lastOfflineAt: Date | null;
}

interface NetworkContextValue extends NetworkStatus {
  checkConnection: () => Promise<boolean>;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

interface NetworkProviderProps {
  children: ReactNode;
  /** Whether to show toast notifications on status change */
  showToasts?: boolean;
  /** Custom online message */
  onlineMessage?: string;
  /** Custom offline message */
  offlineMessage?: string;
}

/**
 * Network Status Provider
 *
 * Monitors network connectivity and provides status to the app.
 * Shows toast notifications when going online/offline.
 */
export function NetworkProvider({
  children,
  showToasts = true,
  onlineMessage = "You're back online",
  offlineMessage = "You're offline. Some features may be unavailable.",
}: NetworkProviderProps) {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
    lastOfflineAt: null,
  });

  // Active connection check (not just navigator.onLine)
  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-store",
      });
      return response.ok;
    } catch {
      // If fetch fails, try the Supabase health endpoint
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseUrl) {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: "HEAD",
            cache: "no-store",
          });
          return response.ok || response.status === 401; // 401 means server is reachable
        }
      } catch {
        // Server unreachable
      }
      return false;
    }
  }, []);

  useEffect(() => {
    let toastId: string | number | undefined;

    const handleOnline = () => {
      setStatus((prev) => ({
        isOnline: true,
        wasOffline: true,
        lastOnlineAt: new Date(),
        lastOfflineAt: prev.lastOfflineAt,
      }));

      if (showToasts) {
        // Dismiss offline toast if present
        if (toastId) {
          toast.dismiss(toastId);
        }
        toast.success(onlineMessage, {
          duration: 3000,
        });
      }
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        isOnline: false,
        wasOffline: prev.wasOffline,
        lastOnlineAt: prev.lastOnlineAt,
        lastOfflineAt: new Date(),
      }));

      if (showToasts) {
        toastId = toast.error(offlineMessage, {
          duration: Infinity, // Keep showing until back online
          id: "offline-toast",
        });
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (toastId) {
        toast.dismiss(toastId);
      }
    };
  }, [showToasts, onlineMessage, offlineMessage]);

  return (
    <NetworkContext.Provider value={{ ...status, checkConnection }}>
      {children}
    </NetworkContext.Provider>
  );
}

/**
 * Hook to access network status
 */
export function useNetworkStatus(): NetworkContextValue {
  const context = useContext(NetworkContext);

  if (!context) {
    // Return default values if used outside provider
    return {
      isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
      wasOffline: false,
      lastOnlineAt: null,
      lastOfflineAt: null,
      checkConnection: async () =>
        typeof navigator !== "undefined" ? navigator.onLine : true,
    };
  }

  return context;
}

/**
 * Hook that returns true only when online
 * Useful for conditionally enabling features
 */
export function useIsOnline(): boolean {
  const { isOnline } = useNetworkStatus();
  return isOnline;
}

/**
 * Offline Banner Component
 * Alternative to toast - shows a persistent banner when offline
 */
export function OfflineBanner({ className }: { className?: string }) {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={`bg-yellow-500 text-yellow-950 px-4 py-2 text-center text-sm font-medium ${className || ""}`}
    >
      You're currently offline. Some features may not be available.
    </div>
  );
}
