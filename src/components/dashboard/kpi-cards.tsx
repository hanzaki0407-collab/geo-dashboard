import { Card, CardContent } from "@/components/ui/card";
import { RadialGauge } from "@/components/ui/radial-gauge";

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
  const positiveShare =
    kpis.mentioned > 0 ? (kpis.positive / kpis.mentioned) * 100 : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* 総言及率 — circle gauge (primary) */}
      <Card className="rise-in">
        <CardContent className="flex items-center gap-4 px-4">
          <RadialGauge value={kpis.mentionRate} max={100} color="var(--primary)">
            <span className="text-glow-primary font-mono text-[15px] font-bold tabular-nums text-primary">
              {kpis.mentionRate}
              <span className="text-[9px]">%</span>
            </span>
          </RadialGauge>
          <div className="min-w-0">
            <div className="cc-eyebrow">Mention</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">
              総言及率
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
              {kpis.mentioned}/{kpis.total} queries
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLMカバレッジ — circle gauge (signal) */}
      <Card className="rise-in">
        <CardContent className="flex items-center gap-4 px-4">
          <RadialGauge
            value={kpis.providerCoverage}
            max={4}
            color="var(--signal)"
          >
            <span className="text-glow-signal font-mono text-[15px] font-bold tabular-nums">
              {kpis.providerCoverage}
              <span className="text-[10px] text-muted-foreground">/4</span>
            </span>
          </RadialGauge>
          <div className="min-w-0">
            <div className="cc-eyebrow">Coverage</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">
              LLMカバレッジ
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
              providers hit
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ポジティブ言及 — circle gauge of positive share (signal) */}
      <Card className="rise-in">
        <CardContent className="flex items-center gap-4 px-4">
          <RadialGauge value={positiveShare} max={100} color="var(--signal)">
            <span className="text-glow-signal font-mono text-[17px] font-bold tabular-nums">
              {kpis.positive}
            </span>
          </RadialGauge>
          <div className="min-w-0">
            <div className="cc-eyebrow">Positive</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">
              ポジティブ言及
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
              {kpis.negative > 0 ? `negative ${kpis.negative}` : "no negatives"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 追跡ブランド — stat in a circular chip (motif echo, no gauge) */}
      <Card className="rise-in">
        <CardContent className="flex items-center gap-4 px-4">
          <div className="flex size-[76px] shrink-0 items-center justify-center rounded-full border border-border bg-white/[0.02]">
            <span className="font-mono text-2xl font-bold tabular-nums text-foreground">
              {brandCount}
            </span>
          </div>
          <div className="min-w-0">
            <div className="cc-eyebrow">Targets</div>
            <div className="mt-1 text-[13px] font-medium text-foreground">
              追跡ブランド
            </div>
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
              tracked weekly
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
