import { NextResponse } from "next/server";
import { createGuestUser } from "@/lib/db/queries";
import { getToken } from "next-auth/jwt";
import { encodeJwt } from "@/lib/auth/jwt";

export async function GET(request: Request) {
  const redirectUrl =
    new URL(request.url).searchParams.get("redirectUrl") || "/chat";

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  if (token) {
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  const [guestUser] = await createGuestUser();

  // 生成 JWT token 手动写入 cookie
  const jwt = encodeJwt({ id: guestUser.id, type: "guest" });
  const response = NextResponse.redirect(new URL(redirectUrl, request.url));
  response.headers.append(
    "Set-Cookie",
    `next-auth.session-token=${jwt}; Path=/; HttpOnly; Secure; SameSite=Lax`
  );

  return response;
}
