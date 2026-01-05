// Sidebar toggle button component for responsive sidebar navigation with tooltip support
import type { ComponentProps } from "react";

import { type SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SidebarLeftIcon } from "./icons";
import { Button } from "./ui/button";

// Button that toggles the responsive sidebar and shows tooltip on desktop
// Icon-only button without border for minimal visual footprint
// Toggle button for collapsing/expanding the sidebar with tooltip on desktop
export function SidebarToggle({
  className,
}: ComponentProps<typeof SidebarTrigger>) {
  const { toggleSidebar } = useSidebar();

  // Render icon-only toggle button with tooltip support
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn(
            "h-8 w-8 cursor-pointer p-0 border-0 shadow-none",
            className
          )}
          data-testid="sidebar-toggle-button"
          onClick={toggleSidebar}
          variant="ghost"
        >
          <SidebarLeftIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start" className="hidden md:block">
        Toggle Sidebar
      </TooltipContent>
    </Tooltip>
  );
}
