import { NextRequest } from "next/server";
import {
  getUserById,
  updateUser,
  deleteUser,
} from "@/lib/db/queries";
import type { NewAdminUser } from "@/lib/db/schema";

/**
 * GET /api/users/[id]
 * Get a single user by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await getUserById(id);

    if (!user) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return Response.json(user);
  } catch (error) {
    console.error("[GET /api/users/[id]] Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[id]
 * Update a user by ID
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, name, role, status, passwordHash } = body;

    // Validate that at least one field is provided
    if (!email && name === undefined && !role && !status && !passwordHash) {
      return Response.json(
        { error: "At least one field must be provided for update" },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return Response.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Validate role if provided
    if (role && role !== "admin" && role !== "user") {
      return Response.json(
        { error: "Invalid role. Must be 'admin' or 'user'" },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && status !== "active" && status !== "disabled") {
      return Response.json(
        { error: "Invalid status. Must be 'active' or 'disabled'" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await getUserById(id);
    if (!existingUser) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const { getUserByEmail } = await import("@/lib/db/queries");
      const emailTaken = await getUserByEmail(email);
      if (emailTaken) {
        return Response.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: Partial<Omit<NewAdminUser, "id" | "createdAt">> = {};
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name || null;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (passwordHash !== undefined) updateData.passwordHash = passwordHash || null;

    const updatedUser = await updateUser(id, updateData);

    if (!updatedUser) {
      return Response.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return Response.json(updatedUser);
  } catch (error) {
    console.error("[PATCH /api/users/[id]] Error:", error);

    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes("unique")) {
      return Response.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]
 * Delete a user by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return Response.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await getUserById(id);
    if (!existingUser) {
      return Response.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const deleted = await deleteUser(id);

    if (!deleted) {
      return Response.json(
        { error: "Failed to delete user" },
        { status: 500 }
      );
    }

    return Response.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/users/[id]] Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


