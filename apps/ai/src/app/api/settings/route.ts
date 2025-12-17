import { auth } from "@/app/(auth)/auth";
import {
  getUserSettings,
  upsertUserSettings,
} from "@/features/settings/lib/user-settings-client";
import { ChatSDKError } from "@/lib/errors";
import { isValidUUID } from "@/lib/utils";

// API route for user settings
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate user ID is a valid UUID before querying database
    // Fallback users (e.g., "fallback-1764403716806") are not valid UUIDs
    if (!isValidUUID(session.user.id)) {
      console.log(
        "[GET /api/settings] Invalid UUID for user ID, returning null:",
        session.user.id
      );
      return Response.json(null);
    }

    const settings = await getUserSettings(session.user.id);

    return Response.json(settings);
  } catch (error) {
    console.error("[GET /api/settings] Error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate user ID is a valid UUID before querying database
    // Fallback users (e.g., "fallback-1764403716806") are not valid UUIDs
    if (!isValidUUID(session.user.id)) {
      console.log(
        "[PUT /api/settings] Invalid UUID for user ID, returning error:",
        session.user.id
      );
      return new Response(
        JSON.stringify({ error: "Invalid user ID format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();
    const { model, temperature, maxTokens, useTemplatesAsSystem } = body;

    const settings = await upsertUserSettings(session.user.id, {
      model: model || null,
      // Handle temperature: 0 is a valid value, so check for undefined/null explicitly
      temperature:
        temperature !== undefined && temperature !== null
          ? String(temperature)
          : null,
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
