import { getWork } from "@/lib/adapters/vercel";
import { PageHeader } from "@/components/ui/page-header";
import { WorkView } from "@/components/work/work-view";

export const dynamic = "force-dynamic";

export default async function WorkPage() {
  const work = await getWork();

  return (
    <div>
      <PageHeader
        icon="Triangle"
        accent="#111318"
        title="Work"
        subtitle="Deployments, projects & shipping velocity at Vercel."
        live={work.live}
        source="Vercel"
      />
      <WorkView work={work} />
    </div>
  );
}
