// Loading skeleton for dashboard page
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in-50 slide-in-from-left-4 duration-300">
      {/* Header Section */}
      <div className="space-y-3">
        <Skeleton variant="shimmer" className="h-9 w-56 rounded-lg" />
        <Skeleton
          variant="shimmer"
          className="h-5 w-96 max-w-full rounded-lg"
        />
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-card border border-[0.5px] border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="space-y-4">
              {/* Card Title */}
              <div className="space-y-2">
                <Skeleton variant="shimmer" className="h-4 w-24 rounded-lg" />
                <Skeleton variant="shimmer" className="h-3 w-32 rounded-lg" />
              </div>
              {/* Card Value */}
              <Skeleton variant="shimmer" className="h-10 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Recent Sessions Grid */}
      {/* Two-column layout for usage chart and recent sessions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Usage Chart Skeleton */}
        <div className="rounded-xl bg-card border border-[0.5px] border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-[0.5px] border-gray-200 dark:border-gray-800">
            <div className="space-y-2">
              <Skeleton variant="shimmer" className="h-6 w-48 rounded-lg" />
              <Skeleton variant="shimmer" className="h-4 w-64 rounded-lg" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton variant="shimmer" className="h-64 w-full rounded-lg" />
          </div>
        </div>

        {/* Recent Sessions Skeleton */}
        <div className="rounded-xl bg-card border border-[0.5px] border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-5 border-b border-[0.5px] border-gray-200 dark:border-gray-800">
            <div className="space-y-2">
              <Skeleton variant="shimmer" className="h-6 w-48 rounded-lg" />
              <Skeleton variant="shimmer" className="h-4 w-64 rounded-lg" />
            </div>
          </div>
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3">
                <Skeleton variant="shimmer" className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton
                    variant="shimmer"
                    className="h-4 w-3/4 rounded-lg"
                  />
                  <Skeleton
                    variant="shimmer"
                    className="h-3 w-1/2 rounded-lg"
                  />
                </div>
                <Skeleton variant="shimmer" className="h-4 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
