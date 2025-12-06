"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  hasMore: boolean;
}

export function PaginationControls({
  currentPage,
  totalPages,
  hasMore,
}: PaginationControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      navigateToPage(currentPage - 1);
    }
  };

  const isNextDisabled = currentPage >= totalPages && !hasMore;

  const handleNext = () => {
    if (!isNextDisabled) {
      navigateToPage(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="text-foreground"
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground min-w-[100px] text-center">
        Page {currentPage} {totalPages > 0 && `of ${totalPages}`}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={isNextDisabled}
        className="text-foreground"
      >
        Next
      </Button>
    </div>
  );
}

