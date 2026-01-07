"use client";

// Dashboard page displaying user statistics and recent activity
import { useRouter } from "next/navigation";
import { useSessionContext } from "@/contexts/session-context";
import { useEffect } from "react";
import { RecentSessions } from "@/features/dashboard/components/recent-sessions";
import { StatsCards } from "@/features/dashboard/components/stats-cards";
import { UsageChart } from "@/features/dashboard/components/usage-chart";
import { useDashboardStats } from "@/features/dashboard/hooks/use-dashboard-stats";
import { Loader } from "@/components/elements/loader";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading: isSessionLoading } = useSessionContext();
  const { stats, isLoading, isError, error } = useDashboardStats();

  useEffect(() => {
    if (!isSessionLoading && !session) {
      router.push("/login");
    }
  }, [isSessionLoading, session, router]);

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader size={32} />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (isError) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <h2 className="text-lg font-semibold text-destructive">
            Error loading dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {error || "Failed to load dashboard statistics"}
          </p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate active days (days with at least 1 message)
  const activeDays = stats.last7Days.filter(
    (day) => day.messagesCount > 0
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your chat activity and statistics
        </p>
      </div>

      <StatsCards
        totalSessions={stats.totalSessions}
        totalMessages={stats.totalMessages}
        activeDays={activeDays}
        isLoading={isLoading}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <UsageChart last7Days={stats.last7Days} isLoading={isLoading} />
        <RecentSessions
          recentSessions={stats.recentSessions}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
