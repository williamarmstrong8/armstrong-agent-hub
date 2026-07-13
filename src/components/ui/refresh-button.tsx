"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./icon";
import { cn } from "@/lib/utils";

/**
 * Fires a server action that repopulates a data source, then refreshes the
 * route so the freshly-stored data renders. Shows a transient status message.
 */
export function RefreshButton<T>({
  action,
  label = "Refresh",
  accent = "#0a7cff",
  formatResult,
  className,
}: {
  action: () => Promise<T>;
  label?: string;
  accent?: string;
  formatResult?: (result: T) => string;
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 4000);
    return () => clearTimeout(t);
  }, [status]);

  function handleClick() {
    setStatus(null);
    startTransition(async () => {
      try {
        const result = await action();
        router.refresh();
        setStatus(formatResult ? formatResult(result) : "Updated");
      } catch {
        setStatus("Refresh failed");
      }
    });
  }

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {status && <span className="text-[11px] text-muted">{status}</span>}
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium nu-raised-sm nu-pressable text-foreground transition-opacity disabled:opacity-60"
        )}
      >
        <Icon
          name="RefreshCw"
          size={13}
          className={cn(isPending && "animate-spin")}
          strokeWidth={2}
        />
        <span style={{ color: accent }}>{isPending ? "Refreshing…" : label}</span>
      </button>
    </div>
  );
}
