"use client";

import Link from "next/link";
import { useTransition, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function DocumentLink({ href, children, className }: DocumentLinkProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  // Reset navigating state when pathname changes
  useEffect(() => {
    if (navigatingTo && pathname === navigatingTo) {
      setNavigatingTo(null);
    }
  }, [pathname, navigatingTo]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isPending || pathname === href) {
      e.preventDefault();
      return;
    }

    setNavigatingTo(href);
    startTransition(() => {
      // Navigation is handled by Link component
    });
  };

  const isNavigating = navigatingTo === href;
  const showLoading = isNavigating && pathname !== href;

  return (
    <Link
      href={href}
      onClick={handleClick}
      prefetch={true}
      className={cn(
        "hover:underline relative inline-flex items-center gap-2 transition-all duration-200",
        (isPending || isNavigating) && pathname !== href && "opacity-70 cursor-wait",
        className
      )}
      aria-disabled={isPending || isNavigating}
    >
      {children}
      {showLoading && (
        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
      )}
    </Link>
  );
}

