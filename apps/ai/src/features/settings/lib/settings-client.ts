// Client-side functions for fetching and updating user settings via API
import type { UserSettings } from "@/lib/db/schema";

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const response = await fetch("/api/settings", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to fetch settings: ${response.statusText}`);
  }

  return response.json();
}

export async function updateUserSettings(
  settings: {
    model?: string | null;
    temperature?: number | null;
    maxTokens?: number | null;
    useTemplatesAsSystem?: boolean | null;
  }
): Promise<UserSettings> {
  const response = await fetch("/api/settings", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(settings),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized");
    }
    throw new Error(`Failed to update settings: ${response.statusText}`);
  }

  return response.json();
}

