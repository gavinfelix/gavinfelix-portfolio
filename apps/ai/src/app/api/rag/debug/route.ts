// RAG debug API endpoint
// Allows inspection of chunks stored for a given documentId
// This is a development/debugging endpoint
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import postgres from "postgres";

// Database connection setup
const client = postgres(process.env.POSTGRES_URL!);

export async function GET(request: Request) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[GET /api/rag/debug] 🔍 DEBUG ENDPOINT CALLED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.log("  - ❌ Unauthorized: No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    console.log("  - User ID:", userId);

    // Get documentId from query parameters
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      console.log("  - ❌ Missing documentId parameter");
      return NextResponse.json(
        {
          error: "Missing documentId parameter",
          message: "Please provide documentId as a query parameter: /api/rag/debug?documentId=<uuid>",
        },
        { status: 400 }
      );
    }

    console.log("  - documentId requested:", documentId);
    console.log("  - documentId type:", typeof documentId);

    // Check if user ID is a valid UUID (fallback users have IDs like "fallback-{timestamp}")
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId
      );

    if (!isValidUUID) {
      console.log("  - ⚠️ User is not a valid UUID (fallback user)");
      return NextResponse.json(
        {
          error: "RAG debug is only available for registered users",
        },
        { status: 403 }
      );
    }

    // Query document_chunks table filtered by documentId
    // No vector similarity, no extra filters - just simple inspection
    console.log("  - Querying document_chunks table...");
    console.log("    * Table: document_chunks");
    console.log("    * Filter: document_id =", documentId);
    console.log("    * Limit: 20 rows");
    console.log("    * Order: created_at ASC");

    const chunks = await client`
      SELECT 
        id,
        document_id,
        chunk_index,
        content,
        CASE 
          WHEN embedding IS NULL THEN false
          ELSE true
        END as has_embedding,
        created_at
      FROM document_chunks
      WHERE document_id = ${documentId}
      ORDER BY created_at ASC
      LIMIT 20
    `;

    const totalChunks = chunks.length;
    console.log("  - Query results:");
    console.log("    * Total chunks found:", totalChunks);

    // Format response
    const chunkData = chunks.map((chunk: any) => {
      const contentPreview = chunk.content
        ? chunk.content.length > 200
          ? chunk.content.substring(0, 200) + "..."
          : chunk.content
        : null;

      return {
        id: chunk.id,
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        contentPreview: contentPreview,
        contentLength: chunk.content?.length || 0,
        hasEmbedding: chunk.has_embedding,
        createdAt: chunk.created_at,
      };
    });

    // Log first chunk details for debugging
    if (chunks.length > 0) {
      const firstChunk = chunks[0];
      console.log("    * First chunk details:");
      console.log("      - Chunk ID:", firstChunk.id);
      console.log("      - document_id:", firstChunk.document_id);
      console.log("      - document_id type:", typeof firstChunk.document_id);
      console.log("      - chunk_index:", firstChunk.chunk_index);
      console.log("      - Content preview (200 chars):", firstChunk.content?.substring(0, 200) || "null");
      console.log("      - Content length:", firstChunk.content?.length || 0);
      console.log("      - has_embedding:", firstChunk.has_embedding);
      console.log("      - created_at:", firstChunk.created_at);

      // Compare documentId formats
      console.log("    * documentId comparison:");
      console.log("      - Requested documentId:", documentId, "(type:", typeof documentId, ")");
      console.log("      - DB document_id:", firstChunk.document_id, "(type:", typeof firstChunk.document_id, ")");
      console.log("      - Values match:", String(documentId) === String(firstChunk.document_id));
      console.log("      - Types match:", typeof documentId === typeof firstChunk.document_id);
    } else {
      console.warn("    * ⚠️ NO CHUNKS FOUND for documentId:", documentId);
      console.warn("    * This means either:");
      console.warn("      1. Chunks were never inserted for this documentId");
      console.warn("      2. documentId doesn't match what was stored");
      console.warn("      3. Chunks were deleted");
    }

    const response = {
      documentId: documentId,
      totalChunks: totalChunks,
      chunks: chunkData,
      message:
        totalChunks === 0
          ? "No chunks found for this documentId"
          : `Found ${totalChunks} chunk(s) for this documentId`,
    };

    console.log("  - ✅ Response prepared");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("[GET /api/rag/debug] Error:", error);
    if (error instanceof Error) {
      console.error("  - Error message:", error.message);
      console.error("  - Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}






