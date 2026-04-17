import { Bell, Search, Settings } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface TopbarProps {
  lastWeekStart: string | null;
}

export function Topbar({ lastWeekStart }: TopbarProps) {
  const formatted = lastWeekStart
    ? format(parseISO(lastWeekStart), "yyyy年M月d日(E)の週", { locale: ja })
    : "データ未取得";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-lg font-bold text-foreground">ダッシュボード</h1>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="検索..."
            className="h-9 w-56 rounded-xl border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground">
          最終更新: {formatted}
        </div>

        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <Bell className="h-4 w-4" />
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
          <Settings className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            FT
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-foreground">FTG Admin</div>
            <div className="text-[10px] text-muted-foreground">管理者</div>
          </div>
        </div>
      </div>
    </header>
  );
}
