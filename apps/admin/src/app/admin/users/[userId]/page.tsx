// User detail page showing user info, usage summary, and recent chats
import { requireAdmin } from "@/lib/auth";
import {
  getAIAppUserById,
  getUserUsageSummary,
  getUserRecentChats,
} from "@/lib/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { notFound } from "next/navigation";

function formatDate(date: Date | string | null): string {
  if (!date) return "Never";
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

interface UserDetailPageProps {
  params: Promise<{ userId: string }>;
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  await requireAdmin();

  const { userId } = await params;

  // Fetch user data with error handling
  let user;
  let usageSummary;
  let recentChats;
  let userError: string | null = null;
  let usageError: string | null = null;
  let chatsError: string | null = null;

  try {
    user = await getAIAppUserById(userId);
  } catch (err) {
    console.error("Error fetching user:", err);
    userError = err instanceof Error ? err.message : "Failed to fetch user";
  }

  if (!user && !userError) {
    notFound();
  }

  if (user) {
    try {
      usageSummary = await getUserUsageSummary(userId);
    } catch (err) {
      console.error("Error fetching usage summary:", err);
      usageError = err instanceof Error ? err.message : "Failed to fetch usage";
      usageSummary = {
        totalChats: 0,
        totalMessages: 0,
        lastActivity: null,
      };
    }

    try {
      recentChats = await getUserRecentChats(userId, 20);
    } catch (err) {
      console.error("Error fetching recent chats:", err);
      chatsError = err instanceof Error ? err.message : "Failed to fetch chats";
      recentChats = [];
    }
  }

  if (userError || !user) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/users"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Users
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">User Detail</h1>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">User Not Found</CardTitle>
            <CardDescription>
              {userError || "The requested user could not be found."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Users
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">User Detail</h1>
        <p className="text-muted-foreground">
          Details and activity for {user.email}
        </p>
      </div>

      {/* User Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">ID</dt>
              <dd className="mt-1 text-sm font-mono">{user.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="mt-1 text-sm">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Type</dt>
              <dd className="mt-1">
                <Badge
                  variant={user.type === "regular" ? "default" : "secondary"}
                >
                  {user.type === "regular" ? "Registered" : "Guest"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created At
              </dt>
              <dd className="mt-1 text-sm">
                {formatDate(user.createdAt)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Usage Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {usageError ? (
            <div className="text-sm text-destructive">
              Error loading usage: {usageError}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Total Chats
                </dt>
                <dd className="mt-1 text-2xl font-bold">
                  {formatNumber(usageSummary?.totalChats ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Total Messages
                </dt>
                <dd className="mt-1 text-2xl font-bold">
                  {formatNumber(usageSummary?.totalMessages ?? 0)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Last Activity
                </dt>
                <dd className="mt-1 text-sm">
                  {formatDate(usageSummary?.lastActivity ?? null)}
                </dd>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Chats Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Chats</CardTitle>
          <CardDescription>
            Last {recentChats?.length ?? 0} chats for this user
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chatsError ? (
            <div className="p-8 text-center text-destructive">
              <p className="font-medium">Error loading chats</p>
              <p className="text-sm text-muted-foreground mt-1">{chatsError}</p>
            </div>
          ) : !recentChats || recentChats.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No chats found for this user
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chat ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Messages</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentChats.map((chat) => (
                    <TableRow key={chat.id}>
                      <TableCell className="font-mono text-xs">
                        {chat.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">{chat.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(chat.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(chat.messageCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

