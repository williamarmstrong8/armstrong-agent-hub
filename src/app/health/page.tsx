import { loadHealth } from "@/lib/db/read";
import { PageHeader } from "@/components/ui/page-header";
import { HealthView } from "@/components/health/health-view";

export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const { health } = await loadHealth();

  return (
    <div>
      <PageHeader
        icon="HeartPulse"
        accent="#e5484d"
        title="Health"
        subtitle="Sleep, recovery, training load & activities."
        live={health.live}
        updatedAt={health.date}
        source="Garmin"
      />
      <HealthView health={health} />
    </div>
  );
}
