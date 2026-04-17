/**
 * Connection test script.
 * Usage: npm run test:connections
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

config({ path: ".env.local" });

async function testSupabase() {
  console.log("\n[1/2] Testing Supabase connection...");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase.from("companies").select("*");

  if (error) {
    console.error("  ❌ Supabase error:", error.message);
    return false;
  }

  console.log(`  ✅ Supabase connected. Found ${data.length} companies:`);
  data.forEach((c) => console.log(`     - ${c.name}`));
  return true;
}

async function testGemini() {
  console.log("\n[2/2] Testing Gemini API...");
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

  for (const modelName of modelsToTry) {
    console.log(`  Trying model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    try {
      const result = await model.generateContent("Reply with just: OK");
      const text = result.response.text().trim();
      console.log(`  ✅ Gemini (${modelName}) responded: "${text}"`);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ⚠️  ${modelName} failed: ${msg.slice(0, 150)}`);
    }
  }
  return false;
}

async function main() {
  console.log("=== GEO Dashboard Connection Test ===");

  const supaOk = await testSupabase();
  const geminiOk = await testGemini();

  console.log("\n=== Summary ===");
  console.log(`Supabase: ${supaOk ? "✅ OK" : "❌ FAILED"}`);
  console.log(`Gemini:   ${geminiOk ? "✅ OK" : "❌ FAILED"}`);

  if (!supaOk || !geminiOk) process.exit(1);
}

main().catch((err) => {
  console.error("\nFatal error:", err);
  process.exit(1);
});
