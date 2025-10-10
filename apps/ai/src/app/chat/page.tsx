import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
// import { DataStreamHandler } from "@/components/data-stream-handler";
// import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
// import { generateUUID } from "@/lib/utils";

export default async function Page() {
  return (
    <>
      <Chat />
    </>
  );
}
