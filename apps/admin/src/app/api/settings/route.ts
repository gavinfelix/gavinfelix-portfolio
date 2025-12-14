// API route handler for updating current admin user settings (display name)
import { requireAdmin } from "@/lib/auth";
import { updateAdminUser } from "@/lib/queries";

/**
 * PATCH /api/settings
 * Update current user's settings (display name)
 */
export async function PATCH(request: Request) {
  try {
    const user = await requireAdmin();

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return Response.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { name } = body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== "string") {
        return Response.json(
          { error: "Name must be a string" },
          { status: 400 }
        );
      }

      if (name.trim().length === 0) {
        return Response.json(
          { error: "Name cannot be empty" },
          { status: 400 }
        );
      }
    }

    // Check if there's anything to update
    if (name === undefined) {
      return Response.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await updateAdminUser(user.id, {
      name: name.trim() || null,
    });

    if (!updatedUser) {
      return Response.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("[PATCH /api/settings] Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

