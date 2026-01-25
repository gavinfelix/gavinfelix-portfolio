"use client";

// Chat header component with new chat button
// Visibility selector has been moved to AppHeader
import { useRouter } from "next/navigation";
import { memo } from "react";
import { useWindowSize } from "usehooks-ts";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/icons";
import { useSidebar } from "@/components/ui/sidebar";

// Chat header component with sidebar toggle and new chat button
function PureChatHeader() {
  const router = useRouter();
  const { open } = useSidebar();

  // Track viewport width to show new-chat button only on mobile when sidebar is closed
  const { width: windowWidth } = useWindowSize();

  // Render header with responsive new chat button for mobile devices
  return (
    <header className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
      {/* Show new chat button only on mobile (desktop always has sidebar visible, even when collapsed) */}
      {windowWidth < 768 && !open && (
        <Button
          className="order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-fit md:px-2"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader);
