"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | undefined, FormData>(
    sendMagicLink,
    undefined,
  );

  if (state?.ok) {
    return (
      <div className="space-y-3 text-center">
        <div className="text-[15px] font-semibold text-neutral-900">
          メールを送信しました
        </div>
        <p className="text-[13px] leading-relaxed text-neutral-600">
          <span className="font-medium text-neutral-800">{state.email}</span>{" "}
          宛にサインインリンクをお送りしました。
          <br />
          メール内のリンクをクリックしてサインインを完了してください。
        </p>
        <p className="pt-2 text-[12px] text-neutral-500">
          メールが届かない場合、迷惑メールフォルダもご確認ください。
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-xl border border-neutral-300 px-4 py-3 transition-colors focus-within:border-blue-500">
        <label
          htmlFor="email"
          className="block text-[11px] font-medium text-neutral-500"
        >
          仕事用のメールアドレス
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          placeholder="you@example.com"
          className="mt-0.5 w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>

      {state?.error && (
        <p className="text-[12px] leading-relaxed text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl border-2 border-blue-500 bg-blue-500 px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "送信中…" : "続ける"}
      </button>

      <p className="pt-1 text-center text-[11px] leading-relaxed text-neutral-500">
        ご登録のメールアドレス宛にサインインリンクをお送りします。
        <br />
        パスワードは不要です。
      </p>
    </form>
  );
}
