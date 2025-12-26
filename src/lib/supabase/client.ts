import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
  );
}

// Using untyped client for flexibility - types are enforced at the application layer
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Use a no-op lock to prevent hanging on getSession() in development
    // This avoids issues with navigator.locks API
    lock: async (name: string, acquireTimeout: number, fn: () => Promise<unknown>) => {
      return await fn();
    },
    // Use localStorage explicitly
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});
