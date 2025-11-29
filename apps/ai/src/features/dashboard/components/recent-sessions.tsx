"use client";

// Recent sessions component displaying the latest chat sessions
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sessions</CardTitle>
        <CardDescription>Your latest chat conversations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentSessions.map((session) => {
            const createdAt = new Date(session.createdAt);
            const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

            return (
              <Link
                key={session.id}
                href={`/chat/${session.id}`}
                className={cn(
                  "block rounded-lg border p-4 transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {session.title || "Untitled Chat"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {timeAgo}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

