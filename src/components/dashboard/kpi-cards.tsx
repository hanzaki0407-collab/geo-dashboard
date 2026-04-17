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
      icon: Target,
      accent: "from-indigo-500 to-blue-500",
    },
    {
      label: "LLMカバレッジ",
      value: `${kpis.providerCoverage} / 4`,
      sub: "言及のあったLLMの数",
      icon: Sparkles,
      accent: "from-purple-500 to-pink-500",
    },
    {
      label: "ポジティブ言及",
      value: kpis.positive,
      sub: `${kpis.negative > 0 ? `ネガティブ ${kpis.negative} 件` : "ネガティブ 0 件"}`,
      icon: TrendingUp,
      accent: "from-emerald-500 to-teal-500",
    },
    {
      label: "追跡ブランド数",
      value: brandCount,
      sub: "週次で言及状況を観測",
      icon: Award,
      accent: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card
            key={item.label}
            className="group relative overflow-hidden border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
          >
            <div
              className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.accent}`}
            />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </div>
                  <div className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                    {item.value}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.sub}</div>
                </div>
                <div
                  className={`rounded-2xl bg-gradient-to-br ${item.accent} p-2.5 text-white shadow-md transition-transform group-hover:scale-110`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
