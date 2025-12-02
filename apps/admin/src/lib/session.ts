import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type SessionData = {
  userId: string;
  email: string;
};

// In-memory session store: sessionId -> userId
// In production, this should be stored in a database or Redis
const sessionStore = new Map<string, string>();

/**
 * Save admin session
 */
export function saveAdminSession(sessionId: string, userId: string): void {
  sessionStore.set(sessionId, userId);
}

/**
 * Get admin session by session ID
 */
export function getAdminSessionById(sessionId: string): string | null {
  return sessionStore.get(sessionId) ?? null;
}

/**
 * Delete admin session by session ID
 */
export function deleteAdminSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}

/**
 * Create admin session cookie
 */
export async function createAdminSession(userId: string, email: string) {
  const cookieStore = await cookies();
  const sessionData: SessionData = { userId, email };

  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Get admin session from request
 */
export async function getAdminSession(
  request?: NextRequest
): Promise<SessionData | null> {
  try {
    let sessionCookie: string | undefined;

    if (request) {
      sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    } else {
      const cookieStore = await cookies();
      sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    }

    if (!sessionCookie) {
      return null;
    }

    const sessionData: SessionData = JSON.parse(sessionCookie);
    return sessionData;
  } catch (error) {
    console.error("Error parsing admin session:", error);
    return null;
  }
}

/**
 * Destroy admin session cookie
 */
export async function destroyAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

