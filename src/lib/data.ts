import { unstable_cache } from "next/cache";
import { getSupabaseClient } from "./supabase";
import type { LLMProvider, Sentiment } from "./types";

// Cache TTL: 30 days. Freshness is driven by on-demand revalidation
// (POST /api/revalidate) called from collect.ts after each monthly run.
// The TTL is a safety fallback, not the primary freshness mechanism.
const CACHE_TTL_SECONDS = 2592000;
const CACHE_TAG = "dashboard";

export const PROVIDERS: LLMProvider[] = ["gemini", "google_ai_mode", "chatgpt", "claude"];

export const PROVIDER_LABELS: Record<LLMProvider, string> = {
  gemini: "Gemini",
  google_ai_mode: "Google AIモード",
  chatgpt: "ChatGPT",
  claude: "Claude",
};

export const PROVIDER_COLORS: Record<LLMProvider, string> = {
  gemini: "#4285F4",
  google_ai_mode: "#EA4335",
  chatgpt: "#10A37F",
  claude: "#D97757",
};

export interface CompanyRow {
  id: string;
  name: string;
  note: string | null;
}

export interface BrandRow {
  id: string;
  company_id: string;
  name: string;
  keywords: string[];
  active: boolean;
}

export interface WeeklyRunRow {
  id: string;
  week_start: string;
  status: string;
  completed_at: string | null;
}

export interface Competitor {
  name: string;
  rank: number;
  description?: string | null;
}

export interface LatestResultRow {
  id: string;
  run_id: string;
  week_start: string;
  brand_id: string;
  brand_name: string;
  company_id: string;
  company_name: string;
  keyword: string;
  llm_provider: LLMProvider;
  locale: string;
  mentioned: boolean;
  rank: number | null;
  snippet: string | null;
  sentiment: Sentiment | null;
  competitors: Competitor[] | null;
  collected_at: string;
}

export interface MentionRateRow {
  brand_id: string;
  brand_name: string;
  company_name: string;
  llm_provider: LLMProvider;
  locale: string;
  week_start: string;
  mentioned_count: number;
  total_count: number;
  mention_rate: number;
}

export interface TopDomainRow {
  domain: string;
  citation_count: number;
  distinct_brands: number;
  providers: string[];
}

export interface CitationRow {
  url: string;
  title: string | null;
  domain: string;
  position: number | null;
  brand_id: string;
  llm_provider: LLMProvider;
}

export interface MentionsByCountryRow {
  locale: string;
  country_code: string;
  country_name: string;
  country_name_ja: string;
  flag: string;
  map_center_x: number;
  map_center_y: number;
  map_radius: number;
  total_queries: number;
  mentioned_count: number;
  mention_rate: number;
  distinct_brands: number;
}

export const fetchCompanies = unstable_cache(
  async () => {
    const supabase = getSupabaseClient();
    const { data: activeBrands } = await supabase
      .from("brands")
      .select("company_id")
      .eq("active", true);
    const companyIds = Array.from(
      new Set((activeBrands ?? []).map((b) => b.company_id)),
    );
    if (companyIds.length === 0) return [];
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .in("id", companyIds)
      .order("name");
    if (error) throw error;
    return (data ?? []) as CompanyRow[];
  },
  ["companies-active-v2"],
  { tags: [CACHE_TAG, "companies"], revalidate: CACHE_TTL_SECONDS },
);

export const fetchBrands = unstable_cache(
  async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return (data ?? []) as BrandRow[];
  },
  ["brands-active-v2"],
  { tags: [CACHE_TAG, "brands"], revalidate: CACHE_TTL_SECONDS },
);

export const fetchLatestRun = unstable_cache(
  async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("weekly_runs")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(1);
    if (error) throw error;
    return (data?.[0] ?? null) as WeeklyRunRow | null;
  },
  ["latest-run"],
  { tags: [CACHE_TAG, "runs"], revalidate: CACHE_TTL_SECONDS },
);

export const fetchLatestResults = unstable_cache(
  async (locale = "ja") => {
    const supabase = getSupabaseClient();
    const { data: activeBrands } = await supabase
      .from("brands")
      .select("id")
      .eq("active", true);
    const activeIds = (activeBrands ?? []).map((b) => b.id);
    if (activeIds.length === 0) return [];
    const { data, error } = await supabase
      .from("v_latest_results")
      .select("*")
      .eq("locale", locale)
      .in("brand_id", activeIds);
    if (error) throw error;
    return (data ?? []) as LatestResultRow[];
  },
  ["latest-results-active-v3"],
  { tags: [CACHE_TAG, "results"], revalidate: CACHE_TTL_SECONDS },
);

export const fetchMentionRates = unstable_cache(
  async (locale = "ja") => {
    const supabase = getSupabaseClient();
    const { data: activeBrands } = await supabase
      .from("brands")
      .select("id")
      .eq("active", true);
    const activeIds = (activeBrands ?? []).map((b) => b.id);
    if (activeIds.length === 0) return [];
    const { data, error } = await supabase
      .from("v_mention_rate_by_provider")
      .select("*")
      .eq("locale", locale)
      .in("brand_id", activeIds);
    if (error) throw error;
    return (data ?? []) as MentionRateRow[];
  },
  ["mention-rates-active-v2"],
  { tags: [CACHE_TAG, "rates"], revalidate: CACHE_TTL_SECONDS },
);

export const fetchTopDomains = unstable_cache(
  async (limit = 10) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("v_top_citation_domains")
      .select("*")
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as TopDomainRow[];
  },
  ["top-domains"],
  { tags: [CACHE_TAG, "domains"], revalidate: CACHE_TTL_SECONDS },
);

export const fetchCitations = unstable_cache(
  async (locale = "ja") => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("v_citations_with_context")
      .select("url, title, domain, position, brand_id, llm_provider")
      .eq("locale", locale);
    if (error) {
      // View may not exist yet (migration pending) — fail soft so the
      // dashboard still renders. PGRST205 = table/view not in PostgREST
      // schema cache; also match textual variants.
      const missing =
        error.code === "PGRST205" ||
        /does not exist|not.?found|schema cache/i.test(error.message ?? "");
      if (missing) return [];
      throw error;
    }
    return (data ?? []) as CitationRow[];
  },
  ["citations-with-context"],
  { tags: [CACHE_TAG, "citations"], revalidate: CACHE_TTL_SECONDS },
);

export const fetchMentionsByCountry = unstable_cache(
  async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("v_mentions_by_country")
      .select("*")
      .neq("locale", "ja");
    if (error) throw error;
    return (data ?? []) as MentionsByCountryRow[];
  },
  ["mentions-by-country"],
  { tags: [CACHE_TAG, "country"], revalidate: CACHE_TTL_SECONDS },
);

export function computeKpis(results: LatestResultRow[]) {
  const total = results.length;
  const mentioned = results.filter((r) => r.mentioned).length;
  const mentionRate = total > 0 ? Math.round((mentioned / total) * 1000) / 10 : 0;

  const providerCoverage = new Set(results.filter((r) => r.mentioned).map((r) => r.llm_provider));
  const positive = results.filter((r) => r.sentiment === "positive").length;
  const negative = results.filter((r) => r.sentiment === "negative").length;

  return {
    total,
    mentioned,
    mentionRate,
    providerCoverage: providerCoverage.size,
    positive,
    negative,
  };
}
