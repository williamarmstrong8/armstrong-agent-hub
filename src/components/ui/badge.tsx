import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneMap: Record<Tone, string> = {
  neutral: "text-muted",
  success: "text-[var(--success)]",
  warning: "text-[var(--warning)]",
  danger: "text-[var(--danger)]",
  info: "text-[var(--info)]",
};

export function Badge({
  className,
  tone = "neutral",
  inset,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; inset?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
        inset ? "nu-inset-sm" : "nu-raised-sm",
        toneMap[tone],
        className
      )}
      {...props}
    />
  );
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  const color =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "danger"
          ? "var(--danger)"
          : tone === "info"
            ? "var(--info)"
            : "var(--muted-2)";
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
    />
  );
}
