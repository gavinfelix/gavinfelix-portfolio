"use client";

// Centralized session context to share session data across components
// Prevents multiple API calls by providing session from a single source
import { createContext, useContext } from "react";
import { useSessionOptimized, type SessionData } from "@/hooks/use-session-optimized";

type SessionContextType = {
  session: SessionData;
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => Promise<SessionData | undefined>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

/**
 * SessionProvider - Provides session data to all child components
 * Fetches session once and shares via context to prevent duplicate calls
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSessionOptimized();

  return (
    <SessionContext.Provider
      value={{
        session: data ?? null,
        isLoading,
        error,
        mutate,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/**
 * useSessionContext - Hook to access session from context
 * Use this instead of calling useSessionOptimized directly in components
 */
export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSessionContext must be used within SessionProvider");
  }
  return context;
}

