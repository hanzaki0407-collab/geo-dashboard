"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROVIDERS, PROVIDER_LABELS, type LatestResultRow } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import Image from "next/image";

const PROVIDER_LOGOS: Record<LLMProvider, string> = {
  gemini: "/logos/gemini.svg",
  google_ai_mode: "/logos/google-ai.svg",
  chatgpt: "/logos/chatgpt.svg",
  claude: "/logos/claude.svg",
};

export interface HeatmapSelection {
  brandId: string;
  brandName: string;
  provider: LLMProvider;
}

interface HeatmapProps {
  results: LatestResultRow[];
  selection: HeatmapSelection | null;
  onSelect: (sel: HeatmapSelection | null) => void;
}

interface Cell {
  mentioned: boolean | null;
  rank: number | null;
  sentiment: string | null;
  brandId: string;
}

export function HeatmapMatrix({ results, selection, onSelect }: HeatmapProps) {
  const brandKeywordKey = (brand: string, keyword: string) => `${brand}::${keyword}`;

  const pairs = new Map<
    string,
    { brand: string; brandId: string; company: string; keyword: string }
  >();
  for (const r of results) {
    pairs.set(brandKeywordKey(r.brand_name, r.keyword), {
      brand: r.brand_name,
      brandId: r.brand_id,
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
      brandId: r.brand_id,
    });
  }

  const rows = Array.from(pairs.entries()).sort((a, b) =>
    a[1].company === b[1].company
      ? a[1].brand.localeCompare(b[1].brand)
      : a[1].company.localeCompare(b[1].company),
  );

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              ブランド × LLM 言及マトリクス
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Rankセルをタップで右の引用元Top10を絞り込み
            </p>
          </div>
          {selection && (
            <button
              type="button"
              onClick={() => onSelect(null)}
              className="shrink-0 rounded-md border border-border bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              絞り込み解除
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 bg-card px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  ブランド / キーワード
                </th>
                {PROVIDERS.map((p) => (
                  <th
                    key={p}
                    className="px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      <Image
                        src={PROVIDER_LOGOS[p]}
                        alt={PROVIDER_LABELS[p]}
                        width={20}
                        height={20}
                        className="h-5 w-5"
                      />
                      <span>{PROVIDER_LABELS[p]}</span>
                    </div>
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
                    className="border-t border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="sticky left-0 bg-card px-3 py-2.5 text-left">
                      <div className="text-xs font-medium text-foreground">{info.brand}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {info.company} · {info.keyword}
                      </div>
                    </td>
                    {PROVIDERS.map((p) => {
                      const cell = cells.get(p);
                      const isSelected =
                        !!selection &&
                        selection.brandId === info.brandId &&
                        selection.provider === p;
                      return (
                        <td key={p} className="px-2 py-2.5 text-center">
                          <CellPill
                            cell={cell ?? null}
                            selected={isSelected}
                            onClick={
                              cell && cell.mentioned
                                ? () =>
                                    onSelect(
                                      isSelected
                                        ? null
                                        : {
                                            brandId: info.brandId,
                                            brandName: info.brand,
                                            provider: p,
                                          },
                                    )
                                : undefined
                            }
                          />
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
                    className="px-3 py-6 text-center text-xs text-muted-foreground"
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

function CellPill({
  cell,
  selected,
  onClick,
}: {
  cell: Cell | null;
  selected: boolean;
  onClick?: () => void;
}) {
  if (!cell) {
    return (
      <div
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] text-muted-foreground/30"
        title="未計測"
      >
        <MinusCircle className="h-3.5 w-3.5" />
      </div>
    );
  }
  if (!cell.mentioned) {
    return (
      <div
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.03] text-muted-foreground/50"
        title="言及なし"
      >
        <XCircle className="h-3.5 w-3.5" />
      </div>
    );
  }

  const sentimentClass =
    cell.sentiment === "positive"
      ? "from-emerald-500 to-teal-500"
      : cell.sentiment === "negative"
        ? "from-rose-500 to-pink-500"
        : "from-sky-500 to-indigo-500";

  const selectedRing = selected
    ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-card"
    : "";

  const Inner = (
    <div
      className={`flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-lg bg-gradient-to-br ${sentimentClass} px-1.5 text-white ${selectedRing}`}
      title={`言及あり${cell.rank ? ` · 順位${cell.rank}位` : ""}${cell.sentiment ? ` · ${cell.sentiment}` : ""}${onClick ? " · クリックで引用元を絞り込み" : ""}`}
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      {cell.rank && <span className="text-[10px] font-bold">#{cell.rank}</span>}
    </div>
  );

  if (!onClick) {
    return <div className="flex justify-center">{Inner}</div>;
  }

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="transition-transform hover:scale-110 focus:outline-none"
      >
        {Inner}
      </button>
    </div>
  );
}

export function HeatmapLegend() {
  return (
    <div className="flex flex-wrap gap-1.5 text-[11px]">
      <Badge variant="outline" className="gap-1 border-emerald-500/20 bg-emerald-500/8 text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        ポジティブ
      </Badge>
      <Badge variant="outline" className="gap-1 border-sky-500/20 bg-sky-500/8 text-sky-400">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
        中立
      </Badge>
      <Badge variant="outline" className="gap-1 border-rose-500/20 bg-rose-500/8 text-rose-400">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        ネガティブ
      </Badge>
      <Badge variant="outline" className="gap-1 border-white/8 text-muted-foreground">
        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        言及なし
      </Badge>
    </div>
  );
}
