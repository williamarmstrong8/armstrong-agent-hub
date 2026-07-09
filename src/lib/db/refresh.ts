import "server-only";
import { getApartments } from "@/lib/adapters/streeteasy";
import { getHealth } from "@/lib/adapters/garmin";
import { upsertListings } from "./apartments";
import { upsertHealthSnapshot } from "./health";
import { hasDb } from "./client";

export type RefreshResult = {
  ok: boolean;
  apartments: { live: boolean; upserted: number; new: number };
  health: { live: boolean; stored: boolean };
};

/**
 * Pull the current live data from every source and persist it. Designed to be
 * called once a day by the cron route, but safe to call ad-hoc (upserts are
 * idempotent). Each source degrades independently.
 */
export async function refreshAll(): Promise<RefreshResult> {
  const result: RefreshResult = {
    ok: hasDb,
    apartments: { live: false, upserted: 0, new: 0 },
    health: { live: false, stored: false },
  };

  const [apts, health] = await Promise.allSettled([getApartments(), getHealth()]);

  if (apts.status === "fulfilled") {
    result.apartments.live = apts.value.live;
    const listings = apts.value.results.flatMap((r) => r.listings);
    // Only persist real data — never pollute the store with sample listings.
    if (hasDb && apts.value.live && listings.length) {
      const newIds = await upsertListings(listings);
      result.apartments.upserted = listings.length;
      result.apartments.new = newIds.length;
    }
  }

  if (health.status === "fulfilled") {
    result.health.live = health.value.live;
    if (hasDb && health.value.live) {
      await upsertHealthSnapshot(health.value);
      result.health.stored = true;
    }
  }

  return result;
}
