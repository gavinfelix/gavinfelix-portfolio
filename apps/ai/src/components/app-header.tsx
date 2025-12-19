"use client";

// Top header bar component with app name, visibility selector, and settings button
import { SettingsDialog } from "@/features/settings/components/settings-dialog";
import { VisibilitySelector } from "@/components/visibility-selector";
import { useChatContext } from "@/contexts/chat-context";

export function AppHeader() {
  const { chatId, visibilityType, isReadonly } = useChatContext();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-[100vw] items-center justify-between px-4 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="min-w-0">
            <div className="truncate text-base font-semibold leading-tight md:text-lg">
              AI English Learning Assistant
            </div>
            <div className="hidden truncate text-xs text-muted-foreground sm:block">
              Structured practice for IELTS, grammar, and writing.
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {chatId && !isReadonly && (
            <VisibilitySelector
              chatId={chatId}
              selectedVisibilityType={visibilityType}
            />
          )}
          <SettingsDialog />
        </div>
      </div>
    </header>
  );
}
