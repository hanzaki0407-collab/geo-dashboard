/**
 * GEO Dashboard - Weekly Collection Script
 *
 * Queries LLMs in multiple languages to check brand mentions.
 * Currently supports: Gemini (via API)
 * Future: ChatGPT, Claude, Google AI Mode
 *
 * Usage:
 *   npx tsx scripts/collect.ts                # all active locales
 *   npx tsx scripts/collect.ts --locale=zh-TW  # single locale
 *   npx tsx scripts/collect.ts --dry-run       # preview queries without executing
 */
import { config } from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

config({ path: ".env.local" });

// ── Types ────────────────────────────────────────────

interface Brand {
  id: string;
  company_id: string;
  name: string;
  keywords: string[];
  active: boolean;
}

interface Locale {
  code: string;
  country_code: string;
  country_name: string;
  country_name_ja: string;
  active: boolean;
}

interface CollectionResult {
  brand_id: string;
  keyword: string;
  llm_provider: string;
  locale: string;
  mentioned: boolean;
  rank: number | null;
  snippet: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  raw_response: string;
}

// ── Prompt templates per locale ──────────────────────

const PROMPT_TEMPLATES: Record<string, (keyword: string) => string> = {
  ja: (kw) =>
    `「${kw}」について、おすすめの店舗やサービスを5つ紹介してください。それぞれの特徴や評判も含めてください。`,
  "zh-TW": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Taiwan. Include features and reputation for each. Respond in Traditional Chinese.`,
  ko: (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from South Korea. Include features and reputation for each. Respond in Korean.`,
  en: (kw) =>
    `Please recommend 5 stores or services related to "${kw}". Include features and reputation for each.`,
  th: (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Thailand. Include features and reputation for each. Respond in Thai.`,
  "en-AU": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Australia. Include features and reputation for each.`,
  "en-SG": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Singapore. Include features and reputation for each.`,
  "en-GB": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from the United Kingdom. Include features and reputation for each.`,
  "zh-HK": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Hong Kong. Include features and reputation for each. Respond in Traditional Chinese.`,
};

function getPrompt(locale: string, keyword: string): string {
  const tmpl = PROMPT_TEMPLATES[locale] ?? PROMPT_TEMPLATES["en"];
  return tmpl(keyword);
}

// ── Analysis prompt (always in English for consistency) ──

function getAnalysisPrompt(brandName: string, rawResponse: string): string {
  return `Analyze the following LLM response and determine if the brand "${brandName}" is mentioned.

Response to analyze:
---
${rawResponse}
---

Reply in EXACTLY this JSON format (no markdown, no extra text):
{
  "mentioned": true or false,
  "rank": number or null (position in the list if mentioned, 1-based),
  "snippet": "the sentence mentioning the brand" or null,
  "sentiment": "positive" or "neutral" or "negative" or null
}`;
}

// ── Gemini provider ──────────────────────────────────

async function queryGemini(
  genAI: GoogleGenerativeAI,
  prompt: string,
  retries = 3,
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") && attempt < retries) {
        const wait = attempt * 15000; // 15s, 30s, 45s
        console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s (attempt ${attempt}/${retries})...`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

async function analyzeWithGemini(
  genAI: GoogleGenerativeAI,
  brandName: string,
  rawResponse: string,
): Promise<{ mentioned: boolean; rank: number | null; snippet: string | null; sentiment: "positive" | "neutral" | "negative" | null }> {
  const text = (await queryGemini(genAI, getAnalysisPrompt(brandName, rawResponse))).trim();

  // Extract JSON from response (handle markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`  ⚠ Could not parse analysis for "${brandName}", assuming not mentioned`);
    return { mentioned: false, rank: null, snippet: null, sentiment: null };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      mentioned: Boolean(parsed.mentioned),
      rank: parsed.rank ?? null,
      snippet: parsed.snippet ?? null,
      sentiment: parsed.sentiment ?? null,
    };
  } catch {
    console.warn(`  ⚠ JSON parse error for "${brandName}", assuming not mentioned`);
    return { mentioned: false, rank: null, snippet: null, sentiment: null };
  }
}

// ── Main ─────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const localeArg = args.find((a) => a.startsWith("--locale="))?.split("=")[1];

  // Init clients
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const geminiKey = process.env.GEMINI_API_KEY!;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase env vars");
  }
  if (!geminiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
  const genAI = new GoogleGenerativeAI(geminiKey);

  // Fetch brands
  const { data: brands, error: brandsErr } = await supabase
    .from("brands")
    .select("*")
    .eq("active", true);
  if (brandsErr) throw brandsErr;

  // Fetch locales
  let localeQuery = supabase.from("locales").select("*").eq("active", true);
  if (localeArg) {
    localeQuery = localeQuery.eq("code", localeArg);
  }
  const { data: locales, error: localesErr } = await localeQuery;
  if (localesErr) throw localesErr;

  console.log("=== GEO Dashboard Collection ===");
  console.log(`Brands: ${(brands as Brand[]).length}`);
  console.log(`Locales: ${(locales as Locale[]).map((l) => l.code).join(", ")}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);

  // Calculate total queries
  const totalKeywords = (brands as Brand[]).reduce((sum, b) => sum + b.keywords.length, 0);
  const totalQueries = totalKeywords * (locales as Locale[]).length;
  // Currently only Gemini, multiply by 1 provider
  console.log(`Total queries: ${totalQueries} (${totalKeywords} keywords × ${(locales as Locale[]).length} locales × 1 provider)\n`);

  if (dryRun) {
    console.log("--- Dry Run Preview ---");
    for (const brand of brands as Brand[]) {
      for (const kw of brand.keywords) {
        for (const locale of locales as Locale[]) {
          const prompt = getPrompt(locale.code, kw);
          console.log(`[${locale.code}] ${brand.name} / "${kw}" → Gemini`);
          console.log(`  Prompt: ${prompt.slice(0, 80)}...`);
        }
      }
    }
    console.log("\n✅ Dry run complete. Remove --dry-run to execute.");
    return;
  }

  // Create or get weekly run
  const weekStart = getMonday(new Date()).toISOString().slice(0, 10);
  let runId: string;

  const { data: existingRun } = await supabase
    .from("weekly_runs")
    .select("id")
    .eq("week_start", weekStart)
    .limit(1);

  if (existingRun && existingRun.length > 0) {
    runId = existingRun[0].id;
    console.log(`Using existing run: ${runId} (week: ${weekStart})`);
  } else {
    const { data: newRun, error: runErr } = await supabase
      .from("weekly_runs")
      .insert({ week_start: weekStart, status: "running", started_at: new Date().toISOString() })
      .select("id")
      .single();
    if (runErr) throw runErr;
    runId = newRun.id;
    console.log(`Created new run: ${runId} (week: ${weekStart})`);
  }

  // Collect
  const results: CollectionResult[] = [];
  let completed = 0;
  const total = totalQueries;

  for (const brand of brands as Brand[]) {
    for (const kw of brand.keywords) {
      for (const locale of locales as Locale[]) {
        completed++;
        const progress = `[${completed}/${total}]`;

        console.log(`${progress} ${brand.name} / "${kw}" / ${locale.code} → Gemini`);

        try {
          // Step 1: Query LLM
          const prompt = getPrompt(locale.code, kw);
          const rawResponse = await queryGemini(genAI, prompt);

          // Step 2: Analyze response for brand mention
          const analysis = await analyzeWithGemini(genAI, brand.name, rawResponse);

          const result: CollectionResult = {
            brand_id: brand.id,
            keyword: kw,
            llm_provider: "gemini",
            locale: locale.code,
            mentioned: analysis.mentioned,
            rank: analysis.rank,
            snippet: analysis.snippet,
            sentiment: analysis.sentiment,
            raw_response: rawResponse,
          };

          results.push(result);

          const status = analysis.mentioned
            ? `✅ mentioned (rank: ${analysis.rank}, sentiment: ${analysis.sentiment})`
            : "❌ not mentioned";
          console.log(`  ${status}`);

          // Rate limiting: 12s between requests (Gemini free tier = ~10 RPM with analysis)
          await sleep(12000);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`  ⚠ Error: ${msg.slice(0, 150)}`);
          results.push({
            brand_id: brand.id,
            keyword: kw,
            llm_provider: "gemini",
            locale: locale.code,
            mentioned: false,
            rank: null,
            snippet: null,
            sentiment: null,
            raw_response: `ERROR: ${msg}`,
          });
        }
      }
    }
  }

  // Upsert results
  console.log(`\nSaving ${results.length} results to Supabase...`);

  for (const r of results) {
    const { error: upsertErr } = await supabase.from("llm_results").upsert(
      {
        run_id: runId,
        brand_id: r.brand_id,
        keyword: r.keyword,
        llm_provider: r.llm_provider,
        locale: r.locale,
        mentioned: r.mentioned,
        rank: r.rank,
        snippet: r.snippet,
        sentiment: r.sentiment,
        raw_response: r.raw_response,
        collected_at: new Date().toISOString(),
      },
      { onConflict: "run_id,brand_id,keyword,llm_provider,locale" },
    );
    if (upsertErr) {
      console.error(`  ⚠ Upsert error for ${r.brand_id}/${r.keyword}/${r.locale}: ${upsertErr.message}`);
    }
  }

  // Mark run as completed
  await supabase
    .from("weekly_runs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", runId);

  const mentioned = results.filter((r) => r.mentioned).length;
  console.log(`\n=== Complete ===`);
  console.log(`Results: ${results.length} total, ${mentioned} mentioned`);
  console.log(`Run ID: ${runId}`);
}

// ── Helpers ──────────────────────────────────────────

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
