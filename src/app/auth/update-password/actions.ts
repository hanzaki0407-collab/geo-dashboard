"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export type UpdateState = {
  error?: string;
};

export async function updatePassword(
  _prev: UpdateState | undefined,
  formData: FormData,
): Promise<UpdateState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "パスワードは8文字以上で入力してください。" };
  }
  if (password !== confirm) {
    return { error: "確認用パスワードが一致しません。" };
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: `更新に失敗しました: ${error.message}` };
  }

  redirect("/");
}
