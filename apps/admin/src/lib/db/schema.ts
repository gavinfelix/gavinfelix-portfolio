import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
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


