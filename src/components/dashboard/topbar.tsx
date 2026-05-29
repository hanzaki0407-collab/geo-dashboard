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
    <header className="flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/85 px-5 backdrop-blur-md">
      <div className="flex items-center gap-2.5">
        <span className="signal-dot" aria-hidden />
        <span className="font-mono text-[12px] font-semibold tracking-[0.22em] text-foreground uppercase">
          GEO Monitor
        </span>
        <span className="text-glow-signal font-mono text-[10px] font-semibold tracking-[0.22em] uppercase">
          Live
        </span>
        <span className="mx-1 hidden h-3.5 w-px bg-border sm:block" />
        <span className="hidden font-mono text-[10px] tracking-[0.18em] text-muted-foreground sm:inline">
          // 主要LLM ブランド可視性
        </span>
      </div>

      <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <Activity className="h-3.5 w-3.5 text-signal/70" />
        <span className="hidden tracking-[0.16em] sm:inline">LAST&nbsp;SYNC</span>
        <CalendarClock className="h-3.5 w-3.5 sm:hidden" />
        <span className="tracking-wider text-foreground/85">{synced}</span>
      </div>
    </header>
  );
}
