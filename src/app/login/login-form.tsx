"use client";

import { useActionState, useState } from "react";
import {
  signIn,
  sendPasswordReset,
  type LoginState,
  type ResetState,
} from "./actions";

const FIELD =
  "rounded-xl border border-border bg-white/[0.02] px-4 py-3 transition-colors focus-within:border-primary";
const LABEL = "block text-[11px] font-medium text-muted-foreground";
const INPUT =
  "mt-0.5 w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/50";
const SUBMIT =
  "w-full rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60";
const LINK =
  "block w-full pt-1 text-center text-[12px] text-muted-foreground transition-colors hover:text-foreground";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "reset">("signin");

  const [signinState, signinAction, signinPending] = useActionState<
    LoginState | undefined,
    FormData
  >(signIn, undefined);

  const [resetState, resetAction, resetPending] = useActionState<
    ResetState | undefined,
    FormData
  >(sendPasswordReset, undefined);

  if (mode === "reset" && resetState?.ok) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-[15px] font-semibold text-foreground">
          メールを送信しました
        </div>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            {resetState.email}
          </span>{" "}
          宛にパスワード設定リンクをお送りしました。
          <br />
          リンクをクリックして新しいパスワードを設定してください。
        </p>
        <p className="pt-2 text-[12px] text-muted-foreground/70">
          メールが届かない場合、迷惑メールフォルダもご確認ください。
        </p>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="text-[13px] font-medium text-primary hover:underline"
        >
          サインイン画面に戻る
        </button>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <form action={resetAction} className="space-y-4">
        <p className="text-[12px] leading-relaxed text-muted-foreground">
          初回の方・パスワードをお忘れの方は、登録メール宛にパスワード設定リンクをお送りします。
        </p>

        <div className={FIELD}>
          <label htmlFor="email-reset" className={LABEL}>
            メールアドレス
          </label>
          <input
            id="email-reset"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            defaultValue={resetState?.email}
            placeholder="you@example.com"
            className={INPUT}
          />
        </div>

        {resetState?.error && (
          <p className="text-[12px] leading-relaxed text-destructive">
            {resetState.error}
          </p>
        )}

        <button type="submit" disabled={resetPending} className={SUBMIT}>
          {resetPending ? "送信中…" : "設定リンクを送信"}
        </button>

        <button
          type="button"
          onClick={() => setMode("signin")}
          className={LINK}
        >
          サインイン画面に戻る
        </button>
      </form>
    );
  }

  return (
    <form action={signinAction} className="space-y-4">
      <div className={FIELD}>
        <label htmlFor="email" className={LABEL}>
          メールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={signinState?.email}
          placeholder="you@example.com"
          className={INPUT}
        />
      </div>

      <div className={FIELD}>
        <label htmlFor="password" className={LABEL}>
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          placeholder="8文字以上"
          className={INPUT}
        />
      </div>

      {signinState?.error && (
        <p className="text-[12px] leading-relaxed text-destructive">
          {signinState.error}
        </p>
      )}

      <button type="submit" disabled={signinPending} className={SUBMIT}>
        {signinPending ? "サインイン中…" : "サインイン"}
      </button>

      <button type="button" onClick={() => setMode("reset")} className={LINK}>
        初回設定 / パスワードをお忘れの方
      </button>
    </form>
  );
}
