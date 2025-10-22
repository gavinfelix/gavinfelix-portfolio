import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";
import { auth } from "../(auth)/auth";
import { decode } from "next-auth/jwt";

export default async function Page() {
  // 1️⃣ 打 cookie
  const cookieStore = await cookies();
  console.log("cookieStore:", cookieStore.getAll());

  const rawToken = cookieStore.get("next-auth.session-token")?.value;
  console.log("raw next-auth.session-token:", rawToken);

  // 2️⃣ 尝试 decode JWT
  if (rawToken) {
    try {
      const decoded = await decode({
        token: rawToken,
        secret: process.env.AUTH_SECRET!,
        salt: "next-auth.session-token",
      });
      console.log("decoded token:", decoded);
    } catch (err) {
      console.error("decode error:", err);
    }
  } else {
    console.log("No raw token found in cookies.");
  }
  const session = await auth();

  console.log("session:", session);

  if (!session) {
    redirect(`/api/auth/guest`);
  }

  const id = generateUUID();
  const modelIdFromCookie = cookieStore.get("chat-model");

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          autoResume={false}
          id={id}
          initialChatModel={DEFAULT_CHAT_MODEL}
          initialMessages={[]}
          initialVisibilityType="private"
          isReadonly={false}
          key={id}
        />
        <DataStreamHandler />
      </>
    );
  }

  return (
    <>
      <Chat
        autoResume={false}
        id={id}
        initialChatModel={modelIdFromCookie.value}
        initialMessages={[]}
        initialVisibilityType="private"
        isReadonly={false}
        key={id}
      />
      <DataStreamHandler />
    </>
  );
}
