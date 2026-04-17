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
    <Card className="border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">LLM別 言及率推移（直近12週）</CardTitle>
        <p className="text-xs text-muted-foreground">各LLMでのブランド言及率の週次推移</p>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="weekLabel"
                tick={{ fontSize: 11, fill: "#8b8b9e" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                unit="%"
                tick={{ fontSize: 11, fill: "#8b8b9e" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontSize: 12,
                  backgroundColor: "#1a1a24",
                  color: "#f0f0f0",
                }}
                formatter={(value, name) => [`${value}%`, PROVIDER_LABELS[name as LLMProvider] ?? String(name)]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#8b8b9e" }}
                formatter={(value) => PROVIDER_LABELS[value as LLMProvider] ?? value}
              />
              {PROVIDERS.map((p) => (
                <Line
                  key={p}
                  type="monotone"
                  dataKey={p}
                  stroke={PROVIDER_COLORS[p]}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
        {data.length === 0 && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            データがありません。週次収集を実行するとここにグラフが表示されます。
          </p>
        )}
      </CardContent>
    </Card>
  );
}
