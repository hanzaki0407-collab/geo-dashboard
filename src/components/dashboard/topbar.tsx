import { Bell, ChevronDown, Moon, Search } from "lucide-react";
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
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-sidebar px-5">
      {/* Left: page title + last updated */}
      <div className="flex items-center gap-4">
        <h1 className="text-[15px] font-semibold text-foreground">Dashboard</h1>
        <span className="hidden text-[11px] text-muted-foreground lg:inline">
          最終更新: {formatted}
        </span>
      </div>

      {/* Right: search + actions + user */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search here.."
            className="h-8 w-44 rounded-lg border border-border bg-background pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary/40 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>

        {/* Icon buttons */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Moon className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="mx-1 h-6 w-px bg-border" />

        {/* User */}
        <button className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-accent">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary to-indigo-400 text-[10px] font-bold text-white">
            FT
          </div>
          <div className="hidden text-left md:block">
            <div className="text-xs font-medium leading-tight text-foreground">FTG Admin</div>
            <div className="text-[10px] leading-tight text-muted-foreground">管理者</div>
          </div>
          <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
        </button>
      </div>
    </header>
  );
}
