"use client";

import { Check, Minus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Checkbox — accessible, controlled checkbox with a polished check-pop.
 * Built on a visually-hidden native input (robust, no extra deps) with a
 * styled box + Lucide icon. Supports an indeterminate (partial) state.
 */
interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  disabled,
  className,
  ...rest
}: CheckboxProps) {
  const active = checked || indeterminate;
  return (
    <span
      className={cn(
        "relative inline-flex size-4 shrink-0 items-center justify-center",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate && !checked;
        }}
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
        {...rest}
      />
      <span
        className={cn(
          "pointer-events-none flex size-4 items-center justify-center rounded-[5px] border transition-all duration-150 ease-out",
          "peer-focus-visible:ring-2 peer-focus-visible:ring-ring/60 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-background",
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 bg-transparent peer-hover:border-muted-foreground/70",
        )}
      >
        {checked ? (
          <Check className="size-3 stroke-[3] animate-in zoom-in-75 duration-150" />
        ) : indeterminate ? (
          <Minus className="size-3 stroke-[3]" />
        ) : null}
      </span>
    </span>
  );
}
