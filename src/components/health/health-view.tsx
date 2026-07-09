"use client";

import { motion } from "motion/react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Ring } from "@/components/ui/ring";
import { Sparkline } from "@/components/charts/sparkline";
import { Icon } from "@/components/ui/icon";
import { Stat } from "@/components/ui/stat";
import { relativeTime } from "@/lib/utils";
import type { HealthSummary } from "@/lib/types";

const activityIcon: Record<string, string> = {
  cycling: "Bike",
  running: "Footprints",
  strength: "Activity",
  walking: "Footprints",
};

function formatSleep(minutes: number | null, hours: number | null): string {
  const total = minutes ?? (hours != null ? Math.round(hours * 60) : null);
  if (total == null) return "—";
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

export function HealthView({ health }: { health: HealthSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {/* rings */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <Icon name="Flame" size={16} className="text-[#e5484d]" />
          </CardHeader>
          <div className="flex items-center justify-around gap-2">
            <Ring value={health.steps} max={health.stepsGoal} accent="#0a7cff" size={104}>
              <div>
                <div className="text-base font-semibold tabular-nums">
                  {health.steps.toLocaleString()}
                </div>
                <div className="text-[10px] text-muted">steps</div>
              </div>
            </Ring>
            <Ring value={health.bodyBattery ?? 0} max={100} accent="#17a673" size={104}>
              <div>
                <div className="text-lg font-semibold tabular-nums">{health.bodyBattery ?? "—"}</div>
                <div className="text-[10px] text-muted">battery</div>
              </div>
            </Ring>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-[var(--radius-sm)] nu-inset px-3 py-2.5">
              <div className="text-[11px] text-muted">Calories</div>
              <div className="text-sm font-semibold tabular-nums">
                {health.caloriesBurned?.toLocaleString() ?? "—"}
              </div>
            </div>
            <div className="rounded-[var(--radius-sm)] nu-inset px-3 py-2.5">
              <div className="text-[11px] text-muted">VO₂ max</div>
              <div className="text-sm font-semibold tabular-nums">{health.vo2Max ?? "—"}</div>
            </div>
          </div>
        </Card>

        {/* key stats */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <Stat
            label="Sleep"
            value={formatSleep(health.sleepMinutes, health.sleepHours)}
            sub={health.sleepScore ? `Score ${health.sleepScore}/100` : undefined}
            icon="Moon"
            accent="#7c3aed"
          />
          <Stat
            label="Resting HR"
            value={health.restingHeartRate ?? "—"}
            sub="bpm"
            icon="HeartPulse"
            accent="#e5484d"
            trend={{ dir: "down", value: "2", good: true }}
          />
          <Stat
            label="Stress"
            value={health.stress ?? "—"}
            sub="avg today"
            icon="Activity"
            accent="#d99400"
          />
          <Stat
            label="Intensity min"
            value={health.weeklyIntensityMinutes ?? "—"}
            sub="this week"
            icon="Timer"
            accent="#0a7cff"
          />
        </div>
      </div>

      {/* trends */}
      <div className="grid gap-4 md:grid-cols-3">
        <TrendCard title="Steps" accent="#0a7cff" data={health.trend.map((t) => t.steps)} labels={health.trend.map((t) => t.day)} />
        <TrendCard title="Sleep" accent="#7c3aed" data={health.trend.map((t) => t.sleep)} labels={health.trend.map((t) => t.day)} formatValue={formatSleepFromHours} />
        <TrendCard title="Resting HR" accent="#e5484d" data={health.trend.map((t) => t.rhr)} labels={health.trend.map((t) => t.day)} />
      </div>

      {/* activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent activities</CardTitle>
          <Icon name="Bike" size={16} className="text-muted" />
        </CardHeader>
        <div className="space-y-2">
          {health.activities.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] nu-flat px-3 py-2.5"
            >
              <span className="grid h-9 w-9 place-items-center rounded-lg nu-raised-sm text-[#0a7cff]">
                <Icon name={activityIcon[a.type] ?? "Activity"} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{a.name}</div>
                <div className="text-[11px] text-muted">{relativeTime(a.date)}</div>
              </div>
              <div className="flex items-center gap-4 text-xs tabular-nums text-muted">
                {a.distanceKm != null && <span>{a.distanceKm} km</span>}
                {a.durationMin != null && <span>{a.durationMin} min</span>}
                {a.avgHr != null && <span className="text-[#e5484d]">{a.avgHr} bpm</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function formatSleepFromHours(hours: number): string {
  const total = Math.round(hours * 60);
  return `${Math.floor(total / 60)}h ${total % 60}m`;
}

function TrendCard({
  title,
  accent,
  data,
  labels,
  formatValue,
}: {
  title: string;
  accent: string;
  data: number[];
  labels: string[];
  formatValue?: (value: number) => string;
}) {
  const latest = data[data.length - 1];
  const display = formatValue ? formatValue(latest) : Number.isInteger(latest) ? latest.toLocaleString() : latest;
  return (
    <Card>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-2">{title}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
          {display}
        </span>
      </div>
      <div className="mt-3">
        <Sparkline data={data} accent={accent} width={220} height={48} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-2">
        <span>{labels[0]}</span>
        <span>{labels[labels.length - 1]}</span>
      </div>
    </Card>
  );
}
