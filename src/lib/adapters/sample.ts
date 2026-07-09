import type { Listing, HealthSummary, WorkSummary } from "@/lib/types";

/**
 * Deterministic sample data. Used as a graceful fallback whenever a live
 * source is unavailable (no credentials, rate limited, offline) so the hub
 * always renders. Coordinates are real East Village points chosen to
 * exercise the geo rules.
 */

const evPoints: [string, number, number][] = [
  ["Avenue A", 40.7265, -73.9835], // west of Ave B, north of Houston -> keep
  ["E 7th St", 40.7261, -73.9825], // keep
  ["E 10th St", 40.7295, -73.9845], // keep
  ["E 5th St", 40.7255, -73.9855], // keep
  ["Avenue C", 40.7248, -73.9775], // east of Ave B -> filtered
  ["E Houston St", 40.7228, -73.9865], // on Houston -> filtered
  ["E 9th St", 40.728, -73.984], // keep
  ["E 6th St", 40.7258, -73.9848], // keep
];

function makeListing(
  i: number,
  searchId: string,
  bedrooms: number,
  price: number
): Omit<Listing, "passesGeo" | "geoReasons"> {
  const [street, lat, lng] = evPoints[i % evPoints.length];
  return {
    id: `sample-${searchId}-${i}`,
    address: `${120 + i * 7} ${street}`,
    unit: i % 3 === 0 ? `${i}F` : null,
    neighborhood: "East Village",
    price,
    bedrooms,
    bathrooms: bedrooms >= 3 ? 2 : 1,
    sqft: 620 + i * 40 + bedrooms * 120,
    noFee: i % 2 === 0,
    furnished: false,
    availableAt: null,
    lat,
    lng,
    imageUrl: null,
    url: "https://streeteasy.com/for-rent/nyc/area:117",
    priceDelta: i % 4 === 0 ? -150 : null,
    searchId,
  };
}

export const SAMPLE_LISTINGS: Record<string, Omit<Listing, "passesGeo" | "geoReasons">[]> = {
  "2br-5k": [
    makeListing(0, "2br-5k", 2, 4650),
    makeListing(1, "2br-5k", 2, 4950),
    makeListing(4, "2br-5k", 2, 4700), // Ave C -> will be filtered
    makeListing(6, "2br-5k", 2, 4300),
    makeListing(7, "2br-5k", 2, 4850),
  ],
  "3br-7-5k": [
    makeListing(2, "3br-7-5k", 3, 7200),
    makeListing(3, "3br-7-5k", 3, 6900),
    makeListing(5, "3br-7-5k", 3, 7100), // Houston -> filtered
    makeListing(6, "3br-7-5k", 3, 7450),
  ],
};

export const SAMPLE_HEALTH: HealthSummary = {
  live: false,
  date: new Date().toISOString(),
  steps: 8420,
  stepsGoal: 10000,
  restingHeartRate: 54,
  sleepHours: 7.4,
  sleepMinutes: 444,
  sleepScore: 82,
  stress: 31,
  bodyBattery: 68,
  caloriesBurned: 2680,
  vo2Max: 51,
  weeklyIntensityMinutes: 320,
  trend: [
    { day: "Mon", steps: 9200, sleep: 7.1, rhr: 55 },
    { day: "Tue", steps: 12100, sleep: 6.8, rhr: 56 },
    { day: "Wed", steps: 7400, sleep: 7.9, rhr: 53 },
    { day: "Thu", steps: 10300, sleep: 7.2, rhr: 54 },
    { day: "Fri", steps: 6800, sleep: 6.5, rhr: 57 },
    { day: "Sat", steps: 14200, sleep: 8.1, rhr: 52 },
    { day: "Sun", steps: 8420, sleep: 7.4, rhr: 54 },
  ],
  activities: [
    {
      id: "a1",
      name: "East River Loop",
      type: "cycling",
      date: new Date(Date.now() - 864e5).toISOString(),
      distanceKm: 28.4,
      durationMin: 71,
      calories: 720,
      avgHr: 142,
    },
    {
      id: "a2",
      name: "Morning Run",
      type: "running",
      date: new Date(Date.now() - 2 * 864e5).toISOString(),
      distanceKm: 6.2,
      durationMin: 33,
      calories: 410,
      avgHr: 156,
    },
    {
      id: "a3",
      name: "Strength — Full Body",
      type: "strength",
      date: new Date(Date.now() - 3 * 864e5).toISOString(),
      distanceKm: null,
      durationMin: 48,
      calories: 320,
      avgHr: 118,
    },
  ],
};

export const SAMPLE_WORK: WorkSummary = {
  live: false,
  projects: 7,
  deploymentsToday: 5,
  deploymentsWeek: 34,
  readyRate: 0.94,
  avgBuildSeconds: 47,
  deployTrend: [
    { day: "Mon", count: 6 },
    { day: "Tue", count: 4 },
    { day: "Wed", count: 8 },
    { day: "Thu", count: 5 },
    { day: "Fri", count: 6 },
    { day: "Sat", count: 0 },
    { day: "Sun", count: 5 },
  ],
  recentDeployments: [
    {
      id: "dpl_1",
      project: "life-hub",
      state: "READY",
      target: "production",
      createdAt: new Date(Date.now() - 12 * 60e3).toISOString(),
      url: "https://life-hub.vercel.app",
      commitMessage: "feat: wire live StreetEasy adapter",
      branch: "main",
    },
    {
      id: "dpl_2",
      project: "life-hub",
      state: "READY",
      target: "preview",
      createdAt: new Date(Date.now() - 3 * 3600e3).toISOString(),
      url: "https://life-hub-git-agent.vercel.app",
      commitMessage: "wip: assistant tools",
      branch: "agent",
    },
    {
      id: "dpl_3",
      project: "portfolio",
      state: "BUILDING",
      target: "preview",
      createdAt: new Date(Date.now() - 5 * 3600e3).toISOString(),
      url: null,
      commitMessage: "chore: bump deps",
      branch: "deps",
    },
  ],
};
