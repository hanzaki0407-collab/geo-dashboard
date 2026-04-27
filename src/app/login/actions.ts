"use server";

import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isEmailAllowed } from "@/lib/auth";

export type LoginState = {
  ok?: boolean;
  error?: string;
  email?: string;
};

function resolveSiteUrl(host: string | null, proto: string | null): string {
  // Prefer the current request host so the magic link returns to the same
  // origin the user signed in from (works on preview, prod, and localhost
  // without per-environment config).
  if (host) {
    const scheme =
      proto ?? (host.startsWith("localhost") ? "http" : "https");
    return `${scheme}://${host}`;
  }
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  return "http://localhost:3000";
}

export async function sendMagicLink(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) {
    return { error: "メールアドレスを入力してください。", email };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "メールアドレスの形式が正しくありません。", email };
  }
  if (!isEmailAllowed(email)) {
    return {
      error:
        "このメールアドレスはアクセスが許可されていません。管理者にご連絡ください。",
      email,
    };
  }

  const h = await headers();
  const site = resolveSiteUrl(h.get("host"), h.get("x-forwarded-proto"));
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${site}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { error: `送信に失敗しました: ${error.message}`, email };
  }

  return { ok: true, email };
}
