// Admin usage analytics page displaying per-user usage statistics
import { requireAdmin } from "@/lib/auth";
import { getUserUsageStats } from "@/lib/db/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UsageTable } from "./_components/UsageTable";

export default async function UsagePage() {
  // Ensure user is authenticated and has admin role
  // Middleware already handles redirect, but this provides an additional check
  await requireAdmin();

  let usageStats;
  let error: string | null = null;

  try {
    // Fetch usage statistics from the AI app database
    usageStats = await getUserUsageStats();
  } catch (err) {
    console.error("Error fetching usage statistics:", err);
    error = err instanceof Error ? err.message : "Failed to fetch usage statistics";
    usageStats = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usage</h1>
        <p className="text-muted-foreground">
          Usage statistics per user for the AI English app
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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>User Usage Statistics</CardTitle>
                <CardDescription>
                  {usageStats.length}{" "}
                  {usageStats.length === 1 ? "user" : "users"} with activity
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <UsageTable stats={usageStats} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}




