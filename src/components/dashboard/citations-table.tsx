import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopDomainRow } from "@/lib/data";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { ExternalLink, Globe, Filter } from "lucide-react";

interface CitationsTableProps {
  domains: TopDomainRow[];
  filterLabel?: string | null;
  onClearFilter?: () => void;
  scope?: "all" | "cell";
  activeProvider?: LLMProvider | null;
}

export function CitationsTable({
  domains,
  filterLabel,
  onClearFilter,
  scope = "all",
  activeProvider = null,
}: CitationsTableProps) {
  const max = Math.max(1, ...domains.map((d) => d.citation_count));
  const title = scope === "cell" ? "引用元ドメイン（選択セル）" : "引用元ドメイン Top 10";
  const rangeLabel = scope === "cell" ? "タップしたセルの引用元" : "直近4週";
  const accent = activeProvider ? PROVIDER_COLORS[activeProvider] : null;

  return (
    <Card
      className="border border-border bg-card"
      style={accent ? { boxShadow: `inset 3px 0 0 ${accent}` } : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            {filterLabel && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
                <Filter className="h-2.5 w-2.5" />
                <span className="truncate">{filterLabel}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{rangeLabel}</span>
            {onClearFilter && filterLabel && (
              <button
                type="button"
                onClick={onClearFilter}
                className="rounded-md border border-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                解除
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {domains.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {scope === "cell"
              ? "このセルの引用元データがありません"
              : "引用元データがまだありません"}
          </p>
        ) : (
          <ol className="space-y-2.5">
            {domains.map((d, i) => {
              const widthPct = (d.citation_count / max) * 100;
              return (
                <li key={d.domain}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/12 text-[10px] font-bold text-amber-400">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1 truncate">
                          <Globe className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                          <span className="truncate text-xs font-medium text-foreground">
                            {d.domain}
                          </span>
                          <a
                            href={`https://${d.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground/40 hover:text-primary"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold text-foreground/70">
                          {d.citation_count}件
                        </span>
                      </div>
                      <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {d.providers.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="border-0 bg-white/[0.04] px-1 py-0 text-[9px] text-muted-foreground"
                          >
                            {PROVIDER_LABELS[p as LLMProvider] ?? p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
