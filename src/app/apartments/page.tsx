import { loadApartments } from "@/lib/db/read";
import { PageHeader } from "@/components/ui/page-header";
import { ApartmentsView } from "@/components/apartments/apartments-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ApartmentsPage() {
  const { live, results } = await loadApartments();

  return (
    <div>
      <PageHeader
        icon="Building2"
        accent="#0a7cff"
        title="Home Search"
        subtitle="East Village & Lower East Side rentals, filtered to your exact rules."
        live={live}
        source="StreetEasy"
      />
      <ApartmentsView results={results} />
    </div>
  );
}
