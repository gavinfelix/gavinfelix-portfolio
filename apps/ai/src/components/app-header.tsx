"use client";

// Floating header component with settings button
import { SettingsDialog } from "@/features/settings/components/settings-dialog";

export function AppHeader() {
  return (
    <header className="fixed top-4 right-4 z-50 flex h-auto w-auto items-center gap-2 rounded-lg bg-background/80 backdrop-blur-sm px-2 py-1.5">
      <SettingsDialog />
    </header>
  );
}
