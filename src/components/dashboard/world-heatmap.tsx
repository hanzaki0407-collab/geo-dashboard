"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import type { MentionsByCountryRow } from "@/lib/data";

/* ── Dot-matrix world map coordinates (simplified) ────────────────
   Each dot is [x, y] on a 200×100 viewport.
   Generated from a simplified world boundary set. */

const MAP_DOTS: [number, number][] = [
  // North America
  ...[
    [30,18],[32,18],[34,18],[36,18],[28,20],[30,20],[32,20],[34,20],[36,20],[38,20],
    [26,22],[28,22],[30,22],[32,22],[34,22],[36,22],[38,22],[40,22],
    [24,24],[26,24],[28,24],[30,24],[32,24],[34,24],[36,24],[38,24],[40,24],
    [22,26],[24,26],[26,26],[28,26],[30,26],[32,26],[34,26],[36,26],[38,26],[40,26],
    [22,28],[24,28],[26,28],[28,28],[30,28],[32,28],[34,28],[36,28],[38,28],
    [24,30],[26,30],[28,30],[30,30],[32,30],[34,30],[36,30],[38,30],
    [26,32],[28,32],[30,32],[32,32],[34,32],[36,32],
    [28,34],[30,34],[32,34],[34,34],[36,34],
    [30,36],[32,36],[34,36],
  ] as [number, number][],
  // Central America & Caribbean
  ...[
    [32,38],[34,38],[30,40],[32,40],
  ] as [number, number][],
  // South America
  ...[
    [42,42],[44,42],[46,42],[40,44],[42,44],[44,44],[46,44],[48,44],
    [38,46],[40,46],[42,46],[44,46],[46,46],[48,46],[50,46],
    [38,48],[40,48],[42,48],[44,48],[46,48],[48,48],[50,48],
    [38,50],[40,50],[42,50],[44,50],[46,50],[48,50],[50,50],
    [40,52],[42,52],[44,52],[46,52],[48,52],
    [40,54],[42,54],[44,54],[46,54],[48,54],
    [42,56],[44,56],[46,56],[48,56],
    [42,58],[44,58],[46,58],
    [44,60],[46,60],
    [44,62],[46,62],
    [46,64],
  ] as [number, number][],
  // Europe
  ...[
    [90,16],[92,16],[94,16],[96,16],
    [86,18],[88,18],[90,18],[92,18],[94,18],[96,18],[98,18],
    [84,20],[86,20],[88,20],[90,20],[92,20],[94,20],[96,20],[98,20],[100,20],
    [84,22],[86,22],[88,22],[90,22],[92,22],[94,22],[96,22],[98,22],[100,22],
    [86,24],[88,24],[90,24],[92,24],[94,24],[96,24],[98,24],[100,24],[102,24],
    [86,26],[88,26],[90,26],[92,26],[94,26],[96,26],[98,26],[100,26],
    [88,28],[90,28],[92,28],[94,28],[96,28],[98,28],[100,28],
    [90,30],[92,30],[94,30],[96,30],[98,30],
  ] as [number, number][],
  // Africa
  ...[
    [88,32],[90,32],[92,32],[94,32],[96,32],
    [86,34],[88,34],[90,34],[92,34],[94,34],[96,34],[98,34],
    [86,36],[88,36],[90,36],[92,36],[94,36],[96,36],[98,36],[100,36],
    [86,38],[88,38],[90,38],[92,38],[94,38],[96,38],[98,38],[100,38],
    [86,40],[88,40],[90,40],[92,40],[94,40],[96,40],[98,40],[100,40],
    [88,42],[90,42],[92,42],[94,42],[96,42],[98,42],[100,42],
    [88,44],[90,44],[92,44],[94,44],[96,44],[98,44],
    [90,46],[92,46],[94,46],[96,46],[98,46],
    [90,48],[92,48],[94,48],[96,48],
    [92,50],[94,50],[96,50],
    [92,52],[94,52],
    [94,54],
  ] as [number, number][],
  // Asia (West / Middle East)
  ...[
    [102,26],[104,26],[106,26],[108,26],[110,26],
    [100,28],[102,28],[104,28],[106,28],[108,28],[110,28],[112,28],
    [102,30],[104,30],[106,30],[108,30],[110,30],[112,30],
    [100,32],[102,32],[104,32],[106,32],[108,32],[110,32],
  ] as [number, number][],
  // Asia (Central / East)
  ...[
    [112,16],[114,16],[116,16],[118,16],[120,16],
    [110,18],[112,18],[114,18],[116,18],[118,18],[120,18],[122,18],[124,18],
    [108,20],[110,20],[112,20],[114,20],[116,20],[118,20],[120,20],[122,20],[124,20],[126,20],
    [110,22],[112,22],[114,22],[116,22],[118,22],[120,22],[122,22],[124,22],[126,22],[128,22],
    [112,24],[114,24],[116,24],[118,24],[120,24],[122,24],[124,24],[126,24],[128,24],
    [112,26],[114,26],[116,26],[118,26],[120,26],[122,26],[124,26],[126,26],[128,26],
    [114,28],[116,28],[118,28],[120,28],[122,28],[124,28],[126,28],[128,28],[130,28],
    [114,30],[116,30],[118,30],[120,30],[122,30],[124,30],[126,30],[128,30],[130,30],
    [116,32],[118,32],[120,32],[122,32],[124,32],[126,32],[128,32],[130,32],
    [118,34],[120,34],[122,34],[124,34],[126,34],[128,34],
    [120,36],[122,36],[124,36],[126,36],
  ] as [number, number][],
  // Southeast Asia
  ...[
    [126,36],[128,36],[130,36],
    [126,38],[128,38],[130,38],[132,38],
    [128,40],[130,40],[132,40],[134,40],
    [130,42],[132,42],[134,42],[136,42],
    [132,44],[134,44],[136,44],[138,44],
    [134,46],[136,46],[138,46],[140,46],
  ] as [number, number][],
  // Japan & Korea
  ...[
    [132,24],[134,24],
    [132,26],[134,26],
    [134,28],[136,28],
    [134,30],[136,30],
    [136,32],
  ] as [number, number][],
  // Taiwan
  ...[
    [132,32],[132,34],
  ] as [number, number][],
  // Australia
  ...[
    [140,52],[142,52],[144,52],[146,52],[148,52],
    [138,54],[140,54],[142,54],[144,54],[146,54],[148,54],[150,54],
    [138,56],[140,56],[142,56],[144,56],[146,56],[148,56],[150,56],
    [140,58],[142,58],[144,58],[146,58],[148,58],[150,58],
    [142,60],[144,60],[146,60],[148,60],
    [144,62],[146,62],
  ] as [number, number][],
];

const REGION_FILTERS: Record<string, string[]> = {
  "全世界": [],
  "アジア": ["JP", "TW", "KR", "TH", "SG", "HK"],
  "北米": ["US"],
  "ヨーロッパ": ["GB"],
  "オセアニア": ["AU"],
};

const REGIONS = Object.keys(REGION_FILTERS);

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

interface WorldHeatmapProps {
  data: MentionsByCountryRow[];
}

export function WorldHeatmap({ data }: WorldHeatmapProps) {
  const [region, setRegion] = useState<string>("全世界");

  const filtered =
    region === "全世界"
      ? data
      : data.filter((c) => REGION_FILTERS[region]?.includes(c.country_code));

  const totalQueries = filtered.reduce((s, c) => s + c.total_queries, 0);
  const totalMentioned = filtered.reduce((s, c) => s + c.mentioned_count, 0);
  const maxQueries = Math.max(1, ...filtered.map((c) => c.total_queries));

  return (
    <Card className="border border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">
              インバウンド言及分析 — 国・地域別
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              各国の言語でLLMに問い合わせた際のブランド言及状況
            </p>
          </div>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground focus:border-primary/40 focus:outline-none"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-start gap-5">
          {/* Map */}
          <div className="flex-1">
            <div className="mb-3 flex items-baseline gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <span className="text-xl font-bold text-foreground">
                {totalMentioned}/{totalQueries}
              </span>
              <span className="text-xs text-muted-foreground">言及 / 総クエリ数</span>
            </div>

            <svg
              viewBox="10 10 160 60"
              className="w-full"
              style={{ maxHeight: 180 }}
            >
              {/* Base dots */}
              {MAP_DOTS.map(([x, y], i) => {
                let highlighted = false;
                let highlightColor = "rgba(255,255,255,0.12)";
                for (const country of data) {
                  const dx = x - country.map_center_x;
                  const dy = y - country.map_center_y;
                  if (Math.sqrt(dx * dx + dy * dy) <= country.map_radius) {
                    highlighted = true;
                    const intensity = Math.min(1, country.mention_rate / 80);
                    highlightColor = `rgba(79, 110, 247, ${0.3 + intensity * 0.6})`;
                    break;
                  }
                }
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={highlighted ? 1.0 : 0.7}
                    fill={highlighted ? highlightColor : "rgba(255,255,255,0.12)"}
                  />
                );
              })}
            </svg>
          </div>

          {/* Country breakdown */}
          <div className="w-52 shrink-0 space-y-2.5">
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                データがありません
              </p>
            ) : (
              filtered.slice(0, 6).map((country) => {
                const barWidth = (country.total_queries / maxQueries) * 100;
                return (
                  <div key={country.locale}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-7 items-center justify-center rounded bg-white/[0.08] text-[9px] font-bold text-muted-foreground">
                          {country.country_code}
                        </span>
                        <span className="text-xs text-foreground">{country.country_name_ja}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-foreground">
                          {country.mention_rate}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-400 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[10px] text-muted-foreground">
                        {country.mentioned_count}/{country.total_queries}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
