"use server";

import { requireAdmin } from "@/lib/auth";
import { updateUserStatus } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export interface ToggleStatusResult {
  success: boolean;
  error?: string;
  newStatus?: "active" | "banned";
}

export async function toggleUserStatus(
  userId: string,
  currentStatus: "active" | "banned"
): Promise<ToggleStatusResult> {
  try {
    // Ensure user is authenticated and has admin role
    await requireAdmin();

    // Toggle status
    const newStatus = currentStatus === "active" ? "banned" : "active";

    // Update in database
    const updatedUser = await updateUserStatus(userId, newStatus);

    if (!updatedUser) {
      return {
        success: false,
        error: "Failed to update user status",
      };
    }

    // Revalidate the user detail page and users list page
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");

    return {
      success: true,
      newStatus: updatedUser.status as "active" | "banned",
    };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to toggle user status",
    };
  }
}

