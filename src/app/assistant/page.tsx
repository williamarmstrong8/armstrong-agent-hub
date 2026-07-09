import { PageHeader } from "@/components/ui/page-header";
import { Assistant } from "@/components/assistant/assistant";

export default function AssistantPage() {
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col">
      <PageHeader
        icon="Sparkles"
        accent="#7c3aed"
        title="Assistant"
        subtitle="One agent with live tools across every part of your life."
        live
        source="AI Gateway"
      />
      <Assistant />
    </div>
  );
}
