import "server-only";

import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  asc,
  max,
  sql,
  inArray,
  gte,
} from "drizzle-orm";
import { db } from "./client";
import {
  adminUsers,
  aiAppUsers,
  aiAppChat,
  aiAppMessage,
  type AdminUser,
  type NewAdminUser,
  type AIAppUser,
} from "./schema";

/**
 * Get all users with pagination and search
 */
export async function getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: "admin" | "user";
  status?: "active" | "disabled";
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (params.search) {
    conditions.push(
      or(
        ilike(adminUsers.email, `%${params.search}%`),
        ilike(adminUsers.name, `%${params.search}%`)
      )!
    );
  }

  if (params.role) {
    conditions.push(eq(adminUsers.role, params.role));
  }

  if (params.status) {
    conditions.push(eq(adminUsers.status, params.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, totalResult] = await Promise.all([
    db
      .select()
      .from(adminUsers)
      .where(whereClause)
      .orderBy(desc(adminUsers.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(adminUsers)
      .where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    users,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get a single user by ID
 */
export async function getUserById(id: string): Promise<AdminUser | null> {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, id))
    .limit(1);

  return user ?? null;
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<AdminUser | null> {
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  return user ?? null;
}

/**
 * Create a new user
 */
export async function createUser(data: Omit<NewAdminUser, "id" | "createdAt" | "updatedAt">): Promise<AdminUser> {
  const [user] = await db
    .insert(adminUsers)
    .values({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return user;
}

/**
 * Update a user by ID
 */
export async function updateUser(
  id: string,
  data: Partial<Omit<NewAdminUser, "id" | "createdAt">>
): Promise<AdminUser | null> {
  const [user] = await db
    .update(adminUsers)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(adminUsers.id, id))
    .returning();

  return user ?? null;
}

/**
 * Delete a user by ID
 */
export async function deleteUser(id: string): Promise<boolean> {
  const result = await db
    .delete(adminUsers)
    .where(eq(adminUsers.id, id));

  return result.rowCount !== null && result.rowCount > 0;
}

/**
 * Update admin user by ID
 * Alias for updateUser with specific typing for admin user updates
 */
export async function updateAdminUser(
  id: string,
  data: { name?: string }
): Promise<AdminUser | null> {
  return updateUser(id, data);
}

/**
 * Get all AI app users with pagination and search
 * This queries the users table from the AI app
 */
export async function getAIAppUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  type?: "regular" | "guest";
}) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions = [];

  if (params.search) {
    conditions.push(
      ilike(aiAppUsers.email, `%${params.search}%`)
    );
  }

  if (params.type) {
    conditions.push(eq(aiAppUsers.type, params.type));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, totalResult] = await Promise.all([
    db
      .select({
        id: aiAppUsers.id,
        email: aiAppUsers.email,
        type: aiAppUsers.type,
        createdAt: aiAppUsers.createdAt,
        updatedAt: aiAppUsers.updatedAt,
      })
      .from(aiAppUsers)
      .where(whereClause)
      .orderBy(desc(aiAppUsers.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(aiAppUsers)
      .where(whereClause),
  ]);

  const total = totalResult[0]?.count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return {
    users,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * Get a single AI app user by ID
 */
export async function getAIAppUserById(id: string): Promise<AIAppUser | null> {
  const [user] = await db
    .select()
    .from(aiAppUsers)
    .where(eq(aiAppUsers.id, id))
    .limit(1);

  return user ?? null;
}

/**
 * User usage summary for detail page
 */
export interface UserUsageSummary {
  totalChats: number;
  totalMessages: number;
  lastActivity: Date | null;
}

/**
 * Get usage summary for a specific user
 */
export async function getUserUsageSummary(
  userId: string
): Promise<UserUsageSummary> {
  try {
    // Get chat count and last chat time
    const [chatStats] = await db
      .select({
        chatCount: count(aiAppChat.id),
        lastChatTime: max(aiAppChat.createdAt),
      })
      .from(aiAppChat)
      .where(eq(aiAppChat.userId, userId));

    // Get message count and last message time
    const [messageStats] = await db
      .select({
        messageCount: count(aiAppMessage.id),
        lastMessageTime: max(aiAppMessage.createdAt),
      })
      .from(aiAppMessage)
      .innerJoin(aiAppChat, eq(aiAppMessage.chatId, aiAppChat.id))
      .where(eq(aiAppChat.userId, userId));

    const lastChatTime = chatStats?.lastChatTime;
    const lastMessageTime = messageStats?.lastMessageTime;

    // Use the latest of message time or chat time
    let lastActivity: Date | null = null;
    if (lastChatTime && lastMessageTime) {
      lastActivity =
        new Date(lastMessageTime) > new Date(lastChatTime)
          ? lastMessageTime
          : lastChatTime;
    } else {
      lastActivity = lastMessageTime || lastChatTime;
    }

    return {
      totalChats: Number(chatStats?.chatCount ?? 0),
      totalMessages: Number(messageStats?.messageCount ?? 0),
      lastActivity,
    };
  } catch (error) {
    console.error("Error fetching user usage summary:", error);
    throw error;
  }
}

/**
 * Recent chat for user detail page
 */
export interface RecentChat {
  id: string;
  title: string;
  createdAt: Date | string;
  messageCount: number;
}

/**
 * Get recent chats for a specific user
 */
export async function getUserRecentChats(
  userId: string,
  limit: number = 20
): Promise<RecentChat[]> {
  try {
    // Get recent chats with message counts
    const chats = await db
      .select({
        id: aiAppChat.id,
        title: aiAppChat.title,
        createdAt: aiAppChat.createdAt,
      })
      .from(aiAppChat)
      .where(eq(aiAppChat.userId, userId))
      .orderBy(desc(aiAppChat.createdAt))
      .limit(limit);

    // Get message counts for each chat
    const chatIds = chats.map((chat) => chat.id);
    if (chatIds.length === 0) {
      return [];
    }

    const messageCounts = await db
      .select({
        chatId: aiAppMessage.chatId,
        count: count(aiAppMessage.id),
      })
      .from(aiAppMessage)
      .where(
        chatIds.length === 1
          ? eq(aiAppMessage.chatId, chatIds[0])
          : inArray(aiAppMessage.chatId, chatIds as [string, ...string[]])
      )
      .groupBy(aiAppMessage.chatId);

    const countMap = new Map(
      messageCounts.map((mc) => [mc.chatId, Number(mc.count)])
    );

    return chats.map((chat) => ({
      id: chat.id,
      title: chat.title,
      createdAt: chat.createdAt,
      messageCount: countMap.get(chat.id) ?? 0,
    }));
  } catch (error) {
    console.error("Error fetching user recent chats:", error);
    throw error;
  }
}

/**
 * Usage statistics interface
 */
export interface UserUsageStats {
  userId: string;
  email: string;
  totalChats: number;
  totalMessages: number;
  lastActivity: Date | null;
}

/**
 * Get usage statistics per user
 * Aggregates chat and message counts, and finds last activity time
 */
export async function getUserUsageStats(): Promise<UserUsageStats[]> {
  try {
    // Get chat counts per user
    const chatStats = await db
      .select({
        userId: aiAppChat.userId,
        chatCount: count(aiAppChat.id),
        lastChatTime: max(aiAppChat.createdAt),
      })
      .from(aiAppChat)
      .groupBy(aiAppChat.userId);

    // Get message counts per user (via chat join)
    const messageStats = await db
      .select({
        userId: aiAppChat.userId,
        messageCount: count(aiAppMessage.id),
        lastMessageTime: max(aiAppMessage.createdAt),
      })
      .from(aiAppMessage)
      .innerJoin(aiAppChat, eq(aiAppMessage.chatId, aiAppChat.id))
      .groupBy(aiAppChat.userId);

    // Collect all unique user IDs
    const userIds = new Set<string>();
    chatStats.forEach((stat) => userIds.add(stat.userId));
    messageStats.forEach((stat) => userIds.add(stat.userId));

    if (userIds.size === 0) {
      return [];
    }

    const userIdArray = Array.from(userIds);

    // Get user emails
    const users = await db
      .select({
        id: aiAppUsers.id,
        email: aiAppUsers.email,
      })
      .from(aiAppUsers)
      .where(
        userIdArray.length === 1
          ? eq(aiAppUsers.id, userIdArray[0])
          : inArray(aiAppUsers.id, userIdArray as [string, ...string[]])
      );

    const userMap = new Map(users.map((u) => [u.id, u.email]));

    // Combine stats
    const statsMap = new Map<string, UserUsageStats>();

    // Process chat stats first
    chatStats.forEach((stat) => {
      statsMap.set(stat.userId, {
        userId: stat.userId,
        email: userMap.get(stat.userId) || stat.userId,
        totalChats: Number(stat.chatCount),
        totalMessages: 0,
        lastActivity: stat.lastChatTime,
      });
    });

    // Process message stats
    messageStats.forEach((stat) => {
      const existing = statsMap.get(stat.userId);
      if (existing) {
        existing.totalMessages = Number(stat.messageCount);
        // Use the latest of message time or chat time
        const msgTime = stat.lastMessageTime;
        const chatTime = existing.lastActivity;
        if (msgTime && chatTime) {
          existing.lastActivity =
            new Date(msgTime) > new Date(chatTime) ? msgTime : chatTime;
        } else {
          existing.lastActivity = msgTime || chatTime;
        }
      } else {
        // User has messages but no chats (shouldn't happen, but handle it)
        statsMap.set(stat.userId, {
          userId: stat.userId,
          email: userMap.get(stat.userId) || stat.userId,
          totalChats: 0,
          totalMessages: Number(stat.messageCount),
          lastActivity: stat.lastMessageTime,
        });
      }
    });

    const result = Array.from(statsMap.values()).sort((a, b) => {
      // Sort by last activity descending (most recent first)
      if (!a.lastActivity && !b.lastActivity) return 0;
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return (
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      );
    });

    return result;
  } catch (error) {
    console.error("Error fetching user usage stats:", error);
    throw error;
  }
}

/**
 * Dashboard metrics interface
 */
export interface DashboardMetrics {
  totalUsers: number;
  activeUsersLast7Days: number;
  totalChats: number;
  totalMessages: number;
}

/**
 * Get dashboard metrics
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    // Total Users
    const [totalUsersResult] = await db
      .select({ count: count() })
      .from(aiAppUsers);

    // Total Chats
    const [totalChatsResult] = await db
      .select({ count: count() })
      .from(aiAppChat);

    // Total Messages
    const [totalMessagesResult] = await db
      .select({ count: count() })
      .from(aiAppMessage);

    // Active Users (Last 7 days) - users who had messages or chats in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get distinct user IDs from messages in last 7 days
    const activeUsersFromMessages = await db
      .selectDistinct({
        userId: aiAppChat.userId,
      })
      .from(aiAppMessage)
      .innerJoin(aiAppChat, eq(aiAppMessage.chatId, aiAppChat.id))
      .where(gte(aiAppMessage.createdAt, sevenDaysAgo));

    // Get distinct user IDs from chats in last 7 days
    const activeUsersFromChats = await db
      .selectDistinct({
        userId: aiAppChat.userId,
      })
      .from(aiAppChat)
      .where(gte(aiAppChat.createdAt, sevenDaysAgo));

    // Combine and count unique users
    const activeUserIds = new Set<string>();
    activeUsersFromMessages.forEach((u) => activeUserIds.add(u.userId));
    activeUsersFromChats.forEach((u) => activeUserIds.add(u.userId));

    return {
      totalUsers: Number(totalUsersResult?.count ?? 0),
      activeUsersLast7Days: activeUserIds.size,
      totalChats: Number(totalChatsResult?.count ?? 0),
      totalMessages: Number(totalMessagesResult?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    throw error;
  }
}

/**
 * Message trend data point
 */
export interface MessageTrendPoint {
  date: string; // YYYY-MM-DD format
  count: number;
}

/**
 * Get messages over time (last 30 days, grouped by day)
 */
export async function getMessageTrend(
  days: number = 30
): Promise<MessageTrendPoint[]> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Use raw SQL to group by date (PostgreSQL date casting)
    const result = await db
      .select({
        date: sql<string>`${aiAppMessage.createdAt}::date`,
        count: count(aiAppMessage.id),
      })
      .from(aiAppMessage)
      .where(gte(aiAppMessage.createdAt, startDate))
      .groupBy(sql`${aiAppMessage.createdAt}::date`)
      .orderBy(asc(sql`${aiAppMessage.createdAt}::date`));

    // Fill in missing dates with 0 count
    const dateMap = new Map<string, number>();
    result.forEach((row) => {
      // PostgreSQL returns date as string in YYYY-MM-DD format or as Date object
      const dateStr =
        typeof row.date === "string"
          ? row.date.split("T")[0] // Extract YYYY-MM-DD if ISO string
          : new Date(row.date).toISOString().split("T")[0]; // Convert Date to YYYY-MM-DD
      dateMap.set(dateStr, Number(row.count));
    });

    // Generate all dates in the range
    const trendData: MessageTrendPoint[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      trendData.push({
        date: dateStr,
        count: dateMap.get(dateStr) ?? 0,
      });
    }

    return trendData;
  } catch (error) {
    console.error("Error fetching message trend:", error);
    throw error;
  }
}

