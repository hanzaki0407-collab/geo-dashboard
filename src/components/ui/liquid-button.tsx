"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * LiquidButton — a button whose surface "fills with water" on click: a tinted
 * layer rises from the bottom with a soft overshoot and slosh, holds, then
 * fades. Use for prominent actions; the dense/icon controls keep the plain
 * Button. Honors prefers-reduced-motion (the fill is suppressed in globals.css).
 */
const liquidButtonVariants = cva(
  "group/liquid relative isolate inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border text-sm font-medium whitespace-nowrap outline-none transition-[transform,background-color,border-color,box-shadow] select-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-[0_6px_18px_-8px_color-mix(in_srgb,var(--primary)_70%,transparent)] hover:bg-primary/90",
        outline:
          "border-border bg-card/50 text-foreground hover:bg-muted hover:text-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "border-transparent text-foreground hover:bg-muted",
      },
      size: {
        default: "h-9 gap-1.5 px-3.5",
        sm: "h-8 gap-1 px-3 text-[0.8rem]",
        lg: "h-10 gap-2 px-5",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

// Per-variant water tint. On the solid primary button a white sheen reads as
// water; on translucent variants we tint with the accent.
const LIQUID_COLOR: Record<string, string> = {
  default: "rgba(255, 255, 255, 0.32)",
  outline: "color-mix(in srgb, var(--primary) 40%, transparent)",
  secondary: "color-mix(in srgb, var(--primary) 34%, transparent)",
  ghost: "color-mix(in srgb, var(--primary) 26%, transparent)",
};

type LiquidButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof liquidButtonVariants>;

function LiquidButton({
  className,
  variant = "default",
  size = "default",
  onClick,
  children,
  style,
  ...props
}: LiquidButtonProps) {
  const [filling, setFilling] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    // Force the keyframe to restart even on rapid re-clicks.
    setFilling(false);
    requestAnimationFrame(() => {
      setFilling(true);
      timer.current = setTimeout(() => setFilling(false), 820);
    });
  }, []);

  const liquidColor = LIQUID_COLOR[variant ?? "default"] ?? LIQUID_COLOR.default;

  return (
    <ButtonPrimitive
      data-slot="liquid-button"
      data-filling={filling ? "true" : "false"}
      className={cn(liquidButtonVariants({ variant, size, className }))}
      style={{ ...style, ["--liquid-color"]: liquidColor } as React.CSSProperties}
      onClick={(event) => {
        trigger();
        onClick?.(event);
      }}
      {...props}
    >
      <span aria-hidden className="liquid-fill" />
      <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
        {children}
      </span>
    </ButtonPrimitive>
  );
}

export { LiquidButton, liquidButtonVariants };
