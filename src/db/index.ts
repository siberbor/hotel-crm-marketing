import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/hotel_crm";

const client = postgres(connectionString, {
  connect_timeout: 5,
  idle_timeout: 20,
  max_lifetime: 1800,
});
export const db = drizzle(client, { schema });

export * from "./schema";
