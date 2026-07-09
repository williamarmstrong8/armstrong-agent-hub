// Create the life-hub tables in Neon and print a quick status.
// Run: node --env-file=.env.local scripts/db-init.mjs
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set.");
  process.exit(1);
}

const sql = neon(url);

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
await sql`CREATE INDEX IF NOT EXISTS idx_apartment_listings_search ON apartment_listings (search_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_apartment_listings_first_seen ON apartment_listings (first_seen_date)`;

const health = await sql`SELECT count(*)::int AS n FROM health_snapshots`;
const apts = await sql`SELECT count(*)::int AS n FROM apartment_listings`;
console.log("Schema ready.");
console.log("health_snapshots rows:", health[0].n);
console.log("apartment_listings rows:", apts[0].n);
process.exit(0);
