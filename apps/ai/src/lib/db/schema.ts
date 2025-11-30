import type { InferSelectModel } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  integer,
  json,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { AppUsage } from "../usage";

/**
 * User table schema
 * Stores registered users and guest users
 */
export const user = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }), // Hashed password or null for guest users
  type: varchar("type", { enum: ["regular", "guest"] })
    .notNull()
    .default("regular"), // User type: regular (registered) or guest (temporary)
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  // deletedAt: timestamp("deletedAt"), // Soft delete support (future feature)
});

export type User = InferSelectModel<typeof user>;

/**
 * Chat table schema
 * Stores chat conversations with users
 */
export const chat = pgTable("chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("created_at").notNull(),
  title: text("title").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { length: 10 })
    .notNull()
    .default("private"),
  lastContext: jsonb("last_context").$type<AppUsage | null>(),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable("message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chat.id),
  role: varchar("role", { length: 20 }).notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export type DBMessage = InferSelectModel<typeof message>;

export const vote = pgTable(
  "vote",
  {
    chatId: uuid("chat_id")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("message_id")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("is_upvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("created_at").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("kind", { length: 10 }).notNull().default("text"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("document_id").notNull(),
    documentCreatedAt: timestamp("document_created_at").notNull(),
    originalText: text("original_text").notNull(),
    suggestedText: text("suggested_text").notNull(),
    description: text("description"),
    isResolved: boolean("is_resolved").notNull().default(false),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chat_id").notNull(),
    createdAt: timestamp("created_at").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  })
);

export type Stream = InferSelectModel<typeof stream>;

/**
 * User settings table schema
 * Stores per-user chat settings including model preferences, temperature, and max tokens
 */
export const userSettings = pgTable("user_settings", {
  userId: uuid("user_id")
    .primaryKey()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  model: text("model"),
  temperature: numeric("temperature"),
  maxTokens: integer("max_tokens"),
  useTemplatesAsSystem: boolean("use_templates_as_system")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type UserSettings = InferSelectModel<typeof userSettings>;

/**
 * Prompt templates table schema
 * Stores user-created prompt templates for chat conversations
 */
export const promptTemplates = pgTable("prompt_templates", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  isFavorite: boolean("is_favorite").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type PromptTemplate = InferSelectModel<typeof promptTemplates>;
