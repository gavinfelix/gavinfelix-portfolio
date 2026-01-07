// Loading skeleton for templates page
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6 animate-in fade-in-50 slide-in-from-left-4 duration-300">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton variant="shimmer" className="h-9 w-56 rounded-lg" />
          <Skeleton variant="shimmer" className="h-5 w-96 max-w-full rounded-lg" />
        </div>
        <Skeleton variant="shimmer" className="h-10 w-32 rounded-lg" />
      </div>

      {/* Templates List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl bg-card border border-[0.5px] border-gray-200 dark:border-gray-800 p-6"
          >
            <div className="space-y-4">
              {/* Template Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton variant="shimmer" className="h-6 w-48 rounded-lg" />
                  <Skeleton variant="shimmer" className="h-4 w-64 rounded-lg" />
                </div>
                <div className="flex gap-2">
                  <Skeleton variant="shimmer" className="h-8 w-8 rounded-lg" />
                  <Skeleton variant="shimmer" className="h-8 w-8 rounded-lg" />
                </div>
              </div>

              {/* Template Content Preview */}
              <div className="space-y-2">
                <Skeleton variant="shimmer" className="h-4 w-full rounded-lg" />
                <Skeleton variant="shimmer" className="h-4 w-5/6 rounded-lg" />
                <Skeleton variant="shimmer" className="h-4 w-4/6 rounded-lg" />
              </div>

              {/* Template Footer */}
              <div className="flex items-center gap-4 pt-2">
                <Skeleton variant="shimmer" className="h-4 w-20 rounded-lg" />
                <Skeleton variant="shimmer" className="h-4 w-24 rounded-lg" />
                <Skeleton variant="shimmer" className="h-4 w-16 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

