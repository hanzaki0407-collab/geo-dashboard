"use client";

/**
 * KeywordContentTypes — per-keyword "content type" breakdown that reproduces the
 * reference 3-column layout ("{キーワード} に関連するコンテンツの種類は？"):
 *
 *   ① AIプロンプトで言及されたブランド  ② AIプロンプトで参照された上位ソース  ③ Google検索結果
 *
 * Columns ① and ② are filled from real data:
 *   ① competitors[] on each LatestResultRow (keyword × provider scoped)
 *   ② citation domains, scoped to the brands that own the keyword
 * Each row carries the icon(s) of the LLM(s) it came from (multi-model
 * provenance — the reference's per-row ChatGPT icon, generalised to 4 models).
 *
 * Column ③ (Google organic SERP 1–10) is a deliberate, greyed-out placeholder:
 * we do not collect organic Google results yet (decided 2026-05-29). The column
 * is reserved so the layout matches the reference and is ready for next cycle.
 */

import { useMemo } from "react";
import Image from "next/image";
import { Sparkles, Link2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  type BrandRow,
  type CitationRow,
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

const TOP_LIMIT = 8;

interface KeywordContentTypesProps {
  // Filtered (selected brands × keywords), locale=ja results — source of the
  // competitor (mentioned-brand) column.
  results: LatestResultRow[];
  // Citations already scoped to the selected brands by the parent.
  citations: CitationRow[];
  // Active brands, used to map keyword → owning brand for source scoping.
  brands: BrandRow[];
}

interface BrandMention {
  name: string;
  bestRank: number;
  count: number;
  providers: Set<LLMProvider>;
  isTracked: boolean;
}

interface SourceRef {
  domain: string;
  count: number;
  providers: Set<LLMProvider>;
}

function aggregateBrands(
  rows: LatestResultRow[],
  trackedNames: string[],
): BrandMention[] {
  const map = new Map<string, BrandMention>();
  for (const r of rows) {
    const comps = Array.isArray(r.competitors) ? r.competitors : [];
    for (const c of comps) {
      const name = c.name?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      const rank = c.rank ?? 999;
      const slot = map.get(key) ?? {
        name,
        bestRank: rank,
        count: 0,
        providers: new Set<LLMProvider>(),
        isTracked: matchesTracked(name, trackedNames),
      };
      slot.count += 1;
      slot.providers.add(r.llm_provider);
      if (rank < slot.bestRank) slot.bestRank = rank;
      map.set(key, slot);
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      a.bestRank - b.bestRank ||
      b.count - a.count ||
      a.name.localeCompare(b.name),
  );
}

function aggregateSources(rows: CitationRow[]): SourceRef[] {
  const map = new Map<string, SourceRef>();
  for (const c of rows) {
    if (!c.domain) continue;
    const slot = map.get(c.domain) ?? {
      domain: c.domain,
      count: 0,
      providers: new Set<LLMProvider>(),
    };
    slot.count += 1;
    slot.providers.add(c.llm_provider);
    map.set(c.domain, slot);
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.domain.localeCompare(b.domain),
  );
}

// Small cluster of provider logos = which model(s) surfaced this row.
function ProviderIcons({ providers }: { providers: Set<LLMProvider> }) {
  const list = PROVIDERS.filter((p) => providers.has(p));
  if (list.length === 0) return null;
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {list.map((p) => (
        <span
          key={p}
          title={PROVIDER_LABELS[p]}
          className="inline-flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white/[0.05] ring-1 ring-white/10"
        >
          <Image
            src={PROVIDER_LOGOS[p]}
            alt={PROVIDER_LABELS[p]}
            width={11}
            height={11}
            className="h-[11px] w-[11px]"
          />
        </span>
      ))}
    </span>
  );
}

function Favicon({ domain }: { domain: string }) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white/[0.07]">
      {/* favicon via Google's S2 service — no SERP data, just the site icon. */}
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

function ColumnHeader({
  icon,
  title,
  muted = false,
}: {
  icon: React.ReactNode;
  title: string;
  muted?: boolean;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-1.5">
      <span className={cn(muted ? "text-muted-foreground/50" : "text-primary")}>
        {icon}
      </span>
      <h4
        className={cn(
          "text-[12.5px] font-semibold",
          muted ? "text-muted-foreground/60" : "text-foreground",
        )}
      >
        {title}
      </h4>
    </div>
  );
}

function KeywordCard({
  keyword,
  results,
  citations,
  brands,
}: {
  keyword: string;
  results: LatestResultRow[];
  citations: CitationRow[];
  brands: BrandRow[];
}) {
  const trackedNames = useMemo(() => brands.map((b) => b.name), [brands]);

  const mentionedBrands = useMemo(() => {
    const rows = results.filter((r) => r.keyword === keyword);
    return aggregateBrands(rows, trackedNames).slice(0, TOP_LIMIT);
  }, [results, keyword, trackedNames]);

  const sources = useMemo(() => {
    // Citations carry brand_id + provider but not keyword, so scope by the
    // brands that own this keyword. (Precise per-keyword scoping needs r.keyword
    // exposed on v_citations_with_context — a next-cycle migration.)
    const brandIds = new Set(
      brands.filter((b) => b.keywords.includes(keyword)).map((b) => b.id),
    );
    const rows = citations.filter((c) => brandIds.has(c.brand_id));
    return aggregateSources(rows).slice(0, TOP_LIMIT);
  }, [citations, brands, keyword]);

  if (mentionedBrands.length === 0 && sources.length === 0) return null;

  return (
    <Card className="border border-border bg-card">
      <CardContent className="pt-0">
        <div className="mb-3">
          <h3 className="text-[15px] leading-snug font-semibold">
            <span className="text-primary underline decoration-primary/40 underline-offset-4">
              {keyword}
            </span>
            <span className="text-muted-foreground"> に関連するコンテンツの種類は？</span>
          </h3>
        </div>

        <div className="grid gap-0 lg:grid-cols-3 lg:divide-x lg:divide-white/[0.06]">
          {/* ① AIプロンプトで言及されたブランド */}
          <div className="pb-4 lg:pr-5 lg:pb-0">
            <ColumnHeader
              icon={<Sparkles className="h-4 w-4" />}
              title="AIプロンプトで言及されたブランド"
            />
            {mentionedBrands.length === 0 ? (
              <p className="py-4 text-[11px] text-muted-foreground/60">
                言及データがありません
              </p>
            ) : (
              <ol className="space-y-0.5">
                {mentionedBrands.map((b, i) => (
                  <li
                    key={b.name}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-1.5 py-1 text-[12.5px]",
                      b.isTracked && "bg-emerald-500/[0.08]",
                    )}
                  >
                    <span className="w-4 shrink-0 text-right font-mono text-[11px] text-muted-foreground/60">
                      {i + 1}.
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate",
                        b.isTracked
                          ? "font-semibold text-emerald-300"
                          : "text-foreground",
                      )}
                      title={b.name}
                    >
                      {b.name}
                    </span>
                    <ProviderIcons providers={b.providers} />
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* ② AIプロンプトで参照された上位ソース */}
          <div className="border-t border-white/[0.06] py-4 lg:border-t-0 lg:px-5 lg:py-0">
            <ColumnHeader
              icon={<Link2 className="h-4 w-4" />}
              title="AIプロンプトで参照された上位ソース"
            />
            {sources.length === 0 ? (
              <p className="py-4 text-[11px] text-muted-foreground/60">
                参照ソースデータがありません
              </p>
            ) : (
              <ol className="space-y-0.5">
                {sources.map((s, i) => (
                  <li
                    key={s.domain}
                    className="flex items-center gap-2 rounded-md px-1.5 py-1 text-[12.5px]"
                  >
                    <span className="w-4 shrink-0 text-right font-mono text-[11px] text-muted-foreground/60">
                      {i + 1}.
                    </span>
                    <Favicon domain={s.domain} />
                    <a
                      href={`https://${s.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-foreground transition-colors hover:text-primary"
                      title={s.domain}
                    >
                      {s.domain}
                    </a>
                    <ProviderIcons providers={s.providers} />
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* ③ Google検索結果（次サイクルで収集予定 — プレースホルダ） */}
          <div className="border-t border-white/[0.06] pt-4 lg:border-t-0 lg:pt-0 lg:pl-5">
            <ColumnHeader
              icon={<Search className="h-4 w-4" />}
              title="Google検索結果"
              muted
            />
            <div className="flex flex-col gap-1.5 opacity-50">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1"
                >
                  <span className="w-4 shrink-0 text-right font-mono text-[11px] text-muted-foreground/40">
                    {i + 1}.
                  </span>
                  <span className="h-4 w-4 shrink-0 rounded-sm bg-white/[0.05]" />
                  <span className="h-2 flex-1 rounded-full bg-white/[0.05]" />
                </div>
              ))}
            </div>
            <p className="mt-2 px-1.5 text-[10.5px] leading-snug text-muted-foreground/55">
              オーガニック検索結果（1〜10位）は次サイクルで収集予定です。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function KeywordContentTypes({
  results,
  citations,
  brands,
}: KeywordContentTypesProps) {
  // Distinct keywords present in the filtered results, richest (most rows) first.
  const keywords = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of results) counts.set(r.keyword, (counts.get(r.keyword) ?? 0) + 1);
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([k]) => k);
  }, [results]);

  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="cc-eyebrow mb-1">Content types // GEO gap</div>
        <h2 className="text-sm font-semibold text-foreground">
          キーワード別 コンテンツの種類（AI言及 vs 検索）
        </h2>
        <p className="text-[11px] text-muted-foreground">
          ターゲットキーワードごとに、AIが挙げたブランド・参照ソースを横断比較
        </p>
      </div>
      {keywords.length === 0 ? (
        <Card className="border border-border bg-card">
          <CardContent className="pt-0">
            <p className="py-6 text-center text-xs text-muted-foreground">
              キーワードを選択するとコンテンツの種類が表示されます。
            </p>
          </CardContent>
        </Card>
      ) : (
        keywords.map((kw) => (
          <KeywordCard
            key={kw}
            keyword={kw}
            results={results}
            citations={citations}
            brands={brands}
          />
        ))
      )}
    </div>
  );
}
