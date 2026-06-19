import { Activity, CalendarClock } from "lucide-react";
import { format, parseISO } from "date-fns";

interface TopbarProps {
  lastWeekStart: string | null;
}

/**
 * Topbar — a monitoring "command bar". Mono type, a live signal dot, and an
 * honest last-sync timestamp. No fake search/notifications/user chrome.
 */
export function Topbar({ lastWeekStart }: TopbarProps) {
  const synced = lastWeekStart ? format(parseISO(lastWeekStart), "yyyy.MM.dd") : "—";

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/70 px-5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="signal-dot" aria-hidden />
        <h1 className="text-[14px] font-semibold tracking-tight text-foreground">
          LLM分析
        </h1>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide text-signal"
          style={{
            backgroundColor: "color-mix(in srgb, var(--signal) 14%, transparent)",
          }}
        >
          LIVE
        </span>
        <span className="hidden text-[12px] text-muted-foreground sm:inline">
          主要LLM ブランド可視性
        </span>
      </div>

      <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-signal/70" />
        <span className="hidden sm:inline">最終同期</span>
        <CalendarClock className="h-3.5 w-3.5 sm:hidden" />
        <span className="font-medium text-foreground/85">{synced}</span>
      </div>
    </header>
  );
}
