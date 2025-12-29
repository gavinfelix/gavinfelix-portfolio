import type { UseChatHelpers } from "@ai-sdk/react";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { useScrollToBottom } from "./use-scroll-to-bottom";

// Hook to manage message display and scroll behavior
export function useMessages({
  status,
}: {
  status: UseChatHelpers<ChatMessage>["status"];
}) {
  // Get scroll management utilities
  const {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
  } = useScrollToBottom();

  // Track if user has sent a message (for UI state)
  const [hasSentMessage, setHasSentMessage] = useState(false);

  // Update hasSentMessage flag when message is submitted
  useEffect(() => {
    if (status === "submitted") {
      setHasSentMessage(true);
    }
  }, [status]);

  // Return scroll utilities and message state for component use
  return {
    containerRef,
    endRef,
    isAtBottom,
    scrollToBottom,
    onViewportEnter,
    onViewportLeave,
    hasSentMessage,
  };
}
