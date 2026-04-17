import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopDomainRow } from "@/lib/data";
import { PROVIDER_LABELS } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { ExternalLink, Globe } from "lucide-react";

interface CitationsTableProps {
  domains: TopDomainRow[];
}

export function CitationsTable({ domains }: CitationsTableProps) {
  const max = Math.max(1, ...domains.map((d) => d.citation_count));

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            引用元ドメイン Top 10
          </CardTitle>
          <span className="text-[10px] text-muted-foreground">直近4週</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {domains.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            引用元データがまだありません
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
