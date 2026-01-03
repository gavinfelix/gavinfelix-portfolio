"use client";

// React hook for fetching and managing dashboard stats
import useSWR from "swr";
import { getDashboardStats } from "../lib/dashboard-client";
import type { StatsResponse } from "../lib/types";

export function useDashboardStats() {
  const { data, error, isLoading } = useSWR<StatsResponse>(
    "/api/stats",
    getDashboardStats,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Return dashboard statistics with loading and error states
  return {
    stats: data,
    isLoading,
    isError: !!error,
    error: error instanceof Error ? error.message : undefined,
  };
}

