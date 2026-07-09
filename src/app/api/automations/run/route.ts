import { NextResponse } from "next/server";
import { getAutomation } from "@/lib/adapters/automations";
import { getApartments } from "@/lib/adapters/streeteasy";
import { getHealth } from "@/lib/adapters/garmin";
import { getWork } from "@/lib/adapters/vercel";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StepResult = { label: string; status: "done" | "failed"; detail?: string };

export async function POST(req: Request) {
  const { id } = (await req.json()) as { id?: string };
  const automation = id ? getAutomation(id) : undefined;
  if (!automation) {
    return NextResponse.json({ error: "Unknown automation" }, { status: 404 });
  }

  const steps: StepResult[] = [];
  let summary = "";

  try {
    switch (automation.id) {
      case "apartment-digest": {
        const { live, results } = await getApartments();
        const kept = results.reduce((n, r) => n + r.kept, 0);
        const filtered = results.reduce((n, r) => n + r.filtered, 0);
        steps.push({ label: automation.steps[0], status: "done", detail: `${live ? "Live" : "Sample"} · ${results.length} searches` });
        steps.push({ label: automation.steps[1], status: "done", detail: `${filtered} excluded by geo rules` });
        steps.push({ label: automation.steps[2], status: "done", detail: `${kept} qualifying` });
        const top = results.flatMap((r) => r.listings).filter((l) => l.passesGeo).sort((a, b) => a.price - b.price)[0];
        steps.push({ label: automation.steps[3], status: "done" });
        summary = top
          ? `${kept} qualifying listings across both searches. Cheapest match: ${top.address} at ${formatCurrency(top.price)}/mo (${top.bedrooms}BR).`
          : `No listings currently pass your geo rules — all ${filtered} results were east of Ave B or on Houston St.`;
        break;
      }
      case "morning-brief": {
        const [health, work, apts] = await Promise.all([getHealth(), getWork(), getApartments()]);
        steps.push({ label: automation.steps[0], status: "done", detail: `Sleep ${health.sleepHours}h · battery ${health.bodyBattery}` });
        steps.push({ label: automation.steps[1], status: "done", detail: `${work.deploymentsToday} deploys today` });
        const top = apts.results.flatMap((r) => r.listings).filter((l) => l.passesGeo).sort((a, b) => a.price - b.price)[0];
        steps.push({ label: automation.steps[2], status: "done", detail: top ? `${top.address}` : "none" });
        steps.push({ label: automation.steps[3], status: "done" });
        summary = `Good morning. You slept ${health.sleepHours}h (score ${health.sleepScore}), body battery ${health.bodyBattery}. ${work.deploymentsToday} deploys are queued today. Top new apartment: ${top ? `${top.address} at ${formatCurrency(top.price)}/mo` : "nothing new that fits your rules"}.`;
        break;
      }
      case "recovery-guard": {
        const health = await getHealth();
        steps.push({ label: automation.steps[0], status: "done", detail: `battery ${health.bodyBattery} · sleep ${health.sleepScore}` });
        const low = (health.bodyBattery ?? 100) < 40 || (health.sleepScore ?? 100) < 60;
        steps.push({ label: automation.steps[1], status: "done", detail: low ? "below threshold" : "within range" });
        steps.push({ label: automation.steps[2], status: "done", detail: low ? "→ easy day" : "→ no change" });
        steps.push({ label: automation.steps[3], status: "done" });
        summary = low
          ? `Recovery is low (battery ${health.bodyBattery}, sleep ${health.sleepScore}). Recommending an easy training day and holding focus blocks.`
          : `Recovery looks solid (battery ${health.bodyBattery}, sleep ${health.sleepScore}). Cleared for a normal training day.`;
        break;
      }
      case "ship-report": {
        const work = await getWork();
        steps.push({ label: automation.steps[0], status: "done", detail: `${work.deploymentsWeek} this week` });
        steps.push({ label: automation.steps[1], status: "done", detail: `${Math.round(work.readyRate * 100)}% ready` });
        steps.push({ label: automation.steps[2], status: "done" });
        summary = `This week: ${work.deploymentsWeek} deployments across ${work.projects} projects, ${Math.round(work.readyRate * 100)}% reached READY. ${work.deploymentsToday} shipped today.`;
        break;
      }
      default:
        for (const s of automation.steps) steps.push({ label: s, status: "done" });
        summary = "Completed.";
    }

    return NextResponse.json({ id: automation.id, steps, summary, ranAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      { id: automation.id, steps, summary: `Failed: ${(err as Error).message}`, error: true },
      { status: 500 }
    );
  }
}
