import { AUTOMATIONS } from "@/lib/adapters/automations";
import { PageHeader } from "@/components/ui/page-header";
import { AutomationsView } from "@/components/automations/automations-view";

export default function AutomationsPage() {
  return (
    <div>
      <PageHeader
        icon="Workflow"
        accent="#17a673"
        title="Automations"
        subtitle="Cross-life workflows you can run on demand."
        live
        source="Vercel Workflows"
      />
      <AutomationsView automations={AUTOMATIONS} />
    </div>
  );
}
