import {
  fetchBrands,
  fetchLatestResults,
  fetchLatestRun,
  fetchMentionRates,
  fetchTopDomains,
  fetchMentionsByCountry,
  computeKpis,
} from "@/lib/data";
import { Topbar } from "@/components/dashboard/topbar";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { HeatmapMatrix, HeatmapLegend } from "@/components/dashboard/heatmap-matrix";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { CitationsTable } from "@/components/dashboard/citations-table";
import { SnippetsList } from "@/components/dashboard/snippets-list";
import { WorldHeatmap } from "@/components/dashboard/world-heatmap";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [brands, latestRun, results, rates, domains, countryMentions] = await Promise.all([
    fetchBrands(),
    fetchLatestRun(),
    fetchLatestResults(),
    fetchMentionRates(),
    fetchTopDomains(10),
    fetchMentionsByCountry(),
  ]);

  const kpis = computeKpis(results);

  return (
    <>
      <Topbar lastWeekStart={latestRun?.week_start ?? null} />
      <main className="flex-1 overflow-y-auto p-5">
        <div className="flex flex-col gap-5">
          <KpiCards kpis={kpis} brandCount={brands.length} />

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HeatmapMatrix results={results} />
            </div>
            <div>
              <CitationsTable domains={domains} />
            </div>
          </div>

          <HeatmapLegend />

          <WorldHeatmap data={countryMentions} />

          <TrendChart rates={rates} />

          <SnippetsList results={results} />

          <footer className="pt-2 pb-4 text-center text-[11px] text-muted-foreground/60">
            GEO Dashboard · Powered by Next.js + Supabase · FTG Company
          </footer>
        </div>
      </main>
    </>
  );
}
