/** Normalized domain types shared across the app + agent tools. */

export type ApartmentStatus = "none" | "like" | "dislike" | "contact";

export type Listing = {
  id: string;
  address: string;
  unit: string | null;
  neighborhood: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  noFee: boolean;
  furnished: boolean;
  availableAt: string | null;
  lat: number;
  lng: number;
  imageUrl: string | null;
  url: string;
  priceDelta: number | null;
  searchId: string;
  passesGeo: boolean;
  geoReasons: string[];
  // Populated when the listing comes from the database.
  status?: ApartmentStatus;
  firstSeenDate?: string | null; // YYYY-MM-DD, the day we first saw it
  isNew?: boolean; // first seen today
};

export type ListingResult = {
  searchId: string;
  label: string;
  totalCount: number;
  kept: number;
  filtered: number;
  listings: Listing[];
};

export type HealthSummary = {
  live: boolean;
  date: string;
  steps: number;
  stepsGoal: number;
  restingHeartRate: number | null;
  sleepHours: number | null;
  sleepMinutes: number | null; // total sleep in whole minutes (for h/m display)
  sleepScore: number | null;
  stress: number | null;
  bodyBattery: number | null;
  caloriesBurned: number | null;
  vo2Max: number | null;
  weeklyIntensityMinutes: number | null;
  trend: { day: string; steps: number; sleep: number; rhr: number }[];
  activities: {
    id: string;
    name: string;
    type: string;
    date: string;
    distanceKm: number | null;
    durationMin: number | null;
    calories: number | null;
    avgHr: number | null;
  }[];
};

export type Deployment = {
  id: string;
  project: string;
  state: string;
  target: string;
  createdAt: string;
  url: string | null;
  commitMessage: string | null;
  branch: string | null;
};

export type WorkSummary = {
  live: boolean;
  projects: number;
  deploymentsToday: number;
  deploymentsWeek: number;
  readyRate: number;
  avgBuildSeconds: number | null;
  deployTrend: { day: string; count: number }[];
  recentDeployments: Deployment[];
};

export type Automation = {
  id: string;
  name: string;
  description: string;
  trigger: string;
  cadence: string;
  icon: string;
  accent: string;
  steps: string[];
  lastRun: string | null;
  lastStatus: "success" | "failed" | "idle";
  connects: string[]; // which modules it stitches together
};

export type RunStep = {
  label: string;
  status: "pending" | "running" | "done" | "failed";
  detail?: string;
};
