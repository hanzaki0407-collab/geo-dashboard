"use client";

import { useActionState } from "react";
import { updatePassword, type UpdateState } from "./actions";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState<
    UpdateState | undefined,
    FormData
  >(updatePassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="rounded-xl border border-neutral-300 px-4 py-3 transition-colors focus-within:border-blue-500">
        <label
          htmlFor="password"
          className="block text-[11px] font-medium text-neutral-500"
        >
          新しいパスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="8文字以上"
          className="mt-0.5 w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>

      <div className="rounded-xl border border-neutral-300 px-4 py-3 transition-colors focus-within:border-blue-500">
        <label
          htmlFor="confirm"
          className="block text-[11px] font-medium text-neutral-500"
        >
          パスワード（確認）
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="再度入力"
          className="mt-0.5 w-full bg-transparent text-[15px] text-neutral-900 outline-none placeholder:text-neutral-400"
        />
      </div>

      {state?.error && (
        <p className="text-[12px] leading-relaxed text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl border-2 border-blue-500 bg-blue-500 px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "更新中…" : "パスワードを設定"}
      </button>
    </form>
  );
}
