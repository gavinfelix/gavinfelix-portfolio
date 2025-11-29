// Messages container component managing scroll behavior, message rendering, and auto-scroll functionality
import type { UseChatHelpers } from "@ai-sdk/react";
import equal from "fast-deep-equal";
import { ArrowDownIcon } from "lucide-react";
import { memo, useEffect, useRef, useState } from "react";
import { useMessages } from "@/hooks/use-messages";
import type { Vote } from "@/lib/db/schema";
import type { ChatMessage } from "@/lib/types";
import { useDataStream } from "@/components/data-stream-provider";
import { Conversation, ConversationContent } from "@/components/elements/conversation";
import { Loader } from "@/components/elements/loader";
import { Greeting } from "./greeting";
import { PreviewMessage, ThinkingMessage } from "./message";

type MessagesProps = {
  chatId: string;
  status: UseChatHelpers<ChatMessage>["status"];
  votes: Vote[] | undefined;
  messages: ChatMessage[];
  setMessages: UseChatHelpers<ChatMessage>["setMessages"];
  regenerate: UseChatHelpers<ChatMessage>["regenerate"];
  isReadonly: boolean;
  isArtifactVisible: boolean;
  selectedModelId: string;
};

// Messages container component with scroll management
function PureMessages({
  chatId,
  status,
  votes,
  messages,
  setMessages,
  regenerate,
  isReadonly,
  selectedModelId,
}: MessagesProps) {
  // Get scroll management utilities from hook
  const {
    containerRef: messagesContainerRef,
    endRef: messagesEndRef,
    isAtBottom,
    scrollToBottom,
    hasSentMessage,
  } = useMessages({
    status,
  });

  useDataStream();

  // Track if we've scrolled for this chat to avoid scrolling on every render
  const hasScrolledForChatRef = useRef<string | null>(null);
  // Track loading state when switching chats
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const previousChatIdRef = useRef<string>(chatId);

  // Detect chat ID change to show loading state
  useEffect(() => {
    if (previousChatIdRef.current !== chatId) {
      setIsLoadingChat(true);
      previousChatIdRef.current = chatId;
      // Reset scroll tracking for new chat
      hasScrolledForChatRef.current = null;
    }
  }, [chatId]);

  // Hide loading state when messages are loaded
  useEffect(() => {
    if (isLoadingChat && messages.length > 0) {
      // Small delay to ensure smooth transition
      const timeoutId = setTimeout(() => {
        setIsLoadingChat(false);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoadingChat, messages.length]);

  // Auto-scroll to bottom when opening a chat from history (when chatId changes and messages exist)
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // Only scroll if this is a new chat (chatId changed) or we haven't scrolled for this chat yet
      if (hasScrolledForChatRef.current !== chatId) {
        // Use a small delay to ensure DOM is fully rendered
        const timeoutId = setTimeout(() => {
          const container = messagesContainerRef.current;
          if (container) {
            container.scrollTo({
              top: container.scrollHeight,
              behavior: "auto", // Use "auto" for instant scroll on initial load
            });
            hasScrolledForChatRef.current = chatId;
            setIsLoadingChat(false);
          }
        }, 100);

        return () => clearTimeout(timeoutId);
      }
    }
  }, [chatId, messages.length, messagesContainerRef]);

  // Auto-scroll to bottom when message is submitted
  useEffect(() => {
    if (status === "submitted") {
      requestAnimationFrame(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth",
          });
        }
      });
    }
  }, [status, messagesContainerRef]);

  return (
    <div
      className="overscroll-behavior-contain -webkit-overflow-scrolling-touch flex-1 touch-pan-y overflow-y-scroll"
      ref={messagesContainerRef}
      style={{ overflowAnchor: "none" }}
    >
      <Conversation className="mx-auto flex min-w-0 max-w-4xl flex-col gap-4 md:gap-6">
        <ConversationContent className="flex flex-col gap-4 px-2 py-4 md:gap-6 md:px-4">
          {/* Show loading animation when switching chats */}
          {isLoadingChat && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <Loader size={24} />
              <p className="text-muted-foreground text-sm">Loading chat...</p>
            </div>
          )}

          {/* Show greeting only when not loading and no messages */}
          {!isLoadingChat && messages.length === 0 && <Greeting />}

          {messages.map((message, index) => (
            <PreviewMessage
              chatId={chatId}
              isLoading={
                status === "streaming" && messages.length - 1 === index
              }
              isReadonly={isReadonly}
              key={message.id}
              message={message}
              regenerate={regenerate}
              requiresScrollPadding={
                hasSentMessage && index === messages.length - 1
              }
              setMessages={setMessages}
              vote={
                votes
                  ? votes.find((vote) => vote.messageId === message.id)
                  : undefined
              }
            />
          ))}

          {/* Show thinking indicator when waiting for AI response */}
          {status === "submitted" &&
            messages.length > 0 &&
            messages.at(-1)?.role === "user" &&
            selectedModelId !== "chat-model-reasoning" && <ThinkingMessage />}

          {/* Show thinking indicator when streaming starts but no text content yet */}
          {status === "streaming" &&
            messages.length > 0 &&
            messages.at(-1)?.role === "assistant" &&
            !messages
              .at(-1)
              ?.parts?.some(
                (part) => part.type === "text" && part.text?.trim()
              ) &&
            selectedModelId !== "chat-model-reasoning" && <ThinkingMessage />}

          {/* Anchor element for scroll position detection */}
          <div
            className="min-h-[24px] min-w-[24px] shrink-0"
            ref={messagesEndRef}
          />
        </ConversationContent>
      </Conversation>

      {!isAtBottom && (
        <button
          aria-label="Scroll to bottom"
          className="-translate-x-1/2 absolute bottom-40 left-1/2 z-10 rounded-full border bg-background p-2 shadow-lg transition-colors hover:bg-muted"
          onClick={() => scrollToBottom("smooth")}
          type="button"
        >
          <ArrowDownIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

export const Messages = memo(PureMessages, (prevProps, nextProps) => {
  if (prevProps.isArtifactVisible && nextProps.isArtifactVisible) {
    return true;
  }

  if (prevProps.status !== nextProps.status) {
    return false;
  }
  if (prevProps.selectedModelId !== nextProps.selectedModelId) {
    return false;
  }
  if (prevProps.messages.length !== nextProps.messages.length) {
    return false;
  }
  if (!equal(prevProps.messages, nextProps.messages)) {
    return false;
  }
  if (!equal(prevProps.votes, nextProps.votes)) {
    return false;
  }

  return false;
});
