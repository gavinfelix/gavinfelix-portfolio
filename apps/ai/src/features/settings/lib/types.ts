// User settings type definition
// This type matches the database schema and can be used throughout the application

import type { UserSettings } from "@/lib/db/schema";

/**
 * UserSettings type exported from the database schema
 * Fields:
 * - userId: UUID (primary key, references users.id)
 * - model: string | null (e.g., 'gpt-4.1', 'gpt-4o-mini')
 * - temperature: string | null (numeric value as string from database)
 * - maxTokens: number | null (integer)
 * - useTemplatesAsSystem: boolean (default: true)
 * - createdAt: Date
 * - updatedAt: Date
 */
export type { UserSettings };

/**
 * Partial user settings for updates
 * Excludes userId, createdAt, and updatedAt as these are managed automatically
 */
export type PartialUserSettings = Partial<
  Omit<UserSettings, "userId" | "createdAt" | "updatedAt">
>;

