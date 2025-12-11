// Admin sidebar navigation component with collapsible menu and active route highlighting
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Settings, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

// Menu item type definition
type MenuItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  tooltip: string;
};

// Navigation menu items configuration
const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    tooltip: "Dashboard",
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    tooltip: "Users",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    tooltip: "Settings",
  },
];

// Navigation item component
function NavItem({ item, isActive, onNavigate }: { item: MenuItem; isActive: boolean; onNavigate: () => void }) {
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.tooltip}
      >
        <Link href={item.href} onClick={onNavigate}>
          <Icon size={16} />
          <span className="group-data-[collapsible=icon]:hidden">
            {item.title}
          </span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  // Check if a route is active
  const isActiveRoute = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleNavigate = () => {
    setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row items-center justify-between">
            <Link
              className="flex flex-row items-center gap-3 group-data-[collapsible=icon]:justify-center"
              href="/"
              onClick={handleNavigate}
            >
              <span className="cursor-pointer rounded-md px-2 font-semibold text-lg hover:bg-muted group-data-[collapsible=icon]:hidden">
                Admin
              </span>
            </Link>
            <SidebarTrigger />
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActiveRoute(item.href)}
              onNavigate={handleNavigate}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

