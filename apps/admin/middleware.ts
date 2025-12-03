import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { ...req.cookies } }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");
  const isLogin = req.nextUrl.pathname === "/login";

  // Not logged in
  if (!user && isAdminRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in non-admin trying to access admin panel
  if (user?.user_metadata?.role !== "admin" && isAdminRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Already authenticated user visiting login page
  if (user && isLogin) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
