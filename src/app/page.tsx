import { getWork } from "@/lib/adapters/vercel";
import { loadApartments, loadHealth } from "@/lib/db/read";
import { getNewToday } from "@/lib/db/apartments";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [apts, healthRes, work, newToday] = await Promise.all([
    loadApartments(),
    loadHealth(),
    getWork(),
    getNewToday(),
  ]);
  const health = healthRes.health;

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const qualifying = apts.results.reduce((n, r) => n + r.kept, 0);
  const filtered = apts.results.reduce((n, r) => n + r.filtered, 0);
  const topListing = apts.results
    .flatMap((r) => r.listings)
    .filter((l) => l.passesGeo)
    .sort((a, b) => a.price - b.price)[0] ?? null;

  return (
    <DashboardView
      greeting={greeting}
      today={today}
      newToday={newToday.map((l) => ({
        id: l.id,
        address: l.address,
        unit: l.unit,
        price: l.price,
        bedrooms: l.bedrooms,
        bathrooms: l.bathrooms,
        neighborhood: l.neighborhood,
        imageUrl: l.imageUrl,
        url: l.url,
        passesGeo: l.passesGeo,
      }))}
      summary={{
        apartments: {
          live: apts.live,
          qualifying,
          filtered,
          top: topListing
            ? { address: topListing.address, price: topListing.price, bedrooms: topListing.bedrooms }
            : null,
        },
        health: {
          live: health.live,
          steps: health.steps,
          stepsGoal: health.stepsGoal,
          sleepHours: health.sleepHours,
          sleepScore: health.sleepScore,
          bodyBattery: health.bodyBattery,
          restingHeartRate: health.restingHeartRate,
          trend: health.trend.map((t) => t.steps),
        },
        work: {
          live: work.live,
          deploymentsToday: work.deploymentsToday,
          deploymentsWeek: work.deploymentsWeek,
          readyRate: work.readyRate,
          trend: work.deployTrend.map((d) => d.count),
        },
      }}
    />
  );
}
