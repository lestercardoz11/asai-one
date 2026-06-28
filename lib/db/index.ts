import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Drizzle (admin/service) database client. **Bypasses RLS** — it connects via the
 * Supabase pooler as a privileged role, so it must ONLY be used from trusted
 * server contexts that have already asserted admin/service authority
 * (`lib/admin/*`, webhooks, lifecycle jobs, the CMS). User-facing reads/writes
 * stay on `@supabase/ssr` so RLS remains the authorization layer for the browser.
 *
 * Lazy singleton: importing this module never connects, so the build doesn't
 * require DATABASE_URL. The connection opens on first `db()` call.
 */
let _db: PostgresJsDatabase<typeof schema> | null = null;

export function db(): PostgresJsDatabase<typeof schema> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set — required for the Drizzle (admin/service) client. " +
        "Use the Supabase transaction-pooler connection string.",
    );
  }
  // `prepare: false` is required for the Supabase transaction pooler (PgBouncer),
  // which does not support prepared statements.
  const client = postgres(url, { prepare: false });
  _db = drizzle(client, { schema });
  return _db;
}
