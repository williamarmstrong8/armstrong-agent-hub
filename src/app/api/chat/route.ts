import { streamText, convertToModelMessages, tool, stepCountIs, type UIMessage } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { z } from "zod";
import { getApartments } from "@/lib/adapters/streeteasy";
import { getHealth } from "@/lib/adapters/garmin";
import { getWork } from "@/lib/adapters/vercel";
import { AUTOMATIONS } from "@/lib/adapters/automations";
import { GEO_RULES, OWNER } from "@/lib/config";

export const maxDuration = 30;

const MODEL = process.env.LIFEHUB_MODEL ?? "openai/gpt-4o-mini";

const SYSTEM = `You are the assistant inside "life-hub", ${OWNER.name}'s personal operating system.
You have live tools spanning every part of ${OWNER.name}'s life: apartment search, health (Garmin),
work (Vercel), and automations. Use them proactively to answer with real data instead of guessing.

Context you should know:
- ${OWNER.name} works at ${OWNER.role}, based in ${OWNER.city}.
- Active apartment searches: 2BR under $5,000 and 3BR under $7,500, both East Village.
- Hard geo rules on every listing: ${GEO_RULES.notes.join("; ")}.

Style: concise, warm, and specific. Always cite concrete numbers from tool results (prices, addresses, steps, deploy counts).
When you connect data across modules (e.g. recovery vs. deploy load), call that out — that is the whole point of this hub.

Formatting: your answers render as rich markdown, so structure them for scanning.
- Use "## Section" headers to group distinct topics (e.g. "## 2-Bed Listings", "## Summary").
- Use "### Sub-label" for small labels inside a section.
- Use bullet lists ("- ") for sets of items, and numbered lists for ranked results.
- Bold ("**key**") the important label/number in each bullet.
- Turn URLs into markdown links: [162 E 9th St](https://…) — never paste raw or malformed link syntax.
- Use a markdown table when comparing 3+ items across the same fields (e.g. address | price | beds | fee).
- Use a "> " blockquote for a single headline takeaway or recommendation.
- Keep it tight: no filler, lead with the answer, then the supporting detail.`;

const tools = {
  searchApartments: tool({
    description:
      "Search current East Village rental listings across both saved searches, with the user's geo rules applied (not east of Ave B, not on Houston St). Returns qualifying and excluded counts plus top matches.",
    inputSchema: z.object({}),
    execute: async () => {
      const { live, results } = await getApartments();
      return {
        live,
        searches: results.map((r) => ({
          label: r.label,
          qualifying: r.kept,
          excluded: r.filtered,
          topMatches: r.listings
            .filter((l) => l.passesGeo)
            .slice(0, 5)
            .map((l) => ({
              address: l.address,
              price: l.price,
              bedrooms: l.bedrooms,
              bathrooms: l.bathrooms,
              noFee: l.noFee,
              url: l.url,
            })),
          excludedExamples: r.listings
            .filter((l) => !l.passesGeo)
            .slice(0, 3)
            .map((l) => ({ address: l.address, price: l.price, reasons: l.geoReasons })),
        })),
      };
    },
  }),
  getHealthSummary: tool({
    description:
      "Get today's health snapshot from Garmin: steps, sleep, resting heart rate, body battery, stress, VO2 max, and recent activities.",
    inputSchema: z.object({}),
    execute: async () => {
      const h = await getHealth();
      return {
        live: h.live,
        steps: h.steps,
        stepsGoal: h.stepsGoal,
        sleepHours: h.sleepHours,
        sleepScore: h.sleepScore,
        restingHeartRate: h.restingHeartRate,
        bodyBattery: h.bodyBattery,
        stress: h.stress,
        vo2Max: h.vo2Max,
        recentActivities: h.activities.map((a) => ({
          name: a.name,
          type: a.type,
          distanceKm: a.distanceKm,
          durationMin: a.durationMin,
        })),
      };
    },
  }),
  getWorkSummary: tool({
    description:
      "Get the user's Vercel work snapshot: deployments today/this week, ready-rate, project count, and recent deployments.",
    inputSchema: z.object({}),
    execute: async () => {
      const w = await getWork();
      return {
        live: w.live,
        deploymentsToday: w.deploymentsToday,
        deploymentsWeek: w.deploymentsWeek,
        readyRate: w.readyRate,
        projects: w.projects,
        recent: w.recentDeployments.map((d) => ({
          project: d.project,
          state: d.state,
          target: d.target,
          branch: d.branch,
        })),
      };
    },
  }),
  listAutomations: tool({
    description: "List the available cross-life automations the user can run.",
    inputSchema: z.object({}),
    execute: async () =>
      AUTOMATIONS.map((a) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        trigger: a.trigger,
        connects: a.connects,
      })),
  }),
};

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: gateway(MODEL),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      console.error("[chat] error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      if (/api key|unauthorized|oidc|credit|gateway/i.test(msg)) {
        return "The assistant isn't connected yet. Add an `AI_GATEWAY_API_KEY` to `.env.local` (or deploy on Vercel to use OIDC) to enable the agent. Everything else in the hub works without it.";
      }
      return `Something went wrong: ${msg}`;
    },
  });
}
