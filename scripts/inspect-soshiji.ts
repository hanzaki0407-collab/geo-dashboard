/**
 * そしじ中目黒店の現状確認スクリプト
 * Usage: npx tsx scripts/inspect-soshiji.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const brandName = "\u548C\u725B\u3059\u304D\u713C\u304D \u305D\u3057\u3058 \u4E2D\u76EE\u9ED2\u5E97";

  // ── Brand ──
  const { data: brands } = await supabase
    .from("brands")
    .select("*, companies(name)")
    .ilike("name", "%そしじ%");

  console.log("=== Brand ===");
  console.log(JSON.stringify(brands, null, 2));

  if (!brands || brands.length === 0) {
    console.log("\n⚠ そしじブランドが未登録。add-brand.ts を実行してください。");
    return;
  }

  const brandId = brands[0].id;

  // ── Results count per provider/locale ──
  const { data: results, count } = await supabase
    .from("llm_results")
    .select("llm_provider, locale, mentioned, rank, sentiment, collected_at", { count: "exact" })
    .eq("brand_id", brandId)
    .order("collected_at", { ascending: false });

  console.log(`\n=== Results (${count ?? 0} rows) ===`);
  if (results && results.length > 0) {
    const summary: Record<string, { total: number; mentioned: number }> = {};
    for (const r of results) {
      const key = `${r.llm_provider}/${r.locale}`;
      summary[key] ??= { total: 0, mentioned: 0 };
      summary[key].total++;
      if (r.mentioned) summary[key].mentioned++;
    }
    console.table(summary);
    console.log("\nLatest 5 rows:");
    console.table(results.slice(0, 5));
  } else {
    console.log("(まだ結果なし)");
  }

  // ── Locales ──
  const { data: locales } = await supabase
    .from("locales")
    .select("code, country_name_ja, active")
    .eq("active", true)
    .order("code");

  console.log("\n=== Active Locales ===");
  console.table(locales);

  // ── Other active brands (to see if we need to deactivate them) ──
  const { data: otherBrands } = await supabase
    .from("brands")
    .select("id, name, active")
    .eq("active", true);

  console.log("\n=== All Active Brands ===");
  console.table(otherBrands);

  // Suppress unused warning
  void brandName;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
