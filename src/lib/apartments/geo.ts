import { GEO_RULES } from "@/lib/config";

/**
 * Apply the personal geographic rules for the East Village + Lower East Side
 * search:
 *   1. Eastern edge: not east of Avenue B; in the LES (south of Houston St),
 *      the tighter Norfolk St limit applies instead.
 *   2. Not south of Delancey Street (latitude must be >= delancey - buffer).
 *   3. No addresses on Delancey St itself (just off Delancey is fine).
 *
 * StreetEasy longitudes in Manhattan are negative; "east" means a larger
 * (less negative) longitude, so east-of-X ⇒ lng > X longitude.
 */
export function evaluateGeo(
  lat: number,
  lng: number,
  street?: string
): { passes: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Eastern limit steps west as you move south into the LES.
  const inLes = lat <= GEO_RULES.houstonStreetLatitude;
  if (inLes) {
    if (lng > GEO_RULES.norfolkStreetLongitude) {
      reasons.push("East of Norfolk St");
    }
  } else if (lng > GEO_RULES.avenueBLongitude) {
    reasons.push("East of Avenue B");
  }

  if (lat < GEO_RULES.delanceyStreetLatitude - GEO_RULES.boundaryBufferDeg) {
    reasons.push("South of Delancey St");
  }

  // No addresses on Delancey St itself. Being just off Delancey (a cross-street
  // address near it) is allowed, so this only matches a Delancey St address.
  if (street && /\bDELANCEY\b/i.test(street)) {
    reasons.push("On Delancey St");
  }

  // Belt-and-suspenders: catch streets clearly south of Delancey even if the
  // geocode is slightly off.
  if (street && /\bBROOME\s+ST|\bGRAND\s+ST|\bHESTER\s+ST|\bCANAL\s+ST/i.test(street)) {
    if (!reasons.includes("South of Delancey St")) {
      reasons.push("South of Delancey St");
    }
  }

  return { passes: reasons.length === 0, reasons };
}
