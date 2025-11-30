import "server-only";

// User settings client for managing per-user chat settings
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "@/lib/errors";
import { userSettings, type UserSettings } from "@/lib/db/schema";

// Database connection setup (reuse existing pattern)
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// Helper function for consistent error handling
function handleDatabaseError(error: unknown, operation: string): never {
  console.error(`Database error in ${operation}:`, error);
  throw new ChatSDKError("bad_request:database", `Failed to ${operation}`);
}

/**
 * Get user settings for a given user ID
 * Returns null if no settings exist for the user
 */
export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  try {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);

    return settings || null;
  } catch (error) {
    handleDatabaseError(error, "get user settings");
  }
}

/**
 * Upsert (insert or update) user settings for a given user ID
 * Only updates the fields provided in partialSettings
 */
export async function upsertUserSettings(
  userId: string,
  partialSettings: Partial<Omit<UserSettings, "userId" | "createdAt" | "updatedAt">>
): Promise<UserSettings> {
  try {
    // First, try to get existing settings
    const existing = await getUserSettings(userId);

    if (existing) {
      // Update existing settings
      const [updated] = await db
        .update(userSettings)
        .set({
          ...partialSettings,
          updatedAt: new Date(),
        })
        .where(eq(userSettings.userId, userId))
        .returning();

      if (!updated) {
        throw new Error("Failed to update user settings");
      }

      return updated;
    } else {
      // Insert new settings
      const [inserted] = await db
        .insert(userSettings)
        .values({
          userId,
          ...partialSettings,
        })
        .returning();

      if (!inserted) {
        throw new Error("Failed to insert user settings");
      }

      return inserted;
    }
  } catch (error) {
    handleDatabaseError(error, "upsert user settings");
  }
}

