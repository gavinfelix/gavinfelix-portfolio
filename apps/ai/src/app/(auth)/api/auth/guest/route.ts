import { NextResponse } from "next/server";
import { signIn } from "@/app/(auth)/auth";

export async function GET(request: Request) {
  try {
    const redirectUrl =
      new URL(request.url).searchParams.get("redirectUrl") || "/";

    const result = await signIn("guest", {
      redirect: false,
      email: `guest-${Date.now()}`,
      password: "dummy",
    });

    if (result?.error) {
      console.error("[auth/guest] Authentication failed:", result.error);
      return NextResponse.json(
        { error: "Failed to create guest session" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  } catch (error) {
    console.error("[auth/guest] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
