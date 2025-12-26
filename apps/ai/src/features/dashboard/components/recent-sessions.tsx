"use client";

// Recent sessions component displaying the latest chat sessions
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader } from "@/components/elements/loader";
import { cn } from "@/lib/utils";

type RecentSessionsProps = {
  recentSessions: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
  isLoading?: boolean;
};

export function RecentSessions({
  recentSessions,
  isLoading,
}: RecentSessionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your latest chat conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader size={24} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recentSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
          <CardDescription>Your latest chat conversations</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No sessions yet. Start a new chat to see it here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Render list of recent chat sessions with navigation links
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Your latest chat conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentSessions.map((session) => {
            return <RecentSessionItem key={session.id} session={session} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Individual recent session item with loading state
function RecentSessionItem({
  session,
}: {
  session: {
    id: string;
    title: string;
    createdAt: Date;
  };
}) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const isActive = pathname === `/chat/${session.id}`;

  const createdAt = new Date(session.createdAt);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  // Detect when navigation to this chat completes
  useEffect(() => {
    if (isActive && isNavigating) {
      // Navigation completed, hide loading
      setIsNavigating(false);
    }
  }, [pathname, session.id, isActive, isNavigating]);

  const handleClick = () => {
    setIsNavigating(true);
  };

  return (
    <Link
      href={`/chat/${session.id}`}
      onClick={handleClick}
      className={cn(
        "block rounded-lg border p-4 transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isNavigating && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">
              {session.title || "Untitled Chat"}
            </h4>
            {isNavigating && (
              <span className="shrink-0">
                <Loader size={14} />
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
        </div>
      </div>
    </Link>
  );
}
