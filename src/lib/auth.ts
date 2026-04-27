import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "./supabase-server";

export const getCurrentUser = cache(async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isEmailAllowed(email: string): boolean {
  const allow = getAllowedEmails();
  if (allow.length === 0) return false;
  return allow.includes(email.trim().toLowerCase());
}
