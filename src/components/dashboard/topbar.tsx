import { CalendarClock, Database } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

interface TopbarProps {
  lastWeekStart: string | null;
}

/**
 * Topbar — intentionally honest. The previous header had a non-functional
 * search box, bell, theme toggle and a hard-coded user, which made the whole
 * dashboard feel broken. This shows only real, accurate information.
 */
export function Topbar({ lastWeekStart }: TopbarProps) {
  const formatted = lastWeekStart
    ? format(parseISO(lastWeekStart), "yyyy年M月d日(E) の週", { locale: ja })
    : "データ未取得";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-sidebar/80 px-5 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold tracking-tight text-foreground">
          GEO ダッシュボード
        </h1>
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-2.5 py-1 text-[11px] text-muted-foreground sm:flex">
          <Database className="h-3 w-3 text-primary/70" />
          主要LLMのブランド可視性
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground/70" />
        <span className="hidden sm:inline">最終データ:</span>
        <span className="font-medium text-foreground/80">{formatted}</span>
      </div>
    </header>
  );
}
