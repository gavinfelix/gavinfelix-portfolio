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



  const navItems = [

    { label: "Dashboard", href: "/admin" },

    { label: "Users", href: "/admin/users" },

    { label: "Usage", href: "/admin/usage" },

    { label: "Documents", href: "/admin/documents" },

    { label: "Settings", href: "/admin/settings" },

  ];



  return (

    <div className="flex h-screen w-full bg-gray-50 text-gray-900">

      {/* Sidebar */}

      <aside className="w-64 border-r bg-white shadow-sm">

        <div className="px-6 py-6 text-xl font-semibold">Admin Panel</div>



        <nav className="flex flex-col gap-1 px-3">

          {navItems.map((item) => (

            <Link

              key={item.href}

              href={item.href}

              className={clsx(

                "px-4 py-2 rounded-md text-sm font-medium",

                pathname === item.href

                  ? "bg-gray-900 text-white"

                  : "text-gray-700 hover:bg-gray-200"

              )}

            >

              {item.label}

            </Link>

          ))}

        </nav>

      </aside>



      {/* Main content */}

      <main className="flex-1 overflow-y-auto">

        {/* Header */}

        <header className="h-14 border-b bg-white flex items-center px-6 shadow-sm">

          <span className="font-medium">Admin Dashboard</span>

        </header>



        {/* Page content */}

        <div className="p-6">{children}</div>

      </main>

    </div>

  );

}

