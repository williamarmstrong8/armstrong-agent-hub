"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Ring } from "@/components/ui/ring";
import { Sparkline } from "@/components/charts/sparkline";
import { Icon } from "@/components/ui/icon";
import { Badge, Dot } from "@/components/ui/badge";
import { MODULES, OWNER } from "@/lib/config";
import { cn, formatCurrency } from "@/lib/utils";

type NewListing = {
  id: string;
  address: string;
  unit: string | null;
  price: number;
  bedrooms: number;
  bathrooms: number;
  neighborhood: string;
  imageUrl: string | null;
  url: string;
  passesGeo: boolean;
};

type Summary = {
  apartments: {
    live: boolean;
    qualifying: number;
    filtered: number;
    top: { address: string; price: number; bedrooms: number } | null;
  };
  health: {
    live: boolean;
    steps: number;
    stepsGoal: number;
    sleepHours: number | null;
    sleepScore: number | null;
    bodyBattery: number | null;
    restingHeartRate: number | null;
    trend: number[];
  };
  work: {
    live: boolean;
    deploymentsToday: number;
    deploymentsWeek: number;
    readyRate: number;
    trend: number[];
  };
};

const fade = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function DashboardView({
  summary,
  greeting,
  today,
  newToday = [],
}: {
  summary: Summary;
  greeting: string;
  today: string;
  newToday?: NewListing[];
}) {
  const insight = buildInsight(summary);

  return (
    <div className="space-y-6">
      {/* hero */}
      <motion.div custom={0} variants={fade} initial="hidden" animate="show">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-muted">{today}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {greeting}, {OWNER.name}.
            </h1>
            <p className="mt-1 text-sm text-muted">Everything, connected. Here&rsquo;s your day at a glance.</p>
          </div>
          <Link
            href="/assistant"
            className="flex items-center gap-2 rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium text-accent-fg nu-pressable [background:linear-gradient(145deg,#20242c,#0c0e12)]"
          >
            <Icon name="Sparkles" size={16} /> Ask the assistant
          </Link>
        </div>
      </motion.div>

      {/* connection insight */}
      <motion.div custom={1} variants={fade} initial="hidden" animate="show">
        <Card className="relative overflow-hidden" variant="raised">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius)] nu-inset text-[#7c3aed]">
              <Icon name="Zap" size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-2">
                  Connected insight
                </span>
                <Badge inset tone="info">
                  cross-life
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">{insight}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* new apartments found today */}
      {newToday.length > 0 && (
        <motion.div custom={1.5} variants={fade} initial="hidden" animate="show">
          <Card variant="raised">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] nu-raised-sm text-[#0a7cff]">
                  <Icon name="Sparkle" size={17} />
                </span>
                <div>
                  <div className="text-sm font-semibold tracking-tight">New today</div>
                  <div className="text-[11px] text-muted">
                    {newToday.length} listing{newToday.length === 1 ? "" : "s"} first seen today
                  </div>
                </div>
              </div>
              <Link href="/apartments" className="text-xs font-medium text-[#0a7cff] hover:underline">
                View all
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {newToday.slice(0, 6).map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex gap-3 rounded-[var(--radius)] nu-inset nu-pressable p-2.5"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[var(--radius-sm)]">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt={l.address} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full w-full place-items-center nu-raised-sm">
                        <Icon name="Building2" size={18} className="text-muted-2" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-xs font-semibold">{l.address}</span>
                      {!l.passesGeo && <Badge tone="danger">Excluded</Badge>}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted">
                      {l.bedrooms} bd · {l.bathrooms} ba · {l.neighborhood}
                    </div>
                    <div className="mt-1 text-sm font-semibold tabular-nums text-[#0a7cff]">
                      {formatCurrency(l.price)}
                      <span className="text-[10px] font-normal text-muted-2"> /mo</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* module tiles */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* apartments */}
        <motion.div custom={2} variants={fade} initial="hidden" animate="show">
          <TileLink href="/apartments" title="Home Search" icon="Building2" accent="#0a7cff" live={summary.apartments.live} source="StreetEasy">
            <div className="flex items-end gap-4">
              <div>
                <div className="text-3xl font-semibold tabular-nums text-[#0a7cff]">
                  {summary.apartments.qualifying}
                </div>
                <div className="text-xs text-muted">qualifying listings</div>
              </div>
              <div className="mb-1 text-xs text-muted">
                {summary.apartments.filtered} filtered by your rules
              </div>
            </div>
            {summary.apartments.top && (
              <div className="mt-3 rounded-[var(--radius-sm)] nu-inset px-3 py-2">
                <div className="text-[11px] text-muted">Cheapest match</div>
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium">{summary.apartments.top.address}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {formatCurrency(summary.apartments.top.price)}
                  </span>
                </div>
              </div>
            )}
          </TileLink>
        </motion.div>

        {/* health */}
        <motion.div custom={3} variants={fade} initial="hidden" animate="show">
          <TileLink href="/health" title="Health" icon="HeartPulse" accent="#e5484d" live={summary.health.live} source="Garmin">
            <div className="flex items-center gap-4">
              <Ring value={summary.health.steps} max={summary.health.stepsGoal} accent="#e5484d" size={76} stroke={8}>
                <div className="text-xs font-semibold tabular-nums">
                  {Math.round((summary.health.steps / summary.health.stepsGoal) * 100)}%
                </div>
              </Ring>
              <div className="space-y-1 text-xs">
                <Row label="Steps" value={summary.health.steps.toLocaleString()} />
                <Row label="Sleep" value={summary.health.sleepHours ? `${summary.health.sleepHours}h` : "—"} />
                <Row label="Battery" value={summary.health.bodyBattery ?? "—"} />
              </div>
            </div>
          </TileLink>
        </motion.div>

        {/* work */}
        <motion.div custom={4} variants={fade} initial="hidden" animate="show">
          <TileLink href="/work" title="Work" icon="Triangle" accent="#111318" live={summary.work.live} source="Vercel">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold tabular-nums">{summary.work.deploymentsToday}</div>
                <div className="text-xs text-muted">deploys today</div>
              </div>
              <Sparkline data={summary.work.trend} accent="#111318" width={120} height={40} />
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-muted">
              <span>{summary.work.deploymentsWeek} this week</span>
              <span className="text-muted-2">·</span>
              <span className="text-[var(--success)]">{Math.round(summary.work.readyRate * 100)}% ready</span>
            </div>
          </TileLink>
        </motion.div>
      </div>

      {/* quick nav */}
      <motion.div custom={5} variants={fade} initial="hidden" animate="show">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {MODULES.filter((m) => m.key !== "dashboard").map((m) => (
            <Link
              key={m.key}
              href={m.href}
              className="group flex flex-col items-start gap-2 rounded-[var(--radius)] nu-raised nu-pressable p-3.5"
            >
              <span
                className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] nu-inset-sm transition-transform group-hover:scale-105"
                style={{ color: m.accent }}
              >
                <Icon name={m.icon} size={17} />
              </span>
              <span className="text-xs font-semibold">{m.title}</span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function TileLink({
  href,
  title,
  icon,
  accent,
  live,
  source,
  children,
}: {
  href: string;
  title: string;
  icon: string;
  accent: string;
  live: boolean;
  source: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="block h-full">
      <Card className="h-full transition-transform hover:-translate-y-0.5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] nu-raised-sm" style={{ color: accent }}>
              <Icon name={icon} size={17} />
            </span>
            <span className="text-sm font-semibold tracking-tight">{title}</span>
          </div>
          <Badge inset tone={live ? "success" : "neutral"} className="shrink-0">
            <Dot tone={live ? "success" : "warning"} />
            {live ? "Live" : "Sample"}
          </Badge>
        </div>
        {children}
      </Card>
    </Link>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-muted-2">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function buildInsight(s: Summary): string {
  const parts: string[] = [];
  const battery = s.health.bodyBattery ?? 100;
  const sleep = s.health.sleepScore ?? 100;
  const load = s.work.deploymentsToday;

  if (battery < 45 || sleep < 65) {
    parts.push(
      `Recovery is on the low side (battery ${s.health.bodyBattery}, sleep score ${s.health.sleepScore}) while you've got ${load} deploys queued today — consider protecting a focus block and keeping training easy.`
    );
  } else {
    parts.push(
      `Recovery looks good (battery ${s.health.bodyBattery}, sleep score ${s.health.sleepScore}) and you're moving well — a solid day to ship (${load} deploys queued) and train.`
    );
  }

  if (s.apartments.top) {
    parts.push(
      `On the home front, ${s.apartments.qualifying} listings clear your Ave B / Houston rules — cheapest is ${s.apartments.top.address} at ${formatCurrency(s.apartments.top.price)}/mo.`
    );
  } else {
    parts.push(`No apartments currently pass your geo rules (${s.apartments.filtered} were excluded).`);
  }

  return parts.join(" ");
}
