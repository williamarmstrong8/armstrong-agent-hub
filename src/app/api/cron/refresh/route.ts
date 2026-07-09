import { NextResponse } from "next/server";
import { refreshAll } from "@/lib/db/refresh";

export const dynamic = "force-dynamic";
// Give the live Garmin/StreetEasy fetches room to complete.
export const maxDuration = 120;

/**
 * Daily refresh job. Wired to a Vercel Cron in vercel.json. Vercel Cron sends
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is configured; we
 * enforce it when set. Also invocable manually (e.g. from the UI) — in dev,
 * with no secret set, it's open.
 */
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await refreshAll();
    return NextResponse.json({ ...result, at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}
