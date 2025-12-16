import { ReactNode } from "react";
import type { Metadata } from "next";
import { getAdminSettings } from "@/lib/admin-settings";
import { AdminNav } from "./_components/admin-nav";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAdminSettings();
  return {
    title: settings.siteName,
  };
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getAdminSettings();

  return (
    <div className="flex h-screen w-full bg-white text-foreground">
      {/* Sidebar */}
      <AdminNav siteName={settings.siteName} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-white">
        {/* Header */}
        <header className="h-14 border-b bg-white flex items-center px-6 shadow-sm">
          <span className="font-medium">{settings.siteName}</span>
        </header>

        {/* Page content */}
        <div className="p-6 bg-white">{children}</div>
      </main>
    </div>
  );
}

