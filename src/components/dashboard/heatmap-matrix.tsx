"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Minus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROVIDERS, PROVIDER_LABELS, type LatestResultRow } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { CellSelection } from "./filter-context";

const PROVIDER_LOGOS: Record<LLMProvider, string> = {
  gemini: "/logos/gemini.svg",
  google_ai_mode: "/logos/google-ai.svg",
  chatgpt: "/logos/chatgpt.svg",
  claude: "/logos/claude.svg",
};

interface HeatmapProps {
  results: LatestResultRow[];
  selection: CellSelection | null;
  onSelect: (sel: CellSelection | null) => void;
}

interface Cell {
  mentioned: boolean | null;
  rank: number | null;
  sentiment: string | null;
  brandId: string;
}

// Synthetic example showing what the matrix looks like once the user is
// tracking several brands × keywords across all 4 providers. Clearly labelled.
function buildSampleResults(): LatestResultRow[] {
  type Sample = {
    brand: string;
    company: string;
    keyword: string;
    cells: Partial<
      Record<
        LLMProvider,
        { mentioned: boolean; rank?: number; sentiment?: "positive" | "neutral" | "negative" }
      >
    >;
  };
  const samples: Sample[] = [
    {
      brand: "サンプルA・カフェ表参道",
      company: "サンプル株式会社A（仮）",
      keyword: "表参道 カフェ",
      cells: {
        gemini: { mentioned: true, rank: 2, sentiment: "positive" },
        google_ai_mode: { mentioned: true, rank: 4, sentiment: "neutral" },
        chatgpt: { mentioned: false },
        claude: { mentioned: true, rank: 6, sentiment: "positive" },
      },
    },
    {
      brand: "サンプルB・寿司 銀座本店",
      company: "サンプル株式会社B（仮）",
      keyword: "銀座 寿司",
      cells: {
        gemini: { mentioned: true, rank: 1, sentiment: "positive" },
        google_ai_mode: { mentioned: true, rank: 3, sentiment: "positive" },
        chatgpt: { mentioned: true, rank: 2, sentiment: "positive" },
        claude: { mentioned: true, rank: 4, sentiment: "positive" },
      },
    },
    {
      brand: "サンプルC・焼肉 渋谷",
      company: "サンプル株式会社C（仮）",
      keyword: "渋谷 焼肉",
      cells: {
        gemini: { mentioned: true, rank: 7, sentiment: "neutral" },
        google_ai_mode: { mentioned: false },
        chatgpt: { mentioned: true, rank: 9, sentiment: "negative" },
        claude: { mentioned: false },
      },
    },
    {
      brand: "サンプルD・ホテル 新宿",
      company: "サンプル株式会社D（仮）",
      keyword: "新宿 ホテル",
      cells: {
        gemini: { mentioned: true, rank: 3, sentiment: "positive" },
        google_ai_mode: { mentioned: true, rank: 5, sentiment: "neutral" },
        chatgpt: { mentioned: true, rank: 6, sentiment: "positive" },
        claude: { mentioned: true, rank: 8, sentiment: "neutral" },
      },
    },
  ];
  const out: LatestResultRow[] = [];
  let idx = 0;
  for (const s of samples) {
    const brandId = `sample-${idx++}`;
    for (const p of PROVIDERS) {
      const c = s.cells[p];
      if (!c) continue;
      out.push({
        id: `${brandId}-${p}`,
        run_id: "sample-run",
        week_start: new Date().toISOString().slice(0, 10),
        brand_id: brandId,
        brand_name: s.brand,
        company_id: `co-${brandId}`,
        company_name: s.company,
        keyword: s.keyword,
        llm_provider: p,
        locale: "ja",
        mentioned: c.mentioned,
        rank: c.rank ?? null,
        snippet: null,
        sentiment: c.sentiment ?? null,
        competitors: null,
        collected_at: new Date().toISOString(),
      });
    }
  }
  return out;
}

export function HeatmapMatrix({ results, selection, onSelect }: HeatmapProps) {
  const [showSample, setShowSample] = useState(false);
  const effectiveResults = showSample ? buildSampleResults() : results;
  const key = (brand: string, keyword: string) => `${brand}::${keyword}`;

  const pairs = new Map<
    string,
    { brand: string; brandId: string; company: string; keyword: string }
  >();
  const matrix = new Map<string, Map<LLMProvider, Cell>>();
  for (const r of effectiveResults) {
    const k = key(r.brand_name, r.keyword);
    pairs.set(k, {
      brand: r.brand_name,
      brandId: r.brand_id,
      company: r.company_name,
      keyword: r.keyword,
    });
    if (!matrix.has(k)) matrix.set(k, new Map());
    matrix.get(k)!.set(r.llm_provider, {
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
    <Card className="border-border bg-card shadow-[var(--shadow-card)]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              ブランド × LLM 言及マトリクス
              {showSample && (
                <span className="rounded-full border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[9px] font-bold text-warning">
                  サンプル（仮）
                </span>
              )}
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              {showSample
                ? "実データではありません。複数ブランド登録後の表示イメージ。"
                : "セルをクリックすると右の引用元を絞り込みます"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {selection && !showSample && (
              <button
                type="button"
                onClick={() => onSelect(null)}
                className="rounded-md border border-border bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                絞り込み解除
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onSelect(null);
                setShowSample((s) => !s);
              }}
              className={cn(
                "rounded-md border px-2 py-1 text-[10px] font-medium transition-colors",
                showSample
                  ? "border-warning/40 bg-warning/15 text-warning"
                  : "border-border bg-white/[0.03] text-muted-foreground hover:text-foreground",
              )}
            >
              {showSample ? "実データに戻す" : "サンプル表示"}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="sticky left-0 bg-card px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  ブランド / キーワード
                </th>
                {PROVIDERS.map((p) => (
                  <th
                    key={p}
                    className="px-2 py-2.5 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
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
              {rows.map(([k, info]) => {
                const cells = matrix.get(k) ?? new Map<LLMProvider, Cell>();
                return (
                  <tr
                    key={k}
                    className="border-t border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="sticky left-0 bg-card px-3 py-2.5 text-left">
                      <div className="text-[11px] font-medium text-muted-foreground/80">
                        {info.brand}
                      </div>
                      <div className="mt-0.5 inline-block rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                        {info.keyword}
                      </div>
                    </td>
                    {PROVIDERS.map((p) => {
                      const cell = cells.get(p) ?? null;
                      const isSelected =
                        !!selection &&
                        selection.brandId === info.brandId &&
                        selection.provider === p;
                      return (
                        <td key={p} className="px-2 py-2.5 text-center">
                          <CellPill
                            cell={cell}
                            selected={isSelected}
                            onClick={
                              cell
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
                    className="px-3 py-10 text-center text-xs text-muted-foreground"
                  >
                    選択中の条件に一致するデータがありません。
                    <br />
                    サイドバーで別のブランド/キーワードを選ぶか「サンプル表示」で
                    レイアウトを確認できます。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <HeatmapLegend />
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
  // No measurement for this brand×provider yet.
  if (!cell) {
    return (
      <div
        className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.02] text-muted-foreground/25"
        title="未計測"
      >
        <Minus className="h-3.5 w-3.5" />
      </div>
    );
  }

  const mentioned = cell.mentioned === true;
  const tone = !mentioned
    ? "border border-white/10 bg-white/[0.04] text-muted-foreground/70"
    : cell.sentiment === "positive"
      ? "bg-[var(--success)] text-white"
      : cell.sentiment === "negative"
        ? "bg-[var(--destructive)] text-white"
        : "bg-primary text-primary-foreground";

  const inner = (
    <div
      className={cn(
        "flex h-8 min-w-8 items-center justify-center gap-0.5 rounded-lg px-1.5",
        tone,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-card",
      )}
      title={
        mentioned
          ? `言及あり${cell.rank ? ` · 順位${cell.rank}位` : ""}${
              cell.sentiment ? ` · ${cell.sentiment}` : ""
            } · クリックで引用元を絞り込み`
          : "言及なし · クリックで引用元を確認"
      }
    >
      {mentioned ? <Check className="h-3.5 w-3.5" /> : <X className="h-3 w-3" />}
      {mentioned && cell.rank ? (
        <span className="text-[10px] font-bold">#{cell.rank}</span>
      ) : null}
    </div>
  );

  if (!onClick) return <div className="flex justify-center">{inner}</div>;

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg transition-transform duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {inner}
      </button>
    </div>
  );
}

function HeatmapLegend() {
  const items = [
    { label: "ポジティブ", color: "var(--success)" },
    { label: "中立", color: "var(--primary)" },
    { label: "ネガティブ", color: "var(--destructive)" },
  ];
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/[0.04] pt-3 text-[10px] text-muted-foreground">
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: it.color }}
          />
          {it.label}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="flex h-3 w-3 items-center justify-center rounded-[3px] border border-white/10 bg-white/[0.04]">
          <X className="h-2 w-2 text-muted-foreground/70" />
        </span>
        言及なし
      </span>
      <span className="flex items-center gap-1.5">
        <Minus className="h-3 w-3 text-muted-foreground/30" />
        未計測
      </span>
    </div>
  );
}
