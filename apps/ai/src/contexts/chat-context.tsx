"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { VisibilityType } from "@/components/visibility-selector";

type ChatContextType = {
  chatId: string | null;
  visibilityType: VisibilityType;
  isReadonly: boolean;
  setChatId: Dispatch<SetStateAction<string | null>>;
  setVisibilityType: Dispatch<SetStateAction<VisibilityType>>;
  setIsReadonly: Dispatch<SetStateAction<boolean>>;
};

const ChatContext = createContext<ChatContextType | null>(null);

// Context provider for managing global chat state (chatId, visibility, readonly mode)
export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [visibilityType, setVisibilityType] =
    useState<VisibilityType>("private");
  const [isReadonly, setIsReadonly] = useState<boolean>(false);

  return (
    <ChatContext.Provider
      value={{
        chatId,
        visibilityType,
        isReadonly,
        setChatId,
        setVisibilityType,
        setIsReadonly,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// Hook to access chat context with fallback to default values when context is unavailable
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    // Return default values if context is not available (graceful degradation)
    return {
      chatId: null,
      visibilityType: "private" as const,
      isReadonly: false,
      setChatId: () => {},
      setVisibilityType: () => {},
      setIsReadonly: () => {},
    };
  }
  return context;
}
