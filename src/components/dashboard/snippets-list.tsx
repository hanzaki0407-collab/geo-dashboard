import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LatestResultRow } from "@/lib/data";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/data";

import { MessageSquareQuote } from "lucide-react";

interface SnippetsListProps {
  results: LatestResultRow[];
}

export function SnippetsList({ results }: SnippetsListProps) {
  const mentionedWithSnippet = results
    .filter((r) => r.mentioned && r.snippet)
    .sort((a, b) => {
      if (a.brand_name !== b.brand_name) return a.brand_name.localeCompare(b.brand_name);
      return a.llm_provider.localeCompare(b.llm_provider);
    });

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">LLM紹介文サンプル</CardTitle>
          <span className="cursor-pointer text-xs text-primary hover:underline">See all</span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          各LLMがブランドをどう紹介しているか
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        {mentionedWithSnippet.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            紹介文データがまだありません
          </p>
        ) : (
          <div className="space-y-2">
            {mentionedWithSnippet.map((r) => {
              const bg =
                r.sentiment === "positive"
                  ? "bg-emerald-500/[0.05] border-emerald-500/10"
                  : r.sentiment === "negative"
                    ? "bg-rose-500/[0.05] border-rose-500/10"
                    : "bg-white/[0.02] border-white/[0.04]";
              return (
                <div
                  key={r.id}
                  className={`rounded-lg border p-3 transition-colors ${bg}`}
                >
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge
                      style={{ backgroundColor: PROVIDER_COLORS[r.llm_provider] }}
                      className="px-1.5 py-0 text-[9px] font-semibold text-white"
                    >
                      {PROVIDER_LABELS[r.llm_provider]}
                    </Badge>
                    <span className="text-xs font-semibold text-foreground">
                      {r.brand_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground">「{r.keyword}」</span>
                    {r.rank && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-primary/15 bg-primary/8 px-1.5 py-0 text-[10px] text-primary"
                      >
                        #{r.rank}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <MessageSquareQuote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                    <p className="text-xs leading-relaxed text-foreground/70">
                      {r.snippet}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
