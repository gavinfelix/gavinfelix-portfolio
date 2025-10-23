import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  try {
    console.log("[auth/guest] called");

    const redirectUrl =
      new URL(request.url).searchParams.get("redirectUrl") || "/";

    console.log("[auth/guest] creating guest user...");
    const result = await signIn("guest");
    console.log("[auth/guest] signIn result:", result);

    const response = NextResponse.redirect(new URL(redirectUrl, request.url));

    return response;
  } catch (error) {
    console.error("[auth/guest] error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
