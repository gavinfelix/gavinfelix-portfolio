"use server";

import { cookies } from "next/headers";

export async function setGuestCookie(token: string) {
  const cookieStore = await cookies(); // ✅ await
  cookieStore.set({
    name: "next-auth.session-token",
    value: token,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
}
