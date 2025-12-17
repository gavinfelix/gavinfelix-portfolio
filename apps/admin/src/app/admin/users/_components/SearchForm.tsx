"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X } from "lucide-react";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [isPending, startTransition] = useTransition();

  // Update local state when URL search param changes
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }
    
    // Reset to page 1 when searching
    params.set("page", "1");
    
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  const handleClear = () => {
    setSearchValue("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.set("page", "1");
    
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <div className="relative flex-1 max-w-sm">
        <div className="relative">
          <Search 
            className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-opacity ${
              isPending ? "opacity-0" : "opacity-100"
            }`}
          />
          {isPending && (
            <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
          <Input
            type="text"
            placeholder="Search by email..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className={`w-full pl-10 transition-all duration-200 ${
              isPending ? "opacity-70 cursor-wait bg-slate-50" : ""
            }`}
            disabled={isPending}
          />
        </div>
        {isPending && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200 overflow-hidden rounded-b-md">
            <div className="h-full bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 animate-shimmer" style={{ width: "100%" }} />
          </div>
        )}
      </div>
      <Button 
        type="submit" 
        variant="default" 
        size="default"
        disabled={isPending}
        className="min-w-[100px]"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Searching...</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4" />
            <span>Search</span>
          </>
        )}
      </Button>
      {searchParams.get("search") && (
        <Button
          type="button"
          variant="outline"
          size="default"
          onClick={handleClear}
          disabled={isPending}
        >
          <X className="h-4 w-4" />
          <span>Clear</span>
        </Button>
      )}
    </form>
  );
}

