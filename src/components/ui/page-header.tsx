import { Icon } from "@/components/ui/icon";
import { Badge, Dot } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";

export function PageHeader({
  icon,
  title,
  subtitle,
  accent = "#111318",
  live,
  source,
  updatedAt,
  action,
}: {
  icon: string;
  title: string;
  subtitle: string;
  accent?: string;
  live?: boolean;
  source?: string;
  updatedAt?: string;
  action?: React.ReactNode;
}) {
  const label = live
    ? updatedAt
      ? `Updated ${relativeTime(updatedAt)}`
      : "Live"
    : "Sample";
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <div
          className="grid h-12 w-12 place-items-center rounded-[var(--radius)] nu-raised-sm"
          style={{ color: accent }}
        >
          <Icon name={icon} size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {source && (
          <Badge inset tone={live ? "success" : "neutral"}>
            <Dot tone={live ? "success" : "warning"} />
            {label} · {source}
          </Badge>
        )}
        {action}
      </div>
    </header>
  );
}
