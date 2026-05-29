import { Card, CardContent } from "@/components/ui/card";
import { Building2, Sparkles, Target, ThumbsUp } from "lucide-react";

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
  // No invented deltas — every number traces to the current selection.
  const items = [
    {
      label: "総言及率",
      value: `${kpis.mentionRate}%`,
      sub: `${kpis.mentioned} / ${kpis.total} クエリで言及`,
      icon: Target,
      color: "#4f6ef7",
    },
    {
      label: "LLMカバレッジ",
      value: `${kpis.providerCoverage}/4`,
      sub: "言及のあったLLM数",
      icon: Sparkles,
      color: "#8a7cf0",
    },
    {
      label: "ポジティブ言及",
      value: `${kpis.positive}`,
      sub: kpis.negative > 0 ? `ネガティブ ${kpis.negative} 件` : "ネガティブなし",
      icon: ThumbsUp,
      color: "#2bb673",
    },
    {
      label: "追跡ブランド数",
      value: `${brandCount}`,
      sub: "週次で言及状況を観測",
      icon: Building2,
      color: "#7c8196",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="rise-in border-border bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-white/10"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-[11px] font-medium text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-1.5 text-2xl font-bold tracking-tight tabular-nums text-foreground">
                    {item.value}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {item.sub}
                  </div>
                </div>
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${item.color}1f` }}
                >
                  <Icon
                    className="h-[18px] w-[18px]"
                    style={{ color: item.color }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
