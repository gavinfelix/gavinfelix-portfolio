// Main chat API endpoint for handling message streaming and tool execution
import { geolocation } from "@vercel/functions";
import {
  convertToModelMessages,
  createUIMessageStream,
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
import { type RequestHints, systemPrompt } from "@/lib/ai/prompts";
import { myProvider } from "@/lib/ai/providers";
import { createDocument } from "@/lib/ai/tools/create-document";
import { getWeather } from "@/lib/ai/tools/get-weather";
import { requestSuggestions } from "@/lib/ai/tools/request-suggestions";
import { updateDocument } from "@/lib/ai/tools/update-document";
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
import { convertToUIMessages, generateUUID } from "@/lib/utils";
import { generateTitleFromUserMessage } from "../../actions";
import { type PostRequestBody, postRequestBodySchema } from "./schema";

export const maxDuration = 60;

let globalStreamContext: ResumableStreamContext | null = null;

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
  console.log("[POST /api/chat] Request started at:", new Date().toISOString());

  try {
    const json = await request.json();
    requestBody = postRequestBodySchema.parse(json);
    console.log("[POST /api/chat] request body:", json);
  } catch (_) {
    console.error("[POST /api/chat] failed to parse request body:", _);

    return new ChatSDKError("bad_request:api").toResponse();
  }

  try {
    const {
      id,
      message,
      selectedChatModel,
      selectedVisibilityType,
    }: {
      id: string;
      message: ChatMessage;
      selectedChatModel: ChatModel["id"];
      selectedVisibilityType: VisibilityType;
    } = requestBody;

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

    // Create stream with AI model and tool execution
    const stream = createUIMessageStream({
      execute: ({ writer: dataStream }) => {
        const result = streamText({
          model: myProvider.languageModel(selectedChatModel),
          system: systemPrompt({ selectedChatModel, requestHints }),
          messages: convertToModelMessages(uiMessages),
          stopWhen: stepCountIs(5),
          // Disable tools for reasoning model, enable for others
          experimental_activeTools:
            selectedChatModel === "chat-model-reasoning"
              ? []
              : [
                  "getWeather",
                  "createDocument",
                  "updateDocument",
                  "requestSuggestions",
                ],
          experimental_transform: smoothStream({ chunking: "word" }),
          tools: {
            getWeather,
            createDocument: createDocument({ session, dataStream }),
            updateDocument: updateDocument({ session, dataStream }),
            requestSuggestions: requestSuggestions({
              session,
              dataStream,
            }),
          },
          experimental_telemetry: {
            isEnabled: isProductionEnvironment,
            functionId: "stream-text",
          },
          onFinish: async ({ usage }) => {
            try {
              const providers = await getTokenlensCatalog();
              const modelId =
                myProvider.languageModel(selectedChatModel).modelId;
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
