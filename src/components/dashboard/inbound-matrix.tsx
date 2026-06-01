"use client";

import Image from "next/image";
import { Check, Minus, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  type LatestResultRow,
  type MentionsByCountryRow,
} from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROVIDER_LOGOS: Record<LLMProvider, string> = {
  gemini: "/logos/gemini.svg",
  google_ai_mode: "/logos/google-ai.svg",
  chatgpt: "/logos/chatgpt.svg",
  claude: "/logos/claude.svg",
};

// Windows can't render regional-indicator flag emoji, so use flagcdn SVGs.
function FlagImg({
  countryCode,
  alt,
}: {
  countryCode: string;
  alt: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${countryCode.toLowerCase()}.svg`}
      alt={alt}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

interface InboundMatrixProps {
  // Latest inbound (non-ja) results, already filtered to the selected
  // brands/keywords by the parent.
  results: LatestResultRow[];
  // Country/locale metadata + ordering (v_mentions_by_country, non-ja).
  countries: MentionsByCountryRow[];
}

interface Cell {
  mentioned: boolean;
  rank: number | null;
  sentiment: string | null;
}

export function InboundMatrix({ results, countries }: InboundMatrixProps) {
  // locale → provider → rows
  const byLocale = new Map<string, Map<LLMProvider, LatestResultRow[]>>();
  for (const r of results) {
    let pm = byLocale.get(r.locale);
    if (!pm) {
      pm = new Map();
      byLocale.set(r.locale, pm);
    }
    const arr = pm.get(r.llm_provider) ?? [];
    arr.push(r);
    pm.set(r.llm_provider, arr);
  }

  const cellFor = (locale: string, p: LLMProvider): Cell | null => {
    const rows = byLocale.get(locale)?.get(p);
    if (!rows || rows.length === 0) return null; // 未計測
    const mentioned = rows.filter((r) => r.mentioned);
    if (mentioned.length === 0)
      return { mentioned: false, rank: null, sentiment: null };
    // Best (lowest) rank among mentioned rows; null ranks rank worst.
    let best = mentioned[0];
    for (const r of mentioned) {
      if ((r.rank ?? 999) < (best.rank ?? 999)) best = r;
    }
    return { mentioned: true, rank: best.rank, sentiment: best.sentiment };
  };

  // Show every queried inbound market. Order by total_queries (countries prop
  // is pre-sorted), but pull rows that actually have mentions to the top.
  const rows = [...countries].sort((a, b) => {
    const am = results.some((r) => r.locale === a.locale && r.mentioned);
    const bm = results.some((r) => r.locale === b.locale && r.mentioned);
    if (am !== bm) return am ? -1 : 1;
    return b.total_queries - a.total_queries;
  });

  const totalQueries = results.length;
  const totalMentioned = results.filter((r) => r.mentioned).length;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="cc-eyebrow mb-1">Inbound // language grid</div>
            <CardTitle className="text-sm font-semibold text-foreground">
              インバウンド言及マトリクス — 国 × LLM
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              各国の言語で問い合わせたときの掲載順位（1が最上位 / ×は言及なし）
            </p>
          </div>
          {rows.length > 0 && (
            <div className="shrink-0 text-right">
              <div className="text-lg font-bold tabular-nums text-foreground">
                {totalMentioned}
                <span className="text-xs font-normal text-muted-foreground">
                  /{totalQueries}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground">言及 / 総クエリ</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {rows.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            選択中のブランドにインバウンド（多言語）の計測データがありません。
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="sticky left-0 bg-card px-2 py-2.5 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                    国 / 地域
                  </th>
                  {PROVIDERS.map((p) => (
                    <th
                      key={p}
                      className="px-2 py-2.5 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Image
                          src={PROVIDER_LOGOS[p]}
                          alt={PROVIDER_LABELS[p]}
                          width={18}
                          height={18}
                          className="h-[18px] w-[18px]"
                        />
                        <span className="hidden sm:block">{PROVIDER_LABELS[p]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((country) => (
                  <tr
                    key={country.locale}
                    className="border-t border-white/[0.03] transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="sticky left-0 bg-card px-2 py-2 text-left">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm ring-1 ring-white/10">
                          <FlagImg
                            countryCode={country.country_code}
                            alt={country.country_name_ja}
                          />
                        </span>
                        <span className="text-[12px] font-medium text-foreground">
                          {country.country_name_ja}
                        </span>
                      </div>
                    </td>
                    {PROVIDERS.map((p) => (
                      <td key={p} className="px-2 py-2 text-center">
                        <CellPill cell={cellFor(country.locale, p)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CellPill({ cell }: { cell: Cell | null }) {
  if (!cell) {
    return (
      <div
        className="mx-auto flex h-9 w-9 items-center justify-center text-muted-foreground/25"
        title="未計測"
      >
        <Minus className="h-3.5 w-3.5" />
      </div>
    );
  }

  if (!cell.mentioned) {
    return (
      <div
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-muted-foreground/45"
        title="言及なし"
      >
        <X className="h-3.5 w-3.5" />
      </div>
    );
  }

  const sentimentColor =
    cell.sentiment === "negative"
      ? "var(--destructive)"
      : cell.sentiment === "positive"
        ? "var(--success)"
        : "var(--primary)";

  return (
    <div
      className={cn(
        "mx-auto flex h-9 w-9 items-center justify-center rounded-xl border",
        cell.rank === 1 && "shadow-[0_0_14px_-2px_var(--cell-color)]",
      )}
      style={
        {
          "--cell-color": sentimentColor,
          backgroundColor: `color-mix(in srgb, ${sentimentColor} 14%, transparent)`,
          borderColor: `color-mix(in srgb, ${sentimentColor} 38%, transparent)`,
        } as React.CSSProperties
      }
      title={`言及あり${cell.rank ? ` · ${cell.rank}位` : ""}${
        cell.sentiment ? ` · ${cell.sentiment}` : ""
      }`}
    >
      {cell.rank ? (
        <span className="flex items-baseline gap-px" style={{ color: sentimentColor }}>
          <span className="text-[15px] font-bold tabular-nums leading-none">
            {cell.rank}
          </span>
          <span className="text-[8px] font-medium opacity-70">位</span>
        </span>
      ) : (
        <Check className="h-4 w-4" style={{ color: sentimentColor }} />
      )}
    </div>
  );
}
