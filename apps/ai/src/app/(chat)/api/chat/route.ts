// Main chat API endpoint for handling message streaming and tool execution
import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
  embed,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { unstable_cache as cache } from "next/cache";
import { after } from "next/server";
import {
  createResumableStreamContext,
  type ResumableStreamContext,
} from "resumable-stream";
import type { ModelCatalog } from "tokenlens/core";
import { fetchModels } from "tokenlens/fetch";
import { getUsage } from "tokenlens/helpers";
import { auth, type UserType } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/visibility-selector";
import { entitlementsByUserType } from "@/lib/ai/entitlements";
import type { ChatModel } from "@/lib/ai/models";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { getEmbeddingModel, myProvider } from "@/lib/ai/providers";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { isProductionEnvironment } from "@/lib/constants";
import {
  createStreamId,
  deleteChatById,
  getChatById,
  getMessageCountByUserId,
  getMessagesByChatId,
  saveChat,
  saveMessages,
  updateChatLastContextById,
} from "@/lib/db/queries";
import { ChatSDKError } from "@/lib/errors";
import type { ChatMessage } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import {
  convertToUIMessages,
  generateUUID,
  getTextFromMessage,
} from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";
import { getUserSettings } from "@/features/settings/lib/user-settings-client";
import postgres from "postgres";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

// Database connection for RAG queries
const postgresClient = postgres(process.env.POSTGRES_URL!);

/**
 * Generate embedding using AI SDK (via OpenAI provider)
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const { model: embeddingModel, error: embeddingError } = getEmbeddingModel();

  if (!embeddingModel) {
    const errorMessage = embeddingError || "Embedding model is not configured";
    throw new Error(errorMessage);
  }

  const result = await embed({
    model: embeddingModel,
    value: text,
  });

  return result.embedding;
}

/**
 * Retrieve relevant document chunks using vector similarity search
 * Uses parameterized query equivalent to:
 * SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY embedding <-> $2::vector LIMIT $3
 */
async function retrieveDocumentChunks(
  documentId: string,
  queryEmbedding: number[],
  limit: number = 3
): Promise<{ chunks: string[]; source: "similarity" | "fallback" | "none" }> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[retrieveDocumentChunks] 🔍 STARTING RETRIEVAL");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  - documentId (type:", typeof documentId, "):", documentId);
  console.log("  - Query embedding dimensions:", queryEmbedding.length);
  console.log("  - Limit:", limit);
  console.log("  - Table: document_chunks");
  console.log("  - Filter column: document_id");

  // STEP 1: Simple query to verify chunks exist for this documentId
  console.log(
    "\n[retrieveDocumentChunks] STEP 1: Simple query (documentId only, no similarity)"
  );
  try {
    const simpleChunks = await postgresClient`
      SELECT 
        id,
        document_id,
        chunk_index,
        content,
        CASE 
          WHEN embedding IS NULL THEN 'NULL'
          ELSE 'NOT NULL'
        END as embedding_status,
        created_at
      FROM document_chunks
      WHERE document_id = ${documentId}
      LIMIT 5
    `;

    console.log("  - Simple query results:");
    console.log("    * Rows found:", simpleChunks.length);

    if (simpleChunks.length > 0) {
      console.log("    * ✅ Chunks EXIST in database for this documentId");
      console.log("    * First row details:");
      const firstRow = simpleChunks[0];
      console.log("      - Row id:", firstRow.id);
      console.log("      - document_id value:", firstRow.document_id);
      console.log("      - document_id type:", typeof firstRow.document_id);
      console.log("      - chunk_index:", firstRow.chunk_index);
      console.log(
        "      - content preview (120 chars):",
        firstRow.content?.substring(0, 120) || "null"
      );
      console.log("      - embedding_status:", firstRow.embedding_status);
      console.log("      - created_at:", firstRow.created_at);

      // Compare documentId formats
      console.log("    * documentId comparison:");
      console.log(
        "      - Query documentId:",
        documentId,
        "(type:",
        typeof documentId,
        ")"
      );
      console.log(
        "      - DB document_id:",
        firstRow.document_id,
        "(type:",
        typeof firstRow.document_id,
        ")"
      );
      console.log(
        "      - Values match:",
        String(documentId) === String(firstRow.document_id)
      );
      console.log(
        "      - Types match:",
        typeof documentId === typeof firstRow.document_id
      );

      // Show all rows
      if (simpleChunks.length > 1) {
        console.log("    * All", simpleChunks.length, "rows:");
        simpleChunks.forEach((row, idx) => {
          console.log(
            `      [${idx}] document_id: ${row.document_id}, embedding: ${
              row.embedding_status
            }, content: ${row.content?.substring(0, 50)}...`
          );
        });
      }
    } else {
      console.warn(
        "    * ⚠️ NO CHUNKS FOUND in database for documentId:",
        documentId
      );
      console.warn(
        "    * This means chunks were either not inserted or documentId doesn't match"
      );
    }
  } catch (error) {
    console.error("    * ❌ Error in simple query:", error);
  }

  // STEP 2: Similarity-based query (the actual RAG query)
  console.log(
    "\n[retrieveDocumentChunks] STEP 2: Similarity-based query (vector search)"
  );
  console.log("  - WHERE condition: document_id =", documentId);
  console.log("  - ORDER BY: embedding <-> query_embedding::vector");
  console.log("  - LIMIT:", limit);

  // Format embedding array as PostgreSQL vector string
  const embeddingString = `[${queryEmbedding.join(",")}]`;
  console.log(
    "  - Query embedding string length:",
    embeddingString.length,
    "characters"
  );
  console.log(
    "  - Query embedding preview (first 100 chars):",
    embeddingString.substring(0, 100),
    "..."
  );

  let similarityChunks: string[] = [];
  let fallbackChunks: string[] = [];

  try {
    // Query Supabase using parameterized query (postgres template literals are automatically parameterized)
    // Equivalent SQL: SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY embedding <-> $2::vector LIMIT $3
    console.log("  - Final SQL (with params):");
    console.log(
      "    SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY embedding <-> $2::vector LIMIT $3"
    );
    console.log(
      "    Parameter $1 (documentId):",
      documentId,
      "(type:",
      typeof documentId,
      ")"
    );
    console.log(
      "    Parameter $2 (embedding): [vector string, length:",
      embeddingString.length,
      "]"
    );
    console.log("    Parameter $3 (limit):", limit);

    const chunks = await postgresClient`
      SELECT content
      FROM document_chunks
      WHERE document_id = ${documentId}
      ORDER BY embedding <-> ${embeddingString}::vector
      LIMIT ${limit}
    `;

    similarityChunks = chunks.map((chunk: any) => chunk.content);

    console.log("  - Similarity query results:");
    console.log("    * Rows returned:", chunks.length);
    console.log("    * Chunk contents extracted:", similarityChunks.length);

    if (chunks.length === 0) {
      console.warn("    * ⚠️ ZERO chunks returned from similarity query!");
      console.warn("    * Possible causes:");
      console.warn("      1. Embedding column type mismatch");
      console.warn("      2. Vector operator (<->) not working");
      console.warn("      3. Additional filters excluding rows");
      console.warn("      4. Embedding format mismatch");
      console.log("    * Will attempt fallback query...");
    } else {
      console.log(
        "    * ✅ Similarity query returned",
        chunks.length,
        "chunks"
      );
      // Log first chunk preview (80-120 characters as requested)
      if (similarityChunks.length > 0 && similarityChunks[0]) {
        const firstChunkPreview = similarityChunks[0].substring(0, 120);
        console.log(
          "    * First chunk preview (120 chars):",
          firstChunkPreview
        );
        console.log(
          "    * First chunk full length:",
          similarityChunks[0].length,
          "characters"
        );
      }
    }
  } catch (error) {
    console.error("    * ❌ Error in similarity query:", error);
    if (error instanceof Error) {
      console.error("    * Error message:", error.message);
      console.error("    * Error stack:", error.stack);
    }
    console.log("    * Will attempt fallback query...");
  }

  // STEP 3: Fallback query (if similarity returned zero chunks)
  // This query MUST match the debug endpoint exactly
  if (similarityChunks.length === 0) {
    console.log(
      "\n[retrieveDocumentChunks] STEP 3: Fallback query (documentId only, no similarity)"
    );
    console.log("  - Triggered because similarity query returned 0 chunks");
    console.log("  - Table: document_chunks");
    console.log("  - Filter column: document_id");
    console.log("  - WHERE condition: document_id =", documentId);
    console.log("  - ORDER BY: created_at ASC");
    console.log("  - LIMIT: 5 chunks");
    console.log("  - Final SQL (with params):");
    console.log(
      "    SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY created_at ASC LIMIT 5"
    );
    console.log(
      "    Parameter $1 (documentId):",
      documentId,
      "(type:",
      typeof documentId,
      ")"
    );

    try {
      // Match the debug endpoint query EXACTLY - same table, same column name, same filter, same ORDER BY
      // Debug endpoint query:
      //   SELECT ... FROM document_chunks WHERE document_id = ${documentId} ORDER BY created_at ASC LIMIT 20
      // Fallback query (identical except LIMIT):
      //   SELECT content FROM document_chunks WHERE document_id = ${documentId} ORDER BY created_at ASC LIMIT 5
      console.log(
        "  - Executing fallback query that matches debug endpoint exactly:"
      );
      console.log(
        "    * Table: document_chunks (VERIFIED: same as debug endpoint)"
      );
      console.log(
        "    * Column: document_id (VERIFIED: same as debug endpoint)"
      );
      console.log(
        "    * Filter: WHERE document_id = ${documentId} (VERIFIED: same as debug endpoint)"
      );
      console.log(
        "    * ORDER BY: created_at ASC (VERIFIED: same as debug endpoint)"
      );
      console.log("    * LIMIT: 5 (debug uses 20, but we limit to 5 for RAG)");
      console.log(
        "    * No additional filters (VERIFIED: no userId, no other WHERE conditions)"
      );
      console.log("  - Query comparison:");
      console.log(
        "    Debug endpoint: SELECT ... FROM document_chunks WHERE document_id = $1 ORDER BY created_at ASC LIMIT 20"
      );
      console.log(
        "    Fallback query: SELECT content FROM document_chunks WHERE document_id = $1 ORDER BY created_at ASC LIMIT 5"
      );
      console.log(
        "    Difference: Only LIMIT differs (20 vs 5), and SELECT fields (debug selects more columns)"
      );
      console.log(
        "    Parameter $1 (documentId):",
        documentId,
        "(type:",
        typeof documentId,
        ")"
      );

      const fallbackResult = await postgresClient`
        SELECT content
        FROM document_chunks
        WHERE document_id = ${documentId}
        ORDER BY created_at ASC
        LIMIT 5
      `;

      fallbackChunks = fallbackResult.map((chunk: any) => chunk.content);

      console.log("  - Fallback query executed successfully");
      console.log("  - Raw result count:", fallbackResult.length);
      console.log("  - Mapped chunk contents count:", fallbackChunks.length);

      console.log("  - Fallback query results:");
      console.log("    * Rows returned:", fallbackResult.length);
      console.log("    * Chunk contents extracted:", fallbackChunks.length);

      if (fallbackChunks.length === 0) {
        console.warn("    * ⚠️ ZERO chunks returned from fallback query!");
        console.warn(
          "    * This means no chunks exist for documentId:",
          documentId
        );
        console.warn("    * Summary:");
        console.warn("      - documentId:", documentId);
        console.warn("      - documentId type:", typeof documentId);
        console.warn("      - Similarity query: 0 chunks");
        console.warn("      - Fallback query: 0 chunks");
        console.warn("      - No chunks found in either query");
      } else {
        console.log(
          "    * ✅ Fallback query returned",
          fallbackChunks.length,
          "chunks"
        );
        // Log first chunk preview
        if (fallbackChunks.length > 0 && fallbackChunks[0]) {
          const firstChunkPreview = fallbackChunks[0].substring(0, 120);
          console.log(
            "    * First chunk preview (120 chars):",
            firstChunkPreview
          );
          console.log(
            "    * First chunk full length:",
            fallbackChunks[0].length,
            "characters"
          );
        }
      }
    } catch (error) {
      console.error("    * ❌ Error in fallback query:", error);
      if (error instanceof Error) {
        console.error("    * Error message:", error.message);
        console.error("    * Error stack:", error.stack);
      }
    }
  }

  // Determine which result to use
  let finalChunks: string[] = [];
  let source: "similarity" | "fallback" | "none" = "none";

  if (similarityChunks.length > 0) {
    finalChunks = similarityChunks;
    source = "similarity";
    console.log("\n[retrieveDocumentChunks] ✅ Using similarity query results");
  } else if (fallbackChunks.length > 0) {
    finalChunks = fallbackChunks;
    source = "fallback";
    console.log("\n[retrieveDocumentChunks] ✅ Using fallback query results");
  } else {
    console.log(
      "\n[retrieveDocumentChunks] ⚠️ No chunks available from either query"
    );
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  return { chunks: finalChunks, source };
}

const getTokenlensCatalog = cache(
  async (): Promise<ModelCatalog | undefined> => {
    try {
      return await fetchModels();
    } catch (err) {
      console.warn(
        "TokenLens: catalog fetch failed, using default catalog",
        err
      );
      return; // tokenlens helpers will fall back to defaultCatalog
    }
  },
  ["tokenlens-catalog"],
  { revalidate: 24 * 60 * 60 } // 24 hours
);

// Get or create global resumable stream context (requires Redis)
export function getStreamContext() {
  if (!globalStreamContext) {
    try {
      globalStreamContext = createResumableStreamContext({
        waitUntil: after,
      });
    } catch (error: any) {
      if (error.message.includes("REDIS_URL")) {
        console.log(
          " > Resumable streams are disabled due to missing REDIS_URL"
        );
      } else {
        console.error(error);
      }
    }
  }

  return globalStreamContext;
}

// Main chat API endpoint - handles message streaming and tool execution
export async function POST(request: Request) {
  let requestBody: PostRequestBody;

  // 记录请求开始时间，用于调试
  const requestStartTime = Date.now();
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[POST /api/chat] 📥 REQUEST RECEIVED");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("Request started at:", new Date().toISOString());

  try {
    const json = await request.json();

    // Log documentId status from raw JSON (before parsing)
    const rawDocumentIdStatus = !("documentId" in json)
      ? "MISSING"
      : json.documentId === null
      ? "NULL"
      : typeof json.documentId === "string" && json.documentId.length > 0
      ? "VALID_STRING"
      : "INVALID";

    console.log("[POST /api/chat] Raw JSON (before parsing):");
    console.log("  - Has 'documentId' field:", "documentId" in json);
    console.log("  - documentId Status:", rawDocumentIdStatus);
    console.log("  - documentId Value:", json.documentId ?? "undefined");
    console.log("  - documentId Type:", typeof json.documentId);
    console.log("  - All keys in JSON:", Object.keys(json));

    requestBody = postRequestBodySchema.parse(json);

    // Log documentId status after parsing
    const parsedDocumentIdStatus =
      requestBody.documentId === undefined
        ? "MISSING"
        : requestBody.documentId === null
        ? "NULL"
        : typeof requestBody.documentId === "string" &&
          requestBody.documentId.length > 0
        ? "VALID_STRING"
        : "INVALID";

    console.log("[POST /api/chat] Parsed request body:");
    console.log("  - Chat ID:", requestBody.id);
    console.log("  - Has message:", !!requestBody.message);
    console.log("  - Selected model:", requestBody.selectedChatModel);
    console.log("  - documentId Status:", parsedDocumentIdStatus);
    console.log("  - documentId Value:", requestBody.documentId ?? "undefined");
    console.log("  - documentId Type:", typeof requestBody.documentId);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("[POST /api/chat] failed to parse request body:", error);
    if (error instanceof Error) {
      console.error("[POST /api/chat] Parse error details:", error.message);
    }

    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
      templateId,
      templateContent,
      documentId,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: VisibilityType;
      templateId?: string;
      templateContent?: string;
      documentId?: string;
    } = requestBody;

    // Log documentId after extraction - verify it's available for RAG
    const extractedDocumentIdStatus =
      documentId === undefined
        ? "MISSING"
        : documentId === null
        ? "NULL"
        : typeof documentId === "string" && documentId.length > 0
        ? "VALID_STRING"
        : "INVALID";

    console.log("[POST /api/chat] documentId after extraction:");
    console.log("  - Status:", extractedDocumentIdStatus);
    console.log("  - Value:", documentId ?? "undefined");
    console.log("  - Type:", typeof documentId);
    console.log(
      "  - Will perform RAG:",
      !!documentId && typeof documentId === "string"
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const session = await auth();
    console.log("[POST /api/chat] session:", session);
    if (!session?.user) {
      return new ChatSDKError("unauthorized:chat").toResponse();
    }

    const userType: UserType = session.user.type;

    // Check if user ID is a valid UUID
    // Fallback users have IDs like "fallback-{timestamp}" and skip DB operations
    const isValidUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        session.user.id
      );

    let messageCount: number = 0;

    // Only query database for valid UUID users
    // Fallback users skip rate limiting and database persistence
    if (isValidUUID) {
      try {
        messageCount = await getMessageCountByUserId({
          id: session.user.id,
          differenceInHours: 24,
        });
        console.log("[getMessageCountByUserId] params:", {
          id: session.user.id,
          differenceInHours: 24,
        });
        console.log("[POST /api/chat] messageCount for user:", messageCount);
      } catch (error) {
        console.error("[POST /api/chat] Failed to get message count:", error);
        // 如果数据库查询失败，我们不应该阻止用户发送消息
        // 而是记录错误并继续（或者返回错误响应）
        // 这里我们选择返回错误，以便用户知道问题所在
        if (error instanceof ChatSDKError) {
          return error.toResponse();
        }
        throw error; // 重新抛出以便外层 catch 处理
      }
    } else {
      console.log(
        "[POST /api/chat] Skipping rate limit check for fallback user:",
        session.user.id
      );
      // Fallback 用户不进行速率限制检查
      messageCount = 0;
    }

    // Enforce rate limits based on user type
    if (messageCount > entitlementsByUserType[userType].maxMessagesPerDay) {
      return new ChatSDKError("rate_limit:chat").toResponse();
    }

    // For fallback users, skip database operations (their IDs are not valid UUIDs)
    let chat = null;
    let uiMessages: ChatMessage[] = [message];

    if (isValidUUID) {
      // Get or create chat, generate title if new
      chat = await getChatById({ id });

      if (chat) {
        // Verify user owns the chat
        if (chat.userId !== session.user.id) {
          return new ChatSDKError("forbidden:chat").toResponse();
        }
      } else {
        // Generate title from first user message
        const title = await generateTitleFromUserMessage({
          message,
        });

        console.log("[POST /api/chat] Creating new chat:", {
          id,
          userId: session.user.id,
          title,
          visibility: selectedVisibilityType,
        });

        await saveChat({
          id,
          userId: session.user.id,
          title,
          visibility: selectedVisibilityType,
        });

        console.log("[POST /api/chat] Chat saved successfully:", id);
      }

      // Load existing messages and append new user message
      const messagesFromDb = await getMessagesByChatId({ id });
      uiMessages = [...convertToUIMessages(messagesFromDb), message];
    } else {
      console.log(
        "[POST /api/chat] Fallback user - skipping database operations for chat:",
        id
      );
      // Fallback 用户的数据只存在于内存中，不持久化到数据库
    }

    const { longitude, latitude, city, country } = geolocation(request);

    const requestHints: RequestHints = {
      longitude,
      latitude,
      city,
      country,
    };

    // Load user settings if user is authenticated and has valid UUID
    let userSettings = null;
    if (isValidUUID && session.user.id) {
      try {
        userSettings = await getUserSettings(session.user.id);
        if (userSettings) {
          console.log("[POST /api/chat] User settings loaded:", {
            model: userSettings.model,
            temperature: userSettings.temperature,
            maxTokens: userSettings.maxTokens,
            useTemplatesAsSystem: userSettings.useTemplatesAsSystem,
          });
        }
      } catch (error) {
        console.warn("[POST /api/chat] Failed to load user settings:", error);
        // Continue with defaults if settings load fails
      }
    }

    // Determine the model to use: user setting > request body > default
    // If user has set a model (not null), use it; otherwise use the request body selection
    const effectiveModel = userSettings?.model || selectedChatModel;

    // Determine temperature: user setting > default (0.7)
    const effectiveTemperature = userSettings?.temperature
      ? parseFloat(userSettings.temperature)
      : 0.7;

    console.log("[POST /api/chat] Temperature configuration:", {
      userSetting: userSettings?.temperature,
      effectiveTemperature,
      source: userSettings?.temperature ? "user_settings" : "default",
    });

    // Determine max tokens: user setting > undefined (let model use default)
    const effectiveMaxTokens = userSettings?.maxTokens
      ? userSettings.maxTokens
      : undefined;

    // Log useTemplatesAsSystem for debugging (not used yet)
    if (userSettings?.useTemplatesAsSystem !== undefined) {
      console.log(
        "[POST /api/chat] useTemplatesAsSystem setting:",
        userSettings.useTemplatesAsSystem
      );
    }

    // RAG: Retrieve document chunks if documentId is provided
    // If documentId is not provided, skip all RAG logic and behave exactly as before
    let ragContextText: string | null = null;
    let retrievedChunksCount = 0;
    let ragSystemMessageAdded = false;

    if (documentId && isValidUUID) {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        "[POST /api/chat] 🔍 RAG: Starting document retrieval process"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("  - documentId:", documentId);
      console.log("  - userId:", session.user.id);
      console.log("  - isValidUUID:", isValidUUID);

      try {
        // Verify document belongs to the user
        const document = await postgresClient`
          SELECT user_id, title
          FROM documents
          WHERE id = ${documentId}
        `.then((rows) => rows[0]);

        if (!document) {
          console.warn(
            `[POST /api/chat] RAG: Document ${documentId} not found in database`
          );
        } else if (document.user_id !== session.user.id) {
          console.warn(
            `[POST /api/chat] RAG: Document ${documentId} does not belong to user ${session.user.id}`
          );
        } else {
          console.log("[POST /api/chat] RAG: Document verified", {
            documentId,
            documentTitle: document.title,
            ownerId: document.user_id,
          });

          // Extract user question text from message parts
          const userQuestion = getTextFromMessage(message);

          if (userQuestion && userQuestion.trim().length > 0) {
            console.log(
              "[POST /api/chat] RAG: Generating embedding for user question",
              {
                questionLength: userQuestion.length,
                questionPreview: userQuestion.substring(0, 100),
              }
            );

            // Generate embedding for the user question using the same AI SDK provider
            // and embedding model that the upload API uses (via getEmbeddingModel())
            console.log(
              "[POST /api/chat] RAG: Generating embedding using AI SDK..."
            );
            const queryEmbedding = await generateEmbedding(userQuestion);
            console.log(
              "[POST /api/chat] RAG: ✅ Embedding generated successfully",
              {
                embeddingDimensions: queryEmbedding.length,
                embeddingModel: "text-embedding-3-small (via AI SDK)",
                isUsingRawOpenAI: false,
              }
            );

            console.log(
              "[POST /api/chat] RAG: Querying Supabase document_chunks table for similar chunks"
            );
            console.log(
              "  - Filtering by documentId:",
              documentId,
              "(type:",
              typeof documentId,
              ")"
            );
            console.log(
              "  - Using vector similarity search (pgvector <-> operator)"
            );
            console.log("  - Limit: 3 chunks");
            console.log("  - Table: document_chunks");
            console.log("  - WHERE condition: document_id =", documentId);
            console.log("  - No additional filters (userId, etc.)");

            // Retrieve chunks using similarity search with fallback
            // This will try similarity first, then fallback to simple documentId query if needed
            const retrievalResult = await retrieveDocumentChunks(
              documentId,
              queryEmbedding,
              3
            );

            const chunks = retrievalResult.chunks;
            const retrievalSource = retrievalResult.source;
            retrievedChunksCount = chunks.length;

            console.log("[POST /api/chat] RAG: Chunk retrieval complete", {
              retrievedChunksCount: chunks.length,
              hasChunks: chunks.length > 0,
              source: retrievalSource,
            });

            if (chunks.length === 0) {
              console.warn(
                "⚠️ [POST /api/chat] RAG: ZERO chunks returned from both similarity and fallback queries!"
              );
              console.warn("  - Similarity query: 0 chunks");
              console.warn("  - Fallback query: 0 chunks");
              console.warn(
                "  - This means no chunks exist for documentId:",
                documentId
              );
              console.warn(
                "  - RAG will be skipped - proceeding with normal chat behavior"
              );
            } else {
              // Log which method was used
              if (retrievalSource === "similarity") {
                console.log("  - ✅ Using similarity-based retrieval results");
              } else if (retrievalSource === "fallback") {
                console.log(
                  "  - ✅ Using fallback retrieval results (similarity query returned 0)"
                );
              }

              // Combine chunks into context text with clear separators
              ragContextText = chunks.join("\n\n---\n\n");

              const contextPreview = ragContextText.substring(0, 120);
              const isEmpty = ragContextText.trim().length === 0;

              console.log("[POST /api/chat] RAG: ✅ Context string built", {
                chunksCount: chunks.length,
                contextLength: ragContextText.length,
                isEmpty: isEmpty,
                source: retrievalSource,
              });
              console.log(
                "  - Context preview (first 120 chars):",
                contextPreview
              );

              if (isEmpty) {
                console.warn(
                  "⚠️ [POST /api/chat] RAG: Context string is EMPTY despite having chunks!"
                );
              } else {
                console.log("  - Context is NON-EMPTY and ready for injection");
                console.log("  - Context source:", retrievalSource);
              }
            }
          } else {
            console.log(
              "[POST /api/chat] RAG: Skipping - user question is empty or contains no text"
            );
          }
        }
      } catch (error) {
        console.error(
          "[POST /api/chat] RAG: Error retrieving document chunks:",
          error
        );
        // Continue without RAG context if retrieval fails - chat will work normally
      }
    } else {
      if (!documentId) {
        console.log(
          "[POST /api/chat] RAG: Skipping - no documentId provided in request"
        );
      } else if (!isValidUUID) {
        console.log(
          "[POST /api/chat] RAG: Skipping - user is not a valid UUID (fallback user)"
        );
      }
    }

    // Log RAG configuration summary
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[POST /api/chat] 📊 RAG SUMMARY");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  - hasDocumentId:", !!documentId);
    console.log("  - retrievedChunksCount:", retrievedChunksCount);
    console.log("  - hasContext:", !!ragContextText);
    console.log("  - contextLength:", ragContextText?.length || 0);
    console.log(
      "  - willInjectSystemMessage:",
      !!ragContextText && ragContextText.trim().length > 0
    );
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Inject RAG context as a system message BEFORE template or history messages
    // Only injects if RAG context was successfully retrieved (documentId was provided and chunks were found)
    if (ragContextText && ragContextText.trim().length > 0) {
      const ragSystemMessage: ChatMessage = {
        id: generateUUID(),
        role: "system",
        parts: [
          {
            type: "text",
            text: `You are answering based on the uploaded document. Relevant excerpts:\n\n${ragContextText}\n\nOnly use this information when relevant.`,
          },
        ],
      };

      const messagesBeforeInjection = uiMessages.length;
      // Insert system message at the beginning of the messages array
      // This ensures the RAG context is available to the model before any other messages
      uiMessages = [ragSystemMessage, ...uiMessages];
      ragSystemMessageAdded = true;

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(
        "[POST /api/chat] ✅ RAG: Injected system message with context"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("  - System message ID:", ragSystemMessage.id);
      console.log("  - Context length:", ragContextText.length, "characters");
      console.log("  - Messages before injection:", messagesBeforeInjection);
      console.log("  - Messages after injection:", uiMessages.length);
      console.log("  - RAG system message is at index 0 (first message)");
      console.log("  - Message will NOT be removed or overwritten");
    } else if (documentId) {
      console.log(
        "[POST /api/chat] RAG: documentId was provided but no context was retrieved - proceeding without RAG context"
      );
    }

    // Build system prompt - prepend template content if provided
    const baseSystemPrompt = systemPrompt({
      selectedChatModel: effectiveModel,
      requestHints,
    });

    let systemPromptParts: string[] = [];

    // Add template content if provided
    if (requestBody.templateContent) {
      systemPromptParts.push(requestBody.templateContent);
    }

    // Add base system prompt
    systemPromptParts.push(baseSystemPrompt);

    const finalSystemPrompt = systemPromptParts.join("\n\n");

    // 只为有效的 UUID 用户保存用户消息到数据库
    if (isValidUUID) {
      await saveMessages({
        messages: [
          {
            chatId: id,
            id: message.id,
            role: "user",
            parts: message.parts,
            attachments: [],
            createdAt: new Date(),
          },
        ],
      });
    }

    // Create stream ID for resumable streams (only for valid UUID users)
    const streamId = generateUUID();
    if (isValidUUID) {
      await createStreamId({ streamId, chatId: id });
    }

    let finalMergedUsage: AppUsage | undefined;

    // Log final message array before sending to model
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[POST /api/chat] 📤 FINAL MESSAGE ARRAY BEFORE MODEL CALL");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  - Total messages:", uiMessages.length);
    console.log("  - documentId present:", !!documentId);
    console.log("  - RAG system message added:", ragSystemMessageAdded);
    console.log("  - Message breakdown:");
    uiMessages.forEach((msg, index) => {
      console.log(`    [${index}] ${msg.role}:`, {
        id: msg.id,
        role: msg.role,
        partsCount: msg.parts.length,
        firstPartPreview:
          msg.parts[0]?.type === "text"
            ? msg.parts[0].text.substring(0, 80) + "..."
            : msg.parts[0]?.type,
      });
    });
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Create stream with AI model and tool execution
    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        // Build streamText options with user settings
        const streamTextOptions: Parameters<typeof streamText>[0] = {
          model: myProvider.languageModel(effectiveModel),
          system: finalSystemPrompt,
          messages: convertToModelMessages(uiMessages),
          temperature: effectiveTemperature,
          stopWhen: stepCountIs(5),
          // Disable document/artifact tools - only allow weather
          experimental_activeTools:
            effectiveModel === "chat-model-reasoning"
              ? []
              : ["getWeather"],
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: {
            getWeather,
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
        };

        // Add maxTokens if user has set it (via provider options if needed)
        // Note: maxTokens may need to be passed via provider-specific options
        // For now, we'll log it and apply it if the SDK supports it
        if (effectiveMaxTokens !== undefined) {
          console.log(
            "[POST /api/chat] User maxTokens setting:",
            effectiveMaxTokens
          );
          // Try to apply maxTokens - this may vary by provider
          // Some providers may need it in providerOptions
          (streamTextOptions as any).maxTokens = effectiveMaxTokens;
        }

        const result = streamText({
          ...streamTextOptions,
          onFinish: async ({ usage }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId = myProvider.languageModel(effectiveModel).modelId;
              if (!modelId) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              if (!providers) {
                finalMergedUsage = usage;
                dataStream.write({
                  type: "data-usage",
                  data: finalMergedUsage,
                });
                return;
              }

              const summary = getUsage({ modelId, usage, providers });
              finalMergedUsage = { ...usage, ...summary, modelId } as AppUsage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            } catch (err) {
              console.warn("TokenLens enrichment failed", err);
              finalMergedUsage = usage;
              dataStream.write({ type: "data-usage", data: finalMergedUsage });
            }
          },
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onFinish: async ({ messages }) => {
        // 只为有效的 UUID 用户保存消息到数据库
        if (isValidUUID) {
          try {
            await saveMessages({
              messages: messages.map((currentMessage) => ({
                id: currentMessage.id,
                role: currentMessage.role,
                parts: currentMessage.parts,
                createdAt: new Date(),
                attachments: [],
                chatId: id,
              })),
            });

            if (finalMergedUsage) {
              try {
                await updateChatLastContextById({
                  chatId: id,
                  context: finalMergedUsage,
                });
              } catch (err) {
                console.warn("Unable to persist last usage for chat", id, err);
              }
            }
          } catch (err) {
            console.error("Failed to save messages for chat", id, err);
            // 不阻止响应完成，因为消息已经生成
          }
        } else {
          console.log(
            "[POST /api/chat] Fallback user - skipping message persistence"
          );
        }
      },
      onError: () => {
        return "Oops, an error occurred!";
      },
    });

    // const streamContext = getStreamContext();

    // if (streamContext) {
    //   return new Response(
    //     await streamContext.resumableStream(streamId, () =>
    //       stream.pipeThrough(new JsonToSseTransformStream())
    //     )
    //   );
    // }

    // return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
    const sse = stream.pipeThrough(new JsonToSseTransformStream());

    console.log("[POST /api/chat] Stream created successfully for chat:", id);
    console.log(
      "[POST /api/chat] Request processing time:",
      Date.now() - requestStartTime,
      "ms"
    );

    // 监听请求取消信号
    request.signal.addEventListener("abort", () => {
      console.warn(
        "[POST /api/chat] Request was aborted by client for chat:",
        id
      );
      console.warn(
        "[POST /api/chat] Request duration before abort:",
        Date.now() - requestStartTime,
        "ms"
      );
    });

    return new Response(sse, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const vercelId = request.headers.get("x-vercel-id");

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    // Check for Vercel AI Gateway credit card error
    if (
      error instanceof Error &&
      error.message?.includes(
        "AI Gateway requires a valid credit card on file to service requests"
      )
    ) {
      return new ChatSDKError("bad_request:activate_gateway").toResponse();
    }

    console.error("Unhandled error in chat API:", error, { vercelId });
    return new ChatSDKError("offline:chat").toResponse();
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new ChatSDKError("bad_request:api").toResponse();
  }

  const session = await auth();

  if (!session?.user) {
    return new ChatSDKError("unauthorized:chat").toResponse();
  }

  const chat = await getChatById({ id });

  if (chat?.userId !== session.user.id) {
    return new ChatSDKError("forbidden:chat").toResponse();
  }

  const deletedChat = await deleteChatById({ id });

  return Response.json(deletedChat, { status: 200 });
}
