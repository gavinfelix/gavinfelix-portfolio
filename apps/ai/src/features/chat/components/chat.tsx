"use client";

// Main chat interface component handling message streaming, state management, and user interactions
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { DataUIPart } from "ai";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { ChatHeader } from "./chat-header";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatVisibility } from "@/hooks/use-chat-visibility";
import { useChatContext } from "@/contexts/chat-context";
import type { Vote } from "@/lib/db/schema";
import { ChatSDKError } from "@/lib/errors";
import type { Attachment, ChatMessage, CustomUIDataTypes } from "@/lib/types";
import type { AppUsage } from "@/lib/usage";
import { fetcher, fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { useDataStream } from "@/components/data-stream-provider";
import { Messages } from "./messages";
import { MultimodalInput } from "./multimodal-input";
import { getChatHistoryPaginationKey } from "./sidebar-history";
import { toast } from "@/components/toast";
import type { VisibilityType } from "@/components/visibility-selector";
import type { PromptTemplate } from "@/lib/db/schema";
import { useTemplates } from "@/features/templates/hooks/use-templates";

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  autoResume,
  initialLastContext,
}: {
  id: string;
  initialMessages: ChatMessage[];
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  autoResume: boolean;
  initialLastContext?: AppUsage;
}) {
  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  // Update chat context for AppHeader
  const { setChatId, setVisibilityType, setIsReadonly } = useChatContext();
  useEffect(() => {
    setChatId(id);
    setVisibilityType(visibilityType);
    setIsReadonly(isReadonly);
  }, [
    id,
    visibilityType,
    isReadonly,
    setChatId,
    setVisibilityType,
    setIsReadonly,
  ]);

  const { mutate } = useSWRConfig();
  const { setDataStream } = useDataStream();

  // Load templates from API
  const { templates: promptTemplates } = useTemplates();

  const [input, setInput] = useState<string>("");
  const [usage, setUsage] = useState<AppUsage | undefined>(initialLastContext);
  const [showCreditCardAlert, setShowCreditCardAlert] = useState(false);
  const [currentModelId, setCurrentModelId] = useState(initialChatModel);
  const currentModelIdRef = useRef(currentModelId);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromptTemplate | null>(null);

  useEffect(() => {
    currentModelIdRef.current = currentModelId;
  }, [currentModelId]);

  // Initialize chat hook with custom transport and handlers
  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    resumeStream,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    experimental_throttle: 100,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      fetch: fetchWithErrorHandlers,
      // Include current model, visibility, template, and documentId in request
      prepareSendMessagesRequest(request) {
        // Build base body with required fields
        const body: {
          id: string;
          message: ChatMessage | undefined;
          selectedChatModel: string;
          selectedVisibilityType: VisibilityType;
          templateId: string | undefined;
          templateContent: string | undefined;
          documentId?: string;
        } = {
          id: request.id,
          message: request.messages.at(-1),
          selectedChatModel: currentModelIdRef.current,
          selectedVisibilityType: visibilityType,
          templateId: selectedTemplate?.id,
          templateContent: selectedTemplate?.content,
          // Spread any additional fields from request.body first
          ...request.body,
        };

        // Add documentId after spreading request.body to ensure it's not overwritten
        // and is always included if a document is attached
        if (currentDocumentIdRef.current) {
          body.documentId = currentDocumentIdRef.current;
        }

        // Determine documentId status for logging
        const documentIdStatus =
          body.documentId === undefined
            ? "MISSING"
            : body.documentId === null
            ? "NULL"
            : typeof body.documentId === "string" && body.documentId.length > 0
            ? "VALID_STRING"
            : "INVALID";

        // Enhanced logging: Log full request details just before sending
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("[Chat] 📤 SENDING REQUEST TO /api/chat");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("URL:", "/api/chat");
        console.log("Request Body:", JSON.stringify(body, null, 2));
        console.log("documentId Status:", documentIdStatus);
        console.log("documentId Value:", body.documentId ?? "undefined");
        console.log("documentId Type:", typeof body.documentId);
        console.log("Has documentId in body:", "documentId" in body);
        console.log(
          "Current documentId from ref:",
          currentDocumentIdRef.current ?? "undefined"
        );
        console.log(
          "Current documentName:",
          currentDocumentName ?? "undefined"
        );
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

        return { body };
      },
    }),
    // Handle streaming data and update usage statistics
    onData: (dataPart) => {
      setDataStream((ds) =>
        ds
          ? [...ds, dataPart as DataUIPart<CustomUIDataTypes>]
          : [dataPart as DataUIPart<CustomUIDataTypes>]
      );
      if (dataPart.type === "data-usage") {
        setUsage(dataPart.data as AppUsage);
      }
    },
    // Refresh chat history when message finishes
    // Note: documentId is NOT cleared automatically - user must clear it manually
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      console.error("[Chat] Error occurred:", error);

      // Check if error is due to request cancellation (expected behavior)
      if (error instanceof Error) {
        if (
          error.name === "AbortError" ||
          error.message?.includes("canceled") ||
          error.message?.includes("aborted")
        ) {
          console.warn(
            "[Chat] Request was aborted/canceled. This may happen if:",
            [
              "- Component was unmounted",
              "- Navigation occurred",
              "- User clicked stop button",
              "- New request was sent before previous completed",
            ].join("\n")
          );
          // Don't show error toast for cancellations as they're expected
          return;
        }
      }

      if (error instanceof ChatSDKError) {
        // Show credit card alert for payment-related errors
        if (
          error.message?.includes("AI Gateway requires a valid credit card")
        ) {
          setShowCreditCardAlert(true);
        } else {
          toast({
            type: "error",
            description: error.message,
          });
        }
      } else {
        // Handle other unexpected errors
        toast({
          type: "error",
          description:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        });
      }
    },
  });

  // Update messages when id or initialMessages change (e.g., when navigating to a different chat)
  // This ensures the chat displays the correct messages for the selected chat session
  const prevIdRef = useRef(id);
  useEffect(() => {
    // When id changes, update messages to match the new chat's initialMessages
    if (prevIdRef.current !== id) {
      prevIdRef.current = id;
      setMessages(initialMessages);
      // Clear documentId and documentName when switching chats
      setCurrentDocumentId(undefined);
      setCurrentDocumentName(undefined);
    }
  }, [id, initialMessages, setMessages]);

  // Monitor status changes for debugging purposes
  useEffect(() => {
    if (status === "error") {
      console.warn(
        "[Chat] Request status changed to error. Messages count:",
        messages.length
      );
      console.warn(
        "[Chat] Current URL:",
        typeof window !== "undefined" ? window.location.href : "SSR"
      );
    }
  }, [status, messages.length]);

  const searchParams = useSearchParams();
  const query = searchParams.get("query");

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  // useEffect(() => {
  //   if (query && !hasAppendedQuery) {
  //     sendMessage({
  //       role: "user" as const,
  //       parts: [{ type: "text", text: query }],
  //     });

  //     setHasAppendedQuery(true);
  //     window.history.replaceState({}, "", `/chat/${id}`);
  //   }
  // }, [query, sendMessage, hasAppendedQuery, id]);

  // Fetch votes only if there are at least 2 messages (user + assistant)
  const { data: votes } = useSWR<Vote[]>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher
  );

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [currentDocumentId, setCurrentDocumentId] = useState<
    string | undefined
  >(undefined);
  const [currentDocumentName, setCurrentDocumentName] = useState<
    string | undefined
  >(undefined);
  const currentDocumentIdRef = useRef<string | undefined>(undefined);

  // Keep ref in sync with state for use in prepareSendMessagesRequest
  useEffect(() => {
    currentDocumentIdRef.current = currentDocumentId;
  }, [currentDocumentId]);

  // Automatically resume incomplete chat streams if enabled
  useAutoResume({
    autoResume,
    initialMessages,
    resumeStream,
    setMessages,
  });

  const isEmpty = messages.length === 0;

  return (
    <>
      <div className="overscroll-behavior-contain flex h-dvh min-w-0 touch-pan-y flex-col bg-background">
        <ChatHeader />

        {isEmpty ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-6 px-2 md:px-4">
              <div className="w-full max-w-2xl">
                <Messages
                  chatId={id}
                  isArtifactVisible={false}
                  isReadonly={isReadonly}
                  messages={messages}
                  regenerate={regenerate}
                  selectedModelId={initialChatModel}
                  setMessages={setMessages}
                  status={status}
                  votes={votes}
                />
              </div>
              <div className="w-full max-w-2xl" id="input-container">
                {!isReadonly && (
                  <MultimodalInput
                    attachments={attachments}
                    chatId={id}
                    documentId={currentDocumentId}
                    documentName={currentDocumentName}
                    input={input}
                    messages={messages}
                    onDocumentChange={(id, name) => {
                      console.log("[Chat] Document state updated:", {
                        documentId: id || null,
                        documentName: name || null,
                        previousDocumentId: currentDocumentId || null,
                      });
                      setCurrentDocumentId(id);
                      setCurrentDocumentName(name);
                    }}
                    onModelChange={setCurrentModelId}
                    onTemplateSelect={(template) => {
                      setSelectedTemplate(template);
                      if (template) {
                        setInput(template.content);
                      }
                    }}
                    selectedModelId={currentModelId}
                    selectedTemplate={selectedTemplate}
                    selectedVisibilityType={visibilityType}
                    sendMessage={sendMessage}
                    setAttachments={setAttachments}
                    setInput={setInput}
                    setMessages={setMessages}
                    status={status}
                    stop={stop}
                    templates={promptTemplates}
                    usage={usage}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <Messages
              chatId={id}
              isArtifactVisible={false}
              isReadonly={isReadonly}
              messages={messages}
              regenerate={regenerate}
              selectedModelId={initialChatModel}
              setMessages={setMessages}
              status={status}
              votes={votes}
            />

            <div
              className="sticky bottom-0 z-1 mx-auto flex w-full max-w-4xl flex-col gap-2 border-t-0 bg-background px-2 pb-3 md:px-4 md:pb-4"
              id="input-container"
            >
              {!isReadonly && (
                <MultimodalInput
                  attachments={attachments}
                  chatId={id}
                  documentId={currentDocumentId}
                  documentName={currentDocumentName}
                  input={input}
                  messages={messages}
                  onDocumentChange={(id, name) => {
                    console.log("[Chat] Document state updated:", {
                      documentId: id || null,
                      documentName: name || null,
                      previousDocumentId: currentDocumentId || null,
                    });
                    setCurrentDocumentId(id);
                    setCurrentDocumentName(name);
                  }}
                  onModelChange={setCurrentModelId}
                  onTemplateSelect={(template) => {
                    setSelectedTemplate(template);
                    if (template) {
                      setInput(template.content);
                    }
                  }}
                  selectedModelId={currentModelId}
                  selectedTemplate={selectedTemplate}
                  selectedVisibilityType={visibilityType}
                  sendMessage={sendMessage}
                  setAttachments={setAttachments}
                  setInput={setInput}
                  setMessages={setMessages}
                  status={status}
                  stop={stop}
                  templates={promptTemplates}
                  usage={usage}
                />
              )}
            </div>
          </>
        )}
      </div>

      <AlertDialog
        onOpenChange={setShowCreditCardAlert}
        open={showCreditCardAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Activate AI Gateway</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires{" "}
              {process.env.NODE_ENV === "production" ? "the owner" : "you"} to
              activate Vercel AI Gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                window.open(
                  "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%3Fmodal%3Dadd-credit-card",
                  "_blank"
                );
                window.location.href = "/";
              }}
            >
              Activate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
