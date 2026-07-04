// Applies pending Drizzle migrations at container start. Uses only production
// dependencies (@libsql/client + drizzle-orm) — no drizzle-kit/tsx needed.
// Idempotent: already-applied migrations are skipped.
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { fileURLToPath } from "node:url";
import path from "node:path";

const url = process.env.DATABASE_URL ?? "file:./data/exlibris.db";
const authToken = process.env.DATABASE_AUTH_TOKEN;
const here = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(here, "..", "drizzle");

const client = createClient(authToken ? { url, authToken } : { url });
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder });
  console.log(`[migrate] up to date (${url})`);
} catch (err) {
  console.error("[migrate] failed:", err);
  process.exit(1);
} finally {
  client.close();
}
