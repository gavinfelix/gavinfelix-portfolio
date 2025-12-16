import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/features/chat/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import type { VisibilityType } from "@/components/visibility-selector";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";

const toVisibilityType = (v: unknown): VisibilityType => {
  if (v === "public" || v === "private") return v; // 按你真实的 VisibilityType 值补全
  return "private"; // 给个兜底，避免脏数据直接炸构建
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  // Check if user has permission to view private chats
  if (chat.visibility === "private") {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  // Get selected model from cookie, fallback to default if not set
  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");
  const initialVisibilityType = toVisibilityType(chat.visibility);

  if (!chatModelFromCookie) {
    return (
      <>
        <Chat
          key={chat.id}
          autoResume={true}
          id={chat.id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialLastContext={chat.lastContext ?? undefined}
          initialMessages={uiMessages}
          initialVisibilityType={initialVisibilityType}
          isReadonly={session?.user?.id !== chat.userId}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        key={chat.id}
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModelFromCookie.value}
        initialLastContext={chat.lastContext ?? undefined}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility as VisibilityType}
        isReadonly={session?.user?.id !== chat.userId}
      />
      <DataStreamHandler />
    </>
  );
}
