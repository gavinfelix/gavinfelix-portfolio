"use client";

// App header component with settings button
import { SettingsDialog } from "@/features/settings/components/settings-dialog";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-end border-b bg-background px-4">
      <SettingsDialog />
    </header>
  );
}

