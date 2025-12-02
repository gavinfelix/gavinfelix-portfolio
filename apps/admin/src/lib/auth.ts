import "server-only";

import { cookies } from "next/headers";
import { getUserById } from "@/lib/db/queries";
import type { AdminUser } from "@/lib/db/schema";

/**
 * Get the current admin session user
 * For now, uses a simple cookie-based approach
 * Can be extended to use NextAuth or other auth providers
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("admin_user_id")?.value;

    if (!userId) {
      return null;
    }

    const user = await getUserById(userId);
    return user;
  } catch (error) {
    console.error("Error getting admin session:", error);
    return null;
  }
}

