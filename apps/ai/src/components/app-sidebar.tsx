"use client";

// Main sidebar layout component combining header, chat history, and user navigation
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "next-auth";
import { FileIcon, LineChartIcon, MessageIcon, PlusIcon } from "@/components/icons";
import { SidebarHistory } from "@/features/chat/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

// Sidebar layout combining history list, new chat button, and user menu
export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const isDashboardActive = pathname === "/dashboard";
  const isChatActive = pathname === "/" || pathname.startsWith("/chat/");
  const isTemplatesActive = pathname === "/templates";

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          {/* Navigation items */}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isDashboardActive}
              tooltip="Dashboard"
            >
              <Link
                href="/dashboard"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <LineChartIcon size={16} />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isChatActive}
              tooltip="Chat"
            >
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <MessageIcon size={16} />
                <span>Chat</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isTemplatesActive}
              tooltip="Templates"
            >
              <Link
                href="/templates"
                onClick={() => {
                  setOpenMobile(false);
                }}
              >
                <FileIcon size={16} />
                <span>Templates</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Chatbot title and New Chat button */}
          <div className="flex flex-row items-center justify-between mt-2">
            <Link
              className="flex flex-row items-center gap-3"
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
            >
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted">
                Chatbot
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="h-8 p-1 md:h-fit md:p-2"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push("/");
                    router.refresh();
                  }}
                  type="button"
                  variant="ghost"
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end" className="hidden md:block">
                New Chat
              </TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
