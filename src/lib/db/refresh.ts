import "server-only";
import { getApartments } from "@/lib/adapters/streeteasy";
import { getHealth } from "@/lib/adapters/garmin";
import { upsertListings } from "./apartments";
import { upsertHealthSnapshot } from "./health";
import { hasDb } from "./client";

export type ApartmentsRefresh = { live: boolean; upserted: number; new: number };
export type HealthRefresh = { live: boolean; stored: boolean };

export type RefreshResult = {
  ok: boolean;
  apartments: ApartmentsRefresh;
  health: HealthRefresh;
};

/**
 * Pull the current live StreetEasy listings for every search and persist them.
 * Only real data is stored — sample fallbacks never touch the DB. Idempotent.
 */
export async function refreshApartments(): Promise<ApartmentsRefresh> {
  const out: ApartmentsRefresh = { live: false, upserted: 0, new: 0 };
  const apts = await getApartments();
  out.live = apts.live;
  const listings = apts.results.flatMap((r) => r.listings);
  if (hasDb && apts.live && listings.length) {
    const newIds = await upsertListings(listings);
    out.upserted = listings.length;
    out.new = newIds.length;
  }
  return out;
}

/** Pull today's live Garmin health summary and persist it. Idempotent. */
export async function refreshHealth(): Promise<HealthRefresh> {
  const out: HealthRefresh = { live: false, stored: false };
  const health = await getHealth();
  out.live = health.live;
  if (hasDb && health.live) {
    await upsertHealthSnapshot(health);
    out.stored = true;
  }
  return out;
}

/**
 * Pull the current live data from every source and persist it. Designed to be
 * called once a day by the cron route, but safe to call ad-hoc (upserts are
 * idempotent). Each source degrades independently.
 */
export async function refreshAll(): Promise<RefreshResult> {
  const [apts, health] = await Promise.allSettled([refreshApartments(), refreshHealth()]);
  return {
    ok: hasDb,
    apartments: apts.status === "fulfilled" ? apts.value : { live: false, upserted: 0, new: 0 },
    health: health.status === "fulfilled" ? health.value : { live: false, stored: false },
  };
}
