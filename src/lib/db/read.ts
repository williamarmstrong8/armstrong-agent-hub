import "server-only";
import { getApartments } from "@/lib/adapters/streeteasy";
import { getHealth } from "@/lib/adapters/garmin";
import { hasDb } from "./client";
import { getStoredApartments, upsertListings } from "./apartments";
import { getLatestHealth, upsertHealthSnapshot } from "./health";
import type { HealthSummary, ListingResult } from "@/lib/types";

/**
 * Read apartments the app should render. DB-first: once the daily cron has
 * populated the store we serve from there (fast, and immune to StreetEasy's
 * bot-block). On a cold store we fall back to a live fetch and, if it's real
 * data, seed the DB so subsequent loads are cached.
 */
export async function loadApartments(): Promise<{
  live: boolean;
  fromDb: boolean;
  results: ListingResult[];
}> {
  if (hasDb) {
    const stored = await getStoredApartments();
    if (stored && stored.some((r) => r.listings.length > 0)) {
      return { live: true, fromDb: true, results: stored };
    }
  }

  // Cold store (or no DB): fetch live and seed if possible.
  const { live, results } = await getApartments();
  if (hasDb && live) {
    try {
      await upsertListings(results.flatMap((r) => r.listings));
      const seeded = await getStoredApartments();
      if (seeded) return { live: true, fromDb: true, results: seeded };
    } catch {
      // fall through to returning the live results directly
    }
  }
  return { live, fromDb: false, results };
}

/**
 * Read the latest health snapshot. DB-first; falls back to a live Garmin fetch
 * (and seeds the store) when nothing is saved yet.
 */
export async function loadHealth(): Promise<{ health: HealthSummary; fromDb: boolean }> {
  if (hasDb) {
    const stored = await getLatestHealth();
    if (stored) return { health: stored, fromDb: true };
  }

  const health = await getHealth();
  if (hasDb && health.live) {
    try {
      await upsertHealthSnapshot(health);
      return { health, fromDb: true };
    } catch {
      // ignore, return live
    }
  }
  return { health, fromDb: false };
}
