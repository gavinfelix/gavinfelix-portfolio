"use client";

// Floating header component with dashboard and settings buttons
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChartIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { SettingsDialog } from "@/features/settings/components/settings-dialog";

export function AppHeader() {
  const pathname = usePathname();
  const isDashboardActive = pathname === "/dashboard";

  return (
    <header className="fixed top-4 right-4 z-50 flex h-auto w-auto items-center gap-2 rounded-lg border bg-background/80 backdrop-blur-sm px-2 py-1.5 shadow-md">
      <Button
        asChild
        variant={isDashboardActive ? "default" : "ghost"}
        size="icon"
        className="h-8 w-8"
      >
        <Link href="/dashboard">
          <LineChartIcon size={16} />
          <span className="sr-only">Dashboard</span>
        </Link>
      </Button>
      <SettingsDialog />
    </header>
  );
}
