"use client";

// Optimized session hook with SWR caching to prevent repeated API calls
import useSWR from "swr";
import type { Session } from "next-auth";

export type SessionData = {
  userId: string;
  email: string | null;
  name: string | null;
  role: "guest" | "regular";
  expiresAt: string | null;
} | null;

const fetcher = async (url: string): Promise<SessionData> => {
  const response = await fetch(url, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Session fetch failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Optimized session hook with aggressive caching to prevent repeated calls
 * - dedupingInterval: 60s - dedupe requests within 60 seconds
 * - revalidateOnFocus: false - don't refetch on window focus
 * - revalidateOnReconnect: false - don't refetch on reconnect
 * - shouldRetryOnError: false - don't retry on error (fail fast)
 * - refreshInterval: 5min - periodic refresh to check expiration
 */
export function useSessionOptimized() {
  const { data, error, isLoading, mutate } = useSWR<SessionData>(
    "/api/session",
    fetcher,
    {
      dedupingInterval: 60_000, // 60 seconds
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      refreshInterval: 5 * 60_000, // 5 minutes - periodic refresh for expiration check
      keepPreviousData: true,
    }
  );

  return {
    data,
    error,
    isLoading,
    mutate,
    // Convenience properties matching next-auth useSession API
    session: data,
    status: isLoading ? "loading" : error ? "unauthenticated" : data ? "authenticated" : "unauthenticated",
  };
}

