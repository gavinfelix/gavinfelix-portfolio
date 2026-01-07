// Loading skeleton for individual chat pages
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatIdLoading() {
  return (
    <div className="flex h-full flex-col animate-in fade-in-50 slide-in-from-left-4 duration-300">
      {/* Chat Header Skeleton */}
      <div className="sticky top-0 flex items-center gap-2 bg-background px-2 py-1.5 md:px-2">
        <Skeleton variant="shimmer" className="h-8 w-8 rounded-md" />
      </div>

      {/* Messages Area Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* User message skeleton */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton variant="shimmer" className="h-10 w-48 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-32 rounded-lg ml-auto" />
          </div>
        </div>

        {/* Assistant message skeleton */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-3">
            <Skeleton variant="shimmer" className="h-6 w-full rounded-lg" />
            <Skeleton variant="shimmer" className="h-6 w-3/4 rounded-lg" />
            <Skeleton variant="shimmer" className="h-6 w-5/6 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-40 rounded-lg" />
          </div>
        </div>

        {/* Another user message skeleton */}
        <div className="flex justify-end">
          <div className="max-w-[80%] space-y-2">
            <Skeleton variant="shimmer" className="h-12 w-56 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-32 rounded-lg ml-auto" />
          </div>
        </div>

        {/* Another assistant message skeleton */}
        <div className="flex justify-start">
          <div className="max-w-[80%] space-y-3">
            <Skeleton variant="shimmer" className="h-6 w-full rounded-lg" />
            <Skeleton variant="shimmer" className="h-6 w-4/5 rounded-lg" />
            <Skeleton variant="shimmer" className="h-4 w-40 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-2">
            <Skeleton variant="shimmer" className="h-24 flex-1 rounded-lg" />
            <Skeleton variant="shimmer" className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

