import {
  fetchBrands,
  fetchLatestResults,
  fetchLatestRun,
  fetchMentionRates,
  fetchTopDomains,
  computeKpis,
} from "@/lib/data";
import { Topbar } from "@/components/dashboard/topbar";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { HeatmapMatrix, HeatmapLegend } from "@/components/dashboard/heatmap-matrix";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CitationsTable } from "@/components/dashboard/citations-table";
import { SnippetsList } from "@/components/dashboard/snippets-list";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [brands, latestRun, results, rates, domains] = await Promise.all([
    fetchBrands(),
    fetchLatestRun(),
    fetchLatestResults(),
    fetchMentionRates(),
    fetchTopDomains(10),
  ]);

  const kpis = computeKpis(results);

  return (
    <>
      <Topbar lastWeekStart={latestRun?.week_start ?? null} />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-6">
          <KpiCards kpis={kpis} brandCount={brands.length} />

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HeatmapMatrix results={results} />
            </div>
            <div>
              <CitationsTable domains={domains} />
            </div>
          </div>

          <HeatmapLegend />

          <TrendChart rates={rates} />

          <SnippetsList results={results} />

          <footer className="pt-4 text-center text-xs text-muted-foreground">
            GEO Dashboard · Powered by Next.js + Supabase · © FTG Company
          </footer>
        </div>
      </main>
    </>
  );
}
