"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isEmailAllowed } from "@/lib/auth";

export type LoginState = {
  error?: string;
  email?: string;
};

export type ResetState = {
  ok?: boolean;
  error?: string;
  email?: string;
};

function resolveSiteUrl(host: string | null, proto: string | null): string {
  if (host) {
    const scheme =
      proto ?? (host.startsWith("localhost") ? "http" : "https");
    return `${scheme}://${host}`;
  }
  const env = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (env) return env;
  return "http://localhost:3000";
}

export async function signIn(
  _prev: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "メールアドレスとパスワードを入力してください。", email };
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

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error:
        "メールアドレスまたはパスワードが正しくありません。初回の方は下の「パスワード設定」からお進みください。",
      email,
    };
  }

  redirect("/");
}

export async function sendPasswordReset(
  _prev: ResetState | undefined,
  formData: FormData,
): Promise<ResetState> {
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
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    return { error: `送信に失敗しました: ${error.message}`, email };
  }

  return { ok: true, email };
}
