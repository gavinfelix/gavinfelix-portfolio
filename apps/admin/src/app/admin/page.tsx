// Admin dashboard page displaying overview metrics and activity trends
import { requireAdmin } from "@/lib/auth";
import {
  getDashboardMetrics,
  getMessageTrend,
} from "@/lib/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MetricCard } from "./_components/MetricCard";
import { MessageTrendTable } from "./_components/MessageTrendTable";

export default async function AdminDashboard() {
  // Ensure user is authenticated and has admin role
  // Middleware already handles redirect, but this provides an additional check
  await requireAdmin();

  // Fetch metrics with individual error handling
  let metrics;
  let metricsError: string | null = null;
  try {
    metrics = await getDashboardMetrics();
  } catch (err) {
    console.error("Error fetching dashboard metrics:", err);
    metricsError = err instanceof Error ? err.message : "Failed to fetch metrics";
    metrics = {
      totalUsers: 0,
      activeUsersLast7Days: 0,
      totalChats: 0,
      totalMessages: 0,
    };
  }

  // Fetch message trend with error handling
  let messageTrend;
  let trendError: string | null = null;
  try {
    messageTrend = await getMessageTrend(30); // Last 30 days
  } catch (err) {
    console.error("Error fetching message trend:", err);
    trendError = err instanceof Error ? err.message : "Failed to fetch trend data";
    messageTrend = [];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of users and activity for the AI English app
        </p>
      </div>

      {/* Metrics Grid */}
      {metricsError ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error loading metrics</CardTitle>
            <CardDescription>{metricsError}</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers}
            description="All-time"
          />
          <MetricCard
            title="Active Users"
            value={metrics.activeUsersLast7Days}
            description="Last 7 days"
          />
          <MetricCard
            title="Total Chats"
            value={metrics.totalChats}
            description="All-time"
          />
          <MetricCard
            title="Total Messages"
            value={metrics.totalMessages}
            description="All-time"
          />
        </div>
      )}

      {/* Activity Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Messages over time</CardTitle>
          <CardDescription>
            Daily message count for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trendError ? (
            <div className="p-8 text-center text-destructive">
              <p className="font-medium">Error loading trend data</p>
              <p className="text-sm text-muted-foreground mt-1">{trendError}</p>
            </div>
          ) : (
            <MessageTrendTable data={messageTrend} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

