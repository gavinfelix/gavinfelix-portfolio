// RAG document upload API endpoint
// Handles file upload, text chunking, embedding generation, and database storage
import { embedMany } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { ChatSDKError } from "@/lib/errors";
import { getEmbeddingModel } from "@/lib/ai/providers";
import { generateUUID } from "@/lib/utils";
import postgres from "postgres";

// Database connection setup
const client = postgres(process.env.POSTGRES_URL!);

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Chunk configuration
const CHUNK_SIZE = 2000; // characters per chunk
const CHUNK_OVERLAP = 200; // characters overlap between chunks

// Allowed file types
const ALLOWED_MIME_TYPES = ["text/plain", "text/markdown"];
const ALLOWED_EXTENSIONS = [".txt", ".md"];

/**
 * Split text into chunks with overlap
 */
function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);
    chunks.push(chunk);

    // Move start position forward by chunkSize - overlap
    start += chunkSize - overlap;

    // If we're at the end, break
    if (end >= text.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Generate title from text content (first 80 characters or filename)
 */
function generateTitle(content: string, filename: string): string {
  // Try to extract a meaningful title from content
  const lines = content.trim().split("\n");
  const firstLine = lines[0]?.trim() || "";

  if (firstLine.length > 0 && firstLine.length <= 80) {
    return firstLine;
  }

  // Use first 80 characters of content
  if (content.trim().length > 0) {
    return content.trim().slice(0, 80);
  }

  // Fallback to filename without extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
  return nameWithoutExt || "Untitled Document";
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user ID is a valid UUID (fallback users have IDs like "fallback-{timestamp}")
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        userId
      );

    if (!isValidUUID) {
      return NextResponse.json(
        { error: "RAG upload is only available for registered users" },
        { status: 403 }
      );
    }

    if (request.body === null) {
      return NextResponse.json(
        { error: "Request body is empty" },
        { status: 400 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File size exceeds maximum allowed size of ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        },
        { status: 400 }
      );
    }

    // Validate file type by extension (primary) and MIME type (fallback)
    const filename = file.name;
    const lastDotIndex = filename.lastIndexOf(".");
    const extension =
      lastDotIndex >= 0 ? filename.toLowerCase().substring(lastDotIndex) : "";
    const mimeType = file.type || "";

    console.log("[POST /api/rag/upload] File validation:", {
      filename,
      extension,
      mimeType,
      size: file.size,
    });

    const isValidExtension = ALLOWED_EXTENSIONS.some(
      (ext) => extension === ext
    );
    const isValidMimeType = ALLOWED_MIME_TYPES.includes(mimeType);

    // Accept file if extension is valid OR if MIME type is valid
    if (!isValidExtension && !isValidMimeType) {
      console.error("[POST /api/rag/upload] File type validation failed:", {
        extension: extension || "none",
        mimeType: mimeType || "unknown",
        allowedExtensions: ALLOWED_EXTENSIONS,
        allowedMimeTypes: ALLOWED_MIME_TYPES,
      });
      return NextResponse.json(
        {
          error: `File type not supported. Allowed types: ${ALLOWED_EXTENSIONS.join(
            ", "
          )}. Received: ${extension || "no extension"}${
            mimeType ? ` (MIME: ${mimeType})` : ""
          }`,
        },
        { status: 400 }
      );
    }

    if (isValidExtension) {
      console.log(
        `[POST /api/rag/upload] File type validated by extension: ${extension}`
      );
    } else if (isValidMimeType) {
      console.log(
        `[POST /api/rag/upload] File type validated by MIME type: ${mimeType}`
      );
    }

    // Read file content as UTF-8 text
    let fileContent: string;
    try {
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder("utf-8");
      fileContent = decoder.decode(buffer);
    } catch (error) {
      console.error("[POST /api/rag/upload] Error reading file:", error);
      return NextResponse.json(
        { error: "Failed to read file content" },
        { status: 400 }
      );
    }

    // Validate content is not empty
    if (!fileContent || fileContent.trim().length === 0) {
      return NextResponse.json(
        { error: "File is empty or contains no readable text" },
        { status: 400 }
      );
    }

    // Generate title
    const title = generateTitle(fileContent, filename);

    // Split text into chunks
    const chunks = chunkText(fileContent, CHUNK_SIZE, CHUNK_OVERLAP);

    if (chunks.length === 0) {
      return NextResponse.json(
        { error: "Failed to create text chunks" },
        { status: 400 }
      );
    }

    console.log(
      `[POST /api/rag/upload] Processing document: ${filename}, ${chunks.length} chunks`
    );

    // Generate embeddings using AI SDK embedMany
    // This uses the same Gateway/authentication setup as the chat API
    const { model: embeddingModel, error: embeddingError } =
      getEmbeddingModel();

    if (!embeddingModel) {
      const errorMessage =
        embeddingError || "Embedding model is not configured";
      console.error(`[POST /api/rag/upload] ${errorMessage}`);
      return NextResponse.json(
        {
          error: errorMessage,
        },
        { status: 500 }
      );
    }

    let embeddings: number[][];
    try {
      console.log(
        `[POST /api/rag/upload] Generating embeddings for ${chunks.length} chunks using AI SDK`
      );
      const result = await embedMany({
        model: embeddingModel,
        values: chunks,
      });

      // Extract embeddings from result
      embeddings = result.embeddings;

      if (!embeddings || embeddings.length !== chunks.length) {
        throw new Error(
          `Expected ${chunks.length} embeddings, got ${embeddings?.length || 0}`
        );
      }

      // Validate embedding dimensions (should be 1536 for text-embedding-3-small)
      const firstEmbedding = embeddings[0];
      if (!firstEmbedding || firstEmbedding.length !== 1536) {
        throw new Error(
          `Invalid embedding dimensions: expected 1536, got ${
            firstEmbedding?.length || 0
          }`
        );
      }

      console.log(
        `[POST /api/rag/upload] Successfully generated ${embeddings.length} embeddings`
      );
    } catch (embeddingError) {
      // Handle embedding generation errors specifically
      console.error(
        "[POST /api/rag/upload] Error generating embeddings:",
        embeddingError
      );

      if (embeddingError instanceof Error) {
        return NextResponse.json(
          {
            error: `Embedding generation failed: ${embeddingError.message}`,
          },
          { status: 500 }
        );
      }

      // Re-throw to be caught by outer catch block
      throw embeddingError;
    }

    // Generate document ID
    const documentId = generateUUID();

    // Insert document into database
    await client`
      INSERT INTO documents (id, user_id, title, original_filename, created_at)
      VALUES (${documentId}, ${userId}, ${title}, ${filename}, NOW())
    `;

    // Insert chunks into database
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[POST /api/rag/upload] 💾 STORING CHUNKS IN DATABASE");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  - Table: document_chunks");
    console.log("  - Columns: id, document_id, chunk_index, content, embedding, created_at");
    console.log("  - documentId (type:", typeof documentId, "):", documentId);
    console.log("  - Total chunks to insert:", chunks.length);
    console.log("  - Total embeddings generated:", embeddings.length);
    
    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = generateUUID();
        const embedding = embeddings[i];
        const content = chunks[i];

        if (!embedding || embedding.length !== 1536) {
          console.error(
            `[POST /api/rag/upload] Invalid embedding for chunk ${i}`
          );
          throw new Error(`Failed to generate embedding for chunk ${i + 1}`);
        }

        // Format embedding array as PostgreSQL vector string
        // PostgreSQL pgvector expects format: [1.0,2.0,3.0]
        const embeddingString = `[${embedding.join(",")}]`;

        // Log first chunk details
        if (i === 0) {
          console.log("  - First chunk preview:");
          console.log("    * Chunk index:", i);
          console.log("    * Content preview (120 chars):", content.substring(0, 120));
          console.log("    * Content length:", content.length, "characters");
          console.log("    * Embedding dimensions:", embedding.length);
          console.log("    * Embedding is non-null:", embedding !== null && embedding !== undefined);
          console.log("    * document_id value:", documentId);
          console.log("    * document_id type:", typeof documentId);
        }

        await client`
          INSERT INTO document_chunks (
            id,
            document_id,
            chunk_index,
            content,
            embedding,
            created_at
          )
          VALUES (
            ${chunkId},
            ${documentId},
            ${i},
            ${content},
            ${embeddingString}::vector,
            NOW()
          )
        `;
      }
      
      console.log("  - ✅ Successfully inserted", chunks.length, "chunks");
      console.log("  - documentId used for all chunks:", documentId);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } catch (chunkError) {
      console.error(
        "[POST /api/rag/upload] Error inserting chunks:",
        chunkError
      );
      // Clean up document if chunk insertion fails
      try {
        await client`DELETE FROM documents WHERE id = ${documentId}`;
      } catch (cleanupError) {
        console.error(
          "[POST /api/rag/upload] Error during cleanup:",
          cleanupError
        );
      }
      throw chunkError;
    }

    console.log(
      `[POST /api/rag/upload] Successfully processed document: ${documentId}, ${chunks.length} chunks`
    );

    return NextResponse.json({
      documentId,
      documentTitle: title,
      originalFilename: filename,
      chunkCount: chunks.length,
    });
  } catch (error) {
    console.error("[POST /api/rag/upload] Error:", error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    if (error instanceof Error) {
      // Check if it's a database error
      if (
        error.message.includes("POSTGRES_URL") ||
        error.message.includes("database")
      ) {
        return NextResponse.json(
          { error: "Database connection failed" },
          { status: 500 }
        );
      }

      // Return the actual error message if available
      return NextResponse.json(
        { error: error.message || "Failed to process document upload" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process document upload" },
      { status: 500 }
    );
  }
}
