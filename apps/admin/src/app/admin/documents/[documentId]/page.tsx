// Document detail page showing document info and related chats
import { requireAdmin } from "@/lib/auth";
import {
  getDocumentById,
  getDocumentRelatedChats,
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

interface DocumentDetailPageProps {
  params: Promise<{ documentId: string }>;
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  await requireAdmin();

  const { documentId } = await params;

  // Fetch document data with error handling
  let document;
  let relatedChats;
  let docError: string | null = null;
  let chatsError: string | null = null;

  try {
    document = await getDocumentById(documentId);
  } catch (err) {
    console.error("Error fetching document:", err);
    docError = err instanceof Error ? err.message : "Failed to fetch document";
  }

  if (!document && !docError) {
    notFound();
  }

  if (document) {
    try {
      relatedChats = await getDocumentRelatedChats(documentId, 20);
    } catch (err) {
      console.error("Error fetching related chats:", err);
      chatsError =
        err instanceof Error ? err.message : "Failed to fetch related chats";
      relatedChats = [];
    }
  }

  if (docError || !document) {
    return (
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/documents"
            className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
          >
            ← Back to Documents
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Document Detail</h1>
        </div>
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Document Not Found</CardTitle>
            <CardDescription>
              {docError || "The requested document could not be found."}
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
          href="/admin/documents"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 inline-block"
        >
          ← Back to Documents
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Document Detail</h1>
        <p className="text-muted-foreground">
          Details and usage for &quot;{document.title}&quot;
        </p>
      </div>

      {/* Document Information Section */}
      <Card>
        <CardHeader>
          <CardTitle>Document Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Document ID
              </dt>
              <dd className="mt-1 text-sm font-mono">{document.id}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Title</dt>
              <dd className="mt-1 text-sm font-medium">{document.title}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Owner</dt>
              <dd className="mt-1 text-sm">
                <Link
                  href={`/admin/users/${document.userId}`}
                  className="hover:underline text-primary"
                >
                  {document.userEmail}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Type</dt>
              <dd className="mt-1">
                <Badge variant="outline">{document.kind}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">
                Created At
              </dt>
              <dd className="mt-1 text-sm">{formatDate(document.createdAt)}</dd>
            </div>
            {document.content && (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  Content Preview
                </dt>
                <dd className="mt-1 text-sm text-muted-foreground max-h-32 overflow-y-auto p-2 bg-muted/50 rounded">
                  {document.content.length > 200
                    ? `${document.content.slice(0, 200)}...`
                    : document.content}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Related Chats Section */}
      {chatsError ? (
        <Card>
          <CardHeader>
            <CardTitle>Related Chats</CardTitle>
            <CardDescription>
              Chats that have used this document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-destructive">
              <p className="font-medium">Error loading related chats</p>
              <p className="text-sm text-muted-foreground mt-1">{chatsError}</p>
            </div>
          </CardContent>
        </Card>
      ) : relatedChats && relatedChats.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Related Chats</CardTitle>
            <CardDescription>
              Chats that have used this document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Chat ID</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Created At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatedChats.map((chat) => (
                    <TableRow key={chat.id}>
                      <TableCell className="font-mono text-xs">
                        <Link
                          href={`/admin/chats/${chat.id}`}
                          className="hover:underline"
                        >
                          {chat.id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/chats/${chat.id}`}
                          className="hover:underline"
                        >
                          {chat.title}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(chat.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Related Chats</CardTitle>
            <CardDescription>
              Chats that have used this document
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-muted-foreground">
              No related chats found for this document
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

