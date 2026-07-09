"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export function OutreachScript({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback for older browsers / non-secure contexts
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Card variant="raised">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] nu-raised-sm text-[#0a7cff]">
            <Icon name="MessageSquare" size={17} />
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight">Outreach script</div>
            <div className="text-[11px] text-muted">Paste into StreetEasy or broker messages</div>
          </div>
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-[var(--radius-sm)] px-3 py-1.5 text-xs font-medium nu-pressable",
            copied ? "nu-inset text-[var(--success)]" : "nu-raised-sm text-muted hover:text-foreground"
          )}
        >
          <Icon name={copied ? "CheckCircle2" : "Copy"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="whitespace-pre-wrap rounded-[var(--radius-sm)] nu-inset px-4 py-3 font-sans text-sm leading-relaxed text-foreground">
        {text}
      </pre>
    </Card>
  );
}
