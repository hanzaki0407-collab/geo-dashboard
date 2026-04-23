"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { format, parseISO, subWeeks } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PROVIDERS,
  PROVIDER_LABELS,
  PROVIDER_COLORS,
  type MentionRateRow,
} from "@/lib/data";
import type { LLMProvider } from "@/lib/types";

interface TrendChartProps {
  rates: MentionRateRow[];
}

// Synthetic 8-week trajectory per provider so the user can preview the
// chart shape before they have enough real data points.
function buildSampleData() {
  const today = new Date();
  const weeks = Array.from({ length: 8 }, (_, i) =>
    subWeeks(today, 7 - i),
  );
  const trajectories: Record<LLMProvider, number[]> = {
    gemini:         [42, 48, 55, 58, 62, 65, 70, 73],
    google_ai_mode: [35, 38, 40, 45, 48, 52, 55, 58],
    chatgpt:        [50, 53, 51, 56, 60, 64, 67, 71],
    claude:         [28, 30, 35, 41, 45, 48, 52, 56],
  };
  return weeks.map((d, i) => {
    const week = d.toISOString().slice(0, 10);
    const out: Record<string, number | string> = {
      week,
      weekLabel: format(d, "M/d"),
    };
    for (const p of PROVIDERS) out[p] = trajectories[p][i];
    return out;
  });
}

export function TrendChart({ rates }: TrendChartProps) {
  const [showSample, setShowSample] = useState(false);

  const realData = useMemo(() => {
    const weekMap = new Map<string, Record<string, number | string>>();
    for (const r of rates) {
      const week = r.week_start;
      if (!weekMap.has(week)) weekMap.set(week, { week });
      const entry = weekMap.get(week)!;
      const key = r.llm_provider;
      const existing = (entry[`${key}_sum`] as number | undefined) ?? 0;
      const count = (entry[`${key}_n`] as number | undefined) ?? 0;
      entry[`${key}_sum`] = existing + Number(r.mention_rate);
      entry[`${key}_n`] = count + 1;
    }
    return Array.from(weekMap.values())
      .map((entry) => {
        const out: Record<string, number | string> = {
          week: entry.week as string,
          weekLabel: format(parseISO(entry.week as string), "M/d"),
        };
        for (const p of PROVIDERS) {
          const sum = (entry[`${p}_sum`] as number | undefined) ?? 0;
          const n = (entry[`${p}_n`] as number | undefined) ?? 0;
          out[p] = n > 0 ? Math.round((sum / n) * 10) / 10 : 0;
        }
        return out;
      })
      .sort((a, b) => (a.week as string).localeCompare(b.week as string));
  }, [rates]);

  const sampleData = useMemo(() => buildSampleData(), []);
  const data = showSample ? sampleData : realData;

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              LLM別 言及率推移
              {showSample && (
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300">
                  サンプル（仮）
                </span>
              )}
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {showSample
                ? "実データではありません。レイアウト確認用のダミーデータです。"
                : "各LLMでのブランド言及率の週次推移"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSample((s) => !s)}
            className={`shrink-0 rounded-md border px-2 py-1 text-[10px] font-medium transition-colors ${
              showSample
                ? "border-amber-400/40 bg-amber-400/15 text-amber-300"
                : "border-border bg-white/[0.03] text-muted-foreground hover:text-foreground"
            }`}
          >
            {showSample ? "実データに戻す" : "サンプル表示"}
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 10, fill: "#6b6b80" }}
                axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
                tickLine={false}
              />
              <YAxis
                unit="%"
                tick={{ fontSize: 10, fill: "#6b6b80" }}
                axisLine={{ stroke: "rgba(255,255,255,0.04)" }}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                  fontSize: 11,
                  backgroundColor: "rgba(20, 20, 32, 0.95)",
                  color: "#e8e8ef",
                  backdropFilter: "blur(8px)",
                  padding: "8px 12px",
                }}
                formatter={(value, name) => [
                  `${value}%`,
                  PROVIDER_LABELS[name as LLMProvider] ?? String(name),
                ]}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "#6b6b80", paddingTop: 8 }}
                formatter={(value) => PROVIDER_LABELS[value as LLMProvider] ?? value}
              />
              {PROVIDERS.map((p) => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={PROVIDER_COLORS[p]}
                  strokeWidth={2}
                  dot={{ r: 2.5, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {data.length === 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            データがありません。「サンプル表示」で表示イメージを確認できます。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
