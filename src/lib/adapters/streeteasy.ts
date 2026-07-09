import "server-only";
import { StreetEasyClient, Areas } from "streeteasy-api";
import type { SearchRentalListing } from "streeteasy-api";
import { APARTMENT_SEARCHES, type ApartmentSearch } from "@/lib/config";
import { evaluateGeo } from "@/lib/apartments/geo";
import type { Listing, ListingResult } from "@/lib/types";
import { SAMPLE_LISTINGS } from "./sample";

const PHOTO_BASE = "https://photos.zillowstatic.com/fp";

function photoUrl(key: string | undefined | null): string | null {
  if (!key) return null;
  return `${PHOTO_BASE}/${key}-se_large_800_400.webp`;
}

function areaCodes(names: string[]): number[] {
  const map = Areas as unknown as Record<string, number>;
  return names.map((n) => map[n]).filter((n): n is number => typeof n === "number");
}

function normalize(node: SearchRentalListing, searchId: string): Listing {
  const lat = node.geoPoint?.latitude ?? 0;
  const lng = node.geoPoint?.longitude ?? 0;
  const geo = evaluateGeo(lat, lng, node.street);
  return {
    id: node.id,
    address: [node.street].filter(Boolean).join(" ").trim() || "Address hidden",
    unit: node.unit || null,
    neighborhood: node.areaName || "East Village",
    price: node.price,
    bedrooms: node.bedroomCount,
    bathrooms: (node.fullBathroomCount ?? 0) + (node.halfBathroomCount ?? 0) * 0.5,
    sqft: node.livingAreaSize ?? null,
    noFee: node.noFee,
    furnished: node.furnished,
    availableAt: node.availableAt,
    lat,
    lng,
    imageUrl: photoUrl(node.leadMedia?.photo?.key ?? node.photos?.[0]?.key),
    url: node.urlPath ? `https://streeteasy.com${node.urlPath}` : "https://streeteasy.com",
    priceDelta: node.priceDelta ?? null,
    searchId,
    passesGeo: geo.passes,
    geoReasons: geo.reasons,
  };
}

async function runSearch(search: ApartmentSearch): Promise<ListingResult> {
  const client = new StreetEasyClient();
  const perPage = 40;
  const filters = {
    areas: areaCodes(search.areas) as never,
    rentalStatus: "ACTIVE" as const,
    price: { lowerBound: search.priceMin ?? null, upperBound: search.priceMax },
    bedrooms: { lowerBound: search.bedroomsMin, upperBound: search.bedroomsMax },
  };
  const sorting = { attribute: "PRICE" as const, direction: "ASCENDING" as const };

  // StreetEasy paginates — page 1 alone misses listings at the top of the
  // price range (e.g. exactly $5,200 when 42 results exist).
  const edges: { node: SearchRentalListing }[] = [];
  let totalCount = 0;
  for (let page = 1; page <= 10; page++) {
    const res = await client.searchRentals({ filters, sorting, perPage, page });
    const batch = res.searchRentals?.edges ?? [];
    totalCount = res.searchRentals?.totalCount ?? totalCount;
    edges.push(...batch);
    if (batch.length < perPage || edges.length >= totalCount) break;
  }

  const listings = edges
    .map((e) => normalize(e.node, search.id))
    // enforce price ceiling client-side too (StreetEasy sometimes returns net-effective outliers)
    .filter((l) => l.price <= search.priceMax);

  const kept = listings.filter((l) => l.passesGeo);
  return {
    searchId: search.id,
    label: search.label,
    totalCount: totalCount || listings.length,
    kept: kept.length,
    filtered: listings.length - kept.length,
    listings: listings.sort((a, b) => Number(b.passesGeo) - Number(a.passesGeo) || a.price - b.price),
  };
}

function sampleResult(search: ApartmentSearch): ListingResult {
  const raw = SAMPLE_LISTINGS[search.id] ?? [];
  const listings: Listing[] = raw.map((l) => {
    const geo = evaluateGeo(l.lat, l.lng, l.address);
    return { ...l, passesGeo: geo.passes, geoReasons: geo.reasons };
  });
  const kept = listings.filter((l) => l.passesGeo);
  return {
    searchId: search.id,
    label: search.label,
    totalCount: listings.length,
    kept: kept.length,
    filtered: listings.length - kept.length,
    listings: listings.sort((a, b) => Number(b.passesGeo) - Number(a.passesGeo) || a.price - b.price),
  };
}

export async function getApartments(): Promise<{ live: boolean; results: ListingResult[] }> {
  try {
    const results = await Promise.all(APARTMENT_SEARCHES.map(runSearch));
    // If StreetEasy returns nothing at all, fall back so the UI isn't empty.
    const anyData = results.some((r) => r.listings.length > 0);
    if (!anyData) throw new Error("no listings returned");
    return { live: true, results };
  } catch (err) {
    console.warn("[streeteasy] falling back to sample data:", (err as Error).message);
    return { live: false, results: APARTMENT_SEARCHES.map(sampleResult) };
  }
}
