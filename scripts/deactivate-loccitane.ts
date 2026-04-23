/**
 * L'OCCITANEを一時停止し、そしじのみactiveにする
 * Usage: npx tsx scripts/deactivate-loccitane.ts
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: before } = await supabase
    .from("brands")
    .select("id, name, active");
  console.log("=== Before ===");
  console.table(before);

  const { error } = await supabase
    .from("brands")
    .update({ active: false })
    .ilike("name", "%L'OCCITANE%");
  if (error) throw error;

  const { data: after } = await supabase
    .from("brands")
    .select("id, name, active");
  console.log("\n=== After ===");
  console.table(after);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
