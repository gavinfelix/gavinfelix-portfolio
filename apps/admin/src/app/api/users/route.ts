import { NextRequest } from "next/server";
import { getUsers, createUser } from "@/lib/db/queries";
import type { NewAdminUser } from "@/lib/db/schema";

/**
 * GET /api/users
 * Get all users with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || undefined;
    const role = searchParams.get("role") as "admin" | "user" | null;
    const status = searchParams.get("status") as "active" | "disabled" | null;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return Response.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    const result = await getUsers({
      page,
      limit,
      search,
      role: role || undefined,
      status: status || undefined,
    });

    return Response.json(result);
  } catch (error) {
    console.error("[GET /api/users] Error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, role, status } = body;

    // Validate required fields
    if (!email || typeof email !== "string") {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
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

    // Check if user already exists
    const { getUserByEmail } = await import("@/lib/db/queries");
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return Response.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Create user
    const userData: Omit<NewAdminUser, "id" | "createdAt" | "updatedAt"> = {
      email,
      name: name || null,
      role: role || "user",
      status: status || "active",
      passwordHash: null, // Can be set later for authentication
    };

    const user = await createUser(userData);

    return Response.json(user, { status: 201 });
  } catch (error) {
    console.error("[POST /api/users] Error:", error);
    
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


