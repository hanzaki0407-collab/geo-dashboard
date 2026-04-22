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
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

config({ path: ".env.local" });

// Sonnet 4.6 with web_search gives grounded answers matching claude.ai behavior.
// Haiku 4.5 was tested but hallucinated local store names even with strict system prompts.
const CLAUDE_MODEL = "claude-sonnet-4-6";
const CLAUDE_ANALYZE_MODEL = "claude-haiku-4-5-20251001"; // analysis is simple JSON, Haiku suffices

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

// Anti-hallucination guardrail appended to every query prompt.
// Haiku 4.5 without web access tends to fabricate store names; this instruction
// reduces (but does not eliminate) confabulation by asking for real, verifiable
// establishments and explicit refusal when uncertain.
const GUARDRAIL_JA =
  "重要: 実在が確実な有名店舗のみ挙げてください。知らない・情報がない場合は店名を創作せず、「情報がありません」と正直に答えてください。推測や架空の店名は絶対に含めないでください。";
const GUARDRAIL_EN =
  "IMPORTANT: Only recommend real, well-known establishments that you are confident exist. If you do not have reliable information, do NOT invent names — say 'I don't have reliable information' instead. Never fabricate store names.";
const GUARDRAIL_ZH =
  "重要：僅推薦您確信真實存在的知名店家。如果沒有可靠資訊，請勿編造店名，而是直接回答「我沒有可靠的資訊」。絕對不要虛構店名。";
const GUARDRAIL_KO =
  "중요: 실존이 확실한 유명 매장만 추천하세요. 신뢰할 수 있는 정보가 없으면 매장 이름을 지어내지 말고 '신뢰할 수 있는 정보가 없습니다'라고 답하세요. 절대로 가공의 매장 이름을 포함하지 마세요.";
const GUARDRAIL_TH =
  "สำคัญ: แนะนำเฉพาะร้านที่มีอยู่จริงและมีชื่อเสียงเท่านั้น หากไม่มีข้อมูลที่เชื่อถือได้ อย่าสร้างชื่อร้านขึ้นมา ให้ตอบว่า 'ไม่มีข้อมูลที่เชื่อถือได้' แทน ห้ามแต่งชื่อร้านโดยเด็ดขาด";

const PROMPT_TEMPLATES: Record<string, (keyword: string) => string> = {
  ja: (kw) =>
    `「${kw}」について、おすすめの店舗やサービスを5つ紹介してください。それぞれの特徴や評判も含めてください。\n\n${GUARDRAIL_JA}`,
  "zh-TW": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Taiwan. Include features and reputation for each. Respond in Traditional Chinese.\n\n${GUARDRAIL_ZH}`,
  ko: (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from South Korea. Include features and reputation for each. Respond in Korean.\n\n${GUARDRAIL_KO}`,
  en: (kw) =>
    `Please recommend 5 stores or services related to "${kw}". Include features and reputation for each.\n\n${GUARDRAIL_EN}`,
  th: (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Thailand. Include features and reputation for each. Respond in Thai.\n\n${GUARDRAIL_TH}`,
  "en-AU": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Australia. Include features and reputation for each.\n\n${GUARDRAIL_EN}`,
  "en-SG": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Singapore. Include features and reputation for each.\n\n${GUARDRAIL_EN}`,
  "en-GB": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from the United Kingdom. Include features and reputation for each.\n\n${GUARDRAIL_EN}`,
  "zh-HK": (kw) =>
    `Please recommend 5 stores or services related to "${kw}" for someone visiting from Hong Kong. Include features and reputation for each. Respond in Traditional Chinese.\n\n${GUARDRAIL_ZH}`,
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
      const isTransient = msg.includes("429") || msg.includes("503") || msg.includes("overloaded");
      if (isTransient && attempt < retries) {
        const wait = attempt * 15000; // 15s, 30s, 45s
        console.log(`  ⏳ Gemini ${msg.includes("503") ? "overloaded" : "rate limited"}, waiting ${wait / 1000}s (attempt ${attempt}/${retries})...`);
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

// ── Claude provider ──────────────────────────────────

// Strict role system prompt. Placed in `system` (stronger than user-message
// guardrails) to discourage Haiku 4.5 from fabricating local store names when
// it has no reliable knowledge. Tested against user-message guardrails which
// Haiku ignored.
const CLAUDE_SYSTEM_PROMPT = `You recommend real, verifiable local establishments. You have access to a web_search tool.

Guidelines:
1. USE the web_search tool to find current, real establishments for location/keyword queries. Prefer Google Maps, Tabelog, Retty, and official business websites in search results.
2. NEVER fabricate store names. Only list establishments confirmed via search results or reliable training-data knowledge.
3. Quality over quantity: if search surfaces only 3 clearly-real establishments, list 3. Do not pad to reach 5.
4. Include each establishment's actual name, a short description, and notable reputation details you can attribute to your sources.
5. Respond in the language requested by the user.`;

interface ClaudeQueryOptions {
  retries?: number;
  system?: string;
  model?: string;
  tools?: Anthropic.Tool[] | Array<{ type: string; name: string; max_uses?: number }>;
}

async function queryClaude(
  client: Anthropic,
  prompt: string,
  opts: ClaudeQueryOptions = {},
): Promise<string> {
  const retries = opts.retries ?? 3;
  const model = opts.model ?? CLAUDE_MODEL;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const msg = await client.messages.create({
        model,
        max_tokens: 4096,
        ...(opts.system ? { system: opts.system } : {}),
        ...(opts.tools ? { tools: opts.tools as Anthropic.Tool[] } : {}),
        messages: [{ role: "user", content: prompt }],
      });
      // Concatenate all text blocks (web_search returns multiple text blocks interleaved with tool_use/tool_result).
      const textBlocks = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
      if (textBlocks.length === 0) {
        throw new Error("No text block in Claude response");
      }
      return textBlocks.map((b) => b.text).join("\n\n");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimit = msg.includes("429") || msg.toLowerCase().includes("rate");
      const isOverloaded = msg.includes("529") || msg.toLowerCase().includes("overloaded");
      if ((isRateLimit || isOverloaded) && attempt < retries) {
        const wait = attempt * 10000; // 10s, 20s, 30s
        console.log(`  ⏳ Claude throttled, waiting ${wait / 1000}s (attempt ${attempt}/${retries})...`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Max retries exceeded");
}

async function analyzeWithClaude(
  client: Anthropic,
  brandName: string,
  rawResponse: string,
): Promise<{ mentioned: boolean; rank: number | null; snippet: string | null; sentiment: "positive" | "neutral" | "negative" | null }> {
  // Analysis uses cheap Haiku model — no web_search or system prompt needed.
  const text = (
    await queryClaude(client, getAnalysisPrompt(brandName, rawResponse), { model: CLAUDE_ANALYZE_MODEL })
  ).trim();

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`  ⚠ Could not parse Claude analysis for "${brandName}", assuming not mentioned`);
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
    console.warn(`  ⚠ JSON parse error (Claude) for "${brandName}", assuming not mentioned`);
    return { mentioned: false, rank: null, snippet: null, sentiment: null };
  }
}

// ── Provider abstraction ─────────────────────────────

interface ProviderHandle {
  name: "gemini" | "claude";
  query: (prompt: string) => Promise<string>;
  analyze: (
    brandName: string,
    rawResponse: string,
  ) => Promise<{ mentioned: boolean; rank: number | null; snippet: string | null; sentiment: "positive" | "neutral" | "negative" | null }>;
  sleepMs: number;
}

// ── Main ─────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const localeArg = args.find((a) => a.startsWith("--locale="))?.split("=")[1];
  const providersArg =
    args.find((a) => a.startsWith("--providers="))?.split("=")[1] ?? "gemini,claude";
  const selectedProviders = providersArg
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Init clients
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase env vars");
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const providers: ProviderHandle[] = [];
  if (selectedProviders.includes("gemini")) {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) throw new Error("Missing GEMINI_API_KEY (required for --providers=gemini)");
    const genAI = new GoogleGenerativeAI(geminiKey);
    providers.push({
      name: "gemini",
      query: (p) => queryGemini(genAI, p),
      analyze: (b, r) => analyzeWithGemini(genAI, b, r),
      sleepMs: 12000,
    });
  }
  if (selectedProviders.includes("claude")) {
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey)
      throw new Error("Missing ANTHROPIC_API_KEY (required for --providers=claude)");
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    providers.push({
      name: "claude",
      query: (p) =>
        queryClaude(anthropic, p, {
          system: CLAUDE_SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }],
        }),
      analyze: (b, r) => analyzeWithClaude(anthropic, b, r),
      sleepMs: 2000,
    });
  }
  if (providers.length === 0) {
    throw new Error(`No valid providers selected. Got: "${providersArg}". Use gemini,claude`);
  }

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
  console.log(`Providers: ${providers.map((p) => p.name).join(", ")}`);
  console.log(`Mode: ${dryRun ? "DRY RUN" : "LIVE"}`);

  // Calculate total queries
  const totalKeywords = (brands as Brand[]).reduce((sum, b) => sum + b.keywords.length, 0);
  const totalQueries = totalKeywords * (locales as Locale[]).length * providers.length;
  console.log(
    `Total queries: ${totalQueries} (${totalKeywords} keywords × ${(locales as Locale[]).length} locales × ${providers.length} provider${providers.length > 1 ? "s" : ""})\n`,
  );

  if (dryRun) {
    console.log("--- Dry Run Preview ---");
    for (const brand of brands as Brand[]) {
      for (const kw of brand.keywords) {
        for (const locale of locales as Locale[]) {
          const prompt = getPrompt(locale.code, kw);
          for (const provider of providers) {
            console.log(`[${locale.code}] ${brand.name} / "${kw}" → ${provider.name}`);
            console.log(`  Prompt: ${prompt.slice(0, 80)}...`);
          }
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
        for (const provider of providers) {
          completed++;
          const progress = `[${completed}/${total}]`;

          console.log(`${progress} ${brand.name} / "${kw}" / ${locale.code} → ${provider.name}`);

          try {
            const prompt = getPrompt(locale.code, kw);
            const rawResponse = await provider.query(prompt);
            const analysis = await provider.analyze(brand.name, rawResponse);

            results.push({
              brand_id: brand.id,
              keyword: kw,
              llm_provider: provider.name,
              locale: locale.code,
              mentioned: analysis.mentioned,
              rank: analysis.rank,
              snippet: analysis.snippet,
              sentiment: analysis.sentiment,
              raw_response: rawResponse,
            });

            const status = analysis.mentioned
              ? `✅ mentioned (rank: ${analysis.rank}, sentiment: ${analysis.sentiment})`
              : "❌ not mentioned";
            console.log(`  ${status}`);

            await sleep(provider.sleepMs);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`  ⚠ Error (${provider.name}): ${msg.slice(0, 150)}`);
            results.push({
              brand_id: brand.id,
              keyword: kw,
              llm_provider: provider.name,
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
