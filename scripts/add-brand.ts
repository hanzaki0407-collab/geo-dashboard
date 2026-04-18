/**
 * Add a company and brand to the database.
 * Usage: npx tsx scripts/add-brand.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error("Missing Supabase env vars");

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // ── Company ──
  const companyName = "FTG Company";
  const { data: company, error: compErr } = await supabase
    .from("companies")
    .upsert({ name: companyName, note: "FTG Company" }, { onConflict: "name" })
    .select("id")
    .single();

  if (compErr) {
    // name column might not have unique constraint, try insert
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("name", companyName)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`Company exists: ${companyName} (${existing[0].id})`);
      await addBrand(supabase, existing[0].id);
      return;
    }

    const { data: newComp, error: insertErr } = await supabase
      .from("companies")
      .insert({ name: companyName, note: "FTG Company" })
      .select("id")
      .single();
    if (insertErr) throw insertErr;
    console.log(`Created company: ${companyName} (${newComp.id})`);
    await addBrand(supabase, newComp.id);
    return;
  }

  console.log(`Company: ${companyName} (${company.id})`);
  await addBrand(supabase, company.id);
}

async function addBrand(supabase: ReturnType<typeof createClient>, companyId: string) {
  const brandName = "\u548C\u725B\u3059\u304D\u713C\u304D \u305D\u3057\u3058 \u4E2D\u76EE\u9ED2\u5E97";
  const keywords = ["\u4E2D\u76EE\u9ED2 \u3059\u304D\u713C\u304D"];

  // Check if brand exists
  const { data: existing } = await supabase
    .from("brands")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", brandName)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`Brand already exists: ${brandName} (${existing[0].id})`);
    return;
  }

  const { data: brand, error: brandErr } = await supabase
    .from("brands")
    .insert({
      company_id: companyId,
      name: brandName,
      keywords,
      active: true,
    })
    .select("id")
    .single();

  if (brandErr) throw brandErr;
  console.log(`Created brand: ${brandName} (${brand.id})`);
  console.log(`  Keywords: ${keywords.join(", ")}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
