// Database client configuration using Drizzle ORM with PostgreSQL connection
import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  adminUsers,
  aiAppUsers,
  aiAppChat,
  aiAppMessage,
  aiAppDocument,
  adminSettings,
} from "./schema";

// Database connection setup
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL environment variable is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, {
  schema: {
    adminUsers,
    aiAppUsers,
    aiAppChat,
    aiAppMessage,
    aiAppDocument,
    adminSettings,
  },
});


