"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toggleUserStatus, type ToggleStatusResult } from "../actions";

interface StatusToggleButtonProps {
  userId: string;
  currentStatus: "active" | "banned";
}

export function StatusToggleButton({
  userId,
  currentStatus,
}: StatusToggleButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"active" | "banned">(currentStatus);

  const handleToggle = () => {
    setError(null);
    startTransition(async () => {
      const result: ToggleStatusResult = await toggleUserStatus(userId, status);
      if (result.success && result.newStatus) {
        setStatus(result.newStatus);
      } else {
        setError(result.error || "Failed to update status");
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Status
          </div>
          <div>
            <Badge
              variant={status === "active" ? "default" : "destructive"}
            >
              {status === "active" ? "Active" : "Banned"}
            </Badge>
          </div>
        </div>
        <div>
          <Button
            variant={status === "active" ? "destructive" : "outline"}
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
          >
            {isPending
              ? "Updating..."
              : status === "active"
                ? "Ban User"
                : "Unban User"}
          </Button>
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}

