import "server-only";

import { getUserByEmail } from "@/lib/db/queries";
import { verifyPassword } from "@/lib/password";
import type { AdminUser } from "@/lib/db/schema";

/**
 * Authenticate admin user with email and password
 * Returns user object if credentials are valid, null otherwise
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminUser | null> {
  try {
    // Get user by email
    const user = await getUserByEmail(email.trim());

    if (!user) {
      return null;
    }

    // Check if user has a password hash
    if (!user.passwordHash) {
      return null;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error authenticating admin:", error);
    return null;
  }
}
