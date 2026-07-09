import "server-only";
import { sql, ensureSchema } from "./client";
import type { HealthSummary } from "@/lib/types";

/** Store today's health summary, keyed by local calendar date. */
export async function upsertHealthSnapshot(health: HealthSummary): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  const date = localDate(health.date);
  await sql`
    INSERT INTO health_snapshots (date, data, captured_at)
    VALUES (${date}, ${JSON.stringify(health)}, now())
    ON CONFLICT (date) DO UPDATE SET
      data = EXCLUDED.data,
      captured_at = now()
  `;
}

/** Most recent stored health snapshot, or null if none yet. */
export async function getLatestHealth(): Promise<HealthSummary | null> {
  if (!sql) return null;
  await ensureSchema();
  const rows = (await sql`
    SELECT data FROM health_snapshots ORDER BY date DESC LIMIT 1
  `) as { data: HealthSummary }[];
  return rows[0]?.data ?? null;
}

function localDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
