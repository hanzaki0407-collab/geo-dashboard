/**
 * Apply a SQL migration to the remote Supabase database.
 * Usage: npx tsx scripts/apply-migration.ts supabase/migrations/20260417000000_add_locales.sql
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

config({ path: ".env.local" });

async function main() {
  const sqlPath = process.argv[2];
  if (!sqlPath) {
    console.error("Usage: npx tsx scripts/apply-migration.ts <path-to-sql>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const sql = readFileSync(sqlPath, "utf-8");
  console.log(`Applying migration: ${sqlPath}`);
  console.log(`SQL length: ${sql.length} chars\n`);

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.rpc("exec_sql", { query: sql });

  if (error) {
    // If exec_sql RPC doesn't exist, try via the REST SQL endpoint
    console.log("RPC exec_sql not available, trying REST endpoint...");

    const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      // Last resort: use the SQL endpoint directly
      console.log("REST RPC not available, trying SQL endpoint...");

      const sqlRes = await fetch(`${url}/pg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!sqlRes.ok) {
        console.error("All methods failed. Please apply the migration manually:");
        console.error("1. Go to your Supabase dashboard → SQL Editor");
        console.error(`2. Paste the contents of ${sqlPath}`);
        console.error("3. Click Run");
        process.exit(1);
      }
      console.log("✅ Migration applied via SQL endpoint");
      return;
    }
    console.log("✅ Migration applied via REST RPC");
    return;
  }

  console.log("✅ Migration applied successfully");
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
