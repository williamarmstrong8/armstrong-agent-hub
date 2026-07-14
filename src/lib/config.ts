/**
 * Central configuration for life-hub.
 * Personal preferences live here so the UI, API routes, and the agent all
 * read from a single source of truth.
 */

export type ApartmentSearch = {
  id: string;
  label: string;
  areas: string[]; // StreetEasy neighborhood codes
  bedroomsMin: number;
  bedroomsMax: number;
  priceMax: number;
  priceMin?: number;
};

/**
 * The active rental searches (East Village + Lower East Side above Delancey):
 *   - 2 bed under $5.2k
 *   - 3 bed under $7.5k
 *   - 4 bed under $10k
 */
export const APARTMENT_SEARCHES: ApartmentSearch[] = [
  {
    id: "2br-5k",
    label: "2 Bed · under $5.2k",
    areas: ["EAST_VILLAGE", "LOWER_EAST_SIDE"],
    bedroomsMin: 2,
    bedroomsMax: 2,
    priceMax: 5200,
  },
  {
    id: "3br-7.5k",
    label: "3 Bed · under $7.5k",
    areas: ["EAST_VILLAGE", "LOWER_EAST_SIDE"],
    bedroomsMin: 3,
    bedroomsMax: 3,
    priceMax: 7500,
  },
  {
    id: "4br-10k",
    label: "4 Bed · under $10k",
    areas: ["EAST_VILLAGE", "LOWER_EAST_SIDE"],
    bedroomsMin: 4,
    bedroomsMax: 4,
    priceMax: 10000,
  },
];

/**
 * Hard geographic constraints applied on top of every search:
 *   - Not east of Avenue B (East Village)
 *   - In the Lower East Side, not east of Norfolk St (a tighter east edge)
 *   - Not south of Delancey Street (the southern edge)
 *   - No addresses on Delancey St itself (just off it is fine)
 * The southern boundary was extended from Houston St down to Delancey St to
 * cover the Lower East Side above Delancey. Evaluated in lib/apartments/geo.ts.
 */
export const GEO_RULES = {
  // Avenue B runs roughly along longitude -73.9805 in the East Village.
  // Anything east of this (a larger/less-negative longitude) is excluded.
  avenueBLongitude: -73.9805,
  // Houston St (~40.7228) is the East Village / Lower East Side dividing line;
  // below it the tighter Norfolk St eastern limit applies.
  houstonStreetLatitude: 40.7228,
  // Norfolk St runs ~-73.9858; use the Norfolk/Suffolk divide so Norfolk itself
  // is allowed but anything east of it (Suffolk, Clinton, ...) is excluded.
  norfolkStreetLongitude: -73.9853,
  // Delancey St sits around latitude 40.7185; exclude anything south of it.
  delanceyStreetLatitude: 40.7185,
  // small buffer so a listing whose geocode lands mid-street isn't wrongly cut
  boundaryBufferDeg: 0.0006,
  notes: [
    "Not east of Avenue B",
    "LES: not east of Norfolk St",
    "Not south of Delancey St",
    "Not on Delancey St itself",
  ],
} as const;

export type ModuleKey = "dashboard" | "apartments" | "health" | "work" | "automations" | "assistant";

export type ModuleDef = {
  key: ModuleKey;
  title: string;
  href: string;
  description: string;
  icon: string; // lucide icon name
  accent: string; // hex used for the module's glyph tint
  source: string; // where the data comes from
};

export const MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    title: "Dashboard",
    href: "/",
    description: "Everything, connected.",
    icon: "LayoutGrid",
    accent: "#111318",
    source: "life-hub",
  },
  {
    key: "apartments",
    title: "Home Search",
    href: "/apartments",
    description: "East Village & LES rentals, filtered to your rules.",
    icon: "Building2",
    accent: "#0a7cff",
    source: "StreetEasy MCP",
  },
  {
    key: "health",
    title: "Health",
    href: "/health",
    description: "Sleep, steps, heart rate & training load.",
    icon: "HeartPulse",
    accent: "#e5484d",
    source: "Garmin MCP",
  },
  {
    key: "work",
    title: "Work",
    href: "/work",
    description: "Deployments, projects & shipping velocity.",
    icon: "Triangle",
    accent: "#111318",
    source: "Vercel",
  },
  {
    key: "automations",
    title: "Automations",
    href: "/automations",
    description: "Run cross-life workflows on demand.",
    icon: "Workflow",
    accent: "#17a673",
    source: "Vercel Workflows",
  },
  {
    key: "assistant",
    title: "Assistant",
    href: "/assistant",
    description: "One agent across every part of your life.",
    icon: "Sparkles",
    accent: "#7c3aed",
    source: "AI Gateway",
  },
];

export const OWNER = {
  name: "William",
  fullName: "William Armstrong",
  role: "Vercel",
  city: "New York, NY",
};

const APPLICANT_WORDS: Record<number, string> = {
  2: "two",
  3: "three",
  4: "four",
  5: "five",
};

/**
 * Copy-paste inquiry for StreetEasy / broker messages, tailored to the number
 * of applicants. Smaller searches keep the three-person message; the 4-bed uses
 * a four-person variant.
 */
export function apartmentOutreach(applicants: number): string {
  const word = APPLICANT_WORDS[applicants] ?? `${applicants}`;
  return `Hi there,

We're ${word} applicants and would love to tour as soon as possible. We have all the paperwork ready to go, guarantors included, and are ready to submit an application right away. Would it be possible to get the details and schedule a tour this week?

Thank you,
${OWNER.fullName}`;
}

/** Default outreach message (three applicants). */
export const APARTMENT_OUTREACH = apartmentOutreach(3);
