"use client";

// User navigation menu component in sidebar footer with theme toggle and authentication
import { ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "next-auth";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { LoaderIcon, UserIcon } from "./icons";
import { toast } from "./toast";
import { cn } from "@/lib/utils";

// Helper function to get user initials from email or name
function getUserInitials(email: string, name?: string | null): string {
  if (name) {
    // Extract initials from name (e.g., "John Doe" -> "JD")
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name[0]?.toUpperCase() || "";
  }

  // Extract initials from email (e.g., "john.doe@example.com" -> "JD")
  const emailPart = email.split("@")[0];
  const parts = emailPart.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return emailPart[0]?.toUpperCase() || "";
}

// User account menu shown in the sidebar footer
export function SidebarUserNav({ user }: { user: User }) {
  const router = useRouter();
  const { data, status } = useSession();
  const { setTheme, resolvedTheme } = useTheme();
  const { state } = useSidebar();

  // Extract user information from session or props with fallback values
  const email = data?.user?.email ?? user?.email ?? "";
  const name = data?.user?.name ?? user?.name ?? null;
  const isGuest = !email || data?.user?.type === "guest";
  const initials = !isGuest ? getUserInitials(email, name) : "";
  const isCollapsed = state === "collapsed";
  
  // Render user navigation menu with theme toggle and authentication actions
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {status === "loading" ? (
              <SidebarMenuButton className="h-10 justify-between bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <div className="flex flex-row gap-2">
                  <div className="size-6 animate-pulse rounded-full bg-zinc-500/30" />
                  <span className="animate-pulse rounded-md bg-zinc-500/30 text-transparent group-data-[collapsible=icon]:hidden">
                    Loading auth status
                  </span>
                </div>
                <div className="animate-spin text-zinc-500 group-data-[collapsible=icon]:hidden">
                  <LoaderIcon />
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                className="h-10 cursor-pointer bg-background data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                data-testid="user-nav-button"
                tooltip={{
                  children: isGuest ? "Guest" : email,
                  className: "whitespace-nowrap",
                }}
              >
                {isGuest ? (
                  <div className="flex size-6 items-center justify-center">
                    <UserIcon />
                  </div>
                ) : (
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </div>
                )}
                <span
                  className="truncate group-data-[collapsible=icon]:hidden"
                  data-testid="user-email"
                >
                  {isGuest ? "Guest" : email}
                </span>
                <ChevronUp className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn(
              "whitespace-nowrap",
              isCollapsed ? "min-w-[180px]" : "w-(--radix-popper-anchor-width)"
            )}
            data-testid="user-nav-menu"
            side="top"
          >
            <DropdownMenuItem
              className="cursor-pointer whitespace-nowrap"
              data-testid="user-nav-item-theme"
              onSelect={(e) => {
                e.preventDefault();
                const newTheme = resolvedTheme === "dark" ? "light" : "dark";
                setTheme(newTheme);
              }}
            >
              {resolvedTheme === "dark"
                ? "Switch to light mode"
                : "Switch to dark mode"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild data-testid="user-nav-item-auth">
              <button
                className="w-full cursor-pointer whitespace-nowrap"
                onClick={() => {
                  if (status === "loading") {
                    toast({
                      type: "error",
                      description:
                        "Checking authentication status, please try again!",
                    });

                    return;
                  }

                  if (isGuest) {
                    router.push("/login");
                  } else {
                    signOut({
                      redirectTo: "/",
                    });
                  }
                }}
                type="button"
              >
                {isGuest ? "Login to your account" : "Sign out"}
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
