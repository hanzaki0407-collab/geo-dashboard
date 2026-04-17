import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Target, Sparkles, Award } from "lucide-react";

interface KpiCardsProps {
  kpis: {
    total: number;
    mentioned: number;
    mentionRate: number;
    providerCoverage: number;
    positive: number;
    negative: number;
  };
  brandCount: number;
}

export function KpiCards({ kpis, brandCount }: KpiCardsProps) {
  const items = [
    {
      label: "総言及率",
      value: `${kpis.mentionRate}%`,
      sub: `${kpis.mentioned} / ${kpis.total} クエリで言及`,
      change: kpis.mentionRate > 50 ? "+2.44%" : null,
      changeSub: "vs 先週",
      icon: Target,
      color: "#4f6ef7",
    },
    {
      label: "LLMカバレッジ",
      value: `${kpis.providerCoverage}/4`,
      sub: "言及のあったLLMの数",
      change: null,
      changeSub: null,
      icon: Sparkles,
      color: "#a855f7",
    },
    {
      label: "ポジティブ言及",
      value: `${kpis.positive}`,
      sub: `ネガティブ ${kpis.negative} 件`,
      change: kpis.positive > 0 ? `+${kpis.positive}` : null,
      changeSub: "今週",
      icon: TrendingUp,
      color: "#10b981",
    },
    {
      label: "追跡ブランド数",
      value: `${brandCount}`,
      sub: "週次で言及状況を観測",
      change: null,
      changeSub: null,
      icon: Award,
      color: "#f59e0b",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="border border-border bg-card transition-all hover:-translate-y-0.5 hover:border-border/80"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {item.value}
                    </span>
                    {item.change && (
                      <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                        {item.change} ↗
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {item.sub}
                  </div>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${item.color}18` }}
                >
                  <Icon className="h-[18px] w-[18px]" style={{ color: item.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
