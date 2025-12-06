// Chat detail page showing chat info and full message list
import { requireAdmin } from "@/lib/auth";
import { getChatById, getChatMessages } from "@/lib/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface ChatDetailPageProps {
  params: Promise<{ chatId: string }>;
  searchParams: Promise<{ userId?: string }>;
}

export default async function ChatDetailPage({
  params,
  searchParams,
}: ChatDetailPageProps) {
  await requireAdmin();

  const { chatId } = await params;
  const { userId } = await searchParams;

  // Fetch chat data with error handling
  let chat;
  let messages;
  let chatError: string | null = null;
  let messagesError: string | null = null;

  try {
    chat = await getChatById(chatId);
  } catch (err) {
    console.error("Error fetching chat:", err);
    chatError = err instanceof Error ? err.message : "Failed to fetch chat";
  }

  if (!chat && !chatError) {
    notFound();
  }

  if (chat) {
    try {
      messages = await getChatMessages(chatId, 200);
    } catch (err) {
      console.error("Error fetching messages:", err);
      messagesError = err instanceof Error ? err.message : "Failed to fetch messages";
      messages = [];
    }
  }

  if (chatError || !chat) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href={userId ? `/admin/users/${userId}` : "/admin/users"}
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back {userId ? "to User" : "to Users"}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Chat Detail</h1>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Chat Not Found</CardTitle>
            <CardDescription>
              {chatError || "The requested chat could not be found."}
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
          href={userId ? `/admin/users/${userId}` : "/admin/users"}
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back {userId ? "to User" : "to Users"}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Chat Detail</h1>
        <p className="text-muted-foreground">
          Conversation with {chat.userEmail}
        </p>
      </div>

      {/* Chat Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Chat Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Chat ID</dt>
              <dd className="mt-1 text-sm font-mono">{chat.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Title</dt>
              <dd className="mt-1 text-sm font-medium">{chat.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">User</dt>
              <dd className="mt-1 text-sm">
                <Link
                  href={`/admin/users/${chat.userId}`}
                  className="hover:underline text-primary"
                >
                  {chat.userEmail}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Visibility</dt>
              <dd className="mt-1">
                <Badge variant="outline">{chat.visibility}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Created At</dt>
              <dd className="mt-1 text-sm">{formatDate(chat.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Total Messages
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatNumber(chat.messageCount)}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Messages Section */}
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>Full conversation for this chat</CardDescription>
        </CardHeader>
        <CardContent>
          {messagesError ? (
            <div className="p-8 text-center text-destructive">
              <p className="font-medium">Error loading messages</p>
              <p className="text-sm text-muted-foreground mt-1">{messagesError}</p>
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No messages yet for this chat
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto pr-4 space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={
                        message.role === "user"
                          ? "default"
                          : message.role === "assistant"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {message.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(message.createdAt)}
                    </span>
                  </div>
                  <div
                    className={`mt-2 p-3 rounded-md text-sm whitespace-pre-wrap ${
                      message.role === "assistant"
                        ? "bg-muted/50"
                        : message.role === "user"
                          ? "bg-primary/5"
                          : "bg-background"
                    }`}
                  >
                    {message.content || "(Empty message)"}
                  </div>
                  {index < messages.length - 1 && (
                    <div className="mt-4 border-t border-border" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

