// Modern SaaS-style loading skeleton component for admin pages
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-in fade-in-50 slide-in-from-left-4 duration-300">
      {/* Header Section */}
      <div className="space-y-3">
        <Skeleton variant="shimmer" className="h-9 w-56" />
        <Skeleton variant="shimmer" className="h-5 w-96 max-w-full" />
      </div>

      {/* Search Bar (for pages like Users) */}
      <div className="flex gap-3">
        <Skeleton variant="shimmer" className="h-10 flex-1 rounded-xl" />
        <Skeleton variant="shimmer" className="h-10 w-24 rounded-xl" />
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-6 border border-slate-100"
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

      {/* Main Content Card (Table/Chart) */}
      <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
        {/* Card Header */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="space-y-2">
            <Skeleton variant="shimmer" className="h-6 w-48 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-64 rounded-lg" />
          </div>
        </div>

        {/* Card Content - Table Skeleton */}
        <div className="p-6">
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 mb-4 pb-3 border-b border-slate-100">
            <Skeleton variant="shimmer" className="h-4 w-16 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-24 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-20 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-20 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-28 rounded-lg" />
          </div>

          {/* Table Rows */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="grid grid-cols-5 gap-4 items-center py-3"
              >
                <Skeleton variant="shimmer" className="h-4 w-20 rounded-lg" />
                <Skeleton variant="shimmer" className="h-4 w-40 rounded-lg" />
                <Skeleton variant="shimmer" className="h-6 w-16 rounded-full" />
                <Skeleton variant="shimmer" className="h-6 w-16 rounded-full" />
                <Skeleton variant="shimmer" className="h-4 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-4 w-48 rounded-lg" />
        <div className="flex gap-2">
          <Skeleton variant="shimmer" className="h-9 w-9 rounded-lg" />
          <Skeleton variant="shimmer" className="h-9 w-9 rounded-lg" />
          <Skeleton variant="shimmer" className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

