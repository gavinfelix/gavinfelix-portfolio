// Minimal session endpoint - returns only essential user identity
// Optimized for performance: < 200ms target, no heavy DB queries
import { auth } from "@/app/(auth)/auth";

export async function GET() {
  const startTime = Date.now();
  let authTime = 0;
  let totalTime = 0;

  try {
    // Step 1: Read auth token/cookie (fast, no DB)
    const authStart = Date.now();
    const session = await auth();
    authTime = Date.now() - authStart;

    // Step 2: Return minimal session data (no DB queries)
    // All user info is already in JWT/session token
    const response = session?.user
      ? {
          userId: session.user.id,
          email: session.user.email || null,
          name: session.user.name || null,
          role: session.user.type, // 'guest' | 'regular'
          expiresAt: session.expires || null,
        }
      : null;

    totalTime = Date.now() - startTime;

    // Log performance metrics
    console.log({
      step: "session",
      authMs: authTime,
      totalMs: totalTime,
      hasUser: !!session?.user,
    });

    // Return 401 if not authenticated, 200 with data if authenticated
    if (!response) {
      return Response.json(null, { status: 401 });
    }

    return Response.json(response, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    totalTime = Date.now() - startTime;
    console.error({
      step: "session_error",
      error: error instanceof Error ? error.message : "Unknown error",
      totalMs: totalTime,
    });

    return Response.json(null, { status: 401 });
  }
}

