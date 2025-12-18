import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/features/chat/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { GuestEmptyState } from "@/components/guest-empty-state";
import type { VisibilityType } from "@/components/visibility-selector";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

const toVisibilityType = (v: unknown): VisibilityType => {
  if (v === "public" || v === "private") return v;
  return "private";
};

// Check if user is a guest (guest type or fallback user)
function isGuestUser(session: { user?: { id?: string; type?: string } } | null) {
  if (!session?.user) return true;
  if (session.user.type === "guest") return true;
  if (session.user.id?.startsWith("fallback-")) return true;
  return false;
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;

  const session = await auth();

  // Guest users cannot access chat history - show empty state
  if (isGuestUser(session)) {
    return <GuestEmptyState />;
  }

  // For authenticated users, try to load the chat
  const chat = await getChatById({ id });

  // Chat not found or user doesn't have access - show empty state
  if (!chat) {
    return <GuestEmptyState />;
  }

  // Check if user has permission to view private chats
  if (chat.visibility === "private" && session?.user?.id !== chat.userId) {
    return <GuestEmptyState />;
  }

  const messagesFromDb = await getMessagesByChatId({ id });
  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");
  const initialVisibilityType = toVisibilityType(chat.visibility);

  return (
    <>
      <Chat
        key={chat.id}
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModelFromCookie?.value ?? DEFAULT_CHAT_MODEL}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={initialVisibilityType}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler />
    </>
  );
}
