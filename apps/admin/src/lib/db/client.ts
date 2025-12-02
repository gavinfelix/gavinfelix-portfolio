import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { adminUsers } from "./schema";

// Database connection setup
const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL environment variable is not set");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema: { adminUsers } });

