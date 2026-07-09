import type { Automation } from "@/lib/types";

/**
 * Automation catalog. Each one stitches multiple life modules together.
 * These are designed to map onto Vercel Workflows (durable, step-based)
 * when deployed — the in-app runner (/api/automations/run) executes the
 * same steps synchronously against the live adapters today.
 */
export const AUTOMATIONS: Automation[] = [
  {
    id: "apartment-digest",
    name: "East Village Digest",
    description:
      "Re-run both StreetEasy searches, apply your Ave B / Houston rules, and surface only new qualifying listings.",
    trigger: "Daily · 8:00 AM",
    cadence: "daily",
    icon: "Building2",
    accent: "#0a7cff",
    steps: [
      "Query StreetEasy (2BR ≤ $5k, 3BR ≤ $7.5k)",
      "Apply geo rules (Ave B, Houston St)",
      "Diff against yesterday's set",
      "Compose digest",
    ],
    lastRun: new Date(Date.now() - 6 * 3600e3).toISOString(),
    lastStatus: "success",
    connects: ["apartments"],
  },
  {
    id: "morning-brief",
    name: "Morning Brief",
    description:
      "One glance to start the day: last night's sleep & recovery, today's step goal, deploy queue, and top new apartment.",
    trigger: "Daily · 7:00 AM",
    cadence: "daily",
    icon: "Sparkles",
    accent: "#7c3aed",
    steps: ["Pull Garmin recovery", "Pull Vercel deploy queue", "Pull top listing", "Summarize with AI"],
    lastRun: new Date(Date.now() - 20 * 3600e3).toISOString(),
    lastStatus: "success",
    connects: ["health", "work", "apartments"],
  },
  {
    id: "recovery-guard",
    name: "Recovery Guard",
    description:
      "If body battery or sleep score drops below threshold, flag a lighter training day and block focus time.",
    trigger: "On Garmin sync",
    cadence: "event",
    icon: "HeartPulse",
    accent: "#e5484d",
    steps: ["Read sleep + body battery", "Evaluate thresholds", "Adjust training plan", "Notify"],
    lastRun: new Date(Date.now() - 2 * 864e5).toISOString(),
    lastStatus: "idle",
    connects: ["health"],
  },
  {
    id: "ship-report",
    name: "Weekly Ship Report",
    description:
      "Summarize the week's Vercel deployments, ready-rate, and build health into a shareable recap.",
    trigger: "Fri · 5:00 PM",
    cadence: "weekly",
    icon: "Triangle",
    accent: "#111318",
    steps: ["Aggregate week's deployments", "Compute ready-rate", "Draft recap"],
    lastRun: new Date(Date.now() - 3 * 864e5).toISOString(),
    lastStatus: "success",
    connects: ["work"],
  },
];

export function getAutomation(id: string) {
  return AUTOMATIONS.find((a) => a.id === id);
}
