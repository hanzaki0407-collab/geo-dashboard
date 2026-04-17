import { getSupabaseClient } from "./supabase";
import type { LLMProvider, Sentiment } from "./types";

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

export async function fetchCompanies() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("companies").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as CompanyRow[];
}

export async function fetchBrands() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("brands").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as BrandRow[];
}

export async function fetchLatestRun() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("weekly_runs")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(1);
  if (error) throw error;
  return (data?.[0] ?? null) as WeeklyRunRow | null;
}

export async function fetchLatestResults(locale = "ja") {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_latest_results")
    .select("*")
    .eq("locale", locale);
  if (error) throw error;
  return (data ?? []) as LatestResultRow[];
}

export async function fetchMentionRates(locale = "ja") {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_mention_rate_by_provider")
    .select("*")
    .eq("locale", locale);
  if (error) throw error;
  return (data ?? []) as MentionRateRow[];
}

export async function fetchTopDomains(limit = 10) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_top_citation_domains")
    .select("*")
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as TopDomainRow[];
}

export async function fetchMentionsByCountry() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("v_mentions_by_country")
    .select("*")
    .neq("locale", "ja");
  if (error) throw error;
  return (data ?? []) as MentionsByCountryRow[];
}

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
