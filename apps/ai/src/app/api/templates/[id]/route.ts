import { auth } from "@/app/(auth)/auth";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { ChatSDKError } from "@/lib/errors";
import { promptTemplates, type PromptTemplate } from "@/lib/db/schema";

// Database connection setup
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// PUT: Update an existing template (only if it belongs to the current user)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;
    const userId = session.user.id;
    const body = await request.json();

    // Validate request body
    const { name, description, content, isFavorite } = body;

    // Check if template exists and belongs to the current user
    const [existingTemplate] = await db
      .select()
      .from(promptTemplates)
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
      .limit(1);

    if (!existingTemplate) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build update object with only provided fields
    const updateData: Partial<PromptTemplate> = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Name must be a non-empty string" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description === null || description === "" 
        ? null 
        : description.trim();
    }

    if (content !== undefined) {
      if (typeof content !== "string" || content.trim().length === 0) {
        return new Response(
          JSON.stringify({ error: "Content must be a non-empty string" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.content = content.trim();
    }

    if (isFavorite !== undefined) {
      if (typeof isFavorite !== "boolean") {
        return new Response(
          JSON.stringify({ error: "isFavorite must be a boolean" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      updateData.isFavorite = isFavorite;
    }

    // If no fields to update, return the existing template
    if (Object.keys(updateData).length === 0) {
      return Response.json(existingTemplate);
    }

    // Update the template
    const [updatedTemplate] = await db
      .update(promptTemplates)
      .set(updateData)
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
      .returning();

    if (!updatedTemplate) {
      return new Response(
        JSON.stringify({ error: "Failed to update template" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return Response.json(updatedTemplate);
  } catch (error) {
    console.error("[PUT /api/templates/:id] Error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// DELETE: Delete an existing template (only if it belongs to the current user)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check if template exists and belongs to the current user
    const [existingTemplate] = await db
      .select()
      .from(promptTemplates)
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)))
      .limit(1);

    if (!existingTemplate) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the template
    await db
      .delete(promptTemplates)
      .where(and(eq(promptTemplates.id, id), eq(promptTemplates.userId, userId)));

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/templates/:id] Error:", error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

