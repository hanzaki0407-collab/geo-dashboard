"use client";

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
import { format, parseISO } from "date-fns";
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

export function TrendChart({ rates }: TrendChartProps) {
  const weekMap = new Map<string, Record<string, number | string>>();

  for (const r of rates) {
    const week = r.week_start;
    if (!weekMap.has(week)) {
      weekMap.set(week, { week });
    }
    const entry = weekMap.get(week)!;
    const key = r.llm_provider;
    const existing = (entry[`${key}_sum`] as number | undefined) ?? 0;
    const count = (entry[`${key}_n`] as number | undefined) ?? 0;
    entry[`${key}_sum`] = existing + Number(r.mention_rate);
    entry[`${key}_n`] = count + 1;
  }

  const data = Array.from(weekMap.values())
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

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              LLM別 言及率推移
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">各LLMでのブランド言及率の週次推移</p>
          </div>
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
            データがありません。週次収集を実行するとここにグラフが表示されます。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
