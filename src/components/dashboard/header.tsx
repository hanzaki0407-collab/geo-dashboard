import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { Activity, Sparkles } from "lucide-react";

interface HeaderProps {
  lastWeekStart: string | null;
}

export function DashboardHeader({ lastWeekStart }: HeaderProps) {
  const formatted = lastWeekStart
    ? format(parseISO(lastWeekStart), "yyyy年M月d日(E)の週", { locale: ja })
    : "データ未取得";

  return (
    <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-pink-300/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-white/80">
            <Sparkles className="h-3.5 w-3.5" />
            GEO ダッシュボード
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            主要LLMでのブランド可視性レポート
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            ChatGPT・Gemini・Google AIモード・Claude でのブランド言及、紹介内容、引用元を1画面で把握。
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 backdrop-blur">
          <div className="rounded-xl bg-white/20 p-2">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
              最終更新
            </div>
            <div className="text-sm font-semibold text-white">{formatted}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
