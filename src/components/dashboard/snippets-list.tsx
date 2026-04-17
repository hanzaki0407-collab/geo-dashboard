import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LatestResultRow } from "@/lib/data";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
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
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">LLM紹介文サンプル</CardTitle>
        <p className="text-xs text-muted-foreground">
          各LLMがブランドをどう紹介しているか
        </p>
      </CardHeader>
      <CardContent>
        {mentionedWithSnippet.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            紹介文データがまだありません
          </p>
        ) : (
          <div className="space-y-3">
            {mentionedWithSnippet.map((r) => {
              const bg =
                r.sentiment === "positive"
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : r.sentiment === "negative"
                    ? "bg-rose-500/10 border-rose-500/20"
                    : "bg-muted border-border";
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border p-4 transition-colors ${bg}`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge
                      style={{ backgroundColor: PROVIDER_COLORS[r.llm_provider] }}
                      className="text-[10px] font-semibold text-white"
                    >
                      {PROVIDER_LABELS[r.llm_provider]}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {r.brand_name}
                    </span>
                    <span className="text-xs text-muted-foreground">「{r.keyword}」</span>
                    {r.rank && (
                      <Badge
                        variant="outline"
                        className="ml-auto border-primary/30 bg-primary/10 text-xs text-primary"
                      >
                        #{r.rank}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm leading-relaxed text-foreground/80">
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
