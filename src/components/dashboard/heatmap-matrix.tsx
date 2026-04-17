import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROVIDERS, PROVIDER_LABELS, type LatestResultRow } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface HeatmapProps {
  results: LatestResultRow[];
}

interface Cell {
  mentioned: boolean | null;
  rank: number | null;
  sentiment: string | null;
}

export function HeatmapMatrix({ results }: HeatmapProps) {
  const brandKeywordKey = (brand: string, keyword: string) => `${brand}::${keyword}`;

  const pairs = new Map<string, { brand: string; company: string; keyword: string }>();
  for (const r of results) {
    pairs.set(brandKeywordKey(r.brand_name, r.keyword), {
      brand: r.brand_name,
      company: r.company_name,
      keyword: r.keyword,
    });
  }

  const matrix = new Map<string, Map<LLMProvider, Cell>>();
  for (const r of results) {
    const key = brandKeywordKey(r.brand_name, r.keyword);
    if (!matrix.has(key)) matrix.set(key, new Map());
    matrix.get(key)!.set(r.llm_provider, {
      mentioned: r.mentioned,
      rank: r.rank,
      sentiment: r.sentiment,
    });
  }

  const rows = Array.from(pairs.entries()).sort((a, b) =>
    a[1].company === b[1].company
      ? a[1].brand.localeCompare(b[1].brand)
      : a[1].company.localeCompare(b[1].company),
  );

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">ブランド × LLM 言及マトリクス</CardTitle>
        <p className="text-xs text-muted-foreground">
          色付きセル: 言及あり。ホバーで順位と感情を表示。
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ブランド / キーワード
                </th>
                {PROVIDERS.map((p) => (
                  <th
                    key={p}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {PROVIDER_LABELS[p]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([key, info]) => {
                const cells = matrix.get(key) ?? new Map();
                return (
                  <tr
                    key={key}
                    className="border-t border-border transition-colors hover:bg-muted/50"
                  >
                    <td className="sticky left-0 bg-card px-4 py-3 text-left">
                      <div className="font-medium text-foreground">{info.brand}</div>
                      <div className="text-xs text-muted-foreground">
                        {info.company} · {info.keyword}
                      </div>
                    </td>
                    {PROVIDERS.map((p) => {
                      const cell = cells.get(p);
                      return (
                        <td key={p} className="px-2 py-3 text-center">
                          <CellPill cell={cell ?? null} />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={PROVIDERS.length + 1}
                    className="px-4 py-8 text-center text-sm text-muted-foreground"
                  >
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function CellPill({ cell }: { cell: Cell | null }) {
  if (!cell) {
    return (
      <div
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground/50"
        title="未計測"
      >
        <MinusCircle className="h-4 w-4" />
      </div>
    );
  }
  if (!cell.mentioned) {
    return (
      <div
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground"
        title="言及なし"
      >
        <XCircle className="h-4 w-4" />
      </div>
    );
  }

  const sentimentClass =
    cell.sentiment === "positive"
      ? "from-emerald-500 to-teal-500 shadow-emerald-500/30"
      : cell.sentiment === "negative"
        ? "from-rose-500 to-pink-500 shadow-rose-500/30"
        : "from-sky-500 to-indigo-500 shadow-sky-500/30";

  return (
    <div className="flex justify-center">
      <div
        className={`flex h-9 min-w-9 items-center justify-center gap-1 rounded-xl bg-gradient-to-br ${sentimentClass} px-2 text-white shadow-md`}
        title={`言及あり${cell.rank ? ` · 順位${cell.rank}位` : ""}${cell.sentiment ? ` · ${cell.sentiment}` : ""}`}
      >
        <CheckCircle2 className="h-4 w-4" />
        {cell.rank && <span className="text-[11px] font-bold">#{cell.rank}</span>}
      </div>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <Badge variant="outline" className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        ポジティブ言及
      </Badge>
      <Badge variant="outline" className="gap-1.5 border-sky-500/30 bg-sky-500/10 text-sky-400">
        <span className="h-2 w-2 rounded-full bg-sky-500" />
        中立言及
      </Badge>
      <Badge variant="outline" className="gap-1.5 border-rose-500/30 bg-rose-500/10 text-rose-400">
        <span className="h-2 w-2 rounded-full bg-rose-500" />
        ネガティブ言及
      </Badge>
      <Badge variant="outline" className="gap-1.5 border-border text-muted-foreground">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
        言及なし
      </Badge>
    </div>
  );
}
