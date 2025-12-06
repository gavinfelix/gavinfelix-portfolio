import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface UsageStats {
  userId: string;
  email: string;
  totalChats: number;
  totalMessages: number;
  lastActivity: Date | string | null;
}

interface UsageTableProps {
  stats: UsageStats[];
}

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

export function UsageTable({ stats }: UsageTableProps) {
  if (stats.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No usage statistics available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead className="text-right">Total Chats</TableHead>
          <TableHead className="text-right">Total Messages</TableHead>
          <TableHead>Last Activity</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stats.map((stat) => (
          <TableRow key={stat.userId}>
            <TableCell className="font-medium">{stat.email}</TableCell>
            <TableCell className="text-right">
              {formatNumber(stat.totalChats)}
            </TableCell>
            <TableCell className="text-right">
              {formatNumber(stat.totalMessages)}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatDate(stat.lastActivity)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

