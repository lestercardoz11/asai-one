import type { Config } from "drizzle-kit";

/**
 * drizzle-kit config. `generate` (schema → SQL migration) needs no DB connection;
 * the URL is only used by `push`/`introspect`. RLS policies, functions, RPCs and
 * triggers are NOT expressed here — they live in `lib/db/sql/*` and are applied
 * alongside the generated table migration (see the foundation spec).
 */
export default {
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  // We hand-author RLS/functions/triggers in companion SQL, so keep generated
  // migrations to tables/enums/indexes only.
  verbose: true,
  strict: true,
} satisfies Config;
