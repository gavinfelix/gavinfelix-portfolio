// Documents list page showing all uploaded documents
import { requireAdmin } from "@/lib/auth";
import { getDocuments, getDocumentsCount } from "@/lib/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DocumentsPage() {
  await requireAdmin();

  let documents;
  let totalCount;
  let error: string | null = null;

  try {
    [documents, totalCount] = await Promise.all([
      getDocuments(100),
      getDocumentsCount(),
    ]);
  } catch (err) {
    console.error("Error fetching documents:", err);
    error = err instanceof Error ? err.message : "Failed to fetch documents";
    documents = [];
    totalCount = 0;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="text-muted-foreground">
          Uploaded documents for the AI English app
        </p>
      </div>

      {error ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            {totalCount} {totalCount === 1 ? "document" : "documents"} total
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Documents</CardTitle>
              <CardDescription>
                List of uploaded documents in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No documents found
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Created At</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className="hover:bg-muted/50 cursor-pointer"
                        >
                          <TableCell className="font-medium">
                            <Link
                              href={`/admin/documents/${doc.id}`}
                              className="hover:underline"
                            >
                              {doc.title}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Link
                              href={`/admin/users/${doc.userId}`}
                              className="hover:underline text-primary"
                            >
                              {doc.userEmail}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                              {doc.kind}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(doc.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

