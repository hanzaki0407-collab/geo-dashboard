import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LatestResultRow } from "@/lib/data";
import { PROVIDER_LABELS, PROVIDER_COLORS } from "@/lib/data";
import { Trophy, AlertTriangle, CheckCircle2 } from "lucide-react";

interface CompetitorsListProps {
  results: LatestResultRow[];
}

type BrandGroup = {
  brandId: string;
  brandName: string;
  companyName: string;
  rows: LatestResultRow[];
};

function groupByBrand(rows: LatestResultRow[]): BrandGroup[] {
  const map = new Map<string, BrandGroup>();
  for (const r of rows) {
    const existing = map.get(r.brand_id);
    if (existing) {
      existing.rows.push(r);
    } else {
      map.set(r.brand_id, {
        brandId: r.brand_id,
        brandName: r.brand_name,
        companyName: r.company_name,
        rows: [r],
      });
    }
  }
  return [...map.values()].sort((a, b) => a.brandName.localeCompare(b.brandName));
}

export function CompetitorsList({ results }: CompetitorsListProps) {
  const groups = groupByBrand(
    results.filter((r) => Array.isArray(r.competitors) && r.competitors.length > 0),
  );

  if (groups.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            LLMランキング（GEOギャップ分析）
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            各LLMが実際に挙げた店舗。御社ブランドが含まれていなければ「記事系SEO不足」の指標。
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="py-6 text-center text-xs text-muted-foreground">
            ランキングデータがまだありません。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground">
          LLMランキング（GEOギャップ分析）
        </h2>
        <p className="text-[11px] text-muted-foreground">
          各LLMが実際に挙げた店舗。御社ブランドが含まれていなければ「記事系SEO不足」の指標。
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {groups.map((g) => (
          <BrandCard key={g.brandId} group={g} />
        ))}
      </div>
    </div>
  );
}

function BrandCard({ group }: { group: BrandGroup }) {
  const sortedRows = [...group.rows].sort((a, b) => {
    if (a.keyword !== b.keyword) return a.keyword.localeCompare(b.keyword);
    return a.llm_provider.localeCompare(b.llm_provider);
  });
  const mentionedCount = sortedRows.filter((r) => r.mentioned).length;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              {group.brandName}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground">{group.companyName}</p>
          </div>
          <Badge
            className={`border-0 px-2 py-0 text-[10px] ${
              mentionedCount === 0
                ? "bg-rose-500/15 text-rose-400"
                : mentionedCount === sortedRows.length
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-amber-500/15 text-amber-400"
            }`}
          >
            {mentionedCount}/{sortedRows.length} 言及
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {sortedRows.map((r) => (
          <RankingBlock key={r.id} row={r} />
        ))}
      </CardContent>
    </Card>
  );
}

function RankingBlock({ row }: { row: LatestResultRow }) {
  const competitors = row.competitors ?? [];
  const providerColor = PROVIDER_COLORS[row.llm_provider];
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs">
        <Badge
          className="border-0 px-1.5 py-0 text-[10px] font-medium text-white"
          style={{ backgroundColor: providerColor }}
        >
          {PROVIDER_LABELS[row.llm_provider]}
        </Badge>
        <span className="text-muted-foreground">「{row.keyword}」</span>
        {row.mentioned ? (
          <Badge className="border-0 bg-emerald-500/15 px-1.5 py-0 text-[10px] text-emerald-400">
            <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
            言及あり (rank {row.rank ?? "?"})
          </Badge>
        ) : (
          <Badge className="border-0 bg-rose-500/15 px-1.5 py-0 text-[10px] text-rose-400">
            <AlertTriangle className="mr-0.5 h-2.5 w-2.5" />
            未言及
          </Badge>
        )}
      </div>
      <ol className="space-y-1">
        {competitors.map((c) => {
          const isTargetBrand =
            c.name.includes(row.brand_name) || row.brand_name.includes(c.name);
          return (
            <li
              key={`${row.id}-${c.rank}`}
              className={`flex items-start gap-2 rounded px-2 py-1 text-[11px] ${
                isTargetBrand ? "bg-emerald-500/10 text-emerald-100" : "text-muted-foreground"
              }`}
            >
              <span className="flex-shrink-0 font-mono font-medium text-foreground/70">
                {c.rank === 1 ? <Trophy className="h-3 w-3 text-amber-400" /> : `#${c.rank}`}
              </span>
              <div className="flex-1">
                <div
                  className={`font-medium ${
                    isTargetBrand ? "text-emerald-300" : "text-foreground"
                  }`}
                >
                  {c.name}
                </div>
                {c.description && (
                  <div className="text-[10px] text-muted-foreground/80">{c.description}</div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
