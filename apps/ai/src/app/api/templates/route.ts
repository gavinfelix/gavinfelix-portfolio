import { auth } from "@/app/(auth)/auth";
import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "@/lib/errors";
import { promptTemplates, type PromptTemplate } from "@/lib/db/schema";
import { isValidUUID } from "@/lib/utils";

// Database connection setup
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// GET: List all templates for the current user
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
        "[GET /api/templates] Invalid UUID for user ID, returning empty array:",
        session.user.id
      );
      return Response.json([]);
    }

    const userId = session.user.id;

    // Query templates for the current user, ordered by created_at desc
    const templates = await db
      .select()
      .from(promptTemplates)
      .where(eq(promptTemplates.userId, userId))
      .orderBy(desc(promptTemplates.createdAt));

    return Response.json(templates);
  } catch (error) {
    console.error("[GET /api/templates] Error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST: Create a new template for the current user
export async function POST(request: Request) {
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
        "[POST /api/templates] Invalid UUID for user ID, returning error:",
        session.user.id
      );
      return new Response(
        JSON.stringify({ error: "Invalid user ID format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const { name, description, content, isFavorite } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Name is required and must be a non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Content is required and must be a non-empty string" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create new template
    const [newTemplate] = await db
      .insert(promptTemplates)
      .values({
        userId,
        name: name.trim(),
        description: description?.trim() || null,
        content: content.trim(),
        isFavorite: isFavorite === true,
      })
      .returning();

    if (!newTemplate) {
      return new Response(
        JSON.stringify({ error: "Failed to create template" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return Response.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error("[POST /api/templates] Error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

