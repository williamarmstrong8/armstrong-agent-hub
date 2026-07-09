import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  icon,
  accent = "#111318",
  trend,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  icon?: string;
  accent?: string;
  trend?: { dir: "up" | "down"; value: string; good?: boolean };
  className?: string;
}) {
  return (
    <div className={cn("rounded-[var(--radius)] nu-raised p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-2">{label}</span>
        {icon && (
          <span className="grid h-7 w-7 place-items-center rounded-lg nu-inset-sm" style={{ color: accent }}>
            <Icon name={icon} size={14} />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
        {trend && (
          <span
            className="mb-1 inline-flex items-center gap-0.5 text-[11px] font-medium"
            style={{ color: trend.good === false ? "var(--danger)" : "var(--success)" }}
          >
            <Icon name={trend.dir === "up" ? "TrendingUp" : "TrendingDown"} size={12} />
            {trend.value}
          </span>
        )}
      </div>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}
