"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TopDomainRow } from "@/lib/data";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { ChevronDown, ExternalLink, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface CitationsTableProps {
  domains: TopDomainRow[];
  filterLabel?: string | null;
  onClearFilter?: () => void;
  scope?: "all" | "cell";
  activeProvider?: LLMProvider | null;
}

// Map known domains to user-friendly Japanese display names.
// Falls back to the raw domain when not in the map.
const DOMAIN_LABEL_JA: Record<string, string> = {
  "tabelog.com": "食べログ",
  "ikyu.com": "一休.com",
  "restaurant.ikyu.com": "一休.comレストラン",
  "retty.me": "Retty",
  "rtrp.jp": "RETRIP",
  "travelbook.co.jp": "トラベルブック",
  "gj75700.gorp.jp": "ぐるなび店舗ページ",
  "gnavi.co.jp": "ぐるなび",
  "umamibites.com": "Umami Bites",
  "autoreserve.com": "AutoReserve",
  "shabushabu-let-us.com": "しゃぶしゃぶ Let Us",
  "hitosara.com": "ヒトサラ",
  "hotpepper.jp": "ホットペッパーグルメ",
  "ozmall.co.jp": "OZmall",
  "tripadvisor.com": "Tripadvisor",
  "tripadvisor.jp": "Tripadvisor 日本",
  "google.com": "Google",
  "maps.google.com": "Google マップ",
  "instagram.com": "Instagram",
  "youtube.com": "YouTube",
  "x.com": "X (Twitter)",
  "twitter.com": "X (Twitter)",
  "facebook.com": "Facebook",
};

// Domain authority + reason. Authority is a domain-level prior the system
// uses to rank the *most* effective backlink targets. Reason is shown to the
// user so they understand why a specific site is recommended.
type Authority = { score: number; reason: string };
const DOMAIN_AUTHORITY: Record<string, Authority> = {
  "tabelog.com":           { score: 1.00, reason: "国内最大級のグルメDB。AI検索でも常に上位参照され、ここに載るだけで言及率が大きく伸びる。" },
  "ikyu.com":              { score: 0.92, reason: "高級店向け予約大手。客単価の高い来店に直結し、AIの推奨候補にも採用されやすい。" },
  "restaurant.ikyu.com":   { score: 0.92, reason: "高級店向け予約大手。客単価の高い来店に直結し、AIの推奨候補にも採用されやすい。" },
  "retty.me":              { score: 0.78, reason: "実名口コミ系の主要メディア。掲載数が多いほどAIが「信頼できる店」と判定しやすい。" },
  "hitosara.com":          { score: 0.72, reason: "シェフ情報＋予約サイト。検索エンジン評価が高く、AIの根拠記事として参照されやすい。" },
  "gnavi.co.jp":           { score: 0.70, reason: "予約・口コミ大手。安定的な参照流入と、AI回答での店舗カード露出が見込める。" },
  "rtrp.jp":               { score: 0.55, reason: "旅行系まとめメディア。訪日・観光ワードでのAI言及に効きやすい。" },
  "hotpepper.jp":          { score: 0.55, reason: "予約大手。クーポン経由の来店動機が強く、若年層の認知拡大に有効。" },
  "ozmall.co.jp":          { score: 0.50, reason: "女性向け予約・特集メディア。デート・記念日キーワードに強い。" },
  "travelbook.co.jp":      { score: 0.48, reason: "旅行ガイド系。インバウンド検索の根拠記事になりやすい。" },
  "tripadvisor.com":       { score: 0.65, reason: "世界最大級の口コミプラットフォーム。海外ユーザー・AI双方から参照される。" },
  "tripadvisor.jp":        { score: 0.65, reason: "世界最大級の口コミプラットフォーム。海外ユーザー・AI双方から参照される。" },
};

const TOP_RECOMMENDED_LIMIT = 3;
const COLLAPSED_COUNT = 4;

function labelFor(domain: string): string {
  return DOMAIN_LABEL_JA[domain] ?? domain;
}

// Pick the system's best backlink targets from what's visible, ordered best-first.
// score = domain authority × log(citations+1). Returns up to 3 recommended.
function pickRecommended(
  domains: TopDomainRow[],
): { domain: string; auth: Authority }[] {
  return domains
    .map((d) => {
      const auth = DOMAIN_AUTHORITY[d.domain];
      if (!auth) return null;
      return {
        domain: d.domain,
        auth,
        rank: auth.score * Math.log(d.citation_count + 1),
      };
    })
    .filter((x): x is { domain: string; auth: Authority; rank: number } => x !== null)
    .sort((a, b) => b.rank - a.rank)
    .slice(0, TOP_RECOMMENDED_LIMIT)
    .map(({ domain, auth }) => ({ domain, auth }));
}

// Animated "狙い目" reticle — radar ping ring + fixed target. Recommended only.
function TargetReticle() {
  return (
    <span className="relative inline-flex h-7 w-7 items-center justify-center">
      <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] text-[#2bd39a]" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.5" className="target-ping" />
        <circle cx="12" cy="12" r="5.4" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      </svg>
    </span>
  );
}

export function CitationsTable({
  domains,
  filterLabel,
  onClearFilter,
  scope = "all",
  activeProvider = null,
}: CitationsTableProps) {
  const [bodyOpen, setBodyOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const max = Math.max(1, ...domains.map((d) => d.citation_count));
  const title = scope === "cell" ? "引用元ドメイン（選択セル）" : "引用元ドメイン Top 10";
  const rangeLabel = scope === "cell" ? "タップしたセルの引用元" : "直近4週";
  const accent = activeProvider ? PROVIDER_COLORS[activeProvider] : null;

  const recommended = pickRecommended(domains);
  const recommendedMap = new Map(recommended.map((r) => [r.domain, r.auth]));
  // Recommended domains float to the top (best-first); the rest keep their
  // citation-count order.
  const ordered = [
    ...recommended.map((r) => domains.find((d) => d.domain === r.domain)!),
    ...domains.filter((d) => !recommendedMap.has(d.domain)),
  ].filter(Boolean) as TopDomainRow[];

  // Keep the panel inside the viewport: show recommended + a few by default.
  const visibleCount = Math.max(COLLAPSED_COUNT, recommended.length);
  const visible = expanded ? ordered : ordered.slice(0, visibleCount);
  const hiddenCount = ordered.length - visible.length;

  return (
    <Card
      className="border border-border bg-card"
      style={accent ? { boxShadow: `inset 3px 0 0 ${accent}` } : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="cc-eyebrow mb-1">Citations</div>
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground/70">
              各AIが回答時に参照したドメイン（掲載されると引用されやすい＝GEOの狙い目）
            </p>
            {filterLabel && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
                <Filter className="h-2.5 w-2.5" />
                <span className="truncate">{filterLabel}</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground">{rangeLabel}</span>
            {onClearFilter && filterLabel && (
              <button
                type="button"
                onClick={onClearFilter}
                className="rounded-md border border-border bg-white/[0.03] px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                解除
              </button>
            )}
            <button
              type="button"
              onClick={() => setBodyOpen((v) => !v)}
              aria-label={bodyOpen ? "折りたたむ" : "開く"}
              aria-expanded={bodyOpen}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  bodyOpen ? "" : "-rotate-90",
                )}
              />
            </button>
          </div>
        </div>
      </CardHeader>

      {bodyOpen && (
        <CardContent className="pt-0">
          {domains.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              {scope === "cell"
                ? "このセルの引用元データがありません"
                : "引用元データがまだありません"}
            </p>
          ) : (
            <>
              <ol className="space-y-2.5">
                {visible.map((d, i) => {
                  const widthPct = (d.citation_count / max) * 100;
                  const jaLabel = labelFor(d.domain);
                  const recommendation = recommendedMap.get(d.domain);
                  const recommended = !!recommendation;
                  return (
                    <li key={d.domain}>
                      <div
                        className={cn(
                          "rounded-xl p-2.5 transition-colors hover:bg-white/[0.03]",
                          recommended &&
                            "border border-[#2bd39a]/25 bg-[#2bd39a]/[0.04]",
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {recommended ? (
                            <TargetReticle />
                          ) : (
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/12 text-[10px] font-bold text-primary">
                              {i + 1}
                            </div>
                          )}
                          <a
                            href={`https://${d.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex min-w-0 flex-1 items-center gap-1"
                            title={`${jaLabel}（${d.domain}）`}
                          >
                            <span className="truncate text-[13px] font-semibold text-foreground group-hover:text-primary">
                              {jaLabel}
                            </span>
                            <ExternalLink className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                          </a>
                          {recommended && (
                            <span
                              className="shrink-0 rounded-full border border-[#2bd39a]/35 bg-[#2bd39a]/10 px-1.5 py-px text-[9px] font-semibold text-[#2bd39a]"
                              title={recommendation?.reason}
                            >
                              狙い目
                            </span>
                          )}
                          <span className="shrink-0 text-[13px] font-bold tabular-nums text-foreground">
                            {d.citation_count}
                            <span className="ml-px text-[9px] font-normal text-muted-foreground">
                              件
                            </span>
                          </span>
                        </div>
                        {jaLabel !== d.domain && (
                          <div className="mt-0.5 ml-[34px] truncate text-[10px] text-muted-foreground/55">
                            {d.domain}
                          </div>
                        )}
                        <div className="mt-1.5 ml-[34px] flex flex-wrap items-center gap-1">
                          <span className="text-[9.5px] text-muted-foreground/55">参照AI</span>
                          {d.providers.map((p) => {
                            const color = PROVIDER_COLORS[p as LLMProvider];
                            return (
                              <span
                                key={p}
                                className="inline-flex items-center rounded-full px-1.5 py-px text-[9.5px] font-medium"
                                style={{
                                  backgroundColor: color
                                    ? `color-mix(in srgb, ${color} 18%, transparent)`
                                    : "rgba(255,255,255,0.06)",
                                  color: color ?? "var(--muted-foreground)",
                                }}
                              >
                                {PROVIDER_LABELS[p as LLMProvider] ?? p}
                              </span>
                            );
                          })}
                        </div>
                        <div className="mt-1.5 ml-[34px] h-[3px] overflow-hidden rounded-full bg-white/[0.05]">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${widthPct}%`,
                              background: recommended ? "#2bd39a" : "var(--primary)",
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              {(hiddenCount > 0 || expanded) && ordered.length > visibleCount && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-border bg-white/[0.02] py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {expanded ? (
                    "折りたたむ"
                  ) : (
                    <>もっと見る（+{hiddenCount}）</>
                  )}
                </button>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
