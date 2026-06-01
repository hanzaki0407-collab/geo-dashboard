"use client";

import { useEffect, useState } from "react";

interface RadialGaugeProps {
  /** Current value (same unit as max). */
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  /** Arc color — CSS color or var(). */
  color?: string;
  trackColor?: string;
  glow?: boolean;
  children?: React.ReactNode;
}

/**
 * RadialGauge — an SVG ring that animates its fill on mount. Used for the KPI
 * "circle motif" (mention rate, coverage, positive share).
 */
export function RadialGauge({
  value,
  max = 100,
  size = 76,
  stroke = 7,
  color = "var(--primary)",
  trackColor = "rgba(255,255,255,0.07)",
  glow = true,
  children,
}: RadialGaugeProps) {
  const pct = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;

  // Animate from empty → target on mount.
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - progress)}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)",
            filter: glow ? `drop-shadow(0 0 5px ${color})` : undefined,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        {children}
      </div>
    </div>
  );
}
