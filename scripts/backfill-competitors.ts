/**
 * Backfill the `competitors` column for existing llm_results rows.
 *
 * Reads each row's raw_response, asks Haiku 4.5 to extract the ranked list of
 * establishments the LLM recommended, and writes the JSON back to Supabase.
 *
 * Idempotent: skips rows whose competitors column is already populated.
 *
 * Usage:
 *   npx tsx scripts/backfill-competitors.ts               # all rows
 *   npx tsx scripts/backfill-competitors.ts --run=<uuid>  # single run
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

config({ path: ".env.local" });

const ANALYZE_MODEL = "claude-haiku-4-5-20251001";

interface Competitor {
  name: string;
  rank: number;
  description?: string | null;
}

function normalize(raw: unknown): Competitor[] {
  if (!Array.isArray(raw)) return [];
  const out: Competitor[] = [];
  for (const item of raw.slice(0, 5)) {
    if (!item || typeof item !== "object") continue;
    const name = typeof (item as { name?: unknown }).name === "string" ? (item as { name: string }).name.trim() : "";
    if (!name) continue;
    const rank = Number((item as { rank?: unknown }).rank);
    const description = typeof (item as { description?: unknown }).description === "string"
      ? ((item as { description: string }).description.trim() || null)
      : null;
    out.push({ name, rank: Number.isFinite(rank) && rank > 0 ? rank : out.length + 1, description });
  }
  return out;
}

function buildPrompt(brandName: string, rawResponse: string): string {
  return `Extract every establishment the LLM recommended in the response below, in ranked order (up to 5).

Brand being audited: "${brandName}"

Response:
---
${rawResponse}
---

Reply in EXACTLY this JSON format (no markdown, no extra text):
{
  "competitors": [
    { "name": "Establishment name as written", "rank": 1, "description": "short 1-sentence summary" }
  ]
}

Notes:
- Include "${brandName}" itself in the list if it appears.
- "rank" is 1-based.
- If the response refused or said "no reliable info", return "competitors": [].
- Keep "description" under 80 characters; use an empty string if not available.`;
}

async function extract(client: Anthropic, brandName: string, raw: string): Promise<Competitor[]> {
  const msg = await client.messages.create({
    model: ANALYZE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: buildPrompt(brandName, raw) }],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return normalize(parsed.competitors);
  } catch {
    return [];
  }
}

(async () => {
  const runArg = process.argv.find((a) => a.startsWith("--run="))?.split("=")[1];

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  let query = supabase
    .from("llm_results")
    .select("id, run_id, brand_id, keyword, llm_provider, raw_response, competitors")
    .is("competitors", null)
    .not("raw_response", "like", "ERROR:%");
  if (runArg) query = query.eq("run_id", runArg);

  const { data: rows, error } = await query;
  if (error) throw error;

  console.log(`Found ${rows?.length ?? 0} rows needing backfill.`);
  if (!rows || rows.length === 0) return;

  // Need brand names
  const brandIds = [...new Set(rows.map((r) => r.brand_id))];
  const { data: brands } = await supabase.from("brands").select("id, name").in("id", brandIds);
  const brandById = new Map((brands ?? []).map((b) => [b.id, b.name]));

  let done = 0;
  let failed = 0;
  for (const row of rows) {
    const brandName = brandById.get(row.brand_id) ?? "UNKNOWN";
    const raw = row.raw_response ?? "";
    if (raw.length < 20) {
      console.log(`  skip ${row.id.slice(0, 8)} (empty raw)`);
      continue;
    }
    try {
      const competitors = await extract(anthropic, brandName, raw);
      const { error: updErr } = await supabase
        .from("llm_results")
        .update({ competitors })
        .eq("id", row.id);
      if (updErr) throw updErr;
      console.log(
        `  [${row.llm_provider}] ${brandName} / ${row.keyword} -> ${competitors.length} competitors`,
      );
      done++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      failed++;
      console.error(`  FAIL ${row.id.slice(0, 8)}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. Updated ${done}, failed ${failed}.`);
})();
