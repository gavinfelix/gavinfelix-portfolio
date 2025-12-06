import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface MessageTrendPoint {
  date: string; // YYYY-MM-DD format
  count: number;
}

interface MessageTrendTableProps {
  data: MessageTrendPoint[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

export function MessageTrendTable({ data }: MessageTrendTableProps) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No data available
      </div>
    );
  }

  // Show most recent dates first
  const reversedData = [...data].reverse();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Messages</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reversedData.map((point) => (
          <TableRow key={point.date}>
            <TableCell className="font-medium">{formatDate(point.date)}</TableCell>
            <TableCell className="text-right">
              {formatNumber(point.count)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

