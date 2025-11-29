import { auth } from "@/app/(auth)/auth";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
} from "drizzle-orm";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { chat, message } from "@/lib/db/schema";

// Database connection setup
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

type StatsResponse = {
  totalSessions: number;
  totalMessages: number;
  last7Days: Array<{
    date: string;
    messagesCount: number;
  }>;
  recentSessions: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>;
};

export async function GET() {
  try {
    // Get current authenticated user
    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;

    // Calculate date 7 days ago (start of day)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setHours(0, 0, 0, 0);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // Include today, so -6 days

    // 1. Get total sessions count
    const [sessionsCount] = await db
      .select({ count: count() })
      .from(chat)
      .where(eq(chat.userId, userId));

    const totalSessions = sessionsCount?.count ?? 0;

    // 2. Get total messages count (all messages in user's chats)
    const [messagesCount] = await db
      .select({ count: count() })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(eq(chat.userId, userId));

    const totalMessages = messagesCount?.count ?? 0;

    // 3. Get messages count for last 7 days grouped by date
    const messagesByDate = await db
      .select({
        date: sql<string>`TO_CHAR(${message.createdAt}, 'YYYY-MM-DD')`,
        messagesCount: count(),
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, userId),
          gte(message.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`TO_CHAR(${message.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(asc(sql`TO_CHAR(${message.createdAt}, 'YYYY-MM-DD')`));

    // Generate array for last 7 days with counts
    const last7Days: Array<{ date: string; messagesCount: number }> = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

      const dayData = messagesByDate.find(
        (item) => item.date === dateStr
      );
      last7Days.push({
        date: dateStr,
        messagesCount: dayData?.messagesCount ?? 0,
      });
    }

    // 4. Get recent 5 sessions
    const recentSessionsData = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
      })
      .from(chat)
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.createdAt))
      .limit(5);

    const recentSessions = recentSessionsData.map((session) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt,
    }));

    const response: StatsResponse = {
      totalSessions,
      totalMessages,
      last7Days,
      recentSessions,
    };

    return Response.json(response);
  } catch (error) {
    console.error("[GET /api/stats] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

