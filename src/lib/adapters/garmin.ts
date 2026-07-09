import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { HealthSummary } from "@/lib/types";
import { SAMPLE_HEALTH } from "./sample";

/**
 * Live Garmin Connect integration (mirrors the garmin_mcp server, but in-process).
 *
 * Auth model matches garmin_mcp / python-garminconnect: authenticate ONCE and
 * reuse persisted OAuth tokens on every subsequent call. A fresh
 * username/password login on every request gets rate-limited by Garmin's
 * Cloudflare edge (HTTP 429 "Error 1015"), which is exactly what dumps us back
 * to sample data. Token priority:
 *   1. GARMIN_TOKENS env (JSON blob) — for serverless/Vercel where the home
 *      dir isn't writable/persistent.
 *   2. Token dir on disk (GARMIN_TOKEN_DIR or ~/.garminconnect) — for local dev.
 *   3. First-run password login, then persist tokens to the token dir.
 *
 * Every metric call is defensive: a failure in any single metric degrades to
 * the sample baseline for that field rather than blanking the whole page.
 */

type AnyRec = Record<string, unknown>;

function num(v: unknown): number | null {
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

/** Garmin keys everything by the watch's LOCAL calendar day. Using a UTC date
 *  (e.g. `toISOString`) rolls over early evening in western timezones and asks
 *  Garmin for a day with no data yet — which is why steps looked wrong. */
function localDate(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Garmin timestamps like "2026-07-09T04:57:53.815" are GMT but carry no zone
 *  suffix; JS would parse them as local. Force UTC so relative times are right. */
function parseGmt(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(v) ? v : `${v}Z`;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

function dayLabel(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** Last 7 local calendar days, oldest first. Noon avoids DST rollover bugs. */
function last7LocalDates(): Date[] {
  const days: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function sleepHoursFromPayload(raw: unknown): number {
  const s = raw as AnyRec;
  const dto = (s.dailySleepDTO as AnyRec) ?? s;
  const seconds = num(dto.sleepTimeSeconds);
  return seconds ? Math.round((seconds / 3600) * 10) / 10 : 0;
}

const API = "https://connectapi.garmin.com";

async function fetchWeekTrend(
  gc: GarminClient,
  days: Date[],
  todaySummary?: AnyRec,
): Promise<HealthSummary["trend"]> {
  const start = localDate(days[0]);
  const end = localDate(days[days.length - 1]);
  const todayStr = end;

  const [stepsRes, ...dayRows] = await Promise.allSettled([
    gc.get<Array<{ calendarDate: string; totalSteps: number | null }>>(
      `${API}/usersummary-service/stats/steps/daily/${start}/${end}`,
    ),
    ...days.map((d) => {
      const dateStr = localDate(d);
      return Promise.allSettled([
        gc.getSleepData(d),
        gc.get<AnyRec>(`${API}/wellness-service/wellness/dailyHeartRate?date=${dateStr}`),
      ]);
    }),
  ]);

  const stepsByDate = new Map<string, number>();
  if (stepsRes.status === "fulfilled" && Array.isArray(stepsRes.value)) {
    for (const row of stepsRes.value) {
      const steps = num(row.totalSteps);
      if (steps != null && row.calendarDate) stepsByDate.set(row.calendarDate, steps);
    }
  }
  if (todaySummary) {
    const todaySteps = num(todaySummary.totalSteps);
    if (todaySteps != null) stepsByDate.set(todayStr, todaySteps);
  }

  return days.map((d, i) => {
    const dateStr = localDate(d);
    let sleep = 0;
    let rhr = 0;

    const dayResult = dayRows[i];
    if (dayResult?.status === "fulfilled") {
      const [sleepRes, hrRes] = dayResult.value;
      if (sleepRes.status === "fulfilled" && sleepRes.value) {
        sleep = sleepHoursFromPayload(sleepRes.value);
      }
      if (hrRes.status === "fulfilled" && hrRes.value) {
        rhr = num((hrRes.value as AnyRec).restingHeartRate) ?? 0;
      }
    }

    if (dateStr === todayStr && todaySummary) {
      rhr = num(todaySummary.restingHeartRate) ?? rhr;
    }

    return {
      day: dayLabel(d),
      steps: stepsByDate.get(dateStr) ?? 0,
      sleep,
      rhr,
    };
  });
}

export function tokenDir(): string {
  return process.env.GARMIN_TOKEN_DIR || path.join(os.homedir(), ".garminconnect");
}

let cache: { at: number; data: HealthSummary } | null = null;
const TTL = 5 * 60 * 1000;

// Reuse one client across invocations so the loaded OAuth token (and its
// auto-refresh) survives between requests instead of re-authenticating.
type GarminClient = {
  loadToken: (oauth1: unknown, oauth2: unknown) => void;
  loadTokenByFile: (dir: string) => void;
  exportTokenToFile: (dir: string) => void;
  login: (username?: string, password?: string) => Promise<unknown>;
  get: <T = unknown>(url: string) => Promise<T>;
  getUserProfile: () => Promise<AnyRec>;
  getSleepData: (d: Date) => Promise<unknown>;
  getActivities: (start: number, limit: number) => Promise<unknown>;
};

let clientPromise: Promise<GarminClient | null> | null = null;

async function getClient(): Promise<GarminClient | null> {
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const email = process.env.GARMIN_EMAIL;
    const password = process.env.GARMIN_PASSWORD;
    const { GarminConnect } = await import("garmin-connect");
    const gc = new GarminConnect({
      username: email ?? "",
      password: password ?? "",
    }) as unknown as GarminClient;

    // 1. Tokens supplied directly via env (best for serverless).
    const rawTokens = process.env.GARMIN_TOKENS;
    if (rawTokens) {
      try {
        const { oauth1, oauth2 } = JSON.parse(rawTokens);
        gc.loadToken(oauth1, oauth2);
        return gc;
      } catch (err) {
        console.warn("[garmin] GARMIN_TOKENS present but unusable:", (err as Error).message);
      }
    }

    // 2. Tokens persisted on disk from a prior `garmin-auth` run.
    const dir = tokenDir();
    if (fs.existsSync(path.join(dir, "oauth1_token.json"))) {
      try {
        gc.loadTokenByFile(dir);
        return gc;
      } catch (err) {
        console.warn("[garmin] failed to load token file:", (err as Error).message);
      }
    }

    // 3. First-run: log in with credentials, then persist so we never
    //    re-authenticate (and never trip Garmin's login rate limiter) again.
    if (!email || !password) {
      console.warn(
        "[garmin] no tokens and no credentials — run `pnpm garmin:auth` or set GARMIN_TOKENS.",
      );
      return null;
    }
    await gc.login();
    try {
      gc.exportTokenToFile(dir);
    } catch (err) {
      console.warn("[garmin] logged in but could not persist tokens:", (err as Error).message);
    }
    return gc;
  })();

  return clientPromise;
}

let displayName: string | null = null;
async function getDisplayName(gc: GarminClient): Promise<string> {
  if (displayName) return displayName;
  const profile = await gc.getUserProfile();
  displayName = String(profile.displayName ?? "");
  return displayName;
}

export async function getHealth(): Promise<HealthSummary> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  let gc: GarminClient | null;
  try {
    gc = await getClient();
  } catch (err) {
    // Reset so a transient failure (e.g. rate limit) can be retried next call.
    clientPromise = null;
    console.warn("[garmin] auth failed, falling back to sample data:", (err as Error).message);
    return SAMPLE_HEALTH;
  }
  if (!gc) return SAMPLE_HEALTH;

  try {
    const today = new Date();
    const date = localDate(today);
    const summary: HealthSummary = {
      ...SAMPLE_HEALTH,
      live: true,
      date: today.toISOString(),
      trend: [],
    };

    const name = await getDisplayName(gc);
    const vo2Start = localDate(new Date(Date.now() - 60 * 864e5));
    const weekDays = last7LocalDates();

    // One rich daily-summary call covers steps, calories, RHR, stress, body
    // battery and intensity minutes; the rest are separate endpoints.
    const settled = await Promise.allSettled([
      gc.get<AnyRec>(`${API}/usersummary-service/usersummary/daily/${name}?calendarDate=${date}`),
      gc.get<AnyRec[]>(`${API}/metrics-service/metrics/maxmet/daily/${vo2Start}/${date}`),
      gc.getSleepData(today),
      gc.getActivities(0, 8),
      fetchWeekTrend(gc, weekDays),
    ]);

    const [daily, vo2, sleep, activities, trend] = settled;

    if (daily.status === "fulfilled" && daily.value) {
      const d = daily.value;
      summary.steps = num(d.totalSteps) ?? summary.steps;
      summary.stepsGoal = num(d.dailyStepGoal) ?? summary.stepsGoal;
      summary.caloriesBurned = num(d.totalKilocalories) ?? summary.caloriesBurned;
      summary.restingHeartRate = num(d.restingHeartRate) ?? summary.restingHeartRate;
      summary.stress = num(d.averageStressLevel) ?? summary.stress;
      summary.bodyBattery =
        num(d.bodyBatteryMostRecentValue) ?? num(d.bodyBatteryHighestValue) ?? summary.bodyBattery;
      const moderate = num(d.moderateIntensityMinutes) ?? 0;
      const vigorous = num(d.vigorousIntensityMinutes) ?? 0;
      summary.weeklyIntensityMinutes = moderate + vigorous * 2;
      // Prefer the real device sync time for the "updated" label.
      summary.date = parseGmt(d.lastSyncTimestampGMT) ?? summary.date;
    }

    if (vo2.status === "fulfilled" && Array.isArray(vo2.value) && vo2.value.length) {
      // Entries are ascending by date — the last one is the most recent reading.
      const latest = vo2.value[vo2.value.length - 1] as AnyRec;
      const generic = (latest.generic as AnyRec) ?? {};
      const precise = num(generic.vo2MaxPreciseValue);
      summary.vo2Max = num(generic.vo2MaxValue) ?? (precise ? Math.round(precise) : summary.vo2Max);
    }

    if (sleep.status === "fulfilled" && sleep.value) {
      const s = sleep.value as unknown as AnyRec;
      const dto = (s.dailySleepDTO as AnyRec) ?? s;
      const seconds = num(dto.sleepTimeSeconds);
      if (seconds) {
        summary.sleepMinutes = Math.round(seconds / 60);
        summary.sleepHours = Math.round((seconds / 3600) * 10) / 10;
      }
      const scores = (dto.sleepScores as AnyRec) ?? {};
      const overall = (scores.overall as AnyRec) ?? {};
      summary.sleepScore = num(overall.value) ?? summary.sleepScore;
    }

    if (activities.status === "fulfilled" && Array.isArray(activities.value)) {
      const acts = activities.value as unknown as AnyRec[];
      summary.activities = acts.slice(0, 6).map((a, i) => {
        const type = (a.activityType as AnyRec) ?? {};
        return {
          id: String(a.activityId ?? i),
          name: String(a.activityName ?? "Activity"),
          type: String(type.typeKey ?? "activity"),
          date: String(a.startTimeLocal ?? new Date().toISOString()),
          distanceKm: num(a.distance) ? Math.round((num(a.distance)! / 1000) * 10) / 10 : null,
          durationMin: num(a.duration) ? Math.round(num(a.duration)! / 60) : null,
          calories: num(a.calories),
          avgHr: num(a.averageHR),
        };
      });
    }

    if (trend.status === "fulfilled" && trend.value.length) {
      summary.trend = trend.value;
      // Align today's trend point with the headline stats we already mapped.
      const todayPoint = summary.trend[summary.trend.length - 1];
      if (daily.status === "fulfilled" && daily.value) {
        todayPoint.steps = num(daily.value.totalSteps) ?? todayPoint.steps;
        todayPoint.rhr = num(daily.value.restingHeartRate) ?? todayPoint.rhr;
      }
      if (sleep.status === "fulfilled" && sleep.value) {
        todayPoint.sleep = sleepHoursFromPayload(sleep.value);
      }
    }

    cache = { at: Date.now(), data: summary };
    return summary;
  } catch (err) {
    console.warn("[garmin] fetch failed, falling back to sample data:", (err as Error).message);
    return SAMPLE_HEALTH;
  }
}
