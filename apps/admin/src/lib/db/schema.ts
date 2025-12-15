// Database schema definitions using Drizzle ORM for admin users and AI app entities
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  json,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Admin Users table schema
 * Stores admin panel user accounts with roles and status
 */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 20 })
    .notNull()
    .default("user")
    .$type<"admin" | "user">(),
  status: varchar("status", { length: 20 })
    .notNull()
    .default("active")
    .$type<"active" | "disabled">(),
  passwordHash: varchar("password_hash", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AdminUser = InferSelectModel<typeof adminUsers>;
export type NewAdminUser = InferInsertModel<typeof adminUsers>;

/**
 * AI App Users table schema
 * Stores users from the AI app (regular and guest users)
 * This is the same table used by the AI app
 */
export const aiAppUsers = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }), // Hashed password or null for guest users
  type: varchar("type", { enum: ["regular", "guest"] })
    .notNull()
    .default("regular"), // User type: regular (registered) or guest (temporary)
  status: varchar("status", { length: 20 })
    .notNull()
    .default("active")
    .$type<"active" | "banned">(), // User status: active or banned
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export type AIAppUser = InferSelectModel<typeof aiAppUsers>;

/**
 * AI App Chat table schema
 * Stores chat conversations with users
 */
export const aiAppChat = pgTable("chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("created_at").notNull(),
  title: text("title").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => aiAppUsers.id),
  visibility: varchar("visibility", { length: 10 })
    .notNull()
    .default("private"),
});

export type AIAppChat = InferSelectModel<typeof aiAppChat>;

/**
 * AI App Message table schema
 * Stores messages in chat conversations
 */
export const aiAppMessage = pgTable("message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => aiAppChat.id),
  role: varchar("role", { length: 20 }).notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export type AIAppMessage = InferSelectModel<typeof aiAppMessage>;

/**
 * AI App Document table schema
 * Stores uploaded documents for RAG
 */
export const aiAppDocument = pgTable(
  "document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("created_at").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("kind", { length: 10 }).notNull().default("text"),
    userId: uuid("user_id")
      .notNull()
      .references(() => aiAppUsers.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type AIAppDocument = InferSelectModel<typeof aiAppDocument>;
