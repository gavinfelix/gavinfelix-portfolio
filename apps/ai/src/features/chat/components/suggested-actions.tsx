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

// Render suggested action buttons with animated entrance effects for empty chat state
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
        {suggestedActions.map((suggestedAction, index) => {
          const isFirst = index === 0;
          return (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
              key={suggestedAction}
              // Stagger animation delays for smooth entrance effect
              transition={{ delay: 0.05 * index }}
            >
              {isFirst ? (
                <motion.div
                  whileHover={{
                    y: -2,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeOut",
                  }}
                  className="relative rounded-lg"
                >
                  <Suggestion
                    className="relative h-auto w-full whitespace-normal border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 p-3 text-left shadow-xl backdrop-blur-sm transition-shadow duration-300 hover:shadow-2xl overflow-hidden"
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
                    <motion.div
                      animate={{
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute inset-[2px] rounded-[calc(0.5rem-2px)] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 pointer-events-none"
                    />
                    <span className="relative z-10">{suggestedAction}</span>
                  </Suggestion>
                </motion.div>
              ) : (
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
              )}
            </motion.div>
          );
        })}
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
