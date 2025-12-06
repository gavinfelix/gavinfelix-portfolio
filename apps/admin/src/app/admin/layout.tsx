"use client";

import { ReactNode } from "react";

import Link from "next/link";

import { usePathname } from "next/navigation";

import clsx from "clsx";

export default function AdminLayout({

  children,

}: {

  children: ReactNode;

}) {

  const pathname = usePathname();

  // Check if a path is active (including sub-paths)
  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const navItems = [

    { label: "Dashboard", href: "/admin" },

    { label: "Users", href: "/admin/users" },

    { label: "Usage", href: "/admin/usage" },

    { label: "Documents", href: "/admin/documents" },

    { label: "Settings", href: "/admin/settings" },

  ];



  return (

    <div className="flex h-screen w-full bg-white text-foreground">

      {/* Sidebar */}

      <aside className="w-64 border-r bg-white shadow-sm">

        <div className="px-6 py-6 text-xl font-semibold">Admin Panel</div>



        <nav className="flex flex-col gap-1 px-3">

          {navItems.map((item) => (

            <Link

              key={item.href}

              href={item.href}

              className={clsx(

                "px-4 py-2 rounded-md text-sm font-medium transition-colors",

                isActive(item.href)

                  ? "bg-black text-white"

                  : "text-muted-foreground hover:bg-muted hover:text-foreground"

              )}

            >

              {item.label}

            </Link>

          ))}

        </nav>

      </aside>



      {/* Main content */}

      <main className="flex-1 overflow-y-auto bg-white">

        {/* Header */}

        <header className="h-14 border-b bg-white flex items-center px-6 shadow-sm">

          <span className="font-medium">Admin Dashboard</span>

        </header>



        {/* Page content */}

        <div className="p-6 bg-white">{children}</div>

      </main>

    </div>

  );

}

