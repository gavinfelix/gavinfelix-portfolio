import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

// Conversation container with auto-scroll to bottom behavior
export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn(
      "relative flex-1 touch-pan-y overflow-y-auto will-change-scroll",
      className
    )}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>;

// Conversation content wrapper with padding
export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content className={cn("p-4", className)} {...props} />
);
