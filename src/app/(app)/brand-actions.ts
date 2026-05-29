"use server";

/**
 * Server Actions for managing tracked Targets (brands + their 対策キーワード).
 *
 * Security model:
 * - Writes use the Supabase service-role key, which only ever runs here on the
 *   server (never shipped to the browser). RLS allows SELECT for authenticated
 *   users; INSERT/UPDATE/DELETE happen exclusively through these actions.
 * - Auth is enforced in production via getCurrentUser(). On local dev we allow
 *   writes without a session so the localhost review build (which bypasses
 *   auth in the layout) can still exercise the feature. NODE_ENV is "production"
 *   on Vercel, so the deployed app always requires a logged-in user.
 *
 * After every mutation we revalidatePath("/", "layout") — the same invalidation
 * the collection cron uses (see /api/revalidate) — which purges the route tree
 * and the unstable_cache entries behind data.ts, so the sidebar + dashboard
 * pick up the change on the next router.refresh().
 */

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServiceClient } from "@/lib/supabase";

export type ActionResult = { ok: true } | { ok: false; error: string };

const MAX_NAME_LEN = 120;
const MAX_KEYWORD_LEN = 100;
const MAX_KEYWORDS = 30;

async function ensureAuthed(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user && process.env.NODE_ENV === "production") {
    return "認証が必要です。ログインしてください。";
  }
  return null;
}

function normalizeName(raw: string): string {
  return raw.trim().slice(0, MAX_NAME_LEN);
}

// Trim, drop empties, clamp length, dedupe (exact), cap count — preserving order.
function normalizeKeywords(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const k = item.trim().slice(0, MAX_KEYWORD_LEN);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

// Map a Postgres unique-violation to a friendly message.
function describeError(err: { code?: string; message?: string }): string {
  if (err.code === "23505") return "同名のブランドが既に存在します";
  return err.message ?? "保存に失敗しました";
}

export async function renameBrand(
  brandId: string,
  rawName: string,
): Promise<ActionResult> {
  const authErr = await ensureAuthed();
  if (authErr) return { ok: false, error: authErr };

  const name = normalizeName(rawName);
  if (!name) return { ok: false, error: "ブランド名を入力してください" };

  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("brands").update({ name }).eq("id", brandId);
  if (error) return { ok: false, error: describeError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setBrandKeywords(
  brandId: string,
  rawKeywords: string[],
): Promise<ActionResult> {
  const authErr = await ensureAuthed();
  if (authErr) return { ok: false, error: authErr };

  const keywords = normalizeKeywords(rawKeywords);

  const sb = getSupabaseServiceClient();
  const { error } = await sb
    .from("brands")
    .update({ keywords })
    .eq("id", brandId);
  if (error) return { ok: false, error: describeError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function createBrand(
  rawName: string,
  rawKeywords: string[] = [],
): Promise<ActionResult> {
  const authErr = await ensureAuthed();
  if (authErr) return { ok: false, error: authErr };

  const name = normalizeName(rawName);
  if (!name) return { ok: false, error: "ブランド名を入力してください" };
  const keywords = normalizeKeywords(rawKeywords);

  const sb = getSupabaseServiceClient();

  // Resolve a company to attach the brand to (single-tenant: reuse the first
  // company, creating a default one only if the table is empty).
  let companyId: string | undefined;
  const { data: companies } = await sb
    .from("companies")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);
  companyId = companies?.[0]?.id;
  if (!companyId) {
    const { data: created, error: compErr } = await sb
      .from("companies")
      .insert({ name: "FTG Company", note: "FTG Company" })
      .select("id")
      .single();
    if (compErr) return { ok: false, error: describeError(compErr) };
    companyId = created.id;
  }

  const { error } = await sb
    .from("brands")
    .insert({ company_id: companyId, name, keywords, active: true });
  if (error) return { ok: false, error: describeError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Hard delete. FK cascade removes this brand's llm_results + citation_sources.
// The UI confirms before calling this.
export async function deleteBrand(brandId: string): Promise<ActionResult> {
  const authErr = await ensureAuthed();
  if (authErr) return { ok: false, error: authErr };

  const sb = getSupabaseServiceClient();
  const { error } = await sb.from("brands").delete().eq("id", brandId);
  if (error) return { ok: false, error: describeError(error) };

  revalidatePath("/", "layout");
  return { ok: true };
}
