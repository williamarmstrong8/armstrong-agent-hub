import { GEO_RULES } from "@/lib/config";

/**
 * Apply the personal geographic rules for the East Village search:
 *   1. Not east of Avenue B  (longitude must be <= avenueBLongitude)
 *   2. Not on / south of Houston Street (latitude must be > houston + buffer)
 *
 * StreetEasy longitudes in Manhattan are negative; "east" means a larger
 * (less negative) longitude, so east-of-Ave-B ⇒ lng > avenueBLongitude.
 */
export function evaluateGeo(
  lat: number,
  lng: number,
  street?: string
): { passes: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (lng > GEO_RULES.avenueBLongitude) {
    reasons.push("East of Avenue B");
  }

  if (lat <= GEO_RULES.houstonStreetLatitude + GEO_RULES.houstonBufferDeg) {
    reasons.push("On / south of Houston St");
  }

  // Belt-and-suspenders: catch an explicit Houston St address even if the
  // geocode is slightly off.
  if (street && /\bE(?:AST)?\.?\s*HOUSTON\b|\bHOUSTON\s+ST/i.test(street)) {
    if (!reasons.includes("On / south of Houston St")) {
      reasons.push("On Houston St");
    }
  }

  return { passes: reasons.length === 0, reasons };
}
