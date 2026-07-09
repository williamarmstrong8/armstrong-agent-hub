"use client";

import { motion } from "motion/react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Bars } from "@/components/charts/bars";
import { Icon } from "@/components/ui/icon";
import { Badge, Dot } from "@/components/ui/badge";
import { relativeTime } from "@/lib/utils";
import type { WorkSummary } from "@/lib/types";

function stateTone(state: string) {
  const s = state.toUpperCase();
  if (s === "READY") return "success" as const;
  if (s === "ERROR" || s === "CANCELED") return "danger" as const;
  if (s === "BUILDING" || s === "QUEUED" || s === "INITIALIZING") return "warning" as const;
  return "neutral" as const;
}

export function WorkView({ work }: { work: WorkSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Deploys today" value={work.deploymentsToday} icon="Rocket" accent="#111318" />
        <Stat label="This week" value={work.deploymentsWeek} icon="GitBranch" accent="#0a7cff" />
        <Stat
          label="Ready rate"
          value={`${Math.round(work.readyRate * 100)}%`}
          icon="CheckCircle2"
          accent="#17a673"
          trend={{ dir: "up", value: "3%", good: true }}
        />
        <Stat
          label="Projects"
          value={work.projects}
          icon="Triangle"
          accent="#7c3aed"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>Deploy velocity</CardTitle>
            <span className="text-[11px] text-muted">last 7 days</span>
          </CardHeader>
          <div className="pt-4">
            <Bars
              data={work.deployTrend.map((d) => ({ label: d.day, value: d.count }))}
              accent="#111318"
              height={120}
            />
          </div>
          {work.avgBuildSeconds != null && (
            <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-sm)] nu-inset px-3 py-2 text-xs text-muted">
              <Icon name="Timer" size={14} /> Avg build{" "}
              <span className="font-semibold text-foreground">{work.avgBuildSeconds}s</span>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent deployments</CardTitle>
            <Icon name="Rocket" size={16} className="text-muted" />
          </CardHeader>
          <div className="space-y-2">
            {work.recentDeployments.map((d, i) => (
              <motion.a
                key={d.id}
                href={d.url ?? "#"}
                target={d.url ? "_blank" : undefined}
                rel="noreferrer"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-[var(--radius-sm)] nu-flat px-3 py-2.5 nu-pressable"
              >
                <Dot tone={stateTone(d.state)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{d.project}</span>
                    <Badge inset tone={d.target === "production" ? "info" : "neutral"} className="shrink-0">
                      {d.target}
                    </Badge>
                  </div>
                  <div className="truncate text-[11px] text-muted">
                    {d.commitMessage ?? "—"} {d.branch ? `· ${d.branch}` : ""}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-[11px] font-medium" style={{ color: `var(--${stateTone(d.state)})` }}>
                    {d.state}
                  </div>
                  <div className="text-[10px] text-muted-2">{relativeTime(d.createdAt)}</div>
                </div>
              </motion.a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
