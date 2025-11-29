// Dashboard client for fetching stats data from the API
import type { StatsResponse } from "./types";

export async function getDashboardStats(): Promise<StatsResponse> {
  const response = await fetch("/api/stats", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }

  return response.json();
}

