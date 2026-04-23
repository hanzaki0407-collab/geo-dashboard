"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import createGlobe from "cobe";
import type { MentionsByCountryRow } from "@/lib/data";

/* ── Region filter ───────────────────────────────────── */

const REGION_FILTERS: Record<string, string[]> = {
  "\u5168\u4E16\u754C": [],
  "\u30A2\u30B8\u30A2": ["TW", "KR", "TH", "SG", "HK"],
  "\u6B27\u7C73": ["US", "GB"],
};
const REGIONS = Object.keys(REGION_FILTERS);

/* ── Country coordinates (lat, lng in degrees) ───────── */

const COUNTRY_COORDS: Record<string, [number, number]> = {
  JP: [35.68, 139.69],
  TW: [25.03, 121.57],
  KR: [37.57, 126.98],
  US: [40.71, -74.01],
  TH: [13.76, 100.5],
  AU: [-33.87, 151.21],
  SG: [1.35, 103.82],
  GB: [51.51, -0.13],
  HK: [22.32, 114.17],
};

/* ── Color helpers ───────────────────────────────────── */

function getMentionColor(rate: number): [number, number, number] {
  if (rate >= 60) return [0, 230, 118];
  if (rate >= 30) return [255, 193, 7];
  return [255, 69, 58];
}

function getMentionHex(rate: number): string {
  if (rate >= 60) return "#00e676";
  if (rate >= 30) return "#ffc107";
  return "#ff453a";
}

/* ── Globe + Sonar ───────────────────────────────────── */

function GlobeCanvas({ markers }: { markers: MentionsByCountryRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const phiRef = useRef(0);

  const markerData = useMemo(() => {
    return markers
      .map((m, i) => {
        const coords = COUNTRY_COORDS[m.country_code];
        if (!coords) return null;
        return {
          lat: coords[0],
          lng: coords[1],
          color: getMentionColor(m.mention_rate),
          pulseOffset: i * 0.8,
        };
      })
      .filter(Boolean) as {
      lat: number;
      lng: number;
      color: [number, number, number];
      pulseOffset: number;
    }[];
  }, [markers]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current =
      e.clientX - pointerInteractionMovement.current;
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  }, []);
  const onPointerUp = useCallback(() => {
    pointerInteracting.current = null;
    if (containerRef.current) containerRef.current.style.cursor = "grab";
  }, []);
  const onPointerOut = useCallback(() => {
    pointerInteracting.current = null;
    if (containerRef.current) containerRef.current.style.cursor = "grab";
  }, []);
  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (pointerInteracting.current !== null) {
      pointerInteractionMovement.current =
        e.clientX - pointerInteracting.current;
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !overlayRef.current || !containerRef.current)
      return;

    const overlayCanvas = overlayRef.current;
    const ctx = overlayCanvas.getContext("2d");

    let width = containerRef.current.offsetWidth;
    const onResize = () => {
      if (containerRef.current) width = containerRef.current.offsetWidth;
    };
    window.addEventListener("resize", onResize);

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 3.8,
      theta: 0.15,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 4,
      baseColor: [0.15, 0.15, 0.25],
      markerColor: [0.31, 0.43, 0.97],
      glowColor: [0.12, 0.12, 0.2],
      markers: [],
    });

    const THETA = 0.15;
    const DEG2RAD = Math.PI / 180;

    let animFrame: number;
    const animate = () => {
      if (pointerInteracting.current === null) {
        phiRef.current += 0.003;
      }
      const currentPhi =
        phiRef.current + pointerInteractionMovement.current / 200;

      globe.update({
        phi: currentPhi,
        width: width * 2,
        height: width * 2,
      });

      if (ctx && markerData.length > 0) {
        const cw = width * 2;
        overlayCanvas.width = cw;
        overlayCanvas.height = cw;

        const time = performance.now() / 1000;

        const cosPhi = Math.cos(currentPhi);
        const sinPhi = Math.sin(currentPhi);
        const cosTheta = Math.cos(THETA);
        const sinTheta = Math.sin(THETA);

        for (const m of markerData) {
          const latRad = m.lat * DEG2RAD;
          const lngRad = m.lng * DEG2RAD;

          // Cobe's coordinate system (from source)
          const cosLat = Math.cos(latRad);
          const px = cosLat * Math.cos(lngRad);
          const py = Math.sin(latRad);
          const pz = -cosLat * Math.sin(lngRad);

          // Place on globe surface (radius 1.0)
          const ex = px;
          const ey = py;
          const ez = pz;

          // Cobe's exact projection (from source function O)
          const c = cosPhi * ex + sinPhi * ez;
          const s =
            sinPhi * sinTheta * ex +
            cosTheta * ey -
            cosPhi * sinTheta * ez;
          const depth =
            -sinPhi * cosTheta * ex +
            sinTheta * ey +
            cosPhi * cosTheta * ez;

          if (depth < 0) continue; // behind globe

          // Screen pixel coords (square canvas, scale=1, no offset)
          const screenX = ((c + 1) / 2) * cw;
          const screenY = ((-s + 1) / 2) * cw;
          const [r, g, b] = m.color;
          const vis = Math.min(1, depth * 1.8);

          // Sonar pulse rings
          for (let ring = 0; ring < 3; ring++) {
            const phase =
              ((time * 0.7 + m.pulseOffset + ring * 0.5) % 2.0) / 2.0;
            const ringR = 12 + phase * 80;
            const alpha = Math.max(0, 1 - phase) * 0.4 * vis;
            ctx.beginPath();
            ctx.arc(screenX, screenY, ringR, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
            ctx.lineWidth = 2.5;
            ctx.stroke();
          }

          // Glow halo
          const breathe =
            Math.sin(time * 2.5 + m.pulseOffset) * 0.25 + 0.75;
          const glowR = 32 * breathe;
          const grad = ctx.createRadialGradient(
            screenX,
            screenY,
            0,
            screenX,
            screenY,
            glowR,
          );
          grad.addColorStop(0, `rgba(${r},${g},${b},${0.8 * vis})`);
          grad.addColorStop(0.3, `rgba(${r},${g},${b},${0.25 * vis})`);
          grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(screenX, screenY, glowR, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();

          // Center dot
          ctx.beginPath();
          ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${vis})`;
          ctx.fill();

          // White core
          ctx.beginPath();
          ctx.arc(screenX, screenY, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${0.9 * vis})`;
          ctx.fill();
        }
      }

      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrame);
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [markers, markerData]);

  return (
    <div
      ref={containerRef}
      className="w-full cursor-grab"
      style={{ aspectRatio: "1", position: "relative" }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerOut}
      onPointerMove={onPointerMove}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
      />
      <canvas
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
    </div>
  );
}

/* ── Sonar legend ────────────────────────────────────── */

function SonarLegend() {
  return (
    <div className="mt-3 flex items-center justify-center gap-5 text-[10px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#00e676] shadow-[0_0_8px_#00e676]" />
        High (60%+)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ffc107] shadow-[0_0_8px_#ffc107]" />
        Mid (30-59%)
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#ff453a] shadow-[0_0_8px_#ff453a]" />
        Low (&lt;30%)
      </span>
    </div>
  );
}

/* ── Futuristic country bar ──────────────────────────── */

function CountryBar({
  country,
  maxQueries,
}: {
  country: MentionsByCountryRow;
  maxQueries: number;
}) {
  const barPct = (country.total_queries / maxQueries) * 100;
  const color = getMentionHex(country.mention_rate);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-9 items-center justify-center rounded-md text-base leading-none"
            style={{
              backgroundColor: `${color}18`,
              border: `1px solid ${color}40`,
            }}
            aria-label={country.country_name}
            title={`${country.flag} ${country.country_name_ja}`}
          >
            {country.flag || country.country_code}
          </span>
          <span className="text-sm font-medium text-foreground">
            {country.country_name_ja}
          </span>
          <span
            className="rounded-sm px-1 py-px text-[9px] font-bold tracking-wider"
            style={{
              backgroundColor: `${color}18`,
              color,
              border: `1px solid ${color}30`,
            }}
          >
            {country.country_code}
          </span>
        </div>
        <span className="text-base font-bold tabular-nums" style={{ color }}>
          {country.mention_rate}%
        </span>
      </div>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="relative h-3 flex-1 overflow-hidden rounded-sm bg-white/[0.04]">
          <div className="absolute inset-0 flex">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="h-full border-r border-white/[0.04]"
                style={{ width: "10%" }}
              />
            ))}
          </div>
          <div
            className="relative h-full rounded-sm transition-all duration-500"
            style={{
              width: `${barPct}%`,
              background: `linear-gradient(90deg, ${color}90, ${color})`,
              boxShadow: `0 0 12px ${color}60, inset 0 1px 0 rgba(255,255,255,0.15)`,
            }}
          >
            <div
              className="absolute inset-0 rounded-sm"
              style={{
                background:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
              }}
            />
          </div>
        </div>
        <span className="w-10 text-right text-[11px] font-medium tabular-nums text-muted-foreground">
          {country.mentioned_count}/{country.total_queries}
        </span>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────── */

interface WorldHeatmapProps {
  data: MentionsByCountryRow[];
}

export function WorldHeatmap({ data }: WorldHeatmapProps) {
  const [region, setRegion] = useState<string>("\u5168\u4E16\u754C");

  const filtered =
    region === "\u5168\u4E16\u754C"
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
              {"\u30A4\u30F3\u30D0\u30A6\u30F3\u30C9\u8A00\u53CA\u5206\u6790"}{" "}
              {"\u2014"} {"\u56FD\u30FB\u5730\u57DF\u5225"}
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {"\u5404\u56FD\u306E\u8A00\u8A9E\u3067LLM\u306B\u554F\u3044\u5408\u308F\u305B\u305F\u969B\u306E\u30D6\u30E9\u30F3\u30C9\u8A00\u53CA\u72B6\u6CC1"}
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
        <div className="mb-5 flex items-baseline gap-2">
          <Globe className="h-5 w-5 text-muted-foreground" />
          <span className="text-3xl font-bold text-foreground">
            {totalMentioned}/{totalQueries}
          </span>
          <span className="text-xs text-muted-foreground">
            {"\u8A00\u53CA"} / {"\u7DCF\u30AF\u30A8\u30EA\u6570"}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mx-auto w-full max-w-[560px]">
              <GlobeCanvas markers={data} />
              <SonarLegend />
            </div>
          </div>

          <div className="space-y-4 pt-2 lg:col-span-2">
            {filtered.length === 0 ? (
              <p className="py-16 text-center text-xs text-muted-foreground">
                {"\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093"}
              </p>
            ) : (
              filtered.slice(0, 8).map((country) => (
                <CountryBar
                  key={country.locale}
                  country={country}
                  maxQueries={maxQueries}
                />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
