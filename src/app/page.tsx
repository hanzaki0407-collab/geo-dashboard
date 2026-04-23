import {
  fetchBrands,
  fetchCitations,
  fetchLatestResults,
  fetchLatestRun,
  fetchMentionRates,
  fetchTopDomains,
  fetchMentionsByCountry,
} from "@/lib/data";
import { Topbar } from "@/components/dashboard/topbar";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

// Static generation with long TTL. Data freshness is driven by on-demand
// revalidation (POST /api/revalidate) triggered by the monthly collector,
// not by TTL expiry — the 30-day revalidate is only a safety fallback.
// Keeps CWV (LCP/TTFB) high by serving prebuilt HTML from the edge cache.
export const revalidate = 2592000;

export default async function Home() {
  const [
    brands,
    latestRun,
    results,
    rates,
    domains,
    citations,
    countryMentions,
  ] = await Promise.all([
    fetchBrands(),
    fetchLatestRun(),
    fetchLatestResults(),
    fetchMentionRates(),
    fetchTopDomains(10),
    fetchCitations(),
    fetchMentionsByCountry(),
  ]);

  return (
    <>
      <Topbar lastWeekStart={latestRun?.week_start ?? null} />
      <main className="flex-1 overflow-y-auto p-5">
        <DashboardContent
          brands={brands}
          results={results}
          rates={rates}
          domains={domains}
          citations={citations}
          countryMentions={countryMentions}
        />
      </main>
    </>
  );
}
