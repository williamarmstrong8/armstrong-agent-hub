// Diagnostic: dump the raw shapes of the richer Garmin endpoints so we can map
// them. Uses cached tokens (no login). Run:
//   node --env-file=.env.local scripts/garmin-probe.mjs
import os from "node:os";
import path from "node:path";
import { GarminConnect } from "garmin-connect";

const dir = process.env.GARMIN_TOKEN_DIR || path.join(os.homedir(), ".garminconnect");
const gc = new GarminConnect({ username: "", password: "" });
gc.loadTokenByFile(dir);

function ymd(d) {
  // LOCAL calendar date (Garmin keys everything by the watch's local day).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function probe(label, fn) {
  try {
    const v = await fn();
    const json = JSON.stringify(v);
    console.log(`\n=== ${label} (${typeof v}) ===`);
    console.log(json && json.length > 2500 ? json.slice(0, 2500) + "…(truncated)" : json);
  } catch (e) {
    console.log(`\n=== ${label} ERROR ===`, e?.message ?? e);
  }
}

const today = new Date();
const t = ymd(today);
const weekAgo = ymd(new Date(Date.now() - 6 * 864e5));

let displayName = "";
await probe("getUserProfile", async () => {
  const p = await gc.getUserProfile();
  displayName = p?.displayName ?? "";
  return { displayName: p?.displayName, userName: p?.userName };
});

await probe("dailySummary", () =>
  gc.get(
    `https://connectapi.garmin.com/usersummary-service/usersummary/daily/${displayName}?calendarDate=${t}`,
  ),
);

const monthAgo = ymd(new Date(Date.now() - 60 * 864e5));
await probe("maxMetrics (VO2, 60d)", () =>
  gc.get(`https://connectapi.garmin.com/metrics-service/metrics/maxmet/daily/${monthAgo}/${t}`),
);

await probe("bodyBattery", () =>
  gc.get(
    `https://connectapi.garmin.com/wellness-service/wellness/bodyBattery/reports/daily?startDate=${t}&endDate=${t}`,
  ),
);

await probe("getSteps(lib)", () => gc.getSteps(today));
await probe("getSleepDuration(lib)", () => gc.getSleepDuration(today));

process.exit(0);
