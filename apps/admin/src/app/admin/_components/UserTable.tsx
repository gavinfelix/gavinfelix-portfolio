import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserTableProps {
  users: Array<{
    id: string;
    email: string;
    type: "regular" | "guest";
    createdAt: Date | string;
  }>;
}

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

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No users found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Created At</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-mono text-xs">
              {user.id.slice(0, 8)}...
            </TableCell>
            <TableCell className="font-medium">{user.email}</TableCell>
            <TableCell>
              <Badge
                variant={user.type === "regular" ? "default" : "secondary"}
              >
                {user.type === "regular" ? "Registered" : "Guest"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(user.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

