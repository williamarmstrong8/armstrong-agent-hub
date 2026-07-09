import "server-only";
import type { Deployment, WorkSummary } from "@/lib/types";
import { SAMPLE_WORK } from "./sample";

/**
 * Live Vercel integration. Set VERCEL_TOKEN (and optionally VERCEL_TEAM_ID)
 * to pull real deployments/projects. Falls back to sample data otherwise.
 */

const API = "https://api.vercel.com";

function dayKey(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short" });
}

export async function getWork(): Promise<WorkSummary> {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return SAMPLE_WORK;

  const team = process.env.VERCEL_TEAM_ID ? `&teamId=${process.env.VERCEL_TEAM_ID}` : "";
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [depRes, projRes] = await Promise.all([
      fetch(`${API}/v6/deployments?limit=40${team}`, { headers, cache: "no-store" }),
      fetch(`${API}/v9/projects?limit=100${team}`, { headers, cache: "no-store" }),
    ]);

    if (!depRes.ok) throw new Error(`deployments ${depRes.status}`);
    const depJson = (await depRes.json()) as { deployments?: RawDeployment[] };
    const projJson = projRes.ok ? ((await projRes.json()) as { projects?: unknown[] }) : { projects: [] };

    const raw = depJson.deployments ?? [];
    const now = Date.now();
    const dayMs = 864e5;

    const recentDeployments: Deployment[] = raw.slice(0, 8).map((d) => ({
      id: d.uid,
      project: d.name,
      state: d.state ?? d.readyState ?? "QUEUED",
      target: d.target ?? "preview",
      createdAt: new Date(d.created ?? d.createdAt ?? now).toISOString(),
      url: d.url ? `https://${d.url}` : null,
      commitMessage: d.meta?.githubCommitMessage ?? null,
      branch: d.meta?.githubCommitRef ?? null,
    }));

    const readyCount = raw.filter((d) => (d.state ?? d.readyState) === "READY").length;
    const trendMap = new Map<string, number>();
    for (let i = 6; i >= 0; i--) trendMap.set(dayKey(now - i * dayMs), 0);
    for (const d of raw) {
      const t = d.created ?? d.createdAt ?? now;
      if (now - t <= 7 * dayMs) {
        const k = dayKey(t);
        if (trendMap.has(k)) trendMap.set(k, (trendMap.get(k) ?? 0) + 1);
      }
    }

    return {
      live: true,
      projects: (projJson.projects ?? []).length,
      deploymentsToday: raw.filter((d) => now - (d.created ?? now) <= dayMs).length,
      deploymentsWeek: raw.filter((d) => now - (d.created ?? now) <= 7 * dayMs).length,
      readyRate: raw.length ? readyCount / raw.length : 1,
      avgBuildSeconds: null,
      deployTrend: [...trendMap.entries()].map(([day, count]) => ({ day, count })),
      recentDeployments,
    };
  } catch (err) {
    console.warn("[vercel] falling back to sample data:", (err as Error).message);
    return SAMPLE_WORK;
  }
}

type RawDeployment = {
  uid: string;
  name: string;
  state?: string;
  readyState?: string;
  target?: string;
  created?: number;
  createdAt?: number;
  url?: string;
  meta?: { githubCommitMessage?: string; githubCommitRef?: string };
};
