import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export const config = {
  matcher: ["/admin/:path*"],
};

export async function middleware(req: NextRequest) {
  const session = await auth();
  const { pathname } = req.nextUrl;

  const isLoginPage = pathname.startsWith("/admin/login");
  const isProtectedPage = pathname.startsWith("/admin") && !isLoginPage;

  if (isProtectedPage && !session?.user) {
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && session?.user) {
    const dashboardUrl = new URL("/admin", req.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}
