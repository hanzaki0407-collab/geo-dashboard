import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopDomainRow } from "@/lib/data";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/data";
import type { LLMProvider } from "@/lib/types";
import { ExternalLink, Globe, Filter, Sparkles } from "lucide-react";

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

function labelFor(domain: string): string {
  return DOMAIN_LABEL_JA[domain] ?? domain;
}

// Pick the system's best backlink targets from what's visible:
// score = domain authority × log(citations+1). Returns up to 3 recommended.
function pickRecommended(domains: TopDomainRow[]): Map<string, Authority> {
  const ranked = domains
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
    .slice(0, TOP_RECOMMENDED_LIMIT);
  return new Map(ranked.map((r) => [r.domain, r.auth]));
}

export function CitationsTable({
  domains,
  filterLabel,
  onClearFilter,
  scope = "all",
  activeProvider = null,
}: CitationsTableProps) {
  const max = Math.max(1, ...domains.map((d) => d.citation_count));
  const title = scope === "cell" ? "引用元ドメイン（選択セル）" : "引用元ドメイン Top 10";
  const rangeLabel = scope === "cell" ? "タップしたセルの引用元" : "直近4週";
  const accent = activeProvider ? PROVIDER_COLORS[activeProvider] : null;
  const recommendedMap = pickRecommended(domains);

  return (
    <Card
      className="border border-border bg-card"
      style={accent ? { boxShadow: `inset 3px 0 0 ${accent}` } : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
            {filterLabel && (
              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400">
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {domains.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {scope === "cell"
              ? "このセルの引用元データがありません"
              : "引用元データがまだありません"}
          </p>
        ) : (
          <ol className="space-y-2.5">
            {domains.map((d, i) => {
              const widthPct = (d.citation_count / max) * 100;
              const jaLabel = labelFor(d.domain);
              const recommendation = recommendedMap.get(d.domain);
              const recommended = !!recommendation;
              return (
                <li key={d.domain}>
                  <a
                    href={`https://${d.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group flex items-center gap-2.5 rounded-md p-1 -m-1 transition-colors hover:bg-white/[0.03] ${
                      recommended ? "recommended-backlink" : ""
                    }`}
                    title={
                      recommended
                        ? `${jaLabel} (${d.domain}) — 安全な高権威の被リンク候補`
                        : `${jaLabel} (${d.domain})`
                    }
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/12 text-[10px] font-bold text-amber-400">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex min-w-0 items-center gap-1">
                          <Globe className="h-3 w-3 shrink-0 text-muted-foreground/50" />
                          <span className="truncate text-xs font-semibold text-foreground group-hover:text-primary">
                            {jaLabel}
                          </span>
                          {recommended && (
                            <span
                              className="recommended-pulse inline-flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-1 py-px text-[9px] font-semibold text-emerald-300"
                              title="安全かつ効果的な被リンク候補"
                            >
                              <Sparkles className="h-2 w-2" />
                              推奨
                            </span>
                          )}
                          <ExternalLink className="h-2.5 w-2.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                        </div>
                        <span className="shrink-0 text-[11px] font-semibold text-foreground/70">
                          {d.citation_count}件
                        </span>
                      </div>
                      {jaLabel !== d.domain && (
                        <div className="truncate text-[10px] text-muted-foreground/60">
                          {d.domain}
                        </div>
                      )}
                      {recommendation && (
                        <p className="mt-1 rounded-md border border-emerald-400/25 bg-emerald-400/5 px-2 py-1 text-[10px] leading-snug text-emerald-200/90">
                          <span className="font-semibold text-emerald-300">推奨理由：</span>
                          {recommendation.reason}
                        </p>
                      )}
                      <div className="mt-1 h-[3px] w-full overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {d.providers.map((p) => (
                          <Badge
                            key={p}
                            variant="secondary"
                            className="border-0 bg-white/[0.04] px-1 py-0 text-[9px] text-muted-foreground"
                          >
                            {PROVIDER_LABELS[p as LLMProvider] ?? p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
