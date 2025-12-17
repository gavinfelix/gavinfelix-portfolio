"use client";

// Suggested actions component displaying predefined prompts for empty chat state
import type { UseChatHelpers } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { memo } from "react";
import type { ChatMessage } from "@/lib/types";
import { Suggestion } from "@/components/elements/suggestion";
import type { VisibilityType } from "@/components/visibility-selector";

type SuggestedActionsProps = {
  chatId: string;
  sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
  selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({ chatId, sendMessage }: SuggestedActionsProps) {
  // Predefined prompt suggestions for empty chat state - English learning focused
  const suggestedActions = [
    "IELTS Speaking Framework & Model Answers",
    "Explain grammar rules with clear examples",
    "Teach me 5 useful phrases for daily English",
    "Improve my English writing with corrections",
  ];

  return (
    <div className="flex w-full flex-col gap-3">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground text-sm font-medium"
      >
        What would you like to practice?
      </motion.div>
      <div
        className="grid w-full gap-2 sm:grid-cols-2"
        data-testid="suggested-actions"
      >
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            key={suggestedAction}
            // Stagger animation delays for smooth entrance effect
            transition={{ delay: 0.05 * index }}
          >
            <Suggestion
              className="h-auto w-full whitespace-normal p-3 text-left"
              onClick={(suggestion) => {
                window.history.replaceState({}, "", `/chat/${chatId}`);
                // Send selected suggestion as user message
                sendMessage({
                  role: "user",
                  parts: [{ type: "text", text: suggestion }],
                });
              }}
              suggestion={suggestedAction}
            >
              {suggestedAction}
            </Suggestion>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const SuggestedActions = memo(
  PureSuggestedActions,
  (prevProps, nextProps) => {
    if (prevProps.chatId !== nextProps.chatId) {
      return false;
    }
    if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
      return false;
    }

    return true;
  }
);
