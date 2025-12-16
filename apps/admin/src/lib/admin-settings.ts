// Admin settings utility using @vercel/postgres with React cache
import "server-only";
import { cache } from "react";
import { sql } from "@vercel/postgres";

export type AdminSettings = {
  siteName: string;
  allowSignup: boolean;
  dailyTokenLimit: number;
  updatedAt: Date;
};

/**
 * Get admin settings (singleton) with React cache
 * Uses cache() to deduplicate requests during a single render pass
 */
export const getAdminSettings = cache(async (): Promise<AdminSettings> => {
  const result = await sql`
    SELECT 
      site_name as "siteName",
      allow_signup as "allowSignup",
      daily_token_limit as "dailyTokenLimit",
      updated_at as "updatedAt"
    FROM admin_settings
    WHERE id = 'singleton'
    LIMIT 1
  `;

  if (result.rows.length === 0) {
    // Return default values if no settings found
    return {
      siteName: "Admin Panel",
      allowSignup: true,
      dailyTokenLimit: 20000,
      updatedAt: new Date(),
    };
  }

  const row = result.rows[0];
  return {
    siteName: row.siteName as string,
    allowSignup: row.allowSignup as boolean,
    dailyTokenLimit: row.dailyTokenLimit as number,
    updatedAt: new Date(row.updatedAt as string),
  };
});
