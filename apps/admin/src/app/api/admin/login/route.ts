import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { getUserByEmail } from "@/lib/db/queries";
import { saveAdminSession } from "@/lib/session";

/**
 * POST /api/admin/login
 * Authenticate admin user by email and create session
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email } = body;

    // Validate required fields
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate that email exists in admin_users table
    const adminUser = await getUserByEmail(email.trim());

    if (!adminUser) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 401 }
      );
    }

    // Generate a new admin session ID
    const sessionId = randomUUID();

    // Save the session
    saveAdminSession(sessionId, adminUser.id);

    // Set cookie "admin_session" with sessionId
    const cookieStore = await cookies();
    cookieStore.set("admin_session", sessionId, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("[POST /api/admin/login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
