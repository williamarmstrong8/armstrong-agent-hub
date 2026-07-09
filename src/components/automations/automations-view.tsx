"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Badge, Dot } from "@/components/ui/badge";
import { cn, relativeTime } from "@/lib/utils";
import type { Automation } from "@/lib/types";

type StepState = { label: string; status: "pending" | "running" | "done" | "failed"; detail?: string };

export function AutomationsView({ automations }: { automations: Automation[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {automations.map((a, i) => (
        <AutomationCard key={a.id} automation={a} index={i} />
      ))}
    </div>
  );
}

function AutomationCard({ automation, index }: { automation: Automation; index: number }) {
  const [steps, setSteps] = useState<StepState[]>([]);
  const [running, setRunning] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [ranAt, setRanAt] = useState<string | null>(automation.lastRun);

  async function run() {
    setRunning(true);
    setSummary(null);
    const initial: StepState[] = automation.steps.map((label) => ({ label, status: "pending" }));
    setSteps(initial);

    // animate steps as "running" while the request is in flight
    let i = 0;
    const timer = setInterval(() => {
      setSteps((prev) => {
        const next = [...prev];
        if (i < next.length) {
          if (i > 0) next[i - 1].status = "done";
          next[i].status = "running";
          i++;
        }
        return next;
      });
    }, 420);

    try {
      const res = await fetch("/api/automations/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: automation.id }),
      });
      const data = (await res.json()) as { steps: StepState[]; summary: string };
      clearInterval(timer);
      setSteps(data.steps.map((s) => ({ ...s, status: s.status })));
      setSummary(data.summary);
      setRanAt(new Date().toISOString());
    } catch {
      clearInterval(timer);
      setSteps((prev) => prev.map((s) => ({ ...s, status: s.status === "pending" ? "failed" : s.status })));
      setSummary("Run failed. Check the console.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="grid h-11 w-11 place-items-center rounded-[var(--radius)] nu-raised-sm"
              style={{ color: automation.accent }}
            >
              <Icon name={automation.icon} size={20} />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight">{automation.name}</h3>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted">
                <Icon name="Clock" size={11} /> {automation.trigger}
              </div>
            </div>
          </div>
          <Badge inset tone={automation.lastStatus === "success" ? "success" : automation.lastStatus === "failed" ? "danger" : "neutral"}>
            <Dot tone={automation.lastStatus === "success" ? "success" : automation.lastStatus === "failed" ? "danger" : "warning"} />
            {ranAt ? relativeTime(ranAt) : "never"}
          </Badge>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted">{automation.description}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {automation.connects.map((c) => (
            <span key={c} className="rounded-full nu-inset-sm px-2 py-0.5 text-[10px] text-muted-2">
              {c}
            </span>
          ))}
        </div>

        <AnimatePresence>
          {steps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-1.5 overflow-hidden"
            >
              {steps.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 rounded-lg nu-inset-sm px-2.5 py-1.5">
                  <StepGlyph status={s.status} />
                  <span className={cn("flex-1 text-[11px]", s.status === "done" ? "text-foreground" : "text-muted")}>
                    {s.label}
                  </span>
                  {s.detail && <span className="text-[10px] text-muted-2">{s.detail}</span>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-xs leading-relaxed nu-flat"
              style={{ borderLeft: `2px solid ${automation.accent}` }}
            >
              {summary}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 flex-1" />
        <Button
          onClick={run}
          disabled={running}
          variant="accent"
          size="sm"
          className="mt-4 w-full"
        >
          {running ? (
            <>
              <Icon name="RefreshCw" size={14} className="animate-spin" /> Running…
            </>
          ) : (
            <>
              <Icon name="Play" size={14} /> Run now
            </>
          )}
        </Button>
      </Card>
    </motion.div>
  );
}

function StepGlyph({ status }: { status: StepState["status"] }) {
  if (status === "done")
    return <Icon name="CheckCircle2" size={14} className="text-[var(--success)]" />;
  if (status === "running")
    return <Icon name="RefreshCw" size={14} className="animate-spin text-[var(--info)]" />;
  if (status === "failed") return <span className="h-3 w-3 rounded-full bg-[var(--danger)]" />;
  return <span className="h-3 w-3 rounded-full nu-inset-sm" />;
}
