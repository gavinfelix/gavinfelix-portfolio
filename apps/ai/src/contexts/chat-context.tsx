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

export function ChatContextProvider({ children }: { children: ReactNode }) {
  const [chatId, setChatId] = useState<string | null>(null);
  const [visibilityType, setVisibilityType] = useState<VisibilityType>("private");
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

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatContextProvider");
  }
  return context;
}

