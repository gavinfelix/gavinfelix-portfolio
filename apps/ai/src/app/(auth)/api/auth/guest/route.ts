import { NextResponse } from "next/server";
import { createGuestUser } from "@/lib/db/queries";
import { getToken } from "next-auth/jwt";
import { encode } from "next-auth/jwt";

export async function GET(request: Request) {
  try {
    console.log("[auth/guest] called");
    const redirectUrl =
      new URL(request.url).searchParams.get("redirectUrl") || "/";

    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
    console.log("[auth/guest] existing token:", token);
    console.log("[auth/guest] NODE_ENV:", process.env.NODE_ENV);
    console.log("[auth/guest] request url:", request.url);
    console.log(
      "[auth/guest] request headers cookie:",
      request.headers.get("cookie")
    );
    if (token) {
      console.log("[auth/guest] token exists, redirecting...");
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    console.log("[auth/guest] creating guest user...");
    const [guestUser] = await createGuestUser();
    console.log("[auth/guest] guest user:", guestUser);

    const jwt = await encode({
      token: { id: guestUser.id, type: "guest" },
      secret: process.env.AUTH_SECRET!,
      salt: "next-auth.session-token",
    });
    console.log("[auth/guest] jwt:", jwt);

    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.redirect(new URL(redirectUrl, request.url));
    response.cookies.set({
      name: "next-auth.session-token",
      value: jwt,
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
    });
    console.log("[auth/guest] cookie set, redirecting...");
    return response;
  } catch (error) {
    console.error("[auth/guest] error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
