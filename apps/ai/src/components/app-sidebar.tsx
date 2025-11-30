"use client";

// Main sidebar layout component combining header, chat history, and user navigation
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "next-auth";
import { FileIcon, LineChartIcon, MessageIcon } from "@/components/icons";
import { SidebarHistory } from "@/features/chat/components/sidebar-history";
import { SidebarUserNav } from "@/components/sidebar-user-nav";
import { SidebarToggle } from "@/components/sidebar-toggle";
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

// Sidebar layout combining history list, toggle button, and user menu
export function AppSidebar({ user }: { user: User | undefined }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const isDashboardActive = pathname === "/dashboard";
  const isChatActive = pathname === "/" || pathname.startsWith("/chat/");
  const isTemplatesActive = pathname === "/templates";

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          {/* Chatbot title and Toggle Sidebar button */}
          <div className="flex flex-row items-center justify-between">
            <Link
              className="flex flex-row items-center gap-3 group-data-[collapsible=icon]:justify-center"
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
            >
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted group-data-[collapsible=icon]:hidden">
                Chatbot
              </span>
            </Link>
            <SidebarToggle />
          </div>

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
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
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
                <span className="group-data-[collapsible=icon]:hidden">Chat</span>
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
                <span className="group-data-[collapsible=icon]:hidden">Templates</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="group-data-[collapsible=icon]:hidden">
        <SidebarHistory user={user} />
      </SidebarContent>
      <SidebarFooter className="mt-auto">{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
