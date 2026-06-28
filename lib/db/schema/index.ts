/**
 * Drizzle schema — source of truth for the ASAI.One Postgres schema.
 *
 * Tables/enums/indexes (and partial/unique indexes) are declared here; RLS
 * policies, functions, RPCs, triggers, grants, and FKs to `auth.users` live in
 * companion SQL (`lib/db/sql/*`) and are applied alongside the generated
 * migration. See the foundation spec (docs/superpowers/specs).
 */
export * from "./enums";
export * from "./catalogue";
export * from "./orders";
export * from "./commerce";
export * from "./account";
export * from "./returns";
export * from "./content";
