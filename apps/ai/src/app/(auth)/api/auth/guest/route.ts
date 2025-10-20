import { NextResponse } from "next/server";
import { createGuestUser } from "@/lib/db/queries";
import { getToken } from "next-auth/jwt";
import { encodeJwt } from "@/lib/auth/jwt";
import { encode } from "next-auth/jwt";

export async function GET(request: Request) {
  const redirectUrl =
    new URL(request.url).searchParams.get("redirectUrl") || "/";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  const [guestUser] = await createGuestUser();

  // create JWT token into cookie
  const jwt = await encode({
    token: { id: guestUser.id, type: "guest" },
    secret: process.env.AUTH_SECRET!,
    salt: "authjs.session-token",
  });
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.cookies.set({
    name: "next-auth.session-token",
    value: jwt,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });

  return response;
}
