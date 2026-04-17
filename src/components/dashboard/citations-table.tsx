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
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
          引用元ドメイン Top 10（直近4週）
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          各LLMが最も頻繁に引用しているソース
        </p>
      </CardHeader>
      <CardContent>
        {domains.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            引用元データがまだありません
          </p>
        ) : (
          <ol className="space-y-3">
            {domains.map((d, i) => {
              const widthPct = (d.citation_count / max) * 100;
              return (
                <li key={d.domain}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-white shadow-sm">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 truncate">
                          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate text-sm font-medium text-foreground">
                            {d.domain}
                          </span>
                          <a
                            href={`https://${d.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground transition-colors hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="shrink-0 text-xs font-semibold text-foreground/80">
                          {d.citation_count} 件
                        </div>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {d.providers.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="border-border bg-muted text-[10px] text-muted-foreground"
                          >
                            {PROVIDER_LABELS[p as LLMProvider] ?? p}
                          </Badge>
                        ))}
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-[10px] text-primary"
                        >
                          {d.distinct_brands} ブランドで引用
                        </Badge>
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
