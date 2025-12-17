// Returns paginated chat history for authenticated users
import type { NextRequest } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { getChatsByUserId } from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import { isValidUUID } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);
  const startingAfter = searchParams.get("starting_after");
  const endingBefore = searchParams.get("ending_before");

  if (startingAfter && endingBefore) {
    return new ChatSDKError(
      "bad_request:api",
      "Only one of starting_after or ending_before can be provided."
    ).toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  // Validate user ID is a valid UUID before querying database
  // Fallback users (e.g., "fallback-1764403716806") are not valid UUIDs
  if (!isValidUUID(session.user.id)) {
    console.log(
      "[GET /api/history] Invalid UUID for user ID, returning empty result:",
      session.user.id
    );
    return Response.json({
      chats: [],
      hasMore: false,
    });
  }

  console.log("[GET /api/history] Fetching chats for user:", session.user.id);

  const chats = await getChatsByUserId({
    id: session.user.id,
    limit,
    startingAfter,
    endingBefore,
  });

  console.log("[GET /api/history] Found chats:", {
    count: chats.chats.length,
    hasMore: chats.hasMore,
  });

  // Return chats in the format expected by the frontend
  return Response.json({
    chats: chats.chats,
    hasMore: chats.hasMore,
  });
}
