import "server-only";
import { sql, ensureSchema, hasDb } from "./client";
import { APARTMENT_SEARCHES } from "@/lib/config";
import type { ApartmentStatus, Listing, ListingResult } from "@/lib/types";

const STATUSES: ApartmentStatus[] = ["none", "like", "dislike", "contact"];

type Row = {
  id: string;
  search_id: string;
  data: Listing;
  status: string;
  passes_geo: boolean;
  price: number | null;
  first_seen_date: string;
  is_new: boolean;
};

function rowToListing(r: Row): Listing {
  return {
    ...r.data,
    id: r.id,
    searchId: r.search_id,
    passesGeo: r.passes_geo,
    status: (STATUSES.includes(r.status as ApartmentStatus) ? r.status : "none") as ApartmentStatus,
    firstSeenDate: typeof r.first_seen_date === "string"
      ? r.first_seen_date.slice(0, 10)
      : new Date(r.first_seen_date).toISOString().slice(0, 10),
    isNew: r.is_new,
  };
}

/**
 * Upsert the current live listings. New ids get first_seen_date = today;
 * existing ids keep their original first_seen_date + user status but refresh
 * their data/price/last_seen. Returns the ids that were brand new this run.
 */
export async function upsertListings(listings: Listing[]): Promise<string[]> {
  if (!sql) return [];
  await ensureSchema();
  const newIds: string[] = [];

  for (const l of listings) {
    const rows = await sql`
      INSERT INTO apartment_listings (id, search_id, data, passes_geo, price, first_seen_date, last_seen_at)
      VALUES (${l.id}, ${l.searchId}, ${JSON.stringify(l)}, ${l.passesGeo}, ${Math.round(l.price)}, CURRENT_DATE, now())
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        passes_geo = EXCLUDED.passes_geo,
        price = EXCLUDED.price,
        search_id = EXCLUDED.search_id,
        last_seen_at = now()
      RETURNING (xmax = 0) AS inserted
    `;
    if (rows[0]?.inserted) newIds.push(l.id);
  }

  return newIds;
}

/** Reconstruct the per-search ListingResult shape the UI expects, from the DB. */
export async function getStoredApartments(): Promise<ListingResult[] | null> {
  if (!sql) return null;
  await ensureSchema();

  const rows = (await sql`
    SELECT id, search_id, data, status, passes_geo, price, first_seen_date,
           (first_seen_date = CURRENT_DATE) AS is_new
    FROM apartment_listings
    ORDER BY passes_geo DESC, price ASC
  `) as Row[];

  if (rows.length === 0) return null;

  const listings = rows.map(rowToListing);

  return APARTMENT_SEARCHES.map((search) => {
    const forSearch = listings.filter((l) => l.searchId === search.id);
    const kept = forSearch.filter((l) => l.passesGeo);
    return {
      searchId: search.id,
      label: search.label,
      totalCount: forSearch.length,
      kept: kept.length,
      filtered: forSearch.length - kept.length,
      listings: forSearch,
    };
  });
}

/** Listings first discovered today (across all searches), newest-relevant first. */
export async function getNewToday(): Promise<Listing[]> {
  if (!sql) return [];
  await ensureSchema();
  const rows = (await sql`
    SELECT id, search_id, data, status, passes_geo, price, first_seen_date, true AS is_new
    FROM apartment_listings
    WHERE first_seen_date = CURRENT_DATE
    ORDER BY passes_geo DESC, price ASC
  `) as Row[];
  return rows.map(rowToListing);
}

export async function setStatus(id: string, status: ApartmentStatus): Promise<void> {
  if (!sql) return;
  await ensureSchema();
  const safe = STATUSES.includes(status) ? status : "none";
  await sql`UPDATE apartment_listings SET status = ${safe} WHERE id = ${id}`;
}

export const apartmentsDbEnabled = hasDb;
