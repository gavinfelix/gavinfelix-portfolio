"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "@/components/icons";

export function GuestEmptyState() {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<"chat" | "login" | null>(
    null
  );

  const handleNewChat = () => {
    setLoadingAction("chat");
    router.push("/");
  };

  const handleSignIn = () => {
    setLoadingAction("login");
    router.push("/login");
  };

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <svg
            className="size-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            This chat isn't available
          </h1>
          <div className="space-y-1 text-muted-foreground">
            <p>This link may have expired or you may not have access.</p>
            <p>
              Guest chats are not saved. Please start a new chat or sign in to
              keep your history.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Button disabled={loadingAction !== null} onClick={handleNewChat}>
            {loadingAction === "chat" ? (
              <>
                <span className="animate-spin">
                  <LoaderIcon />
                </span>
                Loading...
              </>
            ) : (
              "Start a new chat"
            )}
          </Button>
          <Button
            disabled={loadingAction !== null}
            onClick={handleSignIn}
            variant="outline"
          >
            {loadingAction === "login" ? (
              <>
                <span className="animate-spin">
                  <LoaderIcon />
                </span>
                Loading...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
