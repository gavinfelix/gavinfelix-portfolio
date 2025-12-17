"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import clsx from "clsx";

type AdminNavProps = {
  siteName: string;
};

export function AdminNav({ siteName }: AdminNavProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Reset navigating state when pathname changes
  useEffect(() => {
    if (navigatingTo && pathname === navigatingTo) {
      setNavigatingTo(null);
    }
  }, [pathname, navigatingTo]);

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

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (isPending || isActive(href)) {
      e.preventDefault();
      return;
    }

    setNavigatingTo(href);
    startTransition(() => {
      // Navigation is handled by Link component
      // This transition wrapper ensures React knows about the state change
    });
  };

  return (
    <aside className="w-64 border-r bg-white shadow-sm">
      <div className="px-6 py-6 text-xl font-semibold">{siteName}</div>

      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const isNavigating = navigatingTo === item.href;
          const disabled = (isPending || isNavigating) && !active;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              prefetch={true}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                "relative",
                active
                  ? "bg-black text-white"
                  : disabled
                  ? "text-muted-foreground/50 cursor-wait pointer-events-none"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer",
                (isPending || isNavigating) && !active && "opacity-50"
              )}
              aria-disabled={disabled}
            >
              {item.label}
              {disabled && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
