import { Card, CardContent } from "@/components/ui/card";
import { Building2, Sparkles, Target, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";

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
  // Terminal "readouts" — mono numerals, glow on the live metrics. No invented
  // deltas; every value traces to the current selection.
  const items = [
    {
      code: "MENTION",
      label: "総言及率",
      value: `${kpis.mentionRate}`,
      unit: "%",
      sub: `${kpis.mentioned}/${kpis.total} queries`,
      icon: Target,
      glow: "primary" as const,
    },
    {
      code: "COVERAGE",
      label: "LLMカバレッジ",
      value: `${kpis.providerCoverage}`,
      unit: "/4",
      sub: "providers hit",
      icon: Sparkles,
      glow: "signal" as const,
    },
    {
      code: "POSITIVE",
      label: "ポジティブ言及",
      value: `${kpis.positive}`,
      unit: "",
      sub: kpis.negative > 0 ? `negative ${kpis.negative}` : "no negatives",
      icon: ThumbsUp,
      glow: "signal" as const,
    },
    {
      code: "TARGETS",
      label: "追跡ブランド",
      value: `${brandCount}`,
      unit: "",
      sub: "tracked weekly",
      icon: Building2,
      glow: "muted" as const,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((it) => {
        const Icon = it.icon;
        const numClass =
          it.glow === "primary"
            ? "text-primary text-glow-primary"
            : it.glow === "signal"
              ? "text-glow-signal"
              : "text-foreground";
        return (
          <Card key={it.code} className="rise-in">
            <CardContent className="px-4">
              <div className="flex items-center justify-between">
                <span className="cc-eyebrow">{it.code}</span>
                <Icon className="h-4 w-4 text-muted-foreground/45" />
              </div>
              <div className="mt-3 flex items-baseline gap-0.5">
                <span
                  className={cn(
                    "font-mono text-[30px] leading-none font-semibold tabular-nums",
                    numClass,
                  )}
                >
                  {it.value}
                </span>
                <span className="font-mono text-base text-muted-foreground">
                  {it.unit}
                </span>
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[11px] text-foreground/70">{it.label}</span>
                <span className="truncate font-mono text-[10px] text-muted-foreground/55">
                  {it.sub}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
