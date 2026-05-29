"use client";

import { useActionState } from "react";
import { updatePassword, type UpdateState } from "./actions";

const FIELD =
  "rounded-xl border border-border bg-white/[0.02] px-4 py-3 transition-colors focus-within:border-primary";
const LABEL = "block text-[11px] font-medium text-muted-foreground";
const INPUT =
  "mt-0.5 w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground/50";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState<
    UpdateState | undefined,
    FormData
  >(updatePassword, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className={FIELD}>
        <label htmlFor="password" className={LABEL}>
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
          className={INPUT}
        />
      </div>

      <div className={FIELD}>
        <label htmlFor="confirm" className={LABEL}>
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
          className={INPUT}
        />
      </div>

      {state?.error && (
        <p className="text-[12px] leading-relaxed text-destructive">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-primary px-4 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "更新中…" : "パスワードを設定"}
      </button>
    </form>
  );
}
