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

// Domains considered safe / high-authority backlinks worth pursuing.
// These get a blink animation as a "recommended" affordance.
const RECOMMENDED_BACKLINK_DOMAINS = new Set([
  "tabelog.com",
  "ikyu.com",
  "restaurant.ikyu.com",
  "retty.me",
  "rtrp.jp",
  "hitosara.com",
  "gnavi.co.jp",
  "hotpepper.jp",
  "ozmall.co.jp",
  "travelbook.co.jp",
  "tripadvisor.com",
  "tripadvisor.jp",
]);

function labelFor(domain: string): string {
  return DOMAIN_LABEL_JA[domain] ?? domain;
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
              const recommended = RECOMMENDED_BACKLINK_DOMAINS.has(d.domain);
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
