"use client";

/**
 * PromptAnswers — reproduces the reference "プロンプト概要 / AI回答" view, one card
 * per selected keyword. It replaces the old LLMランキング list.
 *
 * For a keyword × LLM, it shows that answer as the reference does: a ranked list
 * of recommended shops with the AI's description, plus the sources the AI cited.
 * The key addition the user asked for: each shop name links straight to Google
 * Maps (which natively shows address / hours / reviews — data we don't collect,
 * so the Maps jump is the substitute, by design).
 *
 * Data: shop name + rank + description come from competitors[]; sources come from
 * citations (answer-level — our citations aren't attributed to individual shops,
 * so they're shown once per answer rather than per shop). Our own tracked brand is
 * highlighted and a 掲載/未掲載 badge preserves the GEO-gap signal.
 */

import { useMemo, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { MapPin, ExternalLink, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  type BrandRow,
  type CitationRow,
  type Competitor,
  type LatestResultRow,
} from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { matchesTracked } from "@/lib/brand-match";
import { cn } from "@/lib/utils";

const PROVIDER_LOGOS: Record<LLMProvider, string> = {
  gemini: "/logos/gemini.svg",
  google_ai_mode: "/logos/google-ai.svg",
  chatgpt: "/logos/chatgpt.svg",
  claude: "/logos/claude.svg",
};

interface PromptAnswersProps {
  results: LatestResultRow[];
  citations: CitationRow[];
  brands: BrandRow[];
}

// Direct Google Maps search for a shop — opens address / hours / reviews natively.
function mapsUrl(name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
}

interface SourceChip {
  domain: string;
  url: string;
  count: number;
}

function ProviderLogo({ provider, size = 16 }: { provider: LLMProvider; size?: number }) {
  return (
    <Image
      src={PROVIDER_LOGOS[provider]}
      alt={PROVIDER_LABELS[provider]}
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  );
}

function Favicon({ domain }: { domain: string }) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white/[0.08]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
        alt=""
        loading="lazy"
        className="h-4 w-4 object-contain"
      />
    </span>
  );
}

function PromptCard({
  keyword,
  rows,
  citations,
  brands,
}: {
  keyword: string;
  rows: LatestResultRow[];
  citations: CitationRow[];
  brands: BrandRow[];
}) {
  const trackedNames = useMemo(() => brands.map((b) => b.name), [brands]);
  const ownerNames = useMemo(
    () => brands.filter((b) => b.keywords.includes(keyword)).map((b) => b.name),
    [brands, keyword],
  );

  // Providers that returned this keyword, in canonical order.
  const providers = useMemo(
    () => PROVIDERS.filter((p) => rows.some((r) => r.llm_provider === p)),
    [rows],
  );

  // The richest answer per provider (most listed shops) is the canonical one —
  // we query once per brand, so rows for the same keyword×provider repeat the
  // same answer; pick the fullest.
  const canonicalByProvider = useMemo(() => {
    const map = new Map<LLMProvider, LatestResultRow>();
    for (const p of providers) {
      const candidates = rows.filter((r) => r.llm_provider === p);
      let best = candidates[0];
      for (const r of candidates) {
        const len = Array.isArray(r.competitors) ? r.competitors.length : 0;
        const bestLen = Array.isArray(best.competitors) ? best.competitors.length : 0;
        if (len > bestLen) best = r;
      }
      if (best) map.set(p, best);
    }
    return map;
  }, [providers, rows]);

  // Default to the provider with the fullest answer.
  const defaultProvider = useMemo(() => {
    let best = providers[0];
    let bestLen = -1;
    for (const p of providers) {
      const row = canonicalByProvider.get(p);
      const len = row && Array.isArray(row.competitors) ? row.competitors.length : 0;
      if (len > bestLen) {
        bestLen = len;
        best = p;
      }
    }
    return best;
  }, [providers, canonicalByProvider]);

  const [provider, setProvider] = useState<LLMProvider>(defaultProvider);
  const [tab, setTab] = useState<"answer" | "brands">("answer");

  const activeProvider = providers.includes(provider) ? provider : defaultProvider;
  const row = canonicalByProvider.get(activeProvider) ?? null;
  const shops: Competitor[] = useMemo(() => {
    const list = row && Array.isArray(row.competitors) ? row.competitors : [];
    return [...list].sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
  }, [row]);

  const sources: SourceChip[] = useMemo(() => {
    const brandIds = new Set(
      brands.filter((b) => b.keywords.includes(keyword)).map((b) => b.id),
    );
    const byDomain = new Map<string, SourceChip>();
    for (const c of citations) {
      if (c.llm_provider !== activeProvider) continue;
      if (!brandIds.has(c.brand_id)) continue;
      if (!c.domain) continue;
      const slot = byDomain.get(c.domain) ?? {
        domain: c.domain,
        url: c.url || `https://${c.domain}`,
        count: 0,
      };
      slot.count += 1;
      byDomain.set(c.domain, slot);
    }
    return [...byDomain.values()].sort((a, b) => b.count - a.count);
  }, [citations, brands, keyword, activeProvider]);

  // GEO-gap signal: is our own brand for this keyword present in the answer?
  // (Plain compute — let the React Compiler memoize; a manual useMemo with an
  // early-return loop can't be preserved by it.)
  const ownerIdx = shops.findIndex((s) => matchesTracked(s.name, ownerNames));
  const ownerHit =
    ownerIdx === -1 ? null : { rank: shops[ownerIdx].rank ?? ownerIdx + 1 };

  const date = row?.collected_at
    ? format(parseISO(row.collected_at), "yyyy年M月d日")
    : null;

  return (
    <Card className="border border-border bg-card">
      <CardContent className="flex flex-col gap-4 pt-0">
        {/* Header — prompt subject + provider eyebrow */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <ProviderLogo provider={activeProvider} size={15} />
            <span className="text-[11px] font-medium text-muted-foreground">
              {PROVIDER_LABELS[activeProvider]}プロンプト
            </span>
          </div>
          <h3 className="text-[17px] leading-snug font-semibold text-primary">
            「{keyword}」でおすすめはどこですか？
          </h3>

          {/* Provider switcher */}
          {providers.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {providers.map((p) => {
                const on = p === activeProvider;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      on
                        ? "border-primary/40 bg-primary/12 text-foreground"
                        : "border-border bg-white/[0.02] text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ProviderLogo provider={p} size={13} />
                    {PROVIDER_LABELS[p]}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs: 回答 / 表示されたブランド */}
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-white/[0.02] p-1">
          <button
            type="button"
            onClick={() => setTab("answer")}
            className={cn(
              "rounded-lg py-1.5 text-[12px] font-medium transition-colors",
              tab === "answer"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            回答
          </button>
          <button
            type="button"
            onClick={() => setTab("brands")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium transition-colors",
              tab === "brands"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            表示されたブランド
            <span className="rounded-full bg-primary/15 px-1.5 text-[10px] font-bold text-primary">
              {shops.length}
            </span>
          </button>
        </div>

        {/* GEO-gap badge + date */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {ownerHit ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              御社ブランド掲載（{ownerHit.rank}位）
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/12 px-2 py-0.5 text-[11px] font-medium text-rose-400">
              <AlertTriangle className="h-3 w-3" />
              御社ブランド未掲載 — 記事系SEOの狙い目
            </span>
          )}
          {date && (
            <span className="text-[11px] text-muted-foreground">{date}の回答</span>
          )}
        </div>

        {shops.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            このLLMの回答にランキングデータがありません。
          </p>
        ) : tab === "answer" ? (
          <ol className="flex flex-col gap-3">
            {shops.map((c, i) => {
              const isOurs = matchesTracked(c.name, trackedNames);
              return (
                <li
                  key={`${c.name}-${i}`}
                  className={cn(
                    "rounded-xl border p-3",
                    isOurs
                      ? "border-emerald-500/25 bg-emerald-500/[0.06]"
                      : "border-white/[0.06] bg-white/[0.02]",
                  )}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="shrink-0 font-mono text-[12px] font-semibold text-muted-foreground/70">
                      {c.rank ?? i + 1}.
                    </span>
                    <a
                      href={mapsUrl(c.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "group inline-flex items-center gap-1 text-[14px] font-semibold transition-colors",
                        isOurs
                          ? "text-emerald-300 hover:text-emerald-200"
                          : "text-foreground hover:text-primary",
                      )}
                      title={`Googleマップで「${c.name}」を開く`}
                    >
                      {c.name}
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                    </a>
                  </div>
                  {c.description && (
                    <p className="mt-1 pl-5 text-[12px] leading-relaxed text-foreground/70">
                      {c.description}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        ) : (
          <ol className="flex flex-col gap-1">
            {shops.map((c, i) => {
              const isOurs = matchesTracked(c.name, trackedNames);
              return (
                <li
                  key={`${c.name}-${i}`}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px]",
                    isOurs ? "bg-emerald-500/[0.08]" : "",
                  )}
                >
                  <span className="w-5 shrink-0 text-right font-mono text-[11px] text-muted-foreground/60">
                    {c.rank ?? i + 1}.
                  </span>
                  <a
                    href={mapsUrl(c.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group inline-flex min-w-0 items-center gap-1 truncate font-medium transition-colors",
                      isOurs
                        ? "text-emerald-300 hover:text-emerald-200"
                        : "text-foreground hover:text-primary",
                    )}
                  >
                    <span className="truncate">{c.name}</span>
                    <MapPin className="h-3 w-3 shrink-0 opacity-60 transition-opacity group-hover:opacity-100" />
                  </a>
                </li>
              );
            })}
          </ol>
        )}

        {/* Sources cited in this answer (answer-level — favicon chips) */}
        {sources.length > 0 && (
          <div className="border-t border-white/[0.06] pt-3">
            <div className="cc-eyebrow mb-1.5">参照ソース</div>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <a
                  key={s.domain}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/[0.03] px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                  title={s.domain}
                >
                  <Favicon domain={s.domain} />
                  <span className="max-w-[180px] truncate">{s.domain}</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-50" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PromptAnswers({ results, citations, brands }: PromptAnswersProps) {
  // Distinct keywords present, richest (most rows) first.
  const keywords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of results) counts.set(r.keyword, (counts.get(r.keyword) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k);
  }, [results]);

  const rowsByKeyword = useMemo(() => {
    const map = new Map<string, LatestResultRow[]>();
    for (const r of results) {
      const arr = map.get(r.keyword) ?? [];
      arr.push(r);
      map.set(r.keyword, arr);
    }
    return map;
  }, [results]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="cc-eyebrow mb-1">AI answers // prompt overview</div>
        <h2 className="text-sm font-semibold text-foreground">AI回答（プロンプト概要）</h2>
        <p className="text-[11px] text-muted-foreground">
          各LLMがキーワードに対して実際に挙げた店舗。店名はGoogleマップに直接リンク。
        </p>
      </div>
      {keywords.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="pt-0">
            <p className="py-6 text-center text-xs text-muted-foreground">
              キーワードを選択するとAIの回答が表示されます。
            </p>
          </CardContent>
        </Card>
      ) : (
        keywords.map((kw) => (
          <PromptCard
            key={kw}
            keyword={kw}
            rows={rowsByKeyword.get(kw) ?? []}
            citations={citations}
            brands={brands}
          />
        ))
      )}
    </div>
  );
}
