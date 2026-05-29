import {
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
// Filter state is fully client-side (FilterContext), so static rendering is safe.
export const revalidate = 2592000;

export default async function Home() {
  const [latestRun, results, rates, domains, citations, countryMentions] =
    await Promise.all([
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
      <main className="flex-1 overflow-y-auto scroll-smooth p-5">
        <DashboardContent
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
