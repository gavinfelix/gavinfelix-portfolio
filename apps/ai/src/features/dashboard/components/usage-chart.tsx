"use client";

// Usage chart component displaying message activity over the last 7 days
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader } from "@/components/elements/loader";
import { format } from "date-fns";

type UsageChartProps = {
  last7Days: Array<{
    date: string;
    messagesCount: number;
  }>;
  isLoading?: boolean;
};

export function UsageChart({ last7Days, isLoading }: UsageChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Message Activity</CardTitle>
          <CardDescription>Last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader size={24} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate maximum message count for proportional bar heights
  const maxCount = Math.max(...last7Days.map((day) => day.messagesCount), 1);

  // Render bar chart with proportional heights and date labels
  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Activity</CardTitle>
        <CardDescription>Last 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-end justify-between gap-2">
          {last7Days.map((day) => {
            const height = (day.messagesCount / maxCount) * 100;
            const date = new Date(day.date);
            const dayName = format(date, "EEE");
            const dayNumber = format(date, "d");

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className="w-full flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${day.messagesCount} messages on ${day.date}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {day.messagesCount}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs font-medium">{dayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {dayNumber}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
