"use client";

import { useActionState, useState } from "react";
import {
  signIn,
  sendPasswordReset,
  type LoginState,
  type ResetState,
} from "./actions";

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
        <div className="text-[15px] font-semibold text-neutral-900">
          メールを送信しました
        </div>
        <p className="text-[13px] leading-relaxed text-neutral-600">
          <span className="font-medium text-neutral-800">
            {resetState.email}
          </span>{" "}
          宛にパスワード設定リンクをお送りしました。
          <br />
          リンクをクリックして新しいパスワードを設定してください。
        </p>
        <p className="pt-2 text-[12px] text-neutral-500">
          メールが届かない場合、迷惑メールフォルダもご確認ください。
        </p>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="text-[13px] font-medium text-blue-600 hover:underline"
        >
          サインイン画面に戻る
        </button>
      </div>
    );
  }

  if (mode === "reset") {
    return (
      <form action={resetAction} className="space-y-4">
        <p className="text-[12px] leading-relaxed text-neutral-600">
          初回の方・パスワードをお忘れの方は、登録メール宛にパスワード設定リンクをお送りします。
        </p>

        <div className="rounded-xl border border-neutral-300 px-4 py-3 transition-colors focus-within:border-blue-500">
          <label
            htmlFor="email-reset"
            className="block text-[11px] font-medium text-neutral-500"
          >
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
            className="mt-0.5 w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
          />
        </div>

        {resetState?.error && (
          <p className="text-[12px] leading-relaxed text-red-600">
            {resetState.error}
          </p>
        )}

        <button
          type="submit"
          disabled={resetPending}
          className="w-full rounded-xl border-2 border-blue-500 bg-blue-500 px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resetPending ? "送信中…" : "設定リンクを送信"}
        </button>

        <button
          type="button"
          onClick={() => setMode("signin")}
          className="block w-full pt-1 text-center text-[12px] text-neutral-600 hover:underline"
        >
          サインイン画面に戻る
        </button>
      </form>
    );
  }

  return (
    <form action={signinAction} className="space-y-4">
      <div className="rounded-xl border border-neutral-300 px-4 py-3 transition-colors focus-within:border-blue-500">
        <label
          htmlFor="email"
          className="block text-[11px] font-medium text-neutral-500"
        >
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
          className="mt-0.5 w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>

      <div className="rounded-xl border border-neutral-300 px-4 py-3 transition-colors focus-within:border-blue-500">
        <label
          htmlFor="password"
          className="block text-[11px] font-medium text-neutral-500"
        >
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
          className="mt-0.5 w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>

      {signinState?.error && (
        <p className="text-[12px] leading-relaxed text-red-600">
          {signinState.error}
        </p>
      )}

      <button
        type="submit"
        disabled={signinPending}
        className="w-full rounded-xl border-2 border-blue-500 bg-blue-500 px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {signinPending ? "サインイン中…" : "サインイン"}
      </button>

      <button
        type="button"
        onClick={() => setMode("reset")}
        className="block w-full pt-1 text-center text-[12px] text-neutral-600 hover:underline"
      >
        初回設定 / パスワードをお忘れの方
      </button>
    </form>
  );
}
