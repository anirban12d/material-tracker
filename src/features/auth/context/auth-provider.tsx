import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/supabase";
import {
  AppError,
  ErrorCode,
  parseAuthError,
  parsePostgrestError,
  createScopedLogger,
} from "@/lib/errors";

const logger = createScopedLogger("AuthProvider");

interface AuthResult {
  error: AppError | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  refreshSession: () => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database, create if missing
  const fetchOrCreateProfile = useCallback(
    async (
      userId: string,
      email: string,
      fullName?: string
    ): Promise<{ profile: Profile | null; error: AppError | null }> => {
      try {
        // Try to fetch existing profile
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();

        if (existingProfile) {
          // Profile exists, check if it has a company_id
          if (!existingProfile.company_id) {
            // Create a company and update the profile
            const { data: newCompany, error: companyError } = await supabase
              .from("companies")
              .insert({ name: "My Company" })
              .select()
              .single();

            if (companyError) {
              logger.warn("Failed to create company for existing profile", {
                userId,
                error: companyError,
              });
              // Return profile anyway - company is not critical
              return { profile: existingProfile, error: null };
            }

            if (newCompany) {
              const { data: updatedProfile, error: updateError } = await supabase
                .from("profiles")
                .update({ company_id: newCompany.id })
                .eq("id", userId)
                .select()
                .single();

              if (updateError) {
                logger.warn("Failed to update profile with company", {
                  userId,
                  error: updateError,
                });
                return { profile: existingProfile, error: null };
              }

              return { profile: updatedProfile, error: null };
            }
          }
          return { profile: existingProfile, error: null };
        }

        // Profile doesn't exist (PGRST116), create company and profile
        if (fetchError?.code === "PGRST116") {
          // Create a new company
          const { data: newCompany, error: companyError } = await supabase
            .from("companies")
            .insert({ name: "My Company" })
            .select()
            .single();

          if (companyError) {
            const appError = parsePostgrestError(companyError, "insert");
            logger.error(appError, { action: "createCompany", userId });
            return { profile: null, error: appError };
          }

          // Create the profile
          const { data: newProfile, error: profileError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: email,
              full_name: fullName || null,
              company_id: newCompany.id,
            })
            .select()
            .single();

          if (profileError) {
            const appError = parsePostgrestError(profileError, "insert");
            logger.error(appError, { action: "createProfile", userId });
            return { profile: null, error: appError };
          }

          return { profile: newProfile, error: null };
        }

        // Other fetch error
        if (fetchError) {
          const appError = parsePostgrestError(fetchError, "fetch");
          logger.error(appError, { action: "fetchProfile", userId });
          return { profile: null, error: appError };
        }

        return { profile: null, error: null };
      } catch (error) {
        const appError = new AppError({
          code: ErrorCode.UNEXPECTED_ERROR,
          message: error instanceof Error ? error.message : "Profile operation failed",
          originalError: error,
          context: { userId },
        });
        logger.error(appError, { action: "fetchOrCreateProfile" });
        return { profile: null, error: appError };
      }
    },
    []
  );

  // Initialize auth state
  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          logger.error(parseAuthError(error), { action: "getSession" });
          setIsLoading(false);
          return;
        }

        const initialSession = data.session;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);

          const { profile: userProfile, error: profileError } = await fetchOrCreateProfile(
            initialSession.user.id,
            initialSession.user.email ?? "",
            initialSession.user.user_metadata?.full_name
          );

          if (isMounted) {
            if (profileError) {
              logger.warn("Profile fetch failed during init", {
                error: profileError.userMessage,
              });
            }
            setProfile(userProfile);
          }
        }
      } catch (error) {
        logger.error(error, { action: "initializeAuth" });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      logger.debug(`Auth state changed: ${event}`);

      if (event === "TOKEN_REFRESHED" && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchOrCreateProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        // Check if online
        if (!navigator.onLine) {
          return {
            error: new AppError({
              code: ErrorCode.NETWORK_OFFLINE,
              message: "No internet connection",
            }),
          };
        }

        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const appError = parseAuthError(error);
          logger.error(appError, { action: "signIn", email });
          return { error: appError };
        }

        if (data.session?.user) {
          setSession(data.session);
          setUser(data.session.user);

          const { profile: userProfile, error: profileError } = await fetchOrCreateProfile(
            data.session.user.id,
            data.session.user.email ?? "",
            data.session.user.user_metadata?.full_name
          );

          if (profileError) {
            // Don't fail login for profile errors, just log
            logger.warn("Profile creation failed after login", {
              error: profileError.userMessage,
            });
          }

          setProfile(userProfile);
        }

        return { error: null };
      } catch (error) {
        const appError = new AppError({
          code: ErrorCode.UNEXPECTED_ERROR,
          message: error instanceof Error ? error.message : "Login failed",
          originalError: error,
        });
        logger.error(appError, { action: "signIn" });
        return { error: appError };
      }
    },
    [fetchOrCreateProfile]
  );

  const signUp = useCallback(
    async (email: string, password: string, fullName: string): Promise<AuthResult> => {
      try {
        // Check if online
        if (!navigator.onLine) {
          return {
            error: new AppError({
              code: ErrorCode.NETWORK_OFFLINE,
              message: "No internet connection",
            }),
          };
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          const appError = parseAuthError(error);
          logger.error(appError, { action: "signUp", email });
          return { error: appError };
        }

        return { error: null };
      } catch (error) {
        const appError = new AppError({
          code: ErrorCode.UNEXPECTED_ERROR,
          message: error instanceof Error ? error.message : "Signup failed",
          originalError: error,
        });
        logger.error(appError, { action: "signUp" });
        return { error: appError };
      }
    },
    []
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setIsLoading(false);
        const appError = parseAuthError(error);
        logger.error(appError, { action: "signOut" });
        return { error: appError };
      }

      setSession(null);
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      const appError = new AppError({
        code: ErrorCode.UNEXPECTED_ERROR,
        message: error instanceof Error ? error.message : "Logout failed",
        originalError: error,
      });
      logger.error(appError, { action: "signOut" });
      return { error: appError };
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        const appError = parseAuthError(error);
        logger.error(appError, { action: "refreshSession" });
        return { error: appError };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }

      return { error: null };
    } catch (error) {
      const appError = new AppError({
        code: ErrorCode.UNEXPECTED_ERROR,
        message: error instanceof Error ? error.message : "Session refresh failed",
        originalError: error,
      });
      logger.error(appError, { action: "refreshSession" });
      return { error: appError };
    }
  }, []);

  const value: AuthContextType = {
    session,
    user,
    profile,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
