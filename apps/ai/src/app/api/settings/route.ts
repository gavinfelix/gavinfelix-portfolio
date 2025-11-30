import { auth } from "@/app/(auth)/auth";
import {
  getUserSettings,
  upsertUserSettings,
} from "@/features/settings/lib/user-settings-client";
import { ChatSDKError } from "@/lib/errors";

// API route for user settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const settings = await getUserSettings(session.user.id);

    return Response.json(settings);
  } catch (error) {
    console.error("[GET /api/settings] Error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { model, temperature, maxTokens, useTemplatesAsSystem } = body;

    const settings = await upsertUserSettings(session.user.id, {
      model: model || null,
      temperature: temperature ? String(temperature) : null,
      maxTokens: maxTokens || null,
      useTemplatesAsSystem:
        useTemplatesAsSystem !== undefined ? useTemplatesAsSystem : null,
    });

    return Response.json(settings);
  } catch (error) {
    console.error("[PUT /api/settings] Error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

