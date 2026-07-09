import "server-only";
import { neon } from "@neondatabase/serverless";

/**
 * Neon serverless (HTTP) client. Uses the pooled DATABASE_URL, which is the
 * right choice for short-lived serverless / server-component queries.
 *
 * `hasDb` lets callers degrade gracefully to the live adapters (and, in turn,
 * sample data) when no database is configured — the hub always renders.
 */
export const hasDb = Boolean(process.env.DATABASE_URL);

export const sql = hasDb ? neon(process.env.DATABASE_URL!) : null;

let schemaReady: Promise<void> | null = null;

/**
 * Idempotently create the tables the hub needs. Cheap enough (IF NOT EXISTS)
 * to run lazily on first access; memoized so it only fires once per process.
 */
export async function ensureSchema(): Promise<void> {
  if (!sql) return;
  if (schemaReady) return schemaReady;

  schemaReady = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS health_snapshots (
        date DATE PRIMARY KEY,
        data JSONB NOT NULL,
        captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS apartment_listings (
        id TEXT PRIMARY KEY,
        search_id TEXT NOT NULL,
        data JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'none',
        passes_geo BOOLEAN NOT NULL DEFAULT false,
        price INTEGER,
        first_seen_date DATE NOT NULL DEFAULT CURRENT_DATE,
        first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_apartment_listings_search
      ON apartment_listings (search_id)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_apartment_listings_first_seen
      ON apartment_listings (first_seen_date)
    `;
  })();

  return schemaReady;
}
