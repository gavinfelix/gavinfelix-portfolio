import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Script from "next/script";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { DataStreamProvider } from "@/components/data-stream-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "../(auth)/auth";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if user is not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Get sidebar state from cookie to restore user preference
  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

  // Render main app layout with sidebar, header, and data stream provider
  // Note: SessionProvider is already at root layout, no need to duplicate here
  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <div className="flex w-full h-dvh min-w-0">
            <AppSidebar user={session.user} />
            <SidebarInset>
              <AppHeader />
              {children}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  );
}
